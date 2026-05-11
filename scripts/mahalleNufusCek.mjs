import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'tr-TR,tr;q=0.9',
}

function normIsim(s) {
  return s
    .toUpperCase()
    .replace(/\s*(MAHALLESİ|MAHALLESi|MAHALLESİ|KÖYÜ|KÖY)\s*$/i, '')
    .trim()
}

// Boşuk ve noktalama kaldırılmış form — fuzzy eşleştirme için
function normFuzzy(s) {
  return normIsim(s).replace(/[\s\-\.]/g, '')
}

function parseNufus(s) {
  return parseInt(s.replace(/[.\s]/g, '').replace(/,/g, '')) || 0
}

async function ilceMahalleleriniCek(ilceSlug) {
  const url = `https://www.nufusune.com/${ilceSlug}-ilce-nufusu-istanbul`
  const res = await fetch(url, { headers: HEADERS })
  const html = await res.text()

  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/g)
  if (!tbodyMatch) return []

  const mahalleler = []
  for (const tbody of tbodyMatch) {
    const rowRe = /<tr>([\s\S]*?)<\/tr>/g
    let rowMatch
    while ((rowMatch = rowRe.exec(tbody)) !== null) {
      const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m =>
        m[1].replace(/<[^>]+>/g, '').trim()
      )
      if (cells.length < 2) continue
      const isim = normIsim(cells[0])
      const nufus = parseNufus(cells[1])
      if (isim && nufus > 0) mahalleler.push({ isim, nufus })
    }
  }

  return mahalleler
}

async function main() {
  // Sadece nufus IS NULL olan mahalleleri çek
  const { data: nullMahalleler, error } = await supabase
    .from('mahalleler')
    .select('id, isim, slug, ilce:ilce_id(isim, slug)')
    .is('nufus', null)

  if (error || !nullMahalleler) { console.error('Veri alınamadı:', error?.message); process.exit(1) }
  console.log(`${nullMahalleler.length} mahalle null nüfus\n`)

  if (nullMahalleler.length === 0) {
    console.log('✅ Tüm mahalleler zaten güncel.')
    return
  }

  // İlçelere göre grupla
  const ilceGruplari = new Map()
  for (const m of nullMahalleler) {
    const ilceSlug = m.ilce?.slug
    if (!ilceSlug) continue
    if (!ilceGruplari.has(ilceSlug)) ilceGruplari.set(ilceSlug, [])
    ilceGruplari.get(ilceSlug).push(m)
  }

  console.log(`${ilceGruplari.size} ilçe işlenecek\n`)

  let toplamGuncellenen = 0, toplamBulunamayan = 0
  const hataVerenler = []

  for (const [ilceSlug, mahalleler] of ilceGruplari) {
    try {
      process.stdout.write(`${ilceSlug} (${mahalleler.length} mahalle)... `)
      const webMahalleler = await ilceMahalleleriniCek(ilceSlug)

      if (webMahalleler.length === 0) {
        console.log('web verisi yok')
        hataVerenler.push(ilceSlug)
        continue
      }

      // İki map: tam eşleşme + fuzzy (boşuksuz)
      const nufusMap      = new Map(webMahalleler.map(m => [m.isim, m.nufus]))
      const nufusFuzzyMap = new Map(webMahalleler.map(m => [normFuzzy(m.isim), m.nufus]))

      let ilceGuncellenen = 0
      for (const mahalle of mahalleler) {
        const nufus = nufusMap.get(mahalle.isim)
          ?? nufusFuzzyMap.get(normFuzzy(mahalle.isim))
        if (!nufus) {
          toplamBulunamayan++
          if (toplamBulunamayan <= 5) console.log(`\n  ✗ Eşleşmedi: "${mahalle.isim}"`)
          continue
        }

        const { error: updateError } = await supabase
          .from('mahalleler')
          .update({ nufus })
          .eq('id', mahalle.id)

        if (updateError) {
          toplamBulunamayan++
        } else {
          toplamGuncellenen++
          ilceGuncellenen++
        }
      }

      console.log(`${ilceGuncellenen} güncellendi`)
      await new Promise(r => setTimeout(r, 800))
    } catch (err) {
      console.log(`HATA: ${err.message}`)
      hataVerenler.push(ilceSlug)
    }
  }

  console.log(`\n✅ Tamamlandı`)
  console.log(`  Güncellenen:  ${toplamGuncellenen}`)
  console.log(`  Eşleşmeyen:  ${toplamBulunamayan}`)
  if (hataVerenler.length) console.log(`  Hatalı ilçeler: ${hataVerenler.join(', ')}`)
}

main().catch(console.error)
