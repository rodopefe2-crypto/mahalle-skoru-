'use client'

import { Yorum } from '@/lib/types'
import { Star } from 'lucide-react'

interface YorumKartiProps {
  yorum: Yorum
}

const KULLANICI_IKONLAR: Record<string, string> = {
  kiraciu: '🏠',
  ev_sahibi: '🏘️',
  calisan: '💼',
  ogrenci: '🎓',
  emekli: '🎩',
}

export default function YorumKarti({ yorum }: YorumKartiProps) {
  const tarih = new Date(yorum.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const ikon = KULLANICI_IKONLAR[yorum.kullanici_tipi] || '👤'

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{ikon}</div>
          <div>
            <p className="font-semibold text-gray-900 capitalize">{yorum.kullanici_tipi}</p>
            <p className="text-xs text-gray-500">{yorum.ikamet_suresi} - {tarih}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < yorum.memnuniyet_puani ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">Guvenlik:</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < yorum.guvenlik_puani ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed">{yorum.yorum_metni}</p>
    </div>
  )
}
