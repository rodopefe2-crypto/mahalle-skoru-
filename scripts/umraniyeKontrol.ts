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
  const { data: ilce } = await supabase
    .from('ilceler').select('id, isim').eq('slug', 'umraniye').single()

  const { data: bizimMahalleler } = await supabase
    .from('mahalleler').select('isim').eq('ilce_id', ilce!.id).order('isim')

  const nviData = JSON.parse(fs.readFileSync('/tmp/mahalleler.json', 'utf8'))
  const nviListe: string[] = nviData['İSTANBUL']['ÜMRANİYE']
    .map((m: string) => m.replace(/ Mah\.?$/i, '').trim())
    .sort()

  const bizimListe = bizimMahalleler!.map(m => m.isim).sort()

  console.log(`\nDB: ${bizimListe.length} mahalle   |   NVI: ${nviListe.length} mahalle\n`)

  // Her iki liste tüm elemanları, eşleşip eşleşmediğiyle
  const tumIsimler = new Set([
    ...bizimListe.map(n => norm(n)),
    ...nviListe.map(n => norm(n))
  ])

  const bizimNorm = new Map(bizimListe.map(b => [norm(b), b]))
  const nviNorm   = new Map(nviListe.map(n => [norm(n), n]))

  console.log('  DB\'de var  │ DURUM │ NVI\'de var')
  console.log('  ' + '─'.repeat(70))

  for (const key of [...tumIsimler].sort()) {
    const b = bizimNorm.get(key)
    const n = nviNorm.get(key)
    if (b && n) {
      const durum = b === n ? '  ✅  ' : '  ✏️  '
      console.log(`  ${b.padEnd(28)} ${durum} ${n}`)
    } else if (b && !n) {
      console.log(`  ${b.padEnd(28)}  ➕    (NVI\'de yok)`)
    } else if (!b && n) {
      console.log(`  ${'(bizde yok)'.padEnd(28)}  ❌    ${n}`)
    }
  }

  console.log('\n  ❌ = Bizde eksik   ➕ = Bizde fazla   ✏️  = İsim farkı')
}

main().catch(console.error)
