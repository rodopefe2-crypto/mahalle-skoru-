import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ray-casting point-in-polygon (GeoJSON Polygon coordinates: [lng, lat][])
function pointInPolygon(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

type TesisRow = { kategori: string; alt_kategori: string; isim: string; lat: number; lng: number }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: mahalle } = await supabase
    .from('mahalleler')
    .select('id, isim, ilce_id, koordinat_lat, koordinat_lng')
    .eq('slug', slug)
    .single()

  if (!mahalle) {
    return NextResponse.json({ error: 'Mahalle bulunamadı' }, { status: 404 })
  }

  // Boundary + ilçe tesisleri paralel çek
  const [{ data: boundaryGeoJson }, { data: ilceTesisler }] = await Promise.all([
    supabase.rpc('get_mahalle_boundary_geojson', { p_mahalle_id: mahalle.id }),
    supabase
      .from('ilce_tesisler')
      .select('kategori, alt_kategori, isim, lat, lng')
      .eq('ilce_id', mahalle.ilce_id)
      .eq('kaynak', 'osm')
      .in('kategori', ['saglik', 'egitim', 'kultur', 'yesil'])
      .not('isim', 'is', null)
      .neq('isim', ''),
  ])

  // Poligon ring'i çıkar (Polygon ya da MultiPolygon)
  let ring: number[][] | null = null
  if (boundaryGeoJson) {
    if (boundaryGeoJson.type === 'Polygon') {
      ring = boundaryGeoJson.coordinates[0]
    } else if (boundaryGeoJson.type === 'MultiPolygon') {
      // En büyük ring'i al
      ring = (boundaryGeoJson.coordinates as number[][][][])
        .map((p: number[][][]) => p[0])
        .sort((a: number[][], b: number[][]) => b.length - a.length)[0]
    }
  }

  // Filtreleme: poligon içi veya 500m yarıçap
  const filtered: TesisRow[] = (ilceTesisler || []).filter(t => {
    if (!t.lat || !t.lng) return false
    if (ring) return pointInPolygon(t.lng, t.lat, ring)
    return haversineKm(mahalle.koordinat_lat, mahalle.koordinat_lng, t.lat, t.lng) <= 0.5
  })

  // Kategori → alt_kategori → TesisRow[] yapısı
  const BOŞ = (): TesisRow[] => []
  const f = (kat: string, alt: string | string[]) => {
    const altlar = Array.isArray(alt) ? alt : [alt]
    return filtered.filter(t => t.kategori === kat && altlar.includes(t.alt_kategori))
  }

  const tesisGruplari = {
    saglik: {
      hospital: f('saglik', ['hospital', 'hastane']),
      clinic:   f('saglik', ['clinic', 'klinik']),
      pharmacy: f('saglik', ['pharmacy', 'eczane']),
      dentist:  f('saglik', 'dentist'),
      doctors:  f('saglik', ['doctors', 'doktor']),
    },
    egitim: {
      university:   f('egitim', ['university', 'universite']),
      school:       f('egitim', ['school', 'okul']),
      college:      f('egitim', 'college'),
      kindergarten: f('egitim', ['kindergarten', 'anaokulu']),
      library:      f('egitim', ['library', 'kutuphane']),
    },
    kultur: {
      museum:        f('kultur', ['museum', 'muze']),
      art_gallery:   f('kultur', ['art_gallery', 'galeri']),
      movie_theater: f('kultur', ['movie_theater', 'sinema', 'cinema']),
      theatre:       f('kultur', ['theatre', 'tiyatro']),
      library:       f('kultur', ['library', 'kutuphane']),
    },
    yesil: {
      park:            f('yesil', 'park'),
      natural_feature: f('yesil', ['natural_feature', 'sahil', 'orman']),
      playground:      f('yesil', 'playground'),
      sports_centre:   f('yesil', ['sports_centre', 'spor']),
      garden:          f('yesil', ['garden', 'meydan']),
    },
  }

  // istatistikler: mevcut format, sayılardan oluşan
  const istatistikler: Record<string, Record<string, number>> = {}
  for (const [kat, altlar] of Object.entries(tesisGruplari)) {
    istatistikler[kat] = {}
    for (const [altKat, liste] of Object.entries(altlar)) {
      if (liste.length > 0) istatistikler[kat][altKat] = liste.length
    }
  }

  const toplam = filtered.length

  return NextResponse.json({
    mahalle:      mahalle.isim,
    istatistikler,
    toplam,
    tesisListesi: tesisGruplari,
    hasBoundary:  !!ring,
  })
}
