import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ilceSlug = searchParams.get('ilce') || 'kagithane'

  const { data: ilce } = await supabase
    .from('ilceler')
    .select('id')
    .eq('slug', ilceSlug)
    .single()

  if (!ilce) {
    return NextResponse.json({ error: 'İlçe bulunamadı' }, { status: 404 })
  }

  const { data: mahalleler, error } = await supabase
    .from('mahalleler')
    .select(`
      id, isim, slug, aciklama,
      koordinat_lat, koordinat_lng,
      ulasim_skoru, imkanlar_skoru,
      egitim_skoru, saglik_skoru,
      guvenlik_skoru, deprem_skoru,
      yasam_maliyeti_skoru,
      sakin_memnuniyeti_skoru,
      genel_skor
    `)
    .eq('ilce_id', ilce.id)
    .order('genel_skor', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ mahalleler: mahalleler || [] })
}
