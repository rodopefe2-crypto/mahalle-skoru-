'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { UnifiedParametreListesi } from '@/components/unified/UnifiedParametreListesi'

const PARAM_ETIKET: Record<string, string> = {
  ulasim_skoru:            'Ulaşım',
  imkanlar_skoru:          'Sosyal İmkanlar',
  egitim_skoru:            'Eğitim',
  saglik_skoru:            'Sağlık',
  guvenlik_skoru:          'Güvenlik',
  deprem_skoru:            'Deprem Güvenliği',
  yasam_maliyeti_skoru:    'Yaşam Maliyeti',
  sakin_memnuniyeti_skoru: 'Sakin Memnuniyeti',
}

export default function MahalleDetay() {
  const params = useParams()
  const router = useRouter()
  const slug   = params.slug as string

  const [mahalle, setMahalle]       = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [mahalleSira, setMahalleSira] = useState(0)

  useEffect(() => {
    fetch(`/api/mahalle/${slug}`)
      .then(r => r.json())
      .then(d => {
        setMahalle(d.mahalle)
        setYukleniyor(false)
      })
      .catch(() => setYukleniyor(false))
  }, [slug])

  useEffect(() => {
    if (!mahalle?.ilce?.slug) return
    fetch(`/api/mahalle?ilce=${mahalle.ilce.slug}`)
      .then(r => r.json())
      .then(d => {
        const liste = (d.mahalleler || [])
          .sort((a: any, b: any) => b.genel_skor - a.genel_skor)
        const sira = liste.findIndex((m: any) => m.slug === slug) + 1
        setMahalleSira(sira)
      })
  }, [slug, mahalle?.ilce?.slug])

  if (yukleniyor) return (
    <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏘️</div>
        <div style={{ fontSize: 15, color: '#667781' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  if (!mahalle) return (
    <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 15, color: '#667781' }}>Mahalle bulunamadı</div>
        <button
          onClick={() => router.push('/')}
          style={{ marginTop: 16, padding: '10px 20px', background: '#075e54', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  )

  // Güçlü / zayıf yön hesapla
  const skorSirali = Object.entries(PARAM_ETIKET)
    .map(([key, label]) => ({
      key, label,
      skor: (mahalle[key] as number) || 0,
    }))
    .sort((a, b) => b.skor - a.skor)

  const gucluYonler = skorSirali
    .filter(p => p.skor >= 65)
    .slice(0, 3)
    .map(p => p.label)

  const zayifYonler = skorSirali
    .filter(p => p.skor < 50)
    .slice(-2)
    .map(p => p.label)

  const ozet = gucluYonler.length > 0
    ? `${gucluYonler.slice(0, 2).join(' ve ')} alanında güçlü` +
      (zayifYonler.length > 0
        ? `; ${zayifYonler[0]} alanında gelişime açık.`
        : '.')
    : `${mahalle.isim} genel olarak dengeli bir profile sahip.`

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', paddingTop: 64 }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #075e54, #128c7e)',
        padding: '28px 24px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dekoratif daireler */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(37,211,102,0.07)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: -40, left: '30%',
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}/>

        <div style={{maxWidth: 900, margin: '0 auto'}}>

          {/* Geri butonu */}
          <button
            onClick={() => router.push(mahalle?.ilce?.slug ? `/ilce/${mahalle.ilce.slug}` : '/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              color: '#dcf8c6', fontSize: 13,
              cursor: 'pointer', marginBottom: 20, padding: 0,
            }}
          >
            <ArrowLeft size={14}/>
            {mahalle?.ilce?.isim ? `${mahalle.ilce.isim} İlçesine Dön` : 'Geri Dön'}
          </button>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap', gap: 24,
          }}>

            {/* ── SOL: Mahalle kimliği ── */}
            <div style={{flex: 1, minWidth: 280}}>

              {/* İlçe etiketi */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 8,
              }}>
                <MapPin size={13} color="rgba(255,255,255,0.5)"/>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                  {mahalle?.ilce?.isim || ''} · İstanbul
                </span>
              </div>

              {/* Mahalle adı */}
              <h1 style={{
                fontSize: 40, fontWeight: 900,
                color: 'white', marginBottom: 8,
                letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>
                {mahalle.isim}
              </h1>

              {/* Özet cümle */}
              <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6, maxWidth: 420,
                marginBottom: 16,
                borderLeft: '3px solid rgba(37,211,102,0.6)',
                paddingLeft: 12,
                fontStyle: 'italic',
              }}>
                {ozet}
              </p>

              {/* Güçlü yönler */}
              {gucluYonler.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6,
                  marginBottom: 8,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    alignSelf: 'center',
                  }}>
                    💪 Güçlü:
                  </span>
                  {gucluYonler.map(g => (
                    <span key={g} style={{
                      background: 'rgba(37,211,102,0.2)',
                      border: '1px solid rgba(37,211,102,0.35)',
                      color: '#86efac',
                      borderRadius: 99, padding: '3px 10px',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Zayıf yönler */}
              {zayifYonler.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    alignSelf: 'center',
                  }}>
                    ⚠️ Gelişime açık:
                  </span>
                  {zayifYonler.map(z => (
                    <span key={z} style={{
                      background: 'rgba(251,191,36,0.15)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      color: '#fbbf24',
                      borderRadius: 99, padding: '3px 10px',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {z}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── SAĞ: Skor + metrik kartlar ── */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 16,
              flexShrink: 0,
            }}>

              {/* 3 metrik kutu */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}>
                {[
                  { sayi: mahalle.genel_skor,                  label: 'Genel Skor', renk: '#25d366' },
                  { sayi: mahalleSira > 0 ? `#${mahalleSira}` : '—', label: 'Sıralama',   renk: '#86efac' },
                  { sayi: '8',                                  label: 'Parametre',  renk: '#86efac' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, padding: '12px 10px',
                    textAlign: 'center', minWidth: 72,
                  }}>
                    <div style={{
                      fontSize: 22, fontWeight: 900,
                      color: m.renk, lineHeight: 1, marginBottom: 4,
                    }}>
                      {m.sayi}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* 140px skor dairesi */}
              <div style={{position: 'relative', width: 140, height: 140}}>
                <svg width={140} height={140} viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="58"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="10"
                  />
                  <circle cx="70" cy="70" r="58"
                    fill="none"
                    stroke="#25d366"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(mahalle.genel_skor / 100) * (2 * Math.PI * 58)} ${2 * Math.PI * 58}`}
                    strokeDashoffset={2 * Math.PI * 58 * 0.25}
                    style={{transition: 'stroke-dasharray 1.2s ease-out'}}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: 36, fontWeight: 900,
                    color: 'white', lineHeight: 1,
                  }}>
                    {mahalle.genel_skor}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    / 100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── UNIFIED PARAMETRE & TESİS ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        <UnifiedParametreListesi
          slug={slug}
          tip="mahalle"
          skorlar={{
            ulasim_skoru:            mahalle.ulasim_skoru            || 0,
            saglik_skoru:            mahalle.saglik_skoru             || 0,
            egitim_skoru:            mahalle.egitim_skoru             || 0,
            imkanlar_skoru:          mahalle.imkanlar_skoru           || 0,
            guvenlik_skoru:          mahalle.guvenlik_skoru           || 0,
            deprem_skoru:            mahalle.deprem_skoru             || 0,
            yasam_maliyeti_skoru:    mahalle.yasam_maliyeti_skoru     || 0,
            sakin_memnuniyeti_skoru: mahalle.sakin_memnuniyeti_skoru  || 0,
          }}
          depremVeri={{
            yorum:       mahalle.deprem_yorum       || null,
            fayMesafe:   mahalle.deprem_fay_mesafe  || null,
            sonYil:      mahalle.deprem_son_yil     || null,
            maxMag:      mahalle.deprem_max_mag     || null,
            guncellendi: mahalle.deprem_guncellendi || null,
          }}
        />

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => router.push(mahalle?.ilce?.slug ? `/ilce/${mahalle.ilce.slug}` : '/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e9edef', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}
          >
            <ArrowLeft size={15}/> {mahalle?.ilce?.isim ? `${mahalle.ilce.isim} İlçesine Dön` : 'Geri Dön'}
          </button>
        </div>
      </div>
    </div>
  )
}
