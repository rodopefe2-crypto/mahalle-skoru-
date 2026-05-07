import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: ilceler } = await supabase
    .from('ilceler')
    .select('id, isim, slug')
    .order('isim')

  const { data: mahalleler } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id')

  // Bizim sayılarımız
  const bizimSayi = new Map<string, number>()
  for (const il of ilceler || []) bizimSayi.set(il.isim.toUpperCase(), 0)
  for (const m of mahalleler || []) {
    const ilce = ilceler?.find(i => i.id === m.ilce_id)
    if (ilce) {
      const key = ilce.isim.toUpperCase()
      bizimSayi.set(key, (bizimSayi.get(key) || 0) + 1)
    }
  }

  // NVI verisi
  const data = JSON.parse(fs.readFileSync('/tmp/mahalleler.json', 'utf8'))
  const istanbul = data['İSTANBUL']

  // Karşılaştırma tablosu
  console.log('\n── Karşılaştırma: Bizim vs NVI ──────────────────────────────────────')
  console.log('  İlçe                   Bizim   NVI   Fark')
  console.log('  ' + '─'.repeat(50))

  let toplamBizim = 0, toplamNvi = 0
  const farklilar: { ilce: string; bizim: number; nvi: number; fark: number }[] = []

  const nviIlceler = Object.keys(istanbul).sort()
  for (const nviIsim of nviIlceler) {
    const nviSayi = istanbul[nviIsim].length

    // Bizim DB'deki eşleşmeyi bul
    let bizimIsim = nviIsim
    if (nviIsim === 'BAKIRKÖY') bizimIsim = 'BAKIRKÖY'
    if (nviIsim === 'EYÜPSULTAN') bizimIsim = 'EYÜPSULTAN'
    const bizim = bizimSayi.get(bizimIsim) || 0

    toplamBizim += bizim
    toplamNvi   += nviSayi
    const fark = bizim - nviSayi

    const satir = `  ${nviIsim.padEnd(22)} ${String(bizim).padStart(5)}   ${String(nviSayi).padStart(3)}   ${fark >= 0 ? '+' : ''}${fark}`
    if (fark !== 0) {
      farklilar.push({ ilce: nviIsim, bizim, nvi: nviSayi, fark })
      console.log(satir + '  ⚠️')
    } else {
      console.log(satir)
    }
  }

  console.log('  ' + '─'.repeat(50))
  console.log(`  ${'TOPLAM'.padEnd(22)} ${String(toplamBizim).padStart(5)}   ${String(toplamNvi).padStart(3)}   ${toplamBizim - toplamNvi >= 0 ? '+' : ''}${toplamBizim - toplamNvi}`)

  console.log('\n── Farklı İlçeler (özet) ─────────────────────────────────────────────')
  farklilar.sort((a, b) => Math.abs(b.fark) - Math.abs(a.fark)).forEach(f => {
    console.log(`  ${f.ilce.padEnd(22)} Bizim:${f.bizim}  NVI:${f.nvi}  Fark:${f.fark >= 0 ? '+' : ''}${f.fark}`)
  })

  // Ümraniye ve Kağıthane detay
  const umrBizim = mahalleler?.filter(m => {
    const il = ilceler?.find(i => i.id === m.ilce_id)
    return il?.slug === 'umraniye'
  }).map(m => m.isim.toUpperCase())

  const umrNvi = istanbul['ÜMRANİYE'].map((s: string) => s.replace(' Mah.', '').trim())

  console.log('\n── Ümraniye: Bizimde olmayan NVI mahalleleri ─────────────────────────')
  umrNvi.filter((n: string) => !umrBizim?.some(b => b.includes(n) || n.includes(b)))
    .forEach((m: string) => console.log('  EKSIK:', m))

  console.log('\n── Ümraniye: NVI\'de olmayan bizim mahallelerimiz ─────────────────────')
  umrBizim?.filter(b => !umrNvi.some((n: string) => b.includes(n) || n.includes(b)))
    .forEach(m => console.log('  FAZLA:', m))

  const finans = istanbul['ÜMRANİYE'].find((m: string) => m.includes('FİNANS'))
  console.log('\nÜmraniye FİNANSKENT:', finans ? `✅ VAR (${finans})` : '❌ YOK')

  const habipler = istanbul['KAĞITHANE']?.find((m: string) => m.includes('HABİP') || m.includes('HABİPLER'))
  console.log('Kağıthane HABİPLER:', habipler ? `✅ VAR (${habipler})` : '❌ YOK — NVI listesinde yok')
}

main().catch(console.error)
