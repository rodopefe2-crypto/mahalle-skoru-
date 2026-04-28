export interface KarsilastirmaBoyutu {
  key: string
  label: string
  ikon: string
  renk: string
  aciklama: string
  kategori: 'temel' | 'yasam' | 'profil'
}

export interface IlceKarsilastirma {
  slug: string
  isim: string
  aciklama: string
  genel_skor: number
  skorlar: {
    ulasim: number
    guvenlik: number
    imkanlar: number
    egitim: number
    saglik: number
    deprem_direnci: number
    yasam_maliyeti: number
    sakin_memnuniyeti: number
    yesil_alan: number
    kultur: number
  }
  gucluYonler: string[]
  zayifYonler: string[]
  kimIcin: string[]
  kirmiziBayraklar: string[]
  ozet: string
}

export interface KarsilastirmaOzeti {
  kazanan: string
  kazananNeden: string
  tavsiye: string
  farklar: {
    boyut: string
    kazanan: string
    fark: number
  }[]
}
