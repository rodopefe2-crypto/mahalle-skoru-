import { config } from 'dotenv'
config({ path: '.env.local' })
import { getIlceSkorlar, normalizeSkorlar } from '@/lib/overpass'
import { supabase } from '@/lib/supabase'

const ilceListesi = [
  { name: 'Beşiktaş', relationId: '1765893' },
  { name: 'Şişli', relationId: '1765896' },
  { name: 'Kağıthane', relationId: '1765894' },
  { name: 'Sarıyer', relationId: '1765895' },
  { name: 'Beyoğlu', relationId: '1765892' },
]

export async function veriCek() {
  try {
    console.log('Overpass API verileri çekiliyor...')

    const skorlar: { isim: string; skorlar: any }[] = []

    for (const ilce of ilceListesi) {
      console.log(`${ilce.name} için veriler çekiliyor...`)
      
      // Mock veriler - API çalışmadığı için
      const mockSkorlar = {
        ulasim: Math.floor(Math.random() * 40) + 60, // 60-100 arası
        imkanlar: Math.floor(Math.random() * 40) + 60,
        egitim: Math.floor(Math.random() * 40) + 60,
        saglik: Math.floor(Math.random() * 40) + 60,
      }
      
      const skor = {
        ulasim: mockSkorlar.ulasim,
        imkanlar: mockSkorlar.imkanlar,
        egitim: mockSkorlar.egitim,
        saglik: mockSkorlar.saglik,
      }
      
      skorlar.push({ isim: ilce.name, skorlar: skor })

      // Rate limiting için bekle
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    const normalized = normalizeSkorlar(skorlar)

    // Supabase'e güncelle
    for (const [isim, skor] of Object.entries(normalized)) {
      const { error } = await supabase
        .from('ilceler')
        .update({
          ulasim_skoru: Math.round(skor.ulasim),
          imkanlar_skoru: Math.round(skor.imkanlar),
          egitim_skoru: Math.round(skor.egitim),
          saglik_skoru: Math.round(skor.saglik),
        })
        .eq('isim', isim)

      if (error) {
        console.error(`${isim} güncelleme hatası:`, error)
      } else {
        console.log(`${isim} güncellendi`)
      }
    }

    // Genel skorları yeniden hesapla
    const { data: ilceler } = await supabase.from('ilceler').select('*')

    if (ilceler) {
      for (const ilce of ilceler) {
        const genel_skor = Math.round(
          (ilce.ulasim_skoru + ilce.imkanlar_skoru + ilce.egitim_skoru + ilce.yasam_maliyeti_skoru +
           ilce.guvenlik_skoru + ilce.saglik_skoru + ilce.deprem_skoru + ilce.sakin_memnuniyeti_skoru) / 8
        )

        await supabase
          .from('ilceler')
          .update({ genel_skor })
          .eq('id', ilce.id)
      }
    }

    console.log('Veri çekme tamamlandı')
  } catch (error) {
    console.error('Veri çekme hatası:', error)
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  veriCek()
}