import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LN_MIN = Math.log(16717)
const LN_MAX = Math.log(64454)

function kiraLogSkor(kira: number | null): number {
  const k = Math.max(kira && kira > 0 ? kira : 25000, 1)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN) / (LN_MAX - LN_MIN) * 100))
}

async function main() {
  // ── 1. Veri yükle ─────────────────────────────────
  console.log('Veriler yükleniyor...')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id, kira_ortalama, guvenlik_skoru, imkanlar_skoru, egitim_skoru, saglik_skoru, yesil_alan_skoru, kultur_skoru')

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug, ulasim_skoru')
  const ilceById = new Map(ilceler?.map(i => [i.id, i]) ?? [])

  // Ulaşım tesisleri
  const { data: ulasimTesisler } = await supabase
    .from('mahalle_tesisler')
    .select('mahalle_id, alt_kategori')
    .eq('kategori', 'ulasim')

  // Tesis sayıları mahalle başına
  const tesisSayisi = new Map<string, Record<string, number>>()
  for (const t of ulasimTesisler || []) {
    if (!tesisSayisi.has(t.mahalle_id)) tesisSayisi.set(t.mahalle_id, {})
    const rec = tesisSayisi.get(t.mahalle_id)!
    rec[t.alt_kategori] = (rec[t.alt_kategori] || 0) + 1
  }
  console.log(`  ${mahalleler?.length} mahalle, ${ulasimTesisler?.length} ulaşım tesisi\n`)

  // ── 2. Ham puan hesapla ───────────────────────────
  const harmonizePuanlar: { id: string; puan: number }[] = []

  for (const m of mahalleler || []) {
    const ilce       = ilceById.get(m.ilce_id)
    const ilceUlasim = ilce?.ulasim_skoru || 0
    const sayilar    = tesisSayisi.get(m.id) || {}

    const metroPuan   = Math.min(sayilar['subway_station']  || 0, 3) * 25
    const trenPuan    = Math.min(sayilar['train_station']   || 0, 3) * 15
    const otobusPuan  = Math.min(sayilar['bus_station']     || 0, 5) * 5
    const transitPuan = Math.min(sayilar['transit_station'] || 0, 30) * 1

    const hamPuan     = metroPuan + trenPuan + otobusPuan + transitPuan
    const mahalleNorm = Math.round((hamPuan / 175) * 100)
    const harmonize   = Math.round(mahalleNorm * 0.60 + ilceUlasim * 0.40)

    harmonizePuanlar.push({ id: m.id, puan: harmonize })
  }

  // ── 3. [20-100] normalize ─────────────────────────
  const puanValues = harmonizePuanlar.map(x => x.puan)
  const mn = Math.min(...puanValues)
  const mx = Math.max(...puanValues)
  console.log(`Harmonize puan aralığı: ${mn} – ${mx}`)

  // ── 4. Mahalle ulaşım skoru güncelle ──────────────
  console.log('Mahalle ulaşım skorları güncelleniyor...')
  const ulasimMap = new Map<string, number>()
  for (const { id, puan } of harmonizePuanlar) {
    const skor = Math.round(20 + ((puan - mn) / (mx - mn)) * 80)
    ulasimMap.set(id, skor)
  }

  let n = 0
  for (const [id, ulasim_skoru] of ulasimMap.entries()) {
    await supabase.from('mahalleler').update({ ulasim_skoru }).eq('id', id)
    n++
    if (n % 200 === 0) process.stdout.write(`\r  ${n}/${mahalleler!.length}`)
  }
  console.log(`\r  ✅ ${n} mahalle ulaşım skoru güncellendi`)

  // ── 5. Genel skor güncelle ────────────────────────
  console.log('Genel skorlar hesaplanıyor...')
  let gn = 0
  for (const m of mahalleler || []) {
    const ulasim_skoru = ulasimMap.get(m.id) || 0
    const kiraSkor = kiraLogSkor((m as any).kira_ortalama ?? null)
    const genel_skor = Math.min(100, Math.round(
      kiraSkor                       * 0.200 +
      (m.guvenlik_skoru   || 50)     * 0.200 +
      (m.imkanlar_skoru   || 0)      * 0.200 +
      ulasim_skoru                   * 0.200 +
      (m.egitim_skoru     || 0)      * 0.075 +
      (m.saglik_skoru     || 0)      * 0.075 +
      (m.yesil_alan_skoru || 0)      * 0.025 +
      (m.kultur_skoru     || 0)      * 0.025
    ))
    await supabase.from('mahalleler').update({ genel_skor }).eq('id', m.id)
    gn++
    if (gn % 200 === 0) process.stdout.write(`\r  ${gn}/${mahalleler!.length}`)
  }
  console.log(`\r  ✅ ${gn} mahalle genel skoru güncellendi`)

  // ── 6. İlçe genel_skor = mahalle ortalaması ───────
  console.log('İlçe genel skorları güncelleniyor...')
  const { data: genelFresh } = await supabase
    .from('mahalleler').select('ilce_id, genel_skor').gt('genel_skor', 0)

  const ilceToplam = new Map<string, { sum: number; count: number }>()
  for (const m of genelFresh || []) {
    const cur = ilceToplam.get(m.ilce_id) || { sum: 0, count: 0 }
    cur.sum += m.genel_skor; cur.count++
    ilceToplam.set(m.ilce_id, cur)
  }
  for (const [ilceId, agg] of ilceToplam.entries()) {
    await supabase.from('ilceler').update({ genel_skor: Math.round(agg.sum / agg.count) }).eq('id', ilceId)
  }
  console.log(`  ✅ ${ilceToplam.size} ilçe güncellendi`)

  // ── 7. Kontrol: Maltepe mahalleleri ───────────────
  const maltepe = ilceler?.find(i => i.slug === 'maltepe')
  if (maltepe) {
    const { data: malMahalleler } = await supabase
      .from('mahalleler')
      .select('id, isim, ulasim_skoru')
      .eq('ilce_id', maltepe.id)
      .order('ulasim_skoru', { ascending: false })

    console.log('\n── Maltepe Mahalleleri ───────────────────────────────────')
    console.log('  Mahalle              Ul  Metro  Tren  Transit')
    console.log('  ' + '─'.repeat(50))
    for (const m of malMahalleler || []) {
      const s = tesisSayisi.get(m.id) || {}
      console.log(
        `  ${m.isim.padEnd(20)} ${String(m.ulasim_skoru).padStart(3)}` +
        `    ${String(s['subway_station'] || 0).padStart(3)}` +
        `    ${String(s['train_station']  || 0).padStart(3)}` +
        `    ${String(s['transit_station']|| 0).padStart(3)}`
      )
    }
  }

  // ── 8. Genel top 15 ───────────────────────────────
  const { data: top } = await supabase
    .from('mahalleler')
    .select('isim, genel_skor, ulasim_skoru, ilce:ilce_id(isim)')
    .gt('genel_skor', 0)
    .order('genel_skor', { ascending: false })
    .limit(15)

  console.log('\n── Top 15 Mahalle ────────────────────────────────────────')
  top?.forEach((m, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${m.isim.padEnd(20)} ${((m.ilce as any)?.isim || '').padEnd(14)} ` +
      `genel:${m.genel_skor}  ul:${m.ulasim_skoru}`
    )
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
