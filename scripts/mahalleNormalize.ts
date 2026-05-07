import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PARAMETRELER = [
  'ulasim_skoru', 'saglik_skoru', 'egitim_skoru', 'imkanlar_skoru',
  'yesil_alan_skoru', 'kultur_skoru', 'guvenlik_skoru',
] as const

const LN_MIN = Math.log(16717)
const LN_MAX = Math.log(64454)

function kiraLogSkor(kira: number | null): number {
  const k = Math.max(kira && kira > 0 ? kira : 25000, 1)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN) / (LN_MAX - LN_MIN) * 100))
}

async function main() {
  console.log('Mahalle verileri yükleniyor...')
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id, kira_ortalama, ' + PARAMETRELER.join(', '))

  if (!mahalleler?.length) { console.error('Veri yok'); return }
  console.log(`${mahalleler.length} mahalle yüklendi\n`)

  // ── Her parametre için 20-100 normalizasyon ───────
  const normalized: Record<string, Map<string, number>> = {}

  for (const param of PARAMETRELER) {
    const vals = mahalleler.map(m => (m as any)[param] as number).filter(v => v > 0)
    if (!vals.length) continue
    const mn = Math.min(...vals)
    const mx = Math.max(...vals)
    console.log(`${param.padEnd(20)} min:${mn}  max:${mx}`)

    const map = new Map<string, number>()
    for (const m of mahalleler) {
      const skor = (m as any)[param] as number
      if (!skor || skor <= 0) continue
      map.set(m.id, Math.round(20 + ((skor - mn) / (mx - mn)) * 80))
    }
    normalized[param] = map
  }

  // ── Toplu update (parametre başına batch) ─────────
  console.log('\nVeritabanına yazılıyor...')
  for (const param of PARAMETRELER) {
    const map = normalized[param]
    if (!map) continue
    let n = 0
    for (const [id, val] of map.entries()) {
      await supabase.from('mahalleler').update({ [param]: val }).eq('id', id)
      n++
      if (n % 200 === 0) process.stdout.write(`\r  ${param}: ${n}/${map.size}`)
    }
    console.log(`\r  ✅ ${param}: ${map.size} mahalle`)
  }

  // ── Genel skor yeniden hesapla ────────────────────
  console.log('\nGenel skorlar hesaplanıyor...')
  // Güncel normalize edilmiş değerleri kullan
  const { data: fresh } = await supabase
    .from('mahalleler')
    .select('id, ilce_id, kira_ortalama, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, yesil_alan_skoru, kultur_skoru, guvenlik_skoru')

  let gn = 0
  for (const m of fresh || []) {
    const kiraSkor = kiraLogSkor((m as any).kira_ortalama ?? null)
    const genel_skor = Math.min(100, Math.round(
      kiraSkor                       * 0.200 +
      (m.guvenlik_skoru   || 50)     * 0.200 +
      (m.imkanlar_skoru   || 0)      * 0.200 +
      (m.ulasim_skoru     || 0)      * 0.200 +
      (m.egitim_skoru     || 0)      * 0.075 +
      (m.saglik_skoru     || 0)      * 0.075 +
      (m.yesil_alan_skoru || 0)      * 0.025 +
      (m.kultur_skoru     || 0)      * 0.025
    ))
    await supabase.from('mahalleler').update({ genel_skor }).eq('id', m.id)
    gn++
    if (gn % 200 === 0) process.stdout.write(`\r  genel_skor: ${gn}/${fresh!.length}`)
  }
  console.log(`\r  ✅ genel_skor: ${gn} mahalle`)

  // ── İlçe genel_skor = mahalle ortalaması ─────────
  console.log('\nİlçe genel skorları mahalle ortalamasından güncelleniyor...')
  const ilceToplam = new Map<string, { sum: number; count: number }>()
  const { data: genelFresh } = await supabase
    .from('mahalleler')
    .select('ilce_id, genel_skor')
    .gt('genel_skor', 0)

  for (const m of genelFresh || []) {
    const cur = ilceToplam.get(m.ilce_id) || { sum: 0, count: 0 }
    cur.sum += m.genel_skor
    cur.count++
    ilceToplam.set(m.ilce_id, cur)
  }

  for (const [ilceId, agg] of ilceToplam.entries()) {
    const genel_skor = Math.round(agg.sum / agg.count)
    await supabase.from('ilceler').update({ genel_skor }).eq('id', ilceId)
  }
  console.log(`  ✅ ${ilceToplam.size} ilçe güncellendi`)

  // ── Kontrol ───────────────────────────────────────
  const { data: kontrol } = await supabase
    .from('mahalleler')
    .select('isim, genel_skor, ulasim_skoru, guvenlik_skoru, imkanlar_skoru, ilce:ilce_id(isim)')
    .gt('genel_skor', 0)
    .order('genel_skor', { ascending: false })
    .limit(15)

  console.log('\n── Top 15 Mahalle ────────────────────────────────────────────')
  console.log('     Mahalle              İlçe            Genel  Ul  Gv  İm')
  console.log('  ' + '─'.repeat(62))
  kontrol?.forEach((m, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${m.isim.padEnd(20)} ${((m.ilce as any)?.isim || '').padEnd(14)} ` +
      `${String(m.genel_skor).padStart(5)}  ${String(m.ulasim_skoru).padStart(3)} ${String(m.guvenlik_skoru).padStart(3)} ${String(m.imkanlar_skoru).padStart(3)}`
    )
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
