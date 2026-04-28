'use client'

import { useEffect, useRef, useState } from 'react'
import { getIkon } from '@/lib/ikonlar'

export interface TesisWithKategori {
  id: string
  isim: string | null
  alt_kategori: string
  lat: number
  lng: number
  kategoriKey: string
}

interface HaritaIciProps {
  center: [number, number]
  tesisler: TesisWithKategori[]
  onMapReady: (map: any) => void
  tileAttribution: string
  height?: string
  zoom?: number
}

const RENK: Record<string, string> = {
  ulasim:            '#3B82F6', imkanlar:          '#10B981',
  egitim:            '#8B5CF6', saglik:            '#EF4444',
  guvenlik:          '#F59E0B', deprem:            '#F97316',
  yasam_maliyeti:    '#EC4899', sakin_memnuniyeti: '#06B6D4',
}

function pinHtml(renk: string, altKat: string) {
  return `<div style="background:${renk};width:32px;height:32px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">${getIkon(altKat)}</div>`
}

export default function HaritaIci({
  center, tesisler, onMapReady, tileAttribution,
  height = '500px', zoom = 13,
}: HaritaIciProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const layerRef     = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // Haritayı bir kez oluştur
  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    import('leaflet').then(({ default: L }) => {
      if (!mounted || !containerRef.current) return

      const map = L.map(containerRef.current, { center, zoom })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: tileAttribution,
        maxZoom: 19,
      }).addTo(map)

      const layer = L.layerGroup().addTo(map)
      mapRef.current   = map
      layerRef.current = layer
      onMapReady(map)
      setTimeout(() => { try { map.invalidateSize() } catch {} }, 150)
      setReady(true)
    })

    return () => {
      mounted = false
      if (mapRef.current) {
        try { mapRef.current.remove() } catch {}
        mapRef.current   = null
        layerRef.current = null
      }
    }
  }, []) // sadece mount/unmount

  // Pinleri güncelle
  useEffect(() => {
    if (!ready || !layerRef.current) return

    import('leaflet').then(({ default: L }) => {
      if (!layerRef.current) return
      layerRef.current.clearLayers()

      for (const t of tesisler) {
        const renk = RENK[t.kategoriKey] || '#6B7280'
        const icon = L.divIcon({
          html:        pinHtml(renk, t.alt_kategori),
          iconSize:    [32, 32],
          iconAnchor:  [16, 16],
          popupAnchor: [0, -18],
          className:   '',
        })
        L.marker([t.lat, t.lng], { icon })
          .bindPopup(
            `<div style="font-size:13px;min-width:120px">
               <b>${t.isim || t.alt_kategori}</b>
               <br/><span style="color:#6B7280;font-size:11px;text-transform:capitalize">${t.alt_kategori}</span>
             </div>`
          )
          .addTo(layerRef.current)
      }
    })
  }, [tesisler, ready])

  return <div ref={containerRef} style={{ height, width: '100%' }} />
}
