import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const METROBUS_SLUGS = [
  'beylikduzu', 'esenyurt', 'avcilar',
  'kucukcekmece', 'bahcelievler', 'bakirkoy',
  'zeytinburnu', 'fatih', 'beyoglu',
  'sisli', 'besiktas', 'uskudar', 'kadikoy',
]

const LN_MIN = Math.log(16717)
const LN_MAX = Math.log(64454)

function kiraLogSkor(kira: number | null): number {
  const k = (kira && kira > 0) ? kira : 25000
  const clamped = Math.max(k, 1)
  return Math.min(100, Math.max(0, (Math.log(clamped) - LN_MIN) / (LN_MAX - LN_MIN) * 100))
}

async function main() {
  // ── 1. Metrobüs bonusu (ilçeler +15) ─────────────
  console.log('1. Metrobüs bonusu uygulanıyor (+15 ilçe ulaşım)...')
  const { data: metrobusIlceler } = await supabase
    .from('ilceler')
    .select('id, slug, isim, ulasim_skoru')
    .in('slug', METROBUS_SLUGS)

  for (const ilce of metrobusIlceler || []) {
    const yeni = Math.min(100, (ilce.ulasim_skoru || 0) + 15)
    await supabase.from('ilceler').update({ ulasim_skoru: yeni }).eq('id', ilce.id)
    console.log(`  ${ilce.isim.padEnd(15)} ${ilce.ulasim_skoru} → ${yeni}`)
  }

  // ── 2. İlçe ulaşım skorlarını yeniden yükle ──────
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, slug, isim, ulasim_skoru, kira_ortalama, guvenlik_skoru, imkanlar_skoru, egitim_skoru, saglik_skoru, yesil_alan_skoru, kultur_skoru')
  const ilceById = new Map(ilceler?.map(i => [i.id, i]) ?? [])

  // ── 3. Mahalle ulaşım tesisleri yükle ────────────
  console.log('\n2. Mahalle ulaşım tesisleri yükleniyor...')
  const { data: ulasimTesisler } = await supabase
    .from('mahalle_tesisler')
    .select('mahalle_id, alt_kategori')
    .eq('kategori', 'ulasim')

  const tesisByMahalle = new Map<string, string[]>()
  for (const t of ulasimTesisler || []) {
    if (!tesisByMahalle.has(t.mahalle_id)) tesisByMahalle.set(t.mahalle_id, [])
    tesisByMahalle.get(t.mahalle_id)!.push(t.alt_kategori)
  }
  console.log(`  ${tesisByMahalle.size} mahalle için tesis verisi yüklendi`)

  // ── 4. Mahalle ulaşım skoru güncelle ─────────────
  console.log('\n3. Mahalle ulaşım skorları güncelleniyor...')
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id, kira_ortalama, guvenlik_skoru, imkanlar_skoru, egitim_skoru, saglik_skoru, yesil_alan_skoru, kultur_skoru')

  let mahGuncellenen = 0
  for (const mahalle of mahalleler || []) {
    const ilce = ilceById.get(mahalle.ilce_id)
    if (!ilce) continue

    const tesisler   = tesisByMahalle.get(mahalle.id) ?? []
    const hasSubway  = tesisler.includes('subway_station')
    const hasTrain   = tesisler.includes('train_station')
    const transitSay = tesisler.filter(t => t === 'transit_station').length

    const bonus = (hasSubway ? 10 : 0) + (hasTrain ? 8 : 0) - (transitSay < 5 ? 5 : 0)
    const ulasim_skoru = Math.min(100, Math.max(0, (ilce.ulasim_skoru || 0) + bonus))

    const kiraSkor  = kiraLogSkor((mahalle as any).kira_ortalama ?? null)
    const genel_skor = Math.min(100, Math.round(
      kiraSkor                             * 0.200 +
      (mahalle.guvenlik_skoru  || 50)      * 0.200 +
      (mahalle.imkanlar_skoru  || 0)       * 0.200 +
      ulasim_skoru                         * 0.200 +
      (mahalle.egitim_skoru    || 0)       * 0.075 +
      (mahalle.saglik_skoru    || 0)       * 0.075 +
      (mahalle.yesil_alan_skoru || 0)      * 0.025 +
      (mahalle.kultur_skoru    || 0)       * 0.025
    ))

    const { error } = await supabase
      .from('mahalleler')
      .update({ ulasim_skoru, genel_skor })
      .eq('id', mahalle.id)

    if (!error) mahGuncellenen++
    if (mahGuncellenen % 100 === 0) process.stdout.write(`\r  ${mahGuncellenen}/${mahalleler!.length}`)
  }
  console.log(`\r  ✅ ${mahGuncellenen} mahalle güncellendi (ulaşım + genel skor)`)

  // ── 5. İlçe genel_skor güncelle ──────────────────
  console.log('\n4. İlçe genel skorları güncelleniyor...')
  const { data: ilceKiraAort } = await supabase
    .from('mahalleler')
    .select('ilce_id, kira_ortalama')
    .not('kira_ortalama', 'is', null)

  // ilçe başına kira ortalaması
  const ilceKiraToplam = new Map<string, { sum: number; count: number }>()
  for (const m of ilceKiraAort || []) {
    const cur = ilceKiraToplam.get(m.ilce_id) || { sum: 0, count: 0 }
    cur.sum += m.kira_ortalama!
    cur.count++
    ilceKiraToplam.set(m.ilce_id, cur)
  }

  for (const ilce of ilceler || []) {
    const agg    = ilceKiraToplam.get(ilce.id)
    const avgKira = agg ? agg.sum / agg.count : null
    const kiraSkor = kiraLogSkor(avgKira)

    const genel_skor = Math.min(100, Math.round(
      kiraSkor                           * 0.200 +
      (ilce.guvenlik_skoru  || 50)       * 0.200 +
      (ilce.imkanlar_skoru  || 0)        * 0.200 +
      (ilce.ulasim_skoru    || 0)        * 0.200 +
      (ilce.egitim_skoru    || 0)        * 0.075 +
      (ilce.saglik_skoru    || 0)        * 0.075 +
      (ilce.yesil_alan_skoru || 0)       * 0.025 +
      (ilce.kultur_skoru    || 0)        * 0.025
    ))
    await supabase.from('ilceler').update({ genel_skor }).eq('id', ilce.id)
  }

  // ── 6. Kontrol çıktısı ────────────────────────────
  console.log('\n5. Kontrol: ilçe ulaşım + genel skor sıralaması')
  const { data: kontrol } = await supabase
    .from('ilceler')
    .select('isim, ulasim_skoru, genel_skor')
    .order('ulasim_skoru', { ascending: false })
    .limit(15)

  console.log('\n── ulaşım_skoru sıralaması (top 15) ─────────────────────')
  kontrol?.forEach((i, idx) => {
    console.log(`  ${String(idx + 1).padStart(2)}. ${i.isim.padEnd(15)} ulaşım: ${String(i.ulasim_skoru).padStart(3)}   genel: ${i.genel_skor}`)
  })
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
