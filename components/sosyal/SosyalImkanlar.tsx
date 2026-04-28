'use client'

import { useEffect, useState } from 'react'
import { UtensilsCrossed, Palette, Trees, Users, TrendingUp, Loader2 } from 'lucide-react'

// ── ALT KATEGORİ → ANA KATEGORİ EŞLEŞMESİ ──────────────────────────────────

const KATEGORI_ESLESME: Record<string, string> = {
  // Yeme & İçme (kategori=imkanlar)
  cafe:        'yeme',
  restoran:    'yeme',
  bar:         'yeme',
  market:      'yeme',
  firin:       'yeme',
  'firın':     'yeme',

  // Kültürel Aktivite (kategori=kultur)
  sinema:      'kultur',
  tiyatro:     'kultur',
  muze:        'kultur',
  galeri:      'kultur',
  konser:      'kultur',
  sanat_merkezi: 'kultur',
  gece_kulubu: 'kultur',
  stadyum:     'kultur',
  kultur_diger:'kultur',

  // Sosyal Alan (kategori=imkanlar)
  park:        'sosyal_alan',
  sahil:       'sosyal_alan',
  meydan:      'sosyal_alan',
  spor:        'sosyal_alan',
  eczane:      'sosyal_alan',
  diger:       'sosyal_alan',
}

// ── KATEGORİ TANIMLARI ────────────────────────────────────────────────────────

interface GrupTanim {
  baslik: string
  ikon: React.ReactNode
  renk: string
  acikRenk: string
  altKategoriler: string[]
  aciklama: string
}

const KATEGORILER: Record<string, GrupTanim> = {
  yeme: {
    baslik: 'Yeme & İçme',
    ikon: <UtensilsCrossed size={22} />,
    renk: '#f97316',
    acikRenk: '#fff7ed',
    altKategoriler: ['cafe', 'restoran', 'bar', 'firin', 'firın', 'market'],
    aciklama: 'Kafe, restoran ve günlük yeme içme noktaları',
  },
  kultur: {
    baslik: 'Kültürel Aktivite',
    ikon: <Palette size={22} />,
    renk: '#8b5cf6',
    acikRenk: '#f5f3ff',
    altKategoriler: ['muze', 'tiyatro', 'sinema', 'galeri', 'sanat_merkezi', 'gece_kulubu', 'stadyum', 'konser', 'kultur_diger'],
    aciklama: 'Sanat, kültür ve eğlence mekanları',
  },
  sosyal_alan: {
    baslik: 'Sosyal Alan',
    ikon: <Trees size={22} />,
    renk: '#10b981',
    acikRenk: '#ecfdf5',
    altKategoriler: ['park', 'sahil', 'meydan', 'spor', 'eczane', 'diger'],
    aciklama: 'Park, sahil, spor alanları ve diğer sosyal mekanlar',
  },
}

const ALT_KAT_ETIKET: Record<string, string> = {
  cafe:          'Kafe',
  restoran:      'Restoran',
  bar:           'Bar / Pub',
  market:        'Market',
  firin:         'Fırın / Pastane',
  'firın':       'Fırın / Pastane',
  muze:          'Müze',
  tiyatro:       'Tiyatro',
  sinema:        'Sinema',
  galeri:        'Galeri',
  sanat_merkezi: 'Sanat Merkezi',
  gece_kulubu:   'Gece Kulübü',
  stadyum:       'Stadyum',
  konser:        'Konser Mekanı',
  kultur_diger:  'Diğer Kültür',
  park:          'Park',
  sahil:         'Sahil / Yürüyüş',
  meydan:        'Meydan',
  spor:          'Spor Alanı',
  eczane:        'Eczane',
  diger:         'Diğer',
}

// ── SOSYAL YAŞAM TİPİ ────────────────────────────────────────────────────────

function yasatipiHesapla(g: Record<string, number>) {
  const yeme = g['yeme'] || 0
  const kultur = g['kultur'] || 0
  const sosyal = g['sosyal_alan'] || 0
  const toplam = yeme + kultur + sosyal

  if (toplam === 0) return { tip: 'Veri Bekleniyor', renk: '#667781', aciklama: 'Bu ilçe için henüz yeterli veri yok.' }
  if (yeme > toplam * 0.5)   return { tip: 'Gastronomi & Sosyal', renk: '#f97316', aciklama: 'Yeme içme ve sosyal buluşma odaklı canlı bir profil.' }
  if (sosyal > toplam * 0.4) return { tip: 'Doğa & Açık Hava',   renk: '#10b981', aciklama: 'Açık alan ve doğayla iç içe, sakin bir yaşam tarzı.' }
  if (kultur > toplam * 0.3) return { tip: 'Kültür & Sanat',      renk: '#8b5cf6', aciklama: 'Kültürel etkinlikler ve sanatsal yaşama yakın bir profil.' }
  return { tip: 'Dengeli & Çeşitli', renk: '#3b82f6', aciklama: 'Farklı yaşam tarzlarına hitap eden dengeli bir yapı.' }
}

// ── KATEGORİ KART ────────────────────────────────────────────────────────────

function KategoriKarti({
  tanim, altKatSayilar, anaKatSayi, genelToplam,
}: {
  tanim: GrupTanim
  altKatSayilar: Record<string, number>
  anaKatSayi: number
  genelToplam: number
}) {
  const [acik, setAcik] = useState(false)

  const barYuzde = genelToplam > 0
    ? Math.min(Math.round((anaKatSayi / genelToplam) * 100), 100)
    : 0

  // Sadece sıfır olmayan alt kategorileri göster
  const aktifAltKatlar = tanim.altKategoriler.filter(k => (altKatSayilar[k] || 0) > 0)
  const maxAlt = Math.max(...aktifAltKatlar.map(k => altKatSayilar[k] || 0), 1)

  return (
    <div
      onClick={() => setAcik(v => !v)}
      style={{
        background: 'white', borderRadius: 16,
        border: `1.5px solid ${acik ? tanim.renk + '50' : '#e9edef'}`,
        padding: '20px 22px', cursor: 'pointer',
        transition: 'all 250ms ease',
        boxShadow: acik ? `0 8px 24px ${tanim.renk}18` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { if (!acik) e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (!acik) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: tanim.acikRenk, color: tanim.renk,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {tanim.ikon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21', marginBottom: 2 }}>{tanim.baslik}</div>
            <div style={{ fontSize: 12, color: '#667781' }}>{tanim.aciklama}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: tanim.renk, lineHeight: 1 }}>{anaKatSayi}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>mekan</div>
        </div>
      </div>

      {/* Ana bar */}
      <div style={{ background: '#f0f2f5', height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          height: '100%', width: barYuzde + '%', background: tanim.renk,
          borderRadius: 99, transition: 'width 800ms ease-out',
        }} />
      </div>

      {/* Alt kategoriler — açıkken */}
      {acik && (
        <div style={{ borderTop: `1px solid ${tanim.renk}20`, paddingTop: 14 }}>
          {aktifAltKatlar.length > 0 ? aktifAltKatlar.map(k => {
            const sayi = altKatSayilar[k] || 0
            const yuzde = Math.round((sayi / maxAlt) * 100)
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#374151', minWidth: 130, flexShrink: 0 }}>
                  {ALT_KAT_ETIKET[k] || k}
                </span>
                <div style={{ flex: 1, background: '#f0f2f5', height: 5, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: yuzde + '%', background: tanim.renk, borderRadius: 99, transition: 'width 600ms ease-out' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: tanim.renk, minWidth: 32, textAlign: 'right' }}>{sayi}</span>
              </div>
            )
          }) : (
            <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
              Bu kategoride veri bulunamadı
            </div>
          )}

          <div style={{
            background: tanim.acikRenk, border: `1px solid ${tanim.renk}25`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          }}>
            <TrendingUp size={14} color={tanim.renk} />
            <span style={{ fontSize: 12, color: '#374151', fontStyle: 'italic' }}>
              {anaKatSayi > 200
                ? 'Bu kategoride yüksek yoğunluk — çok sayıda seçenek mevcut.'
                : anaKatSayi > 50
                ? 'Orta düzeyde seçenek sunuluyor.'
                : 'Bu alanda gelişime açık potansiyel var.'}
            </span>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#9ca3af' }}>
        {acik ? '▲ Kapat' : '▼ Alt kategorileri gör'}
      </div>
    </div>
  )
}

// ── ANA KOMPONENTİ ────────────────────────────────────────────────────────────

export function SosyalImkanlar({ ilceSlug, ilceAdi }: { ilceSlug: string; ilceAdi: string }) {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata]             = useState('')
  const [altKatSayilar, setAltKatSayilar] = useState<Record<string, number>>({})
  const [anaKatSayilar, setAnaKatSayilar] = useState<Record<string, number>>({})
  const [toplam, setToplam]         = useState(0)

  useEffect(() => {
    fetch(`/api/ilce/${ilceSlug}/sosyal`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setHata(data.error); return }

        // Ham alt kategori sayıları
        const altKat: Record<string, number> = data.gruplar || {}
        setAltKatSayilar(altKat)

        // Ana kategorilere topla
        const anaKat: Record<string, number> = {}
        Object.entries(altKat).forEach(([k, sayi]) => {
          const ana = KATEGORI_ESLESME[k] || 'sosyal_alan'
          anaKat[ana] = (anaKat[ana] || 0) + (sayi as number)
        })
        setAnaKatSayilar(anaKat)
        setToplam(data.toplam || 0)
      })
      .catch(() => setHata('Veri yüklenemedi'))
      .finally(() => setYukleniyor(false))
  }, [ilceSlug])

  const yasatipi = yasatipiHesapla(anaKatSayilar)

  if (yukleniyor) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <Loader2 size={28} color="#25d366" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (hata) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#667781', fontSize: 14 }}>{hata}</div>
  )

  return (
    <section style={{ marginBottom: 48 }}>

      {/* ── BAŞLIK ── */}
      <div style={{
        background: 'white', borderRadius: 20,
        border: '1px solid #e9edef', padding: '24px 28px',
        marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#25d366', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Sosyal Yaşam Analizi
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111b21', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Sosyal İmkanlar
            </h2>
            <p style={{ fontSize: 13, color: '#667781', lineHeight: 1.6, maxWidth: 440, margin: 0 }}>
              Bu bölgede günlük yaşamı kolaylaştıran ve sosyal hayatı destekleyen imkanların görünümü
            </p>
          </div>

          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 14, padding: '16px 20px', textAlign: 'center', minWidth: 120,
          }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#075e54', lineHeight: 1 }}>{toplam}</div>
            <div style={{ fontSize: 12, color: '#667781', marginTop: 4 }}>toplam mekan</div>
          </div>
        </div>
      </div>

      {/* ── 3 KATEGORİ KARTI ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16,
      }}>
        {Object.entries(KATEGORILER).map(([id, tanim]) => (
          <KategoriKarti
            key={id}
            tanim={tanim}
            altKatSayilar={altKatSayilar}
            anaKatSayi={anaKatSayilar[id] || 0}
            genelToplam={toplam}
          />
        ))}
      </div>

      {/* ── SOSYAL YAŞAM TİPİ ── */}
      <div style={{
        background: 'white', border: `1.5px solid ${yasatipi.renk}30`,
        borderRadius: 16, padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
        marginBottom: 16,
        boxShadow: `0 4px 16px ${yasatipi.renk}12`,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: yasatipi.renk + '15', color: yasatipi.renk,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={22} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: yasatipi.renk, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Sosyal Yaşam Tipi
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111b21', marginBottom: 6 }}>{yasatipi.tip}</div>
          <div style={{ fontSize: 13, color: '#667781', lineHeight: 1.6 }}>{yasatipi.aciklama}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {Object.entries(KATEGORILER).map(([id, kat]) => (
              <span key={id} style={{
                background: kat.acikRenk, color: kat.renk,
                borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600,
              }}>
                {kat.baslik}: {anaKatSayilar[id] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ÖZET ── */}
      <div style={{
        background: 'linear-gradient(135deg, #075e54, #128c7e)',
        borderRadius: 16, padding: '20px 24px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {ilceAdi} — Sosyal Özet
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>
          {ilceAdi} ilçesinde toplam{' '}
          <strong style={{ color: '#25d366' }}>{toplam} sosyal mekan</strong>{' '}
          tespit edildi. Sosyal yaşam profili{' '}
          <strong style={{ color: '#86efac' }}>"{yasatipi.tip}"</strong>{' '}
          olarak değerlendirildi. {yasatipi.aciklama}
        </p>
      </div>

    </section>
  )
}
