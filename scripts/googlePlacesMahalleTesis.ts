import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// ── KATEGORİ TANIMI ──────────────────────────────
const KATEGORILER = [
  {
    id:     'ulasim',
    label:  'Ulaşım',
    types:  ['bus_station', 'subway_station', 'train_station', 'transit_station'],
    radius: 800,
  },
  {
    id:     'saglik',
    label:  'Sağlık',
    types:  ['hospital', 'pharmacy', 'doctor', 'dentist'],
    radius: 1000,
  },
  {
    id:     'egitim',
    label:  'Eğitim',
    types:  ['school', 'university'],
    radius: 1000,
  },
  {
    id:     'imkanlar',
    label:  'İmkanlar',
    types:  ['restaurant', 'cafe', 'supermarket', 'grocery_or_supermarket'],
    radius: 600,
  },
  {
    id:     'yesil',
    label:  'Yeşil Alan',
    types:  ['park', 'campground', 'natural_feature'],
    radius: 1000,
  },
  {
    id:     'kultur',
    label:  'Kültür',
    types:  ['museum', 'movie_theater', 'library', 'art_gallery'],
    radius: 1000,
  },
]

// Google Places Nearby Search
async function nearbySearch(
  lat:    number,
  lng:    number,
  type:   string,
  radius: number
): Promise<any[]> {
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

    console.warn(`    API uyarı: ${data.status}`)
    return []
  } catch (err) {
    console.error(`    Fetch hatası:`, err)
    return []
  }
}

// ── ANA FONKSİYON ────────────────────────────────
async function main() {
  console.log('Google Places API ile mahalle tesis verisi çekiliyor...\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select(`
      id, isim, slug,
      koordinat_lat, koordinat_lng,
      ilce:ilce_id (isim, slug)
    `)
    .not('koordinat_lat', 'is', null)
    .not('koordinat_lng', 'is', null)
    .order('isim')

  if (!mahalleler?.length) {
    console.error('Koordinatlı mahalle bulunamadı!')
    return
  }

  console.log(`${mahalleler.length} mahalle işlenecek\n`)

  const islenecek = mahalleler

  let toplamTesis = 0

  for (const mahalle of islenecek) {
    const lat = mahalle.koordinat_lat as number
    const lng = mahalle.koordinat_lng as number

    console.log(`\n── ${(mahalle.ilce as any)?.isim} / ${mahalle.isim}`)
    console.log(`   📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`)

    await supabase
      .from('mahalle_tesisler')
      .delete()
      .eq('mahalle_id', mahalle.id)

    const tumTesisler: any[] = []

    for (const kat of KATEGORILER) {
      const katTesisler: any[] = []

      for (const type of kat.types) {
        await new Promise(r => setTimeout(r, 200))

        const sonuclar = await nearbySearch(lat, lng, type, kat.radius)

        for (const yer of sonuclar) {
          if (katTesisler.find(t => t.place_id === yer.place_id)) continue

          katTesisler.push({
            mahalle_id:   mahalle.id,
            kategori:     kat.id,
            alt_kategori: type,
            isim:         yer.name,
            lat:          yer.geometry?.location?.lat || null,
            lng:          yer.geometry?.location?.lng || null,
            kaynak:       'google_places',
            place_id:     yer.place_id,
          })
        }
      }

      console.log(`   ${kat.label}: ${katTesisler.length} tesis`)
      tumTesisler.push(...katTesisler)
    }

    // place_id tabloda yok, çıkar
    const kayitlar = tumTesisler.map(({ place_id, ...rest }) => rest)

    for (let i = 0; i < kayitlar.length; i += 100) {
      const { error } = await supabase
        .from('mahalle_tesisler')
        .insert(kayitlar.slice(i, i + 100))

      if (error) console.error(`   ✗ Kayıt hatası:`, error.message)
    }

    toplamTesis += kayitlar.length
    console.log(`   ✓ Toplam: ${kayitlar.length} tesis kaydedildi`)
  }

  console.log(`\n\n✅ Test tamamlandı!`)
  console.log(`Toplam tesis: ${toplamTesis}`)
  console.log(`\nTüm mahalleleri çekmek için slice(0, 5) satırını kaldır ve tekrar çalıştır.`)
}

main().catch(console.error)
