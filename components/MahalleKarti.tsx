'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Train, HeartPulse, BookOpen, ShoppingBag,
  AlertTriangle, ArrowRight, Banknote,
  Trees, Palette, Shield, Smile,
} from 'lucide-react'
import { KIRA_VERISI, kiraRengi } from '@/lib/kiraVerisi'

export interface MahalleKartiData {
  id:                      string
  slug:                    string
  isim:                    string
  ilce_slug:               string
  ilce_isim:               string
  genel_skor:              number
  ulasim_skoru:            number
  saglik_skoru:            number
  egitim_skoru:            number
  imkanlar_skoru:          number
  deprem_skoru:            number
  yesil_alan_skoru:        number
  kultur_skoru:            number
  guvenlik_skoru:          number
  sakin_memnuniyeti_skoru: number
  kira_ortalama?:          number | null
}

interface Props {
  mahalle:  MahalleKartiData
  sira:     number
  aktifSiralama: string
}

const PARAMETRELER = [
  { key: 'ulasim_skoru',            label: 'Ulaşım',     Ikon: Train,         renk: '#3b82f6', bg: '#eff6ff' },
  { key: 'saglik_skoru',            label: 'Sağlık',     Ikon: HeartPulse,    renk: '#ef4444', bg: '#fef2f2' },
  { key: 'egitim_skoru',            label: 'Eğitim',     Ikon: BookOpen,      renk: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'imkanlar_skoru',          label: 'İmkanlar',   Ikon: ShoppingBag,   renk: '#10b981', bg: '#ecfdf5' },
  { key: 'deprem_skoru',            label: 'Deprem',     Ikon: AlertTriangle, renk: '#f97316', bg: '#fff7ed' },
  { key: 'yesil_alan_skoru',        label: 'Yeşil Alan', Ikon: Trees,         renk: '#22c55e', bg: '#f0fdf4' },
  { key: 'kultur_skoru',            label: 'Kültür',     Ikon: Palette,       renk: '#f59e0b', bg: '#fffbeb' },
  { key: 'guvenlik_skoru',          label: 'Güvenlik',   Ikon: Shield,        renk: '#0ea5e9', bg: '#f0f9ff' },
  { key: 'sakin_memnuniyeti_skoru', label: 'Sakinlik',   Ikon: Smile,         renk: '#ec4899', bg: '#fdf2f8' },
]

function skorRengi(s: number) {
  if (s >= 75) return '#16a34a'
  if (s >= 55) return '#d97706'
  return '#dc2626'
}
function skorEtiketi(s: number) {
  if (s >= 80) return 'Mükemmel'
  if (s >= 70) return 'Çok İyi'
  if (s >= 55) return 'İyi'
  if (s >= 40) return 'Orta'
  return 'Gelişime Açık'
}
function rozetStili(sira: number) {
  if (sira === 1)  return { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: 'white', shadow: '0 2px 8px rgba(251,191,36,0.4)' }
  if (sira === 2)  return { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', color: 'white', shadow: '0 2px 8px rgba(100,116,139,0.3)' }
  if (sira === 3)  return { bg: 'linear-gradient(135deg,#c97c3a,#b45309)', color: 'white', shadow: '0 2px 8px rgba(180,83,9,0.3)' }
  return { bg: '#f1f5f9', color: '#64748b', shadow: 'none' }
}

export function MahalleKarti({ mahalle, sira, aktifSiralama }: Props) {
  const router = useRouter()
  const [hover, setHover] = useState(false)

  const sRenk  = skorRengi(mahalle.genel_skor)
  const rozet  = rozetStili(sira)
  // Mahalle bazlı kira varsa onu, yoksa ilçe ortalamasını göster
  const ortalamaKira = mahalle.kira_ortalama || KIRA_VERISI[mahalle.ilce_slug] || null
  const kiraKaynagi  = mahalle.kira_ortalama ? 'mahalle' : 'ilçe'
  const kRenk  = ortalamaKira ? kiraRengi(ortalamaKira) : '#9ca3af'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'white', borderRadius: 20, overflow: 'hidden',
        border: hover ? '1.5px solid #86efac' : '1.5px solid #e9edef',
        boxShadow: hover ? '0 12px 40px rgba(7,94,84,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hover ? 'translateY(-4px)' : 'none',
        transition: 'all 280ms cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0f2f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{
            background: rozet.bg, color: rozet.color, boxShadow: rozet.shadow,
            borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 800,
          }}>
            #{sira}
          </div>
          <span style={{
            fontSize: 11, color: '#128c7e', fontWeight: 600,
            background: '#dcf8c6', borderRadius: 99, padding: '2px 10px',
          }}>
            {mahalle.ilce_isim}
          </span>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 2, lineHeight: 1.2 }}>
          {mahalle.isim}
        </h3>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>İstanbul · {mahalle.ilce_isim}</p>
      </div>

      {/* ── SKOR BANDI ── */}
      <div style={{
        padding: '12px 20px',
        background: `linear-gradient(135deg,${sRenk}08,${sRenk}04)`,
        borderBottom: '1px solid #f0f2f5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: sRenk, lineHeight: 1 }}>
              {mahalle.genel_skor}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>/ 100</span>
          </div>
          <div style={{ background: sRenk + '18', color: sRenk, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            {skorEtiketi(mahalle.genel_skor)}
          </div>
        </div>
        <div style={{ background: '#e2e8f0', height: 5, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: mahalle.genel_skor + '%', background: `linear-gradient(90deg,${sRenk}cc,${sRenk})`, borderRadius: 99, transition: 'width 1s ease-out' }}/>
        </div>
      </div>

      {/* ── KİRA ── */}
      {ortalamaKira && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 12px', margin: '8px 20px 0',
          background: kRenk + '10', border: `1px solid ${kRenk}25`, borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#667781' }}>
            <Banknote size={12} color={kRenk}/> Ort. Kira (ilçe)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: kRenk }}>
              {ortalamaKira.toLocaleString('tr-TR')} TL
            </div>
            {kiraKaynagi === 'ilçe' && (
              <div style={{ fontSize: 9, color: '#9ca3af' }}>ilçe ort.</div>
            )}
          </div>
        </div>
      )}

      {/* ── PARAMETRELER ── */}
      <div style={{ padding: '10px 20px', flex: 1 }}>
        {PARAMETRELER.map((p, idx) => {
          const skor = (mahalle as any)[p.key] as number || 0
          return (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: idx < PARAMETRELER.length - 1 ? 6 : 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <p.Ikon size={13} color={p.renk} strokeWidth={2.2}/>
              </div>
              <span style={{ fontSize: 12, color: '#374151', width: 58, flexShrink: 0, fontWeight: 500 }}>{p.label}</span>
              <div style={{ flex: 1, background: '#f1f5f9', height: 4, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: skor + '%', background: p.renk, borderRadius: 99, transition: `width ${700 + idx * 80}ms ease-out` }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: skor >= 70 ? p.renk : skor >= 50 ? '#d97706' : '#94a3b8', width: 24, textAlign: 'right', flexShrink: 0 }}>
                {skor}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: '10px 20px 14px', borderTop: '1px solid #f0f2f5' }}>
        <button
          onClick={() => router.push('/mahalle/' + mahalle.slug)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: hover ? 'linear-gradient(135deg,#075e54,#128c7e)' : '#f8fafb',
            border: hover ? 'none' : '1.5px solid #e2e8f0', borderRadius: 10,
            padding: '9px 16px', fontSize: 13, fontWeight: 700,
            color: hover ? 'white' : '#374151', cursor: 'pointer', transition: 'all 250ms ease',
          }}
        >
          Detaylı Analiz <ArrowRight size={14} color={hover ? 'white' : '#374151'}/>
        </button>
      </div>
    </div>
  )
}
