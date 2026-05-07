import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalize(s: string): string {
  return s
    .toUpperCase()
    .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
    .replace(/[^A-Z]/g, '')
}

async function main() {
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug')
    .order('isim')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, ilce_id')

  const bizimSayi = new Map<string, number>()
  for (const il of ilceler || []) bizimSayi.set(il.id, 0)
  for (const m of mahalleler || []) {
    bizimSayi.set(m.ilce_id, (bizimSayi.get(m.ilce_id) || 0) + 1)
  }

  const nviData = JSON.parse(fs.readFileSync('/tmp/mahalleler.json', 'utf8'))
  const istanbul = nviData['İSTANBUL'] as Record<string, string[]>

  // NVI ilçe isimlerini normalize ederek eşleştir
  const nviMap = new Map<string, number>()
  for (const [nviIsim, nviMahalleler] of Object.entries(istanbul)) {
    nviMap.set(normalize(nviIsim), nviMahalleler.length)
  }

  console.log('\n┌─────────────────────────┬──────────┬──────────┬────────┐')
  console.log('│ İlçe                    │  NVI     │  Bizim   │  Fark  │')
  console.log('├─────────────────────────┼──────────┼──────────┼────────┤')

  let toplamNvi = 0, toplamBizim = 0
  const satirlar: { isim: string; nvi: number; bizim: number; fark: number }[] = []

  for (const ilce of ilceler || []) {
    const bizim = bizimSayi.get(ilce.id) || 0
    const nvi   = nviMap.get(normalize(ilce.isim)) || 0
    const fark  = bizim - nvi
    toplamBizim += bizim
    toplamNvi   += nvi
    satirlar.push({ isim: ilce.isim, nvi, bizim, fark })
  }

  satirlar.sort((a, b) => a.isim.localeCompare(b.isim, 'tr'))

  for (const s of satirlar) {
    const farkStr = s.fark === 0 ? '  —  ' : (s.fark > 0 ? `+${s.fark}` : `${s.fark}`)
    const flag    = s.fark === 0 ? ' ' : (s.fark < 0 ? '⬇' : '⬆')
    console.log(
      `│ ${s.isim.padEnd(23)} │ ${String(s.nvi).padStart(6)}   │ ${String(s.bizim).padStart(6)}   │ ${farkStr.padStart(4)}  ${flag} │`
    )
  }

  console.log('├─────────────────────────┼──────────┼──────────┼────────┤')
  const topFark = toplamBizim - toplamNvi
  console.log(`│ ${'TOPLAM'.padEnd(23)} │ ${String(toplamNvi).padStart(6)}   │ ${String(toplamBizim).padStart(6)}   │ ${String(topFark).padStart(4)}    │`)
  console.log('└─────────────────────────┴──────────┴──────────┴────────┘')

  const eksikler = satirlar.filter(s => s.fark < 0).sort((a, b) => a.fark - b.fark)
  const fazlalar = satirlar.filter(s => s.fark > 0).sort((a, b) => b.fark - a.fark)

  if (eksikler.length) {
    console.log('\n⬇  Eksik olan ilçeler:')
    eksikler.forEach(s => console.log(`   ${s.isim.padEnd(18)} ${s.bizim} / ${s.nvi} (${s.fark})`))
  }
  if (fazlalar.length) {
    console.log('\n⬆  Fazla olan ilçeler:')
    fazlalar.forEach(s => console.log(`   ${s.isim.padEnd(18)} ${s.bizim} / ${s.nvi} (+${s.fark})`))
  }
}

main().catch(console.error)
