import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchAll<T>(fn: (from: number) => any): Promise<T[]> {
  const results: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await fn(from)
    if (error) { console.error(error.message); break }
    if (!data?.length) break
    results.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  return results
}

async function main() {
  // ── İsimli duplicate'ler ──────────────────────────────
  console.log('İsimli kayıtlar çekiliyor...')
  const kayitlar = await fetchAll<any>(from =>
    sb.from('mahalle_tesisler')
      .select('id, mahalle_id, kategori, alt_kategori, isim')
      .eq('kaynak', 'osm')
      .in('kategori', ['saglik', 'egitim'])
      .not('isim', 'is', null)
      .range(from, from + 999)
  )
  console.log(`Toplam isimli kayıt: ${kayitlar.length}`)

  // Grup: mahalle_id + kategori + alt_kategori + isim → min id kalsın
  const grupMap = new Map<string, { minId: string; ids: string[] }>()
  for (const k of kayitlar) {
    const key = `${k.mahalle_id}|${k.kategori}|${k.alt_kategori}|${k.isim}`
    if (!grupMap.has(key)) grupMap.set(key, { minId: k.id, ids: [] })
    const g = grupMap.get(key)!
    if (k.id < g.minId) g.minId = k.id
    g.ids.push(k.id)
  }

  const silinecek = [...grupMap.values()]
    .flatMap(g => g.ids.filter(id => id !== g.minId))
  console.log(`Silinecek duplicate (isimli): ${silinecek.length}`)

  // Batch delete
  let silinen = 0
  const BATCH = 100
  for (let i = 0; i < silinecek.length; i += BATCH) {
    const batch = silinecek.slice(i, i + BATCH)
    const { error } = await sb.from('mahalle_tesisler')
      .delete()
      .in('id', batch)
    if (error) console.error('Silme hatası:', error.message)
    silinen += batch.length
    if (silinen % 1000 === 0) process.stdout.write(`\r  ${silinen}/${silinecek.length}`)
  }
  console.log(`\r  ✅ ${silinen} isimli duplicate silindi`)

  // ── NULL isimli koordinat bazlı duplicate'ler ─────────
  console.log('\nNULL isimli kayıtlar çekiliyor...')
  const nullKayitlar = await fetchAll<any>(from =>
    sb.from('mahalle_tesisler')
      .select('id, mahalle_id, kategori, alt_kategori, lat, lng')
      .eq('kaynak', 'osm')
      .in('kategori', ['saglik', 'egitim'])
      .is('isim', null)
      .range(from, from + 999)
  )
  console.log(`Toplam NULL isimli kayıt: ${nullKayitlar.length}`)

  // Koordinat tabanlı gruplama (0.0001 derece ≈ 11m)
  const nullGrupMap = new Map<string, { minId: string; ids: string[] }>()
  for (const k of nullKayitlar) {
    const latK = Math.round(k.lat / 0.0001)
    const lngK = Math.round(k.lng / 0.0001)
    const key = `${k.mahalle_id}|${k.kategori}|${k.alt_kategori}|${latK}|${lngK}`
    if (!nullGrupMap.has(key)) nullGrupMap.set(key, { minId: k.id, ids: [] })
    const g = nullGrupMap.get(key)!
    if (k.id < g.minId) g.minId = k.id
    g.ids.push(k.id)
  }

  const nullSilinecek = [...nullGrupMap.values()]
    .flatMap(g => g.ids.filter(id => id !== g.minId))
  console.log(`Silinecek duplicate (NULL isimli): ${nullSilinecek.length}`)

  let nullSilinen = 0
  for (let i = 0; i < nullSilinecek.length; i += BATCH) {
    const batch = nullSilinecek.slice(i, i + BATCH)
    const { error } = await sb.from('mahalle_tesisler').delete().in('id', batch)
    if (error) console.error('Silme hatası:', error.message)
    nullSilinen += batch.length
  }
  console.log(`  ✅ ${nullSilinen} NULL isimli duplicate silindi`)

  // ── Kontrol ───────────────────────────────────────────
  const { count } = await sb.from('mahalle_tesisler')
    .select('*', { count: 'exact', head: true })
    .eq('kaynak', 'osm')
    .in('kategori', ['saglik', 'egitim'])
  console.log(`\n✅ Kalan OSM sağlık/eğitim kayıt: ${count}`)
}

main().catch(console.error)
