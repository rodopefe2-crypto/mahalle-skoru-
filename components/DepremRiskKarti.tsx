'use client'

interface DepremRiskKartiProps {
  skor:         number
  yorum:        string | null
  fayMesafe:    number | null
  sonYilSayisi: number | null
  maxMag:       number | null
  guncellendi:  string | null
}

export function DepremRiskKarti({ skor, yorum, fayMesafe, sonYilSayisi, maxMag, guncellendi }: DepremRiskKartiProps) {
  const risk = skor >= 75
    ? { label: 'Düşük Risk',     renk: '#25d366', bg: '#f0fdf4' }
    : skor >= 55
    ? { label: 'Orta Risk',      renk: '#f59e0b', bg: '#fffbeb' }
    : skor >= 35
    ? { label: 'Yüksek Risk',    renk: '#f97316', bg: '#fff7ed' }
    : { label: 'Çok Yüksek Risk',renk: '#ef4444', bg: '#fef2f2' }

  const cevre = 2 * Math.PI * 30
  const dolgu = (skor / 100) * cevre

  const metrikler = [
    { ikon: '📏', label: 'Fay Mesafesi',  deger: fayMesafe    ? `~${fayMesafe} km`   : '—' },
    { ikon: '📊', label: '10 Yıl Deprem', deger: sonYilSayisi != null ? `${sonYilSayisi} adet` : '—' },
    { ikon: '⚡', label: 'Maks. Mag.',    deger: maxMag       ? `M${maxMag}`          : '—' },
  ]

  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${risk.renk}30`, padding: '20px 24px', boxShadow: `0 4px 16px ${risk.renk}12` }}>

      {/* Başlık + daire */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: risk.renk, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Deprem Risk Analizi
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111b21' }}>{risk.label}</div>
        </div>

        <svg width={70} height={70} viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="30" fill="none" stroke={risk.bg} strokeWidth="6" />
          <circle cx="35" cy="35" r="30" fill="none" stroke={risk.renk} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dolgu} ${cevre}`}
            strokeDashoffset={cevre * 0.25}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
          <text x="35" y="31" textAnchor="middle" fontSize="14" fontWeight="800" fill={risk.renk}>{skor}</text>
          <text x="35" y="44" textAnchor="middle" fontSize="8" fill="#9ca3af">/100</text>
        </svg>
      </div>

      {/* Metrik kutular */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {metrikler.map(m => (
          <div key={m.label} style={{ background: risk.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{m.ikon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: risk.renk, marginBottom: 2 }}>{m.deger}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Yorum */}
      {yorum && (
        <div style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 12, borderLeft: `3px solid ${risk.renk}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: risk.renk, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📝 Analiz</div>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{yorum}</p>
        </div>
      )}

      {/* Dipnot */}
      <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>⚠️</span>
        <span>
          Veri kaynakları: USGS, AFAD, Fay Hattı Analizi
          {guncellendi && <> · Güncellendi: {new Date(guncellendi).toLocaleDateString('tr-TR')}</>}
        </span>
      </div>
    </div>
  )
}
