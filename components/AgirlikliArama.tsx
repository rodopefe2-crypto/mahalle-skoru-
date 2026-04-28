'use client'

import { useState } from 'react'
import { Slider } from '@radix-ui/react-slider'
import { PARAMETRE_ETIKETLERI, Parametreler } from '@/lib/types'
import { ChevronDown, RotateCcw } from 'lucide-react'

interface AgirlikliAramaProps {
  onWeightsChange: (weights: Parametreler) => void
}

const PARAMETRE_IKONLAR: Record<string, string> = {
  'ulasim': '🚇',
  'imkanlar': '🏪',
  'egitim': '🎓',
  'yasam_maliyeti': '💰',
  'guvenlik': '🛡️',
  'saglik': '🏥',
  'deprem': '⚠️',
  'sakin_memnuniyeti': '😊',
  'yesil_alan': '🌳',
  'kultur': '🎭',
}

export default function AgirlikliArama({ onWeightsChange }: AgirlikliAramaProps) {
  const [expanded, setExpanded] = useState(false)
  const [weights, setWeights] = useState<Parametreler>({
    ulasim: 5,
    imkanlar: 5,
    egitim: 5,
    yasam_maliyeti: 5,
    guvenlik: 5,
    saglik: 5,
    deprem: 5,
    sakin_memnuniyeti: 5,
    yesil_alan: 5,
    kultur: 5,
  })

  const handleWeightChange = (param: keyof Parametreler, value: number[]) => {
    const newWeights = { ...weights, [param]: value[0] }
    setWeights(newWeights)
    onWeightsChange(newWeights)
  }

  const resetWeights = () => {
    const defaultWeights: Parametreler = {
      ulasim: 5,
      imkanlar: 5,
      egitim: 5,
      yasam_maliyeti: 5,
      guvenlik: 5,
      saglik: 5,
      deprem: 5,
      sakin_memnuniyeti: 5,
      yesil_alan: 5,
      kultur: 5,
    }
    setWeights(defaultWeights)
    onWeightsChange(defaultWeights)
  }

  const isDefault = Object.values(weights).every(v => v === 5)

  return (
    <div className="card p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎛️</span>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-900">Sizin için Özelleştir</h2>
            <p className="text-sm text-gray-600">Parametrelerin önemini ayarlayın</p>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-6 animate-adimGiris">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(PARAMETRE_ETIKETLERI).map(([key, label]) => {
              const ikon = PARAMETRE_IKONLAR[key] || '📊'
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-medium text-gray-900">
                      <span>{ikon}</span>
                      <span>{label}</span>
                    </label>
                    <span className="text-lg font-bold text-primary-600">
                      {weights[key as keyof Parametreler]}
                    </span>
                  </div>
                  <Slider
                    value={[weights[key as keyof Parametreler]]}
                    onValueChange={(value) => handleWeightChange(key as keyof Parametreler, value)}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Düşük</span>
                    <span>Yüksek</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={resetWeights}
              disabled={isDefault}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={18} />
              Sıfırla
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="btn-primary flex-1"
            >
              Uygula
            </button>
          </div>
        </div>
      )}
    </div>
  )
}