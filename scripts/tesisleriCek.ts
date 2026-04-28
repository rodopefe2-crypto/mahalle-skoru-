import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { queryOverpass } from '../lib/overpass'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ilceListesi = [
  { name: 'Beşiktaş', relationId: '1765893' },
  { name: 'Şişli',    relationId: '1765896' },
  { name: 'Kağıthane',relationId: '1765894' },
  { name: 'Sarıyer',  relationId: '1765895' },
  { name: 'Beyoğlu',  relationId: '1765892' },
]

interface Tesis {
  isim: string | null
  alt_kategori: string
  lat: number
  lng: number
  osm_id: number
}

const kategoriler = {
  egitim: {
    query: (relId: string) => `
      [out:json][timeout:60];
      rel(${relId});
      map_to_area->.ilce;
      (
        node["amenity"="school"](area.ilce);
        node["amenity"="university"](area.ilce);
        node["amenity"="kindergarten"](area.ilce);
        node["amenity"="college"](area.ilce);
        way["amenity"="school"](area.ilce);
        way["amenity"="university"](area.ilce);
      );
      out center;
    `,
    altKategoriler: ['school', 'university', 'kindergarten', 'college']
  },
  saglik: {
    query: (relId: string) => `
      [out:json][timeout:60];
      rel(${relId});
      map_to_area->.ilce;
      (
        node["amenity"="hospital"](area.ilce);
        node["amenity"="clinic"](area.ilce);
        node["amenity"="doctors"](area.ilce);
        node["amenity"="pharmacy"](area.ilce);
        way["amenity"="hospital"](area.ilce);
      );
      out center;
    `,
    altKategoriler: ['hospital', 'clinic', 'doctors', 'pharmacy']
  },
  ulasim: {
    query: (relId: string) => `
      [out:json][timeout:60];
      rel(${relId});
      map_to_area->.ilce;
      (
        node["railway"="subway_entrance"](area.ilce);
        node["railway"="station"](area.ilce);
        node["highway"="bus_stop"](area.ilce);
        node["amenity"="ferry_terminal"](area.ilce);
        node["railway"="tram_stop"](area.ilce);
      );
      out center;
    `,
    altKategoriler: ['subway_entrance', 'station', 'bus_stop', 'ferry_terminal', 'tram_stop']
  },
}

function parseTesisler(data: any, kategoriAdi: string): Tesis[] {
  const tesisler: Tesis[] = []
  const alts = kategoriler[kategoriAdi as keyof typeof kategoriler].altKategoriler

  for (const el of data.elements) {
    let lat: number, lng: number
    if (el.type === 'node') {
      lat = el.lat; lng = el.lon
    } else if (el.type === 'way' && el.center) {
      lat = el.center.lat; lng = el.center.lon
    } else continue

    const tags = el.tags || {}
    const isim = tags.name || null
    let alt_kategori = kategoriAdi

    for (const field of ['amenity', 'shop', 'leisure', 'railway', 'highway']) {
      if (tags[field] && alts.includes(tags[field])) {
        alt_kategori = tags[field]; break
      }
    }

    tesisler.push({ isim, alt_kategori, lat, lng, osm_id: el.id })
  }
  return tesisler
}

async function main() {
  console.log('OSM tesis verisi çekiliyor...\n')

  for (const ilce of ilceListesi) {
    console.log(`\n── ${ilce.name} ──────────────────`)

    const { data: ilceRow, error: ilceErr } = await supabase
      .from('ilceler').select('id').eq('isim', ilce.name).single()

    if (ilceErr || !ilceRow) {
      console.error(`  HATA: ${ilceErr?.message}`); continue
    }

    for (const kategoriAdi of Object.keys(kategoriler) as (keyof typeof kategoriler)[]) {
      console.log(`  ${kategoriAdi}...`)
      try {
        const data = await queryOverpass(kategoriler[kategoriAdi].query(ilce.relationId))
        const tesisler = parseTesisler(data, kategoriAdi)

        // Sadece OSM kaynağındaki verileri sil (Foursquare'e dokunma)
        await supabase.from('ilce_tesisler')
          .delete()
          .eq('ilce_id', ilceRow.id)
          .eq('kategori', kategoriAdi)
          .or('kaynak.eq.osm,kaynak.is.null')

        if (tesisler.length === 0) { console.log(`    0 tesis`); continue }

        const rows = tesisler.map(t => ({
          ilce_id: ilceRow.id,
          kategori: kategoriAdi,
          alt_kategori: t.alt_kategori,
          isim: t.isim,
          lat: t.lat,
          lng: t.lng,
          osm_id: t.osm_id,
          kaynak: 'osm',
        }))

        const GRUP = 100
        let eklenen = 0
        for (let i = 0; i < rows.length; i += GRUP) {
          const { error } = await supabase.from('ilce_tesisler').insert(rows.slice(i, i + GRUP))
          if (!error) eklenen += Math.min(GRUP, rows.length - i)
        }
        console.log(`    ✓ ${eklenen} tesis eklendi`)
      } catch (err: any) {
        console.error(`    Hata: ${err.message}`)
      }
      await new Promise(r => setTimeout(r, 500))
    }
  }
  console.log('\nTamamlandı!')
}

main().catch(err => { console.error(err); process.exit(1) })
