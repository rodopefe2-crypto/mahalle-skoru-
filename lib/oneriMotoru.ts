import { QuizCevap, IlceUyumSkoru } from './quizTypes'

export const ETIKETLER: Record<string, string> = {
  ulasim:          'Ulaşım',
  guvenlik:        'Güvenlik',
  imkanlar:        'Sosyal İmkanlar',
  egitim:          'Eğitim',
  saglik:          'Sağlık',
  deprem_skoru:    'Deprem Güvenliği',
  yesil_alan:      'Yeşil Alan',
  kultur:          'Kültür & Sanat',
  yasam_maliyeti:  'Uygun Yaşam Maliyeti',
}

const DB_KOLON: Record<string, string> = {
  ulasim:         'ulasim_skoru',
  guvenlik:       'guvenlik_skoru',
  imkanlar:       'imkanlar_skoru',
  egitim:         'egitim_skoru',
  saglik:         'saglik_skoru',
  deprem_skoru:   'deprem_skoru',
  yesil_alan:     'yesil_alan_skoru',
  kultur:         'kultur_skoru',
  yasam_maliyeti: 'yasam_maliyeti_skoru',
}

export function agirliklarHesapla(
  cevaplar: Record<string, QuizCevap>
): Record<string, number> {
  const base: Record<string, number> = {
    ulasim: 1.0, guvenlik: 1.0, imkanlar: 1.0, egitim: 1.0,
    saglik: 1.0, deprem_skoru: 1.0, yesil_alan: 1.0, kultur: 1.0,
    yasam_maliyeti: 1.0,
  }

  for (const cevap of Object.values(cevaplar)) {
    for (const [param, deger] of Object.entries(cevap.agirlik || {})) {
      if (param in base) base[param] *= deger
    }
  }

  const toplam = Object.values(base).reduce((a, b) => a + b, 0)
  return Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, v / toplam])
  )
}

export function kiraMaxAl(cevaplar: Record<string, QuizCevap>): number {
  return cevaplar['kira_butce']?.kira_max ?? 200000
}

export function ilceleriPuanla(
  ilceler: any[],
  agirliklar: Record<string, number>,
  kiraMax: number
): (IlceUyumSkoru & { id: string; hamSkor: number; kiraCeza: number })[] {
  return ilceler
    .map(ilce => {
      const params: Record<string, number> = {
        ulasim:         ilce.ulasim_skoru         || 0,
        guvenlik:       ilce.guvenlik_skoru        || 0,
        imkanlar:       ilce.imkanlar_skoru        || 0,
        egitim:         ilce.egitim_skoru          || 0,
        saglik:         ilce.saglik_skoru          || 0,
        deprem_skoru:   ilce.deprem_skoru          || 0,
        yesil_alan:     ilce.yesil_alan_skoru      || 0,
        kultur:         ilce.kultur_skoru          || 0,
        yasam_maliyeti: ilce.yasam_maliyeti_skoru  || 0,
      }

      let toplamAgirlik = 0
      let agirlikliSkor = 0

      for (const [param, agirlik] of Object.entries(agirliklar)) {
        if (params[param] !== undefined) {
          agirlikliSkor += params[param] * agirlik
          toplamAgirlik += agirlik
        }
      }

      const hamSkor = toplamAgirlik > 0 ? agirlikliSkor / toplamAgirlik : 50

      // Kira cezası: ilce.kira_ortalama yoksa yasam_maliyeti_skoru'nu proxy kullan
      let kiraCeza = 0
      if (kiraMax && kiraMax < 70000) {
        const ilceKira = ilce.kira_ortalama || 30000
        if (ilceKira > kiraMax * 1.2) {
          kiraCeza = Math.min(20, ((ilceKira - kiraMax) / kiraMax) * 30)
        }
      }

      const uyumPuani = Math.min(99, Math.max(1, Math.round(hamSkor - kiraCeza)))

      const sirali = Object.entries(params).sort(([, a], [, b]) => b - a)
      const gucluYonler = sirali.filter(([, s]) => s >= 65).slice(0, 3).map(([k]) => ETIKETLER[k])
      const zayifYonler = sirali.filter(([, s]) => s < 50).slice(-2).reverse().map(([k]) => ETIKETLER[k])

      return {
        id:           ilce.id,
        slug:         ilce.slug,
        isim:         ilce.isim,
        aciklama:     ilce.aciklama || '',
        uyumYuzdesi:  uyumPuani,
        hamSkor,
        kiraCeza,
        gucluYonler,
        zayifYonler,
        skorlar:      params,
      }
    })
    .sort((a, b) => b.uyumYuzdesi - a.uyumYuzdesi)
}
