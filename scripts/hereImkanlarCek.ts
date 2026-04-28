import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { hereImkanlarCek } from '../lib/hereService'
import { ILCE_KOORDINATLARI } from '../lib/ilceKoordinatlari'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('HERE API ile imkanlar verisi çekiliyor...\n')

  for (const [slug, koordinat] of Object.entries(ILCE_KOORDINATLARI)) {
    console.log(`\n${slug} işleniyor...`)

    // 1. Supabase'den ilce_id'yi bul
    const { data: ilce, error: ilceHata } = await supabase
      .from('ilceler')
      .select('id, isim')
      .eq('slug', slug)
      .single()

    if (ilceHata || !ilce) {
      console.error(`  ${slug} bulunamadı:`, ilceHata?.message)
      continue
    }

    // 2. Önce bu ilçenin eski imkanlar verisini sil
    const { error: silHata } = await supabase
      .from('ilce_tesisler')
      .delete()
      .eq('ilce_id', ilce.id)
      .eq('kategori', 'imkanlar')

    if (silHata) {
      console.error(`  Silme hatası:`, silHata.message)
      continue
    }

    // 3. HERE'den yeni veriyi çek
    const tesisler = await hereImkanlarCek(
      koordinat.lat,
      koordinat.lng,
      2500  // 2.5km yarıçap
    )

    console.log(`  HERE'den ${tesisler.length} tesis geldi`)

    if (tesisler.length === 0) {
      console.warn(`  Uyarı: Hiç tesis bulunamadı`)
      continue
    }

    // 4. Supabase'e toplu ekle (batch insert)
    const eklenecekler = tesisler.map(t => ({
      ilce_id:      ilce.id,
      kategori:     'imkanlar',
      alt_kategori: t.alt_kategori,
      isim:         t.isim,
      lat:          t.lat,
      lng:          t.lng,
      osm_id:       null,
    }))

    // 100'erli gruplar halinde ekle (Supabase limiti)
    const GRUP_BOYUTU = 100
    let eklenenToplam = 0

    for (let i = 0; i < eklenecekler.length; i += GRUP_BOYUTU) {
      const grup = eklenecekler.slice(i, i + GRUP_BOYUTU)

      const { error: ekleHata } = await supabase
        .from('ilce_tesisler')
        .insert(grup)

      if (ekleHata) {
        console.error(`  Ekleme hatası:`, ekleHata.message)
      } else {
        eklenenToplam += grup.length
      }
    }

    console.log(`  ✓ ${eklenenToplam} tesis eklendi`)

    // Sonraki ilçeye geçmeden önce 2sn bekle
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\nTamamlandı!')
}

main().catch(console.error)