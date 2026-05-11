import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function geojsonToOverpassPoly(geojson: any): string | null {
  try {
    let coords: number[][]
    if (geojson.type === 'Polygon') {
      coords = geojson.coordinates[0]
    } else if (geojson.type === 'MultiPolygon') {
      coords = geojson.coordinates
        .map((p: number[][][]) => p[0])
        .sort((a: number[][], b: number[][]) => b.length - a.length)[0]
    } else {
      return null
    }
    const step = Math.max(1, Math.ceil(coords.length / 400))
    return coords
      .filter((_: number[], i: number) => i % step === 0)
      .map(([lon, lat]: number[]) => `${lat} ${lon}`)
      .join(' ')
  } catch {
    return null
  }
}

async function overpassSorgu(query: string): Promise<any[]> {
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MahalleSkoru/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
      })
      if (res.status === 429) {
        console.warn('  Rate limit, 90s bekleniyor...')
        await new Promise(r => setTimeout(r, 90000))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.elements || []
    } catch (err: any) {
      console.warn(`  Deneme ${i}/3: ${err.message}`)
      if (i < 3) await new Promise(r => setTimeout(r, 4000 * i))
    }
  }
  return []
}

const KATEGORI_MAP: Record<string, { kategori: string; alt_kategori: string }> = {
  restaurant:   { kategori: 'imkanlar', alt_kategori: 'restaurant'  },
  fast_food:    { kategori: 'imkanlar', alt_kategori: 'restaurant'  },
  food_court:   { kategori: 'imkanlar', alt_kategori: 'restaurant'  },
  cafe:         { kategori: 'imkanlar', alt_kategori: 'cafe'        },
  bar:          { kategori: 'imkanlar', alt_kategori: 'bar'         },
  pub:          { kategori: 'imkanlar', alt_kategori: 'bar'         },
  nightclub:    { kategori: 'imkanlar', alt_kategori: 'night_club'  },
  supermarket:  { kategori: 'imkanlar', alt_kategori: 'supermarket' },
  convenience:  { kategori: 'imkanlar', alt_kategori: 'supermarket' },
  grocery:      { kategori: 'imkanlar', alt_kategori: 'supermarket' },
  bakery:       { kategori: 'imkanlar', alt_kategori: 'bakery'      },
}

const AMENITY_FILTER = 'restaurant|fast_food|food_court|cafe|bar|pub|nightclub|supermarket|bakery'
const SHOP_FILTER    = 'supermarket|convenience|grocery|bakery'

function buildPolyQuery(poly: string): string {
  return `[out:json][timeout:60];
(
  node["amenity"~"^(${AMENITY_FILTER})$"](poly:"${poly}");
  way["amenity"~"^(${AMENITY_FILTER})$"](poly:"${poly}");
  node["shop"~"^(${SHOP_FILTER})$"](poly:"${poly}");
  way["shop"~"^(${SHOP_FILTER})$"](poly:"${poly}");
);
out center tags;`
}

function buildBboxQuery(lat: number, lng: number): string {
  const d = 0.005
  const bbox = `${lat - d},${lng - d},${lat + d},${lng + d}`
  return `[out:json][timeout:30];
(
  node["amenity"~"^(${AMENITY_FILTER})$"](${bbox});
  way["amenity"~"^(${AMENITY_FILTER})$"](${bbox});
  node["shop"~"^(${SHOP_FILTER})$"](${bbox});
  way["shop"~"^(${SHOP_FILTER})$"](${bbox});
);
out center tags;`
}

async function main() {
  console.log('OSM ticari tesis verisi çekiliyor...\n')

  // Tüm mahalleleri çek (poligonlu ve poligonsuz)
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, koordinat_lat, koordinat_lng, ilce:ilce_id(isim)')
    .order('isim')

  if (!mahalleler?.length) { console.error('Mahalle bulunamadı'); return }

  // Hangi mahallelerin poligonu var?
  const { data: poligonlular } = await supabase
    .from('mahalleler')
    .select('id')
    .not('boundary', 'is', null)
  const poligonSet = new Set((poligonlular || []).map(m => m.id))

  const toplamPoli = poligonSet.size
  const toplamBbox = mahalleler.length - toplamPoli
  console.log(`${mahalleler.length} mahalle: ${toplamPoli} poligon, ${toplamBbox} bbox fallback\n`)

  let toplamEklenen = 0, toplamAtlanan = 0

  for (let idx = 0; idx < mahalleler.length; idx++) {
    const mahalle = mahalleler[idx]
    const ilceIsim = (mahalle.ilce as any)?.isim || ''
    const hasPoly = poligonSet.has(mahalle.id)
    const mod = hasPoly ? 'poly' : 'bbox'

    process.stdout.write(`[${idx + 1}/${mahalleler.length}] ${ilceIsim}/${mahalle.isim} (${mod})... `)

    let query: string

    if (hasPoly) {
      const { data: geojsonData } = await supabase
        .rpc('get_mahalle_boundary_geojson', { p_mahalle_id: mahalle.id })
      const poly = geojsonData ? geojsonToOverpassPoly(geojsonData) : null
      if (!poly) {
        // Poligon parse hatası → bbox'a düş
        query = buildBboxQuery(mahalle.koordinat_lat, mahalle.koordinat_lng)
      } else {
        query = buildPolyQuery(poly)
      }
    } else {
      query = buildBboxQuery(mahalle.koordinat_lat, mahalle.koordinat_lng)
    }

    const elements = await overpassSorgu(query)
    process.stdout.write(`${elements.length} element → `)

    // Mevcut osm_ticari kayıtları temizle
    await supabase
      .from('mahalle_tesisler')
      .delete()
      .eq('mahalle_id', mahalle.id)
      .eq('kaynak', 'osm_ticari')

    const kayitlar: any[] = []
    for (const el of elements) {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (!elLat || !elLng) continue
      const key = el.tags?.amenity || el.tags?.shop
      const kat = KATEGORI_MAP[key]
      if (!kat) continue
      kayitlar.push({
        mahalle_id:   mahalle.id,
        kategori:     kat.kategori,
        alt_kategori: kat.alt_kategori,
        isim:         el.tags?.name || null,
        lat:          elLat,
        lng:          elLng,
        kaynak:       'osm_ticari',
      })
    }

    let eklenen = 0
    for (let i = 0; i < kayitlar.length; i += 100) {
      const { error } = await supabase
        .from('mahalle_tesisler')
        .insert(kayitlar.slice(i, i + 100))
      if (!error) eklenen += Math.min(100, kayitlar.length - i)
      else if (i === 0) console.error('\n  insert hata:', error.message)
    }

    toplamEklenen += eklenen
    if (eklenen === 0) toplamAtlanan++
    console.log(`${eklenen} eklendi`)

    // Her 50 mahallede özet
    if ((idx + 1) % 50 === 0) {
      console.log(`\n  ── Ara rapor: ${idx + 1}/${mahalleler.length} mahalle, ${toplamEklenen} tesis ──\n`)
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\n✅ Tamamlandı`)
  console.log(`  Toplam eklenen: ${toplamEklenen}`)
  console.log(`  Tesis bulunamayan: ${toplamAtlanan}`)

  // Sinanpaşa özeti
  const { data: sp } = await supabase
    .from('mahalleler').select('id').eq('isim', 'SİNANPAŞA').single()
  if (sp) {
    const { data: sayilar } = await supabase
      .from('mahalle_tesisler').select('alt_kategori')
      .eq('mahalle_id', sp.id).eq('kaynak', 'osm_ticari')
    if (sayilar?.length) {
      const ozet: Record<string, number> = {}
      sayilar.forEach(r => { ozet[r.alt_kategori] = (ozet[r.alt_kategori] || 0) + 1 })
      console.log('\nSİNANPAŞA OSM ticari:')
      Object.entries(ozet).sort(([,a],[,b]) => b-a).forEach(([k,v]) => console.log(`  ${k}: ${v}`))
    }
  }
}

main().catch(console.error)
