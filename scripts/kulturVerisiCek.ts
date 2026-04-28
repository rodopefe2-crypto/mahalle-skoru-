import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ILCELER = [
  { slug: 'sisli',    relationId: 1765896 },
  { slug: 'sariyer',  relationId: 1765895 },
  { slug: 'beyoglu',  relationId: 1765892 },
]

function buildQuery(relationId: number): string {
  // OSM area ID = relation ID + 3600000000
  const areaId = 3600000000 + relationId
  return `[out:json][timeout:60];area(${areaId})->.ilce;(node["amenity"="cinema"](area.ilce);node["amenity"="theatre"](area.ilce);node["tourism"="museum"](area.ilce);node["tourism"="gallery"](area.ilce);node["amenity"="arts_centre"](area.ilce);node["amenity"="concert_hall"](area.ilce);node["leisure"="stadium"](area.ilce);node["amenity"="nightclub"](area.ilce);way["amenity"="cinema"](area.ilce);way["amenity"="theatre"](area.ilce);way["tourism"="museum"](area.ilce););out center;`
}

function altKategoriTespitEt(tags: Record<string, string>): string {
  if (tags.amenity === 'cinema')       return 'sinema'
  if (tags.amenity === 'theatre')      return 'tiyatro'
  if (tags.tourism === 'museum')       return 'muze'
  if (tags.tourism === 'gallery')      return 'galeri'
  if (tags.amenity === 'arts_centre')  return 'sanat_merkezi'
  if (tags.amenity === 'concert_hall') return 'konser'
  if (tags.leisure === 'stadium')      return 'stadyum'
  if (tags.amenity === 'nightclub')    return 'gece_kulubu'
  return 'kultur_diger'
}

async function overpassSorgu(query: string): Promise<any[]> {
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'MahalleSkoruBot/1.0',
    },
    body: new URLSearchParams({ data: query }).toString(),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Overpass hata: ${response.status} — ${body.slice(0, 200)}`)
  }
  const data = await response.json()
  return data.elements || []
}

async function main() {
  console.log('Kültür verisi çekiliyor...\n')

  for (const ilce of ILCELER) {
    console.log(`\n── ${ilce.slug} ──`)

    const { data: ilceRow, error } = await supabase
      .from('ilceler')
      .select('id, isim')
      .eq('slug', ilce.slug)
      .single()

    if (error || !ilceRow) {
      console.error(`  Bulunamadı: ${error?.message}`)
      continue
    }

    await new Promise(r => setTimeout(r, 8000))

    try {
      const elements = await overpassSorgu(buildQuery(ilce.relationId))
      console.log(`  OSM'den ${elements.length} kültür mekanı geldi`)

      if (elements.length === 0) {
        console.log('  Veri yok, geçiliyor')
        continue
      }

      // Mevcut kültür verisini sil
      await supabase
        .from('ilce_tesisler')
        .delete()
        .eq('ilce_id', ilceRow.id)
        .eq('kategori', 'kultur')

      const tesisler = elements.map((el: any) => {
        const lat = el.type === 'node' ? el.lat : el.center?.lat
        const lng = el.type === 'node' ? el.lon : el.center?.lon
        if (!lat || !lng) return null

        return {
          ilce_id:      ilceRow.id,
          kategori:     'kultur',
          alt_kategori: altKategoriTespitEt(el.tags || {}),
          isim:         el.tags?.name || el.tags?.['name:tr'] || null,
          lat,
          lng,
          osm_id:       el.id,
          kaynak:       'osm',
        }
      }).filter(Boolean)

      console.log(`  Kategorize: ${tesisler.length} mekan`)

      let eklenen = 0
      for (let i = 0; i < tesisler.length; i += 100) {
        const { error: ekleErr } = await supabase
          .from('ilce_tesisler')
          .insert(tesisler.slice(i, i + 100))
        if (!ekleErr) eklenen += Math.min(100, tesisler.length - i)
        else console.error(`  Ekleme hatası:`, ekleErr.message)
      }

      console.log(`  ✓ ${eklenen} kültür mekanı eklendi`)

    } catch (err: any) {
      console.error(`  Hata: ${err.message}`)
    }
  }

  console.log('\nTamamlandı!')
}

main().catch(console.error)
