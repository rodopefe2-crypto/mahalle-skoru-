import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── PUAN + CAP TABLOLARI ──────────────────────────

const ULASIM_PUANLARI: Record<string, number> = {
  subway_station:     10,  // Gerçek metro
  train_station:      10,  // Marmaray / tren
  bus_station:         3,  // Büyük otobüs terminali
  transit_station:     1,  // Otobüs/dolmuş durağı
  light_rail_station:  8,  // Hafif raylı
  ferry_terminal:     10,  // Vapur
}
const ULASIM_CAP: Record<string, number> = {
  subway_station:      5,
  train_station:       5,
  bus_station:        10,
  transit_station:    50,
  light_rail_station:  5,
  ferry_terminal:      3,
}

const SAGLIK_PUANLARI: Record<string, number> = {
  hospital:  5,   // geniş kapsam — klinik/estetik de dahil
  doctor:    1,
  pharmacy:  2,
  dentist:   1,
  clinic:    2,
}
const SAGLIK_CAP: Record<string, number> = {
  hospital:  5,
  doctor:    8,
  pharmacy:  6,
  dentist:   6,
  clinic:    5,
}

const EGITIM_PUANLARI: Record<string, number> = {
  university: 15,
  school:      5,
  library:     4,
}
const EGITIM_CAP: Record<string, number> = {
  university:  3,
  school:     10,
  library:     3,
}

const IMKANLAR_PUANLARI: Record<string, number> = {
  restaurant:             2,
  cafe:                   3,
  bar:                    2,
  supermarket:            3,
  grocery_or_supermarket: 3,
  shopping_mall:          5,
  store:                  1,
  bakery:                 2,
  night_club:             2,
}
const IMKANLAR_CAP: Record<string, number> = {
  restaurant:             15,
  cafe:                   10,
  bar:                    8,
  supermarket:            5,
  grocery_or_supermarket: 5,
  shopping_mall:          5,
  store:                  8,
  bakery:                 5,
  night_club:             3,
}

const YESIL_PUANLARI: Record<string, number> = {
  park: 5,
}
const YESIL_CAP: Record<string, number> = {
  park: 4,
}

const KULTUR_PUANLARI: Record<string, number> = {
  museum:        10,
  art_gallery:    6,
  movie_theater:  7,
  library:        5,
}
const KULTUR_CAP: Record<string, number> = {
  museum:        3,
  art_gallery:   4,
  movie_theater: 3,
  library:       2,
}

// ── KİRA PRESTİJ ─────────────────────────────────

const ILCE_KIRA: Record<string, number> = {
  sariyer:       64454,
  besiktas:      61512,
  kadikoy:       52731,
  bakirkoy:      42820,
  adalar:        37500,
  sile:          36351,
  beykoz:        33678,
  uskudar:       32445,
  sisli:         31206,
  atasehir:      30965,
  beyoglu:       30596,
  maltepe:       29748,
  eyupsultan:    28528,
  basaksehir:    28324,
  kartal:        27842,
  umraniye:      27567,
  zeytinburnu:   27198,
  buyukcekmece:  26853,
  beylikduzu:    25951,
  tuzla:         25422,
  kagithane:     25409,
  pendik:        24888,
  cekmekoy:      24558,
  kucukcekmece:  23969,
  gaziosmanpasa: 22267,
  sancaktepe:    22177,
  bahcelievler:  21513,
  bayrampasa:    21042,
  catalca:       21019,
  gungoren:      20918,
  sultanbeyli:   20754,
  avcilar:       20426,
  silivri:       20102,
  bagcilar:      19692,
  fatih:         19268,
  sultangazi:    18164,
  esenler:       17199,
  arnavutkoy:    17180,
  esenyurt:      16717,
}

function kiraCarpaniHesapla(kiraOrtalama: number | null, ilceSlug: string, kiraMin: number, kiraMax: number): number {
  const kira = (kiraOrtalama && kiraOrtalama > 0) ? kiraOrtalama : (ILCE_KIRA[ilceSlug] || kiraMin)
  if (kiraMax <= kiraMin) return 1.0
  const oran = (kira - kiraMin) / (kiraMax - kiraMin)
  return 0.7 + Math.max(0, Math.min(1, oran)) * 0.6
}

// Dinamik min/max ile [20–100] arası normalize
function kiraPrestijiHesapla(
  kiraOrtalama: number | null,
  ilceSlug:     string,
  kiraMin:      number,
  kiraMax:      number,
): number {
  const kira = (kiraOrtalama && kiraOrtalama > 0)
    ? kiraOrtalama
    : (ILCE_KIRA[ilceSlug] || kiraMin)
  if (kiraMax <= kiraMin) return 60
  const oran = (kira - kiraMin) / (kiraMax - kiraMin)
  return Math.round(20 + Math.max(0, Math.min(1, oran)) * 80)
}

// ── MERKEZİYET ───────────────────────────────────
const MERKEZ = { lat: 41.0082, lng: 28.9784 }

function mesafeKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function merkeziyetCarpani(lat: number, lng: number): number {
  const km = mesafeKm(lat, lng, MERKEZ.lat, MERKEZ.lng)
  if (km <= 3)  return 1.40
  if (km <= 6)  return 1.32
  if (km <= 10) return 1.25
  if (km <= 15) return 1.18
  if (km <= 20) return 1.10
  if (km <= 25) return 1.03
  if (km <= 30) return 0.95
  if (km <= 35) return 0.87
  if (km <= 45) return 0.78
  if (km <= 55) return 0.68
  return 0.55
}

// Metrobüs geçen ilçeler
const METROBUS_ILCELER = [
  'kadikoy', 'atasehir', 'umraniye',
  'besiktas', 'sisli', 'beyoglu',
  'fatih', 'zeytinburnu', 'bakirkoy',
  'bahcelievler', 'kucukcekmece',
  'avcilar', 'esenyurt', 'beylikduzu',
]

function hamPuanHesapla(
  tesisler:    { alt_kategori: string; kategori: string }[],
  puanTablosu: Record<string, number>,
  capTablosu:  Record<string, number>,
  kategori:    string
): number {
  const sayilar: Record<string, number> = {}
  tesisler
    .filter(t => t.kategori === kategori)
    .forEach(t => { sayilar[t.alt_kategori] = (sayilar[t.alt_kategori] || 0) + 1 })

  let toplam = 0
  for (const [altKat, sayi] of Object.entries(sayilar)) {
    const birimPuan   = puanTablosu[altKat] || 1
    const cap         = capTablosu[altKat]  ?? Infinity
    const gecerliSayi = Math.min(sayi, cap)
    toplam += gecerliSayi * birimPuan
  }
  return toplam
}

async function main() {
  console.log('Mahalle skorları hesaplanıyor (Google Places)...\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, slug, koordinat_lat, koordinat_lng, kira_ortalama, alan_km2, guvenlik_skoru, ilce:ilce_id(isim, slug, koordinat_lat, koordinat_lng, alan_km2)')
    .order('isim')

  if (!mahalleler?.length) { console.error('Mahalle bulunamadı'); return }

  console.log('Tesis verisi yükleniyor...')
  const tesisVerisi: any[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('mahalle_tesisler')
      .select('mahalle_id, kategori, alt_kategori')
      .range(offset, offset + 999)
    if (!data?.length) break
    tesisVerisi.push(...data)
    process.stdout.write(`\r  ${tesisVerisi.length} tesis yüklendi`)
    if (data.length < 1000) break
    offset += 1000
  }
  console.log(`\r  ${tesisVerisi.length} tesis yüklendi\n`)

  if (!tesisVerisi.length) { console.error('Tesis verisi bulunamadı'); return }

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('slug, guvenlik_skoru, deprem_skoru, genel_skor')
  const ilceMap = new Map(ilceler?.map(i => [i.slug, i]) ?? [])

  const tesisByMahalle = new Map<string, typeof tesisVerisi>()
  for (const t of tesisVerisi) {
    if (!tesisByMahalle.has(t.mahalle_id)) tesisByMahalle.set(t.mahalle_id, [])
    tesisByMahalle.get(t.mahalle_id)!.push(t)
  }

  // Kira global min/max (dinamik normalizasyon için)
  const kiraValues = mahalleler.map(m => {
    const ko = (m as any).kira_ortalama
    const ilceSlug = (m.ilce as any)?.slug
    return (ko && ko > 0) ? ko : (ILCE_KIRA[ilceSlug] || 0)
  }).filter(v => v > 0)
  const kiraGlobalMin = Math.min(...kiraValues)
  const kiraGlobalMax = Math.max(...kiraValues)
  console.log(`Kira aralığı: ${Math.round(kiraGlobalMin/1000)}K – ${Math.round(kiraGlobalMax/1000)}K TL\n`)

  // Ham puanları hesapla
  const hamPuanlar: Record<string, Record<string, number>> = {}
  for (const mahalle of mahalleler) {
    const mahTesisler = tesisByMahalle.get(mahalle.id) ?? []
    if (mahTesisler.length === 0) continue

    const mahaleLat = (mahalle as any).koordinat_lat as number | null
    const mahaleLng = (mahalle as any).koordinat_lng as number | null
    const ilceLat   = (mahalle.ilce as any)?.koordinat_lat as number | null
    const ilceLng   = (mahalle.ilce as any)?.koordinat_lng as number | null
    const lat = mahaleLat || ilceLat || MERKEZ.lat
    const lng = mahaleLng || ilceLng || MERKEZ.lng
    const carpan = merkeziyetCarpani(lat, lng)

    const hamUlasim = hamPuanHesapla(mahTesisler, ULASIM_PUANLARI, ULASIM_CAP, 'ulasim')

    hamPuanlar[mahalle.id] = {
      ulasim:   Math.round(hamUlasim * carpan),
      saglik:   hamPuanHesapla(mahTesisler, SAGLIK_PUANLARI, SAGLIK_CAP, 'saglik'),
      egitim:   hamPuanHesapla(mahTesisler, EGITIM_PUANLARI, EGITIM_CAP, 'egitim'),
      imkanlar: hamPuanHesapla(mahTesisler, IMKANLAR_PUANLARI, IMKANLAR_CAP, 'imkanlar'),
      yesil:    hamPuanHesapla(mahTesisler, YESIL_PUANLARI,  YESIL_CAP,  'yesil'),
      kultur:   hamPuanHesapla(mahTesisler, KULTUR_PUANLARI, KULTUR_CAP, 'kultur'),
    }
  }

  // Global min/max
  const kategoriler = ['ulasim', 'saglik', 'egitim', 'imkanlar', 'yesil', 'kultur']
  const maxPuanlar: Record<string, number> = {}
  const minPuanlar: Record<string, number> = {}
  for (const kat of kategoriler) {
    const vals = Object.values(hamPuanlar).map(p => p[kat] || 0).filter(v => v > 0)
    maxPuanlar[kat] = Math.max(...vals, 1)
    minPuanlar[kat] = Math.min(...vals, 0)
  }

  console.log('Max ham puanlar:')
  kategoriler.forEach(k => console.log(`  ${k}: ${maxPuanlar[k]} (min: ${minPuanlar[k]})`))

  const normalize = (puan: number, max: number, min: number = 0): number => {
    if (max <= 0 || puan <= 0) return 0
    if (max === min) return 50
    const oran = (puan - min) / (max - min)
    return Math.round(Math.pow(oran, 0.8) * 100)
  }

  const sonuclar: { isim: string; ilce: string; skorlar: Record<string, number>; genel: number }[] = []
  let guncellenen = 0

  for (const mahalle of mahalleler) {
    const ham      = hamPuanlar[mahalle.id]
    if (!ham) continue

    const ilceSlug = (mahalle.ilce as any)?.slug
    const ilceSkor = ilceMap.get(ilceSlug)

    const skorlar = {
      ulasim_skoru:     normalize(ham.ulasim,   maxPuanlar.ulasim,   minPuanlar.ulasim),
      saglik_skoru:     normalize(ham.saglik,   maxPuanlar.saglik,   minPuanlar.saglik),
      egitim_skoru:     normalize(ham.egitim,   maxPuanlar.egitim,   minPuanlar.egitim),
      imkanlar_skoru:   normalize(ham.imkanlar, maxPuanlar.imkanlar, minPuanlar.imkanlar),
      yesil_alan_skoru: normalize(ham.yesil,    maxPuanlar.yesil,    minPuanlar.yesil),
      kultur_skoru:     normalize(ham.kultur,   maxPuanlar.kultur,   minPuanlar.kultur),
    }

    const metrobusBonus   = METROBUS_ILCELER.includes(ilceSlug) ? 12 : 0
    const ulasimSkorFinal = Math.min(100, skorlar.ulasim_skoru + metrobusBonus)
    const kiraSkor        = kiraPrestijiHesapla((mahalle as any).kira_ortalama ?? null, ilceSlug, kiraGlobalMin, kiraGlobalMax)
    const kiraCarpani     = kiraCarpaniHesapla((mahalle as any).kira_ortalama ?? null, ilceSlug, kiraGlobalMin, kiraGlobalMax)

    const imkanlarKiraDestekli = Math.min(100, Math.round(skorlar.imkanlar_skoru * kiraCarpani))
    const guvenlikSkoru = (mahalle as any).guvenlik_skoru || ilceSkor?.guvenlik_skoru || 50

    const genel_skor = Math.min(100, Math.round(
      kiraSkor                 * 0.200 +
      guvenlikSkoru            * 0.200 +
      imkanlarKiraDestekli     * 0.200 +
      ulasimSkorFinal          * 0.200 +
      skorlar.egitim_skoru     * 0.075 +
      skorlar.saglik_skoru     * 0.075 +
      skorlar.yesil_alan_skoru * 0.025 +
      skorlar.kultur_skoru     * 0.025
    ))

    const { error } = await supabase
      .from('mahalleler')
      .update({
        ulasim_skoru:     ulasimSkorFinal,
        saglik_skoru:     skorlar.saglik_skoru,
        egitim_skoru:     skorlar.egitim_skoru,
        imkanlar_skoru:   imkanlarKiraDestekli,
        yesil_alan_skoru: skorlar.yesil_alan_skoru,
        kultur_skoru:     skorlar.kultur_skoru,
        genel_skor,
      })
      .eq('id', mahalle.id)

    if (error) { console.error(`✗ ${mahalle.isim}:`, error.message); continue }

    guncellenen++
    if (guncellenen % 100 === 0) process.stdout.write(`\r  ${guncellenen}/${mahalleler.length}`)

    sonuclar.push({
      isim:   mahalle.isim,
      ilce:   (mahalle.ilce as any)?.isim || '',
      skorlar: { ...skorlar, ulasim_skoru: ulasimSkorFinal, kira_skoru: kiraSkor },
      genel:  genel_skor,
    })
  }

  console.log(`\r✅ ${guncellenen} mahalle güncellendi\n`)

  sonuclar.sort((a, b) => b.genel - a.genel)

  console.log('── Top 20 ────────────────────────────────────────────────')
  sonuclar.slice(0, 20).forEach((s, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. ` +
      `${s.isim.padEnd(20)} ${s.ilce.padEnd(14)} → ${s.genel}`
    )
  })

  console.log('\n── Kontrol Mahalleleri ───────────────────────────────────')
  const KONTROL = ['SUADİYE', 'BEBEK', 'ETİLER', 'CAFERAĞA', 'CİHANGİR', 'ULUS', 'BOSTANCI', 'FENERBAHÇE']
  sonuclar
    .filter(s => KONTROL.includes(s.isim))
    .sort((a, b) => b.genel - a.genel)
    .forEach(s => {
      console.log(
        `  ${s.isim.padEnd(15)} ${s.ilce.padEnd(12)} → ${s.genel} ` +
        `(U:${s.skorlar.ulasim_skoru} İ:${s.skorlar.imkanlar_skoru} ` +
        `E:${s.skorlar.egitim_skoru} K:${s.skorlar.kultur_skoru} Kira:${s.skorlar.kira_skoru})`
      )
    })

  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
