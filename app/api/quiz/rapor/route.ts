import { NextRequest, NextResponse } from 'next/server'
import { QUIZ_SORULARI } from '@/lib/quizSorulari'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.startsWith('sk-ant-BURAYA')) {
    return NextResponse.json({ rapor: null, hata: 'API key eksik' }, { status: 200 })
  }

  try {
    const { cevaplar, topIlceler, topMahalleler } = await req.json()

    // Kullanıcı profilini okunabilir formata çevir
    const profilSatirlar = Object.entries(cevaplar as Record<string, { value: string }>)
      .map(([soruId, cevap]) => {
        const soru = QUIZ_SORULARI.find(s => s.id === soruId)
        const secenek = soru?.secenekler.find(s => s.value === cevap.value)
        return soru && secenek ? `- ${soru.soru} → ${secenek.label}` : null
      })
      .filter(Boolean)
      .join('\n')

    const ilceBilgi = (topIlceler as any[]).slice(0, 3).map((ilce: any, i: number) => `
${i + 1}. ${ilce.isim} — Uyum: %${ilce.uyumYuzdesi}
   Ulaşım: ${ilce.skorlar?.ulasim ?? '?'} | Güvenlik: ${ilce.skorlar?.guvenlik ?? '?'} | İmkanlar: ${ilce.skorlar?.imkanlar ?? '?'}
   Eğitim: ${ilce.skorlar?.egitim ?? '?'} | Sağlık: ${ilce.skorlar?.saglik ?? '?'} | Yeşil Alan: ${ilce.skorlar?.yesil_alan ?? '?'}
   Kültür: ${ilce.skorlar?.kultur ?? '?'} | Yaşam Maliyeti Skoru: ${ilce.skorlar?.yasam_maliyeti ?? '?'}/100`
    ).join('\n')

    const mahalleBilgi = (topMahalleler as any[]).slice(0, 6).map((m: any) =>
      `- ${m.isim} (${(m.ilce as any)?.isim ?? ''}): Genel ${m.genel_skor}/100${m.kira_ortalama ? `, Kira ~${m.kira_ortalama.toLocaleString('tr')} TL` : ''}`
    ).join('\n')

    const prompt = `Sen İstanbul mahalle analiz uzmanısın. Kullanıcının quiz cevaplarına ve İstanbul mahalle verilerine göre kişiselleştirilmiş bir taşınma raporu yaz.

KULLANICI PROFİLİ:
${profilSatirlar}

ÖNERİLEN İLÇELER VE SKORLARI:
${ilceBilgi}

ÖNERİLEN MAHALLELER:
${mahalleBilgi}

Şu formatta Türkçe rapor yaz (başlıkları ## ile işaretle):

## Profil Özeti
Kullanıcının yaşam tarzını 2-3 cümleyle özetle.

## Neden ${(topIlceler as any[])[0]?.isim}?
Bu ilçenin neden bu kullanıcıya uygun olduğunu 3-4 cümleyle açıkla. Spesifik skorlara değin.

## Önerilen Mahalleler
Top 3 mahalleyi ve neden uygun olduklarını kısa açıkla.

## Dikkat Edilmesi Gerekenler
Kullanıcının önceliklerine göre 2-3 potansiyel dezavantaj.

## Taşınma Önerileri
3-4 pratik tavsiye madde olarak.

Raporu samimi, kişisel ve bilgilendirici yaz. Jargon kullanma.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const rapor = data.content?.[0]?.text || null
    return NextResponse.json({ rapor })
  } catch (e) {
    console.error('Rapor hatası:', e)
    return NextResponse.json({ rapor: null }, { status: 200 })
  }
}
