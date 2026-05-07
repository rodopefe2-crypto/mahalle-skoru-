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
  // ── 1. Güvenlik skorunu [20-100] normalize et ──────
  console.log('1. Güvenlik skoru [20-100] normalize ediliyor...')
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, guvenlik_skoru, kira_ortalama, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, yesil_alan_skoru, kultur_skoru, ilce:ilce_id(isim, slug)')
    .gt('guvenlik_skoru', 0)

  const guvVals = mahalleler!.map(m => m.guvenlik_skoru).filter(v => v > 0)
  const mn = Math.min(...guvVals)
  const mx = Math.max(...guvVals)
  console.log(`  Aralık: ${mn} – ${mx}`)

  let n = 0
  for (const m of mahalleler || []) {
    const norm = Math.round(20 + ((m.guvenlik_skoru - mn) / (mx - mn)) * 80)
    const kiraSkor = kiraLogSkor((m as any).kira_ortalama ?? null)
    const genel_skor = Math.min(100, Math.round(
      kiraSkor                       * 0.200 +
      norm                           * 0.200 +
      (m.imkanlar_skoru   || 0)      * 0.200 +
      (m.ulasim_skoru     || 0)      * 0.200 +
      (m.egitim_skoru     || 0)      * 0.075 +
      (m.saglik_skoru     || 0)      * 0.075 +
      (m.yesil_alan_skoru || 0)      * 0.025 +
      (m.kultur_skoru     || 0)      * 0.025
    ))
    await supabase.from('mahalleler')
      .update({ guvenlik_skoru: norm, genel_skor })
      .eq('id', m.id)
    n++
    if (n % 200 === 0) process.stdout.write(`\r  ${n}/${mahalleler!.length}`)
  }
  console.log(`\r  ✅ ${n} mahalle güncellendi`)

  // ── 2. İlçe genel_skor = mahalle ortalaması ───────
  console.log('2. İlçe genel skorları güncelleniyor...')
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
  console.log(`  ✅ ${ilceToplam.size} ilçe güncellendi`)

  // ── 3. Kontrol: Beşiktaş mahalleleri ──────────────
  const { data: ilce } = await supabase.from('ilceler').select('id, guvenlik_skoru').eq('slug', 'besiktas').single()
  const { data: kontrol } = await supabase
    .from('mahalleler')
    .select('isim, guvenlik_skoru, kira_ortalama')
    .eq('ilce_id', ilce!.id)
    .order('guvenlik_skoru', { ascending: false })

  console.log(`\n── Beşiktaş (ilçe güvenlik: ${ilce!.guvenlik_skoru}) ──────────────────────`)
  console.log('  Mahalle              Güvenlik  Kira')
  console.log('  ' + '─'.repeat(45))
  kontrol?.forEach(m => {
    console.log(
      `  ${m.isim.padEnd(22)} ${String(m.guvenlik_skoru).padStart(6)}   ${m.kira_ortalama ? m.kira_ortalama.toLocaleString('tr-TR') + ' TL' : '(ilçe ort.)'}`
    )
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
