export interface Sehir {
  id: string
  isim: string
  ilceler: IlceOzet[]
}

export interface IlceOzet {
  slug: string
  isim: string
}

export interface FiltreDegerleri {
  sehirId:      string
  ilceSlug:     string
  mahalleSlug:  string
  ulasim:       number
  guvenlik:     number
  imkanlar:     number
  yesilanAlan:  number
  aileDostu:    number
  ogrenciDostu: number
  sessizlik:    number
  butce:        number
}

export const SEHIRLER: Sehir[] = [
  {
    id: 'istanbul',
    isim: 'İstanbul',
    ilceler: [
      { slug: 'adalar',        isim: 'Adalar'        },
      { slug: 'arnavutkoy',    isim: 'Arnavutköy'    },
      { slug: 'atasehir',      isim: 'Ataşehir'      },
      { slug: 'avcilar',       isim: 'Avcılar'       },
      { slug: 'bagcilar',      isim: 'Bağcılar'      },
      { slug: 'bahcelievler',  isim: 'Bahçelievler'  },
      { slug: 'bakirkoy',      isim: 'Bakırköy'      },
      { slug: 'basaksehir',    isim: 'Başakşehir'    },
      { slug: 'bayrampasa',    isim: 'Bayrampaşa'    },
      { slug: 'besiktas',      isim: 'Beşiktaş'      },
      { slug: 'beykoz',        isim: 'Beykoz'        },
      { slug: 'beylikduzu',    isim: 'Beylikdüzü'    },
      { slug: 'beyoglu',       isim: 'Beyoğlu'       },
      { slug: 'buyukcekmece',  isim: 'Büyükçekmece'  },
      { slug: 'catalca',       isim: 'Çatalca'       },
      { slug: 'cekmekoy',      isim: 'Çekmeköy'      },
      { slug: 'esenler',       isim: 'Esenler'       },
      { slug: 'esenyurt',      isim: 'Esenyurt'      },
      { slug: 'eyupsultan',    isim: 'Eyüpsultan'    },
      { slug: 'fatih',         isim: 'Fatih'         },
      { slug: 'gaziosmanpasa', isim: 'Gaziosmanpaşa' },
      { slug: 'gungoren',      isim: 'Güngören'      },
      { slug: 'kadikoy',       isim: 'Kadıköy'       },
      { slug: 'kagithane',     isim: 'Kağıthane'     },
      { slug: 'kartal',        isim: 'Kartal'        },
      { slug: 'kucukcekmece',  isim: 'Küçükçekmece'  },
      { slug: 'maltepe',       isim: 'Maltepe'       },
      { slug: 'pendik',        isim: 'Pendik'        },
      { slug: 'sancaktepe',    isim: 'Sancaktepe'    },
      { slug: 'sariyer',       isim: 'Sarıyer'       },
      { slug: 'sile',          isim: 'Şile'          },
      { slug: 'sisli',         isim: 'Şişli'         },
      { slug: 'sultanbeyli',   isim: 'Sultanbeyli'   },
      { slug: 'sultangazi',    isim: 'Sultangazi'    },
      { slug: 'tuzla',         isim: 'Tuzla'         },
      { slug: 'umraniye',      isim: 'Ümraniye'      },
      { slug: 'uskudar',       isim: 'Üsküdar'       },
      { slug: 'zeytinburnu',   isim: 'Zeytinburnu'   },
    ],
  },
  {
    id: 'ankara',
    isim: 'Ankara',
    ilceler: [
      { slug: 'cankaya',     isim: 'Çankaya'     },
      { slug: 'kecioren',    isim: 'Keçiören'    },
      { slug: 'yenimahalle', isim: 'Yenimahalle' },
    ],
  },
  {
    id: 'izmir',
    isim: 'İzmir',
    ilceler: [
      { slug: 'karsiyaka', isim: 'Karşıyaka' },
      { slug: 'bornova',   isim: 'Bornova'   },
      { slug: 'konak',     isim: 'Konak'     },
    ],
  },
]

export const FILTRE_TANIMI = [
  { key: 'ulasim',       label: 'Ulaşım',          ikon: '🚇', renk: '#3b82f6', aciklama: 'Metro, otobüs erişimi'        },
  { key: 'guvenlik',     label: 'Güvenlik',         ikon: '🛡️', renk: '#f59e0b', aciklama: 'Genel güvenlik algısı'        },
  { key: 'imkanlar',     label: 'Sosyal İmkanlar',  ikon: '🏪', renk: '#10b981', aciklama: 'Kafe, restoran, eğlence'      },
  { key: 'yesilanAlan',  label: 'Yeşil Alan',       ikon: '🌳', renk: '#22c55e', aciklama: 'Park ve açık alanlar'         },
  { key: 'aileDostu',    label: 'Aile Dostu',       ikon: '👨‍👩‍👧', renk: '#8b5cf6', aciklama: 'Aile yaşamına uygunluk'      },
  { key: 'ogrenciDostu', label: 'Öğrenci Dostu',    ikon: '📚', renk: '#ec4899', aciklama: 'Üniversite ve öğrenci hayatı' },
  { key: 'sessizlik',    label: 'Sessizlik',         ikon: '🌙', renk: '#06b6d4', aciklama: 'Sakin ve huzurlu ortam'       },
  { key: 'butce',        label: 'Bütçe Dostu',      ikon: '💰', renk: '#f97316', aciklama: 'Uygun yaşam maliyeti'         },
] as const

export const BASLANGIC_FILTRE: FiltreDegerleri = {
  sehirId:      'istanbul',
  ilceSlug:     '',
  mahalleSlug:  '',
  ulasim:       0,
  guvenlik:     0,
  imkanlar:     0,
  yesilanAlan:  0,
  aileDostu:    0,
  ogrenciDostu: 0,
  sessizlik:    0,
  butce:        0,
}
