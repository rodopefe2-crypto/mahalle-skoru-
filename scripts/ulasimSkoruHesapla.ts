import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── PUAN SİSTEMİ ─────────────────────────────────
const PUAN_TABLOSU: Record<string, number> = {
  bus_stop:        1,
  subway_entrance: 10,
  tram_stop:       5,
  ferry_terminal:  10,
  metrobus:        10,
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
  if (km <= 5)  return 1.30
  if (km <= 10) return 1.20
  if (km <= 15) return 1.15
  if (km <= 20) return 1.10
  if (km <= 25) return 1.05
  if (km <= 30) return 1.00
  if (km <= 35) return 0.95
  if (km <= 40) return 0.90
  if (km <= 50) return 0.82
  return 0.70
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

  let hamPuan = 0

  for (const t of tesisler) {
    const altKat    = t.alt_kategori
    const birimPuan = PUAN_TABLOSU[altKat]
    if (!birimPuan) continue

    if (!detay[altKat]) detay[altKat] = { sayi: 0, puan: 0 }
    detay[altKat].sayi++
    detay[altKat].puan += birimPuan
    hamPuan += birimPuan
  }

  // Otobüs için üst tavan: max otobüs katkısı diğerlerin 2/3'ü
  const otobusKatkisi = detay['bus_stop'].puan
  const digerKatkisi  = hamPuan - otobusKatkisi
  const maxOtobus     = digerKatkisi * 0.67

  if (otobusKatkisi > maxOtobus && digerKatkisi > 0) {
    hamPuan = digerKatkisi + maxOtobus
    detay['bus_stop'].puan = Math.round(maxOtobus)
  }

  return { hamPuan, detay }
}

// ── NORMALİZASYON ────────────────────────────────
function normalizasyonUygula(
  puanlar: Record<string, number>
): Record<string, number> {
  const values  = Object.values(puanlar)
  const maxPuan = Math.max(...values)
  const minPuan = Math.min(...values)
  const logMax  = Math.log(maxPuan + 1)
  const logMin  = Math.log(minPuan + 1)

  const normalize: Record<string, number> = {}

  for (const [slug, puan] of Object.entries(puanlar)) {
    if (maxPuan === minPuan) {
      normalize[slug] = 50
      continue
    }
    const logPuan  = Math.log(puan + 1)
    const normSkor = ((logPuan - logMin) / (logMax - logMin)) * 100
    normalize[slug] = Math.round(normSkor)
  }

  return normalize
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

  const ilcePuanlari: Record<string, number> = {}
  const ilceDetaylari: Record<string, any>   = {}

  for (const ilce of ilceler) {
    const { data: tesisler } = await supabase
      .from('ilce_tesisler')
      .select('alt_kategori')
      .eq('ilce_id', ilce.id)
      .eq('kategori', 'ulasim')

    if (!tesisler) continue

    const { hamPuan, detay } = hamPuanHesapla(tesisler)
    const carpan             = merkeziyetCarpani(ilce.koordinat_lat, ilce.koordinat_lng)
    const agirlikliPuan      = hamPuan * carpan
    const km                 = mesafeKm(ilce.koordinat_lat, ilce.koordinat_lng, MERKEZ.lat, MERKEZ.lng)

    ilcePuanlari[ilce.slug]  = agirlikliPuan
    ilceDetaylari[ilce.slug] = { ilceId: ilce.id, hamPuan, carpan, agirlikliPuan, detay, km }

    console.log(`\n── ${ilce.isim} ──`)
    console.log(`  Otobüs:  ${detay.bus_stop?.sayi || 0} durak`)
    console.log(`  Metro:   ${detay.subway_entrance?.sayi || 0} durak`)
    console.log(`  Tramvay: ${detay.tram_stop?.sayi || 0} durak`)
    console.log(`  Vapur:   ${detay.ferry_terminal?.sayi || 0} iskele`)
    console.log(`  Ham puan: ${Math.round(hamPuan)}`)
    console.log(`  Merkeziyet: x${carpan} (${Math.round(km)} km)`)
    console.log(`  Ağırlıklı: ${Math.round(agirlikliPuan)}`)
  }

  console.log('\n\nNormalizasyon uygulanıyor...')
  const normalPuanlar = normalizasyonUygula(ilcePuanlari)

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
