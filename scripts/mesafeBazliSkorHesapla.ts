import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function mesafe(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function mesafeCarpani(km: number): number {
  if (km <= 0.5) return 1.0
  if (km <= 1.0) return 0.7
  if (km <= 2.0) return 0.4
  if (km <= 3.0) return 0.2
  return 0.0
}

const SAGLIK_PUANLARI: Record<string, number> = {
  hospital: 10, clinic: 5, pharmacy: 3, dentist: 2, doctors: 2,
}
const EGITIM_PUANLARI_SABIT: Record<string, number> = {
  college: 3, school: 1, kindergarten: 1, library: 2,
}
const SAGLIK_CAP: Record<string, number> = {
  hospital: 7, clinic: 10, pharmacy: 15, dentist: 10, doctors: 10,
}
const EGITIM_CAP: Record<string, number> = {
  university: 5, college: 5, school: 20, kindergarten: 12, library: 6,
}

const UNI_PUANLARI: Record<string, number> = {
  'boğaziçi': 10, 'bogazici': 10,
  'istanbul teknik': 10, 'itu': 10,
  'sabancı': 10, 'sabanci': 10,
  'koç': 10, 'koc': 10,
  'marmara': 9,
  'yıldız teknik': 8, 'yildiz teknik': 8,
  'istanbul üniversitesi': 8, 'istanbul universitesi': 8,
  'galatasaray': 8,
  'medipol': 7,
  'istanbul medeniyet': 7,
  'bahçeşehir': 7, 'bahcesehir': 7,
  'özyeğin': 7, 'ozyegin': 7,
  'kadir has': 7,
  'bilgi': 7,
  'istinye': 7,
  'acıbadem': 7, 'acibadem': 7,
  'beykent': 6,
  'işık': 6, 'isik': 6,
  'kültür': 6, 'kultur': 6,
  'maltepe': 6,
  'haliç': 6, 'halic': 6,
  'beykoz': 5,
  'gedik': 5,
  'arel': 5,
  'atlas': 5,
  'altınbaş': 5, 'altinbas': 5,
  'biruni': 5,
  'fenerbahçe': 5, 'fenerbahce': 5,
  'nişantaşı': 5, 'nisantasi': 5,
  'esenyurt': 4,
  'topkapı': 4, 'topkapi': 4,
}
const DEFAULT_UNI_PUAN = 4

function uniPuanBul(isim: string): number {
  if (!isim) return DEFAULT_UNI_PUAN
  const isimKucuk = isim.toLowerCase()
  for (const [anahtar, puan] of Object.entries(UNI_PUANLARI)) {
    if (isimKucuk.includes(anahtar)) return puan
  }
  return DEFAULT_UNI_PUAN
}

async function fetchAll<T>(queryFn: (from: number) => any): Promise<T[]> {
  const results: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await queryFn(from)
    if (error) { console.error('Sayfalama hatası:', error.message); break }
    if (!data || data.length === 0) break
    results.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  return results
}

const LN_MIN_KIRA = Math.log(16717)
const LN_MAX_KIRA = Math.log(64454)

function kiraLogSkor(kira: number | null): number {
  const k = Math.max(kira && kira > 0 ? kira : 25000, 1)
  return Math.min(100, Math.max(0, (Math.log(k) - LN_MIN_KIRA) / (LN_MAX_KIRA - LN_MIN_KIRA) * 100))
}

async function main() {
  console.log('Mesafe bazlı sağlık/eğitim skoru hesaplanıyor...\n')

  // OSM tesisler (paginated)
  process.stdout.write('OSM sağlık tesisler çekiliyor...')
  const saglikTesisler = await fetchAll<any>(from =>
    supabase.from('ilce_tesisler')
      .select('alt_kategori, lat, lng')
      .eq('kategori', 'saglik').eq('kaynak', 'osm')
      .not('lat', 'is', null).range(from, from + 999)
  )
  console.log(` ${saglikTesisler.length}`)

  process.stdout.write('OSM eğitim tesisler çekiliyor...')
  const egitimTesisler = await fetchAll<any>(from =>
    supabase.from('ilce_tesisler')
      .select('alt_kategori, isim, lat, lng')
      .eq('kategori', 'egitim').eq('kaynak', 'osm')
      .not('lat', 'is', null).range(from, from + 999)
  )
  console.log(` ${egitimTesisler.length}`)

  // Mahalleler (paginated)
  process.stdout.write('Mahalleler çekiliyor...')
  const mahalleler = await fetchAll<any>(from =>
    supabase.from('mahalleler')
      .select('id, isim, koordinat_lat, koordinat_lng, kira_ortalama, guvenlik_skoru, imkanlar_skoru, ulasim_skoru, yesil_alan_skoru, kultur_skoru, ilce_id')
      .not('koordinat_lat', 'is', null)
      .not('koordinat_lng', 'is', null)
      .range(from, from + 999)
  )
  console.log(` ${mahalleler.length}\n`)

  if (!mahalleler.length || !saglikTesisler.length || !egitimTesisler.length) {
    console.error('Veri eksik'); return
  }

  // ── Mahalle başına hesapla ───────────────────────────────
  console.log(`${mahalleler.length} mahalle × ${saglikTesisler.length + egitimTesisler.length} tesis işleniyor...`)
  const baslangic = Date.now()

  const sonuclar: { id: string; saglik: number; egitim: number }[] = []

  for (let mi = 0; mi < mahalleler.length; mi++) {
    const mahalle = mahalleler[mi]
    const mLat = mahalle.koordinat_lat as number
    const mLng = mahalle.koordinat_lng as number

    // Sağlık
    const saglikSayac: Record<string, number> = {}
    let saglikHam = 0
    for (const t of saglikTesisler) {
      const km = mesafe(mLat, mLng, t.lat, t.lng)
      const carpan = mesafeCarpani(km)
      if (carpan === 0) continue
      const bazPuan = SAGLIK_PUANLARI[t.alt_kategori] || 0
      if (bazPuan === 0) continue
      saglikSayac[t.alt_kategori] = (saglikSayac[t.alt_kategori] || 0) + 1
      if (saglikSayac[t.alt_kategori] <= (SAGLIK_CAP[t.alt_kategori] || 5)) {
        saglikHam += bazPuan * carpan
      }
    }

    // Eğitim
    const egitimSayac: Record<string, number> = {}
    let egitimHam = 0
    for (const t of egitimTesisler) {
      const km = mesafe(mLat, mLng, t.lat as number, t.lng as number)
      const carpan = mesafeCarpani(km)
      if (carpan === 0) continue
      const altKat = t.alt_kategori || ''
      let bazPuan: number
      if (altKat === 'university') {
        bazPuan = uniPuanBul(t.isim || '')
      } else {
        bazPuan = EGITIM_PUANLARI_SABIT[altKat] || 0
      }
      if (bazPuan === 0) continue
      egitimSayac[altKat] = (egitimSayac[altKat] || 0) + 1
      const cap = EGITIM_CAP[altKat] || 10
      if (egitimSayac[altKat] <= cap) {
        egitimHam += bazPuan * carpan
      }
    }

    sonuclar.push({ id: mahalle.id, saglik: saglikHam, egitim: egitimHam })

    if ((mi + 1) % 100 === 0) {
      const gecen = ((Date.now() - baslangic) / 1000).toFixed(0)
      const kalan = Math.round((Date.now() - baslangic) / (mi + 1) * (mahalleler.length - mi - 1) / 1000)
      process.stdout.write(`\r  ${mi+1}/${mahalleler.length} — ${gecen}s geçti, ~${kalan}s kaldı`)
    }
  }
  const sure = ((Date.now() - baslangic) / 1000).toFixed(1)
  console.log(`\r  ✅ Hesaplama tamamlandı — ${sure}s`)

  // ── Normalize [20-100] ───────────────────────────────────
  const saglikVals = sonuclar.map(s => s.saglik).filter(v => v > 0)
  const egitimVals = sonuclar.map(s => s.egitim).filter(v => v > 0)
  const saglikMin = Math.min(...saglikVals), saglikMax = Math.max(...saglikVals)
  const egitimMin = Math.min(...egitimVals), egitimMax = Math.max(...egitimVals)

  console.log(`\n  Sağlık ham: ${saglikMin.toFixed(1)} – ${saglikMax.toFixed(1)}`)
  console.log(`  Eğitim ham: ${egitimMin.toFixed(1)} – ${egitimMax.toFixed(1)}`)

  function normalize(puan: number, mn: number, mx: number): number {
    if (puan <= 0) return 20
    if (mx === mn) return 60
    return Math.round(20 + (puan - mn) / (mx - mn) * 80)
  }

  // ── Mahalle güncellemeleri (toplu) ──────────────────────
  console.log('\nSupabase\'e yazılıyor...')

  // Mahalle başına nihai skorlar + genel_skor
  const mahalleMap = new Map(mahalleler.map((m: any) => [m.id, m]))
  const mahGuncellemeler = sonuclar.map(s => {
    const m = mahalleMap.get(s.id)!
    const saglik_skoru = normalize(s.saglik, saglikMin, saglikMax)
    const egitim_skoru = normalize(s.egitim, egitimMin, egitimMax)
    const kiraSkor = kiraLogSkor(m.kira_ortalama)
    const genel_skor = Math.min(100, Math.round(
      kiraSkor                        * 0.200 +
      (m.guvenlik_skoru  || 50)       * 0.200 +
      (m.imkanlar_skoru  || 0)        * 0.200 +
      (m.ulasim_skoru    || 0)        * 0.200 +
      egitim_skoru                    * 0.075 +
      saglik_skoru                    * 0.075 +
      (m.yesil_alan_skoru || 0)       * 0.025 +
      (m.kultur_skoru     || 0)       * 0.025
    ))
    return { id: s.id, saglik_skoru, egitim_skoru, genel_skor }
  })

  let yazilan = 0
  const BATCH = 50
  for (let i = 0; i < mahGuncellemeler.length; i += BATCH) {
    const batch = mahGuncellemeler.slice(i, i + BATCH)
    await Promise.all(batch.map(u =>
      supabase.from('mahalleler')
        .update({ saglik_skoru: u.saglik_skoru, egitim_skoru: u.egitim_skoru, genel_skor: u.genel_skor })
        .eq('id', u.id)
    ))
    yazilan += batch.length
    if (yazilan % 200 === 0) process.stdout.write(`\r  ${yazilan}/${mahGuncellemeler.length}`)
  }
  console.log(`\r  ✅ ${yazilan} mahalle güncellendi`)

  // ── İlçe ortalamalarını güncelle ────────────────────────
  console.log('\nİlçe ortalamalar güncelleniyor...')
  const ilceAgg = new Map<string, { saglik: number[]; egitim: number[]; genel: number[] }>()
  for (const u of mahGuncellemeler) {
    const m = mahalleMap.get(u.id)!
    const ilceId = m.ilce_id
    if (!ilceAgg.has(ilceId)) ilceAgg.set(ilceId, { saglik: [], egitim: [], genel: [] })
    const a = ilceAgg.get(ilceId)!
    if (u.saglik_skoru > 0) a.saglik.push(u.saglik_skoru)
    if (u.egitim_skoru > 0) a.egitim.push(u.egitim_skoru)
    if (u.genel_skor   > 0) a.genel.push(u.genel_skor)
  }
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0
  await Promise.all([...ilceAgg.entries()].map(([id, a]) =>
    supabase.from('ilceler').update({
      saglik_skoru: avg(a.saglik),
      egitim_skoru: avg(a.egitim),
      genel_skor:   avg(a.genel),
    }).eq('id', id)
  ))
  console.log(`  ✅ ${ilceAgg.size} ilçe güncellendi`)

  // ── Kontrol ─────────────────────────────────────────────
  console.log('\n── Top 15 Mahalle (Genel Skor) ───────────────────────')
  const { data: top15 } = await supabase
    .from('mahalleler')
    .select('isim, saglik_skoru, egitim_skoru, genel_skor, ilce:ilce_id(isim)')
    .order('genel_skor', { ascending: false })
    .limit(15)

  console.log(`  ${'Mahalle'.padEnd(24)} ${'İlçe'.padEnd(14)} Sağlık  Eğitim  Genel`)
  console.log('  ' + '─'.repeat(62))
  for (const m of top15 || []) {
    console.log(
      `  ${m.isim.padEnd(24)} ${((m as any).ilce?.isim || '').padEnd(14)} ` +
      `${String(m.saglik_skoru).padStart(6)}  ${String(m.egitim_skoru).padStart(6)}  ${String(m.genel_skor).padStart(5)}`
    )
  }

  console.log('\n── İlçe Skorları (Sağlık ↓) ─────────────────────────')
  const { data: ilceList } = await supabase
    .from('ilceler')
    .select('isim, saglik_skoru, egitim_skoru, genel_skor')
    .order('saglik_skoru', { ascending: false })
  console.log(`  ${'İlçe'.padEnd(18)} Sağlık  Eğitim  Genel`)
  console.log('  ' + '─'.repeat(46))
  for (const i of ilceList || []) {
    console.log(`  ${i.isim.padEnd(18)} ${String(i.saglik_skoru).padStart(6)}  ${String(i.egitim_skoru).padStart(6)}  ${String(i.genel_skor).padStart(5)}`)
  }

  // Dağılım kontrolü
  const dist = { low: 0, mid: 0, high: 0 }
  for (const u of mahGuncellemeler) {
    if (u.saglik_skoru < 40) dist.low++
    else if (u.saglik_skoru < 70) dist.mid++
    else dist.high++
  }
  console.log(`\n── Sağlık Skor Dağılımı ──────────────────────────────`)
  console.log(`  20-39: ${dist.low} mahalle`)
  console.log(`  40-69: ${dist.mid} mahalle`)
  console.log(`  70+:   ${dist.high} mahalle`)
  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
