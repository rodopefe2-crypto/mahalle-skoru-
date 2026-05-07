import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PARAMETRELER = [
  'ulasim_skoru', 'saglik_skoru', 'egitim_skoru', 'imkanlar_skoru',
  'yesil_alan_skoru', 'kultur_skoru', 'guvenlik_skoru', 'deprem_skoru',
] as const

const LN_MIN = Math.log(16717)
const LN_MAX = Math.log(64454)

function kiraLogSkor(kira: number | null): number {
  const k = Math.max(kira && kira > 0 ? kira : 25000, 1)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN) / (LN_MAX - LN_MIN) * 100))
}

async function main() {
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, ' + PARAMETRELER.join(', '))

  if (!ilceler?.length) { console.error('Veri yok'); return }

  // ── Her parametre için 20-100 normalizasyon ───────
  for (const param of PARAMETRELER) {
    const vals = ilceler.map(i => (i as any)[param] as number).filter(v => v > 0)
    if (!vals.length) continue
    const mn = Math.min(...vals)
    const mx = Math.max(...vals)
    console.log(`${param.padEnd(20)} min:${mn} max:${mx}`)

    for (const ilce of ilceler) {
      const skor = (ilce as any)[param] as number
      if (!skor || skor <= 0) continue
      const yeni = Math.round(20 + ((skor - mn) / (mx - mn)) * 80)
      ;(ilce as any)[`_${param}`] = yeni  // cache normalized value
      await supabase.from('ilceler').update({ [param]: yeni }).eq('id', ilce.id)
    }
  }

  // ── Genel skor yeniden hesapla ────────────────────
  console.log('\nGenel skorlar hesaplanıyor...')
  const { data: ilcelerFresh } = await supabase
    .from('ilceler')
    .select('id, isim, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, yesil_alan_skoru, kultur_skoru, guvenlik_skoru, deprem_skoru')

  const { data: mahKira } = await supabase
    .from('mahalleler')
    .select('ilce_id, kira_ortalama')
    .not('kira_ortalama', 'is', null)

  const ilceKiraMap = new Map<string, { sum: number; count: number }>()
  for (const m of mahKira || []) {
    const cur = ilceKiraMap.get(m.ilce_id) || { sum: 0, count: 0 }
    cur.sum += m.kira_ortalama!
    cur.count++
    ilceKiraMap.set(m.ilce_id, cur)
  }

  const sonuclar: { isim: string; skorlar: Record<string, number> }[] = []

  for (const i of ilcelerFresh || []) {
    const agg = ilceKiraMap.get(i.id)
    const avgKira = agg ? agg.sum / agg.count : null
    const kiraSkor = kiraLogSkor(avgKira)

    const genel_skor = Math.min(100, Math.round(
      kiraSkor                        * 0.200 +
      (i.guvenlik_skoru   || 50)      * 0.200 +
      (i.imkanlar_skoru   || 0)       * 0.200 +
      (i.ulasim_skoru     || 0)       * 0.200 +
      (i.egitim_skoru     || 0)       * 0.075 +
      (i.saglik_skoru     || 0)       * 0.075 +
      (i.yesil_alan_skoru || 0)       * 0.025 +
      (i.kultur_skoru     || 0)       * 0.025
    ))
    await supabase.from('ilceler').update({ genel_skor }).eq('id', i.id)
    sonuclar.push({ isim: i.isim, skorlar: { ...i, kira: Math.round(kiraSkor), genel_skor } })
  }

  // ── Kontrol tablosu ───────────────────────────────
  const { data: kontrol } = await supabase
    .from('ilceler')
    .select('isim, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, guvenlik_skoru, yesil_alan_skoru, kultur_skoru, genel_skor')
    .order('genel_skor', { ascending: false })
    .limit(10)

  console.log('\n── İlçe Sıralaması (top 10) ──────────────────────────────────────────────────')
  console.log('  İlçe           Ul  Sğ  Eğ  İm  Gv  Yş  Kl  GENEL')
  console.log('  ' + '─'.repeat(65))
  kontrol?.forEach((i, idx) => {
    console.log(
      `  ${String(idx+1).padStart(2)}. ${i.isim.padEnd(13)} ` +
      `${String(i.ulasim_skoru).padStart(3)} ` +
      `${String(i.saglik_skoru).padStart(3)} ` +
      `${String(i.egitim_skoru).padStart(3)} ` +
      `${String(i.imkanlar_skoru).padStart(3)} ` +
      `${String(i.guvenlik_skoru).padStart(3)} ` +
      `${String(i.yesil_alan_skoru).padStart(3)} ` +
      `${String(i.kultur_skoru).padStart(3)}  → ${i.genel_skor}`
    )
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
