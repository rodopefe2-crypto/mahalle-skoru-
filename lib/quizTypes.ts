export interface QuizSorusu {
  id: string
  soru: string
  altBaslik: string
  tip: 'single' | 'multi' | 'slider'
  secenekler?: QuizSecenegi[]
  sliderMin?: number
  sliderMax?: number
  sliderBirim?: string
  parametre: string
}

export interface QuizSecenegi {
  id: string
  etiket: string
  ikon: string
  agirlik: Record<string, number>
}

export interface QuizCevap {
  soruId: string
  secenekIds?: string[]
  sliderDeger?: number
}

export interface IlceUyumSkoru {
  slug: string
  isim: string
  aciklama: string
  uyumYuzdesi: number
  gucluYonler: string[]
  zayifYonler: string[]
  skorlar: Record<string, number>
}
