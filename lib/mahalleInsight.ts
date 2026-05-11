export interface InsightSkorlar {
  genel: number
  ulasim: number
  guvenlik: number
  imkanlar: number
  egitim: number
  saglik: number
  yesil_alan: number
  kultur: number
  sakinlik: number
  kira_ortalama?: number
}

export interface InsightSonuc {
  ozet: string
  artilar: string[]
  eksiler: string[]
}

type Karakter = 'kulturel' | 'sakin' | 'merkezi' | 'huzurlu' | 'aile' | 'dengeli'

function karakterBelirle(s: InsightSkorlar): Karakter {
  if (s.kultur >= 70 && s.imkanlar >= 70) return 'kulturel'
  if (s.sakinlik >= 80 && s.yesil_alan >= 70) return 'sakin'
  if (s.ulasim >= 80 && s.imkanlar >= 70) return 'merkezi'
  if (s.guvenlik >= 85 && s.sakinlik >= 75) return 'huzurlu'
  if (s.egitim >= 75 && s.guvenlik >= 75) return 'aile'
  return 'dengeli'
}

function ozetOlustur(isim: string, tip: 'ilce' | 'mahalle', karakter: Karakter, s: InsightSkorlar): string {
  const birimi = tip === 'ilce' ? 'ilçe' : 'mahalle'
  const birimCogul = tip === 'ilce' ? 'ilçelerinden' : 'mahallelerinden'

  const ilkCumle: Record<Karakter, string> = {
    kulturel: `${isim}, canlı kültür ve sanat hayatıyla İstanbul'un en renkli ${birimCogul} biri.`,
    sakin:    `${isim}, doğayla iç içe sakin yaşam arayanlar için ideal bir ${birimi}.`,
    merkezi:  `${isim}, güçlü ulaşım ağı ve zengin imkanlarıyla şehir hayatının tam merkezinde.`,
    huzurlu:  `${isim}, güvenli ve huzurlu yapısıyla aile yaşamına uygun bir ${birimi}.`,
    aile:     `${isim}, kaliteli eğitim kurumları ve güvenli ortamıyla aile yaşamı için öne çıkıyor.`,
    dengeli:  `${isim}, dengeli yaşam koşulları ve gelişen altyapısıyla tercih edilen bir ${birimi}.`,
  }

  let ikinci = ''
  if (s.ulasim >= 80 && s.imkanlar >= 70)
    ikinci = ' Metro ve toplu taşıma seçenekleri ile her noktaya kolayca ulaşılabiliyor.'
  else if (s.yesil_alan >= 75)
    ikinci = ' Parklar ve yeşil alanlarıyla nefes alınabilir bir yaşam sunuyor.'
  else if (s.guvenlik >= 80)
    ikinci = ' Düşük suç oranı ve güvenli sokaklar öne çıkan özellikler arasında.'
  else if (s.imkanlar >= 75)
    ikinci = ' Restoran, kafe ve alışveriş seçenekleri oldukça zengin.'
  else if (s.sakinlik >= 80)
    ikinci = ' Sakin ve huzurlu atmosferiyle şehrin gürültüsünden uzak bir yaşam sunuyor.'

  return ilkCumle[karakter] + ikinci
}

export function insightUret(
  isim: string,
  tip: 'ilce' | 'mahalle',
  skorlar: InsightSkorlar
): InsightSonuc {
  const artilar: string[] = []
  const eksiler: string[] = []

  if (skorlar.ulasim >= 75)
    artilar.push('Güçlü toplu taşıma ağı')
  else if (skorlar.ulasim <= 45)
    eksiler.push('Ulaşım imkanları kısıtlı')

  if (skorlar.guvenlik >= 80)
    artilar.push('Güvenli yaşam ortamı')
  else if (skorlar.guvenlik <= 50)
    eksiler.push('Güvenlik skoru düşük')

  if (skorlar.imkanlar >= 75)
    artilar.push('Zengin sosyal yaşam')
  else if (skorlar.imkanlar <= 40)
    eksiler.push('Sosyal imkanlar sınırlı')

  if (skorlar.egitim >= 70)
    artilar.push('Kaliteli eğitim kurumları')
  else if (skorlar.egitim <= 35)
    eksiler.push('Eğitim olanakları yetersiz')

  if (skorlar.saglik >= 70)
    artilar.push('Sağlık tesislerine kolay erişim')
  else if (skorlar.saglik <= 35)
    eksiler.push('Sağlık hizmetleri uzak')

  if (skorlar.yesil_alan >= 70)
    artilar.push('Bol yeşil alan ve parklar')
  else if (skorlar.yesil_alan <= 35)
    eksiler.push('Yeşil alan yetersiz')

  if (skorlar.kultur >= 70)
    artilar.push('Aktif kültür ve sanat hayatı')

  if (skorlar.sakinlik >= 80)
    artilar.push('Sakin ve huzurlu ortam')
  else if (skorlar.sakinlik <= 45)
    eksiler.push('Gürültülü ve yoğun')

  if (skorlar.kira_ortalama) {
    if (skorlar.kira_ortalama > 70000)
      eksiler.push('Yüksek yaşam maliyeti')
    else if (skorlar.kira_ortalama < 25000)
      artilar.push('Uygun yaşam maliyeti')
  }

  const karakter = karakterBelirle(skorlar)
  const ozet = ozetOlustur(isim, tip, karakter, skorlar)

  return { ozet, artilar: artilar.slice(0, 3), eksiler: eksiler.slice(0, 2) }
}
