export interface TesisKategori {
  id:       string
  baslik:   string
  ikon:     string
  renk:     string
  acikRenk: string
  altKategoriler: AltKategori[]
}

export interface AltKategori {
  key:      string
  label:    string
  ikon:     string
  birim:    string
}

export interface TesisSayisi {
  altKategori: string
  sayi:        number
}

export interface KategoriIstatistik {
  kategori:    TesisKategori
  tesisler:    TesisSayisi[]
  toplam:      number
  yoğunluk:   'Düşük' | 'Orta' | 'Yüksek' | 'Çok Yüksek'
  insight:     string
}

export const TESIS_KATEGORILERI: TesisKategori[] = [
  {
    id:       'ulasim',
    baslik:   'Ulaşım',
    ikon:     '🚇',
    renk:     '#3b82f6',
    acikRenk: '#eff6ff',
    altKategoriler: [
      { key: 'metro',    label: 'Metro Durağı',   ikon: '🚇', birim: 'durak'  },
      { key: 'otobus',   label: 'Otobüs Durağı',  ikon: '🚌', birim: 'durak'  },
      { key: 'tramvay',  label: 'Tramvay Durağı', ikon: '🚋', birim: 'durak'  },
      { key: 'vapur',    label: 'Vapur İskelesi', ikon: '⛴️', birim: 'iskele' },
    ],
  },
  {
    id:       'imkanlar',
    baslik:   'Sosyal İmkanlar',
    ikon:     '🏪',
    renk:     '#10b981',
    acikRenk: '#ecfdf5',
    altKategoriler: [
      { key: 'cafe',     label: 'Kafe',      ikon: '☕', birim: 'mekan' },
      { key: 'restoran', label: 'Restoran',   ikon: '🍽️', birim: 'mekan' },
      { key: 'market',   label: 'Market',     ikon: '🛒', birim: 'mekan' },
      { key: 'bar',      label: 'Bar / Pub',  ikon: '🍺', birim: 'mekan' },
      { key: 'firin',    label: 'Fırın',      ikon: '🥐', birim: 'mekan' },
    ],
  },
  {
    id:       'saglik',
    baslik:   'Sağlık',
    ikon:     '🏥',
    renk:     '#ef4444',
    acikRenk: '#fef2f2',
    altKategoriler: [
      { key: 'hastane', label: 'Hastane',  ikon: '🏥', birim: 'kurum'  },
      { key: 'klinik',  label: 'Klinik',   ikon: '🩺', birim: 'kurum'  },
      { key: 'eczane',  label: 'Eczane',   ikon: '💊', birim: 'eczane' },
    ],
  },
  {
    id:       'egitim',
    baslik:   'Eğitim',
    ikon:     '📚',
    renk:     '#8b5cf6',
    acikRenk: '#f5f3ff',
    altKategoriler: [
      { key: 'okul',       label: 'Okul',         ikon: '🏫', birim: 'okul'  },
      { key: 'universite', label: 'Üniversite',    ikon: '🎓', birim: 'kurum' },
      { key: 'anaokulu',   label: 'Anaokulu',      ikon: '🧒', birim: 'okul'  },
      { key: 'kutuphane',  label: 'Kütüphane',     ikon: '📖', birim: 'kurum' },
    ],
  },
  {
    id:       'yesil',
    baslik:   'Yeşil Alan',
    ikon:     '🌳',
    renk:     '#22c55e',
    acikRenk: '#f0fdf4',
    altKategoriler: [
      { key: 'park',    label: 'Park',         ikon: '🌳', birim: 'alan'  },
      { key: 'spor',    label: 'Spor Alanı',   ikon: '⚽', birim: 'alan'  },
      { key: 'sahil',   label: 'Sahil / Kıyı', ikon: '🏖️', birim: 'alan'  },
      { key: 'meydan',  label: 'Meydan',       ikon: '🏛️', birim: 'alan'  },
    ],
  },
  {
    id:       'kultur',
    baslik:   'Kültür & Sanat',
    ikon:     '🎭',
    renk:     '#f59e0b',
    acikRenk: '#fffbeb',
    altKategoriler: [
      { key: 'sinema',   label: 'Sinema',    ikon: '🎬', birim: 'salon' },
      { key: 'tiyatro',  label: 'Tiyatro',   ikon: '🎭', birim: 'salon' },
      { key: 'muze',     label: 'Müze',      ikon: '🏛️', birim: 'mekan' },
      { key: 'galeri',   label: 'Galeri',    ikon: '🖼️', birim: 'mekan' },
    ],
  },
]

export function yogunlukHesapla(
  toplam: number,
  kategoriId: string
): 'Düşük' | 'Orta' | 'Yüksek' | 'Çok Yüksek' {
  const esikler: Record<string, [number, number, number]> = {
    ulasim:   [3,  8,  15],
    imkanlar: [10, 25, 50],
    saglik:   [2,  5,  10],
    egitim:   [3,  8,  15],
    yesil:    [3,  7,  12],
    kultur:   [2,  5,  10],
  }
  const [dusuk, orta, yuksek] =
    esikler[kategoriId] || [5, 10, 20]
  if (toplam === 0)       return 'Düşük'
  if (toplam < dusuk)     return 'Düşük'
  if (toplam < orta)      return 'Orta'
  if (toplam < yuksek)    return 'Yüksek'
  return 'Çok Yüksek'
}

export function insightUret(
  kategoriId: string,
  yogunluk: string,
  toplam: number
): string {
  const metinler: Record<string, Record<string, string>> = {
    ulasim: {
      'Düşük':      'Ulaşım seçenekleri sınırlı, araç kullanımı gerekebilir.',
      'Orta':       'Temel toplu taşıma imkanları mevcut.',
      'Yüksek':     'Güçlü toplu taşıma ağı, araçsız yaşam mümkün.',
      'Çok Yüksek': 'Mükemmel ulaşım altyapısı, şehrin en erişilebilir noktaları.',
    },
    imkanlar: {
      'Düşük':      'Sosyal mekan çeşitliliği sınırlı.',
      'Orta':       'Günlük ihtiyaçları karşılayan mekanlar mevcut.',
      'Yüksek':     'Zengin sosyal yaşam, çeşitli mekan seçenekleri.',
      'Çok Yüksek': 'Yoğun sosyal hayat, her zevke hitap eden mekanlar.',
    },
    saglik: {
      'Düşük':      'Sağlık hizmetlerine erişim sınırlı.',
      'Orta':       'Temel sağlık hizmetleri erişilebilir.',
      'Yüksek':     'Güçlü sağlık altyapısı, hızlı erişim imkanı.',
      'Çok Yüksek': 'Kapsamlı sağlık hizmetleri, her ihtiyaca yönelik.',
    },
    egitim: {
      'Düşük':      'Eğitim kurumları sınırlı, uzak bölgeler mevcut.',
      'Orta':       'Temel eğitim altyapısı yeterli düzeyde.',
      'Yüksek':     'Güçlü eğitim altyapısı, çeşitli kurumlar.',
      'Çok Yüksek': 'Kapsamlı eğitim ekosistemi, her kademede güçlü.',
    },
    yesil: {
      'Düşük':      'Yeşil alan ve açık mekan kısıtlı.',
      'Orta':       'Temel parklar ve açık alanlar mevcut.',
      'Yüksek':     'Yeşil doku güçlü, aktif yaşam için uygun.',
      'Çok Yüksek': 'Geniş yeşil alanlar, doğayla iç içe yaşam imkanı.',
    },
    kultur: {
      'Düşük':      'Kültürel aktivite seçenekleri sınırlı.',
      'Orta':       'Temel kültürel mekanlar erişilebilir.',
      'Yüksek':     'Kültürel yaşam canlı, çeşitli etkinlik seçenekleri.',
      'Çok Yüksek': 'Zengin kültürel doku, her hafta sonu dolu program.',
    },
  }
  return (
    metinler[kategoriId]?.[yogunluk] ||
    `${toplam} tesis mevcut.`
  )
}
