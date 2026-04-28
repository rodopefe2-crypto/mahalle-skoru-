'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Ilce } from '@/lib/types'

const PARAMS = [
  { key: 'ulasim_skoru',            label: 'Ulaşım'    },
  { key: 'imkanlar_skoru',          label: 'İmkanlar'  },
  { key: 'egitim_skoru',            label: 'Eğitim'    },
  { key: 'saglik_skoru',            label: 'Sağlık'    },
  { key: 'guvenlik_skoru',          label: 'Güvenlik'  },
  { key: 'deprem_skoru',            label: 'Deprem'    },
  { key: 'yasam_maliyeti_skoru',    label: 'Yaşam'     },
  { key: 'sakin_memnuniyeti_skoru', label: 'Memnuniyet'},
]

function barRenk(v: number) {
  if (v >= 75) return '#25d366'
  if (v >= 50) return '#128c7e'
  return '#d97706'
}

export default function AnalizPaneli({ ilce }: { ilce: Ilce }) {
  const radarData = PARAMS.map(p => ({
    subject: p.label,
    value: (ilce[p.key as keyof Ilce] as number) || 0,
    fullMark: 100,
  }))

  const barData = [...PARAMS]
    .map(p => ({ name: p.label, value: (ilce[p.key as keyof Ilce] as number) || 0 }))
    .sort((a, b) => b.value - a.value)

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* Radar */}
      <div style={{ flex: 1, minWidth: 280 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#667781', marginBottom: 8, textAlign: 'center' }}>Radar Görünümü</p>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e9edef" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#667781' }} />
            <Radar
              dataKey="value"
              stroke="#075e54"
              fill="#25d366"
              fillOpacity={0.15}
              dot={{ fill: '#075e54', r: 4 }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e9edef' }}
              formatter={(v: any) => [v, 'Skor']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar */}
      <div style={{ flex: 1, minWidth: 260 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#667781', marginBottom: 8, textAlign: 'center' }}>Parametre Sıralaması</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical" barCategoryGap={6}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: '#374151' }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e9edef' }}
              formatter={(v: any) => [v, 'Skor']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={barRenk(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
