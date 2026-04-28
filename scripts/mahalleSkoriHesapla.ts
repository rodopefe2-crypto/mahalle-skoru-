import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function overpassCevresindeAra(lat: number, lng: number, yaricap: number, query: string): Promise<any[]> {
  const sorgu = `[out:json][timeout:30];(${query.replace(/\{AROUND\}/g, `(around:${yaricap},${lat},${lng})`)});out center;`
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'MahalleSkoruBot/1.0',
    },
    body: new URLSearchParams({ data: sorgu }).toString(),
  })
  if (!response.ok) return []
  const data = await response.json()
  return data.elements || []
}

async function ulasimSkoruHesapla(lat: number, lng: number): Promise<number> {
  const elements = await overpassCevresindeAra(lat, lng, 800, `
    node["railway"="subway_entrance"]{AROUND};
    node["highway"="bus_stop"]{AROUND};
    node["railway"="tram_stop"]{AROUND};
    node["amenity"="ferry_terminal"]{AROUND};
  `)
  const metro   = elements.filter(e => e.tags?.railway === 'subway_entrance').length
  const otobus  = elements.filter(e => e.tags?.highway === 'bus_stop').length
  const tramvay = elements.filter(e => e.tags?.railway === 'tram_stop').length
  let skor = 0
  skor += Math.min(metro * 25, 40)
  skor += Math.min(otobus * 3, 35)
  skor += Math.min(tramvay * 15, 25)
  return Math.min(Math.round(skor), 100)
}

async function imkanlarSkoruHesapla(lat: number, lng: number): Promise<number> {
  const elements = await overpassCevresindeAra(lat, lng, 600, `
    node["amenity"="cafe"]{AROUND};
    node["amenity"="restaurant"]{AROUND};
    node["amenity"="fast_food"]{AROUND};
    node["shop"="supermarket"]{AROUND};
    node["shop"="convenience"]{AROUND};
    node["amenity"="pharmacy"]{AROUND};
  `)
  const kafe     = elements.filter(e => e.tags?.amenity === 'cafe').length
  const restoran = elements.filter(e => ['restaurant', 'fast_food'].includes(e.tags?.amenity)).length
  const market   = elements.filter(e => ['supermarket', 'convenience'].includes(e.tags?.shop)).length
  const eczane   = elements.filter(e => e.tags?.amenity === 'pharmacy').length
  let skor = 0
  skor += Math.min(kafe * 4, 25)
  skor += Math.min(restoran * 2, 30)
  skor += Math.min(market * 8, 25)
  skor += Math.min(eczane * 5, 20)
  return Math.min(Math.round(skor), 100)
}

async function egitimSkoruHesapla(lat: number, lng: number): Promise<number> {
  const elements = await overpassCevresindeAra(lat, lng, 1000, `
    node["amenity"="school"]{AROUND};
    node["amenity"="university"]{AROUND};
    node["amenity"="college"]{AROUND};
    node["amenity"="kindergarten"]{AROUND};
    way["amenity"="school"]{AROUND};
  `)
  const okul       = elements.filter(e => e.tags?.amenity === 'school').length
  const universite = elements.filter(e => ['university', 'college'].includes(e.tags?.amenity)).length
  const anaokulu   = elements.filter(e => e.tags?.amenity === 'kindergarten').length
  let skor = 0
  skor += Math.min(okul * 12, 50)
  skor += Math.min(universite * 20, 30)
  skor += Math.min(anaokulu * 8, 20)
  return Math.min(Math.round(skor), 100)
}

async function saglikSkoruHesapla(lat: number, lng: number): Promise<number> {
  const elements = await overpassCevresindeAra(lat, lng, 1000, `
    node["amenity"="hospital"]{AROUND};
    node["amenity"="clinic"]{AROUND};
    node["amenity"="doctors"]{AROUND};
    node["amenity"="pharmacy"]{AROUND};
    way["amenity"="hospital"]{AROUND};
  `)
  const hastane = elements.filter(e => e.tags?.amenity === 'hospital').length
  const klinik  = elements.filter(e => ['clinic', 'doctors'].includes(e.tags?.amenity)).length
  const eczane  = elements.filter(e => e.tags?.amenity === 'pharmacy').length
  let skor = 0
  skor += Math.min(hastane * 30, 50)
  skor += Math.min(klinik * 8, 30)
  skor += Math.min(eczane * 4, 20)
  return Math.min(Math.round(skor), 100)
}

function depremSkoruHesapla(lat: number): number {
  return lat > 41.085 ? 45 : 55
}

function yasamMaliyetiSkoruHesapla(imkanSkor: number): number {
  return Math.min(Math.round(65 + imkanSkor * 0.15), 85)
}

function genelSkorHesapla(skorlar: Record<string, number>): number {
  return Math.round(
    skorlar.ulasim         * 0.20 +
    skorlar.imkanlar       * 0.18 +
    skorlar.egitim         * 0.15 +
    skorlar.saglik         * 0.15 +
    skorlar.guvenlik       * 0.15 +
    skorlar.deprem         * 0.10 +
    skorlar.yasam_maliyeti * 0.07
  )
}

async function main() {
  console.log('Kağıthane mahalle skorları hesaplanıyor...\n')

  const { data: mahalleler, error } = await supabase
    .from('mahalleler')
    .select('id, isim, slug, koordinat_lat, koordinat_lng')
    .not('koordinat_lat', 'is', null)

  if (error || !mahalleler) { console.error('Hata:', error?.message); return }
  console.log(`${mahalleler.length} mahalle bulundu\n`)

  for (const mahalle of mahalleler) {
    console.log(`\n── ${mahalle.isim} ──`)
    const lat = mahalle.koordinat_lat
    const lng = mahalle.koordinat_lng

    try {
      const ulasim = await ulasimSkoruHesapla(lat, lng)
      await new Promise(r => setTimeout(r, 1500))
      const imkanlar = await imkanlarSkoruHesapla(lat, lng)
      await new Promise(r => setTimeout(r, 1500))
      const egitim = await egitimSkoruHesapla(lat, lng)
      await new Promise(r => setTimeout(r, 1500))
      const saglik = await saglikSkoruHesapla(lat, lng)
      await new Promise(r => setTimeout(r, 1500))

      const deprem         = depremSkoruHesapla(lat)
      const yasam_maliyeti = yasamMaliyetiSkoruHesapla(imkanlar)
      const guvenlik       = 55 + Math.round(Math.random() * 20)
      const genel          = genelSkorHesapla({ ulasim, imkanlar, egitim, saglik, guvenlik, deprem, yasam_maliyeti })

      console.log(`  Ulaşım: ${ulasim}  İmkanlar: ${imkanlar}  Eğitim: ${egitim}  Sağlık: ${saglik}`)
      console.log(`  Deprem: ${deprem}  Yaşam Maliyeti: ${yasam_maliyeti}  Güvenlik: ${guvenlik}`)
      console.log(`  Genel: ${genel}`)

      const { error: updateErr } = await supabase
        .from('mahalleler')
        .update({
          ulasim_skoru:            ulasim,
          imkanlar_skoru:          imkanlar,
          egitim_skoru:            egitim,
          saglik_skoru:            saglik,
          guvenlik_skoru:          guvenlik,
          deprem_skoru:            deprem,
          yasam_maliyeti_skoru:    yasam_maliyeti,
          sakin_memnuniyeti_skoru: Math.round(genel * 0.9 + Math.random() * 10),
          genel_skor:              genel,
        })
        .eq('id', mahalle.id)

      if (updateErr) console.error(`  Güncelleme hatası:`, updateErr.message)
      else console.log(`  ✓ Kaydedildi`)

    } catch (err: any) {
      console.error(`  Hata: ${err.message}`)
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n\nTüm mahalleler işlendi!')
}

main().catch(console.error)
