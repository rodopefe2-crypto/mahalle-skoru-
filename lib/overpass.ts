const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export interface OverpassResult {
  ulasim: number
  imkanlar: number
  egitim: number
  saglik: number
}

async function getRelationId(ilceAdi: string): Promise<string | null> {
  const response = await fetch(`${NOMINATIM_URL}?q=${ilceAdi}+Istanbul&format=json`)
  const data = await response.json()
  if (data.length > 0) {
    // OSM ID'yi relation olarak kullan
    return data[0].osm_id
  }
  return null
}

export async function queryOverpass(query: string): Promise<any> {
  console.log('Overpass sorgusu gönderiliyor:', query.substring(0, 100) + '...')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 saniye timeout

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'MahalleSkoruApp/1.0 (https://github.com/mahalle)',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Ham yanıtı önce text olarak al
    const rawText = await response.text()

    // İlk 200 karakteri logla — HTML mi JSON mi görmek için
    console.log('Overpass yanıtı (ilk 200 karakter):', rawText.substring(0, 200))

    // JSON parse etmeyi dene
    let data
    try {
      data = JSON.parse(rawText)
    } catch (e) {
      console.error('JSON parse hatası. Overpass HTML döndürdü:')
      console.error(rawText.substring(0, 500))
      throw new Error('Overpass sunucusu geçersiz yanıt döndürdü')
    }

    return data
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Overpass sorgusu zaman aşımına uğradı')
    }
    throw error
  }
}

export async function getIlceSkorlar(relationId: string): Promise<OverpassResult> {

  const queries = {
    ulasim: `
      [out:json];
      rel(${relationId}); map_to_area->.ilce;
      (
        node["railway"="station"](area.ilce);
        node["highway"="bus_stop"](area.ilce);
        node["railway"="subway_entrance"](area.ilce);
      );
      out count;
    `,
    imkanlar: `
      [out:json];
      rel(${relationId}); map_to_area->.ilce;
      (
        node["shop"="supermarket"](area.ilce);
        node["amenity"="cafe"](area.ilce);
        node["leisure"="park"](area.ilce);
        node["amenity"="pharmacy"](area.ilce);
        node["shop"="bakery"](area.ilce);
      );
      out count;
    `,
    egitim: `
      [out:json];
      rel(${relationId}); map_to_area->.ilce;
      (
        node["amenity"="school"](area.ilce);
        node["amenity"="university"](area.ilce);
        node["amenity"="kindergarten"](area.ilce);
        node["amenity"="college"](area.ilce);
      );
      out count;
    `,
    saglik: `
      [out:json];
      rel(${relationId}); map_to_area->.ilce;
      (
        node["amenity"="hospital"](area.ilce);
        node["amenity"="clinic"](area.ilce);
        node["amenity"="doctors"](area.ilce);
        node["amenity"="pharmacy"](area.ilce);
      );
      out count;
    `,
  }

  const results: Partial<OverpassResult> = {}

  for (const [key, query] of Object.entries(queries)) {
    const data = await queryOverpass(query)
    results[key as keyof OverpassResult] = data.elements?.[0]?.tags?.count || 0
  }

  return results as OverpassResult
}

// Normalizasyon için tüm ilçeleri karşılaştır
export function normalizeSkorlar(ilceler: { isim: string; skorlar: OverpassResult }[]): Record<string, OverpassResult> {
  const normalized: Record<string, OverpassResult> = {}

  const maxValues = {
    ulasim: Math.max(...ilceler.map(i => i.skorlar.ulasim)),
    imkanlar: Math.max(...ilceler.map(i => i.skorlar.imkanlar)),
    egitim: Math.max(...ilceler.map(i => i.skorlar.egitim)),
    saglik: Math.max(...ilceler.map(i => i.skorlar.saglik)),
  }

  ilceler.forEach(ilce => {
    normalized[ilce.isim] = {
      ulasim: maxValues.ulasim > 0 ? (ilce.skorlar.ulasim / maxValues.ulasim) * 100 : 0,
      imkanlar: maxValues.imkanlar > 0 ? (ilce.skorlar.imkanlar / maxValues.imkanlar) * 100 : 0,
      egitim: maxValues.egitim > 0 ? (ilce.skorlar.egitim / maxValues.egitim) * 100 : 0,
      saglik: maxValues.saglik > 0 ? (ilce.skorlar.saglik / maxValues.saglik) * 100 : 0,
    }
  })

  return normalized
}