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

// Sadece boşluk/birleşik yazım farkı mı?
function sadeceBoslukFarki(a: string, b: string): boolean {
  return norm(a).replace(/ /g, '') === norm(b).replace(/ /g, '')
}

async function main() {
  const { data: ilceler } = await supabase
    .from('ilceler').select('id, isim, slug').order('isim')

  const { data: mahalleler } = await supabase
    .from('mahalleler').select('id, isim, ilce_id')

  const bizimByIlce = new Map<string, string[]>()
  for (const il of ilceler || []) bizimByIlce.set(il.id, [])
  for (const m of mahalleler || []) {
    bizimByIlce.get(m.ilce_id)?.push(m.isim)
  }

  const nviData = JSON.parse(fs.readFileSync('/tmp/mahalleler.json', 'utf8'))
  const istanbul = nviData['İSTANBUL'] as Record<string, string[]>

  const nviByIlce = new Map<string, string[]>()
  for (const [nviIsim, nviMahalleler] of Object.entries(istanbul)) {
    const ilce = ilceler?.find(i => norm(i.isim) === norm(nviIsim))
    if (ilce) nviByIlce.set(ilce.id, nviMahalleler.map(m => m.replace(/ Mah\.?$/i, '').trim()))
  }

  let toplamEksik = 0, toplamFazla = 0, toplamBosluk = 0

  const sonuc: {
    ilce: string
    eksik: string[]   // NVI'de var bizde yok
    fazla: string[]   // Bizde var NVI'de yok
    bosluk: { bizim: string; nvi: string }[]  // Sadece yazım farkı
  }[] = []

  for (const ilce of ilceler || []) {
    const bizim = bizimByIlce.get(ilce.id) || []
    const nvi   = nviByIlce.get(ilce.id)   || []
    if (!nvi.length) continue

    const bizimNorm = bizim.map(b => norm(b))
    const nviNorm   = nvi.map(n => norm(n))

    // Tam eşleşenler
    const eslesmis = new Set<string>()
    const bizimEslesmis = new Set<string>()

    // Önce tam normalize eşleşme
    for (const n of nvi) {
      const idx = bizim.findIndex(b => norm(b) === norm(n))
      if (idx !== -1) {
        eslesmis.add(norm(n))
        bizimEslesmis.add(norm(bizim[idx]))
      }
    }

    // Sadece boşluk farkı olanlar (eşleşmemiş kalanlar arasında)
    const boslukFarklari: { bizim: string; nvi: string }[] = []
    const nviKalan  = nvi.filter(n => !eslesmis.has(norm(n)))
    const bizimKalan = bizim.filter(b => !bizimEslesmis.has(norm(b)))

    for (const n of [...nviKalan]) {
      const idx = bizimKalan.findIndex(b => sadeceBoslukFarki(b, n))
      if (idx !== -1) {
        boslukFarklari.push({ bizim: bizimKalan[idx], nvi: n })
        eslesmis.add(norm(n))
        bizimEslesmis.add(norm(bizimKalan[idx]))
      }
    }

    const eksik = nvi.filter(n => !eslesmis.has(norm(n)))
    const fazla = bizim.filter(b => !bizimEslesmis.has(norm(b)))

    if (!eksik.length && !fazla.length && !boslukFarklari.length) continue

    toplamEksik  += eksik.length
    toplamFazla  += fazla.length
    toplamBosluk += boslukFarklari.length
    sonuc.push({ ilce: ilce.isim, eksik, fazla, bosluk: boslukFarklari })
  }

  // ── Çıktı ─────────────────────────────────────────
  for (const s of sonuc) {
    const baslikLen = 60
    console.log(`\n┌── ${s.ilce.toUpperCase()} ${'─'.repeat(Math.max(0, baslikLen - s.ilce.length - 4))}`)

    if (s.eksik.length) {
      console.log(`│  ❌ BİZDE YOK (${s.eksik.length}):`)
      s.eksik.forEach(m => console.log(`│     • ${m}`))
    }
    if (s.fazla.length) {
      console.log(`│  ➕ BİZDE FAZLA (${s.fazla.length}):`)
      s.fazla.forEach(m => console.log(`│     • ${m}`))
    }
    if (s.bosluk.length) {
      console.log(`│  ✏️  YAZIM FARKI (${s.bosluk.length}):`)
      s.bosluk.forEach(p => console.log(`│     Bizim: "${p.bizim}"  →  NVI: "${p.nvi}"`))
    }
  }

  console.log(`\n${'═'.repeat(62)}`)
  console.log(`  ❌ Toplam eksik  : ${toplamEksik} mahalle`)
  console.log(`  ➕ Toplam fazla  : ${toplamFazla} mahalle`)
  console.log(`  ✏️  Yazım farkı   : ${toplamBosluk} mahalle`)
}

main().catch(console.error)
