'use client'

import { X, Trophy, ArrowRight } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { Ilce } from '@/lib/types'

interface KarsilastirmaPanelProps {
  acik: boolean
  onKapat: () => void
  seciliIlceler: Ilce[]
  onIlceCikar: (id: string) => void
}

const PARAMETRELER = [
  { key: 'ulasim_skoru',            label: 'Ulaşım',    renk: '#3b82f6' },
  { key: 'imkanlar_skoru',          label: 'İmkanlar',  renk: '#10b981' },
  { key: 'egitim_skoru',            label: 'Eğitim',    renk: '#8b5cf6' },
  { key: 'saglik_skoru',            label: 'Sağlık',    renk: '#ef4444' },
  { key: 'guvenlik_skoru',          label: 'Güvenlik',  renk: '#f59e0b' },
  { key: 'deprem_skoru',            label: 'Deprem',    renk: '#f97316' },
  { key: 'yasam_maliyeti_skoru',    label: 'Yaşam',     renk: '#ec4899' },
  { key: 'sakin_memnuniyeti_skoru', label: 'Sakinler',  renk: '#06b6d4' },
]

const RADAR_RENKLER = ['#25d366', '#3b82f6', '#f59e0b']

export default function KarsilastirmaPanel({
  acik, onKapat, seciliIlceler, onIlceCikar,
}: KarsilastirmaPanelProps) {
  const router = useRouter()

  const radarVeri = PARAMETRELER.map(p => ({
    param: p.label,
    ...seciliIlceler.reduce((acc, ilce) => ({
      ...acc,
      [ilce.isim]: ilce[p.key as keyof Ilce] as number,
    }), {} as Record<string, number>),
  }))

  if (seciliIlceler.length === 0) return null

  return (
    <>
      {/* Overlay */}
      {acik && (
        <div
          onClick={onKapat}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 55,
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', zIndex: 60,
        borderRadius: '24px 24px 0 0',
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.2)',
        transform: acik ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* ── BAŞLIK ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f0f2f5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'white', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={18} color="#f59e0b" />
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111b21' }}>
                İlçe Karşılaştırması
              </span>
              <span style={{ fontSize: 13, color: '#667781', marginLeft: 8 }}>
                {seciliIlceler.length} ilçe
              </span>
            </div>
          </div>
          <button
            onClick={onKapat}
            style={{
              width: 32, height: 32, background: '#f0f2f5', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f0f2f5')}
          >
            <X size={16} color="#374151" />
          </button>
        </div>

        {/* ── RADAR CHART ── */}
        <div style={{ padding: 24, background: '#fafbfc', borderBottom: '1px solid #f0f2f5' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
            Genel Karşılaştırma
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarVeri}>
              <PolarGrid stroke="#e9edef" />
              <PolarAngleAxis dataKey="param" tick={{ fontSize: 11, fill: '#667781' }} />
              {seciliIlceler.map((ilce, idx) => (
                <Radar
                  key={ilce.id}
                  name={ilce.isim}
                  dataKey={ilce.isim}
                  fill={RADAR_RENKLER[idx]}
                  fillOpacity={0.15}
                  stroke={RADAR_RENKLER[idx]}
                  strokeWidth={2}
                  dot={{ fill: RADAR_RENKLER[idx], r: 3 } as any}
                />
              ))}
              <Legend formatter={v => (
                <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>
              )} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ── PARAMETRE TABLOSU ── */}
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>
            Parametre Detayları
          </p>

          {PARAMETRELER.map(p => {
            const degerler = seciliIlceler.map(i => ({
              ilce: i,
              val: i[p.key as keyof Ilce] as number,
            }))
            const maxVal = Math.max(...degerler.map(d => d.val))
            const kazanan = degerler.find(d => d.val === maxVal)?.ilce

            return (
              <div key={p.key} style={{ marginBottom: 20 }}>
                {/* Başlık + kazanan badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.label}</span>
                  {kazanan && (
                    <span style={{
                      background: p.renk + '20', color: p.renk,
                      borderRadius: 99, padding: '2px 8px', fontSize: 10,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Trophy size={10} />
                      {kazanan.isim}
                    </span>
                  )}
                </div>

                {/* İlçe barları */}
                {degerler.map(({ ilce, val }, idx) => {
                  const enYuksek = val === maxVal
                  return (
                    <div key={ilce.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80, flexShrink: 0 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: RADAR_RENKLER[idx],
                        }} />
                        <span style={{ fontSize: 12, color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ilce.isim}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: 8, borderRadius: 99, background: '#f0f2f5', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: RADAR_RENKLER[idx],
                          width: `${val}%`,
                          transition: 'width 500ms ease',
                          boxShadow: enYuksek ? `0 0 6px ${RADAR_RENKLER[idx]}80` : 'none',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: RADAR_RENKLER[idx], width: 36, textAlign: 'right', flexShrink: 0 }}>
                        {val}{enYuksek ? ' 🏆' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── KART ÖZETLERİ ── */}
        <div style={{
          padding: '0 24px 24px',
          display: 'grid',
          gridTemplateColumns: `repeat(${seciliIlceler.length}, 1fr)`,
          gap: 16,
        }}>
          {seciliIlceler.map((ilce, idx) => {
            const enGucluParam = PARAMETRELER.reduce((best, p) => {
              const val = ilce[p.key as keyof Ilce] as number
              const bestVal = ilce[best.key as keyof Ilce] as number
              return val > bestVal ? p : best
            }, PARAMETRELER[0])

            const C = 150, r = 23
            const fill = (ilce.genel_skor / 100) * C

            return (
              <div key={ilce.id} style={{
                background: 'white', borderRadius: 16,
                border: `1.5px solid ${RADAR_RENKLER[idx]}40`,
                padding: 16,
              }}>
                {/* Üst: İsim + mini skor dairesi */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111b21' }}>{ilce.isim}</div>
                    <div style={{ fontSize: 11, color: '#667781', marginTop: 2 }}>{ilce.aciklama.slice(0, 30)}…</div>
                  </div>
                  <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                    <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={24} cy={24} r={r} fill="none" stroke="#f0f2f5" strokeWidth={4} />
                      <circle cx={24} cy={24} r={r} fill="none"
                        stroke={RADAR_RENKLER[idx]} strokeWidth={4} strokeLinecap="round"
                        strokeDasharray={`${fill} ${C}`}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: RADAR_RENKLER[idx] }}>{ilce.genel_skor}</span>
                    </div>
                  </div>
                </div>

                {/* En güçlü özellik */}
                <div style={{ fontSize: 12, color: '#25d366', marginBottom: 10 }}>
                  💪 {enGucluParam.label}
                </div>

                {/* Detay butonu */}
                <button
                  onClick={() => router.push('/ilce/' + ilce.slug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: RADAR_RENKLER[idx], fontSize: 13, fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Detaylı İncele
                  <ArrowRight size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
