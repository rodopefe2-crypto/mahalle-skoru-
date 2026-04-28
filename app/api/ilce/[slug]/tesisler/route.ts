import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const kategori = searchParams.get('kategori')

    if (!kategori) {
      return NextResponse.json({ error: 'kategori parametresi gerekli' }, { status: 400 })
    }

    // İlçeyi bul
    const { data: ilce, error: ilceError } = await supabase
      .from('ilceler')
      .select('id, isim')
      .eq('slug', slug)
      .single()

    if (ilceError || !ilce) {
      return NextResponse.json({ error: 'İlçe bulunamadı' }, { status: 404 })
    }

    // Tesisleri çek
    const kaynak = searchParams.get('kaynak')
    let query = supabase
      .from('ilce_tesisler')
      .select('id, isim, alt_kategori, lat, lng')
      .eq('ilce_id', ilce.id)
      .eq('kategori', kategori)
    if (kaynak) query = query.eq('kaynak', kaynak)
    const { data: tesisler, error: tesisError } = await query

    if (tesisError) {
      return NextResponse.json({ error: 'Tesisler çekilemedi' }, { status: 500 })
    }

    return NextResponse.json({
      kategori,
      ilce: ilce.isim,
      tesisler: tesisler || []
    })
  } catch (error) {
    console.error('API hatası:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
