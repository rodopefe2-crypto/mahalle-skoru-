import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Türkçe büyük/küçük harf dahil normalize
function norm(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .replace(/İ/g, 'i').replace(/I/g, 'i')   // büyük Turkish I önce
    .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
    .replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/i̇/g, 'i')                        // combining dot
    .replace(/\s*(mahalle(si)?|mah\.?)\s*$/i, '')
    .trim()
}

async function main() {
  console.log('Mahalle poligonları yükleniyor...\n')

  const geojson = JSON.parse(
    fs.readFileSync('/tmp/istanbul_mahalleler_fixed.geojson', 'utf8')
  )
  console.log(`${geojson.features.length} GeoJSON feature`)

  // DB'den tüm mahalleleri + ilçeleri çek
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id')
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim')

  if (!mahalleler || !ilceler) { console.error('DB verisi alınamadı'); return }
  console.log(`DB: ${mahalleler.length} mahalle, ${ilceler.length} ilçe\n`)

  const ilceMap = new Map(ilceler.map(i => [norm(i.isim), i.id]))
  // (normIsim|ilceId) → mahalle
  const mahMap = new Map(mahalleler.map(m => [norm(m.isim) + '|' + m.ilce_id, m]))
  // sadece norm isim → mahalleler listesi (ilçesiz fallback)
  const mahByIsim = new Map<string, typeof mahalleler>()
  for (const m of mahalleler) {
    const k = norm(m.isim)
    if (!mahByIsim.has(k)) mahByIsim.set(k, [])
    mahByIsim.get(k)!.push(m)
  }

  let eslesen = 0, eslesmeyen = 0
  const eslesemeyenler: string[] = []
  const batch: { id: string; geom: string }[] = []

  for (const feature of geojson.features) {
    const props    = feature.properties
    const addr     = props.address || {}
    const dispParts = (props.display_name || '').split(',')

    // Mahalle ismi: display_name[0] en güvenilir
    const rawMah = dispParts[0]?.trim() || addr.city || ''
    // İlçe: display_name[1] eğer İstanbul değilse, yoksa address alanları
    const dp1 = dispParts[1]?.trim() || ''
    const dp1Norm = norm(dp1)
    const rawIlce = (dp1Norm && dp1Norm !== 'istanbul' && dp1Norm !== 'marmara')
      ? dp1
      : (addr.suburb || addr.town || addr.city_district || addr.village || addr.archipelago || '')

    const normMah  = norm(rawMah)
    const normIlce = norm(rawIlce)
    if (!normMah) continue

    const ilceId = ilceMap.get(normIlce)
    let mahalle = ilceId ? mahMap.get(normMah + '|' + ilceId) : undefined

    // Fallback: sadece isim ile eşleş (tek eşleşme varsa)
    if (!mahalle) {
      const candidates = mahByIsim.get(normMah)
      if (candidates?.length === 1) mahalle = candidates[0]
    }

    if (!mahalle) {
      eslesmeyen++
      if (eslesemeyenler.length < 15) eslesemeyenler.push(`${rawMah} / ${rawIlce}`)
      continue
    }

    batch.push({ id: mahalle.id, geom: JSON.stringify(feature.geometry) })
  }

  console.log(`Eşleşen: ${batch.length} | Eşleşmeyen: ${eslesmeyen}`)
  if (eslesemeyenler.length) {
    console.log('Eşleşmeyen örnekler:')
    eslesemeyenler.forEach(e => console.log('  -', e))
  }

  // RPC ile yükle
  console.log('\nPoligonlar yükleniyor...')
  let yuklenen = 0, hata = 0
  for (const { id, geom } of batch) {
    const { error } = await supabase.rpc('update_mahalle_boundary', {
      p_mahalle_id: id,
      p_geometry:   geom,
    })
    if (error) {
      hata++
      if (hata <= 3) console.error(`  ✗ ${id}:`, error.message)
    } else {
      yuklenen++
      if (yuklenen % 100 === 0) process.stdout.write(`\r  ${yuklenen}/${batch.length} yüklendi...`)
    }
  }

  console.log(`\n\n✅ Tamamlandı!`)
  console.log(`  Yüklenen: ${yuklenen}`)
  console.log(`  Hatalı:   ${hata}`)
  console.log(`  Eşleşmeyen: ${eslesmeyen}`)
}

main().catch(console.error)
