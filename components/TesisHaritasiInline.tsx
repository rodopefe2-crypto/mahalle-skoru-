'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { TesisWithKategori } from './HaritaIci'

const HaritaIci = dynamic(() => import('./HaritaIci'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse" />,
})

interface Props {
  ilceMerkez: { lat: number; lng: number }
  ilceSlug: string
  kategori: string
  kaynak?: 'ilce' | 'mahalle'
}

const KAYNAK: Record<string, string> = { imkanlar: 'foursquare' }

const RENK: Record<string, string> = {
  ulasim:    '#3B82F6', imkanlar:  '#10B981',
  egitim:    '#8B5CF6', saglik:    '#EF4444',
  guvenlik:  '#F59E0B', deprem:    '#F97316',
  yasam_maliyeti: '#EC4899', sakin_memnuniyeti: '#06B6D4',
}

export default function TesisHaritasiInline({ ilceMerkez, ilceSlug, kategori, kaynak: kaynakProp }: Props) {
  const [tesisler, setTesisler] = useState<TesisWithKategori[]>([])
  const [loading, setLoading]   = useState(true)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setTesisler([])

    const qs = kaynakProp !== 'mahalle' && KAYNAK[kategori]
      ? `kategori=${kategori}&kaynak=${KAYNAK[kategori]}`
      : `kategori=${kategori}`
    const apiBase = kaynakProp === 'mahalle'
      ? `/api/mahalle/${ilceSlug}/tesisler`
      : `/api/ilce/${ilceSlug}/tesisler`

    fetch(`${apiBase}?${qs}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const rows = (data.tesisler || []).map((t: any) => ({ ...t, kategoriKey: kategori }))
        setTesisler(rows)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [ilceSlug, kategori])

  useEffect(() => {
    if (tesisler.length > 0 && mapRef.current) {
      setTimeout(() => {
        try {
          mapRef.current.fitBounds(
            tesisler.map(t => [t.lat, t.lng]),
            { padding: [20, 20] }
          )
        } catch {}
      }, 200)
    }
  }, [tesisler, mapRef.current])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-teal-600" size={22} />
      </div>
    )
  }

  if (tesisler.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-sm text-gray-400">
        Bu kategori için harita verisi yok
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '288px', width: '100%' }}>
      <HaritaIci
        key={`inline-${ilceSlug}-${kategori}`}
        center={[ilceMerkez.lat, ilceMerkez.lng]}
        tesisler={tesisler}
        onMapReady={m => { mapRef.current = m }}
        tileAttribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        height="288px"
        zoom={14}
      />
      <div
        style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 1000,
          background: RENK[kategori] ?? '#6B7280', color: 'white',
          borderRadius: 6, padding: '3px 8px', fontSize: 12,
          fontWeight: 600, pointerEvents: 'none',
        }}
      >
        📍 {tesisler.length} tesis
      </div>
    </div>
  )
}
