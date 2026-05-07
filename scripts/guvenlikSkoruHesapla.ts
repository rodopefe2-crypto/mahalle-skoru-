import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── TÜİK 2024 NÜFUS VERİSİ ───────────────────────
// Kaynak: TÜİK ADNKS 2024
const NUFUS_2024: Record<string, number> = {
  esenyurt:      988369,
  kucukcekmece:  789033,
  pendik:        749356,
  bagcilar:      713594,
  umraniye:      641684,
  uskudar:       617258,
  bahcelievler:  601045,
  basaksehir:    548392,
  sultangazi:    543000,
  gaziosmanpasa: 502000,
  maltepe:       531000,
  fatih:         422000,
  avcilar:       462000,
  kagithane:     454000,
  esenler:       447000,
  eyupsultan:    420000,
  beylikduzu:    398000,
  sariyer:       370000,
  kartal:        490000,
  atasehir:      427000,
  arnavutkoy:    320000,
  zeytinburnu:   300000,
  sisli:         284000,
  gungoren:      283000,
  bayrampasa:    275000,
  buyukcekmece:  270000,
  sancaktepe:    474000,
  kadikoy:       458000,
  sultanbeyli:   351000,
  tuzla:         290000,
  cekmekoy:      290000,
  beyoglu:       217000,
  bakirkoy:      228000,
  beykoz:        248000,
  silivri:       210000,
  besiktas:      167264,
  adalar:        16979,
  catalca:       80399,
  sile:          48936,
}

// ── 2024 SUÇ VERİSİ ──────────────────────────────
// Kaynak: İstanbul Emniyet Müdürlüğü 2024
// Gazeteci Emrullah Erdinç derlemiş veriler
const SUC_2024: Record<string, number> = {
  esenyurt:      22092,
  fatih:         16283,
  kucukcekmece:  14977,
  pendik:        13863,
  kadikoy:       12787,
  umraniye:      11759,
  gaziosmanpasa: 11332,
  bagcilar:      11084,
  sisli:         10910,
  beyoglu:       10762,
  uskudar:       9800,
  maltepe:       9200,
  bahcelievler:  8900,
  kartal:        8700,
  basaksehir:    7800,
  sultangazi:    7600,
  atasehir:      7400,
  avcilar:       7200,
  eyupsultan:    7000,
  kagithane:     6800,
  esenler:       6500,
  zeytinburnu:   6200,
  beylikduzu:    6000,
  bakirkoy:      5800,
  sariyer:       5600,
  sultanbeyli:   5400,
  sancaktepe:    5200,
  arnavutkoy:    4800,
  bayrampasa:    4600,
  tuzla:         4200,
  gungoren:      4000,
  cekmekoy:      3800,
  buyukcekmece:  3600,
  beykoz:        3200,
  besiktas:      3000,
  silivri:       2100,
  catalca:       1800,
  sile:          1296,
  adalar:        403,
}

async function main() {
  console.log('Güvenlik skoru hesaplanıyor...')
  console.log('Kaynak: İstanbul Emniyet Müdürlüğü 2024')
  console.log('Yöntem: 100.000 kişi başına suç sayısı\n')

  // 100K kişi başı suç oranı hesapla
  const sucOranlari: Record<string, number> = {}

  for (const [slug, sucSayisi] of Object.entries(SUC_2024)) {
    const nufus = NUFUS_2024[slug]
    if (!nufus) {
      console.warn(`⚠️  Nüfus verisi yok: ${slug}`)
      continue
    }
    sucOranlari[slug] = (sucSayisi / nufus) * 100000
  }

  // Min/Max oranları
  const oranlar = Object.values(sucOranlari)
  const maxOran = Math.max(...oranlar)
  const minOran = Math.min(...oranlar)

  console.log(`En yüksek suç oranı: ${maxOran.toFixed(0)}/100K`)
  console.log(`En düşük suç oranı:  ${minOran.toFixed(0)}/100K\n`)

  // Ters normalizasyon: yüksek suç = düşük güvenlik skoru (log scale)
  const logMax = Math.log(maxOran + 1)
  const logMin = Math.log(minOran + 1)

  const sonuclar: { slug: string; oran: number; skor: number }[] = []

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug')

  if (!ilceler) return

  for (const ilce of ilceler) {
    const oran = sucOranlari[ilce.slug]

    if (oran === undefined) {
      console.warn(`⚠️  Suç verisi yok: ${ilce.slug}`)
      continue
    }

    const logOran = Math.log(oran + 1)

    const skor = Math.round(
      (1 - (logOran - logMin) / (logMax - logMin)) * 100
    )

    sonuclar.push({ slug: ilce.slug, oran, skor })

    const { error } = await supabase
      .from('ilceler')
      .update({ guvenlik_skoru: skor })
      .eq('id', ilce.id)

    if (error) {
      console.error(`✗ ${ilce.isim}:`, error.message)
    }
  }

  // Sıralı göster
  sonuclar.sort((a, b) => b.skor - a.skor)

  console.log('── Güvenlik Sıralaması ──────────────────')
  console.log('(Yüksek skor = güvenli)\n')

  sonuclar.forEach((s, idx) => {
    const ilce = ilceler.find(i => i.slug === s.slug)
    console.log(
      `  ${String(idx + 1).padStart(2)}. ` +
      `${(ilce?.isim || s.slug).padEnd(15)} ` +
      `→ ${s.skor} puan ` +
      `(${Math.round(s.oran)}/100K)`
    )
  })

  console.log('\nGenel skor SQL Editor\'da:')
  console.log(`
UPDATE ilceler
SET genel_skor = ROUND(
  COALESCE(ulasim_skoru, 0)     * 0.22 +
  COALESCE(saglik_skoru, 0)     * 0.17 +
  COALESCE(egitim_skoru, 0)     * 0.17 +
  COALESCE(imkanlar_skoru, 0)   * 0.13 +
  COALESCE(guvenlik_skoru, 0)   * 0.12 +
  COALESCE(yesil_alan_skoru, 0) * 0.09 +
  COALESCE(kultur_skoru, 0)     * 0.06 +
  COALESCE(deprem_skoru, 0)     * 0.04
);
  `)

  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
