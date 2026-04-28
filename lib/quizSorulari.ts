import { QuizSorusu } from './quizTypes'

export const QUIZ_SORULARI: QuizSorusu[] = [
  {
    id: 'yasam_tarzi',
    soru: 'Yaşam tarzın nasıl?',
    altBaslik: 'Günlük hayatını en iyi hangisi tanımlıyor?',
    tip: 'single',
    parametre: 'genel',
    secenekler: [
      {
        id: 'sosyal',
        etiket: 'Sosyal & Hareketli',
        ikon: '🎉',
        agirlik: { imkanlar: 15, ulasim: 10, guvenlik: 5 },
      },
      {
        id: 'sakin',
        etiket: 'Sakin & Huzurlu',
        ikon: '🌿',
        agirlik: { guvenlik: 15, sakin_memnuniyeti: 10, yasam_maliyeti: 5 },
      },
      {
        id: 'aile',
        etiket: 'Aile Odaklı',
        ikon: '👨‍👩‍👧',
        agirlik: { guvenlik: 20, egitim: 15, saglik: 10 },
      },
      {
        id: 'ogrenci',
        etiket: 'Öğrenci & Genç',
        ikon: '📚',
        agirlik: { ulasim: 20, imkanlar: 15, yasam_maliyeti: 10 },
      },
    ],
  },
  {
    id: 'ulasim_onemi',
    soru: 'Ulaşım senin için ne kadar önemli?',
    altBaslik: 'İşe, okula veya şehir merkezine ulaşım önceliğin?',
    tip: 'single',
    parametre: 'ulasim',
    secenekler: [
      {
        id: 'cok_onemli',
        etiket: 'Çok önemli, metro/otobüs şart',
        ikon: '🚇',
        agirlik: { ulasim: 30 },
      },
      {
        id: 'onemli',
        etiket: 'Önemli ama araç da kullanırım',
        ikon: '🚗',
        agirlik: { ulasim: 15 },
      },
      {
        id: 'az_onemli',
        etiket: 'Fazla önemli değil, uzak olabilir',
        ikon: '🏡',
        agirlik: { ulasim: 0, guvenlik: 10 },
      },
    ],
  },
  {
    id: 'guvenlik',
    soru: 'Güvenlik önceliğin nerede?',
    altBaslik: 'Yaşayacağın yerde güvenlik ne kadar kritik?',
    tip: 'single',
    parametre: 'guvenlik',
    secenekler: [
      {
        id: 'cok_kritik',
        etiket: 'En önemli kriter bu',
        ikon: '🛡️',
        agirlik: { guvenlik: 30 },
      },
      {
        id: 'onemli',
        etiket: 'Önemli ama tek kriter değil',
        ikon: '✅',
        agirlik: { guvenlik: 15 },
      },
      {
        id: 'orta',
        etiket: 'Ortalama yeterli',
        ikon: '😊',
        agirlik: { guvenlik: 5, imkanlar: 10 },
      },
    ],
  },
  {
    id: 'sosyal_hayat',
    soru: 'Sosyal hayat beklentin?',
    altBaslik: 'Kafe, restoran, eğlence mekanlarına ne kadar yakın olmak istersin?',
    tip: 'single',
    parametre: 'imkanlar',
    secenekler: [
      {
        id: 'cok_fazla',
        etiket: 'Her şey yürüme mesafesinde olsun',
        ikon: '🏙️',
        agirlik: { imkanlar: 25, ulasim: 10 },
      },
      {
        id: 'orta',
        etiket: 'Temel ihtiyaçlar yeterli',
        ikon: '🛒',
        agirlik: { imkanlar: 10, guvenlik: 10 },
      },
      {
        id: 'az',
        etiket: 'Çok önemli değil, sakinlik öncelikli',
        ikon: '🌳',
        agirlik: { imkanlar: 0, guvenlik: 15, sakin_memnuniyeti: 15 },
      },
    ],
  },
  {
    id: 'deprem',
    soru: 'Deprem güvenliği ne kadar önemli?',
    altBaslik: "İstanbul'da deprem riski taşıyan bölgelerden kaçınmak ister misin?",
    tip: 'single',
    parametre: 'deprem_direnci',
    secenekler: [
      {
        id: 'cok_onemli',
        etiket: 'Evet, çok önemli — risk almak istemiyorum',
        ikon: '⚠️',
        agirlik: { deprem_direnci: 30 },
      },
      {
        id: 'onemli',
        etiket: 'Önemli ama tek kriter değil',
        ikon: '🏠',
        agirlik: { deprem_direnci: 15 },
      },
      {
        id: 'az_onemli',
        etiket: 'Diğer kriterler daha öncelikli',
        ikon: '🤷',
        agirlik: { deprem_direnci: 5 },
      },
    ],
  },
  {
    id: 'butce',
    soru: 'Yaşam maliyeti önceliğin?',
    altBaslik: 'Uygun fiyatlı bir bölge mi, yoksa fiyat ikincil mi?',
    tip: 'single',
    parametre: 'yasam_maliyeti',
    secenekler: [
      {
        id: 'ucuz_olsun',
        etiket: 'Uygun fiyatlı olması çok önemli',
        ikon: '💰',
        agirlik: { yasam_maliyeti: 25 },
      },
      {
        id: 'orta',
        etiket: 'Makul fiyat, kalite dengesi',
        ikon: '⚖️',
        agirlik: { yasam_maliyeti: 10, imkanlar: 10 },
      },
      {
        id: 'fark_etmez',
        etiket: 'Fiyat ikincil, lokasyon önemli',
        ikon: '📍',
        agirlik: { yasam_maliyeti: 0, ulasim: 15 },
      },
    ],
  },
]
