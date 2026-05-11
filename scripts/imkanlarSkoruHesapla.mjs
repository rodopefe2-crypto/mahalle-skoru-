import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function p95(arr) {
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)]
}

async function main() {
  console.log('İmkanlar skoru hesaplanıyor (Google Places + OSM + OSM Ticari)...\n')

  // Mahalleler
  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, ilce_id, alan_km2, nufus')

  if (!mahalleler?.length) { console.error('Mahalle verisi alınamadı'); process.exit(1) }

  // Tüm imkanlar tesislerini sayfalı çek (Supabase 1000 limit)
  const tesisler = []
  let offset = 0
  while (true) {
    const { data: batch } = await supabase
      .from('mahalle_tesisler')
      .select('mahalle_id, alt_kategori')
      .eq('kategori', 'imkanlar')
      .in('kaynak', ['google_places', 'osm', 'osm_ticari'])
      .range(offset, offset + 999)
    if (!batch?.length) break
    tesisler.push(...batch)
    if (batch.length < 1000) break
    offset += 1000
  }
  console.log(`Toplam ${tesisler.length} imkanlar tesisi yüklendi`)

  // Mahalle başına say
  const sayac = new Map()
  for (const t of (tesisler || [])) {
    if (!sayac.has(t.mahalle_id)) sayac.set(t.mahalle_id, {})
    const s = sayac.get(t.mahalle_id)
    s[t.alt_kategori] = (s[t.alt_kategori] || 0) + 1
  }

  // Ham puan / alan_km2 yoğunluğu
  const yogunlukDegerler = new Map()
  for (const m of mahalleler) {
    if (!m.alan_km2) continue
    const s = sayac.get(m.id) || {}

    const restaurant    = Math.min(s.restaurant || 0, 30)
    const cafe          = Math.min(s.cafe        || 0, 25)
    const bar           = Math.min(s.bar         || 0, 15)
    const supermarket   = Math.min((s.supermarket || 0) + (s.grocery_or_supermarket || 0), 10)
    const bakery        = Math.min(s.bakery       || 0, 10)
    const shopping_mall = Math.min(s.shopping_mall|| 0,  5)
    const night_club    = Math.min(s.night_club   || 0,  5)

    const ham = restaurant * 2 + cafe * 3 + bar * 2 + supermarket * 3
              + bakery * 1 + shopping_mall * 5 + night_club * 2

    yogunlukDegerler.set(m.id, ham / m.alan_km2)
  }

  const pozitifler = [...yogunlukDegerler.values()].filter(v => v > 0)
  // Log transform → sağa çarpık dağılımı düzelt
  const logDegerler = new Map()
  for (const [id, val] of yogunlukDegerler) {
    if (val > 0) logDegerler.set(id, Math.log1p(val))
  }
  const logPozitifler = [...logDegerler.values()]
  const logMin = Math.min(...logPozitifler)
  const logMax = Math.max(...logPozitifler)
  console.log(`Ham aralık: ${Math.min(...pozitifler).toFixed(2)}–${Math.max(...pozitifler).toFixed(2)} | Log aralık: ${logMin.toFixed(2)}–${logMax.toFixed(2)} | Pozitif: ${pozitifler.length}`)

  // Min-max normalize log değerler → 20-100
  const updates = []
  for (const m of mahalleler) {
    const logVal = logDegerler.get(m.id)
    if (logVal == null) continue
    const skor = Math.round(20 + (logVal - logMin) / (logMax - logMin) * 80)
    updates.push({ id: m.id, ilce_id: m.ilce_id, skor })
  }

  // Mahalle güncelle
  console.log(`\n${updates.length} mahalle imkanlar_skoru güncelleniyor...`)
  let guncellenen = 0, hata = 0
  for (const u of updates) {
    const { error } = await supabase.from('mahalleler')
      .update({ imkanlar_skoru: u.skor }).eq('id', u.id)
    if (error) { hata++; if (hata <= 3) console.error('  ✗', error.message) }
    else guncellenen++
  }
  console.log(`  Güncellenen: ${guncellenen} | Hata: ${hata}`)

  // Sıfır/null olanlar için ilçe ortalaması
  const skorMap = new Map(updates.map(u => [u.id, u.skor]))
  const ilceOrtalamalar = new Map()
  for (const u of updates) {
    const arr = ilceOrtalamalar.get(u.ilce_id) || []
    arr.push(u.skor)
    ilceOrtalamalar.set(u.ilce_id, arr)
  }

  const eksikler = mahalleler.filter(m => !skorMap.has(m.id))
  for (const m of eksikler) {
    const arr = ilceOrtalamalar.get(m.ilce_id)
    if (!arr?.length) continue
    const ort = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    await supabase.from('mahalleler').update({ imkanlar_skoru: ort }).eq('id', m.id)
    skorMap.set(m.id, ort)
  }
  console.log(`  İlçe ortalamasıyla doldurulan: ${eksikler.length}`)

  // Genel skor güncelle
  console.log('\nGenel skor güncelleniyor...')
  const { data: tumMahalleler } = await supabase
    .from('mahalleler')
    .select('id, ilce_id, kira_ortalama, guvenlik_skoru, imkanlar_skoru, ulasim_skoru, egitim_skoru, saglik_skoru, yesil_alan_skoru, kultur_skoru')

  let genelGuncellenen = 0
  for (const m of (tumMahalleler || [])) {
    const kira = Math.min(Math.max(m.kira_ortalama || 25000, 16717), 150000)
    const kiraSkor = (Math.log(kira) - Math.log(16717)) / (Math.log(150000) - Math.log(16717)) * 100
    const genel = Math.min(100, Math.round(
      kiraSkor                          * 0.20 +
      (m.guvenlik_skoru     || 50)      * 0.20 +
      (m.imkanlar_skoru     || 0)       * 0.20 +
      (m.ulasim_skoru       || 0)       * 0.20 +
      (m.egitim_skoru       || 0)       * 0.075 +
      (m.saglik_skoru       || 0)       * 0.075 +
      (m.yesil_alan_skoru   || 0)       * 0.025 +
      (m.kultur_skoru       || 0)       * 0.025
    ))
    const { error } = await supabase.from('mahalleler')
      .update({ genel_skor: genel }).eq('id', m.id)
    if (!error) genelGuncellenen++
  }
  console.log(`  Genel skor güncellenen: ${genelGuncellenen}`)

  // İlçe skorları
  console.log('\nİlçe imkanlar + genel skor güncelleniyor...')
  const ilceImkanlar = new Map()
  const ilceGenel    = new Map()
  for (const m of (tumMahalleler || [])) {
    const kira = Math.min(Math.max(m.kira_ortalama || 25000, 16717), 150000)
    const kiraSkor = (Math.log(kira) - Math.log(16717)) / (Math.log(150000) - Math.log(16717)) * 100
    const genel = Math.min(100, Math.round(
      kiraSkor                          * 0.20 +
      (m.guvenlik_skoru     || 50)      * 0.20 +
      (skorMap.get(m.id) || m.imkanlar_skoru || 0) * 0.20 +
      (m.ulasim_skoru       || 0)       * 0.20 +
      (m.egitim_skoru       || 0)       * 0.075 +
      (m.saglik_skoru       || 0)       * 0.075 +
      (m.yesil_alan_skoru   || 0)       * 0.025 +
      (m.kultur_skoru       || 0)       * 0.025
    ))
    if (!ilceImkanlar.has(m.ilce_id)) ilceImkanlar.set(m.ilce_id, [])
    if (!ilceGenel.has(m.ilce_id))    ilceGenel.set(m.ilce_id, [])
    const iskor = skorMap.get(m.id) || m.imkanlar_skoru
    if (iskor) ilceImkanlar.get(m.ilce_id).push(iskor)
    if (genel > 0) ilceGenel.get(m.ilce_id).push(genel)
  }

  const { data: ilceler } = await supabase.from('ilceler').select('id')
  for (const ilce of (ilceler || [])) {
    const ia = ilceImkanlar.get(ilce.id) || []
    const ig = ilceGenel.get(ilce.id)    || []
    const upd = {}
    if (ia.length) upd.imkanlar_skoru = Math.round(ia.reduce((a,b)=>a+b,0)/ia.length)
    if (ig.length) upd.genel_skor     = Math.round(ig.reduce((a,b)=>a+b,0)/ig.length)
    if (Object.keys(upd).length) await supabase.from('ilceler').update(upd).eq('id', ilce.id)
  }

  // Kontrol
  console.log('\n── Kontrol ──')
  const { data: kontrol } = await supabase
    .from('mahalleler')
    .select('isim, ilce:ilce_id(isim), imkanlar_skoru, genel_skor')
    .in('isim', ['LEVENT','SİNANPAŞA','ETİLER','BEBEK','CİHANGİR','CADDEBOSTAN','BAĞCILAR MERKEZ','ESENYURT MERKEZ'])
    .order('imkanlar_skoru', { ascending: false })

  console.log('mahalle'.padEnd(22), 'ilçe'.padEnd(14), 'imkanlar', 'genel')
  console.log('─'.repeat(60))
  for (const m of (kontrol || [])) {
    console.log(
      m.isim.padEnd(22),
      (m.ilce?.isim || '').padEnd(14),
      String(m.imkanlar_skoru || 0).padStart(8),
      String(m.genel_skor     || 0).padStart(6)
    )
  }

  console.log('\n✅ Tamamlandı')
}

main().catch(console.error)
