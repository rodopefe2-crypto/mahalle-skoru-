'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart, ArrowRight,
  Train, ShoppingBag,
  BookOpen, HeartPulse,
  Shield, Flame, AlertTriangle,
  Trees, Palette, Banknote, Smile,
} from 'lucide-react'
import { KIRA_VERISI, kiraRengi } from '@/lib/kiraVerisi'

interface IlceKartiProps {
  overallSira:    number
  aktifSiralama:  string
  ilce: {
    id?:                     string
    slug:                    string
    isim:                    string
    aciklama:                string | null
    genel_skor:              number
    ulasim_skoru:            number
    imkanlar_skoru:          number
    egitim_skoru:            number
    saglik_skoru:            number
    guvenlik_skoru:          number
    deprem_skoru:            number
    deprem_fay_mesafe?:      number | null
    deprem_son_yil?:         number | null
    deprem_max_mag?:         number | null
    deprem_yorum?:           string | null
    yasam_maliyeti_skoru:    number
    sakin_memnuniyeti_skoru: number
    yesil_alan_skoru:        number
    kultur_skoru:            number
  }
  sira:              number
  karsilastirmaModu?: boolean
  secili?:            boolean
  onSecimDegis?:      (slug: string) => void
}

const PARAMETRELER = [
  { key: 'ulasim_skoru',          label: 'Ulaşım',     Ikon: Train,         renk: '#3b82f6', bg: '#eff6ff' },
  { key: 'saglik_skoru',          label: 'Sağlık',     Ikon: HeartPulse,    renk: '#ef4444', bg: '#fef2f2' },
  { key: 'egitim_skoru',          label: 'Eğitim',     Ikon: BookOpen,      renk: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'imkanlar_skoru',        label: 'İmkanlar',   Ikon: ShoppingBag,   renk: '#10b981', bg: '#ecfdf5' },
  { key: 'deprem_skoru',          label: 'Deprem',     Ikon: AlertTriangle, renk: '#f97316', bg: '#fff7ed' },
  { key: 'yesil_alan_skoru',      label: 'Yeşil Alan', Ikon: Trees,         renk: '#22c55e', bg: '#f0fdf4' },
  { key: 'kultur_skoru',          label: 'Kültür',     Ikon: Palette,       renk: '#f59e0b', bg: '#fffbeb' },
  { key: 'guvenlik_skoru',        label: 'Güvenlik',   Ikon: Shield,        renk: '#0ea5e9', bg: '#f0f9ff' },
  { key: 'sakin_memnuniyeti_skoru', label: 'Sakinlik', Ikon: Smile,         renk: '#ec4899', bg: '#fdf2f8' },
]

function skorRengi(skor: number): string {
  if (skor >= 75) return '#16a34a'
  if (skor >= 55) return '#d97706'
  return '#dc2626'
}

function skorEtiketi(skor: number): string {
  if (skor >= 80) return 'Mükemmel'
  if (skor >= 70) return 'Çok İyi'
  if (skor >= 55) return 'İyi'
  if (skor >= 40) return 'Orta'
  return 'Gelişime Açık'
}

function rozetStili(sira: number): { bg: string; color: string; shadow: string } {
  if (sira === 1) return { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: 'white', shadow: '0 2px 8px rgba(251,191,36,0.4)' }
  if (sira === 2) return { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', color: 'white', shadow: '0 2px 8px rgba(100,116,139,0.3)' }
  if (sira === 3) return { bg: 'linear-gradient(135deg,#c97c3a,#b45309)', color: 'white', shadow: '0 2px 8px rgba(180,83,9,0.3)' }
  return { bg: '#f1f5f9', color: '#64748b', shadow: 'none' }
}

export function IlceKarti({
  ilce, sira, overallSira, aktifSiralama,
  karsilastirmaModu, secili, onSecimDegis,
}: IlceKartiProps) {
  const router  = useRouter()
  const [favori, setFavori] = useState(false)
  const [hover,  setHover]  = useState(false)

  const sRenk   = skorRengi(ilce.genel_skor)
  const sEtiket = skorEtiketi(ilce.genel_skor)
  const rozet   = rozetStili(sira)

  const enYuksek = PARAMETRELER
    .map(p => ({ label: p.label, skor: (ilce as any)[p.key] as number || 0 }))
    .sort((a, b) => b.skor - a.skor)[0]

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:    'white',
        borderRadius:  20,
        border:        secili
          ? '2px solid #25d366'
          : hover
            ? '1.5px solid #86efac'
            : '1.5px solid #e9edef',
        boxShadow:     secili
          ? '0 0 0 4px rgba(37,211,102,0.12)'
          : hover
            ? '0 12px 40px rgba(7,94,84,0.10)'
            : '0 2px 8px rgba(0,0,0,0.04)',
        transform:     hover ? 'translateY(-4px)' : 'none',
        transition:    'all 280ms cubic-bezier(0.16,1,0.3,1)',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
      }}
    >

      {/* ── HEADER ── */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid #f0f2f5',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Sıra rozeti */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              background: rozet.bg, color: rozet.color, boxShadow: rozet.shadow,
              borderRadius: 8, padding: '3px 10px',
              fontSize: 12, fontWeight: 800, letterSpacing: '0.02em',
            }}>
              #{sira}
            </div>
            {aktifSiralama !== 'genel_skor' && overallSira > 0 && (
              <div style={{
                background: '#f0f2f5', color: '#667781',
                borderRadius: 8, padding: '3px 8px',
                fontSize: 10, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <span style={{ color: '#9ca3af' }}>Genel:</span>
                #{overallSira}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Karşılaştırma checkbox */}
            {karsilastirmaModu && (
              <div
                onClick={e => { e.stopPropagation(); onSecimDegis?.(ilce.slug) }}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: secili ? '2px solid #25d366' : '2px solid #d1d5db',
                  background: secili ? '#25d366' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
                }}
              >
                {secili && (
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polyline points="2,6 5,9 10,3" fill="none"
                      stroke="white" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )}

            {/* Favori */}
            <button
              onClick={e => { e.stopPropagation(); setFavori(f => !f) }}
              style={{
                background: favori ? '#fef2f2' : '#f8fafb',
                border: favori ? '1px solid #fca5a5' : '1px solid #e9edef',
                borderRadius: '50%', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <Heart size={15} color={favori ? '#ef4444' : '#9ca3af'} fill={favori ? '#ef4444' : 'none'} />
            </button>
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: 22, fontWeight: 800, color: '#0f172a',
            lineHeight: 1.15, marginBottom: 4, letterSpacing: '-0.01em',
          }}>
            {ilce.isim}
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.45 }}>
            {ilce.aciklama || `${enYuksek.label} alanında öne çıkıyor`}
          </p>
        </div>
      </div>

      {/* ── SKOR BANDI ── */}
      <div style={{
        padding: '14px 20px',
        background: `linear-gradient(135deg,${sRenk}08,${sRenk}04)`,
        borderBottom: '1px solid #f0f2f5',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: sRenk, lineHeight: 1 }}>
              {ilce.genel_skor}
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>/ 100</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>
              GENEL SKOR
            </div>
            <div style={{
              background: sRenk + '18', color: sRenk,
              borderRadius: 99, padding: '3px 10px',
              fontSize: 11, fontWeight: 700,
            }}>
              {sEtiket}
            </div>
          </div>
        </div>
        <div style={{ background: '#e2e8f0', height: 6, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: ilce.genel_skor + '%',
            background: `linear-gradient(90deg,${sRenk}cc,${sRenk})`,
            borderRadius: 99, transition: 'width 1s ease-out',
            boxShadow: `0 0 8px ${sRenk}50`,
          }}/>
        </div>
      </div>

      {/* ── KİRA BİLGİSİ ── */}
      {(() => {
        const ortalamaKira = KIRA_VERISI[ilce.slug]
        if (!ortalamaKira) return null
        const kRenk = kiraRengi(ortalamaKira)
        return (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', margin: '0 20px 0',
            background: kRenk + '10', border: `1px solid ${kRenk}25`,
            borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#667781' }}>
              <Banknote size={13} color={kRenk}/>
              Ort. Kira
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: kRenk }}>
              {ortalamaKira.toLocaleString('tr-TR')} TL
            </div>
          </div>
        )
      })()}

      {/* ── PARAMETRELER ── */}
      <div style={{ padding: '12px 20px', flex: 1 }}>
        {PARAMETRELER.map((param, idx) => {
          const skor = (ilce as any)[param.key] as number || 0
          return (
            <div key={param.key} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: idx < PARAMETRELER.length - 1 ? 6 : 0,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: param.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <param.Ikon size={14} color={param.renk} strokeWidth={2.2}/>
              </div>
              <span style={{ fontSize: 13, color: '#374151', width: 68, flexShrink: 0, fontWeight: 500 }}>
                {param.label}
              </span>
              <div style={{ flex: 1, background: '#f1f5f9', height: 5, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: skor + '%',
                  background: param.renk, borderRadius: 99,
                  transition: `width ${800 + idx * 100}ms ease-out`,
                  opacity: skor > 0 ? 1 : 0,
                }}/>
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: skor >= 70 ? param.renk : skor >= 50 ? '#d97706' : '#94a3b8',
                width: 28, textAlign: 'right', flexShrink: 0,
              }}>
                {skor}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: '12px 20px 16px', borderTop: '1px solid #f0f2f5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Popülerlik etiketi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
            {ilce.genel_skor >= 70 ? (
              <><Flame size={13} color="#f59e0b"/><span style={{ fontWeight: 600, color: '#f59e0b' }}>Popüler</span></>
            ) : ilce.guvenlik_skoru >= 70 ? (
              <><Shield size={13} color="#10b981"/><span style={{ fontWeight: 600, color: '#10b981' }}>Güvenli</span></>
            ) : (
              <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}/><span>İstanbul</span></>
            )}
          </div>
          {/* Deprem risk badge */}
          {(() => {
            const depremRenk = ilce.deprem_skoru >= 70 ? '#16a34a' : ilce.deprem_skoru >= 50 ? '#d97706' : '#dc2626'
            const depremEtiket = ilce.deprem_skoru >= 70 ? 'Düşük Risk' : ilce.deprem_skoru >= 50 ? 'Orta Risk' : 'Yüksek Risk'
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px',
                background: depremRenk + '12',
                border: `1px solid ${depremRenk}30`,
                borderRadius: 99,
                fontSize: 11, fontWeight: 600, color: depremRenk,
              }}>
                <AlertTriangle size={10} color={depremRenk}/>
                {depremEtiket}
              </div>
            )
          })()}
        </div>

        <button
          onClick={() => router.push('/ilce/' + ilce.slug)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: hover ? 'linear-gradient(135deg,#075e54,#128c7e)' : '#f8fafb',
            border: hover ? 'none' : '1.5px solid #e2e8f0',
            borderRadius: 10, padding: '8px 16px',
            fontSize: 13, fontWeight: 700,
            color: hover ? 'white' : '#374151',
            cursor: 'pointer', transition: 'all 250ms ease',
          }}
        >
          Detaylı Analiz
          <ArrowRight size={14} color={hover ? 'white' : '#374151'}/>
        </button>
      </div>
    </div>
  )
}

export default IlceKarti
