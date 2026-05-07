import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// İlçe kira verileri (Endeksa/Sahibinden ortalaması, TL/ay)
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

// Lineer [20–100] normalizasyon: en yüksek → 100, en düşük → 20
function linearNorm(values: number[]): number[] {
  const positives = values.filter(v => v > 0)
  if (positives.length === 0) return values.map(() => 0)
  const max = Math.max(...positives)
  const min = Math.min(...positives)
  return values.map(v => {
    if (v <= 0) return 0
    if (max === min) return 60
    const oran = (v - min) / (max - min)
    return Math.round(20 + Math.max(0, Math.min(1, oran)) * 80)
  })
}

async function main() {
  console.log('Kira skoru hesaplanıyor...\n')

  // ── 1. İLÇELER ─────────────────────────────────
  console.log('── İlçe kira skorları')
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, slug, isim')

  if (!ilceler) return

  const ilceKiralar = ilceler.map(i => ({
    id:   i.id,
    slug: i.slug,
    isim: i.isim,
    kira: KIRA_VERISI[i.slug] ?? 0,
  }))

  const ilceKiraValues = ilceKiralar.map(i => i.kira)
  const ilceSkorlar    = linearNorm(ilceKiraValues)

  // İlçe ortalamalarını da sakla (mahalle fallback için)
  const ilceKiraMap = new Map<string, number>()

  for (let i = 0; i < ilceler.length; i++) {
    const kira = ilceKiralar[i].kira
    const skor = ilceSkorlar[i]
    if (kira === 0) continue

    ilceKiraMap.set(ilceler[i].id, kira)

    const { error } = await supabase
      .from('ilceler')
      .update({ kira_ortalama: kira, kira_skoru: skor })
      .eq('id', ilceler[i].id)

    if (error) console.error(`  ✗ ${ilceler[i].isim}:`, error.message)
  }

  // Sıralı çıktı
  const sirali = ilceKiralar
    .map((il, i) => ({ ...il, skor: ilceSkorlar[i] }))
    .filter(i => i.kira > 0)
    .sort((a, b) => b.skor - a.skor)

  sirali.forEach((il, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${il.isim.padEnd(15)} ` +
      `${il.kira.toLocaleString('tr-TR').padStart(8)} TL  →  skor: ${il.skor}`
    )
  })

  // ── 2. MAHALLELER ──────────────────────────────
  console.log('\n── Mahalle kira skorları')
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, ilce_id, isim, kira_ortalama')

  if (!mahalleler) return

  // İlçe ortalamalarını hesapla (eksik mahalle verisi için fallback)
  const ilceOrt = new Map<string, number>()
  for (const [ilceId, kira] of ilceKiraMap.entries()) {
    ilceOrt.set(ilceId, kira)
  }

  // P95 outlier sınırı (sezonluk/yanlış veri filtrele)
  const kiralar = mahalleler
    .map(m => m.kira_ortalama)
    .filter((k): k is number => k !== null && k > 0)
    .sort((a, b) => a - b)
  const p95 = kiralar[Math.floor(kiralar.length * 0.95)]
  console.log(`  P95 kira sınırı: ${p95?.toLocaleString('tr-TR')} TL (üstü kırpılır)`)

  // Her mahalleye efektif kira ata
  const efektifKiralar = mahalleler.map(m => {
    let kira = m.kira_ortalama ?? 0
    if (kira === 0) kira = ilceOrt.get(m.ilce_id) ?? 0   // ilçe ortalaması fallback
    if (kira > p95)  kira = p95                           // outlier kırp
    return kira
  })

  const mahSkorlar = linearNorm(efektifKiralar)

  let guncellenen = 0
  for (let i = 0; i < mahalleler.length; i++) {
    const { error } = await supabase
      .from('mahalleler')
      .update({ kira_skoru: mahSkorlar[i] })
      .eq('id', mahalleler[i].id)
    if (!error) guncellenen++
    if (guncellenen % 100 === 0)
      process.stdout.write(`\r  ${guncellenen}/${mahalleler.length}`)
  }
  console.log(`\r✅ ${guncellenen} mahalle kira skoru güncellendi`)

  // Örnek kontrol
  const { data: ornekler } = await supabase
    .from('mahalleler')
    .select('isim, kira_ortalama, kira_skoru')
    .not('kira_ortalama', 'is', null)
    .order('kira_skoru', { ascending: false })
    .limit(5)

  console.log('\n  En yüksek kira skorlu mahalleler:')
  ornekler?.forEach(m =>
    console.log(`    ${m.isim.padEnd(20)} kira: ${m.kira_ortalama?.toLocaleString('tr-TR')} → skor: ${m.kira_skoru}`)
  )
}

main().catch(console.error)
