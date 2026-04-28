import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Endeksa Mart 2025 — ortalama aylık kira (TL)
const KIRA_VERISI: Record<string, number> = {
  sariyer:       64454,
  besiktas:      61512,
  kadikoy:       52731,
  bakirkoy:      42820,
  adalar:        37500,
  sile:          36351,
  beykoz:        33678,
  uskudar:       32445,
  sisli:         31206,
  atasehir:      30965,
  beyoglu:       30596,
  maltepe:       29748,
  eyupsultan:    28528,
  basaksehir:    28324,
  kartal:        27842,
  umraniye:      27567,
  zeytinburnu:   27198,
  buyukcekmece:  26853,
  beylikduzu:    25951,
  tuzla:         25422,
  kagithane:     25409,
  pendik:        24888,
  cekmekoy:      24558,
  kucukcekmece:  23969,
  gaziosmanpasa: 22267,
  sancaktepe:    22177,
  bahcelievler:  21513,
  bayrampasa:    21042,
  catalca:       21019,
  gungoren:      20918,
  sultanbeyli:   20754,
  avcilar:       20426,
  silivri:       20102,
  bagcilar:      19692,
  fatih:         19268,
  sultangazi:    18164,
  esenler:       17199,
  arnavutkoy:    17180,
  esenyurt:      16717,
}

async function main() {
  console.log('Yaşam maliyeti skoru hesaplanıyor...')
  console.log('Kaynak: Endeksa.com — Mart 2025\n')

  const kiralar = Object.values(KIRA_VERISI)
  const maxKira = Math.max(...kiralar)
  const minKira = Math.min(...kiralar)

  console.log(`En pahalı: ${maxKira.toLocaleString('tr')} TL`)
  console.log(`En ucuz:   ${minKira.toLocaleString('tr')} TL\n`)

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug')

  if (!ilceler?.length) {
    console.error('İlçe verisi alınamadı')
    return
  }

  const sonuclar: { isim: string; kira: number; skor: number }[] = []

  for (const ilce of ilceler) {
    const kira = KIRA_VERISI[ilce.slug]

    if (!kira) {
      console.warn(`  ⚠️  Kira verisi yok: ${ilce.slug}`)
      continue
    }

    const logKira  = Math.log(kira)
    const logMax   = Math.log(maxKira)
    const logMin   = Math.log(minKira)
    const hammSkor = 1 - ((logKira - logMin) / (logMax - logMin))
    const skor     = Math.round(hammSkor * 100)

    sonuclar.push({ isim: ilce.isim, kira, skor })

    const { error } = await supabase
      .from('ilceler')
      .update({ yasam_maliyeti_skoru: skor })
      .eq('id', ilce.id)

    if (error) console.error(`  ✗ ${ilce.isim}:`, error.message)
  }

  sonuclar.sort((a, b) => b.skor - a.skor)

  console.log('── Yaşam Maliyeti Sıralaması ──────────────')
  console.log('(Yüksek skor = uygun fiyatlı)\n')

  sonuclar.forEach((s, idx) => {
    const bar = '█'.repeat(Math.round(s.skor / 5))
    console.log(
      `  ${String(idx + 1).padStart(2)}. ` +
      `${s.isim.padEnd(15)} ` +
      `${bar.padEnd(20)} ` +
      `${s.skor} puan ` +
      `(${s.kira.toLocaleString('tr')} TL)`
    )
  })

  console.log('\n✅ Tamamlandı!')
  console.log('\nGenel skoru güncellemek için SQL Editor\'da:')
  console.log(`
UPDATE ilceler
SET genel_skor = ROUND(
  COALESCE(ulasim_skoru, 0)         * 0.20 +
  COALESCE(saglik_skoru, 0)         * 0.15 +
  COALESCE(egitim_skoru, 0)         * 0.15 +
  COALESCE(imkanlar_skoru, 0)       * 0.15 +
  COALESCE(deprem_skoru, 0)         * 0.10 +
  COALESCE(yesil_alan_skoru, 0)     * 0.10 +
  COALESCE(kultur_skoru, 0)         * 0.05 +
  COALESCE(yasam_maliyeti_skoru, 0) * 0.10
);
  `)
}

main().catch(console.error)
