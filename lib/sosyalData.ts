export interface SosyalMetrik {
  label: string
  value: number
  ikon?: string
}

export interface SosyalKategori {
  id: string
  title: string
  ikon: string
  score: number
  renk: string
  description: string
  metrics: SosyalMetrik[]
  insight: string
}

export interface SosyalVeri {
  overallScore: number
  summary: string
  categories: SosyalKategori[]
  lifestyle: string[]
  yastilaEtiketi: string
}

export const SOSYAL_VERI: Record<string, SosyalVeri> = {
  besiktas: {
    overallScore: 8.4,
    summary: "Beşiktaş, sosyal yaşam ve yeme içme çeşitliliği açısından güçlü; açık alan tarafında orta seviyede, genç ve hareketli yaşam tarzına daha uygun bir profil çiziyor.",
    yastilaEtiketi: "Genç & Hareketli",
    lifestyle: ["Genç & Sosyal", "Aile Dostu", "Hareketli", "Akşamları Canlı"],
    categories: [
      {
        id: "food", title: "Yeme & İçme", ikon: "UtensilsCrossed",
        score: 9.2, renk: "#f97316",
        description: "Kafe, restoran ve akşam buluşmaları açısından güçlü.",
        metrics: [
          { label: "Kafe", value: 42 },
          { label: "Restoran", value: 58 },
          { label: "Bar / Pub", value: 17 },
          { label: "500m çevrede mekan", value: 36 },
        ],
        insight: "Sosyal buluşmalar ve akşam yaşamı için oldukça güçlü.",
      },
      {
        id: "culture", title: "Kültür & Aktivite", ikon: "Theater",
        score: 7.6, renk: "#8b5cf6",
        description: "Sinema, galeri ve etkinlik mekanlarına erişim iyi.",
        metrics: [
          { label: "Sinema", value: 3 },
          { label: "Tiyatro / Sahne", value: 5 },
          { label: "Müze / Galeri", value: 8 },
          { label: "Konser Mekanı", value: 4 },
        ],
        insight: "Kültürel erişim güçlü, hafta sonu aktiviteleri zengin.",
      },
      {
        id: "outdoor", title: "Açık Alan & Sosyal Mekan", ikon: "Trees",
        score: 6.8, renk: "#10b981",
        description: "Park ve yürüyüş alanları mevcut, gelişime açık.",
        metrics: [
          { label: "Park", value: 12 },
          { label: "Sahil / Yürüyüş", value: 3 },
          { label: "Meydan / Kamusal Alan", value: 6 },
          { label: "Spor Alanı", value: 8 },
        ],
        insight: "Açık havada vakit geçirmek için yeterli, sahil avantajı var.",
      },
      {
        id: "lifestyle", title: "Yaşam Tarzı Profili", ikon: "Users",
        score: 8.1, renk: "#3b82f6",
        description: "Genç ve dinamik bir profil, gece hayatı canlı.",
        metrics: [
          { label: "Genç / Öğrenci Dostu", value: 85 },
          { label: "Aile Dostu", value: 62 },
          { label: "Gece Hayatı Seviyesi", value: 78 },
          { label: "Sakinlik Skoru", value: 45 },
        ],
        insight: "Genç ve sosyal yaşam tarzına daha uygun bir profil.",
      },
    ],
  },
  sisli: {
    overallScore: 7.8,
    summary: "Şişli, ticari canlılığı ve ulaşım kolaylığıyla öne çıkıyor; kültürel imkanlar orta, yeşil alan sınırlı.",
    yastilaEtiketi: "Kentsel & Aktif",
    lifestyle: ["Kentsel", "Aktif", "Ticari", "Gündüz Hareketli"],
    categories: [
      {
        id: "food", title: "Yeme & İçme", ikon: "UtensilsCrossed",
        score: 8.1, renk: "#f97316",
        description: "AVM ve cadde restoranları güçlü.",
        metrics: [
          { label: "Kafe", value: 38 },
          { label: "Restoran", value: 72 },
          { label: "Bar / Pub", value: 9 },
          { label: "500m çevrede mekan", value: 44 },
        ],
        insight: "Gündüz sosyal yaşam güçlü, akşam daha sakin.",
      },
      {
        id: "culture", title: "Kültür & Aktivite", ikon: "Theater",
        score: 6.4, renk: "#8b5cf6",
        description: "Sinema ve alışveriş merkezi ağırlıklı.",
        metrics: [
          { label: "Sinema", value: 5 },
          { label: "Tiyatro / Sahne", value: 2 },
          { label: "Müze / Galeri", value: 4 },
          { label: "Konser Mekanı", value: 2 },
        ],
        insight: "Kültürel çeşitlilik orta seviyede.",
      },
      {
        id: "outdoor", title: "Açık Alan & Sosyal Mekan", ikon: "Trees",
        score: 5.2, renk: "#10b981",
        description: "Yeşil alan sınırlı, kentsel doku yoğun.",
        metrics: [
          { label: "Park", value: 7 },
          { label: "Sahil / Yürüyüş", value: 0 },
          { label: "Meydan / Kamusal Alan", value: 4 },
          { label: "Spor Alanı", value: 5 },
        ],
        insight: "Açık alan kısıtlı, kentsel ortam baskın.",
      },
      {
        id: "lifestyle", title: "Yaşam Tarzı Profili", ikon: "Users",
        score: 7.2, renk: "#3b82f6",
        description: "Çalışan ve kentsel profil ağırlıklı.",
        metrics: [
          { label: "Genç / Öğrenci Dostu", value: 68 },
          { label: "Aile Dostu", value: 71 },
          { label: "Gece Hayatı Seviyesi", value: 52 },
          { label: "Sakinlik Skoru", value: 58 },
        ],
        insight: "Dengeli kentsel profil, çalışan kesime uygun.",
      },
    ],
  },
}

export const SOSYAL_VERI_FALLBACK: SosyalVeri = {
  overallScore: 6.5,
  summary: "Bu ilçe sosyal imkanlar açısından orta seviyede bir profile sahip.",
  yastilaEtiketi: "Dengeli",
  lifestyle: ["Dengeli", "Aile Odaklı", "Sakin"],
  categories: [
    {
      id: "food", title: "Yeme & İçme", ikon: "UtensilsCrossed",
      score: 6.8, renk: "#f97316",
      description: "Temel ihtiyaçları karşılayan mekan çeşitliliği.",
      metrics: [
        { label: "Kafe", value: 18 },
        { label: "Restoran", value: 32 },
        { label: "Bar / Pub", value: 5 },
        { label: "500m çevrede mekan", value: 20 },
      ],
      insight: "Günlük ihtiyaçlar için yeterli.",
    },
    {
      id: "culture", title: "Kültür & Aktivite", ikon: "Theater",
      score: 5.5, renk: "#8b5cf6",
      description: "Sınırlı kültürel seçenekler.",
      metrics: [
        { label: "Sinema", value: 1 },
        { label: "Tiyatro / Sahne", value: 1 },
        { label: "Müze / Galeri", value: 2 },
        { label: "Konser Mekanı", value: 1 },
      ],
      insight: "Kültürel erişim gelişime açık.",
    },
    {
      id: "outdoor", title: "Açık Alan & Sosyal Mekan", ikon: "Trees",
      score: 7.2, renk: "#10b981",
      description: "Park ve açık alanlar yeterli düzeyde.",
      metrics: [
        { label: "Park", value: 15 },
        { label: "Sahil / Yürüyüş", value: 1 },
        { label: "Meydan / Kamusal Alan", value: 5 },
        { label: "Spor Alanı", value: 7 },
      ],
      insight: "Açık hava aktiviteleri için uygun.",
    },
    {
      id: "lifestyle", title: "Yaşam Tarzı Profili", ikon: "Users",
      score: 6.5, renk: "#3b82f6",
      description: "Aile odaklı sakin yaşam.",
      metrics: [
        { label: "Genç / Öğrenci Dostu", value: 52 },
        { label: "Aile Dostu", value: 78 },
        { label: "Gece Hayatı Seviyesi", value: 35 },
        { label: "Sakinlik Skoru", value: 72 },
      ],
      insight: "Aile ve sakin yaşam tarzına uygun.",
    },
  ],
}
