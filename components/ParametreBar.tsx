'use client'

import { useEffect, useState } from 'react'
import { PARAMETRE_ETIKETLERI } from '@/lib/types'

interface ParametreBarProps {
  param: string
  skor: number
}

const PARAMETRE_IKONLAR: Record<string, string> = {
  ulasim: '🚇', imkanlar: '🏪', egitim: '🎓', yasam_maliyeti: '💰',
  guvenlik: '🛡', saglik: '🏥', deprem: '⚠', sakin_memnuniyeti: '😊',
}

const PARAMETRE_RENKLERI: Record<string, string> = {
  ulasim: '#3B82F6', imkanlar: '#8B5CF6', egitim: '#06B6D4',
  yasam_maliyeti: '#F59E0B', guvenlik: '#10B981', saglik: '#EF4444',
  deprem: '#EF4444', sakin_memnuniyeti: '#84CC16',
}

export default function ParametreBar({ param, skor }: ParametreBarProps) {
  const [displaySkor, setDisplaySkor] = useState(0)
  const label = PARAMETRE_ETIKETLERI[param as keyof typeof PARAMETRE_ETIKETLERI] || param
  const ikon = PARAMETRE_IKONLAR[param] || '📊'
  const renk = PARAMETRE_RENKLERI[param] || '#6B7280'

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += skor / 30
      if (current >= skor) {
        setDisplaySkor(skor)
        clearInterval(interval)
      } else {
        setDisplaySkor(Math.floor(current))
      }
    }, 20)
    return () => clearInterval(interval)
  }, [skor])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 font-semibold text-gray-900">
          <span>{ikon}</span>
          <span>{label}</span>
        </label>
        <span className="text-lg font-bold" style={{ color: renk }}>
          {displaySkor}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-600 ease-out"
          style={{ width: `${displaySkor}%`, backgroundColor: renk }}
        />
      </div>
    </div>
  )
}
