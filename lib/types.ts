export interface Ilce {
  id: string
  isim: string
  slug: string
  aciklama: string
  koordinat_lat: number
  koordinat_lng: number
  ulasim_skoru: number
  imkanlar_skoru: number
  egitim_skoru: number
  yasam_maliyeti_skoru: number
  guvenlik_skoru: number
  saglik_skoru: number
  deprem_skoru: number
  sakin_memnuniyeti_skoru: number
  yesil_alan_skoru: number
  kultur_skoru: number
  nufus_yogunlugu_skoru?: number
  genel_skor: number
}

export interface Yorum {
  id: string
  ilce_id: string
  kullanici_tipi: 'kiracı' | 'ev sahibi' | 'çalışan' | 'öğrenci' | 'emekli'
  ikamet_suresi: string
  yorum_metni: string
  guvenlik_puani: number
  memnuniyet_puani: number
  created_at: string
}

export interface Parametreler {
  ulasim: number
  imkanlar: number
  egitim: number
  yasam_maliyeti: number
  guvenlik: number
  saglik: number
  deprem: number
  sakin_memnuniyeti: number
  yesil_alan: number
  kultur: number
}

export const PARAMETRE_ETIKETLERI: Record<keyof Parametreler, string> = {
  ulasim: 'Ulaşım',
  imkanlar: 'İmkanlar',
  egitim: 'Eğitim',
  yasam_maliyeti: 'Yaşam Maliyeti',
  guvenlik: 'Güvenlik',
  saglik: 'Sağlık',
  deprem: 'Deprem Riski',
  sakin_memnuniyeti: 'Sakin Memnuniyeti',
  yesil_alan: 'Yeşil Alan',
  kultur: 'Kültür & Sanat',
}