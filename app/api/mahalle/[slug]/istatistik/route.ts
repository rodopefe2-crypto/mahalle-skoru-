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
    .select('id, isim')
    .eq('slug', slug)
    .single()

  if (!mahalle) {
    return NextResponse.json(
      { error: 'Mahalle bulunamadı' },
      { status: 404 }
    )
  }

  const tumTesisler: { kategori: string; alt_kategori: string }[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('mahalle_tesisler')
      .select('kategori, alt_kategori')
      .eq('mahalle_id', mahalle.id)
      .range(offset, offset + 999)

    if (!data || data.length === 0) break
    tumTesisler.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }

  const gruplar: Record<string, Record<string, number>> = {}
  tumTesisler.forEach(t => {
    const kat    = t.kategori     || 'diger'
    const altKat = t.alt_kategori || 'diger'
    if (!gruplar[kat]) gruplar[kat] = {}
    gruplar[kat][altKat] = (gruplar[kat][altKat] || 0) + 1
  })

  return NextResponse.json({
    mahalle:       mahalle.isim,
    istatistikler: gruplar,
    toplam:        tumTesisler.length,
  })
}
