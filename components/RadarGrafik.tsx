'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { Ilce, PARAMETRE_ETIKETLERI } from '@/lib/types'

interface RadarGrafikProps {
  ilce: Ilce
}

export default function RadarGrafik({ ilce }: RadarGrafikProps) {
  const data = Object.entries(PARAMETRE_ETIKETLERI).map(([key, label]) => ({
    parametre: label,
    skor: ilce[key as keyof Ilce] as number,
  }))

  return (
    <div className="w-full h-80 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="parametre" fontSize={11} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Radar
            name={ilce.isim}
            dataKey="skor"
            stroke="#1B4FD8"
            fill="#1B4FD8"
            fillOpacity={0.15}
            isAnimationActive={true}
            animationDuration={800}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
            }}
            formatter={(value) => `${Math.round(value as number)}/100`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}