import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]

async function overpassSorgu(query: string): Promise<any[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let deneme = 1; deneme <= 2; deneme++) {
      try {
        const params = new URLSearchParams({ data: query })
        const res = await fetch(endpoint, {
          method:  'POST',
          body:    params,
          headers: { 'User-Agent': 'MahalleApp/1.0 (istanbul neighborhood scoring)' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data.elements || []
      } catch (err: any) {
        console.warn(`    ${endpoint} deneme ${deneme}: ${err.message}`)
        if (deneme < 2) await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  return []
}

function koordinatAl(el: any): { lat: number; lng: number } | null {
  if (el.type === 'node') return { lat: el.lat, lng: el.lon }
  if (el.center)          return { lat: el.center.lat, lng: el.center.lon }
  return null
}

const OSM_KATEGORILER = [
  { altKategori: 'bar',           sorgu: '"amenity"="bar"',       label: 'Bar'        },
  { altKategori: 'bakery',        sorgu: '"shop"="bakery"',        label: 'Fırın'      },
  { altKategori: 'shopping_mall', sorgu: '"shop"="mall"',          label: 'AVM'        },
  { altKategori: 'night_club',    sorgu: '"amenity"="nightclub"',  label: 'Gece Kulübü'},
]

function boundingBox(lat: number, lng: number, km = 0.6): string {
  const dLat = km / 111
  const dLng = km / (111 * Math.cos(lat * Math.PI / 180))
  return `${lat - dLat},${lng - dLng},${lat + dLat},${lng + dLng}`
}

async function main() {
  console.log('OSM\'den eksik imkanlar çekiliyor...\n')
  console.log('Kategoriler: bar, bakery, shopping_mall, night_club\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, slug, koordinat_lat, koordinat_lng, ilce:ilce_id(isim, slug)')
    .not('koordinat_lat', 'is', null)
    .not('koordinat_lng', 'is', null)
    .order('isim')

  if (!mahalleler?.length) { console.error('Koordinatlı mahalle bulunamadı'); return }
  console.log(`${mahalleler.length} mahalle işlenecek\n`)

  let toplamEklenen = 0
  let toplamHata    = 0

  for (const mahalle of mahalleler) {
    const lat  = mahalle.koordinat_lat as number
    const lng  = mahalle.koordinat_lng as number
    const bbox = boundingBox(lat, lng, 0.6)
    const ilceIsim = (mahalle.ilce as any)?.isim || ''

    process.stdout.write(`\n${ilceIsim} / ${mahalle.isim}: `)

    const yeniTesisler: any[] = []

    for (const kat of OSM_KATEGORILER) {
      const { count } = await supabase
        .from('mahalle_tesisler')
        .select('id', { count: 'exact', head: true })
        .eq('mahalle_id', mahalle.id)
        .eq('kategori', 'imkanlar')
        .eq('alt_kategori', kat.altKategori)

      if ((count || 0) > 0) {
        process.stdout.write(`${kat.label}✓ `)
        continue
      }

      const query = `
        [out:json][timeout:30];
        (
          node[${kat.sorgu}](${bbox});
          way[${kat.sorgu}](${bbox});
        );
        out center;
      `

      await new Promise(r => setTimeout(r, 1000))
      const elements = await overpassSorgu(query)

      for (const el of elements) {
        const k = koordinatAl(el)
        if (!k) continue
        yeniTesisler.push({
          mahalle_id:   mahalle.id,
          kategori:     'imkanlar',
          alt_kategori: kat.altKategori,
          isim:         el.tags?.name || el.tags?.['name:tr'] || null,
          lat:          k.lat,
          lng:          k.lng,
          kaynak:       'osm',
        })
      }

      process.stdout.write(`${kat.label}:${elements.length} `)
    }

    if (yeniTesisler.length > 0) {
      for (let i = 0; i < yeniTesisler.length; i += 100) {
        const { error } = await supabase
          .from('mahalle_tesisler')
          .insert(yeniTesisler.slice(i, i + 100))
        if (error) {
          toplamHata++
          console.error(`\n  ✗ Kayıt hatası:`, error.message)
        } else {
          toplamEklenen += Math.min(100, yeniTesisler.length - i)
        }
      }
    }
  }

  console.log(`\n\n✅ Tamamlandı!`)
  console.log(`  Eklenen: ${toplamEklenen} tesis`)
  console.log(`  Hata: ${toplamHata}`)

  const { data: ozet } = await supabase
    .from('mahalle_tesisler')
    .select('alt_kategori')
    .in('alt_kategori', ['bar', 'bakery', 'shopping_mall', 'night_club'])
  const sayilar: Record<string, number> = {}
  ozet?.forEach(t => { sayilar[t.alt_kategori] = (sayilar[t.alt_kategori] || 0) + 1 })
  console.log('\nKategori bazlı toplam (tüm DB):')
  Object.entries(sayilar).forEach(([k, v]) => console.log(`  ${k}: ${v}`))
}

main().catch(console.error)
