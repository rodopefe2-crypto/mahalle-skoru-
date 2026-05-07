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
  console.log('Veriler yükleniyor...')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id, kira_ortalama, guvenlik_skoru, imkanlar_skoru, egitim_skoru, saglik_skoru, yesil_alan_skoru, kultur_skoru')

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, slug, ulasim_skoru')
  const ilceById = new Map(ilceler?.map(i => [i.id, i]) ?? [])

  // Ulaşım tesisleri (metro/tren varlık kontrolü için)
  const { data: ulasimTesisler } = await supabase
    .from('mahalle_tesisler')
    .select('mahalle_id, alt_kategori')
    .eq('kategori', 'ulasim')

  const tesisByMahalle = new Map<string, string[]>()
  for (const t of ulasimTesisler || []) {
    if (!tesisByMahalle.has(t.mahalle_id)) tesisByMahalle.set(t.mahalle_id, [])
    tesisByMahalle.get(t.mahalle_id)!.push(t.alt_kategori)
  }
  console.log(`  ${mahalleler?.length} mahalle yüklendi\n`)

  // ── 1. Mahalle ulasim = ilçe skoru + varlık bonusu ─
  // (mahalleNormalize öncesi mantık: ulasimSkorGuncelle.ts step 4)
  const hamUlasim = new Map<string, number>()
  for (const m of mahalleler || []) {
    const ilce       = ilceById.get(m.ilce_id)
    const ilceUlasim = ilce?.ulasim_skoru || 0
    const tesisler   = tesisByMahalle.get(m.id) ?? []
    const hasSubway  = tesisler.includes('subway_station')
    const hasTrain   = tesisler.includes('train_station')
    const transitSay = tesisler.filter(t => t === 'transit_station').length

    const bonus = (hasSubway ? 10 : 0) + (hasTrain ? 8 : 0) - (transitSay < 5 ? 5 : 0)
    hamUlasim.set(m.id, Math.min(100, Math.max(0, ilceUlasim + bonus)))
  }

  // ── 2. [20-100] normalize ─────────────────────────
  const vals = [...hamUlasim.values()].filter(v => v > 0)
  const mn = Math.min(...vals)
  const mx = Math.max(...vals)
  console.log(`Ulaşım ham puan aralığı: ${mn} – ${mx}`)

  const ulasimMap = new Map<string, number>()
  for (const [id, ham] of hamUlasim.entries()) {
    ulasimMap.set(id, ham > 0 ? Math.round(20 + ((ham - mn) / (mx - mn)) * 80) : 0)
  }

  // ── 3. Mahalle ulaşım + genel skor yaz ────────────
  console.log('Mahalle ulaşım + genel skorlar güncelleniyor...')
  let n = 0
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
    await supabase.from('mahalleler').update({ ulasim_skoru, genel_skor }).eq('id', m.id)
    n++
    if (n % 200 === 0) process.stdout.write(`\r  ${n}/${mahalleler!.length}`)
  }
  console.log(`\r  ✅ ${n} mahalle güncellendi`)

  // ── 4. İlçe genel_skor = mahalle ortalaması ───────
  const { data: genelFresh } = await supabase
    .from('mahalleler').select('ilce_id, genel_skor').gt('genel_skor', 0)
  const ilceToplam = new Map<string, { sum: number; count: number }>()
  for (const m of genelFresh || []) {
    const cur = ilceToplam.get(m.ilce_id) || { sum: 0, count: 0 }
    cur.sum += m.genel_skor; cur.count++
    ilceToplam.set(m.ilce_id, cur)
  }
  for (const [id, agg] of ilceToplam.entries()) {
    await supabase.from('ilceler').update({ genel_skor: Math.round(agg.sum / agg.count) }).eq('id', id)
  }
  console.log(`  ✅ ${ilceToplam.size} ilçe genel skoru güncellendi`)

  // ── 5. Kontrol ────────────────────────────────────
  const { data: top } = await supabase
    .from('mahalleler')
    .select('isim, genel_skor, ulasim_skoru, ilce:ilce_id(isim)')
    .gt('genel_skor', 0)
    .order('genel_skor', { ascending: false })
    .limit(15)

  console.log('\n── Top 15 Mahalle ───────────────────────────────────────')
  top?.forEach((m, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${m.isim.padEnd(20)} ${((m.ilce as any)?.isim||'').padEnd(14)} genel:${m.genel_skor}  ul:${m.ulasim_skoru}`
    )
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
