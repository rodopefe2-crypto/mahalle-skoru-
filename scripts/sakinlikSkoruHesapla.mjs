import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function percentile95(arr) {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil(sorted.length * 0.95) - 1
  return sorted[Math.max(0, idx)]
}

async function main() {
  console.log('Genişletilmiş sakinlik skoru hesaplanıyor...\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id, alan_km2, nufus, yesil_alan_skoru, guvenlik_skoru')
  if (!mahalleler) { console.error('Mahalle verisi alınamadı'); process.exit(1) }

  // Tüm ilgili tesisleri tek seferde çek
  const { data: tesisler } = await supabase
    .from('mahalle_tesisler')
    .select('mahalle_id, alt_kategori, kategori')
    .in('alt_kategori', [
      'bar', 'night_club', 'restaurant', 'cafe',
      'transit_station', 'bus_station', 'subway_station',
      'museum', 'art_gallery', 'movie_theater',
    ])

  // Mahalle başına kategorileri say
  const sayac = new Map()
  for (const t of (tesisler || [])) {
    if (!sayac.has(t.mahalle_id)) sayac.set(t.mahalle_id, {})
    const m = sayac.get(t.mahalle_id)
    m[t.alt_kategori] = (m[t.alt_kategori] || 0) + 1
  }

  // Ham değerleri hesapla
  const imkanlarHam  = new Map()
  const ulasimHam    = new Map()
  const kulturHam    = new Map()
  const yogunlukHam  = new Map()

  for (const m of mahalleler) {
    const s = sayac.get(m.id) || {}
    const alan = m.alan_km2 || 0

    const imk = ((s.bar || 0) * 3 + (s.night_club || 0) * 5 + (s.restaurant || 0) * 1 + (s.cafe || 0) * 1)
    const ulas = ((s.transit_station || 0) * 1 + (s.bus_station || 0) * 2 + (s.subway_station || 0) * 3)
    const kul  = ((s.museum || 0) * 3 + (s.art_gallery || 0) * 2 + (s.movie_theater || 0) * 2)

    imkanlarHam.set(m.id,  alan > 0 ? imk  / alan : 0)
    ulasimHam.set(m.id,    alan > 0 ? ulas / alan : 0)
    kulturHam.set(m.id,    alan > 0 ? kul  / alan : 0)
    yogunlukHam.set(m.id,  (alan > 0 && m.nufus > 0) ? m.nufus / alan : 0)
  }

  // Birleşik canlılık endeksi
  const canlilikHam = new Map()
  for (const m of mahalleler) {
    const c = imkanlarHam.get(m.id) * 0.40
            + ulasimHam.get(m.id)   * 0.35
            + kulturHam.get(m.id)   * 0.25
    canlilikHam.set(m.id, c)
  }

  // P95 cap (outlier bastırma)
  const canlilikP95  = percentile95([...canlilikHam.values()].filter(v => v > 0))
  const yogunlukP95  = percentile95([...yogunlukHam.values()].filter(v => v > 0))
  console.log(`Canlılık P95: ${canlilikP95.toFixed(2)} | Yoğunluk P95: ${yogunlukP95.toFixed(0)} kişi/km²`)

  // Ham birleşik skor (ters orantılı: düşük yoğunluk/canlılık → yüksek sakinlik)
  const hamSkorlar = new Map()
  for (const m of mahalleler) {
    const y = Math.min(yogunlukHam.get(m.id) || 0, yogunlukP95)
    const c = Math.min(canlilikHam.get(m.id)  || 0, canlilikP95)
    const yogunlukRaw = 1 - y / (yogunlukP95 || 1)
    const canlilikRaw = 1 - c / (canlilikP95  || 1)
    const ham = yogunlukRaw               * 0.35
              + canlilikRaw               * 0.30
              + ((m.yesil_alan_skoru || 50) / 100) * 0.20
              + ((m.guvenlik_skoru   || 50) / 100) * 0.15
    hamSkorlar.set(m.id, ham)
  }

  // Min-max normalizasyonu → 20-100 skalası
  const hamDegerler = [...hamSkorlar.values()]
  const hamMin = Math.min(...hamDegerler)
  const hamMax = Math.max(...hamDegerler)
  console.log(`Ham skor aralığı: ${hamMin.toFixed(3)} – ${hamMax.toFixed(3)}`)

  const updates = []
  for (const m of mahalleler) {
    const ham = hamSkorlar.get(m.id)
    const skor = Math.round(20 + (ham - hamMin) / (hamMax - hamMin) * 80)
    updates.push({ id: m.id, ilce_id: m.ilce_id, skor })
  }

  // Güncelle
  console.log(`\n${updates.length} mahalle güncelleniyor...`)
  let guncellenen = 0, hata = 0
  for (const u of updates) {
    const { error } = await supabase
      .from('mahalleler')
      .update({ sakin_memnuniyeti_skoru: u.skor })
      .eq('id', u.id)
    if (error) { hata++; if (hata <= 3) console.error('  ✗', error.message) }
    else guncellenen++
  }

  // Veri olmayanlar için ilçe ortalaması
  const ilceOrtalamalar = new Map()
  const { data: updated } = await supabase
    .from('mahalleler')
    .select('ilce_id, sakin_memnuniyeti_skoru')
    .gt('sakin_memnuniyeti_skoru', 0)
  for (const m of (updated || [])) {
    const arr = ilceOrtalamalar.get(m.ilce_id) || []
    arr.push(m.sakin_memnuniyeti_skoru)
    ilceOrtalamalar.set(m.ilce_id, arr)
  }
  const { data: sifirlar } = await supabase
    .from('mahalleler').select('id, ilce_id')
    .or('sakin_memnuniyeti_skoru.is.null,sakin_memnuniyeti_skoru.eq.0')
  for (const m of (sifirlar || [])) {
    const arr = ilceOrtalamalar.get(m.ilce_id) || []
    if (!arr.length) continue
    const ort = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    await supabase.from('mahalleler').update({ sakin_memnuniyeti_skoru: ort }).eq('id', m.id)
  }

  // İlçe ortalamalarını güncelle
  console.log('İlçe ortalamaları güncelleniyor...')
  const { data: ilceler } = await supabase.from('ilceler').select('id')
  for (const ilce of (ilceler || [])) {
    const { data: mArr } = await supabase
      .from('mahalleler').select('sakin_memnuniyeti_skoru')
      .eq('ilce_id', ilce.id).gt('sakin_memnuniyeti_skoru', 0)
    if (!mArr?.length) continue
    const ort = Math.round(mArr.reduce((a, b) => a + b.sakin_memnuniyeti_skoru, 0) / mArr.length)
    await supabase.from('ilceler').update({ sakin_memnuniyeti_skoru: ort }).eq('id', ilce.id)
  }

  console.log(`\n✅ Tamamlandı — Güncellenen: ${guncellenen} | Hata: ${hata}`)

  // Kontrol sorguları
  for (const [label, asc] of [['📊 En sakin 10', false], ['🔥 En canlı 10', true]]) {
    const { data: rows } = await supabase
      .from('mahalleler')
      .select('isim, ilce:ilce_id(isim), sakin_memnuniyeti_skoru, nufus, alan_km2')
      .gt('sakin_memnuniyeti_skoru', 0)
      .order('sakin_memnuniyeti_skoru', { ascending: asc })
      .limit(10)
    console.log(`\n${label}:`)
    console.log('─'.repeat(65))
    for (const m of (rows || [])) {
      const yog = m.alan_km2 > 0 && m.nufus > 0 ? Math.round(m.nufus / m.alan_km2) : '—'
      console.log(`${String(m.sakin_memnuniyeti_skoru).padStart(4)} | ${m.isim.padEnd(28)} | ${(m.ilce?.isim||'').padEnd(14)} | ${String(yog).padStart(7)} kişi/km²`)
    }
  }
}

main().catch(console.error)
