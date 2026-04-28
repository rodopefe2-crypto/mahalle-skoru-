'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Ilce } from '@/lib/types'
import { SosyalImkanlar } from '@/components/sosyal/SosyalImkanlar'
import { UnifiedParametreListesi } from '@/components/unified/UnifiedParametreListesi'
import dynamic from 'next/dynamic'

const AnalizPaneli = dynamic(() => import('@/components/AnalizPaneli'), { ssr: false })

const PARAMETRELER = [
  { key: 'ulasim_skoru',            label: 'Ulaşım',           renk: '#3b82f6' },
  { key: 'imkanlar_skoru',          label: 'İmkanlar',          renk: '#10b981' },
  { key: 'egitim_skoru',            label: 'Eğitim',            renk: '#8b5cf6' },
  { key: 'saglik_skoru',            label: 'Sağlık',            renk: '#ef4444' },
  { key: 'guvenlik_skoru',          label: 'Güvenlik',          renk: '#f59e0b' },
  { key: 'deprem_skoru',            label: 'Deprem Direnci',    renk: '#f97316' },
  { key: 'yasam_maliyeti_skoru',    label: 'Yaşam Maliyeti',   renk: '#ec4899' },
  { key: 'sakin_memnuniyeti_skoru', label: 'Memnuniyet',       renk: '#06b6d4' },
]

function SkorDairesi({ skor }: { skor: number }) {
  const r = 65, c = 2 * Math.PI * r
  const fill = (skor / 100) * c
  return (
    <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
      <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={80} cy={80} r={r} fill="none" stroke="#e9edef" strokeWidth={10} />
        <circle
          cx={80} cy={80} r={r} fill="none"
          stroke="#25d366" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${fill} ${c}`}
          style={{ animation: 'skorAnimas 1.2s ease-out forwards' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#075e54', lineHeight: 1 }}>{skor}</span>
        <span style={{ fontSize: 12, color: '#667781' }}>/ 100</span>
      </div>
    </div>
  )
}

interface DetailPageProps { params: Promise<{ slug: string }> }

export default function DetailPage({ params }: DetailPageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [ilce, setIlce]             = useState<Ilce | null>(null)
  const [tumIlceler, setTumIlceler] = useState<Ilce[]>([])
  const [mahalleler, setMahalleler]               = useState<any[]>([])
  const [mahalleYukleniyor, setMahalleYukleniyor] = useState(false)

  useEffect(() => {
    supabase.from('ilceler').select('*').eq('slug', slug).single()
      .then(({ data }) => setIlce(data))
    supabase.from('ilceler').select('*')
      .then(({ data }) => setTumIlceler(data || []))
  }, [slug])

  useEffect(() => {
    if (slug === 'kagithane') {
      setMahalleYukleniyor(true)
      fetch('/api/mahalle?ilce=kagithane')
        .then(r => r.json())
        .then(d => setMahalleler(d.mahalleler || []))
        .finally(() => setMahalleYukleniyor(false))
    }
  }, [slug])

  if (!ilce) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #25d366', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#667781', fontSize: 14 }}>Yükleniyor...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // Hesaplamalar
  const siralama = [...tumIlceler].sort((a, b) => b.genel_skor - a.genel_skor)
  const sira = siralama.findIndex(i => i.id === ilce.id) + 1

  const paramDegerler = PARAMETRELER.map(p => ({
    ...p, val: (ilce[p.key as keyof Ilce] as number) || 0
  }))
  const siraliBas = [...paramDegerler].sort((a, b) => b.val - a.val)
  const top3 = siraliBas.slice(0, 3)
  const bot2 = siraliBas.slice(-2)
  const ozetCumle = `${siraliBas[0].label} ve ${siraliBas[1].label} alanında güçlü; ${siraliBas[siraliBas.length - 1].label} alanında gelişim potansiyeli var.`

  const benzerIlceler = tumIlceler.filter(i =>
    i.id !== ilce.id && Math.abs(i.genel_skor - ilce.genel_skor) <= 10
  )

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{
      background: 'white', borderRadius: 16, border: '1px solid #e9edef',
      padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style
    }}>
      {children}
    </div>
  )

  return (
    <div style={{ background: '#f8fafb', minHeight: '100vh', paddingBottom: 64 }}>

      {/* ─── HERO ─── */}
      <div style={{ background: 'linear-gradient(135deg,#075e54,#128c7e)', padding: '0 24px 40px', paddingTop: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dcf8c6', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = '#dcf8c6')}
          >
            <ChevronLeft size={16} />
            Geri
          </Link>

          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Sol: kimlik */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, color: 'white', marginBottom: 8, lineHeight: 1.15 }}>
                {ilce.isim}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 20 }}>
                {ilce.aciklama}
              </p>

              {/* Özet cümle */}
              <p style={{
                fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', fontSize: 14,
                borderLeft: '3px solid #25d366', paddingLeft: 12, marginBottom: 20, lineHeight: 1.6,
              }}>
                {ozetCumle}
              </p>

              {/* Güçlü yönler */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {top3.map(p => (
                  <span key={p.key} style={{ background: '#dcf8c6', color: '#075e54', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>
                    ✓ {p.label}
                  </span>
                ))}
              </div>

              {/* Zayıf yönler */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bot2.map(p => (
                  <span key={p.key} style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>
                    ↑ {p.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Sağ: metrikler + daire */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              {/* 3 metrik */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { val: String(ilce.genel_skor), label: 'Genel Skor' },
                  { val: sira ? `#${sira}` : '—',   label: 'Sıralama'   },
                  { val: '8/8',                      label: 'Parametre'  },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                    borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                    padding: '14px 18px', textAlign: 'center', minWidth: 80,
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1 }}>{m.val}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <SkorDairesi skor={ilce.genel_skor} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 0' }}>

        {/* ─── ANALİZ PANELİ ─── */}
        {card(
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111b21' }}>Performans Analizi</h2>
              <p style={{ fontSize: 13, color: '#667781', marginTop: 2 }}>8 parametre üzerinden değerlendirme</p>
            </div>
            <AnalizPaneli ilce={ilce} />
          </>,
          { marginBottom: 24 }
        )}

        {/* ─── UNIFIED PARAMETRE & TESİS ─── */}
        <UnifiedParametreListesi
          slug={slug}
          tip="ilce"
          skorlar={{
            ulasim_skoru:            ilce.ulasim_skoru            || 0,
            saglik_skoru:            ilce.saglik_skoru             || 0,
            egitim_skoru:            ilce.egitim_skoru             || 0,
            imkanlar_skoru:          ilce.imkanlar_skoru           || 0,
            guvenlik_skoru:          ilce.guvenlik_skoru           || 0,
            deprem_skoru:            ilce.deprem_skoru             || 0,
            yasam_maliyeti_skoru:    ilce.yasam_maliyeti_skoru     || 0,
            sakin_memnuniyeti_skoru: ilce.sakin_memnuniyeti_skoru  || 0,
            yesil_alan_skoru:        ilce.yesil_alan_skoru         || 0,
            kultur_skoru:            ilce.kultur_skoru             || 0,
          }}
          depremVeri={{
            yorum:       (ilce as any).deprem_yorum       || null,
            fayMesafe:   (ilce as any).deprem_fay_mesafe  || null,
            sonYil:      (ilce as any).deprem_son_yil     || null,
            maxMag:      (ilce as any).deprem_max_mag     || null,
            guncellendi: (ilce as any).deprem_guncellendi || null,
          }}
        />

        {/* ─── SOSYAL İMKANLAR ─── */}
        <SosyalImkanlar ilceSlug={slug} ilceAdi={ilce.isim} />

        {/* ─── BENZER İLÇELER ─── */}
        {benzerIlceler.length > 0 && card(
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111b21', marginBottom: 16 }}>Benzer İlçeler</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {benzerIlceler.map(bi => (
                <Link
                  key={bi.id}
                  href={`/ilce/${bi.slug}`}
                  style={{
                    background: 'white', borderRadius: 10,
                    border: '1px solid #e9edef', padding: '12px 16px',
                    textDecoration: 'none', transition: 'border-color 150ms',
                    display: 'block',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#25d366')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e9edef')}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111b21' }}>{bi.isim}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#128c7e', marginTop: 2 }}>{bi.genel_skor} puan</div>
                </Link>
              ))}
            </div>
          </>,
          { marginBottom: 24 }
        )}

        {/* ─── MAHALLE LİSTESİ (sadece Kağıthane) ─── */}
        {slug === 'kagithane' && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#25d366', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Mahalle Bazlı Analiz</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111b21', marginBottom: 4 }}>Kağıthane Mahalleleri</h2>
                <p style={{ fontSize: 13, color: '#667781' }}>{mahalleler.length} mahalle · Skora göre sıralı</p>
              </div>
            </div>

            {mahalleYukleniyor && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#667781', fontSize: 14 }}>
                Mahalleler yükleniyor...
              </div>
            )}

            {!mahalleYukleniyor && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {mahalleler.map((mahalle, idx) => {
                  const skorRengi = mahalle.genel_skor >= 70 ? '#25d366' : mahalle.genel_skor >= 50 ? '#f59e0b' : '#ef4444'
                  return (
                    <div
                      key={mahalle.slug}
                      onClick={() => router.push('/mahalle/' + mahalle.slug)}
                      style={{ background: 'white', borderRadius: 14, border: '1.5px solid #e9edef', padding: '16px 18px', cursor: 'pointer', transition: 'all 220ms ease' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 24px rgba(7,94,84,0.10)'; el.style.borderColor = '#86efac' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = '#e9edef' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#667781' }}>{idx + 1}</div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>{mahalle.isim}</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: skorRengi, lineHeight: 1 }}>{mahalle.genel_skor}</div>
                      </div>

                      <div style={{ background: '#f0f2f5', height: 4, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ height: '100%', width: mahalle.genel_skor + '%', background: skorRengi, borderRadius: 99, transition: 'width 600ms ease-out' }} />
                      </div>

                      {[
                        { label: '🚇', key: 'ulasim_skoru',   renk: '#3b82f6' },
                        { label: '🏪', key: 'imkanlar_skoru', renk: '#10b981' },
                        { label: '📚', key: 'egitim_skoru',   renk: '#8b5cf6' },
                      ].map(p => (
                        <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12 }}>{p.label}</span>
                          <div style={{ flex: 1, background: '#f0f2f5', height: 3, borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: mahalle[p.key] + '%', background: p.renk, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: p.renk, width: 24, textAlign: 'right' }}>{mahalle[p.key]}</span>
                        </div>
                      ))}

                      <div style={{ marginTop: 10, fontSize: 12, color: '#128c7e', fontWeight: 600, textAlign: 'right' }}>Detayı İncele →</div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ─── QUIZ PROMO ─── */}
        <div style={{
          background: 'white', borderRadius: 20,
          border: '1.5px solid #e9edef', padding: '24px 28px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#25d366', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Emin değil misin?
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111b21', marginBottom: 4 }}>
              Sana özel ilçe önerisi al
            </div>
            <div style={{ fontSize: 13, color: '#667781' }}>
              6 soruluk testle yaşam tarzına en uygun yeri bul
            </div>
          </div>
          <button
            onClick={() => router.push('/quiz')}
            style={{
              background: 'linear-gradient(135deg, #075e54, #128c7e)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '13px 24px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(7,94,84,0.2)', whiteSpace: 'nowrap',
            }}
          >
            🎯 Testi Başlat
          </button>
        </div>

        {/* ─── CTA ─── */}
        <div style={{ background: '#dcf8c6', borderRadius: 16, border: '1px solid rgba(37,211,102,0.3)', padding: 32, textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111b21', marginBottom: 16 }}>{ilce.isim} ile ilgili daha fazlasını öğren</h3>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/karsilastir" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#075e54', color: 'white', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 10, textDecoration: 'none' }}>
              Karşılaştır
            </Link>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 10, border: '1px solid #e9edef', cursor: 'pointer' }}>
              <Share2 size={15} />
              Paylaş
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes skorAnimas { from { stroke-dashoffset: 408.4 } }
        @keyframes barDolum   { from { width: 0% !important } }
      `}</style>
    </div>
  )
}
