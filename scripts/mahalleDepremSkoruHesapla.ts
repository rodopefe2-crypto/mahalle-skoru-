import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Windows-1254 düzeltme
function fixTr(s: string): string {
  return s.replace(/Ý/g,'İ').replace(/ý/g,'ı').replace(/Þ/g,'Ş').replace(/þ/g,'ş')
    .replace(/Ð/g,'Ğ').replace(/ð/g,'ğ')
}

function slugOlustur(s: string): string {
  return s.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/i̇/g,'i').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
}

// İBB ilçe ismi → slug
function ibbIlceSlug(ibbIsim: string): string {
  const isim = fixTr(ibbIsim).toLowerCase()
  const map: Record<string,string> = {
    'adalar':'adalar','arnavutköy':'arnavutkoy','ataşehir':'atasehir',
    'avcılar':'avcilar','bağcılar':'bagcilar','bahçelievler':'bahcelievler',
    'bakırköy':'bakirkoy','başakşehir':'basaksehir','bayrampaşa':'bayrampasa',
    'beşiktaş':'besiktas','beykoz':'beykoz','beylikdüzü':'beylikduzu',
    'beyoğlu':'beyoglu','büyükçekmece':'buyukcekmece','çatalca':'catalca',
    'çekmeköy':'cekmekoy','esenler':'esenler','esenyurt':'esenyurt',
    'eyüpsultan':'eyupsultan','fatih':'fatih','gaziosmanpaşa':'gaziosmanpasa',
    'güngören':'gungoren','kağıthane':'kagithane','kadıköy':'kadikoy',
    'kartal':'kartal','küçükçekmece':'kucukcekmece','maltepe':'maltepe',
    'pendik':'pendik','sancaktepe':'sancaktepe','sarıyer':'sariyer',
    'şile':'sile','şişli':'sisli','sultanbeyli':'sultanbeyli',
    'sultangazi':'sultangazi','tuzla':'tuzla','ümraniye':'umraniye',
    'üsküdar':'uskudar','zeytinburnu':'zeytinburnu',
  }
  return map[isim] || slugOlustur(isim)
}

// İBB bina verisi yükle
async function ibbVerisiCek() {
  const url = 'https://data.ibb.gov.tr/api/3/action/datastore_search?resource_id=cef193d5-0bd2-4e8d-8a69-275c50288875&limit=2000'
  const res = await fetch(url, { headers: { 'User-Agent': 'MahalleSkoruApp/1.0' } })
  const data = await res.json()
  return (data?.result?.records || []) as any[]
}

async function main() {
  console.log('Mahalle deprem & genel skoru hesaplanıyor...')
  console.log('Kaynak: İBB Açık Veri bina yaşı + ilçe deprem skoru\n')

  // İBB verisi
  const ibbKayitlar = await ibbVerisiCek()
  console.log(`İBB'den ${ibbKayitlar.length} mahalle bina kaydı alındı`)

  // İBB'yi slug bazlı hashle: ilceSlug-mahalleSlug → pre1980Pct
  const ibbMap = new Map<string, { pre1980Pct: number; toplamBina: number }>()
  for (const k of ibbKayitlar) {
    const ilceSlug = ibbIlceSlug(k.ilce_adi || '')
    const mahIsim  = fixTr(k.mahalle_adi || '').replace(/\s*MAHALLESİ\s*$/i,'').trim()
    const key      = ilceSlug + '|' + slugOlustur(mahIsim)
    const b1980    = k['1980_oncesi']    || 0
    const b2000    = k['1980-2000_arasi']|| 0
    const b2000p   = k['2000_sonrasi']   || 0
    const toplam   = b1980 + b2000 + b2000p
    ibbMap.set(key, {
      pre1980Pct: toplam > 0 ? Math.round(b1980 / toplam * 100) : 0,
      toplamBina: toplam,
    })
  }

  // Tüm mahalleler
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, slug, ilce_id')
    .order('isim')

  if (!mahalleler?.length) { console.error('Mahalle verisi yok'); return }

  // Tüm ilçeler — skorları al
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug, deprem_skoru, genel_skor, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, yesil_alan_skoru, kultur_skoru, nufus_yogunlugu_skoru')

  const ilceById = new Map(ilceler!.map(i => [i.id, i]))

  // İstanbul geneli pre1980 max (Fatih %73)
  const MAX_PRE1980 = 73
  const MIN_PRE1980 = 1

  let eslesme = 0, eslesemedi = 0, guncellenen = 0

  // Mahalle slug formatı: {ilceSlug}-{mahalleSlug}
  for (const mah of mahalleler) {
    const ilce = ilceById.get(mah.ilce_id)
    if (!ilce) continue

    // Slug'dan ilçe prefix'ini çıkar ve mahalle slug'ını bul
    const ilceSlug  = ilce.slug
    const mahSlug   = mah.slug.startsWith(ilceSlug + '-')
      ? mah.slug.slice(ilceSlug.length + 1)
      : slugOlustur(mah.isim)

    const ibbKey  = ilceSlug + '|' + mahSlug
    const ibbVeri = ibbMap.get(ibbKey)

    // ── DEPREM SKORU ─────────────────────────────
    let depremSkoru: number

    if (ibbVeri) {
      eslesme++
      const pre1980 = ibbVeri.pre1980Pct

      // pre1980 yüzdesi → mahalle risk faktörü (0-100 arası)
      const pre1980Risk = Math.max(0, Math.min(100,
        ((pre1980 - MIN_PRE1980) / (MAX_PRE1980 - MIN_PRE1980)) * 100
      ))

      // İlçe bazında deprem skoru (zemin + hasar)
      const ilceDepremSkoru = ilce.deprem_skoru || 50

      // Mahalle skoru = ilçe skoru × (1 - pre1980_ağırlık)
      // pre1980 %0 → ilçe skorunun +10 yukarısı
      // pre1980 %73 → ilçe skorunun -20 aşağısı
      const mahaleAyar  = Math.round(15 - (pre1980Risk / 100) * 30)
      depremSkoru = Math.max(5, Math.min(95, ilceDepremSkoru + mahaleAyar))
    } else {
      eslesemedi++
      // Eşleşme yok — ilçe skorunu kullan
      depremSkoru = ilce.deprem_skoru || 50
    }

    // ── GENEL SKOR ───────────────────────────────
    // İlçe skorlarını al, deprem mahalle bazlı düzelt
    const genel = Math.round(
      (ilce.ulasim_skoru         || 0) * 0.22 +
      (ilce.saglik_skoru         || 0) * 0.17 +
      (ilce.egitim_skoru         || 0) * 0.17 +
      (ilce.imkanlar_skoru       || 0) * 0.13 +
      (ilce.yesil_alan_skoru     || 0) * 0.09 +
      (ilce.kultur_skoru         || 0) * 0.05 +
      depremSkoru                       * 0.10 +
      (ilce.nufus_yogunlugu_skoru|| 0) * 0.07
    )

    const { error } = await supabase
      .from('mahalleler')
      .update({
        ulasim_skoru:         ilce.ulasim_skoru   || 0,
        saglik_skoru:         ilce.saglik_skoru   || 0,
        egitim_skoru:         ilce.egitim_skoru   || 0,
        imkanlar_skoru:       ilce.imkanlar_skoru || 0,
        deprem_skoru:         depremSkoru,
        genel_skor:           genel,
      })
      .eq('id', mah.id)

    if (error) {
      console.error(`✗ ${mah.isim}: ${error.message}`)
    } else {
      guncellenen++
      if (guncellenen % 100 === 0) process.stdout.write(`\n  ${guncellenen}/${mahalleler.length}`)
      else process.stdout.write('.')
    }
  }

  console.log(`\n\n✅ Tamamlandı!`)
  console.log(`  İBB eşleşen: ${eslesme}`)
  console.log(`  İBB eşleşmeyen (ilçe skoru kullanıldı): ${eslesemedi}`)
  console.log(`  Güncellenen mahalle: ${guncellenen}`)

  // Sıralama örneği
  const { data: top10 } = await supabase
    .from('mahalleler')
    .select('isim, slug, deprem_skoru, genel_skor, ilce_id')
    .order('genel_skor', { ascending: false })
    .limit(10)

  console.log('\n── Genel Skor TOP 10 ──────────────────')
  top10?.forEach((m, i) => {
    console.log(`  ${String(i+1).padStart(2)}. ${m.isim.padEnd(20)} deprem:${m.deprem_skoru}  genel:${m.genel_skor}`)
  })

  const { data: bot5 } = await supabase
    .from('mahalleler')
    .select('isim, deprem_skoru, genel_skor')
    .order('deprem_skoru', { ascending: true })
    .limit(5)

  console.log('\n── En Riskli 5 Mahalle (deprem) ───────')
  bot5?.forEach((m, i) => {
    console.log(`  ${i+1}. ${m.isim.padEnd(20)} deprem:${m.deprem_skoru}`)
  })
}

main().catch(console.error)
