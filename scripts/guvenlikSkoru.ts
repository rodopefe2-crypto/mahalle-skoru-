import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ILCE_KIRA: Record<string, number> = {
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

function kiraGuvenlikSkoru(mahalleKira: number | null, ilceSlug: string): number {
  const kira = mahalleKira || ILCE_KIRA[ilceSlug] || 25000
  const kiraCapli = Math.min(kira, 120000)
  const LOG_MIN = Math.log(15000)
  const LOG_MAX = Math.log(120000)
  return Math.round(((Math.log(kiraCapli) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100)
}

// ── BONUS LİSTESİ (+15 puan) ─────────────────────────
const BONUS_15: Record<string, string[]> = {
  besiktas: [
    'ETİLER', 'LEVENT', 'BEBEK',
    'ARNAVUTKÖY', 'AKATLAR', 'ULUS',
    'VİŞNEZADE', 'NİSBETİYE', 'LEVAZIM',
    'ABBASAĞA', 'SİNANPAŞA', 'DİKİLİTAŞ',
  ],
  kadikoy: [
    'MODA', 'CAFERAĞA', 'OSMANAĞA',
    'CADDEBOSTAN', 'FENERBAHÇE', 'SUADİYE',
    'ERENKÖY', 'GÖZTEPE', 'ZÜHTÜPAŞA',
    'RASİMPAŞA', 'HASANPAŞA',
  ],
  sariyer: [
    'TARABYA', 'YENİKÖY', 'İSTİNYE',
    'EMİRGAN', 'ZEKERİYAKÖY', 'KINIKLI',
    'BAHÇEKÖY', 'BÜYÜKDERE', 'USKUMRUKÖY',
    'DEMİRCİKÖY',
  ],
  uskudar: [
    'KUZGUNCUK', 'ÇENGELKÖY', 'ANADOLU HİSARI',
    'KANDİLLİ', 'VANİKÖY', 'BEYLERBEYI',
    'ALTUNIZADE', 'BARBAROS', 'KISIKLI',
    'BULGURLU', 'SELAMİ ALİ',
  ],
  sisli: [
    'NİŞANTAŞI', 'TEŞVİKİYE', 'HARBİYE',
    'MECİDİYEKÖY', 'FULYA', 'MERKEZ',
    'FERİKÖY',
  ],
  bakirkoy: [
    'YEŞİLKÖY', 'ATAKÖY 1. KISIM',
    'ATAKÖY 2-5-6. KISIM',
    'ATAKÖY 3-4-11. KISIM',
    'ATAKÖY 7-8-9-10. KISIM',
    'YEŞİLYURT', 'FLORYA',
    'SİYAVUŞPAŞA', 'ZEYTİNLİK',
    'YENİMAHALLE', 'SAKIZAĞACI',
    'CEVİZLİK', 'KARTALTEPE',
  ],
  atasehir: [
    'BARBAROS', 'KÜÇÜKBAKKALKÖY',
    'İÇERENKÖY', 'FEVZİ ÇAKMAK',
    'KAYIŞDAĞI',
  ],
  maltepe: [
    'KÜÇÜKYALI', 'ALTAYÇEŞME',
    'İDEALTEPE', 'BAĞLARBAŞI',
    'DRAGOS', 'CEVIZLI',
  ],
  beykoz: [
    'ACARKENT', 'BEYKOZ KONAKLARI',
    'ANADOLU KAVAGI', 'POLENEZKÖY',
    'ÇUBUKLU',
  ],
  adalar: [
    'MADEN', 'NİZAM', 'BURGAZ',
    'HEYBELİADA', 'KINALI',
  ],
}

// ── ORTA BONUS (+8 puan) ─────────────────────────────
const BONUS_8: Record<string, string[]> = {
  kadikoy: [
    'ACIBÂDEM', 'FENERYOLU', 'KOŞUYOLU',
    'BOSTANCI', 'MERDİVENKÖY', 'KOZYATAĞI',
    'SAHRAYICEDİT', 'DUMLUPINAR',
  ],
  besiktas: [
    'ORTAKÖY', 'BALMUMCU', 'GAYRETTEPE',
    'MECİDİYE', 'MURADİYE', 'TÜRKALİ',
    'CİHANNÜMA', 'YILDIZ',
  ],
  uskudar: [
    'ACIBÂDEM', 'MIMAR SİNAN', 'SALACAK',
    'ZEYNEPKAMİL', 'AHMEDİYE',
    'VALİDE-İ ATİK', 'SULTANTEPE',
  ],
  sisli: [
    'BOZKURT', 'ERGENEKON', 'KİRAZLI',
    'FERİKÖY', 'HALASKARGAZI',
  ],
  bakirkoy: [
    'OSMANİYE', 'İNCİRLİ', 'ŞİRİNEVLER',
  ],
  beyoglu: [
    'CİHANGİR', 'ASMALI MESCİT',
    'TOMTOM', 'FİRUZAĞA',
    'KULOĞLU', 'HACIMİMİ',
  ],
  atasehir: [
    'ATATÜRK', 'ADEM YAVUZ',
    'MEVLANA', 'YENİSAHRA',
  ],
  maltepe: [
    'GÜLSUYU', 'ESENKENT', 'BAŞIBÜYÜK',
  ],
  sariyer: [
    'KIREÇBURNU', 'RUMELİHİSARI',
    'BALTALIMANL', 'BOĞAZİÇİ',
  ],
  umraniye: [
    'ESENEVLER', 'ALTINTEPE', 'NAMIK KEMAL',
  ],
  kartal: [
    'ESENTEPE', 'TOPSELVI', 'ORHANTEPE',
  ],
}

// ── CEZA LİSTESİ (-20 puan) ──────────────────────────
const CEZA_20: Record<string, string[]> = {
  beyoglu:    ['TARLABAŞI', 'DOLAPDERE'],
  sultangazi: ['GAZİ'],
  sisli:      ['KUŞTEPE'],
  eyupsultan: ['HACIHÜSREv', 'ALİBEYKÖY'],
}

// ── ORTA CEZA (-12 puan) ─────────────────────────────
const CEZA_12: Record<string, string[]> = {
  beyoglu:       ['KASIMPAŞA', 'PİYALEPAŞA'],
  gaziosmanpasa: ['SARILIGÖL', 'FEVZİ ÇAKMAK', 'KARAYOLLARI', 'YENİDOĞAN'],
  kucukcekmece:  ['KANARYA', 'İNÖNÜ'],
  bagcilar:      ['KILAVUZTEPE', 'DEMİRKAPI'],
  esenler:       ['TURGUT REİS', 'MENDERES'],
  kagithane:     ['GÜLTEPE', 'HARMANTEPE'],
  bayrampasa:    ['MURATPAŞA', 'YENİDOĞAN'],
  esenyurt:      ['KADİKÖY', 'NAMIK KEMAL'],
  sultanbeyli:   ['MEHMET AKİF', 'TURGUT ÖZAL'],
}

// ── KÜÇÜK CEZA (-6 puan) ─────────────────────────────
const CEZA_6: Record<string, string[]> = {
  fatih:       ['AKSARAY', 'YEDİKULE'],
  beyoglu:     ['OKMEYDANI'],
  kagithane:   ['ÇAĞLAYAN', 'NURTEPE'],
  zeytinburnu: ['TELSİZ', 'ÇIRPICI'],
  gungoren:    ['GÜNEŞTEPE', 'TOZKOPARAN'],
  bagcilar:    ['YENİMAHALLE', 'SEYRAN'],
}

function eslesimVar(liste: string[], mahalleIsim: string): boolean {
  return liste.some(b => mahalleIsim.includes(b) || b.includes(mahalleIsim))
}

async function main() {
  console.log('Mahalle güvenlik skorları hesaplanıyor...\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, slug, kira_ortalama, ilce:ilce_id(id, isim, slug, guvenlik_skoru)')

  if (!mahalleler?.length) { console.error('Mahalle bulunamadı'); return }

  let guncellenen = 0
  const detaylar: { isim: string; ilce: string; ilceSkor: number; bonus: number; final: number }[] = []

  for (const mahalle of mahalleler) {
    const ilce         = mahalle.ilce as any
    const ilceSlug     = ilce?.slug || ''
    const ilceGuvenlik = ilce?.guvenlik_skoru || 50
    const isim         = mahalle.isim.toUpperCase()

    let bonus = 0

    if (eslesimVar(BONUS_15[ilceSlug] || [], isim))      bonus = 15
    else if (eslesimVar(BONUS_8[ilceSlug] || [], isim))  bonus = 8

    // Cezalar bonusun üzerine yazar
    if (eslesimVar(CEZA_20[ilceSlug] || [], isim))       bonus = -20
    else if (eslesimVar(CEZA_12[ilceSlug] || [], isim))  bonus = -12
    else if (eslesimVar(CEZA_6[ilceSlug]  || [], isim))  bonus = -6

    const kiraSkor  = kiraGuvenlikSkoru((mahalle as any).kira_ortalama ?? null, ilceSlug)
    const bazSkor   = ilceGuvenlik * 0.40
    const kiraBiles = kiraSkor     * 0.30
    const hamSkor   = bazSkor + kiraBiles + bonus + ilceGuvenlik * 0.30

    const finalSkor = Math.min(100, Math.max(0, Math.round(hamSkor)))

    const { error } = await supabase
      .from('mahalleler')
      .update({ guvenlik_skoru: finalSkor })
      .eq('id', mahalle.id)

    if (!error) {
      guncellenen++
      if (bonus !== 0) {
        detaylar.push({ isim: mahalle.isim, ilce: ilce?.isim || '', ilceSkor: ilceGuvenlik, bonus, final: finalSkor })
      }
    }
  }

  // genel_skor güncelle
  const { data: tumMahalleler } = await supabase
    .from('mahalleler')
    .select('id, ulasim_skoru, imkanlar_skoru, saglik_skoru, egitim_skoru, yesil_alan_skoru, kultur_skoru, guvenlik_skoru, ilce:ilce_id(genel_skor)')

  for (const m of tumMahalleler || []) {
    const ilceGenel = (m.ilce as any)?.genel_skor ?? 50
    const genel_skor = Math.min(100, Math.round(
      (m.ulasim_skoru   || 0) * 0.200 +
      (m.imkanlar_skoru || 0) * 0.175 +
      (m.saglik_skoru   || 0) * 0.125 +
      (m.egitim_skoru   || 0) * 0.125 +
      (m.yesil_alan_skoru || 0) * 0.100 +
      (m.kultur_skoru   || 0) * 0.075 +
      (m.guvenlik_skoru || 0) * 0.200 +
      ilceGenel               * 0.000  // ilce etkisi burada değil
    ))
    await supabase.from('mahalleler').update({ genel_skor }).eq('id', m.id)
  }

  console.log(`✅ ${guncellenen} mahalle güvenlik skoru güncellendi`)
  console.log('\n── Bonus/Ceza Uygulananlar ───────────────────────────────')
  detaylar
    .sort((a, b) => b.bonus - a.bonus)
    .forEach(d => {
      const isaret = d.bonus > 0 ? '+' : ''
      console.log(
        `  ${d.isim.padEnd(22)} ${d.ilce.padEnd(14)} ${d.ilceSkor} ${isaret}${d.bonus} → ${d.final}`
      )
    })
}

main().catch(console.error)
