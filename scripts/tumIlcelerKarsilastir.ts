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

  const { data: tumMahalleler } = await supabase
    .from('mahalleler').select('isim, ilce_id')

  const bizimByIlce = new Map<string, string[]>()
  for (const il of ilceler || []) bizimByIlce.set(il.id, [])
  for (const m of tumMahalleler || []) {
    bizimByIlce.get(m.ilce_id)?.push(m.isim)
  }

  const nviData = JSON.parse(fs.readFileSync('/tmp/mahalleler.json', 'utf8'))
  const istanbul = nviData['İSTANBUL'] as Record<string, string[]>

  const nviByIlce = new Map<string, string[]>()
  for (const [nviIsim, nviMahalleler] of Object.entries(istanbul)) {
    const ilce = ilceler?.find(i => norm(i.isim) === norm(nviIsim))
    if (ilce) {
      nviByIlce.set(ilce.id, nviMahalleler.map(m => m.replace(/ Mah\.?$/i, '').trim()))
    }
  }

  let toplamEksik = 0, toplamFazla = 0, toplamFarkli = 0

  for (const ilce of ilceler || []) {
    const bizimListe = (bizimByIlce.get(ilce.id) || []).sort()
    const nviListe   = (nviByIlce.get(ilce.id)   || []).sort()
    if (!nviListe.length) continue

    const bizimNorm = new Map(bizimListe.map(b => [norm(b), b]))
    const nviNorm   = new Map(nviListe.map(n => [norm(n), n]))

    const tumKeyler = new Set([
      ...bizimNorm.keys(),
      ...nviNorm.keys(),
    ])

    const eksikler:  string[] = []
    const fazlalar:  string[] = []
    const farklilar: { bizim: string; nvi: string }[] = []

    for (const key of tumKeyler) {
      const b = bizimNorm.get(key)
      const n = nviNorm.get(key)
      if (b && n && b !== n) farklilar.push({ bizim: b, nvi: n })
      else if (!b && n)      eksikler.push(n)
      else if (b && !n)      fazlalar.push(b)
    }

    if (!eksikler.length && !fazlalar.length && !farklilar.length) continue

    toplamEksik  += eksikler.length
    toplamFazla  += fazlalar.length
    toplamFarkli += farklilar.length

    console.log(`\n┌── ${ilce.isim.toUpperCase()} (DB:${bizimListe.length} / NVI:${nviListe.length}) ${'─'.repeat(Math.max(0, 45 - ilce.isim.length))}`)

    if (eksikler.length) {
      console.log(`│  ❌ BİZDE YOK (${eksikler.length}):`)
      eksikler.sort().forEach(m => console.log(`│     • ${m}`))
    }
    if (fazlalar.length) {
      console.log(`│  ➕ BİZDE FAZLA (${fazlalar.length}):`)
      fazlalar.sort().forEach(m => console.log(`│     • ${m}`))
    }
    if (farklilar.length) {
      console.log(`│  ✏️  İSİM FARKI (${farklilar.length}):`)
      farklilar.forEach(p => console.log(`│     "${p.bizim}"  →  NVI: "${p.nvi}"`))
    }
  }

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ❌ Toplam eksik   : ${toplamEksik} mahalle`)
  console.log(`  ➕ Toplam fazla   : ${toplamFazla} mahalle`)
  console.log(`  ✏️  İsim farkı     : ${toplamFarkli} mahalle`)
  console.log(`${'═'.repeat(60)}`)
}

main().catch(console.error)
