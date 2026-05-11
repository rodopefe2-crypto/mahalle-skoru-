'use client'

import { useEffect, useState, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { UnifiedParametreKarti } from './UnifiedParametreKarti'
import { UnifiedParametre, skorInsight } from '@/lib/unifiedParametre'

interface Props {
  slug:        string
  tip:         'ilce' | 'mahalle'
  skorlar:     Record<string, number>
  depremVeri?: {
    yorum:       string | null
    fayMesafe:   number | null
    sonYil:      number | null
    maxMag:      number | null
    guncellendi: string | null
  }
}

// DB alt_kategori key → hedef ana kategori
const ALT_KAT_ESLEME: Record<string, string> = {
  // ── ULAŞIM ──
  bus_stop:         'ulasim',
  subway_entrance:  'ulasim',
  station:          'ulasim',
  tram_stop:        'ulasim',
  ferry_terminal:   'ulasim',
  metrobus:         'ulasim',
  dolmus:           'ulasim',
  metro:            'ulasim',
  otobus:           'ulasim',
  tramvay:          'ulasim',
  vapur:            'ulasim',

  // ── SAĞLIK ──
  pharmacy:         'saglik',
  hospital:         'saglik',
  clinic:           'saglik',
  doctors:          'saglik',
  dentist:          'saglik',
  eczane:           'saglik',
  hastane:          'saglik',
  klinik:           'saglik',
  doktor:           'saglik',

  // ── EĞİTİM ──
  school:           'egitim',
  university:       'egitim',
  college:          'egitim',
  kindergarten:     'egitim',
  library:          'egitim',
  okul:             'egitim',
  universite:       'egitim',
  anaokulu:         'egitim',
  kutuphane:        'egitim',

  // ── İMKANLAR ──
  cafe:             'imkanlar',
  restoran:         'imkanlar',
  market:           'imkanlar',
  bar:              'imkanlar',
  firin:            'imkanlar',
  'fırın':          'imkanlar',
  bakery:           'imkanlar',
  shopping_mall:    'imkanlar',
  night_club:       'imkanlar',

  // ── YEŞİL ALAN ── (park/spor imkanlar'dan gelir, buraya taşı)
  park:             'yesil',
  spor:             'yesil',
  sahil:            'yesil',
  meydan:           'yesil',
  garden:           'yesil',
  playground:       'yesil',
  pitch:            'yesil',
  sports_centre:    'yesil',
  leisure:          'yesil',
  nature_reserve:   'yesil',
  forest:           'yesil',

  // ── KÜLTÜR ──
  sinema:           'kultur',
  tiyatro:          'kultur',
  muze:             'kultur',
  galeri:           'kultur',
  sanat_merkezi:    'kultur',
  kultur_diger:     'kultur',
  cinema:           'kultur',
  theatre:          'kultur',
  museum:           'kultur',
  gallery:          'kultur',
  arts_centre:      'kultur',
  gece_kulubu:      'kultur',
}

// Ana kategori gösterim tanımları
const ALT_KAT_TANIM: Record<string, {
  key: string; label: string; ikon: string; vurgulu?: boolean
}[]> = {
  ulasim: [
    { key: 'bus_stop',        label: 'Otobüs Durağı',  ikon: '🚌', vurgulu: true },
    { key: 'subway_entrance', label: 'Metro Durağı',    ikon: '🚇', vurgulu: true },
    { key: 'tram_stop',       label: 'Tramvay Durağı', ikon: '🚋' },
    { key: 'ferry_terminal',  label: 'Vapur İskelesi', ikon: '⛴️' },
    { key: 'metrobus',        label: 'Metrobüs',        ikon: '🚌' },
    { key: 'metro',           label: 'Metro',           ikon: '🚇' },
    { key: 'otobus',          label: 'Otobüs',          ikon: '🚌' },
    { key: 'tramvay',         label: 'Tramvay',         ikon: '🚋' },
    { key: 'vapur',           label: 'Vapur',           ikon: '⛴️' },
    { key: 'station',         label: 'İstasyon',        ikon: '🚉' },
  ],
  saglik: [
    { key: 'pharmacy',  label: 'Eczane',          ikon: '💊', vurgulu: true },
    { key: 'hospital',  label: 'Hastane',          ikon: '🏥', vurgulu: true },
    { key: 'clinic',    label: 'Klinik / ASM',     ikon: '🩺' },
    { key: 'doctors',   label: 'Doktor',           ikon: '👨‍⚕️' },
    { key: 'dentist',   label: 'Diş Hekimi',       ikon: '🦷' },
    { key: 'eczane',    label: 'Eczane',            ikon: '💊' },
    { key: 'hastane',   label: 'Hastane',           ikon: '🏥' },
    { key: 'klinik',    label: 'Klinik',            ikon: '🩺' },
  ],
  egitim: [
    { key: 'school',       label: 'Okul',        ikon: '🏫', vurgulu: true },
    { key: 'university',   label: 'Üniversite',  ikon: '🎓', vurgulu: true },
    { key: 'college',      label: 'Kolej',       ikon: '🎓' },
    { key: 'kindergarten', label: 'Anaokulu',    ikon: '🧒' },
    { key: 'library',      label: 'Kütüphane',   ikon: '📖' },
    { key: 'okul',         label: 'Okul',        ikon: '🏫' },
    { key: 'universite',   label: 'Üniversite',  ikon: '🎓' },
    { key: 'anaokulu',     label: 'Anaokulu',    ikon: '🧒' },
    { key: 'kutuphane',    label: 'Kütüphane',   ikon: '📖' },
  ],
  imkanlar: [
    { key: 'restoran',     label: 'Restoran',     ikon: '🍽️', vurgulu: true },
    { key: 'cafe',         label: 'Kafe',         ikon: '☕',  vurgulu: true },
    { key: 'bar',          label: 'Bar / Pub',    ikon: '🍺' },
    { key: 'market',       label: 'Market',       ikon: '🛒' },
    { key: 'fırın',        label: 'Fırın',        ikon: '🥐' },
    { key: 'firin',        label: 'Fırın',        ikon: '🥐' },
    { key: 'bakery',       label: 'Fırın',        ikon: '🥐' },
    { key: 'shopping_mall',label: 'AVM',          ikon: '🏬' },
    { key: 'night_club',   label: 'Gece Kulübü',  ikon: '🎵' },
  ],
  yesil: [
    { key: 'park',         label: 'Park',          ikon: '🌳', vurgulu: true },
    { key: 'spor',         label: 'Spor Alanı',    ikon: '⚽' },
    { key: 'sahil',        label: 'Sahil / Kıyı',  ikon: '🏖️' },
    { key: 'meydan',       label: 'Meydan',        ikon: '🏛️' },
    { key: 'garden',       label: 'Bahçe',         ikon: '🌿' },
    { key: 'playground',   label: 'Oyun Alanı',    ikon: '🎠' },
    { key: 'sports_centre',label: 'Spor Merkezi',  ikon: '🏋️' },
  ],
  kultur: [
    { key: 'sinema',       label: 'Sinema',        ikon: '🎬', vurgulu: true },
    { key: 'tiyatro',      label: 'Tiyatro',       ikon: '🎭' },
    { key: 'muze',         label: 'Müze',          ikon: '🏛️' },
    { key: 'galeri',       label: 'Galeri',        ikon: '🖼️' },
    { key: 'sanat_merkezi',label: 'Sanat Merkezi', ikon: '🎨' },
    { key: 'cinema',       label: 'Sinema',        ikon: '🎬' },
    { key: 'theatre',      label: 'Tiyatro',       ikon: '🎭' },
    { key: 'museum',       label: 'Müze',          ikon: '🏛️' },
    { key: 'gallery',      label: 'Galeri',        ikon: '🖼️' },
    { key: 'arts_centre',  label: 'Sanat Merkezi', ikon: '🎨' },
    { key: 'gece_kulubu',  label: 'Gece Kulübü',   ikon: '🎵' },
  ],
}

const KATEGORI_META: Record<string, {
  baslik: string; ikon: string; renk: string; acikRenk: string; skorKey: string
}> = {
  ulasim:          { baslik: 'Ulaşım',          ikon: '🚇', renk: '#3b82f6', acikRenk: '#eff6ff', skorKey: 'ulasim_skoru'          },
  saglik:          { baslik: 'Sağlık',           ikon: '🏥', renk: '#ef4444', acikRenk: '#fef2f2', skorKey: 'saglik_skoru'          },
  egitim:          { baslik: 'Eğitim',           ikon: '📚', renk: '#8b5cf6', acikRenk: '#f5f3ff', skorKey: 'egitim_skoru'          },
  imkanlar:        { baslik: 'Sosyal İmkanlar',  ikon: '🏪', renk: '#10b981', acikRenk: '#ecfdf5', skorKey: 'imkanlar_skoru'        },
  guvenlik:        { baslik: 'Güvenlik',         ikon: '🛡️', renk: '#06b6d4', acikRenk: '#ecfeff', skorKey: 'guvenlik_skoru'        },
  yesil:           { baslik: 'Yeşil Alan',       ikon: '🌳', renk: '#22c55e', acikRenk: '#f0fdf4', skorKey: 'yesil_alan_skoru'      },
  kultur:          { baslik: 'Kültür & Sanat',   ikon: '🎭', renk: '#f59e0b', acikRenk: '#fffbeb', skorKey: 'kultur_skoru'          },
  deprem_direnci:  { baslik: 'Deprem Güvenliği', ikon: '⚠️', renk: '#f97316', acikRenk: '#fff7ed', skorKey: 'deprem_skoru'          },
  nufus_yogunlugu: { baslik: 'Sakinlik',         ikon: '🏘️', renk: '#8b5cf6', acikRenk: '#f5f3ff', skorKey: 'nufus_yogunlugu_skoru' },
}

interface DepremVeri {
  yorum:       string | null
  fayMesafe:   number | null
  sonYil:      number | null
  maxMag:      number | null
  guncellendi: string | null
}

export type TesisItem = { alt_kategori: string; isim: string; lat: number; lng: number }
// tesisListesi[kategori][alt_kategori] = TesisItem[]
type TesisListesiMap = Record<string, Record<string, TesisItem[]>>

export function UnifiedParametreListesi({ slug, tip, skorlar, depremVeri }: Props) {
  const [tesisVeri, setTesisVeri]         = useState<Record<string, Record<string, number>>>({})
  const [tesisListesi, setTesisListesi]   = useState<TesisListesiMap>({})
  const [yukleniyor, setYukleniyor]       = useState(true)

  useEffect(() => {
    const endpoint = tip === 'ilce'
      ? `/api/ilce/${slug}/istatistik`
      : `/api/mahalle/${slug}/istatistik`

    fetch(endpoint)
      .then(r => r.json())
      .then(d => {
        if (d.tesisListesi) setTesisListesi(d.tesisListesi)
        const raw = d.istatistikler || {}

        // Tüm kategoriler için boş başlangıç
        const normalize: Record<string, Record<string, number>> = {
          ulasim:   {},
          saglik:   {},
          egitim:   {},
          imkanlar: {},
          yesil:    {},
          kultur:   {},
        }

        Object.entries(raw).forEach(([anaKat, altlar]) => {
          Object.entries(altlar as Record<string, number>).forEach(([altKat, sayi]) => {
            // Önce ALT_KAT_ESLEME'ye bak — spesifik key'ler (park→yesil gibi) öncelikli
            const hedef =
              ALT_KAT_ESLEME[altKat] ||
              ALT_KAT_ESLEME[anaKat] ||
              anaKat

            if (normalize[hedef] !== undefined) {
              normalize[hedef][altKat] = (normalize[hedef][altKat] || 0) + sayi
            } else if (normalize[anaKat] !== undefined) {
              normalize[anaKat][altKat] = (normalize[anaKat][altKat] || 0) + sayi
            }
          })
        })

        setTesisVeri(normalize)
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [slug, tip])

  const parametreler: UnifiedParametre[] = useMemo(() => {
    return Object.entries(KATEGORI_META).map(([id, meta]) => {
      const skor       = skorlar[meta.skorKey] || 0
      const katVeri    = tesisVeri[id] || {}
      const toplamSayi = Object.values(katVeri).reduce((t, s) => t + s, 0)

      type AltSatir = { key: string; label: string; ikon: string; sayi: number; vurgulu?: boolean }
      const altKategoriler = (ALT_KAT_TANIM[id] || [])
        .map(alt => ({ ...alt, sayi: katVeri[alt.key] || 0 }))
        .reduce((acc: AltSatir[], cur: AltSatir) => {
          const existing = acc.find(a => a.label === cur.label)
          if (existing) {
            existing.sayi += cur.sayi
          } else {
            acc.push({ ...cur })
          }
          return acc
        }, [])

      return {
        id,
        baslik:      meta.baslik,
        ikon:        meta.ikon,
        renk:        meta.renk,
        acikRenk:    meta.acikRenk,
        skor,
        insight:     skorInsight(id, skor),
        altKategoriler,
        toplamSayi:  toplamSayi > 0 ? toplamSayi : undefined,
      }
    })
  }, [skorlar, tesisVeri])

  if (yukleniyor) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', gap: 12 }}>
      <Loader2 size={24} color="#25d366" style={{ animation: 'spin 1s linear infinite' }}/>
      <span style={{ fontSize: 14, color: '#667781' }}>Veriler yükleniyor...</span>
    </div>
  )

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#25d366', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Detaylı Parametre Analizi
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111b21', marginBottom: 4 }}>
          Skor & Tesis Özeti
        </h2>
        <p style={{ fontSize: 13, color: '#667781' }}>
          Her parametreyi açarak detaylı dağılımı gör
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {parametreler.map((p, idx) => (
          <UnifiedParametreKarti
            key={p.id}
            parametre={p}
            varsayilanAcik={idx === 0}
            index={idx}
            ilceSlug={tip === 'ilce' ? slug : undefined}
            depremVeri={p.id === 'deprem_direnci' ? depremVeri : undefined}
            tesisListesi={tesisListesi[p.id] || {}}
          />
        ))}
      </div>
    </section>
  )
}
