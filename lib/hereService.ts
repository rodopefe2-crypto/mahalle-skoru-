import { createClient } from '@supabase/supabase-js'

const HERE_API_KEY = process.env.HERE_API_KEY!
const HERE_BASE = 'https://discover.search.hereapi.com/v1'

// HERE kategorileri → bizim alt_kategori değerleri
const KATEGORI_MAP = {
  supermarket: '600-6300-0066',   // süpermarket
  cafe:        '200-2000-0011',   // kafe
  restaurant:  '100-1000-0000',   // restoran
  park:        '550-5510-0202',   // park
  pharmacy:    '800-8000-0173',   // eczane
  bakery:      '600-6300-0067',   // fırın/pastane
  market:      '600-6300-0065',   // market
}

interface HereTesis {
  isim: string | null
  alt_kategori: string
  lat: number
  lng: number
  osm_id: null
  here_id: string
}

// Belirli bir koordinat ve yarıçap için HERE'den mekan çek
export async function hereImkanlarCek(
  lat: number,
  lng: number,
  yaricap: number = 2000  // metre cinsinden, varsayılan 2km
): Promise<HereTesis[]> {

  const tesisler: HereTesis[] = []

  // Her kategori için ayrı sorgu at
  for (const [altKategori, hereKategori] of Object.entries(KATEGORI_MAP)) {
    try {
      // HERE Discover API -
      // at çevre noktasındaki yerleri döner
      const url = new URL(`${HERE_BASE}/discover`)
      url.searchParams.set('at', `${lat},${lng}`)
      url.searchParams.set('categories', hereKategori)
      url.searchParams.set('limit', '50')  // kategori başına max 50
      url.searchParams.set('in', `circle:${lat},${lng};r=${yaricap}`)
      url.searchParams.set('lang', 'tr')
      url.searchParams.set('apiKey', HERE_API_KEY)

      const response = await fetch(url.toString())

      if (!response.ok) {
        console.error(`HERE API hatası [${altKategori}]:`, response.status)
        continue
      }

      const data = await response.json()

      for (const item of data.items || []) {
        tesisler.push({
          isim:        item.title || null,
          alt_kategori: altKategori,
          lat:         item.position.lat,
          lng:         item.position.lng,
          osm_id:      null,
          here_id:     item.id,
        })
      }

      // HERE rate limit aşmamak için kısa bekleme
      await new Promise(r => setTimeout(r, 300))

    } catch (err) {
      console.error(`HERE sorgu hatası [${altKategori}]:`, err)
    }
  }

  return tesisler
}