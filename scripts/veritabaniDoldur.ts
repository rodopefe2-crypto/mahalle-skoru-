import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ILCELER = [
  // ── MEVCUT 5 İLÇE (dokunma) ──
  {
    isim: 'Beşiktaş', slug: 'besiktas',
    lat: 41.0422, lng: 29.0073,
    aciklama: 'Boğaz kıyısında prestijli, kültürün merkezi',
    osm_id: 1765893,
  },
  {
    isim: 'Şişli', slug: 'sisli',
    lat: 41.0602, lng: 28.9872,
    aciklama: 'Merkezi konum, güçlü metro ağı',
    osm_id: 1765896,
  },
  {
    isim: 'Kağıthane', slug: 'kagithane',
    lat: 41.0784, lng: 28.9706,
    aciklama: 'Gelişim potansiyeli, uygun fiyatlar',
    osm_id: 1765894,
  },
  {
    isim: 'Sarıyer', slug: 'sariyer',
    lat: 41.1672, lng: 29.0572,
    aciklama: 'Sakin, doğaya yakın, yüksek memnuniyet',
    osm_id: 1765895,
  },
  {
    isim: 'Beyoğlu', slug: 'beyoglu',
    lat: 41.0335, lng: 28.9772,
    aciklama: 'Tarihi doku, kültürel çeşitlilik, eğlence',
    osm_id: 1765892,
  },

  // ── YENİ İLÇELER ──

  // Avrupa Yakası — Boğaz
  {
    isim: 'Beykoz', slug: 'beykoz',
    lat: 41.1333, lng: 29.1000,
    aciklama: 'Boğazın Anadolu yakasında sakin ve doğal yaşam',
    osm_id: 5736847,
  },
  {
    isim: 'Eyüpsultan', slug: 'eyupsultan',
    lat: 41.0452, lng: 28.9306,
    aciklama: 'Tarihi ve kültürel değerleriyle öne çıkan ilçe',
    osm_id: 1765889,
  },
  {
    isim: 'Gaziosmanpaşa', slug: 'gaziosmanpasa',
    lat: 41.0631, lng: 28.9100,
    aciklama: 'Gelişmekte olan, uygun fiyatlı konut seçenekleri',
    osm_id: 1765890,
  },
  {
    isim: 'Sultangazi', slug: 'sultangazi',
    lat: 41.1071, lng: 28.8730,
    aciklama: 'Kuzey Avrupa yakasında büyük nüfuslu ilçe',
    osm_id: 5736848,
  },
  {
    isim: 'Esenler', slug: 'esenler',
    lat: 41.0430, lng: 28.8730,
    aciklama: 'Ulaşım bağlantıları güçlü merkezi konum',
    osm_id: 5736849,
  },
  {
    isim: 'Bağcılar', slug: 'bagcilar',
    lat: 41.0380, lng: 28.8560,
    aciklama: 'Yoğun nüfuslu, gelişen ticaret merkezi',
    osm_id: 1765887,
  },
  {
    isim: 'Güngören', slug: 'gungoren',
    lat: 41.0195, lng: 28.8756,
    aciklama: 'Küçük ama hareketli, merkeze yakın ilçe',
    osm_id: 1765891,
  },
  {
    isim: 'Bahçelievler', slug: 'bahcelievler',
    lat: 41.0001, lng: 28.8618,
    aciklama: 'Aile dostu, yeşil alanlara yakın',
    osm_id: 1765886,
  },
  {
    isim: 'Bakırköy', slug: 'bakirkoy',
    lat: 40.9810, lng: 28.8734,
    aciklama: 'Denize yakın, prestijli ve gelişmiş ilçe',
    osm_id: 1765885,
  },
  {
    isim: 'Zeytinburnu', slug: 'zeytinburnu',
    lat: 40.9940, lng: 28.9080,
    aciklama: 'Tarihi surların yanında modern yaşam',
    osm_id: 1765884,
  },
  {
    isim: 'Fatih', slug: 'fatih',
    lat: 41.0186, lng: 28.9397,
    aciklama: 'Tarihi yarımadanın kalbi, turistik merkez',
    osm_id: 1765883,
  },
  {
    isim: 'Bayrampaşa', slug: 'bayrampasa',
    lat: 41.0443, lng: 28.9140,
    aciklama: 'Sanayi ve ticaretin iç içe geçtiği ilçe',
    osm_id: 1765888,
  },
  {
    isim: 'Küçükçekmece', slug: 'kucukcekmece',
    lat: 40.9963, lng: 28.7880,
    aciklama: 'Göl kenarında sakin, ulaşımı kolay',
    osm_id: 1765882,
  },
  {
    isim: 'Avcılar', slug: 'avcilar',
    lat: 40.9793, lng: 28.7219,
    aciklama: 'Sahil kenarında üniversite şehri',
    osm_id: 1765881,
  },
  {
    isim: 'Büyükçekmece', slug: 'buyukcekmece',
    lat: 41.0234, lng: 28.5805,
    aciklama: 'Göl ve deniz arasında sakin yaşam',
    osm_id: 5736850,
  },
  {
    isim: 'Arnavutköy', slug: 'arnavutkoy',
    lat: 41.1849, lng: 28.7394,
    aciklama: 'Havalimanı çevresinde büyüyen yeni ilçe',
    osm_id: 5736851,
  },
  {
    isim: 'Başakşehir', slug: 'basaksehir',
    lat: 41.0936, lng: 28.8021,
    aciklama: 'Modern planlı yerleşim, yeni nesil yaşam',
    osm_id: 5736852,
  },
  {
    isim: 'Esenyurt', slug: 'esenyurt',
    lat: 41.0370, lng: 28.6757,
    aciklama: 'Hızla gelişen, uygun fiyatlı büyük ilçe',
    osm_id: 5736853,
  },
  {
    isim: 'Beylikdüzü', slug: 'beylikduzu',
    lat: 41.0020, lng: 28.6450,
    aciklama: 'Modern rezidanslar ve sosyal yaşam',
    osm_id: 5736854,
  },
  {
    isim: 'Silivri', slug: 'silivri',
    lat: 41.0733, lng: 28.2463,
    aciklama: 'Marmara kıyısında huzurlu yaşam',
    osm_id: 5736855,
  },
  {
    isim: 'Çatalca', slug: 'catalca',
    lat: 41.1435, lng: 28.4612,
    aciklama: 'Doğayla iç içe sakin kırsal yaşam',
    osm_id: 5736856,
  },

  // Anadolu Yakası
  {
    isim: 'Kadıköy', slug: 'kadikoy',
    lat: 40.9822, lng: 29.0825,
    aciklama: 'Kültür, sanat ve sosyal yaşamın başkenti',
    osm_id: 1765900,
  },
  {
    isim: 'Üsküdar', slug: 'uskudar',
    lat: 41.0228, lng: 29.0178,
    aciklama: 'Tarihi ve sakin, Boğaza bakan huzurlu ilçe',
    osm_id: 1765899,
  },
  {
    isim: 'Ataşehir', slug: 'atasehir',
    lat: 40.9923, lng: 29.1244,
    aciklama: 'Modern iş merkezi, finans ve yaşam alanı',
    osm_id: 5736857,
  },
  {
    isim: 'Maltepe', slug: 'maltepe',
    lat: 40.9355, lng: 29.1317,
    aciklama: 'Sahil kenarında aile dostu yaşam',
    osm_id: 5736858,
  },
  {
    isim: 'Kartal', slug: 'kartal',
    lat: 40.8917, lng: 29.1896,
    aciklama: 'Sanayi ve konutun dengelendiği ilçe',
    osm_id: 5736859,
  },
  {
    isim: 'Pendik', slug: 'pendik',
    lat: 40.8762, lng: 29.2356,
    aciklama: 'Havalimanına yakın, büyüyen sağlık merkezi',
    osm_id: 5736860,
  },
  {
    isim: 'Tuzla', slug: 'tuzla',
    lat: 40.8162, lng: 29.3004,
    aciklama: 'Sanayi ve denizcilik merkezi',
    osm_id: 5736861,
  },
  {
    isim: 'Sultanbeyli', slug: 'sultanbeyli',
    lat: 40.9613, lng: 29.2647,
    aciklama: 'Hızla gelişen Anadolu yakası ilçesi',
    osm_id: 5736862,
  },
  {
    isim: 'Sancaktepe', slug: 'sancaktepe',
    lat: 41.0012, lng: 29.2312,
    aciklama: 'Yeni gelişen konut alanları',
    osm_id: 5736863,
  },
  {
    isim: 'Ümraniye', slug: 'umraniye',
    lat: 41.0166, lng: 29.1244,
    aciklama: 'İş ve yaşam dengesi güçlü merkezi konum',
    osm_id: 5736864,
  },
  {
    isim: 'Çekmeköy', slug: 'cekmekoy',
    lat: 41.0470, lng: 29.1808,
    aciklama: 'Orman içinde sakin ve huzurlu yaşam',
    osm_id: 5736865,
  },
  {
    isim: 'Şile', slug: 'sile',
    lat: 41.1751, lng: 29.6104,
    aciklama: 'Karadeniz kıyısında tatil beldesi',
    osm_id: 5736866,
  },
  {
    isim: 'Adalar', slug: 'adalar',
    lat: 40.8761, lng: 29.0917,
    aciklama: 'Araçsız yaşam, Marmara\'nın incileri',
    osm_id: 5736867,
  },
]

async function main() {
  console.log('İstanbul ilçeleri ekleniyor...\n')
  console.log(`Toplam: ${ILCELER.length} ilçe\n`)

  let eklenen = 0
  let atlanan = 0

  for (const ilce of ILCELER) {
    const { data: mevcut } = await supabase
      .from('ilceler')
      .select('id, slug')
      .eq('slug', ilce.slug)
      .single()

    if (mevcut) {
      console.log(`  ⏭  Atlandı (mevcut): ${ilce.isim}`)
      atlanan++
      continue
    }

    const { error } = await supabase
      .from('ilceler')
      .insert({
        isim:                    ilce.isim,
        slug:                    ilce.slug,
        aciklama:                ilce.aciklama,
        koordinat_lat:           ilce.lat,
        koordinat_lng:           ilce.lng,
        ulasim_skoru:            0,
        imkanlar_skoru:          0,
        egitim_skoru:            0,
        saglik_skoru:            0,
        guvenlik_skoru:          0,
        deprem_skoru:            0,
        yasam_maliyeti_skoru:    0,
        sakin_memnuniyeti_skoru: 0,
        genel_skor:              0,
      })

    if (error) {
      console.error(`  ✗ Hata (${ilce.isim}):`, error.message)
    } else {
      console.log(`  ✓ Eklendi: ${ilce.isim}`)
      eklenen++
    }

    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\nTamamlandı!`)
  console.log(`✓ Eklenen: ${eklenen}`)
  console.log(`⏭  Atlanan: ${atlanan}`)
}

main().catch(console.error)
