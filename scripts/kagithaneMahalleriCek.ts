import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const KAGITHANE_RELATION_ID = 1765894

function slugOlustur(isim: string): string {
  return isim
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const SORGU = `[out:json][timeout:120];rel(${KAGITHANE_RELATION_ID})->.r;map_to_area.r->.kagithane;(rel["boundary"="administrative"]["admin_level"="10"](area.kagithane);rel["boundary"="administrative"]["admin_level"="9"](area.kagithane);rel["place"="neighbourhood"](area.kagithane);rel["place"="suburb"](area.kagithane););out center tags;`

async function ekle(ilceId: string, isim: string, slug: string, lat: number, lng: number, osmId?: number) {
  const { data: mevcut } = await supabase.from('mahalleler').select('id').eq('slug', slug).single()
  if (mevcut) { console.log(`  Zaten var: ${isim}`); return false }

  const { error } = await supabase.from('mahalleler').insert({
    ilce_id: ilceId, isim, slug,
    koordinat_lat: lat, koordinat_lng: lng,
    osm_id: osmId ?? null,
    aciklama: `Kağıthane ilçesine bağlı ${isim} mahallesi.`,
    ulasim_skoru: 0, imkanlar_skoru: 0, egitim_skoru: 0,
    saglik_skoru: 0, guvenlik_skoru: 0, deprem_skoru: 0,
    yasam_maliyeti_skoru: 0, sakin_memnuniyeti_skoru: 0, genel_skor: 0,
  })

  if (error) { console.error(`  Hata (${isim}):`, error.message); return false }
  console.log(`  ✓ Eklendi: ${isim}`)
  return true
}

async function fallbackMahallelerEkle(ilceId: string) {
  console.log('Manuel mahalle listesi ekleniyor...')
  const MAHALLELER = [
    { isim: 'Çağlayan',   lat: 41.0712, lng: 28.9803 },
    { isim: 'Hamidiye',   lat: 41.0756, lng: 28.9701 },
    { isim: 'Harmantepe', lat: 41.0834, lng: 28.9689 },
    { isim: 'Hürriyet',   lat: 41.0698, lng: 28.9756 },
    { isim: 'Merkez',     lat: 41.0784, lng: 28.9706 },
    { isim: 'Nurtepe',    lat: 41.0901, lng: 28.9712 },
    { isim: 'Seyrantepe', lat: 41.0823, lng: 28.9845 },
    { isim: 'Talatpaşa',  lat: 41.0745, lng: 28.9834 },
    { isim: 'Yahyakemal', lat: 41.0867, lng: 28.9623 },
    { isim: 'Gültepe',    lat: 41.0956, lng: 28.9534 },
    { isim: 'Güneştepe',  lat: 41.0889, lng: 28.9801 },
    { isim: 'Habipler',   lat: 41.1012, lng: 28.9678 },
    { isim: 'Ortabayır',  lat: 41.0812, lng: 28.9756 },
    { isim: 'Çeliktepe',  lat: 41.0934, lng: 28.9612 },
    { isim: 'Kuştepe',    lat: 41.0623, lng: 28.9623 },
  ]

  let eklenen = 0
  for (const m of MAHALLELER) {
    const slug = 'kagithane-' + slugOlustur(m.isim)
    if (await ekle(ilceId, m.isim, slug, m.lat, m.lng)) eklenen++
  }
  console.log(`\n✓ ${eklenen} mahalle eklendi (fallback)`)
}

async function main() {
  console.log('Kağıthane mahalleleri çekiliyor...\n')

  const { data: ilce, error: ilceErr } = await supabase
    .from('ilceler').select('id, isim').eq('slug', 'kagithane').single()

  if (ilceErr || !ilce) {
    console.error('Kağıthane bulunamadı:', ilceErr?.message)
    process.exit(1)
  }
  console.log('İlçe bulundu:', ilce.isim, ilce.id)

  console.log('OSM sorgusu yapılıyor...')
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'MahalleSkoruBot/1.0',
    },
    body: new URLSearchParams({ data: SORGU }).toString(),
  })

  if (!response.ok) {
    console.error('Overpass API hatası:', response.status)
    console.log('Fallback kullanılıyor...')
    await fallbackMahallelerEkle(ilce.id)
    return
  }

  const data = await response.json()
  const elements: any[] = data.elements || []
  console.log(`OSM'den ${elements.length} sonuç geldi\n`)

  if (elements.length === 0) {
    console.log("OSM'den veri gelmedi, fallback kullanılıyor...")
    await fallbackMahallelerEkle(ilce.id)
    return
  }

  let eklenen = 0
  for (const el of elements) {
    const isim = el.tags?.['name:tr'] || el.tags?.name
    if (!isim) continue

    const slug = 'kagithane-' + slugOlustur(isim)
    const lat  = el.center?.lat ?? el.lat ?? 41.0784
    const lng  = el.center?.lon ?? el.lon ?? 28.9706

    if (await ekle(ilce.id, isim, slug, lat, lng, el.id)) eklenen++
    await new Promise(r => setTimeout(r, 200))
  }

  if (eklenen === 0) {
    console.log("\nOSM'den uygun veri bulunamadı, fallback kullanılıyor...")
    await fallbackMahallelerEkle(ilce.id)
  } else {
    console.log(`\n✓ Toplam ${eklenen} mahalle eklendi`)
  }
}

main().catch(console.error)
