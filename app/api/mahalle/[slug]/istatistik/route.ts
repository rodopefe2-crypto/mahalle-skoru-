import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: mahalle } = await supabase
    .from('mahalleler')
    .select('id, isim, koordinat_lat, koordinat_lng')
    .eq('slug', slug)
    .single()

  if (!mahalle) {
    return NextResponse.json(
      { error: 'Mahalle bulunamadı' },
      { status: 404 }
    )
  }

  const mLat = mahalle.koordinat_lat as number
  const mLng = mahalle.koordinat_lng as number

  const [{ data: saglikTesisler }, { data: egitimTesisler }] = await Promise.all([
    supabase.rpc('mahalle_tesisler_yakin', {
      p_mahalle_id: mahalle.id,
      p_lat:        mLat,
      p_lng:        mLng,
      p_kategori:   'saglik',
      p_max_km:     0.5,
    }),
    supabase.rpc('mahalle_tesisler_yakin', {
      p_mahalle_id: mahalle.id,
      p_lat:        mLat,
      p_lng:        mLng,
      p_kategori:   'egitim',
      p_max_km:     0.5,
    }),
  ])

  function sayilaraGrup(
    tesisler: { alt_kategori: string; sayi?: number }[] | null
  ): Record<string, number> {
    if (!tesisler) return {}
    return tesisler.reduce((acc: Record<string, number>, t) => {
      acc[t.alt_kategori] = (acc[t.alt_kategori] || 0) + (t.sayi ? Number(t.sayi) : 1)
      return acc
    }, {})
  }

  const istatistikler: Record<string, Record<string, number>> = {
    saglik: sayilaraGrup(saglikTesisler),
    egitim: sayilaraGrup(egitimTesisler),
  }

  const toplam = Object.values(istatistikler).reduce(
    (sum, kat) => sum + Object.values(kat).reduce((s, v) => s + v, 0),
    0
  )

  return NextResponse.json({
    mahalle:       mahalle.isim,
    istatistikler,
    toplam,
  })
}
