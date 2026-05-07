import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function mesafe(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

async function fetchAllPages<T>(
  queryFn: (from: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const results: T[] = []
  let from = 0
  const size = 1000
  while (true) {
    const { data, error } = await queryFn(from)
    if (error) { console.error('Sayfalama hatası:', error.message); break }
    if (!data || data.length === 0) break
    results.push(...data)
    if (data.length < size) break
    from += size
  }
  return results
}

async function main() {
  console.log('OSM sağlık/eğitim verisi mahallelere atanıyor (3km radius)...\n')

  process.stdout.write('OSM tesisler çekiliyor...')
  const osmTesisler = await fetchAllPages((from) =>
    supabase
      .from('ilce_tesisler')
      .select('id, kategori, alt_kategori, isim, lat, lng')
      .in('kategori', ['saglik', 'egitim'])
      .eq('kaynak', 'osm')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .range(from, from + 999) as any
  )

  if (!osmTesisler.length) { console.error('\nOSM tesis verisi bulunamadı'); return }
  console.log(` ${osmTesisler.length} tesis bulundu`)

  process.stdout.write('Mahalleler çekiliyor...')
  const mahalleler = await fetchAllPages((from) =>
    supabase
      .from('mahalleler')
      .select('id, isim, koordinat_lat, koordinat_lng')
      .not('koordinat_lat', 'is', null)
      .not('koordinat_lng', 'is', null)
      .range(from, from + 999) as any
  )

  if (!mahalleler.length) { console.error('\nMahalle bulunamadı'); return }
  console.log(` ${mahalleler.length} mahalle bulundu`)

  console.log('\nMevcut OSM sağlık/eğitim kayıtları temizleniyor...')
  const { error: delErr } = await supabase
    .from('mahalle_tesisler')
    .delete()
    .in('kategori', ['saglik', 'egitim'])
    .eq('kaynak', 'osm')
  if (delErr) console.error('Silme hatası:', delErr.message)
  else console.log('  ✓ Temizlendi')

  const RADIUS_KM = 3.0
  const yeniKayitlar: any[] = []
  // Duplicate önleme: mahalle_id + isim + alt_kategori
  const seen = new Set<string>()

  let islenen = 0
  for (const tesis of osmTesisler) {
    // 3km içindeki TÜM mahalleleri bul
    const yakinMahalleler = (mahalleler as any[]).filter(m => {
      const km = mesafe(tesis.lat, tesis.lng, m.koordinat_lat, m.koordinat_lng)
      return km <= RADIUS_KM
    })

    for (const mahalle of yakinMahalleler) {
      const key = `${mahalle.id}|${tesis.alt_kategori}|${tesis.isim || ''}`
      if (seen.has(key)) continue
      seen.add(key)

      yeniKayitlar.push({
        mahalle_id:   mahalle.id,
        kategori:     tesis.kategori,
        alt_kategori: tesis.alt_kategori,
        isim:         tesis.isim,
        lat:          tesis.lat,
        lng:          tesis.lng,
        kaynak:       'osm',
      })
    }

    islenen++
    if (islenen % 500 === 0) {
      process.stdout.write(`\r  İşlenen: ${islenen}/${osmTesisler.length} tesis, ${yeniKayitlar.length} kayıt birikti`)
    }
  }
  console.log(`\n\nToplam ${yeniKayitlar.length} kayıt oluşturuldu (${osmTesisler.length} tesis → 3km içi mahalleler)`)

  console.log('\nSupabase\'e yazılıyor...')
  let eklenen = 0

  for (let i = 0; i < yeniKayitlar.length; i += 100) {
    const batch = yeniKayitlar.slice(i, i + 100)
    const { error } = await supabase.from('mahalle_tesisler').insert(batch)
    if (error) {
      console.error(`Hata (batch ${i}):`, error.message)
    } else {
      eklenen += batch.length
    }
    if (eklenen % 2000 === 0) process.stdout.write(`\r  Yazılan: ${eklenen}/${yeniKayitlar.length}`)
  }

  console.log(`\n\n✅ ${eklenen} tesis mahallelere atandı!`)

  // Kategori özeti
  const sayilar: Record<string, number> = {}
  yeniKayitlar.forEach(t => {
    const key = `${t.kategori}/${t.alt_kategori}`
    sayilar[key] = (sayilar[key] || 0) + 1
  })
  console.log('\nKategori özeti:')
  Object.entries(sayilar)
    .sort(([, a], [, b]) => b - a)
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`))
}

main().catch(console.error)
