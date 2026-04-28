import { IlceKarsilastirma, KarsilastirmaOzeti } from './karsilastirmaTypes'
import { BOYUTLAR } from './karsilastirmaBoyutlari'

export function kazananBul(
  a: IlceKarsilastirma,
  b: IlceKarsilastirma,
  key: keyof IlceKarsilastirma['skorlar']
): { kazanan: string; fark: number } {
  const skorA = a.skorlar[key]
  const skorB = b.skorlar[key]
  return {
    kazanan: skorA >= skorB ? a.slug : b.slug,
    fark:    Math.abs(skorA - skorB),
  }
}

export function ozetUret(ilceler: IlceKarsilastirma[]): KarsilastirmaOzeti {
  if (ilceler.length < 2) {
    return { kazanan: '', kazananNeden: '', tavsiye: '', farklar: [] }
  }

  const [a, b] = ilceler

  const farklar = BOYUTLAR
    .map(boyut => {
      const key = boyut.key as keyof IlceKarsilastirma['skorlar']
      const { kazanan, fark } = kazananBul(a, b, key)
      return { boyut: boyut.label, kazanan, fark }
    })
    .filter(f => f.fark > 5)
    .sort((x, y) => y.fark - x.fark)

  const kazanan  = a.genel_skor >= b.genel_skor ? a : b
  const kaybeden = a.genel_skor >= b.genel_skor ? b : a
  const farkSkor = Math.abs(a.genel_skor - b.genel_skor)
  const enBuyukFark = farklar[0]

  const kazananNeden = enBuyukFark
    ? `${kazanan.isim}, ${enBuyukFark.boyut} alanında ${enBuyukFark.fark} puan önde.`
    : `${kazanan.isim}, genel skorla ${farkSkor} puan önde.`

  const tavsiye = farkSkor < 5
    ? `${a.isim} ve ${b.isim} birbirine çok yakın puanlara sahip. Karar için kişisel önceliklerine göre seçim yapabilirsin.`
    : `${kazanan.isim}, özellikle ${kazanan.kimIcin.slice(0, 2).join(' ve ')} için daha uygun. ${kaybeden.isim} ise ${kaybeden.kimIcin.slice(0, 2).join(' ve ')} için iyi bir alternatif.`

  return { kazanan: kazanan.slug, kazananNeden, tavsiye, farklar }
}

export function ilceyiDonustur(ilce: any): IlceKarsilastirma {
  const skorlar = {
    ulasim:            (ilce.ulasim_skoru            as number) || 0,
    guvenlik:          (ilce.guvenlik_skoru          as number) || 0,
    imkanlar:          (ilce.imkanlar_skoru          as number) || 0,
    egitim:            (ilce.egitim_skoru            as number) || 0,
    saglik:            (ilce.saglik_skoru            as number) || 0,
    deprem_direnci:    (ilce.deprem_skoru            as number) || 0,
    yasam_maliyeti:    (ilce.yasam_maliyeti_skoru    as number) || 0,
    sakin_memnuniyeti: (ilce.sakin_memnuniyeti_skoru as number) || 0,
    yesil_alan:        (ilce.yesil_alan_skoru        as number) || 0,
    kultur:            (ilce.kultur_skoru            as number) || 0,
  }

  const ETIKETLER: Record<string, string> = {
    ulasim:            'Ulaşım',
    guvenlik:          'Güvenlik',
    imkanlar:          'Sosyal İmkanlar',
    egitim:            'Eğitim',
    saglik:            'Sağlık',
    deprem_direnci:    'Deprem Güvenliği',
    yasam_maliyeti:    'Uygun Maliyet',
    sakin_memnuniyeti: 'Sakin Memnuniyeti',
    yesil_alan:        'Yeşil Alan',
    kultur:            'Kültür & Sanat',
  }

  const sirali = Object.entries(skorlar).sort(([, a], [, b]) => b - a)

  const gucluYonler = sirali.filter(([, s]) => s >= 70).slice(0, 3).map(([k]) => ETIKETLER[k])
  const zayifYonler = sirali.filter(([, s]) => s < 55).slice(-2).map(([k]) => ETIKETLER[k])

  const kimIcin: string[] = []
  if (skorlar.ulasim >= 75)            kimIcin.push('Öğrenciler')
  if (skorlar.guvenlik >= 75)          kimIcin.push('Aileler')
  if (skorlar.imkanlar >= 75)          kimIcin.push('Genç Profesyoneller')
  if (skorlar.sakin_memnuniyeti >= 70) kimIcin.push('Emekliler')
  if (kimIcin.length === 0)            kimIcin.push('Genel Kullanıcılar')

  const kirmiziBayraklar: string[] = []
  if (skorlar.guvenlik < 50)       kirmiziBayraklar.push('Güvenlik riski')
  if (skorlar.deprem_direnci < 50) kirmiziBayraklar.push('Deprem riski')
  if (skorlar.yasam_maliyeti < 40) kirmiziBayraklar.push('Yüksek yaşam maliyeti')
  if (skorlar.ulasim < 50)         kirmiziBayraklar.push('Ulaşım zorluğu')

  const ozet = (ilce.aciklama as string) ||
    `${ilce.isim}, ${gucluYonler.slice(0, 2).join(' ve ')} açısından öne çıkıyor.`

  return {
    slug:            ilce.slug,
    isim:            ilce.isim,
    aciklama:        ozet,
    genel_skor:      (ilce.genel_skor as number) || 0,
    skorlar,
    gucluYonler,
    zayifYonler,
    kimIcin,
    kirmiziBayraklar,
    ozet,
  }
}
