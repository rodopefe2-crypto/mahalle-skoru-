import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LN_MIN_KIRA  = Math.log(16717)
const LN_MAX_KIRA  = Math.log(64454)
const LN_MAX_120K  = Math.log(120000)

function ilceKiraLogSkor(kira: number | null): number {
  const k = Math.max(kira && kira > 0 ? kira : 25000, 1)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN_KIRA) / (LN_MAX_KIRA - LN_MIN_KIRA) * 100))
}

function mahalleKiraGuvenlik(kira: number | null): number {
  const k = Math.min(Math.max(kira && kira > 0 ? kira : 25000, 1), 120000)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN_KIRA) / (LN_MAX_120K - LN_MIN_KIRA) * 100))
}

// Manuel düzeltmeler
const ILCE_DUZELT: Record<string, number> = {
  adalar:   95,
  sile:     88,
  catalca:  85,
  sisli:    72,
  kadikoy:  70,
  bakirkoy: 68,
}

async function main() {
  // ── 1. İlçe güvenlik skorlarını güncelle ──────────
  console.log('1. İlçe güvenlik skorları düzeltiliyor...')
  for (const [slug, skor] of Object.entries(ILCE_DUZELT)) {
    const { error } = await supabase
      .from('ilceler').update({ guvenlik_skoru: skor }).eq('slug', slug)
    if (error) console.log(`  ✗ ${slug}: ${error.message}`)
    else console.log(`  ✓ ${slug.padEnd(12)} guvenlik_skoru = ${skor}`)
  }

  // ── 2. İlçe genel_skor'u yeniden hesapla ──────────
  console.log('\n2. İlçe genel skorları hesaplanıyor...')
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug, guvenlik_skoru, imkanlar_skoru, ulasim_skoru, egitim_skoru, saglik_skoru, yesil_alan_skoru, kultur_skoru')

  const { data: mahKira } = await supabase
    .from('mahalleler').select('ilce_id, kira_ortalama').not('kira_ortalama', 'is', null)
  const ilceKiraMap = new Map<string, { sum: number; count: number }>()
  for (const m of mahKira || []) {
    const cur = ilceKiraMap.get(m.ilce_id) || { sum: 0, count: 0 }
    cur.sum += m.kira_ortalama!; cur.count++
    ilceKiraMap.set(m.ilce_id, cur)
  }

  for (const i of ilceler || []) {
    const agg = ilceKiraMap.get(i.id)
    const avgKira = agg ? agg.sum / agg.count : null
    const kiraSkor = ilceKiraLogSkor(avgKira)
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
  }
  console.log(`  ✅ ${ilceler?.length} ilçe genel skoru güncellendi`)

  // ── 3. Mahalle güvenlik skorlarını güncelle ────────
  console.log('\n3. Mahalle güvenlik skorları güncelleniyor...')
  const ilceById = new Map(ilceler?.map(i => [i.id, i]) ?? [])

  const { data: mahalleler } = await supabase
    .from('mahalleler').select('id, ilce_id, kira_ortalama')

  let n = 0
  for (const m of mahalleler || []) {
    const ilce = ilceById.get(m.ilce_id)
    if (!ilce) continue
    const kiraBileseni = mahalleKiraGuvenlik((m as any).kira_ortalama ?? null)
    const guvenlik_skoru = Math.min(100, Math.max(20, Math.round(
      (ilce.guvenlik_skoru || 50) * 0.70 +
      kiraBileseni                * 0.30
    )))
    await supabase.from('mahalleler').update({ guvenlik_skoru }).eq('id', m.id)
    n++
    if (n % 200 === 0) process.stdout.write(`\r  ${n}/${mahalleler!.length}`)
  }
  console.log(`\r  ✅ ${n} mahalle güncellendi`)

  // ── 4. Kontrol ────────────────────────────────────
  const { data: kontrol } = await supabase
    .from('ilceler')
    .select('isim, guvenlik_skoru, genel_skor')
    .order('guvenlik_skoru', { ascending: false })

  console.log('\n── İlçe Güvenlik Sıralaması ──────────────────────────')
  kontrol?.forEach((i, idx) => {
    console.log(`  ${String(idx+1).padStart(2)}. ${i.isim.padEnd(16)} güvenlik:${String(i.guvenlik_skoru).padStart(4)}   genel:${i.genel_skor}`)
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
