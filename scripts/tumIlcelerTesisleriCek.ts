import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TUM_ILCELER = [
  // Mevcut 5 ilçe (doğrulanmış)
  { slug: 'besiktas',      isim: 'Beşiktaş',      osmId: 1765893 },
  { slug: 'sisli',         isim: 'Şişli',          osmId: 1765896 },
  { slug: 'kagithane',     isim: 'Kağıthane',      osmId: 1765894 },
  { slug: 'sariyer',       isim: 'Sarıyer',        osmId: 1765895 },
  { slug: 'beyoglu',       isim: 'Beyoğlu',        osmId: 1765892 },
  // Avrupa Yakası (Nominatim'den doğrulanmış)
  { slug: 'eyupsultan',    isim: 'Eyüpsultan',     osmId: 1766103 },
  { slug: 'gaziosmanpasa', isim: 'Gaziosmanpaşa',  osmId: 1766105 },
  { slug: 'bayrampasa',    isim: 'Bayrampaşa',     osmId: 1766097 },
  { slug: 'fatih',         isim: 'Fatih',          osmId: 1766104 },
  { slug: 'zeytinburnu',   isim: 'Zeytinburnu',    osmId: 1766109 },
  { slug: 'bakirkoy',      isim: 'Bakırköy',       osmId: 1766096 },
  { slug: 'bahcelievler',  isim: 'Bahçelievler',   osmId: 1766095 },
  { slug: 'bagcilar',      isim: 'Bağcılar',       osmId: 1766098 },
  { slug: 'gungoren',      isim: 'Güngören',       osmId: 1766106 },
  { slug: 'esenler',       isim: 'Esenler',        osmId: 1766101 },
  { slug: 'sultangazi',    isim: 'Sultangazi',     osmId: 1766108 },
  { slug: 'kucukcekmece',  isim: 'Küçükçekmece',  osmId: 7786498 },
  { slug: 'avcilar',       isim: 'Avcılar',        osmId: 1766094 },
  { slug: 'buyukcekmece',  isim: 'Büyükçekmece',  osmId: 1275387 },
  { slug: 'esenyurt',      isim: 'Esenyurt',       osmId: 1766102 },
  { slug: 'beylikduzu',    isim: 'Beylikdüzü',     osmId: 1766100 },
  { slug: 'basaksehir',    isim: 'Başakşehir',     osmId: 1766099 },
  { slug: 'arnavutkoy',    isim: 'Arnavutköy',     osmId: 1766093 },
  { slug: 'silivri',       isim: 'Silivri',        osmId: 1275379 },
  { slug: 'catalca',       isim: 'Çatalca',        osmId: 1275389 },
  // Anadolu Yakası (Nominatim'den doğrulanmış)
  { slug: 'uskudar',       isim: 'Üsküdar',        osmId: 1276889 },
  { slug: 'kadikoy',       isim: 'Kadıköy',        osmId: 1276548 },
  { slug: 'atasehir',      isim: 'Ataşehir',       osmId: 1276672 },
  { slug: 'umraniye',      isim: 'Ümraniye',       osmId: 1276890 },
  { slug: 'maltepe',       isim: 'Maltepe',        osmId: 1276407 },
  { slug: 'kartal',        isim: 'Kartal',         osmId: 1276013 },
  { slug: 'pendik',        isim: 'Pendik',         osmId: 1276011 },
  { slug: 'tuzla',         isim: 'Tuzla',          osmId: 1276010 },
  { slug: 'sultanbeyli',   isim: 'Sultanbeyli',    osmId: 1276012 },
  { slug: 'sancaktepe',    isim: 'Sancaktepe',     osmId: 1276014 },
  { slug: 'cekmekoy',      isim: 'Çekmeköy',       osmId: 1276034 },
  { slug: 'beykoz',        isim: 'Beykoz',         osmId: 1276910 },
  { slug: 'sile',          isim: 'Şile',           osmId: 1275310 },
  { slug: 'adalar',        isim: 'Adalar',         osmId: 963209  },
]

async function overpassSorgu(query: string): Promise<any[]> {
  const maxDeneme = 3
  for (let deneme = 1; deneme <= maxDeneme; deneme++) {
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept':       'application/json',
          'User-Agent':   'MahalleSkoruBot/1.0 (educational project)',
        },
        body: new URLSearchParams({ data: query }).toString(),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.elements || []
    } catch (err: any) {
      console.warn(`    Deneme ${deneme}/${maxDeneme}: ${err.message}`)
      if (deneme < maxDeneme) await new Promise(r => setTimeout(r, 3000 * deneme))
    }
  }
  return []
}

function koordinatAl(el: any): { lat: number; lng: number } | null {
  if (el.type === 'node') return { lat: el.lat, lng: el.lon }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon }
  return null
}

async function ulasimCek(osmId: number): Promise<any[]> {
  const areaId = 3600000000 + osmId
  const elements = await overpassSorgu(`
    [out:json][timeout:60];
    area(${areaId})->.ilce;
    (
      node["highway"="bus_stop"](area.ilce);
      node["railway"="subway_entrance"](area.ilce);
      node["railway"="tram_stop"](area.ilce);
      node["amenity"="ferry_terminal"](area.ilce);
      node["highway"="ferry_terminal"](area.ilce);
    );
    out center;
  `)
  return elements.map((el: any) => {
    const k = koordinatAl(el)
    if (!k) return null
    const tags = el.tags || {}
    let altKat = 'bus_stop'
    if (tags.railway === 'subway_entrance')    altKat = 'subway_entrance'
    else if (tags.railway === 'tram_stop')     altKat = 'tram_stop'
    else if (tags.amenity === 'ferry_terminal' ||
             tags.highway === 'ferry_terminal') altKat = 'ferry_terminal'
    return { kategori: 'ulasim', alt_kategori: altKat,
             isim: tags.name || tags['name:tr'] || null,
             lat: k.lat, lng: k.lng, osm_id: el.id, kaynak: 'osm' }
  }).filter(Boolean)
}

async function saglikCek(osmId: number): Promise<any[]> {
  const areaId = 3600000000 + osmId
  const elements = await overpassSorgu(`
    [out:json][timeout:60];
    area(${areaId})->.ilce;
    (
      node["amenity"="hospital"](area.ilce);
      node["amenity"="clinic"](area.ilce);
      node["amenity"="doctors"](area.ilce);
      node["amenity"="pharmacy"](area.ilce);
      node["amenity"="dentist"](area.ilce);
      way["amenity"="hospital"](area.ilce);
      way["amenity"="clinic"](area.ilce);
    );
    out center;
  `)
  return elements.map((el: any) => {
    const k = koordinatAl(el)
    if (!k) return null
    return { kategori: 'saglik', alt_kategori: el.tags?.amenity || 'clinic',
             isim: el.tags?.name || el.tags?.['name:tr'] || null,
             lat: k.lat, lng: k.lng, osm_id: el.id, kaynak: 'osm' }
  }).filter(Boolean)
}

async function egitimCek(osmId: number): Promise<any[]> {
  const areaId = 3600000000 + osmId
  const elements = await overpassSorgu(`
    [out:json][timeout:60];
    area(${areaId})->.ilce;
    (
      node["amenity"="school"](area.ilce);
      node["amenity"="university"](area.ilce);
      node["amenity"="college"](area.ilce);
      node["amenity"="kindergarten"](area.ilce);
      node["amenity"="library"](area.ilce);
      way["amenity"="school"](area.ilce);
      way["amenity"="university"](area.ilce);
    );
    out center;
  `)
  return elements.map((el: any) => {
    const k = koordinatAl(el)
    if (!k) return null
    return { kategori: 'egitim', alt_kategori: el.tags?.amenity || 'school',
             isim: el.tags?.name || el.tags?.['name:tr'] || null,
             lat: k.lat, lng: k.lng, osm_id: el.id, kaynak: 'osm' }
  }).filter(Boolean)
}

async function kulturCek(osmId: number): Promise<any[]> {
  const areaId = 3600000000 + osmId
  const elements = await overpassSorgu(`
    [out:json][timeout:60];
    area(${areaId})->.ilce;
    (
      node["amenity"="cinema"](area.ilce);
      node["amenity"="theatre"](area.ilce);
      node["tourism"="museum"](area.ilce);
      node["tourism"="gallery"](area.ilce);
      node["amenity"="arts_centre"](area.ilce);
      way["amenity"="cinema"](area.ilce);
      way["amenity"="theatre"](area.ilce);
      way["tourism"="museum"](area.ilce);
    );
    out center;
  `)
  return elements.map((el: any) => {
    const k = koordinatAl(el)
    if (!k) return null
    const tags = el.tags || {}
    let altKat = 'kultur_diger'
    if (tags.amenity === 'cinema')           altKat = 'sinema'
    else if (tags.amenity === 'theatre')     altKat = 'tiyatro'
    else if (tags.tourism === 'museum')      altKat = 'muze'
    else if (tags.tourism === 'gallery')     altKat = 'galeri'
    else if (tags.amenity === 'arts_centre') altKat = 'sanat_merkezi'
    return { kategori: 'kultur', alt_kategori: altKat,
             isim: tags.name || tags['name:tr'] || null,
             lat: k.lat, lng: k.lng, osm_id: el.id, kaynak: 'osm' }
  }).filter(Boolean)
}

async function kaydet(ilceId: string, kategori: string, tesisler: any[]): Promise<number> {
  if (tesisler.length === 0) return 0
  await supabase.from('ilce_tesisler').delete()
    .eq('ilce_id', ilceId).eq('kategori', kategori)
  let eklenen = 0
  const veri = tesisler.map(t => ({ ...t, ilce_id: ilceId }))
  for (let i = 0; i < veri.length; i += 100) {
    const { error } = await supabase.from('ilce_tesisler').insert(veri.slice(i, i + 100))
    if (!error) eklenen += Math.min(100, veri.length - i)
  }
  return eklenen
}

function skorHesapla(kategori: string, sayi: number): number {
  const normTable: Record<string, number> = {
    ulasim: 200, saglik: 50, egitim: 30, kultur: 20,
  }
  return Math.min(Math.round((sayi / (normTable[kategori] || 100)) * 100), 100)
}

async function main() {
  console.log('Tüm İstanbul ilçeleri için tesis verisi çekiliyor...')
  console.log(`${TUM_ILCELER.length} ilçe işlenecek\n`)

  const ATLA: string[] = []

  for (const ilce of TUM_ILCELER) {
    if (ATLA.includes(ilce.slug)) {
      console.log(`⏭  Atlandı: ${ilce.isim}`)
      continue
    }

    console.log(`\n${'─'.repeat(40)}`)
    console.log(`📍 ${ilce.isim} (OSM: ${ilce.osmId})`)

    const { data: ilceRow } = await supabase
      .from('ilceler').select('id').eq('slug', ilce.slug).single()

    if (!ilceRow) {
      console.error(`  ✗ Supabase'de bulunamadı: ${ilce.slug}`)
      continue
    }

    const skorGuncelleme: Record<string, number> = {}

    console.log('  → Ulaşım çekiliyor...')
    const ulasim = await ulasimCek(ilce.osmId)
    const ulasimEklenen = await kaydet(ilceRow.id, 'ulasim', ulasim)
    skorGuncelleme.ulasim_skoru = skorHesapla('ulasim', ulasimEklenen)
    console.log(`  ✓ Ulaşım: ${ulasimEklenen} tesis, skor: ${skorGuncelleme.ulasim_skoru}`)
    await new Promise(r => setTimeout(r, 2000))

    console.log('  → Sağlık çekiliyor...')
    const saglik = await saglikCek(ilce.osmId)
    const saglikEklenen = await kaydet(ilceRow.id, 'saglik', saglik)
    skorGuncelleme.saglik_skoru = skorHesapla('saglik', saglikEklenen)
    console.log(`  ✓ Sağlık: ${saglikEklenen} tesis, skor: ${skorGuncelleme.saglik_skoru}`)
    await new Promise(r => setTimeout(r, 2000))

    console.log('  → Eğitim çekiliyor...')
    const egitim = await egitimCek(ilce.osmId)
    const egitimEklenen = await kaydet(ilceRow.id, 'egitim', egitim)
    skorGuncelleme.egitim_skoru = skorHesapla('egitim', egitimEklenen)
    console.log(`  ✓ Eğitim: ${egitimEklenen} tesis, skor: ${skorGuncelleme.egitim_skoru}`)
    await new Promise(r => setTimeout(r, 2000))

    console.log('  → Kültür çekiliyor...')
    const kultur = await kulturCek(ilce.osmId)
    const kulturEklenen = await kaydet(ilceRow.id, 'kultur', kultur)
    console.log(`  ✓ Kültür: ${kulturEklenen} tesis`)
    await new Promise(r => setTimeout(r, 2000))

    const skorlar = Object.values(skorGuncelleme)
    skorGuncelleme.genel_skor = Math.round(skorlar.reduce((t, s) => t + s, 0) / skorlar.length)

    const { error: updateErr } = await supabase
      .from('ilceler').update(skorGuncelleme).eq('id', ilceRow.id)

    if (updateErr) {
      console.error(`  ✗ Skor güncelleme hatası:`, updateErr.message)
    } else {
      console.log(`  ✓ Genel skor güncellendi: ${skorGuncelleme.genel_skor}`)
    }

    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\n\n✅ Tamamlandı!')

  const { data: ozet } = await supabase
    .from('ilceler')
    .select('isim, genel_skor, ulasim_skoru, saglik_skoru, egitim_skoru')
    .order('genel_skor', { ascending: false })

  console.log('\nSon durum:')
  ozet?.forEach(i => {
    console.log(
      `  ${i.isim.padEnd(15)} | ` +
      `Genel:${String(i.genel_skor).padStart(3)} | ` +
      `Ulaşım:${String(i.ulasim_skoru).padStart(3)} | ` +
      `Sağlık:${String(i.saglik_skoru).padStart(3)} | ` +
      `Eğitim:${String(i.egitim_skoru).padStart(3)}`
    )
  })
}

main().catch(console.error)
