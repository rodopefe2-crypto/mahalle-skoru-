import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function norm(s: string): string {
  return s
    .toUpperCase()
    .replace(/ MAH\.?$/i, '').trim()
    .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
    .replace(/[^A-Z0-9 ]/g, '').trim()
}

async function main() {
  const { data: ilceler } = await supabase
    .from('ilceler').select('id, isim, slug').order('isim')

  const { data: mahalleler } = await supabase
    .from('mahalleler').select('id, isim, ilce_id')

  // ilçe → mahalle listesi
  const bizimByIlce = new Map<string, string[]>()
  for (const il of ilceler || []) bizimByIlce.set(il.id, [])
  for (const m of mahalleler || []) {
    bizimByIlce.get(m.ilce_id)?.push(m.isim)
  }

  const nviData = JSON.parse(fs.readFileSync('/tmp/mahalleler.json', 'utf8'))
  const istanbul = nviData['İSTANBUL'] as Record<string, string[]>

  // NVI ilçe slug eşleştirme
  const nviBySlug = new Map<string, string[]>()
  for (const [nviIsim, nviMahalleler] of Object.entries(istanbul)) {
    const nviNorm = norm(nviIsim)
    const ilce = ilceler?.find(i => norm(i.isim) === nviNorm)
    if (ilce) nviBySlug.set(ilce.id, nviMahalleler.map(m => m.replace(/ Mah\.?$/i, '').trim()))
  }

  let toplamSadeceBizim = 0, toplamSadeceNvi = 0

  for (const ilce of ilceler || []) {
    const bizim = bizimByIlce.get(ilce.id) || []
    const nvi   = nviBySlug.get(ilce.id)   || []

    if (!nvi.length) continue

    // Eşleşme: normalize edilmiş isimle karşılaştır
    const sadeceBizim = bizim.filter(b => !nvi.some(n => norm(n) === norm(b)))
    const sadeceNvi   = nvi.filter(n => !bizim.some(b => norm(b) === norm(n)))

    if (!sadeceBizim.length && !sadeceNvi.length) continue

    toplamSadeceBizim += sadeceBizim.length
    toplamSadeceNvi   += sadeceNvi.length

    console.log(`\n┌── ${ilce.isim.toUpperCase()} ${'─'.repeat(Math.max(0, 55 - ilce.isim.length))}`)
    console.log(`│  DB toplam: ${bizim.length}   NVI toplam: ${nvi.length}`)

    const maxSatir = Math.max(sadeceBizim.length, sadeceNvi.length)
    console.log(`│  ${'BİZDE VAR, NVI\'DE YOK'.padEnd(30)}  ${'NVI\'DE VAR, BİZDE YOK'.padEnd(30)}`)
    console.log(`│  ${'─'.repeat(30)}  ${'─'.repeat(30)}`)
    for (let i = 0; i < maxSatir; i++) {
      const sol = (sadeceBizim[i] || '').padEnd(30)
      const sag = (sadeceNvi[i]   || '').padEnd(30)
      console.log(`│  ${sol}  ${sag}`)
    }
  }

  console.log(`\n${'═'.repeat(65)}`)
  console.log(`  Sadece bizde olan (fazla): ${toplamSadeceBizim} mahalle`)
  console.log(`  Sadece NVI'de olan (eksik): ${toplamSadeceNvi} mahalle`)
}

main().catch(console.error)
