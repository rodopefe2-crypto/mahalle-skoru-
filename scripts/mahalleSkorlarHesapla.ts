import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── PUAN TABLOSU (ilçe ile aynı) ─────────────────
const PUAN_TABLOSU: Record<string, number> = {
  // Ulaşım
  bus_stop: 1, subway_entrance: 10, tram_stop: 5,
  ferry_terminal: 10, metrobus: 10,
  // Sağlık
  pharmacy: 3, hospital: 15, clinic: 8, doctors: 5, dentist: 3,
  eczane: 3, hastane: 15, klinik: 8,
  // Eğitim
  school: 7, university: 20, college: 10, kindergarten: 5, library: 5,
  // İmkanlar
  cafe: 2, restoran: 2, market: 3, bar: 1, firin: 1,
  // Yeşil
  park: 5, spor: 3, garden: 2, playground: 2, sports_centre: 4,
  // Kültür
  sinema: 5, tiyatro: 5, muze: 5, galeri: 3, arts_centre: 4,
  cinema: 5, theatre: 5, museum: 5, gallery: 3,
}

const KATEGORI_AGIRLIKLARI: Record<string, string> = {
  ulasim: 'ulasim_skoru', saglik: 'saglik_skoru',
  egitim: 'egitim_skoru', imkanlar: 'imkanlar_skoru',
}

// Haversine mesafe (km)
function mesafe(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Log normalizasyon
function logNorm(values: number[]): number[] {
  const max = Math.max(...values)
  const positives = values.filter(v => v > 0)
  const min = positives.length > 0 ? Math.min(...positives) : 0
  if (max === 0) return values.map(() => 0)
  return values.map(v => {
    if (v === 0) return 0
    const logV = Math.log(v + 1)
    const logMax = Math.log(max + 1)
    const logMin = Math.log(min + 1)
    return logMax === logMin ? 50 : Math.round(((logV - logMin) / (logMax - logMin)) * 100)
  })
}

// Tüm tesisleri batch ile çek
async function tumTesisleriCek() {
  const tesisler: any[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('ilce_tesisler')
      .select('ilce_id, kategori, alt_kategori, lat, lng')
      .not('lat', 'is', null)
      .range(offset, offset + 999)
    if (error || !data?.length) break
    tesisler.push(...data)
    process.stdout.write(`\r  Tesis yükleniyor: ${tesisler.length}`)
    if (data.length < 1000) break
    offset += 1000
  }
  console.log(`\r  ${tesisler.length} tesis yüklendi           `)
  return tesisler
}

async function main() {
  console.log('Mahalle bazlı skor hesaplanıyor...')
  console.log('Yöntem: Tesis koordinatı → en yakın mahalle atama\n')

  // Veri çek
  const [{ data: ilceler }, { data: mahalleler }, tesisler] = await Promise.all([
    supabase.from('ilceler').select('id, slug, deprem_skoru, nufus_yogunlugu_skoru'),
    supabase.from('mahalleler').select('id, ilce_id, isim, koordinat_lat, koordinat_lng, deprem_skoru'),
    tumTesisleriCek(),
  ])

  console.log(`  ${ilceler!.length} ilçe, ${mahalleler!.length} mahalle`)

  // İlçe başına mahalle listesi
  const mahByIlce = new Map<string, typeof mahalleler>()
  for (const m of mahalleler!) {
    if (!m.koordinat_lat || !m.koordinat_lng) continue
    if (!mahByIlce.has(m.ilce_id)) mahByIlce.set(m.ilce_id, [])
    mahByIlce.get(m.ilce_id)!.push(m)
  }

  // Her mahalle için kategori bazlı ham puan
  const mahPuanlari = new Map<string, Record<string, number>>()
  for (const m of mahalleler!) {
    mahPuanlari.set(m.id, { ulasim: 0, saglik: 0, egitim: 0, imkanlar: 0 })
  }

  // Her tesisi en yakın mahalleye ata
  let atanan = 0, atlanan = 0
  for (const tesis of tesisler) {
    const mahs = mahByIlce.get(tesis.ilce_id)
    if (!mahs?.length) { atlanan++; continue }

    // En yakın mahalleyi bul
    let enYakin = mahs[0], enMesafe = Infinity
    for (const m of mahs) {
      const d = mesafe(tesis.lat, tesis.lng, m.koordinat_lat, m.koordinat_lng)
      if (d < enMesafe) { enMesafe = d; enYakin = m }
    }

    // Sadece makul mesafedekiler (max 3km — çok uzak atamayı engelle)
    if (enMesafe > 3) { atlanan++; continue }

    const puan = PUAN_TABLOSU[tesis.alt_kategori] || 0
    if (puan === 0) { atanan++; continue }

    const kat = tesis.kategori as string
    const puanlar = mahPuanlari.get(enYakin.id)!
    if (kat in puanlar) puanlar[kat] += puan
    atanan++
  }

  console.log(`  Atanan: ${atanan}, atlanan (3km+): ${atlanan}`)

  // Her ilçe içinde normalize et (ilçe bazlı — görece fark korunsun)
  const mahSkorlar = new Map<string, Record<string, number>>()

  for (const [ilceId, ilceMahs] of mahByIlce.entries()) {
    const ilce = ilceler!.find(i => i.id === ilceId)!

    for (const kat of ['ulasim', 'saglik', 'egitim', 'imkanlar'] as const) {
      const ids   = (ilceMahs ?? []).map(m => m.id)
      const vals  = ids.map(id => mahPuanlari.get(id)?.[kat] ?? 0)
      const norms = logNorm(vals)

      ids.forEach((id, i) => {
        if (!mahSkorlar.has(id)) mahSkorlar.set(id, {})
        mahSkorlar.get(id)![kat] = norms[i]
      })
    }
  }

  // DB'ye yaz
  console.log('\nDB güncelleniyor...')
  let guncellenen = 0

  for (const mah of mahalleler!) {
    const ilce        = ilceler!.find(i => i.id === mah.ilce_id)
    const skorlar     = mahSkorlar.get(mah.id) || {}
    const depremSkoru = (mah as any).deprem_skoru || (ilce?.deprem_skoru || 50)

    const ulasim   = skorlar['ulasim']   ?? 0
    const saglik   = skorlar['saglik']   ?? 0
    const egitim   = skorlar['egitim']   ?? 0
    const imkanlar = skorlar['imkanlar'] ?? 0
    const nufusYog = ilce?.nufus_yogunlugu_skoru || 0

    const genel = Math.round(
      ulasim   * 0.22 +
      saglik   * 0.17 +
      egitim   * 0.17 +
      imkanlar * 0.13 +
      depremSkoru * 0.10 +
      nufusYog * 0.07
    )

    const { error } = await supabase
      .from('mahalleler')
      .update({
        ulasim_skoru:   ulasim,
        saglik_skoru:   saglik,
        egitim_skoru:   egitim,
        imkanlar_skoru: imkanlar,
        genel_skor:     genel,
      })
      .eq('id', mah.id)

    if (!error) {
      guncellenen++
      if (guncellenen % 100 === 0) process.stdout.write(`\r  ${guncellenen}/${mahalleler!.length}`)
    }
  }

  console.log(`\r✅ ${guncellenen} mahalle güncellendi          `)

  // TOP 10
  const { data: top } = await supabase
    .from('mahalleler')
    .select('isim, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, deprem_skoru, genel_skor')
    .order('genel_skor', { ascending: false })
    .limit(10)

  console.log('\n── TOP 10 Mahalle ──────────────────────────────────────────')
  console.log('  MAH                    ULAŞ  SAĞL   EĞT  İMKN   DEP  GENEL')
  console.log('  ' + '─'.repeat(58))
  top?.forEach((m, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${m.isim.padEnd(18)} ` +
      `${m.ulasim_skoru??0}`.padStart(5) + ' ' +
      `${m.saglik_skoru??0}`.padStart(5) + ' ' +
      `${m.egitim_skoru??0}`.padStart(5) + ' ' +
      `${m.imkanlar_skoru??0}`.padStart(5) + ' ' +
      `${m.deprem_skoru??0}`.padStart(5) + ' ' +
      `${m.genel_skor??0}`.padStart(6)
    )
  })
}

main().catch(console.error)
