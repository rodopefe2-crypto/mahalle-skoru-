import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── PUAN TABLOSU ─────────────────────────────────
// Metro/raylı sistemin ağırlığı yüksek tutulur:
// merkeze yakın mahalleler daha fazla metro durağı
// döndürür → merkezi konum otomatik olarak yansır.
const PUAN_TABLOSU: Record<string, number> = {
  // Ulaşım — raylı > otobüs
  subway_station:   30,   // metro durağı (merkezi konum göstergesi)
  train_station:    20,   // tren/marmaray
  transit_station:  15,   // genel aktarma noktası
  bus_station:       4,   // otobüs terminali (her yerde var)

  // Sağlık
  hospital:         20,
  pharmacy:          4,
  doctor:            4,
  dentist:           2,

  // Eğitim
  university:       25,
  school:            6,

  // İmkanlar
  supermarket:       5,
  grocery_or_supermarket: 4,
  restaurant:        2,
  cafe:              2,

  // Yeşil Alan
  park:             10,

  // Kültür
  museum:           10,
  library:           6,
  movie_theater:     5,
}

// Kategori → mahalleler kolonu
const KAT_KOLON: Record<string, string> = {
  ulasim:   'ulasim_skoru',
  saglik:   'saglik_skoru',
  egitim:   'egitim_skoru',
  imkanlar: 'imkanlar_skoru',
  yesil:    'yesil_alan_skoru',
  kultur:   'kultur_skoru',
}

// Kategori → ilçeler kolonu (tavan için)
const KAT_ILCE: Record<string, string> = {
  ulasim:   'ulasim_skoru',
  saglik:   'saglik_skoru',
  egitim:   'egitim_skoru',
  imkanlar: 'imkanlar_skoru',
  yesil:    'yesil_alan_skoru',
  kultur:   'kultur_skoru',
}

// İlçe içi log normalizasyon
function logNorm(values: number[]): number[] {
  const positives = values.filter(v => v > 0)
  if (positives.length === 0) return values.map(() => 0)
  const max    = Math.max(...values)
  const min    = Math.min(...positives)
  const logMax = Math.log(max + 1)
  const logMin = Math.log(min + 1)
  return values.map(v => {
    if (v === 0) return 0
    if (logMax === logMin) return 50
    return Math.round(((Math.log(v + 1) - logMin) / (logMax - logMin)) * 100)
  })
}

async function main() {
  console.log('Mahalle skorları hesaplanıyor (Google Places)...')
  console.log('Normalizasyon: ilçe içi göreli × ilçe tavanı\n')

  // Veri çek
  const [{ data: ilceler }, { data: mahalleler }] = await Promise.all([
    supabase.from('ilceler').select(
      'id, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, ' +
      'yesil_alan_skoru, kultur_skoru, guvenlik_skoru, deprem_skoru, nufus_yogunlugu_skoru, kira_skoru'
    ),
    supabase.from('mahalleler').select('id, ilce_id, isim, deprem_skoru, kira_skoru'),
  ])

  if (!ilceler || !mahalleler) { console.error('Veri alınamadı'); return }

  const ilceMap = new Map(ilceler.map(i => [i.id, i]))

  // mahalle_tesisler batch yükle
  console.log('Tesis verisi yükleniyor...')
  const tesisler: any[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('mahalle_tesisler')
      .select('mahalle_id, kategori, alt_kategori')
      .range(offset, offset + 999)
    if (!data?.length) break
    tesisler.push(...data)
    process.stdout.write(`\r  ${tesisler.length} tesis yüklendi`)
    if (data.length < 1000) break
    offset += 1000
  }
  console.log(`\r  ${tesisler.length} tesis yüklendi\n`)

  // Her mahalle için kategori bazlı ham puan
  const mahPuanlari = new Map<string, Record<string, number>>()
  for (const m of mahalleler) {
    mahPuanlari.set(m.id, { ulasim: 0, saglik: 0, egitim: 0, imkanlar: 0, yesil: 0, kultur: 0 })
  }
  for (const t of tesisler) {
    const puanlar = mahPuanlari.get(t.mahalle_id)
    if (!puanlar || !(t.kategori in puanlar)) continue
    const puan = PUAN_TABLOSU[t.alt_kategori] ?? 0
    if (puan > 0) puanlar[t.kategori] += puan
  }

  // İlçe bazlı normalize et, ilçe skoru tavan
  const mahByIlce = new Map<string, string[]>()
  for (const m of mahalleler) {
    if (!mahByIlce.has(m.ilce_id)) mahByIlce.set(m.ilce_id, [])
    mahByIlce.get(m.ilce_id)!.push(m.id)
  }

  const mahSkorlar = new Map<string, Record<string, number>>()

  for (const [ilceId, ids] of mahByIlce.entries()) {
    const ilce = ilceMap.get(ilceId)

    for (const kat of Object.keys(KAT_KOLON)) {
      const vals     = ids.map(id => mahPuanlari.get(id)?.[kat] ?? 0)
      const relative = logNorm(vals)
      const tavan    = (ilce as any)?.[KAT_ILCE[kat]] ?? 50

      ids.forEach((id, i) => {
        if (!mahSkorlar.has(id)) mahSkorlar.set(id, {})
        mahSkorlar.get(id)![kat] = Math.round((relative[i] / 100) * tavan)
      })
    }
  }

  // DB yaz — ilçeyle birebir aynı ağırlıklar
  console.log('DB güncelleniyor...')
  let guncellenen = 0

  for (const mah of mahalleler) {
    const ilce     = ilceMap.get(mah.ilce_id)
    const skorlar  = mahSkorlar.get(mah.id) || {}
    const guvenlik = ilce?.guvenlik_skoru ?? 50
    const deprem   = mah.deprem_skoru ?? ilce?.deprem_skoru ?? 50
    const kira     = mah.kira_skoru   ?? ilce?.kira_skoru   ?? 50

    const ulasim   = skorlar['ulasim']   ?? 0
    const saglik   = skorlar['saglik']   ?? 0
    const egitim   = skorlar['egitim']   ?? 0
    const imkanlar = skorlar['imkanlar'] ?? 0
    const yesil    = skorlar['yesil']    ?? 0
    const kultur   = skorlar['kultur']   ?? 0

    // İlçeyle birebir aynı ağırlıklar
    const genel = Math.round(
      ulasim   * 0.17 +
      saglik   * 0.13 +
      egitim   * 0.13 +
      imkanlar * 0.10 +
      guvenlik * 0.16 +
      yesil    * 0.07 +
      kultur   * 0.06 +
      deprem   * 0.08 +
      kira     * 0.10
    )

    const { error } = await supabase
      .from('mahalleler')
      .update({
        ulasim_skoru:     ulasim,
        saglik_skoru:     saglik,
        egitim_skoru:     egitim,
        imkanlar_skoru:   imkanlar,
        guvenlik_skoru:   guvenlik,
        yesil_alan_skoru: yesil,
        kultur_skoru:     kultur,
        genel_skor:       genel,
      })
      .eq('id', mah.id)

    if (!error) {
      guncellenen++
      if (guncellenen % 100 === 0)
        process.stdout.write(`\r  ${guncellenen}/${mahalleler.length}`)
    }
  }

  console.log(`\r✅ ${guncellenen}/${mahalleler.length} mahalle güncellendi\n`)

  // TOP 20 çıktı
  const { data: top } = await supabase
    .from('mahalleler')
    .select('isim, genel_skor, ulasim_skoru, saglik_skoru, egitim_skoru, imkanlar_skoru, guvenlik_skoru, yesil_alan_skoru, kultur_skoru')
    .order('genel_skor', { ascending: false })
    .limit(20)

  console.log('── TOP 20 Mahalle ──────────────────────────────────────────────────────')
  console.log('     İSİM                 GENEL ULAŞ SAĞL EĞT İMKN GÜV YEŞ KÜL')
  console.log('  ' + '─'.repeat(72))
  top?.forEach((m, i) => {
    console.log(
      `  ${String(i+1).padStart(2)}. ${m.isim.padEnd(20)} ` +
      `${m.genel_skor??0}`.padStart(5) +
      `${m.ulasim_skoru??0}`.padStart(5) +
      `${m.saglik_skoru??0}`.padStart(5) +
      `${m.egitim_skoru??0}`.padStart(4) +
      `${m.imkanlar_skoru??0}`.padStart(5) +
      `${m.guvenlik_skoru??0}`.padStart(5) +
      `${m.yesil_alan_skoru??0}`.padStart(4) +
      `${m.kultur_skoru??0}`.padStart(4)
    )
  })

  // İlçe bazlı özet - hangi ilçe kaç mahalle ile temsil ediliyor
  const ilceSayac: Record<string, number> = {}
  top?.forEach(m => {
    // ilçeyi mahalle adından çıkaramayız, özet yapalım
  })

  console.log('\n✅ Tamamlandı!')
}

main().catch(console.error)
