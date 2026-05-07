import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mahalle düzeyinde suç verisi olmadığından
// her mahalleye bağlı ilçenin güvenlik skoru atanır.
// Genel skor formülü ilçe ile aynı ağırlıkları kullanır.
const AGIRLIKLAR = {
  ulasim:   0.22,
  saglik:   0.15,
  egitim:   0.15,
  imkanlar: 0.11,
  guvenlik: 0.18,
  deprem:   0.10,
  nufus:    0.09,
}

async function main() {
  console.log('Mahalle güvenlik skoru hesaplanıyor...')
  console.log('Yöntem: Bağlı ilçenin güvenlik skoru miras alınır\n')

  const [{ data: ilceler }, { data: mahalleler }] = await Promise.all([
    supabase.from('ilceler').select('id, isim, guvenlik_skoru, deprem_skoru, nufus_yogunlugu_skoru'),
    supabase.from('mahalleler').select('id, ilce_id, isim, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, deprem_skoru'),
  ])

  if (!ilceler || !mahalleler) { console.error('Veri alınamadı'); return }

  const ilceMap = new Map(ilceler.map(i => [i.id, i]))

  let guncellenen = 0
  let hatali = 0

  for (const mah of mahalleler) {
    const ilce = ilceMap.get(mah.ilce_id)
    if (!ilce) { hatali++; continue }

    const guvenlik = ilce.guvenlik_skoru ?? 50
    const deprem   = (mah.deprem_skoru ?? ilce.deprem_skoru) || 50
    const nufus    = ilce.nufus_yogunlugu_skoru || 0

    const genel = Math.round(
      (mah.ulasim_skoru   || 0) * AGIRLIKLAR.ulasim   +
      (mah.saglik_skoru   || 0) * AGIRLIKLAR.saglik   +
      (mah.egitim_skoru   || 0) * AGIRLIKLAR.egitim   +
      (mah.imkanlar_skoru || 0) * AGIRLIKLAR.imkanlar +
      guvenlik             * AGIRLIKLAR.guvenlik +
      deprem               * AGIRLIKLAR.deprem   +
      nufus                * AGIRLIKLAR.nufus
    )

    const { error } = await supabase
      .from('mahalleler')
      .update({ guvenlik_skoru: guvenlik, genel_skor: genel })
      .eq('id', mah.id)

    if (error) { hatali++; continue }

    guncellenen++
    if (guncellenen % 100 === 0)
      process.stdout.write(`\r  ${guncellenen}/${mahalleler.length}`)
  }

  console.log(`\r✅ ${guncellenen} mahalle güncellendi, ${hatali} hata`)

  // İlçe bazlı özet
  console.log('\n── İlçe Bazlı Güvenlik Dağılımı ────────')
  const ozet = ilceler
    .filter(i => i.guvenlik_skoru !== null)
    .sort((a, b) => (b.guvenlik_skoru ?? 0) - (a.guvenlik_skoru ?? 0))
    .slice(0, 10)

  ozet.forEach(i => {
    const mahSayisi = mahalleler.filter(m => m.ilce_id === i.id).length
    console.log(`  ${i.isim.padEnd(15)} güvenlik:${String(i.guvenlik_skoru).padStart(3)}  (${mahSayisi} mahalle)`)
  })

  // TOP 10 mahalle
  const { data: top } = await supabase
    .from('mahalleler')
    .select('isim, genel_skor, guvenlik_skoru, ulasim_skoru, egitim_skoru')
    .order('genel_skor', { ascending: false })
    .limit(10)

  console.log('\n── TOP 10 Mahalle (yeni sıralama) ──────')
  top?.forEach((m, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${m.isim.padEnd(20)} ` +
      `genel:${m.genel_skor}  güvenlik:${m.guvenlik_skoru}`
    )
  })
}

main().catch(console.error)
