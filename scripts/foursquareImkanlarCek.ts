import { Database } from 'duckdb-async'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HF_TOKEN = process.env.HF_TOKEN
if (!HF_TOKEN) {
  console.error('HATA: HF_TOKEN .env.local dosyasında bulunamadı!')
  process.exit(1)
}

// İlçe bounding box'ları — tüm 39 ilçe
const ILCELER = [
  // Mevcut 5 ilçe
  { slug: 'besiktas',      lat_min: 41.010, lat_max: 41.080, lng_min: 28.960, lng_max: 29.080 },
  { slug: 'sisli',         lat_min: 41.030, lat_max: 41.090, lng_min: 28.950, lng_max: 29.030 },
  { slug: 'kagithane',     lat_min: 41.055, lat_max: 41.115, lng_min: 28.930, lng_max: 29.020 },
  { slug: 'sariyer',       lat_min: 41.090, lat_max: 41.260, lng_min: 28.970, lng_max: 29.140 },
  { slug: 'beyoglu',       lat_min: 41.015, lat_max: 41.060, lng_min: 28.950, lng_max: 29.010 },
  // Yeni ilçeler — Avrupa Yakası
  { slug: 'eyupsultan',    lat_min: 41.020, lat_max: 41.100, lng_min: 28.880, lng_max: 28.960 },
  { slug: 'gaziosmanpasa', lat_min: 41.040, lat_max: 41.090, lng_min: 28.880, lng_max: 28.940 },
  { slug: 'bayrampasa',    lat_min: 41.030, lat_max: 41.065, lng_min: 28.890, lng_max: 28.940 },
  { slug: 'fatih',         lat_min: 40.990, lat_max: 41.045, lng_min: 28.910, lng_max: 28.980 },
  { slug: 'zeytinburnu',   lat_min: 40.980, lat_max: 41.015, lng_min: 28.880, lng_max: 28.930 },
  { slug: 'bakirkoy',      lat_min: 40.960, lat_max: 41.005, lng_min: 28.840, lng_max: 28.910 },
  { slug: 'bahcelievler',  lat_min: 40.980, lat_max: 41.025, lng_min: 28.830, lng_max: 28.890 },
  { slug: 'bagcilar',      lat_min: 41.020, lat_max: 41.060, lng_min: 28.820, lng_max: 28.890 },
  { slug: 'gungoren',      lat_min: 41.000, lat_max: 41.040, lng_min: 28.850, lng_max: 28.910 },
  { slug: 'esenler',       lat_min: 41.020, lat_max: 41.065, lng_min: 28.830, lng_max: 28.900 },
  { slug: 'sultangazi',    lat_min: 41.070, lat_max: 41.130, lng_min: 28.840, lng_max: 28.920 },
  { slug: 'kucukcekmece',  lat_min: 40.970, lat_max: 41.030, lng_min: 28.740, lng_max: 28.830 },
  { slug: 'avcilar',       lat_min: 40.950, lat_max: 41.010, lng_min: 28.680, lng_max: 28.760 },
  { slug: 'buyukcekmece',  lat_min: 40.990, lat_max: 41.060, lng_min: 28.540, lng_max: 28.640 },
  { slug: 'esenyurt',      lat_min: 41.000, lat_max: 41.070, lng_min: 28.630, lng_max: 28.730 },
  { slug: 'beylikduzu',    lat_min: 40.970, lat_max: 41.030, lng_min: 28.610, lng_max: 28.700 },
  { slug: 'basaksehir',    lat_min: 41.060, lat_max: 41.130, lng_min: 28.760, lng_max: 28.860 },
  { slug: 'arnavutkoy',    lat_min: 41.140, lat_max: 41.260, lng_min: 28.680, lng_max: 28.820 },
  { slug: 'silivri',       lat_min: 41.030, lat_max: 41.130, lng_min: 28.180, lng_max: 28.330 },
  { slug: 'catalca',       lat_min: 41.090, lat_max: 41.220, lng_min: 28.380, lng_max: 28.560 },
  // Anadolu Yakası
  { slug: 'uskudar',       lat_min: 40.990, lat_max: 41.060, lng_min: 29.000, lng_max: 29.090 },
  { slug: 'kadikoy',       lat_min: 40.960, lat_max: 41.010, lng_min: 29.050, lng_max: 29.130 },
  { slug: 'atasehir',      lat_min: 40.970, lat_max: 41.030, lng_min: 29.090, lng_max: 29.170 },
  { slug: 'umraniye',      lat_min: 40.990, lat_max: 41.060, lng_min: 29.090, lng_max: 29.180 },
  { slug: 'maltepe',       lat_min: 40.900, lat_max: 40.970, lng_min: 29.100, lng_max: 29.190 },
  { slug: 'kartal',        lat_min: 40.860, lat_max: 40.930, lng_min: 29.150, lng_max: 29.240 },
  { slug: 'pendik',        lat_min: 40.840, lat_max: 40.940, lng_min: 29.190, lng_max: 29.330 },
  { slug: 'tuzla',         lat_min: 40.780, lat_max: 40.860, lng_min: 29.260, lng_max: 29.380 },
  { slug: 'sultanbeyli',   lat_min: 40.930, lat_max: 40.990, lng_min: 29.220, lng_max: 29.320 },
  { slug: 'sancaktepe',    lat_min: 40.970, lat_max: 41.040, lng_min: 29.180, lng_max: 29.290 },
  { slug: 'cekmekoy',      lat_min: 41.010, lat_max: 41.090, lng_min: 29.150, lng_max: 29.250 },
  { slug: 'beykoz',        lat_min: 41.060, lat_max: 41.220, lng_min: 29.040, lng_max: 29.200 },
  { slug: 'sile',          lat_min: 41.130, lat_max: 41.230, lng_min: 29.530, lng_max: 29.700 },
  { slug: 'adalar',        lat_min: 40.840, lat_max: 40.920, lng_min: 29.040, lng_max: 29.140 },
]

// Foursquare kategori etiketinden alt_kategori tespiti
function kategoriTespitEt(labels: string[]): string | null {
  const s = labels.join(' ').toLowerCase()
  if (s.includes('grocery') || s.includes('supermarket')) return 'market'
  if (s.includes('coffee') || s.includes('café') || s.includes('cafe')) return 'cafe'
  if (s.includes('restaurant') || s.includes('fast food') || s.includes('burger') || s.includes('pizza')) return 'restoran'
  if (s.includes('pharmacy') || s.includes('drug store') || s.includes('eczane')) return 'eczane'
  if (s.includes('park') || s.includes('garden') || s.includes('playground')) return 'park'
  if (s.includes('bakery') || s.includes('pastry')) return 'firın'
  if (s.includes('convenience') || s.includes('mini mart')) return 'market'
  if (s.includes('bar') || s.includes('pub') || s.includes('nightclub')) return 'bar'
  if (s.includes('gym') || s.includes('fitness')) return 'spor'
  return null
}

async function main() {
  console.log('Foursquare FSQ OS Places verisi çekiliyor...\n')

  const db = await Database.create(':memory:')
  const conn = await db.connect()

  // HuggingFace erişimi için secret tanımla
  await conn.run(`
    CREATE SECRET hf_secret (
      TYPE HUGGINGFACE,
      TOKEN '${HF_TOKEN}'
    );
  `)

  // Güncel Foursquare Parquet dosya yolu
  const FSQ_URL = `hf://datasets/foursquare/fsq-os-places/release/dt=2026-03-18/places/parquet/*.parquet`

  for (const ilce of ILCELER) {
    console.log(`\n── ${ilce.slug} ──────────────────`)

    // Supabase'den ilce_id al
    const { data: ilceRow, error: ilceErr } = await supabase
      .from('ilceler')
      .select('id, isim')
      .eq('slug', ilce.slug)
      .single()

    if (ilceErr || !ilceRow) {
      console.error(`  HATA: Supabase'de bulunamadı — ${ilceErr?.message}`)
      continue
    }

    console.log(`  İlçe: ${ilceRow.isim} (${ilceRow.id})`)

    try {
      // DuckDB ile Parquet'tan bbox filtreleyerek çek
      // Tüm dosyayı indirmez, sadece ilgili satırları okur
      console.log(`  Foursquare'e sorgu atılıyor...`)

      const rows = await conn.all(`
        SELECT
          name,
          latitude,
          longitude,
          fsq_place_id,
          fsq_category_labels
        FROM read_parquet('${FSQ_URL}')
        WHERE
          country = 'TR'
          AND latitude  BETWEEN ${ilce.lat_min} AND ${ilce.lat_max}
          AND longitude BETWEEN ${ilce.lng_min} AND ${ilce.lng_max}
          AND fsq_category_labels IS NOT NULL
        LIMIT 2000
      `)

      console.log(`  Ham kayıt: ${rows.length}`)

      // Kategorize et, null olanları at
      const tesisler = rows
        .map((row: any) => {
          const labels: string[] = row.fsq_category_labels ?? []
          const altKategori = kategoriTespitEt(labels)
          if (!altKategori) return null
          return {
            ilce_id:      ilceRow.id,
            kategori:     'imkanlar',
            alt_kategori: altKategori,
            isim:         row.name ?? null,
            lat:          row.latitude,
            lng:          row.longitude,
            osm_id:       null,
            kaynak:       'foursquare',
          }
        })
        .filter(Boolean)

      console.log(`  Kategorize edildi: ${tesisler.length} tesis`)
      if (tesisler.length === 0) {
        console.warn(`  Uyarı: Kategorize edilecek tesis bulunamadı`)
        continue
      }

      // Eski imkanlar verisini sil
      const { error: silErr } = await supabase
        .from('ilce_tesisler')
        .delete()
        .eq('ilce_id', ilceRow.id)
        .eq('kategori', 'imkanlar')

      if (silErr) {
        console.error(`  Silme hatası: ${silErr.message}`)
        continue
      }

      // 100'erli gruplar halinde Supabase'e ekle
      let eklenen = 0
      const GRUP = 100
      for (let i = 0; i < tesisler.length; i += GRUP) {
        const { error: ekleErr } = await supabase
          .from('ilce_tesisler')
          .insert(tesisler.slice(i, i + GRUP))

        if (ekleErr) {
          console.error(`  Ekleme hatası (grup ${i}): ${ekleErr.message}`)
        } else {
          eklenen += Math.min(GRUP, tesisler.length - i)
        }
      }

      console.log(`  ✓ ${eklenen} tesis eklendi`)

    } catch (err: any) {
      console.error(`  DuckDB hatası: ${err.message}`)
      console.error(`  Tam hata:`, err)
    }

    // Sonraki ilçe için kısa bekleme
    await new Promise(r => setTimeout(r, 1000))
  }

  await conn.close()
  await db.close()

  console.log('\n\nTamamlandı!')
  console.log('Supabase\'de ilce_tesisler tablosunu kontrol et.')
  console.log('kaynak = "foursquare" olan kayıtlar görünmeli.')
}

main().catch(err => {
  console.error('Script hatası:', err)
  process.exit(1)
})