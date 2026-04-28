import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function kategoriBazliSayilar(kategori: string): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('ilce_tesisler')
      .select('ilce_id')
      .eq('kategori', kategori)
      .range(offset, offset + 999)
    if (!data || data.length === 0) break
    for (const r of data) {
      map.set(r.ilce_id, (map.get(r.ilce_id) || 0) + 1)
    }
    if (data.length < 1000) break
    offset += 1000
  }
  return map
}

function logNormalize(sayi: number, maks: number): number {
  if (maks <= 0 || sayi <= 0) return 0
  return Math.round((Math.log(sayi + 1) / Math.log(maks + 1)) * 100)
}

async function main() {
  console.log('Skor normalizasyonu başlıyor...\n')

  const kategoriler = ['ulasim', 'saglik', 'egitim', 'imkanlar'] as const
  const skorMap: Record<string, Record<string, number>> = {}

  for (const kat of kategoriler) {
    console.log(`${kat} sayılıyor...`)
    const sayilar = await kategoriBazliSayilar(kat)
    const maks = Math.max(...sayilar.values(), 1)
    console.log(`  Maks: ${maks} (${sayilar.size} ilçe)`)

    for (const [ilceId, sayi] of sayilar) {
      if (!skorMap[ilceId]) skorMap[ilceId] = {}
      skorMap[ilceId][`${kat}_skoru`] = logNormalize(sayi, maks)
    }
  }

  // Her ilçeyi güncelle
  console.log('\nSkorlar güncelleniyor...')
  let guncellenen = 0

  for (const [ilceId, skorlar] of Object.entries(skorMap)) {
    // Genel skoru hesapla (mevcut deprem skoru ile birleştir)
    const { data: mevcut } = await supabase
      .from('ilceler')
      .select('deprem_skoru, yasam_maliyeti_skoru, isim')
      .eq('id', ilceId)
      .single()

    const deprem      = mevcut?.deprem_skoru      || 0
    const yasam       = mevcut?.yasam_maliyeti_skoru || 0
    const ulasim      = skorlar.ulasim_skoru      || 0
    const saglik      = skorlar.saglik_skoru      || 0
    const egitim      = skorlar.egitim_skoru      || 0
    const imkanlar    = skorlar.imkanlar_skoru    || 0

    const genelSkor = Math.round(
      ulasim   * 0.25 +
      saglik   * 0.20 +
      egitim   * 0.20 +
      imkanlar * 0.20 +
      deprem   * 0.15
    )

    const { error } = await supabase
      .from('ilceler')
      .update({ ...skorlar, genel_skor: genelSkor })
      .eq('id', ilceId)

    if (!error) {
      console.log(`  ✓ ${mevcut?.isim?.padEnd(16)} | Ulaşım:${ulasim} Sağlık:${saglik} Eğitim:${egitim} İmkanlar:${imkanlar} Genel:${genelSkor}`)
      guncellenen++
    }
  }

  console.log(`\n✅ ${guncellenen} ilçe güncellendi`)

  // Son tablo
  const { data: ozet } = await supabase
    .from('ilceler')
    .select('isim, genel_skor, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru')
    .order('genel_skor', { ascending: false })

  console.log('\nFinal sıralama (Top 15):')
  ozet?.slice(0, 15).forEach((i, idx) => {
    console.log(
      `  ${String(idx+1).padStart(2)}. ${i.isim.padEnd(16)} | ` +
      `Genel:${String(i.genel_skor).padStart(3)} | ` +
      `U:${String(i.ulasim_skoru).padStart(3)} ` +
      `S:${String(i.saglik_skoru).padStart(3)} ` +
      `E:${String(i.egitim_skoru).padStart(3)} ` +
      `İ:${String(i.imkanlar_skoru).padStart(3)}`
    )
  })
}

main().catch(console.error)
