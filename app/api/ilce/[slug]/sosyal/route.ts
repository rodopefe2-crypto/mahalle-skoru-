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

  const { data: ilce, error: ilceErr } = await supabase
    .from('ilceler')
    .select('id, isim')
    .eq('slug', slug)
    .single()

  if (ilceErr || !ilce) {
    return NextResponse.json({ error: 'İlçe bulunamadı' }, { status: 404 })
  }

  // imkanlar + kultur kategorilerini paralel çek
  const [imkanlarRes, kulturRes] = await Promise.all([
    supabase
      .from('ilce_tesisler')
      .select('alt_kategori, isim, lat, lng, kategori')
      .eq('ilce_id', ilce.id)
      .eq('kategori', 'imkanlar'),
    supabase
      .from('ilce_tesisler')
      .select('alt_kategori, isim, lat, lng, kategori')
      .eq('ilce_id', ilce.id)
      .eq('kategori', 'kultur'),
  ])

  const tumTesisler = [
    ...(imkanlarRes.data || []),
    ...(kulturRes.data || []),
  ]

  // alt_kategori bazında say
  const gruplar: Record<string, number> = {}
  tumTesisler.forEach(t => {
    const k = t.alt_kategori || 'diger'
    gruplar[k] = (gruplar[k] || 0) + 1
  })

  return NextResponse.json({
    ilce: ilce.isim,
    toplam: tumTesisler.length,
    gruplar,
  })
}
