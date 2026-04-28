import { Ilce, Parametreler } from './types'

export function agirlikliGenelSkor(ilce: Ilce, agirliklar: Parametreler): number {
  const parametreler = {
    ulasim: ilce.ulasim_skoru,
    imkanlar: ilce.imkanlar_skoru,
    egitim: ilce.egitim_skoru,
    yasam_maliyeti: ilce.yasam_maliyeti_skoru,
    guvenlik: ilce.guvenlik_skoru,
    saglik: ilce.saglik_skoru,
    deprem: ilce.deprem_skoru,
    sakin_memnuniyeti: ilce.sakin_memnuniyeti_skoru,
  }

  const agirlikToplami = Object.values(agirliklar).reduce((sum, w) => sum + w, 0)
  const agirlikliToplam = Object.entries(parametreler).reduce((sum, [key, skor]) => {
    return sum + (skor * agirliklar[key as keyof Parametreler])
  }, 0)

  return agirlikToplami > 0 ? agirlikliToplam / agirlikToplami : 0
}

export function ilceSirala(ilceler: Ilce[], agirliklar: Parametreler): Ilce[] {
  return [...ilceler].sort((a, b) => {
    const skorA = agirlikliGenelSkor(a, agirliklar)
    const skorB = agirlikliGenelSkor(b, agirliklar)
    return skorB - skorA // Yüksek skor önce
  })
}

export function skorRenk(skor: number): string {
  if (skor >= 75) return 'text-green-700 bg-green-50 border-green-200'
  if (skor >= 50) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}