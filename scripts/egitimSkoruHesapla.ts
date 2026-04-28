import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Puanlar 3× artırıldı (7-23 → 20-70)
// Mantık: Üniversite varlığı niteliksel fark yaratmalı,
// büyük ilçenin okul kalabalığını dengelemeli
const UNIVERSITE_PUANLARI: Record<string, number> = {
  'koç üniversitesi':                      70,
  'boğaziçi üniversitesi':                 68,
  'istanbul teknik üniversitesi':          68,
  'sabancı üniversitesi':                  65,
  'istanbul üniversitesi':                 62,
  'istanbul üniversitesi cerrahpaşa':      62,
  'marmara üniversitesi':                  62,
  'yıldız teknik üniversitesi':            58,
  'istanbul medipol üniversitesi':         54,
  'istanbul bilgi üniversitesi':           50,
  'beykent üniversitesi':                  50,
  'medeniyet üniversitesi':                50,
  'istanbul medeniyet üniversitesi':       50,
  'kadir has üniversitesi':                50,
  'yeditepe üniversitesi':                 48,
  'bahçeşehir üniversitesi':               48,
  'üsküdar üniversitesi':                  48,
  'işık üniversitesi':                     44,
  'maltepe üniversitesi':                  44,
  'okan üniversitesi':                     44,
  'istanbul okan üniversitesi':            44,
  'özyeğin üniversitesi':                  44,
  'fatih sultan mehmet üniversitesi':      40,
  'haliç üniversitesi':                    40,
  'gelişim üniversitesi':                  40,
  'istanbul gelişim üniversitesi':         40,
  'nişantaşı üniversitesi':                36,
  'atlas üniversitesi':                    36,
  'biruni üniversitesi':                   36,
  'altınbaş üniversitesi':                 32,
  'aydın üniversitesi':                    32,
  'istanbul aydın üniversitesi':           32,
  'esenyurt üniversitesi':                 28,
  'istinye üniversitesi':                  28,
  'kültür üniversitesi':                   25,
  'istanbul kültür üniversitesi':          25,
  'rumeli üniversitesi':                   22,
  'topkapı üniversitesi':                  22,
  'beykoz üniversitesi':                   20,
  'sultan 2. abdülhamid han üniversitesi': 20,
  'ticaret üniversitesi':                  20,
  'istanbul ticaret üniversitesi':         20,
}

function okullTipiTespitEt(isim: string | null): { tip: string; puan: number } {
  if (!isim) return { tip: 'genel_lise', puan: 7 }
  const k = isim.toLowerCase()

  if (k.includes('üniversite') || k.includes('university')) {
    for (const [uniIsim, puan] of Object.entries(UNIVERSITE_PUANLARI)) {
      if (k.includes(uniIsim.toLowerCase().split(' ')[0]) ||
          uniIsim.toLowerCase().includes(k.split(' ')[0])) {
        return { tip: 'universite', puan }
      }
    }
    return { tip: 'universite', puan: 10 }
  }
  if (k.includes('kolej') || k.includes('koleji') || k.includes('college'))
    return { tip: 'kolej', puan: 10 }
  if (k.includes('fen lisesi') || k.includes('fen ve ') || k.includes('fen bilimleri'))
    return { tip: 'fen_lisesi', puan: 12 }
  if (k.includes('sosyal bilimler'))
    return { tip: 'sosyal_bilimler_lisesi', puan: 12 }
  if (k.includes('anadolu lisesi') || k.includes('anadolu lise'))
    return { tip: 'anadolu_lisesi', puan: 12 }
  if (k.includes('lise') || k.includes('high school'))
    return { tip: 'genel_lise', puan: 7 }
  if (k.includes('ortaokul') || k.includes('orta okul') || k.includes('middle school') || k.includes('secondary'))
    return { tip: 'ortaokul', puan: 5 }
  if (k.includes('ilkokul') || k.includes('ilk okul') || k.includes('primary') || k.includes('elementary'))
    return { tip: 'ilkokul', puan: 5 }
  if (k.includes('anaokul') || k.includes('ana okul') || k.includes('kindergarten') || k.includes('kreş') || k.includes('yuva'))
    return { tip: 'anaokul', puan: 5 }
  if (k.includes('kütüphane') || k.includes('library'))
    return { tip: 'kutuphane', puan: 5 }
  return { tip: 'genel_lise', puan: 7 }
}

function altKategoriPuani(altKat: string): number {
  const map: Record<string, number> = {
    school: 7, university: 10, college: 10,
    kindergarten: 5, library: 5,
    okul: 7, universite: 10, anaokulu: 5, kutuphane: 5,
  }
  return map[altKat] || 5
}

async function main() {
  console.log('Eğitim skoru (puan bazlı) hesaplanıyor...')
  console.log('Puan tablosu:')
  console.log('  Anaokulu/İlkokul/Ortaokul: 5 puan')
  console.log('  Normal Lise:               7 puan')
  console.log('  Nitelikli Lise:           12 puan')
  console.log('  Kolej:                    10 puan')
  console.log('  Üniversite:            7-23 puan\n')

  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug')

  if (!ilceler?.length) return

  const ilcePuanlari: Record<string, { toplamPuan: number; detay: Record<string, number> }> = {}

  for (const ilce of ilceler) {
    const { data: tesisler } = await supabase
      .from('ilce_tesisler')
      .select('alt_kategori, isim')
      .eq('ilce_id', ilce.id)
      .eq('kategori', 'egitim')

    if (!tesisler?.length) {
      ilcePuanlari[ilce.slug] = { toplamPuan: 0, detay: {} }
      continue
    }

    let toplamPuan = 0
    const detay: Record<string, number> = {
      anaokul: 0, ilkokul: 0, ortaokul: 0,
      genel_lise: 0, anadolu_lisesi: 0, fen_lisesi: 0,
      sosyal_bilimler_lisesi: 0, kolej: 0, universite: 0, kutuphane: 0,
    }

    for (const tesis of tesisler) {
      if (tesis.isim) {
        const { tip, puan } = okullTipiTespitEt(tesis.isim)
        toplamPuan += puan
        if (detay[tip] !== undefined) detay[tip]++
      } else {
        const puan = altKategoriPuani(tesis.alt_kategori || '')
        toplamPuan += puan
        detay['genel_lise']++
      }
    }

    ilcePuanlari[ilce.slug] = { toplamPuan, detay }

    console.log(`\n── ${ilce.isim} ──`)
    console.log(`  Toplam puan: ${toplamPuan}`)
    console.log(`  Üniversite: ${detay.universite}, Nitelikli Lise: ${detay.anadolu_lisesi + detay.fen_lisesi + detay.sosyal_bilimler_lisesi}`)
  }

  const puanlar = Object.values(ilcePuanlari).map(v => v.toplamPuan)
  const maxPuan = Math.max(...puanlar)
  const minPuan = Math.min(...puanlar.filter(p => p > 0))

  console.log(`\nMax puan: ${maxPuan}, Min puan: ${minPuan}`)
  console.log('\n── Eğitim Sıralaması ──────────────────')

  const sonuclar: { slug: string; isim: string; skor: number; ham: number }[] = []

  for (const ilce of ilceler) {
    const { toplamPuan } = ilcePuanlari[ilce.slug] || { toplamPuan: 0 }

    let skor = 0
    if (toplamPuan > 0 && maxPuan > minPuan) {
      const logPuan = Math.log(toplamPuan + 1)
      const logMax  = Math.log(maxPuan + 1)
      const logMin  = Math.log(minPuan + 1)
      skor = Math.round(((logPuan - logMin) / (logMax - logMin)) * 100)
    }

    sonuclar.push({ slug: ilce.slug, isim: ilce.isim, skor, ham: toplamPuan })

    const { error } = await supabase
      .from('ilceler')
      .update({ egitim_skoru: skor })
      .eq('id', ilce.id)

    if (error) console.error(`  ✗ ${ilce.isim}:`, error.message)
  }

  sonuclar.sort((a, b) => b.skor - a.skor)
  sonuclar.forEach((s, idx) => {
    console.log(
      `  ${String(idx + 1).padStart(2)}. ${s.isim.padEnd(15)} → ${s.skor} puan (ham: ${s.ham})`
    )
  })

  console.log('\n✅ Tamamlandı!')
  console.log('\nGenel skoru güncellemek için SQL Editor\'da:')
  console.log(`
UPDATE ilceler
SET genel_skor = ROUND(
  COALESCE(ulasim_skoru, 0)         * 0.22 +
  COALESCE(saglik_skoru, 0)         * 0.18 +
  COALESCE(egitim_skoru, 0)         * 0.18 +
  COALESCE(imkanlar_skoru, 0)       * 0.15 +
  COALESCE(deprem_skoru, 0)         * 0.10 +
  COALESCE(yesil_alan_skoru, 0)     * 0.08 +
  COALESCE(kultur_skoru, 0)         * 0.04 +
  COALESCE(yasam_maliyeti_skoru, 0) * 0.05
);
  `)
}

main().catch(console.error)
