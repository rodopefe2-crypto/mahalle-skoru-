'use client'

import { useState } from 'react'
import { UtensilsCrossed, Theater, Trees, Users, TrendingUp } from 'lucide-react'
import { MetrikSatiri } from './MetrikSatiri'
import type { SosyalKategori } from '@/lib/sosyalData'

const IKONLAR: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed size={20} />,
  Theater:         <Theater size={20} />,
  Trees:           <Trees size={20} />,
  Users:           <Users size={20} />,
}

export function KategoriKarti({ kategori }: { kategori: SosyalKategori }) {
  const [acik, setAcik] = useState(false)

  const skorYuzde = (kategori.score / 10) * 100
  const skorRenk  = kategori.score >= 8 ? '#25d366'
                  : kategori.score >= 6 ? '#f59e0b'
                  : '#ef4444'

  const birim    = kategori.id === 'lifestyle' ? '%' : 'adet'
  const maxDeger = kategori.id === 'lifestyle'
    ? 100
    : Math.max(...kategori.metrics.map(m => m.value), 1)

  return (
    <div
      onClick={() => setAcik(v => !v)}
      style={{
        background: 'white',
        borderRadius: 16,
        border: `1.5px solid ${acik ? kategori.renk + '40' : '#e9edef'}`,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 250ms ease',
        boxShadow: acik
          ? `0 8px 24px ${kategori.renk}20`
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { if (!acik) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (!acik) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {/* Kart Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: kategori.renk + '15',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: kategori.renk,
          }}>
            {IKONLAR[kategori.ikon]}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21', marginBottom: 2 }}>
              {kategori.title}
            </div>
            <div style={{ fontSize: 12, color: '#667781' }}>
              {kategori.description}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: skorRenk, lineHeight: 1 }}>
            {kategori.score.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>/ 10</div>
        </div>
      </div>

      {/* Skor Barı */}
      <div style={{ background: '#f0f2f5', height: 4, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height: '100%',
          width: skorYuzde + '%',
          background: `linear-gradient(90deg, ${kategori.renk}, ${kategori.renk}cc)`,
          borderRadius: 99,
          transition: 'width 800ms ease-out',
        }} />
      </div>

      {/* Metrikler */}
      <div style={{ marginBottom: acik ? 12 : 0 }}>
        {(acik ? kategori.metrics : kategori.metrics.slice(0, 2)).map(m => (
          <MetrikSatiri
            key={m.label}
            label={m.label}
            value={m.value}
            renk={kategori.renk}
            birim={birim}
            maxValue={maxDeger}
          />
        ))}
      </div>

      {/* Insight */}
      {acik && (
        <div style={{
          background: kategori.renk + '0d',
          border: `1px solid ${kategori.renk}25`,
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 4,
        }}>
          <TrendingUp size={14} color={kategori.renk} />
          <span style={{ fontSize: 12, color: '#374151', fontStyle: 'italic' }}>
            {kategori.insight}
          </span>
        </div>
      )}

      {/* Genişlet göstergesi */}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
        {acik ? '▲ Kapat' : '▼ Detayları gör'}
      </div>
    </div>
  )
}
