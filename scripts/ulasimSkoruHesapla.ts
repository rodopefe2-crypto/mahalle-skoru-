import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── PUAN SİSTEMİ ─────────────────────────────────
const PUAN_TABLOSU: Record<string, number> = {
  subway_entrance: 25,
  tram_stop:       15,
  ferry_terminal:  20,
  bus_stop:         1,
  metrobus:        20,
}

// ── MERKEZİYET FAKTÖRÜ ───────────────────────────
const MERKEZ = { lat: 41.0082, lng: 28.9784 }

function mesafeKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function merkeziyetCarpani(lat: number, lng: number): number {
  const km = mesafeKm(lat, lng, MERKEZ.lat, MERKEZ.lng)
  if (km <= 3)  return 1.50
  if (km <= 6)  return 1.45
  if (km <= 10) return 1.38
  if (km <= 15) return 1.30
  if (km <= 20) return 1.20
  if (km <= 25) return 1.10
  if (km <= 30) return 0.98
  if (km <= 35) return 0.85
  if (km <= 45) return 0.72
  if (km <= 55) return 0.58
  return 0.45
}

// ── HAM PUAN HESABI ───────────────────────────────
function hamPuanHesapla(
  tesisler: { alt_kategori: string }[]
): {
  hamPuan: number
  detay:   Record<string, { sayi: number; puan: number }>
} {
  const detay: Record<string, { sayi: number; puan: number }> = {
    bus_stop:        { sayi: 0, puan: 0 },
    subway_entrance: { sayi: 0, puan: 0 },
    tram_stop:       { sayi: 0, puan: 0 },
    ferry_terminal:  { sayi: 0, puan: 0 },
    metrobus:        { sayi: 0, puan: 0 },
  }

  for (const t of tesisler) {
    const altKat    = t.alt_kategori
    const birimPuan = PUAN_TABLOSU[altKat]
    if (!birimPuan) continue
    if (!detay[altKat]) detay[altKat] = { sayi: 0, puan: 0 }
    detay[altKat].sayi++
    detay[altKat].puan += birimPuan
  }

  // Raylı sistem puanı (metro + tramvay + vapur + metrobüs)
  const raylıPuan = (detay.subway_entrance.puan + detay.tram_stop.puan +
                     detay.ferry_terminal.puan  + detay.metrobus.puan)

  // Otobüs cap: raylı varsa raylının %50'si, yoksa max 30
  const maxOtobusPuan = raylıPuan > 0 ? Math.round(raylıPuan * 0.5) : 30
  const otobusCount   = detay.bus_stop.sayi
  const otobusPuan    = Math.min(otobusCount, maxOtobusPuan)
  detay.bus_stop.puan = otobusPuan

  const hamPuan = otobusPuan + raylıPuan
  return { hamPuan, detay }
}

// ── NORMALİZASYON ────────────────────────────────
function logNorm(puanlar: Record<string, number>): Record<string, number> {
  const values = Object.values(puanlar)
  const max    = Math.max(...values)
  const min    = Math.min(...values)
  const logMax = Math.log(max + 1)
  const logMin = Math.log(min + 1)
  const result: Record<string, number> = {}
  for (const [slug, puan] of Object.entries(puanlar)) {
    if (max === min) { result[slug] = 50; continue }
    result[slug] = Math.round(((Math.log(puan + 1) - logMin) / (logMax - logMin)) * 100)
  }
  return result
}

// Merkeziyet çarpanını 0-100 skoruna dönüştür
// Çarpan aralığı: 0.45 (en uzak) → 1.50 (merkez)
const CARPAN_MIN = 0.45
const CARPAN_MAX = 1.50
function carpanToSkor(carpan: number): number {
  return Math.round(((carpan - CARPAN_MIN) / (CARPAN_MAX - CARPAN_MIN)) * 100)
}

function normalizasyonUygula(
  hamPuanlar:  Record<string, number>,
  carpanlar:   Record<string, number>
): Record<string, number> {
  const tesisSkorlar = logNorm(hamPuanlar)
  const result: Record<string, number> = {}
  for (const slug of Object.keys(hamPuanlar)) {
    const tesisSkor = tesisSkorlar[slug] ?? 0
    const merkezSkor = carpanToSkor(carpanlar[slug] ?? 1.0)
    result[slug] = Math.round(tesisSkor * 0.50 + merkezSkor * 0.50)
  }
  return result
}

// ── ANA FONKSİYON ────────────────────────────────
async function main() {
  console.log('Ulaşım skoru hesaplanıyor...\n')
  console.log('Algoritma:')
  console.log('  🚌 Otobüs durağı:  1 puan')
  console.log('  🚇 Metro durağı:   10 puan')
  console.log('  🚋 Tramvay durağı: 5 puan')
  console.log('  ⛴️  Vapur iskelesi: 10 puan')
  console.log('  📍 Merkeziyet çarpanı: 0.7 - 1.3')
  console.log('  📊 Log normalizasyon: 0-100\n')

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug, koordinat_lat, koordinat_lng')

  if (!ilceler?.length) {
    console.error('İlçe verisi alınamadı')
    return
  }

  const ilceHamPuanlar: Record<string, number> = {}
  const ilceCarpanlar:  Record<string, number> = {}
  const ilceDetaylari:  Record<string, any>    = {}

  for (const ilce of ilceler) {
    const { data: tesisler } = await supabase
      .from('ilce_tesisler')
      .select('alt_kategori')
      .eq('ilce_id', ilce.id)
      .eq('kategori', 'ulasim')

    if (!tesisler) continue

    const { hamPuan, detay } = hamPuanHesapla(tesisler)
    const carpan             = merkeziyetCarpani(ilce.koordinat_lat, ilce.koordinat_lng)
    const km                 = mesafeKm(ilce.koordinat_lat, ilce.koordinat_lng, MERKEZ.lat, MERKEZ.lng)

    ilceHamPuanlar[ilce.slug] = hamPuan
    ilceCarpanlar[ilce.slug]  = carpan
    ilceDetaylari[ilce.slug]  = { ilceId: ilce.id, hamPuan, carpan, detay, km }

    console.log(`\n── ${ilce.isim} ──`)
    console.log(`  Otobüs:  ${detay.bus_stop?.sayi || 0} durak`)
    console.log(`  Metro:   ${detay.subway_entrance?.sayi || 0} durak`)
    console.log(`  Tramvay: ${detay.tram_stop?.sayi || 0} durak`)
    console.log(`  Vapur:   ${detay.ferry_terminal?.sayi || 0} iskele`)
    console.log(`  Ham puan: ${Math.round(hamPuan)}`)
    console.log(`  Merkeziyet: x${carpan} (${Math.round(km)} km) → merkezSkor: ${carpanToSkor(carpan)}`)
  }

  console.log('\n\nNormalizasyon uygulanıyor... (tesisSkor 50% + merkezSkor 50%)')
  const normalPuanlar = normalizasyonUygula(ilceHamPuanlar, ilceCarpanlar)
  const tesisSkorlar  = logNorm(ilceHamPuanlar)

  // Detaylı log (tüm ilçeler — grep ile filtrele)
  for (const ilce of ilceler) {
    const d             = ilceDetaylari[ilce.slug]
    if (!d) continue
    const tesisSkor     = tesisSkorlar[ilce.slug] ?? 0
    const merkezSkor    = carpanToSkor(d.carpan)
    const finalSkor     = normalPuanlar[ilce.slug] ?? 0
    console.log(`\n── ${ilce.isim} DETAY ──`)
    console.log(`  Otobüs:              ${d.detay.bus_stop?.sayi || 0}`)
    console.log(`  Metro:               ${d.detay.subway_entrance?.sayi || 0}`)
    console.log(`  Tramvay:             ${d.detay.tram_stop?.sayi || 0}`)
    console.log(`  Vapur:               ${d.detay.ferry_terminal?.sayi || 0}`)
    console.log(`  Ham puan:            ${Math.round(d.hamPuan)}`)
    console.log(`  Merkeziyet:          x${d.carpan} (${Math.round(d.km)} km)`)
    console.log(`  Merkeziyet skoru:    ${merkezSkor}`)
    console.log(`  Tesis norm skoru:    ${tesisSkor}`)
    console.log(`  Final ulaşım skoru:  ${finalSkor}`)
  }

  const sirali = Object.entries(normalPuanlar).sort(([, a], [, b]) => b - a)

  console.log('\n── Ulaşım Sıralaması ──────────────────')
  sirali.forEach(([slug, skor], idx) => {
    const ilce = ilceler.find(i => i.slug === slug)
    console.log(
      `  ${String(idx + 1).padStart(2)}. ` +
      `${(ilce?.isim || slug).padEnd(15)} → ${skor} puan`
    )
  })

  console.log('\nVeritabanına yazılıyor...')
  let guncellenen = 0

  for (const [slug, skor] of Object.entries(normalPuanlar)) {
    const ilce = ilceler.find(i => i.slug === slug)
    if (!ilce) continue

    const { error } = await supabase
      .from('ilceler')
      .update({ ulasim_skoru: skor })
      .eq('id', ilce.id)

    if (error) {
      console.error(`  ✗ ${slug}:`, error.message)
    } else {
      guncellenen++
    }
  }

  console.log(`\n✅ ${guncellenen} ilçe güncellendi`)
  console.log('\nGenel skoru güncellemek için SQL Editor\'da çalıştır:')
  console.log(`
UPDATE ilceler
SET genel_skor = ROUND(
  ulasim_skoru                  * 0.20 +
  saglik_skoru                  * 0.15 +
  egitim_skoru                  * 0.15 +
  imkanlar_skoru                * 0.15 +
  deprem_skoru                  * 0.15 +
  COALESCE(yesil_alan_skoru, 0) * 0.10 +
  COALESCE(kultur_skoru, 0)     * 0.10
);
  `)
}

main().catch(console.error)
