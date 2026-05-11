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

  const { data: mahalle, error } = await supabase
    .from('mahalleler')
    .select(`
      id, isim, slug, aciklama,
      koordinat_lat, koordinat_lng,
      ulasim_skoru, imkanlar_skoru,
      egitim_skoru, saglik_skoru,
      guvenlik_skoru, deprem_skoru,
      yasam_maliyeti_skoru,
      sakin_memnuniyeti_skoru,
      yesil_alan_skoru, kultur_skoru,
      genel_skor, ilce_id,
      deprem_yorum, deprem_fay_mesafe,
      deprem_son_yil, deprem_max_mag,
      deprem_guncellendi,
      nufus, alan_km2, kira_ortalama
    `)
    .eq('slug', slug)
    .single()

  if (error || !mahalle) {
    return NextResponse.json({ error: 'Mahalle bulunamadı' }, { status: 404 })
  }

  const { data: ilce } = await supabase
    .from('ilceler')
    .select('isim, slug')
    .eq('id', mahalle.ilce_id)
    .single()

  return NextResponse.json({ mahalle: { ...mahalle, ilce } })
}
