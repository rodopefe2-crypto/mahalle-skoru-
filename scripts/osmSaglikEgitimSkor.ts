import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LN_MIN_KIRA = Math.log(16717)
const LN_MAX_KIRA = Math.log(64454)

function kiraLogSkor(kira: number | null): number {
  const k = Math.max(kira && kira > 0 ? kira : 25000, 1)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN_KIRA) / (LN_MAX_KIRA - LN_MIN_KIRA) * 100))
}

async function fetchAll<T>(queryFn: (from: number) => any): Promise<T[]> {
  const results: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await queryFn(from)
    if (error) { console.error('Sayfalama hatası:', error.message); break }
    if (!data || data.length === 0) break
    results.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  return results
}

async function main() {
  // ── 1. OSM sağlık/eğitim tesislerini çek ──────────────────
  console.log('1. OSM tesisler çekiliyor...')
  const osmTesisler = await fetchAll<any>((from) =>
    supabase
      .from('mahalle_tesisler')
      .select('mahalle_id, alt_kategori')
      .in('kategori', ['saglik', 'egitim'])
      .eq('kaynak', 'osm')
      .range(from, from + 999)
  )
  console.log(`   ${osmTesisler.length} OSM tesis kaydı`)

  // ── 2. Mahalleleri çek ────────────────────────────────────
  console.log('2. Mahalleler çekiliyor...')
  const mahalleler = await fetchAll<any>((from) =>
    supabase
      .from('mahalleler')
      .select('id, kira_ortalama, guvenlik_skoru, imkanlar_skoru, ulasim_skoru, yesil_alan_skoru, kultur_skoru')
      .range(from, from + 999)
  )
  console.log(`   ${mahalleler.length} mahalle`)

  // ── 3. Mahalle başına tesis sayısı ───────────────────────
  type TesisSay = {
    hospital: number; clinic: number; pharmacy: number; dentist: number; doctors: number
    university: number; college: number; school: number; kindergarten: number; library: number
  }
  const tesisByMahalle = new Map<string, TesisSay>()
  for (const t of osmTesisler) {
    if (!tesisByMahalle.has(t.mahalle_id)) {
      tesisByMahalle.set(t.mahalle_id, {
        hospital:0, clinic:0, pharmacy:0, dentist:0, doctors:0,
        university:0, college:0, school:0, kindergarten:0, library:0,
      })
    }
    const s = tesisByMahalle.get(t.mahalle_id)!
    if (t.alt_kategori in s) (s as any)[t.alt_kategori]++
  }

  // ── 4. Ham puanlar ────────────────────────────────────────
  const saglikHam = new Map<string, number>()
  const egitimHam = new Map<string, number>()

  for (const [id, t] of tesisByMahalle) {
    const saglik =
      Math.min(t.hospital,    3) * 10 +
      Math.min(t.clinic,      5) * 5  +
      Math.min(t.pharmacy,    8) * 3  +
      Math.min(t.dentist,     5) * 2  +
      Math.min(t.doctors,     5) * 2
    const egitim =
      Math.min(t.university,   2) * 20 +
      Math.min(t.college,      2) * 15 +
      Math.min(t.school,      10) * 5  +
      Math.min(t.kindergarten, 5) * 3  +
      Math.min(t.library,      3) * 4
    saglikHam.set(id, saglik)
    egitimHam.set(id, egitim)
  }

  // ── 5. Normalize [20-100] ─────────────────────────────────
  const saglikVals = [...saglikHam.values()].filter(v => v > 0)
  const egitimVals = [...egitimHam.values()].filter(v => v > 0)
  const saglikMin = Math.min(...saglikVals), saglikMax = Math.max(...saglikVals)
  const egitimMin = Math.min(...egitimVals), egitimMax = Math.max(...egitimVals)

  console.log(`\n   Sağlık ham: min=${saglikMin} max=${saglikMax}`)
  console.log(`   Eğitim ham: min=${egitimMin} max=${egitimMax}`)

  function normalize(val: number, mn: number, mx: number): number {
    if (val <= 0) return 20
    if (mx === mn) return 60
    return Math.round(20 + (val - mn) / (mx - mn) * 80)
  }

  // ── 6. Mahalle güncellemeleri ─────────────────────────────
  console.log('\n3. Mahalle skorları güncelleniyor...')
  const updates: any[] = []

  for (const m of mahalleler) {
    const saglikRaw = saglikHam.get(m.id) ?? 0
    const egitimRaw = egitimHam.get(m.id) ?? 0

    const saglik_skoru = normalize(saglikRaw, saglikMin, saglikMax)
    const egitim_skoru = normalize(egitimRaw, egitimMin, egitimMax)

    const kiraSkor = kiraLogSkor(m.kira_ortalama)
    const genel_skor = Math.min(100, Math.round(
      kiraSkor                         * 0.200 +
      (m.guvenlik_skoru  || 50)        * 0.200 +
      (m.imkanlar_skoru  || 0)         * 0.200 +
      (m.ulasim_skoru    || 0)         * 0.200 +
      egitim_skoru                     * 0.075 +
      saglik_skoru                     * 0.075 +
      (m.yesil_alan_skoru || 0)        * 0.025 +
      (m.kultur_skoru     || 0)        * 0.025
    ))

    updates.push({ id: m.id, saglik_skoru, egitim_skoru, genel_skor })
  }

  let n = 0
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50)
    await Promise.all(batch.map(u =>
      supabase.from('mahalleler')
        .update({ saglik_skoru: u.saglik_skoru, egitim_skoru: u.egitim_skoru, genel_skor: u.genel_skor })
        .eq('id', u.id)
    ))
    n += batch.length
    if (n % 200 === 0) process.stdout.write(`\r   ${n}/${updates.length}`)
  }
  console.log(`\r   ✅ ${n} mahalle güncellendi`)

  // ── 7. İlçe ortalamalarını güncelle ──────────────────────
  console.log('\n4. İlçe skorları güncelleniyor...')
  const ilceler = await fetchAll<any>((from) =>
    supabase.from('ilceler').select('id').range(from, from + 999)
  )

  const mahalleFull = await fetchAll<any>((from) =>
    supabase
      .from('mahalleler')
      .select('ilce_id, saglik_skoru, egitim_skoru, genel_skor')
      .gt('genel_skor', 0)
      .range(from, from + 999)
  )

  const ilceAgg = new Map<string, { saglik: number[]; egitim: number[]; genel: number[] }>()
  for (const m of mahalleFull) {
    if (!ilceAgg.has(m.ilce_id)) ilceAgg.set(m.ilce_id, { saglik: [], egitim: [], genel: [] })
    const a = ilceAgg.get(m.ilce_id)!
    if (m.saglik_skoru > 0) a.saglik.push(m.saglik_skoru)
    if (m.egitim_skoru > 0) a.egitim.push(m.egitim_skoru)
    if (m.genel_skor   > 0) a.genel.push(m.genel_skor)
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

  for (const [ilceId, agg] of ilceAgg) {
    await supabase.from('ilceler').update({
      saglik_skoru: avg(agg.saglik),
      egitim_skoru: avg(agg.egitim),
      genel_skor:   avg(agg.genel),
    }).eq('id', ilceId)
  }
  console.log(`   ✅ ${ilceAgg.size} ilçe güncellendi`)

  // ── 8. Kontrol ─────────────────────────────────────────────
  console.log('\n── Kontrol: Beşiktaş / Kadıköy / Fatih mahalleleri ──────')
  const { data: kontrol } = await supabase
    .from('mahalleler')
    .select(`
      isim, saglik_skoru, egitim_skoru, genel_skor,
      ilce:ilce_id(isim, slug)
    `)
    .in('ilce.slug' as any, ['besiktas', 'kadikoy', 'fatih'])
    .order('saglik_skoru', { ascending: false })
    .limit(20)

  console.log(`  ${'Mahalle'.padEnd(24)} ${'İlçe'.padEnd(14)} Sağlık  Eğitim  Genel`)
  console.log('  ' + '─'.repeat(62))
  for (const m of kontrol || []) {
    const ilce = (m as any).ilce
    if (!['besiktas','kadikoy','fatih'].includes(ilce?.slug)) continue
    console.log(
      `  ${m.isim.padEnd(24)} ${ilce.isim.padEnd(14)} ` +
      `${String(m.saglik_skoru).padStart(6)}  ${String(m.egitim_skoru).padStart(6)}  ${String(m.genel_skor).padStart(5)}`
    )
  }

  // İlçe özet
  console.log('\n── İlçe Özet ────────────────────────────────────────────')
  const { data: ilceKontrol } = await supabase
    .from('ilceler')
    .select('isim, saglik_skoru, egitim_skoru, genel_skor')
    .order('saglik_skoru', { ascending: false })
    .limit(15)
  console.log(`  ${'İlçe'.padEnd(18)} Sağlık  Eğitim  Genel`)
  console.log('  ' + '─'.repeat(46))
  for (const i of ilceKontrol || []) {
    console.log(
      `  ${i.isim.padEnd(18)} ${String(i.saglik_skoru).padStart(6)}  ${String(i.egitim_skoru).padStart(6)}  ${String(i.genel_skor).padStart(5)}`
    )
  }
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
