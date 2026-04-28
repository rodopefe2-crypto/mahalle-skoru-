import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── SABİT AĞIRLIKLAR ─────────────────────────────
// Son güncelleme: Nisan 2026
const AGIRLIKLAR = {
  ulasim:            0.22,
  saglik:            0.17,
  egitim:            0.17,
  imkanlar:          0.13,
  yesil_alan:        0.09,
  kultur:            0.05,
  deprem:            0.10,  // artırıldı: 0.03 → 0.10
  nufus_yogunlugu:   0.07,  // yeni: sakinlik/yoğunluk
}

async function main() {
  console.log('Genel skorlar güncelleniyor...')
  console.log('\nAğırlıklar:')
  Object.entries(AGIRLIKLAR).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(15)}: %${(v * 100).toFixed(0)}`)
  })

  const { data, error: fetchErr } = await supabase
    .from('ilceler')
    .select('id, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, yesil_alan_skoru, kultur_skoru, deprem_skoru, nufus_yogunlugu_skoru')

  if (fetchErr || !data) {
    console.error('Veri alınamadı:', fetchErr)
    return
  }

  for (const ilce of data) {
    const genel = Math.round(
      (ilce.ulasim_skoru           || 0) * AGIRLIKLAR.ulasim           +
      (ilce.saglik_skoru           || 0) * AGIRLIKLAR.saglik           +
      (ilce.egitim_skoru           || 0) * AGIRLIKLAR.egitim           +
      (ilce.imkanlar_skoru         || 0) * AGIRLIKLAR.imkanlar         +
      (ilce.yesil_alan_skoru       || 0) * AGIRLIKLAR.yesil_alan       +
      (ilce.kultur_skoru           || 0) * AGIRLIKLAR.kultur           +
      (ilce.deprem_skoru           || 0) * AGIRLIKLAR.deprem           +
      (ilce.nufus_yogunlugu_skoru  || 0) * AGIRLIKLAR.nufus_yogunlugu
    )
    await supabase
      .from('ilceler')
      .update({ genel_skor: genel })
      .eq('id', ilce.id)
  }

  const { data: sonuc } = await supabase
    .from('ilceler')
    .select('isim, genel_skor, ulasim_skoru, egitim_skoru, saglik_skoru')
    .order('genel_skor', { ascending: false })

  console.log('\n── Güncel Sıralama ────────────────────')
  sonuc?.forEach((ilce, idx) => {
    console.log(
      `  ${String(idx + 1).padStart(2)}. ` +
      `${ilce.isim.padEnd(15)} → ${ilce.genel_skor}`
    )
  })

  console.log('\n✅ Genel skorlar güncellendi!')
}

main().catch(console.error)
