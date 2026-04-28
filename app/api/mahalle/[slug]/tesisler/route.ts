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
  const { searchParams } = new URL(request.url)
  const kategori = searchParams.get('kategori')

  const { data: mahalle } = await supabase
    .from('mahalleler')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!mahalle) {
    return NextResponse.json({ error: 'Mahalle bulunamadı' }, { status: 404 })
  }

  let query = supabase
    .from('mahalle_tesisler')
    .select('id, isim, alt_kategori, lat, lng, kategori')
    .eq('mahalle_id', mahalle.id)

  if (kategori) query = query.eq('kategori', kategori)

  const { data: tesisler, error } = await query.limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tesisler: tesisler || [], toplam: tesisler?.length || 0 })
}
