export interface AltKategoriSatiri {
  key:      string
  label:    string
  ikon:     string
  sayi:     number
  vurgulu?: boolean
}

export interface UnifiedParametre {
  id:             string
  baslik:         string
  ikon:           string
  renk:           string
  acikRenk:       string
  skor:           number
  insight:        string
  altKategoriler: AltKategoriSatiri[]
  toplamSayi?:    number
}

export function skorInsight(
  paramId: string,
  skor:    number
): string {
  const metinler: Record<string, [string, string, string, string]> = {
    ulasim: [
      'Ulaşım altyapısı yetersiz, araç kullanımı gerekiyor.',
      'Temel toplu taşıma imkanları mevcut.',
      'Güçlü ulaşım ağı, araçsız yaşam kolaylaşıyor.',
      'Mükemmel ulaşım altyapısı, şehrin en erişilebilir noktası.',
    ],
    saglik: [
      'Sağlık hizmetlerine erişim kısıtlı.',
      'Temel sağlık hizmetleri karşılanıyor.',
      'Güçlü sağlık altyapısı, hızlı erişim mümkün.',
      'Kapsamlı sağlık ekosistemi, her ihtiyaca yönelik.',
    ],
    egitim: [
      'Eğitim kurumları yetersiz.',
      'Temel eğitim altyapısı yeterli.',
      'Güçlü eğitim altyapısı, çeşitli seçenekler.',
      'Kapsamlı eğitim ekosistemi, her kademede güçlü.',
    ],
    imkanlar: [
      'Sosyal mekan çeşitliliği sınırlı.',
      'Günlük ihtiyaçları karşılayan mekanlar var.',
      'Zengin sosyal yaşam, çeşitli seçenekler.',
      'Yoğun sosyal hayat, her zevke hitap ediyor.',
    ],
    yesil: [
      'Yeşil alan ve açık mekan oldukça kısıtlı.',
      'Temel parklar ve açık alanlar mevcut.',
      'Yeşil doku güçlü, aktif yaşam uygun.',
      'Geniş yeşil alanlar, doğayla iç içe yaşam.',
    ],
    kultur: [
      'Kültürel mekan ve etkinlik imkanı çok sınırlı.',
      'Temel sinema ve kültür mekanları mevcut.',
      'Zengin kültür hayatı, çeşitli sanat etkinlikleri.',
      'Canlı kültür sahnesi, müzeden tiyatroya her şey.',
    ],
    guvenlik: [
      'Güvenlik algısı düşük, dikkat gerekiyor.',
      'Ortalama güvenlik seviyesi.',
      'Genel olarak güvenli bir bölge.',
      'Çok güvenli, sakin ve huzurlu yaşam.',
    ],
    deprem_direnci: [
      'Yüksek deprem riski, zemin etüdü şart.',
      'Orta düzey deprem riski.',
      'Görece düşük deprem riski.',
      'Düşük deprem riski, güvenli zemin yapısı.',
    ],
    yasam_maliyeti: [
      'Yaşam maliyeti çok yüksek.',
      'Ortalama yaşam maliyeti.',
      'Makul fiyatlarla kaliteli yaşam.',
      'Uygun fiyatlı, bütçe dostu bölge.',
    ],
  }
  const idx = skor >= 75 ? 3 : skor >= 55 ? 2 : skor >= 35 ? 1 : 0
  return (
    metinler[paramId]?.[idx] ||
    `${skor} puan ile ${skor >= 60 ? 'iyi' : 'gelişime açık'} bir profil.`
  )
}
