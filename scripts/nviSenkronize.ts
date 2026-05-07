import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toSlug(ilceSlug: string, mahalle: string): string {
  const m = mahalle
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/i̇/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${ilceSlug}-${m}`
}

// ── 1. YENİDEN ADLANDIRMALAR ────────────────────────────────
// Bizde var ama NVI'da farklı isimle var olan mahalleler
const RENAMES: { ilce: string; bizim: string; nvi: string }[] = [
  { ilce: 'arnavutkoy',   bizim: 'NENEHATUN',              nvi: 'NENE HATUN' },
  { ilce: 'atasehir',     bizim: 'AŞIKVEYSEL',             nvi: 'AŞIK VEYSEL' },
  { ilce: 'avcilar',      bizim: 'MUSTAFA KEMALPAŞA',      nvi: 'MUSTAFA KEMAL PAŞA' },
  { ilce: 'bagcilar',     bizim: 'EVREN',                  nvi: '15 TEMMUZ' },
  { ilce: 'bakirkoy',     bizim: 'ATAKÖY 2-5-6. KISIM',   nvi: 'ATAKÖY 2. 5. 6. KISIM' },
  { ilce: 'basaksehir',   bizim: 'ŞAHİNTEPE',             nvi: 'ŞAHİNTEPESİ' },
  { ilce: 'bayrampasa',   bizim: 'ORTAMAHALLE',            nvi: 'ORTA' },
  { ilce: 'bayrampasa',   bizim: 'İSMET PAŞA',            nvi: 'İSMETPAŞA' },
  { ilce: 'beykoz',       bizim: 'ANADOLU FENERİ',        nvi: 'ANADOLUFENERİ' },
  { ilce: 'beykoz',       bizim: 'MERKEZ',                 nvi: 'BEYKOZ MERKEZ' },
  { ilce: 'beyoglu',      bizim: 'KADI MEHMET EFENDİ',    nvi: 'KADIMEHMET EFENDİ' },
  { ilce: 'beyoglu',      bizim: 'KALYONCU KULLUĞU',      nvi: 'KALYONCUKULLUK' },
  { ilce: 'beyoglu',      bizim: 'KAMER HATUN',           nvi: 'KAMERHATUN' },
  { ilce: 'beyoglu',      bizim: 'KEÇECİ PİRİ',          nvi: 'KEÇEÇİPİRİ' },
  { ilce: 'beyoglu',      bizim: 'PİRİPAŞA',              nvi: 'PİRİ MEHMET PAŞA' },
  { ilce: 'beyoglu',      bizim: 'SURURİ MEHMET EFENDİ', nvi: 'SURURİ' },
  { ilce: 'buyukcekmece', bizim: '19.May',                 nvi: '19 MAYIS' },
  { ilce: 'buyukcekmece', bizim: 'MİMAR SİNAN MERKEZ',   nvi: 'MİMARSİNAN' },
  { ilce: 'esenler',      bizim: 'HAVAALANI',              nvi: 'ATIŞALANI' },
  { ilce: 'esenyurt',     bizim: 'BAĞLARÇEŞME',           nvi: 'MERKEZ' },
  { ilce: 'kadikoy',      bizim: '19.May',                 nvi: '19 MAYIS' },
  { ilce: 'sariyer',      bizim: 'RUMELİ HİSARI',        nvi: 'RUMELİHİSARI' },
  { ilce: 'sariyer',      bizim: 'RUMELİ KAVAĞI',        nvi: 'RUMELİKAVAĞI' },
  { ilce: 'sariyer',      bizim: 'SARIYER MERKEZ',        nvi: 'SARIYER' },
  { ilce: 'silivri',      bizim: 'BALABAN',                nvi: 'ÇANTA BALABAN' },
  { ilce: 'silivri',      bizim: 'FEVZİPAŞA',             nvi: 'DEĞİTMENKÖY FEVZİPAŞA' },
  { ilce: 'silivri',      bizim: 'HÜRRİYET',              nvi: 'KAVAKLI İSTİKLAL' },
  { ilce: 'silivri',      bizim: 'SANCAKTEPE',             nvi: 'ÇANTA SANCAKTEPE' },
  { ilce: 'silivri',      bizim: 'İSMETPAŞA',             nvi: 'DEĞİRMENKÖY İSMETPAŞA' },
  { ilce: 'sisli',        bizim: '19.May',                 nvi: '19 MAYIS' },
  { ilce: 'sisli',        bizim: 'MERKEZ',                 nvi: 'ŞİŞLİ MERKEZ' },
  { ilce: 'sultanbeyli',  bizim: 'AKŞEMSETTİN',           nvi: 'AKŞEMSEDDİN' },
  { ilce: 'sultanbeyli',  bizim: 'ORHANGAZİ',             nvi: 'ORHAN GAZİ' },
  { ilce: 'sultangazi',   bizim: 'İSMETPAŞA',             nvi: 'İSMET PAŞA' },
  { ilce: 'umraniye',     bizim: 'SARAY',                  nvi: 'FİNANSKENT' },
  { ilce: 'uskudar',      bizim: 'KÜÇÜKÇAMLICA',          nvi: 'KÜÇÜK ÇAMLICA' },
]

// ── 2. İSİM/ENCODING DÜZELTMELERİ ─────────────────────────
const ISIM_DUZELT: { ilce: string; bizim: string; nvi: string }[] = [
  { ilce: 'atasehir',     bizim: 'FETIH',          nvi: 'FETİH' },
  { ilce: 'beyoglu',      bizim: 'FİRUZAĞA',       nvi: 'FİRÜZAĞA' },
  { ilce: 'buyukcekmece', bizim: 'MURAT ÇEŞME',    nvi: 'MURAT ÇESME' },
  { ilce: 'kartal',       bizim: 'YAKACIK ÇARSI',  nvi: 'YAKACIK ÇARŞI' },
  // Kağıthane büyük/küçük harf
  { ilce: 'kagithane', bizim: 'Gültepe',           nvi: 'GÜLTEPE' },
  { ilce: 'kagithane', bizim: 'Hamidiye',           nvi: 'HAMİDİYE' },
  { ilce: 'kagithane', bizim: 'Harmantepe',         nvi: 'HARMANTEPE' },
  { ilce: 'kagithane', bizim: 'Hürriyet',           nvi: 'HÜRRİYET' },
  { ilce: 'kagithane', bizim: 'Merkez',             nvi: 'MERKEZ' },
  { ilce: 'kagithane', bizim: 'Nurtepe',            nvi: 'NURTEPE' },
  { ilce: 'kagithane', bizim: 'Ortabayır',          nvi: 'ORTABAYIR' },
  { ilce: 'kagithane', bizim: 'Seyrantepe',         nvi: 'SEYRANTEPE' },
  { ilce: 'kagithane', bizim: 'Talatpaşa',          nvi: 'TALATPAŞA' },
  { ilce: 'kagithane', bizim: 'Çağlayan',           nvi: 'ÇAĞLAYAN' },
  { ilce: 'kagithane', bizim: 'Çeliktepe',          nvi: 'ÇELİKTEPE' },
]

// ── 3. EKLENECEKLER ─────────────────────────────────────────
const EKLE: { ilce: string; isim: string }[] = [
  // Esenler (1 tane — diğeri HAVAALANI→ATIŞALANI rename ile çözüldü)
  { ilce: 'esenler', isim: '15 TEMMUZ' },
  // Eyüpsultan (tamamen yok)
  { ilce: 'eyupsultan', isim: '5. LEVENT' },
  { ilce: 'eyupsultan', isim: 'AKPINAR' },
  { ilce: 'eyupsultan', isim: 'AKŞEMSETTİN' },
  { ilce: 'eyupsultan', isim: 'ALİBEYKÖY' },
  { ilce: 'eyupsultan', isim: 'AĞAÇLI' },
  { ilce: 'eyupsultan', isim: 'DEFTERDAR' },
  { ilce: 'eyupsultan', isim: 'DÜĞMECİLER' },
  { ilce: 'eyupsultan', isim: 'EMNİYETTEPE' },
  { ilce: 'eyupsultan', isim: 'ESENTEPE' },
  { ilce: 'eyupsultan', isim: 'EYÜP MERKEZ' },
  { ilce: 'eyupsultan', isim: 'GÖKTÜRK MERKEZ' },
  { ilce: 'eyupsultan', isim: 'GÜZELTEPE' },
  { ilce: 'eyupsultan', isim: 'IŞIKLAR' },
  { ilce: 'eyupsultan', isim: 'KARADOLAP' },
  { ilce: 'eyupsultan', isim: 'MİMAR SİNAN' },
  { ilce: 'eyupsultan', isim: 'MİTHATPAŞA' },
  { ilce: 'eyupsultan', isim: 'NİŞANCA' },
  { ilce: 'eyupsultan', isim: 'ODAYERİ' },
  { ilce: 'eyupsultan', isim: 'PİRİNÇÇİ' },
  { ilce: 'eyupsultan', isim: 'RAMİ CUMA' },
  { ilce: 'eyupsultan', isim: 'RAMİ YENİ' },
  { ilce: 'eyupsultan', isim: 'SAKARYA' },
  { ilce: 'eyupsultan', isim: 'SİLAHTARAĞA' },
  { ilce: 'eyupsultan', isim: 'TOPÇULAR' },
  { ilce: 'eyupsultan', isim: 'YEŞİLPINAR' },
  { ilce: 'eyupsultan', isim: 'ÇIRÇIR' },
  { ilce: 'eyupsultan', isim: 'ÇİFTALAN' },
  { ilce: 'eyupsultan', isim: 'İHSANİYE' },
  { ilce: 'eyupsultan', isim: 'İSLAMBEY' },
]

// ── 4. SİLİNECEKLER ─────────────────────────────────────────
// NVI'da hiç olmayan, gerçek fazla mahalleler
const SIL: { ilce: string; isim: string }[] = [
  { ilce: 'kagithane', isim: 'Kuştepe' },
  { ilce: 'kagithane', isim: 'Habipler' },
  { ilce: 'kagithane', isim: 'Yahyakemal' },
  { ilce: 'kagithane', isim: 'Güneştepe' },
]

async function main() {
  const { data: ilceler } = await supabase
    .from('ilceler').select('id, isim, slug')
  const ilceBySlug = new Map(ilceler?.map(i => [i.slug, i]) ?? [])

  const { data: mahalleler } = await supabase
    .from('mahalleler').select('id, isim, ilce_id, slug')
  const mahByIlceIsim = new Map<string, typeof mahalleler[0]>()
  for (const m of mahalleler || []) {
    mahByIlceIsim.set(`${m.ilce_id}::${m.isim}`, m)
  }

  let ok = 0, hata = 0

  // ── Adım 1: Rename ────────────────────────────────
  console.log(`\n── Adım 1: Yeniden adlandırmalar (${RENAMES.length}) ─────────────`)
  for (const r of RENAMES) {
    const ilce = ilceBySlug.get(r.ilce)
    if (!ilce) { console.log(`  ✗ İlçe bulunamadı: ${r.ilce}`); hata++; continue }
    const mah = mahByIlceIsim.get(`${ilce.id}::${r.bizim}`)
    if (!mah) { console.log(`  ✗ Mahalle bulunamadı: ${r.ilce} / ${r.bizim}`); hata++; continue }
    const yeniSlug = toSlug(r.ilce, r.nvi)
    const { error } = await supabase
      .from('mahalleler')
      .update({ isim: r.nvi, slug: yeniSlug })
      .eq('id', mah.id)
    if (error) { console.log(`  ✗ ${r.ilce}/${r.bizim}: ${error.message}`); hata++ }
    else { console.log(`  ✓ ${r.ilce.padEnd(14)} "${r.bizim}" → "${r.nvi}"`); ok++ }
  }

  // ── Adım 2: İsim düzeltmeleri ─────────────────────
  console.log(`\n── Adım 2: İsim/encoding düzeltmeleri (${ISIM_DUZELT.length}) ──────`)
  for (const r of ISIM_DUZELT) {
    const ilce = ilceBySlug.get(r.ilce)
    if (!ilce) { console.log(`  ✗ İlçe bulunamadı: ${r.ilce}`); hata++; continue }
    const mah = mahByIlceIsim.get(`${ilce.id}::${r.bizim}`)
    if (!mah) { console.log(`  ✗ Mahalle bulunamadı: ${r.ilce} / ${r.bizim}`); hata++; continue }
    const yeniSlug = toSlug(r.ilce, r.nvi)
    const { error } = await supabase
      .from('mahalleler')
      .update({ isim: r.nvi, slug: yeniSlug })
      .eq('id', mah.id)
    if (error) { console.log(`  ✗ ${r.ilce}/${r.bizim}: ${error.message}`); hata++ }
    else { console.log(`  ✓ ${r.ilce.padEnd(14)} "${r.bizim}" → "${r.nvi}"`); ok++ }
  }

  // ── Adım 3: Yeni mahalle ekle ─────────────────────
  console.log(`\n── Adım 3: Yeni mahalleler ekleniyor (${EKLE.length}) ────────────`)
  for (const e of EKLE) {
    const ilce = ilceBySlug.get(e.ilce)
    if (!ilce) { console.log(`  ✗ İlçe bulunamadı: ${e.ilce}`); hata++; continue }
    const slug = toSlug(e.ilce, e.isim)
    const { error } = await supabase
      .from('mahalleler')
      .insert({
        isim: e.isim,
        slug,
        ilce_id: ilce.id,
        ulasim_skoru:     0,
        saglik_skoru:     0,
        egitim_skoru:     0,
        imkanlar_skoru:   0,
        yesil_alan_skoru: 0,
        kultur_skoru:     0,
        guvenlik_skoru:   0,
        genel_skor:       0,
      })
    if (error) { console.log(`  ✗ ${e.ilce}/${e.isim}: ${error.message}`); hata++ }
    else { console.log(`  ✓ ${e.ilce.padEnd(14)} "${e.isim}" eklendi`); ok++ }
  }

  // ── Adım 4: Fazla mahalleleri sil ─────────────────
  console.log(`\n── Adım 4: Fazla mahalleler siliniyor (${SIL.length}) ────────────`)
  for (const s of SIL) {
    const ilce = ilceBySlug.get(s.ilce)
    if (!ilce) { console.log(`  ✗ İlçe bulunamadı: ${s.ilce}`); hata++; continue }
    const mah = mahByIlceIsim.get(`${ilce.id}::${s.isim}`)
    if (!mah) { console.log(`  ✗ Mahalle bulunamadı: ${s.ilce} / ${s.isim}`); hata++; continue }
    // Önce bağlı tesisleri sil
    await supabase.from('mahalle_tesisler').delete().eq('mahalle_id', mah.id)
    const { error } = await supabase.from('mahalleler').delete().eq('id', mah.id)
    if (error) { console.log(`  ✗ ${s.ilce}/${s.isim}: ${error.message}`); hata++ }
    else { console.log(`  ✓ ${s.ilce.padEnd(14)} "${s.isim}" silindi`); ok++ }
  }

  console.log(`\n${'═'.repeat(50)}`)
  console.log(`  ✓ Başarılı : ${ok}`)
  console.log(`  ✗ Hatalı   : ${hata}`)
  console.log(`${'═'.repeat(50)}`)
  console.log('\nŞimdi karşılaştırma scriptini tekrar çalıştırarak kontrol edin.')
}

main().catch(console.error)
