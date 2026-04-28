import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Kuzey Anadolu Fay Hattı + İstanbul kolları + Doğu Anadolu
const ANA_FAY_NOKTALARI: [number, number][] = [
  [27.0,40.8],[28.0,40.9],[29.0,40.8],[29.5,40.7],[30.0,40.6],
  [30.5,40.6],[31.0,40.5],[31.5,40.4],[32.0,40.3],[32.5,40.2],
  [33.0,40.0],[33.5,39.9],[34.0,39.8],[35.0,39.6],[36.0,39.4],
  [37.0,39.2],[38.0,39.0],[39.0,39.0],[40.0,39.1],[41.0,39.4],
  [28.5,40.7],[28.8,40.8],[29.1,40.9],[29.3,41.0],[28.2,40.9],[28.9,41.1],
  [36.0,37.0],[37.0,37.5],[38.0,38.0],[39.0,38.5],[40.0,39.0],
]

function derece2Radyan(d: number) { return d * (Math.PI / 180) }

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = derece2Radyan(lat2 - lat1)
  const dLng = derece2Radyan(lng2 - lng1)
  const a = Math.sin(dLat/2)**2 +
    Math.cos(derece2Radyan(lat1)) * Math.cos(derece2Radyan(lat2)) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function enYakinFayMesafesi(lat: number, lng: number): number {
  let enYakin = Infinity
  const geojsonYolu = path.join(path.dirname(new URL(import.meta.url).pathname), 'turkiye-fay-hatlari.geojson')

  if (fs.existsSync(geojsonYolu)) {
    try {
      const geojson = JSON.parse(fs.readFileSync(geojsonYolu, 'utf-8'))
      for (const f of geojson.features || []) {
        const tip = f.geometry?.type
        const coords = f.geometry?.coordinates || []
        const hatlar = tip === 'LineString' ? [coords] : tip === 'MultiLineString' ? coords : []
        for (const hat of hatlar)
          for (const [fLng, fLat] of hat) {
            const m = haversine(lat, lng, fLat, fLng)
            if (m < enYakin) enYakin = m
          }
      }
      if (enYakin < Infinity) return enYakin
    } catch { /* fallback'e düş */ }
  }

  for (const [fLng, fLat] of ANA_FAY_NOKTALARI) {
    const m = haversine(lat, lng, fLat, fLng)
    if (m < enYakin) enYakin = m
  }
  return enYakin
}

function fayMesafesineGoreSkor(km: number): number {
  if (km < 5)   return 10
  if (km < 10)  return 20
  if (km < 20)  return 35
  if (km < 30)  return 50
  if (km < 50)  return 65
  if (km < 75)  return 78
  if (km < 100) return 87
  return 95
}

async function usgsVerisiCek(lat: number, lng: number) {
  try {
    const bugun = new Date(), onYilOnce = new Date()
    onYilOnce.setFullYear(bugun.getFullYear() - 10)
    const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query')
    url.searchParams.set('format',       'geojson')
    url.searchParams.set('starttime',    onYilOnce.toISOString().split('T')[0])
    url.searchParams.set('endtime',      bugun.toISOString().split('T')[0])
    url.searchParams.set('latitude',     lat.toString())
    url.searchParams.set('longitude',    lng.toString())
    url.searchParams.set('maxradius',    '0.5')
    url.searchParams.set('minmagnitude', '2.5')
    url.searchParams.set('limit',        '500')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const depremler = data.features || []
    if (!depremler.length) return { sayisi: 0, ortalama: 0, maksimum: 0 }
    const mags = depremler.map((d: any) => d.properties.mag as number)
    return {
      sayisi:   depremler.length,
      ortalama: Math.round(mags.reduce((t: number, m: number) => t+m, 0) / mags.length * 10) / 10,
      maksimum: Math.round(Math.max(...mags) * 10) / 10,
    }
  } catch (e: any) {
    console.warn('  USGS hatası:', e.message)
    return { sayisi: 0, ortalama: 0, maksimum: 0 }
  }
}

function usgsSkor(sayisi: number, ortalama: number, maksimum: number): number {
  let s = 100
  if (sayisi > 200) s -= 40; else if (sayisi > 100) s -= 30
  else if (sayisi > 50) s -= 20; else if (sayisi > 20) s -= 12
  else if (sayisi > 5) s -= 6
  if (ortalama > 4.5) s -= 25; else if (ortalama > 4) s -= 18
  else if (ortalama > 3.5) s -= 12; else if (ortalama > 3) s -= 6
  if (maksimum > 6) s -= 20; else if (maksimum > 5) s -= 12
  else if (maksimum > 4) s -= 6
  return Math.max(s, 5)
}

async function afadVerisiCek(lat: number, lng: number) {
  try {
    const bugun = new Date(), otuzGunOnce = new Date()
    otuzGunOnce.setDate(bugun.getDate() - 30)
    const url = new URL('https://deprem.afad.gov.tr/apiv2/event/filter')
    url.searchParams.set('start',   otuzGunOnce.toISOString().split('T')[0])
    url.searchParams.set('end',     bugun.toISOString().split('T')[0])
    url.searchParams.set('minlat',  (lat-0.5).toString())
    url.searchParams.set('maxlat',  (lat+0.5).toString())
    url.searchParams.set('minlon',  (lng-0.5).toString())
    url.searchParams.set('maxlon',  (lng+0.5).toString())
    url.searchParams.set('minmag',  '2.0')
    url.searchParams.set('limit',   '100')

    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const liste = Array.isArray(data) ? data : (data.eventList || [])
    if (!liste.length) return { sayisi: 0, maksimum: 0 }
    const mags = liste.map((d: any) => parseFloat(d.magnitude || d.mag || '0'))
    return { sayisi: liste.length, maksimum: Math.round(Math.max(...mags) * 10) / 10 }
  } catch (e: any) {
    console.warn('  AFAD hatası:', e.message)
    return { sayisi: 0, maksimum: 0 }
  }
}

function kombineSkor(faySkor: number, uSkor: number, afadSayisi: number, afadMax: number): number {
  let s = faySkor * 0.50 + uSkor * 0.35
  if (afadSayisi > 20) s -= 10; else if (afadSayisi > 10) s -= 5
  else if (afadSayisi === 0) s += 5
  if (afadMax > 5) s -= 10; else if (afadMax > 4) s -= 5
  return Math.round(Math.max(Math.min(s, 100), 5))
}

function yorum(finalSkor: number, fayKm: number, sayisi: number, maxMag: number): string {
  const km = Math.round(fayKm)
  if (finalSkor >= 80)
    return `Bu bölge, ana fay hatlarına yaklaşık ${km} km uzaklıkta yer alıyor. Son 10 yılda ${sayisi} deprem kaydedilmiş olup deprem aktivitesi görece düşük seviyede. Bölge, İstanbul geneli ortalamasına kıyasla daha düşük riskli bir profil çiziyor.`
  if (finalSkor >= 60)
    return `Bölge, fay hatlarına orta mesafede (~${km} km) konumlanıyor. Son 10 yılda ${sayisi} deprem kaydedildi${maxMag > 0 ? `, en büyüğü M${maxMag}.` : '.'} Orta düzeyde deprem riski taşıyan bu bölge için bina yaşı ve zemin etüdü önemli.`
  if (finalSkor >= 40)
    return `Bölge, aktif fay hatlarına görece yakın (~${km} km). Son 10 yılda ${sayisi} deprem aktivitesi kayıt altına alındı. Taşınma kararında deprem güvenliği, bina yaşı ve zemin yapısı mutlaka değerlendirilmeli.`
  return `Bu bölge, aktif fay hatlarına yakın konumda (~${km} km) ve son 10 yılda ${sayisi} deprem kaydedildi${maxMag > 0 ? ` (max M${maxMag})` : ''}. Yüksek deprem riski taşıyan bu bölge için mutlaka zemin etüdü ve DASK sigortası önerilir.`
}

async function main() {
  console.log('Deprem skorları hesaplanıyor...')
  console.log('Kaynaklar: USGS + AFAD + Fay Hattı (fallback koordinatlar)\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler').select('id,isim,slug,koordinat_lat,koordinat_lng')
    .not('koordinat_lat','is',null)
  const { data: ilceler } = await supabase
    .from('ilceler').select('id,isim,slug,koordinat_lat,koordinat_lng')
    .not('koordinat_lat','is',null)

  const kayitlar = [
    ...(mahalleler||[]).map(m => ({...m, tip:'mahalle'})),
    ...(ilceler||[]).map(i => ({...i, tip:'ilce'})),
  ]
  console.log(`${mahalleler?.length||0} mahalle + ${ilceler?.length||0} ilçe işlenecek\n`)

  for (const k of kayitlar) {
    console.log(`\n── ${k.isim} (${k.tip}) ──`)
    const { koordinat_lat: lat, koordinat_lng: lng } = k

    const fayKm   = enYakinFayMesafesi(lat, lng)
    const faySkor = fayMesafesineGoreSkor(fayKm)
    console.log(`  Fay mesafesi: ~${Math.round(fayKm)} km → Skor: ${faySkor}`)

    await new Promise(r => setTimeout(r, 1000))
    const usgs = await usgsVerisiCek(lat, lng)
    const uSkor = usgsSkor(usgs.sayisi, usgs.ortalama, usgs.maksimum)
    console.log(`  USGS (10 yıl): ${usgs.sayisi} deprem, max M${usgs.maksimum} → Skor: ${uSkor}`)

    await new Promise(r => setTimeout(r, 1000))
    const afad = await afadVerisiCek(lat, lng)
    console.log(`  AFAD (30 gün): ${afad.sayisi} deprem, max M${afad.maksimum}`)

    const finalSkor = kombineSkor(faySkor, uSkor, afad.sayisi, afad.maksimum)
    console.log(`  ✓ Final Deprem Skoru: ${finalSkor}`)

    const depremYorum = yorum(finalSkor, fayKm, usgs.sayisi, usgs.maksimum)

    const tablo = k.tip === 'mahalle' ? 'mahalleler' : 'ilceler'
    const { error } = await supabase.from(tablo).update({
      deprem_skoru:       finalSkor,
      deprem_yorum:       depremYorum,
      deprem_fay_mesafe:  Math.round(fayKm),
      deprem_son_yil:     usgs.sayisi,
      deprem_max_mag:     usgs.maksimum,
      deprem_guncellendi: new Date().toISOString(),
    }).eq('id', k.id)

    if (error) console.error(`  Güncelleme hatası:`, error.message)
    else console.log(`  ✓ Veritabanına kaydedildi`)

    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n\nTamamlandı!')
}

main().catch(console.error)
