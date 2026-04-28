import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Encoding düzeltme (Windows-1254 → UTF-8)
function fixEncoding(s: string): string {
  if (!s) return s
  const map: Record<string, string> = {
    'Ý': 'İ', 'ý': 'ı', 'Þ': 'Ş', 'þ': 'ş',
    'Ð': 'Ğ', 'ð': 'ğ',
  }
  return s.replace(/[ÝýÞþÐð]/g, c => map[c] || c)
}

function slugOlustur(isim: string): string {
  return isim.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/i̇/g, 'i').replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Nominatim koordinat
async function koordinatAl(mahalle: string, ilce: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${mahalle} mahallesi, ${ilce}, İstanbul, Türkiye`)
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=tr`
    const res = await fetch(url, { headers: { 'User-Agent': 'MahalleSkoruApp/1.0' } })
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    return null
  } catch { return null }
}

// İBB Açık Veri API — mahalle + bina yaşı verisi
async function ibbVerisiCek(): Promise<any[]> {
  const url = 'https://data.ibb.gov.tr/api/3/action/datastore_search?resource_id=cef193d5-0bd2-4e8d-8a69-275c50288875&limit=2000'
  const res = await fetch(url, { headers: { 'User-Agent': 'MahalleSkoruApp/1.0' } })
  const data = await res.json()
  return data?.result?.records || []
}

// Windows-1254 karakter düzeltme
function fixTr(s: string): string {
  return s.replace(/Ý/g,'İ').replace(/ý/g,'ı').replace(/Þ/g,'Ş').replace(/þ/g,'ş')
    .replace(/Ð/g,'Ğ').replace(/ð/g,'ğ')
}

async function main() {
  console.log('İstanbul mahalleleri yükleniyor...')
  console.log('Kaynak: İBB Açık Veri (Mahalle Bazlı Bina Sayıları)\n')

  // İBB verisini çek
  const ibbKayitlar = await ibbVerisiCek()
  console.log(`İBB'den ${ibbKayitlar.length} mahalle kaydı alındı\n`)

  // Supabase'den ilçeleri çek
  const { data: ilceler } = await supabase.from('ilceler').select('id, isim, slug')
  if (!ilceler?.length) { console.error('İlçe verisi alınamadı'); return }

  // İlçe slug → id eşleşme tablosu
  const ilceMap = new Map(ilceler.map(i => [i.slug, i]))

  // İBB ilçe ismi → slug eşleştirmesi
  function ibbIlceToSlug(ibbIsim: string): string {
    const isim = fixTr(ibbIsim).toLowerCase()
    const map: Record<string, string> = {
      'adalar': 'adalar', 'arnavutköy': 'arnavutkoy', 'ataşehir': 'atasehir',
      'avcılar': 'avcilar', 'bağcılar': 'bagcilar', 'bahçelievler': 'bahcelievler',
      'bakırköy': 'bakirkoy', 'başakşehir': 'basaksehir', 'bayrampaşa': 'bayrampasa',
      'beşiktaş': 'besiktas', 'beykoz': 'beykoz', 'beylikdüzü': 'beylikduzu',
      'beyoğlu': 'beyoglu', 'büyükçekmece': 'buyukcekmece', 'çatalca': 'catalca',
      'çekmeköy': 'cekmekoy', 'esenler': 'esenler', 'esenyurt': 'esenyurt',
      'eyüpsultan': 'eyupsultan', 'fatih': 'fatih', 'gaziosmanpaşa': 'gaziosmanpasa',
      'güngören': 'gungoren', 'kağıthane': 'kagithane', 'kadıköy': 'kadikoy',
      'kartal': 'kartal', 'küçükçekmece': 'kucukcekmece', 'maltepe': 'maltepe',
      'pendik': 'pendik', 'sancaktepe': 'sancaktepe', 'sarıyer': 'sariyer',
      'şile': 'sile', 'şişli': 'sisli', 'sultanbeyli': 'sultanbeyli',
      'sultangazi': 'sultangazi', 'tuzla': 'tuzla', 'ümraniye': 'umraniye',
      'üsküdar': 'uskudar', 'zeytinburnu': 'zeytinburnu',
    }
    return map[isim] || slugOlustur(isim)
  }

  const ISLE: string[] = [] // Tüm ilçeler
  let toplam = 0, atla = 0, hata = 0

  for (const kayit of ibbKayitlar) {
    const ilceIbb  = fixTr(kayit.ilce_adi || '')
    const ilceSlug = ibbIlceToSlug(ilceIbb)

    if (ISLE.length > 0 && !ISLE.includes(ilceSlug)) continue

    const ilce = ilceMap.get(ilceSlug)
    if (!ilce) { atla++; continue }

    const mahalleIsim = fixTr(kayit.mahalle_adi || '')
      .replace(/\s*MAHALLESİ\s*$/i, '').trim()

    // Bina yaşı verisi
    const bina1980  = kayit['1980_oncesi']       || 0
    const bina2000  = kayit['1980-2000_arasi']    || 0
    const bina2000p = kayit['2000_sonrasi']       || 0
    const binaTop   = bina1980 + bina2000 + bina2000p
    const pre1980Pct = binaTop > 0 ? Math.round(bina1980 / binaTop * 100) : null

    const slug = slugOlustur(ilce.isim) + '-' + slugOlustur(mahalleIsim)

    // Zaten var mı?
    const { data: mevcut } = await supabase
      .from('mahalleler').select('id').eq('slug', slug).maybeSingle()
    if (mevcut) { atla++; process.stdout.write('.'); continue }

    // Koordinat al (Nominatim — rate limit)
    await new Promise(r => setTimeout(r, 1100))
    const koord = await koordinatAl(mahalleIsim, ilce.isim)

    const { error } = await supabase.from('mahalleler').insert({
      isim:           mahalleIsim,
      slug,
      ilce_id:        ilce.id,
      koordinat_lat:  koord?.lat ?? null,
      koordinat_lng:  koord?.lng ?? null,
      genel_skor:     0,
      aciklama:       `${ilce.isim} ilçesine bağlı ${mahalleIsim} mahallesi.`,
    })

    if (error) {
      hata++
      console.error(`\n✗ ${mahalleIsim}: ${error.message}`)
    } else {
      toplam++
      process.stdout.write('✓')
    }
  }

  console.log(`\n\n✅ Tamamlandı!`)
  console.log(`  Eklenen: ${toplam}`)
  console.log(`  Atlanan (mevcut): ${atla}`)
  console.log(`  Hata: ${hata}`)

  const { count } = await supabase.from('mahalleler').select('*', { count: 'exact', head: true })
  console.log(`  Toplam DB: ${count}`)
}

main().catch(console.error)
