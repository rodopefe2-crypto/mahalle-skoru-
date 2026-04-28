import { QuizCevap, IlceUyumSkoru } from './quizTypes'
import { QUIZ_SORULARI } from './quizSorulari'

const ETIKETLER: Record<string, string> = {
  ulasim:            'Ulaşım',
  imkanlar:          'Sosyal İmkanlar',
  egitim:            'Eğitim',
  saglik:            'Sağlık',
  guvenlik:          'Güvenlik',
  deprem_direnci:    'Deprem Güvenliği',
  yasam_maliyeti:    'Uygun Yaşam Maliyeti',
  sakin_memnuniyeti: 'Sakin Memnuniyeti',
}

export function agirliklarHesapla(cevaplar: QuizCevap[]): Record<string, number> {
  const agirliklar: Record<string, number> = {
    ulasim:            0,
    imkanlar:          0,
    egitim:            0,
    saglik:            0,
    guvenlik:          0,
    deprem_direnci:    0,
    yasam_maliyeti:    0,
    sakin_memnuniyeti: 0,
  }

  cevaplar.forEach(cevap => {
    const soru = QUIZ_SORULARI.find(s => s.id === cevap.soruId)
    if (!soru) return

    cevap.secenekIds?.forEach(secId => {
      const secim = soru.secenekler?.find(s => s.id === secId)
      if (!secim) return
      Object.entries(secim.agirlik).forEach(([key, val]) => {
        agirliklar[key] = (agirliklar[key] || 0) + val
      })
    })
  })

  return agirliklar
}

export function ilceleriPuanla(
  ilceler: any[],
  agirliklar: Record<string, number>
): IlceUyumSkoru[] {
  const toplamAgirlik = Object.values(agirliklar).reduce((t, v) => t + v, 0) || 1

  return ilceler
    .map(ilce => {
      let toplamSkor = 0
      Object.entries(agirliklar).forEach(([param, agirlik]) => {
        const skorKey = param === 'deprem_direnci' ? 'deprem_skoru' : `${param}_skoru`
        const ilceSkor = (ilce[skorKey] as number) || 0
        toplamSkor += ilceSkor * agirlik
      })

      const uyumYuzdesi = Math.round((toplamSkor / (toplamAgirlik * 100)) * 100)

      const skorlar: Record<string, number> = {
        ulasim:            ilce.ulasim_skoru            || 0,
        imkanlar:          ilce.imkanlar_skoru          || 0,
        egitim:            ilce.egitim_skoru            || 0,
        saglik:            ilce.saglik_skoru            || 0,
        guvenlik:          ilce.guvenlik_skoru          || 0,
        deprem_direnci:    ilce.deprem_skoru            || 0,
        yasam_maliyeti:    ilce.yasam_maliyeti_skoru    || 0,
        sakin_memnuniyeti: ilce.sakin_memnuniyeti_skoru || 0,
      }

      const sirali = Object.entries(skorlar).sort(([, a], [, b]) => b - a)

      const gucluYonler = sirali
        .filter(([, s]) => s >= 70)
        .slice(0, 3)
        .map(([k]) => ETIKETLER[k])

      const zayifYonler = sirali
        .filter(([, s]) => s < 60)
        .slice(-2)
        .map(([k]) => ETIKETLER[k])

      return {
        slug:         ilce.slug,
        isim:         ilce.isim,
        aciklama:     ilce.aciklama || '',
        uyumYuzdesi:  Math.min(uyumYuzdesi, 99),
        gucluYonler,
        zayifYonler,
        skorlar,
      }
    })
    .sort((a, b) => b.uyumYuzdesi - a.uyumYuzdesi)
}
