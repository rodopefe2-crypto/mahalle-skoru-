import type { SosyalVeri } from '@/lib/sosyalData'

export function SosyalSkorKarti({ veri }: { veri: SosyalVeri }) {
  const skorRenk = veri.overallScore >= 8 ? '#25d366'
                 : veri.overallScore >= 6 ? '#f59e0b'
                 : '#ef4444'
  const r = 52
  const cevre = 2 * Math.PI * r
  const dolgu = (veri.overallScore / 10) * cevre

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f0f2f5" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r}
          fill="none" stroke={skorRenk} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dolgu} ${cevre}`}
          strokeDashoffset={cevre * 0.25}
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
        <text x="60" y="54" textAnchor="middle" fontSize="22" fontWeight="800" fill={skorRenk}>
          {veri.overallScore.toFixed(1)}
        </text>
        <text x="60" y="70" textAnchor="middle" fontSize="10" fill="#9ca3af">/ 10</text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'center' }}>Sosyal Skor</div>
      <div style={{
        background: skorRenk + '15', color: skorRenk,
        borderRadius: 99, padding: '3px 12px', fontSize: 11, fontWeight: 700,
      }}>
        {veri.overallScore >= 8 ? 'Güçlü' : veri.overallScore >= 6 ? 'Orta' : 'Gelişime Açık'}
      </div>
    </div>
  )
}
