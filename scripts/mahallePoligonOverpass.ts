import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function overpassSorgu(query: string): Promise<any> {
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MahalleApp/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
      })
      if (res.status === 429) {
        console.warn('  Rate limit, 90s bekleniyor...')
        await new Promise(r => setTimeout(r, 90000))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      console.warn(`  Deneme ${i}/3: ${err.message}`)
      if (i < 3) await new Promise(r => setTimeout(r, 3000 * i))
    }
  }
  return null
}

function buildRing(members: any[]): [number, number][] | null {
  const outerWays = members.filter((m: any) => m.role === 'outer' && m.geometry?.length)
  if (!outerWays.length) return null

  // Way'leri sıralı şekilde birleştir
  const segments: [number, number][][] = outerWays.map((w: any) =>
    w.geometry.map((n: any) => [n.lon, n.lat] as [number, number])
  )

  const ring: [number, number][] = [...segments[0]]
  const used = new Set([0])

  for (let iter = 0; iter < segments.length - 1; iter++) {
    const last = ring[ring.length - 1]
    let bestIdx = -1, bestReverse = false

    for (let j = 0; j < segments.length; j++) {
      if (used.has(j)) continue
      const seg = segments[j]
      const d1 = Math.abs(seg[0][0] - last[0]) + Math.abs(seg[0][1] - last[1])
      const d2 = Math.abs(seg[seg.length - 1][0] - last[0]) + Math.abs(seg[seg.length - 1][1] - last[1])
      if (d1 < 0.0001) { bestIdx = j; bestReverse = false; break }
      if (d2 < 0.0001) { bestIdx = j; bestReverse = true; break }
    }

    if (bestIdx === -1) {
      // Sıralama bulunamadı, düz ekle
      for (let j = 0; j < segments.length; j++) {
        if (!used.has(j)) { bestIdx = j; break }
      }
    }
    if (bestIdx === -1) break

    const seg = bestReverse ? [...segments[bestIdx]].reverse() : segments[bestIdx]
    ring.push(...seg.slice(1))
    used.add(bestIdx)
  }

  // Halkayı kapat
  if (ring.length >= 4) {
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push(ring[0])
    }
    return ring
  }
  return null
}

function trTitleCase(s: string): string {
  return s.split(' ').map(w => {
    if (!w) return w
    const rest = w.slice(1)
      .replace(/İ/g, 'i').replace(/I/g, 'ı')
      .replace(/Ş/g, 'ş').replace(/Ğ/g, 'ğ')
      .replace(/Ü/g, 'ü').replace(/Ö/g, 'ö')
      .replace(/Ç/g, 'ç').toLowerCase()
    return w[0] + rest
  }).join(' ')
}

async function main() {
  console.log('Boundary eksik mahalleler yükleniyor...\n')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce:ilce_id(isim)')
    .is('boundary', null)
    .order('isim')

  if (!mahalleler?.length) {
    console.log("Tüm mahallelerin boundary'si var!")
    return
  }

  console.log(`${mahalleler.length} mahalle eksik boundary\n`)

  let basarili = 0, basarisiz = 0
  const basarisizlar: string[] = []

  for (let idx = 0; idx < mahalleler.length; idx++) {
    const mahalle = mahalleler[idx]
    const ilceIsim = (mahalle.ilce as any)?.isim || ''
    process.stdout.write(`[${idx + 1}/${mahalleler.length}] ${ilceIsim}/${mahalle.isim}... `)

    // İstanbul'da mahalleler admin_level=8, "X Mahallesi" formatında
    const titleIsim = trTitleCase(mahalle.isim)
    const query = `
[out:json][timeout:30];
(
  relation["boundary"="administrative"]["admin_level"="8"]["name"="${titleIsim} Mahallesi"](41.0,28.0,41.5,29.5);
  relation["boundary"="administrative"]["admin_level"="8"]["name"="${titleIsim}"](41.0,28.0,41.5,29.5);
  relation["place"="neighbourhood"]["name"="${titleIsim} Mahallesi"](41.0,28.0,41.5,29.5);
  relation["place"="neighbourhood"]["name"="${titleIsim}"](41.0,28.0,41.5,29.5);
);
out geom;`

    await new Promise(r => setTimeout(r, 1500))
    const data = await overpassSorgu(query)

    if (!data?.elements?.length) {
      console.log('✗ bulunamadı')
      basarisiz++
      basarisizlar.push(`${ilceIsim}/${mahalle.isim}`)
      continue
    }

    // İlçe adıyla eşleşen relation'ı önceliklendir
    let secilen = data.elements[0]
    for (const el of data.elements) {
      const tags = el.tags || {}
      const elIlce = (tags['is_in:district'] || tags['addr:district'] || '').toLowerCase()
      if (elIlce.includes(ilceIsim.toLowerCase().slice(0, 4))) {
        secilen = el; break
      }
    }

    if (!secilen.members?.length) {
      console.log('✗ geometry yok')
      basarisiz++
      basarisizlar.push(`${ilceIsim}/${mahalle.isim}`)
      continue
    }

    const ring = buildRing(secilen.members)
    if (!ring || ring.length < 4) {
      console.log(`✗ yetersiz koordinat (${ring?.length ?? 0})`)
      basarisiz++
      basarisizlar.push(`${ilceIsim}/${mahalle.isim}`)
      continue
    }

    const geojson = { type: 'Polygon', coordinates: [ring] }

    const { error } = await supabase.rpc('update_mahalle_boundary', {
      p_mahalle_id: mahalle.id,
      p_geometry:   JSON.stringify(geojson),
    })

    if (error) {
      console.log(`✗ DB: ${error.message}`)
      basarisiz++
      basarisizlar.push(`${ilceIsim}/${mahalle.isim}`)
    } else {
      console.log(`✓ ${ring.length} nokta`)
      basarili++
    }

    if ((idx + 1) % 30 === 0) {
      console.log(`\n  ── Ara rapor: ${idx + 1}/${mahalleler.length} | ✓ ${basarili} | ✗ ${basarisiz} ──\n`)
    }
  }

  console.log(`\n\n✅ Tamamlandı!`)
  console.log(`  Başarılı:   ${basarili}`)
  console.log(`  Başarısız:  ${basarisiz}`)

  if (basarisizlar.length) {
    console.log('\nBulunamayanlar:')
    basarisizlar.slice(0, 30).forEach(b => console.log(`  - ${b}`))
    if (basarisizlar.length > 30) console.log(`  ... +${basarisizlar.length - 30} daha`)
  }

  const { count: kalan } = await supabase
    .from('mahalleler')
    .select('*', { count: 'exact', head: true })
    .is('boundary', null)

  console.log(`\nHala boundary eksik: ${kalan} mahalle`)
}

main().catch(console.error)
