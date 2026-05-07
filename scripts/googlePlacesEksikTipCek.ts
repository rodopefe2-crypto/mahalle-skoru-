import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// Daha önce hiç çekilmemiş veya eksik olan tipler
const EKSIK_TIPLER = [
  { id: 'kultur', types: ['art_gallery'],                 radius: 1000 },
  { id: 'yesil',  types: ['campground', 'natural_feature'], radius: 1000 },
]

async function nearbySearch(lat: number, lng: number, type: string, radius: number): Promise<any[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius',   String(radius))
  url.searchParams.set('type',     type)
  url.searchParams.set('key',      GOOGLE_API_KEY)
  url.searchParams.set('language', 'tr')

  try {
    const res  = await fetch(url.toString())
    const data = await res.json()
    if (data.status === 'OK') return data.results || []
    if (data.status === 'ZERO_RESULTS') return []
    console.warn(`  API uyarı [${type}]: ${data.status}`)
    return []
  } catch (err) {
    console.error(`  Fetch hatası:`, err)
    return []
  }
}

async function main() {
  console.log('Eksik Google Places tipleri çekiliyor...')
  console.log(`Tipler: ${EKSIK_TIPLER.flatMap(e => e.types).join(', ')}\n`)

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, koordinat_lat, koordinat_lng')
    .not('koordinat_lat', 'is', null)
    .not('koordinat_lng', 'is', null)
    .order('isim')

  if (!mahalleler?.length) { console.error('Mahalle bulunamadı'); return }
  console.log(`${mahalleler.length} mahalle işlenecek\n`)

  let toplamEklenen = 0

  for (let i = 0; i < mahalleler.length; i++) {
    const mah = mahalleler[i]
    const lat  = mah.koordinat_lat as number
    const lng  = mah.koordinat_lng as number

    for (const kat of EKSIK_TIPLER) {
      for (const type of kat.types) {
        await new Promise(r => setTimeout(r, 150))

        const sonuclar = await nearbySearch(lat, lng, type, kat.radius)
        if (!sonuclar.length) continue

        // Mevcut place_id'leri kontrol etmeden direkt insert
        // (duplicate place_id'ler zaten unique constraint yoksa sorun değil)
        const kayitlar = sonuclar.map(yer => ({
          mahalle_id:   mah.id,
          kategori:     kat.id,
          alt_kategori: type,
          isim:         yer.name,
          lat:          yer.geometry?.location?.lat || null,
          lng:          yer.geometry?.location?.lng || null,
          kaynak:       'google_places',
        }))

        const { error } = await supabase
          .from('mahalle_tesisler')
          .insert(kayitlar)

        if (error) {
          console.error(`  ✗ ${mah.isim} [${type}]:`, error.message)
        } else {
          toplamEklenen += kayitlar.length
        }
      }
    }

    if ((i + 1) % 100 === 0)
      process.stdout.write(`\r  ${i + 1}/${mahalleler.length} işlendi, ${toplamEklenen} tesis eklendi`)
  }

  console.log(`\r✅ Tamamlandı! ${toplamEklenen} yeni tesis eklendi              `)

  // Kontrol
  const { count: artGallery } = await supabase
    .from('mahalle_tesisler').select('*', { count: 'exact', head: true }).eq('alt_kategori', 'art_gallery')
  const { count: kampus } = await supabase
    .from('mahalle_tesisler').select('*', { count: 'exact', head: true }).eq('alt_kategori', 'campground')
  console.log(`\nart_gallery: ${artGallery} kayıt`)
  console.log(`campground: ${kampus} kayıt`)
}

main().catch(console.error)
