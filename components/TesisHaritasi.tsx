'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { TesisWithKategori } from './HaritaIci'

const HaritaIci = dynamic(() => import('./HaritaIci'), {
  ssr: false,
  loading: () => <div style={{ height: '500px' }} className="bg-gray-100 animate-pulse rounded-lg" />,
})

interface Tesis {
  id: string
  isim: string | null
  alt_kategori: string
  lat: number
  lng: number
}

interface TesisHaritasiProps {
  ilceAdi: string
  ilceMerkez: { lat: number; lng: number }
  kategori: string | null
  ilceSlug: string
  tumKategoriler?: boolean
  onKategoriChange?: (k: string | null) => void
}

const KATEGORI_RENKLERI: Record<string, string> = {
  ulasim:            '#3B82F6',
  imkanlar:          '#10B981',
  egitim:            '#8B5CF6',
  saglik:            '#EF4444',
  guvenlik:          '#F59E0B',
  deprem:            '#F97316',
  yasam_maliyeti:    '#EC4899',
  sakin_memnuniyeti: '#06B6D4',
}

const KATEGORI_ETIKETLERI: Record<string, string> = {
  ulasim:            'Ulaşım',
  imkanlar:          'İmkanlar',
  egitim:            'Eğitim',
  saglik:            'Sağlık',
  guvenlik:          'Güvenlik',
  deprem:            'Deprem',
  yasam_maliyeti:    'Yaşam Maliyeti',
  sakin_memnuniyeti: 'Memnuniyet',
}

const KATEGORI_BASLIKLAR: Record<string, string> = {
  ulasim:            'Ulaşım Tesisleri',
  imkanlar:          'İmkanlar',
  egitim:            'Eğitim Tesisleri',
  saglik:            'Sağlık Tesisleri',
  guvenlik:          'Güvenlik Tesisleri',
  deprem:            'Deprem Direnci',
  yasam_maliyeti:    'Yaşam Maliyeti',
  sakin_memnuniyeti: 'Sakin Memnuniyeti',
}

const HARITA_KATEGORILER = [
  { key: 'ulasim',            kaynak: null },
  { key: 'imkanlar',          kaynak: 'foursquare' },
  { key: 'egitim',            kaynak: null },
  { key: 'saglik',            kaynak: null },
  { key: 'guvenlik',          kaynak: null },
  { key: 'deprem',            kaynak: null },
  { key: 'yasam_maliyeti',    kaynak: null },
  { key: 'sakin_memnuniyeti', kaynak: null },
]

export default function TesisHaritasi({
  ilceAdi,
  ilceMerkez,
  kategori,
  ilceSlug,
  tumKategoriler = false,
  onKategoriChange,
}: TesisHaritasiProps) {
  const [tumTesisler, setTumTesisler] = useState<Record<string, Tesis[]>>({})
  const [loading, setLoading]         = useState(false)
  const [map, setMap]                 = useState<any>(null)

  useEffect(() => {
    if (tumKategoriler && ilceSlug) fetchAll()
  }, [ilceSlug, tumKategoriler])

  const fetchAll = async () => {
    setLoading(true)
    const results = await Promise.allSettled(
      HARITA_KATEGORILER.map(async ({ key, kaynak }) => {
        const qs = kaynak ? `kategori=${key}&kaynak=${kaynak}` : `kategori=${key}`
        const res  = await fetch(`/api/ilce/${ilceSlug}/tesisler?${qs}`)
        const data = await res.json()
        return { key, tesisler: (data.tesisler || []) as Tesis[] }
      })
    )
    const byKat: Record<string, Tesis[]> = {}
    results.forEach(r => {
      if (r.status === 'fulfilled') byKat[r.value.key] = r.value.tesisler
    })
    setTumTesisler(byKat)
    setLoading(false)
  }

  const displayTesisler = useMemo<TesisWithKategori[]>(() => {
    if (kategori) {
      return (tumTesisler[kategori] || []).map(t => ({ ...t, kategoriKey: kategori }))
    }
    return Object.entries(tumTesisler).flatMap(([key, list]) =>
      list.map(t => ({ ...t, kategoriKey: key }))
    )
  }, [tumTesisler, kategori])

  const fitBounds = useCallback(() => {
    if (!map || displayTesisler.length === 0) return
    map.fitBounds(
      displayTesisler.map(t => [t.lat, t.lng] as [number, number]),
      { padding: [32, 32] }
    )
  }, [map, displayTesisler])

  useEffect(() => {
    if (displayTesisler.length > 0 && map) fitBounds()
  }, [displayTesisler.length, map])

  const aktifKategoriler = useMemo(
    () => Object.entries(tumTesisler).filter(([, t]) => t.length > 0).map(([k]) => k),
    [tumTesisler]
  )

  const baslik = kategori
    ? `${ilceAdi} — ${KATEGORI_BASLIKLAR[kategori] ?? KATEGORI_ETIKETLERI[kategori]}`
    : `${ilceAdi} Tesis Haritası`

  const tileAttribution = kategori === 'imkanlar'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Mekan verisi: Foursquare OS Places'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  return (
    <div className="card p-6">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold" style={{ color: '#075e54' }}>{baslik}</h3>
      </div>

      {/* Harita */}
      <div className="relative w-full rounded-lg border" style={{ height: '500px' }}>

        <HaritaIci
          key={ilceSlug}
          center={[ilceMerkez.lat, ilceMerkez.lng]}
          tesisler={displayTesisler}
          onMapReady={setMap}
          tileAttribution={tileAttribution}
        />

        {/* Yükleniyor */}
        {loading && (
          <div className="absolute inset-0 z-[1001] bg-white/70 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-teal-600" size={28} />
              <span className="text-sm text-gray-600">Tesisler yükleniyor...</span>
            </div>
          </div>
        )}

        {/* Boş kategori mesajı */}
        {!loading && kategori && displayTesisler.length === 0 && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 rounded-xl px-5 py-3 text-sm font-medium text-gray-600 shadow-lg text-center">
              <div>📭 Bu kategori için henüz tesis verisi yok</div>
              <div className="text-xs text-gray-400 mt-1">{KATEGORI_BASLIKLAR[kategori]} haritada gösterilemiyor</div>
            </div>
          </div>
        )}

        {/* Lejand — sol üst */}
        {aktifKategoriler.length > 0 && !loading && (
          <div className="absolute top-2 left-2 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md space-y-1">
            {aktifKategoriler.map(key => (
              <div
                key={key}
                className={`flex items-center gap-2 text-xs transition-opacity ${
                  kategori && kategori !== key ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span
                  className="inline-block rounded-full flex-shrink-0"
                  style={{ width: 10, height: 10, background: KATEGORI_RENKLERI[key] }}
                />
                <span className={kategori === key ? 'font-bold text-gray-800' : 'text-gray-600'}>
                  {KATEGORI_ETIKETLERI[key]}
                  <span className="text-gray-400 ml-1">({tumTesisler[key]?.length ?? 0})</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sağ üst */}
        {!loading && displayTesisler.length > 0 && (
          <div className="absolute top-2 right-2 z-[1000] flex gap-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs font-semibold shadow pointer-events-none select-none">
              📍 {displayTesisler.length} tesis
            </div>
            <button
              onClick={fitBounds}
              className="bg-white/90 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs font-semibold shadow hover:bg-white transition-colors"
            >
              Tümünü Sığdır
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
