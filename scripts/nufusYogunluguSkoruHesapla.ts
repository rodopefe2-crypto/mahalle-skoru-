import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// TÜİK 2023 — nüfus yoğunluğu (kişi/km²)
// Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi 2023
const YOGUNLUK_VERISI: Record<string, number> = {
  gungoren:       40933,
  bahcelievler:   35765,
  bagcilar:       33067,
  esenler:        32230,
  kagithane:      32207,
  bayrampasa:     29892,
  fatih:          27736,
  beyoglu:        27528,
  zeytinburnu:    24959,
  gaziosmanpasa:  24667,
  sultangazi:     22008,
  kucukcekmece:   21671,
  esenyurt:       17172,
  kadikoy:        18071,
  umraniye:       15771,
  uskudar:        14902,
  atasehir:       16786,
  sisli:          11574,
  sultanbeyli:    11570,
  kartal:         12839,
  beylikduzu:     10134,
  avcilar:         9225,
  besiktas:        9565,
  bakirkoy:        7845,
  maltepe:         8007,
  sancaktepe:      3293,
  pendik:          4480,
  basaksehir:      4595,
  eyupsultan:      3885,
  adalar:          1560,
  buyukcekmece:    2136,
  sariyer:         2407,
  tuzla:           1936,
  cekmekoy:        1472,
  arnavutkoy:       744,
  beykoz:           636,
  silivri:          244,
  sile:              56,
  catalca:           57,
}

async function main() {
  console.log('Nüfus yoğunluğu skoru hesaplanıyor...')
  console.log('Kaynak: TÜİK ADNKS 2023\n')
  console.log('Mantık: Düşük yoğunluk → yüksek skor (daha yaşanabilir)')

  const yogunluklar = Object.values(YOGUNLUK_VERISI)
  const maxYog = Math.max(...yogunluklar)  // Güngören: 40.933
  const minYog = Math.min(...yogunluklar)  // Şile: 56

  console.log(`\nEn yoğun:  Güngören ${maxYog.toLocaleString('tr')} kişi/km²`)
  console.log(`En seyrek: Şile     ${minYog.toLocaleString('tr')} kişi/km²\n`)

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug')

  if (!ilceler?.length) return

  const sonuclar: { isim: string; yogunluk: number; skor: number }[] = []

  for (const ilce of ilceler) {
    const yogunluk = YOGUNLUK_VERISI[ilce.slug]
    if (!yogunluk) {
      console.warn(`  ⚠️  Veri yok: ${ilce.slug}`)
      continue
    }

    // Ters log normalizasyon: yoğun = düşük skor
    const logYog = Math.log(yogunluk)
    const logMax = Math.log(maxYog)
    const logMin = Math.log(minYog)
    const skor   = Math.round((1 - (logYog - logMin) / (logMax - logMin)) * 100)

    sonuclar.push({ isim: ilce.isim, yogunluk, skor })

    const { error } = await supabase
      .from('ilceler')
      .update({ nufus_yogunlugu_skoru: skor })
      .eq('id', ilce.id)

    if (error) console.error(`  ✗ ${ilce.isim}:`, error.message)
  }

  sonuclar.sort((a, b) => b.skor - a.skor)

  console.log('── Nüfus Yoğunluğu Sıralaması ─────────────')
  console.log('(Yüksek skor = seyrek = daha sakin)\n')
  sonuclar.forEach((s, idx) => {
    const bar = '█'.repeat(Math.round(s.skor / 5))
    console.log(
      `  ${String(idx + 1).padStart(2)}. ` +
      `${s.isim.padEnd(15)} ` +
      `${bar.padEnd(20)} ` +
      `${s.skor} puan ` +
      `(${s.yogunluk.toLocaleString('tr')} kişi/km²)`
    )
  })

  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
