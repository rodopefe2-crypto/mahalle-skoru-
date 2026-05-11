export interface QuizSorusu {
  id: string
  bolum: string
  soru: string
  ikon: string
  secenekler: QuizSecenegi[]
}

export interface QuizSecenegi {
  label: string
  value: string
  agirlik: Record<string, number>
  kira_max?: number
}

export interface QuizCevap {
  value: string
  agirlik: Record<string, number>
  kira_max?: number
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
