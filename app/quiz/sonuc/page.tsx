'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Trophy, ArrowRight, RotateCcw,
  Share2, CheckCircle, XCircle,
} from 'lucide-react'
import { agirliklarHesapla, ilceleriPuanla } from '@/lib/oneriMotoru'
import { QuizCevap, IlceUyumSkoru } from '@/lib/quizTypes'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const YUKLEME_ADIMLAR = [
  'Ulaşım analiz ediliyor',
  'Güvenlik hesaplanıyor',
  'Sosyal imkanlar değerlendiriliyor',
  'Sonuçlar hazırlanıyor',
]

function SonucIcerik() {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sonuclar, setSonuclar]     = useState<IlceUyumSkoru[]>([])
  const [paylasild, setPaylasild]   = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    async function hesapla() {
      try {
        const cevaplarStr = searchParams.get('cevaplar')
        if (!cevaplarStr) { router.push('/quiz'); return }

        const cevaplar: QuizCevap[] = JSON.parse(cevaplarStr)

        const { data: ilceler } = await supabase
          .from('ilceler')
          .select(`
            slug, isim, aciklama,
            ulasim_skoru, imkanlar_skoru,
            egitim_skoru, saglik_skoru,
            guvenlik_skoru, deprem_skoru,
            yasam_maliyeti_skoru,
            sakin_memnuniyeti_skoru,
            genel_skor
          `)

        if (!ilceler?.length) return

        const agirliklar = agirliklarHesapla(cevaplar)
        const puanli     = ilceleriPuanla(ilceler, agirliklar)
        setSonuclar(puanli)
      } catch (err) {
        console.error(err)
        router.push('/quiz')
      } finally {
        setYukleniyor(false)
      }
    }

    hesapla()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── YÜKLEME EKRANI ── */
  if (yukleniyor) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafb, #f0fdf4)',
      gap: 24, paddingTop: 64,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #075e54, #25d366)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite',
        fontSize: 36,
      }}>
        🏙️
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111b21', marginBottom: 8 }}>
          Senin için analiz ediliyor...
        </div>
        <div style={{ fontSize: 14, color: '#667781' }}>
          Cevaplarına göre en uygun ilçeler hesaplanıyor
        </div>
      </div>

      {YUKLEME_ADIMLAR.map((metin, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          opacity: 0,
          animation: 'fadeIn 400ms ease forwards',
          animationDelay: i * 400 + 'ms',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#25d366' }} />
          <span style={{ fontSize: 13, color: '#667781' }}>{metin}</span>
        </div>
      ))}

      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
    </div>
  )

  const birinci = sonuclar[0]
  const diger   = sonuclar.slice(1)

  /* ── SONUÇ SAYFASI ── */
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafb, #f0fdf4)',
      paddingTop: 80, paddingBottom: 60,
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* ── BAŞLIK ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#dcf8c6', color: '#075e54',
            borderRadius: 99, padding: '6px 18px',
            fontSize: 13, fontWeight: 700, marginBottom: 16,
          }}>
            <Trophy size={14} />
            Analizin tamamlandı
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111b21', marginBottom: 10, lineHeight: 1.2 }}>
            Sana En Uygun İlçeler
          </h1>
          <p style={{ fontSize: 15, color: '#667781', lineHeight: 1.6 }}>
            Cevaplarına göre kişiselleştirilmiş öneriler
          </p>
        </div>

        {/* ── BİRİNCİ SONUÇ ── */}
        {birinci && (
          <div style={{
            background: 'linear-gradient(135deg, #075e54, #128c7e)',
            borderRadius: 24, padding: '28px 28px 24px',
            marginBottom: 16, position: 'relative', overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(7,94,84,0.25)',
          }}>
            {/* Dekoratif daire */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 160, height: 160, borderRadius: '50%',
              background: 'rgba(37,211,102,0.1)', pointerEvents: 'none',
            }} />

            {/* #1 rozeti */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(37,211,102,0.2)',
              border: '1px solid rgba(37,211,102,0.4)',
              borderRadius: 99, padding: '4px 14px', marginBottom: 16,
            }}>
              <Trophy size={12} color="#25d366" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#25d366' }}>
                #1 EN UYGUN İLÇE
              </span>
            </div>

            {/* İlçe adı + uyum dairesi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 8 }}>
                  {birinci.isim}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  {birinci.aciklama}
                </div>
              </div>

              <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                <svg viewBox="0 0 80 80" width="80" height="80">
                  <circle cx="40" cy="40" r="34"
                    fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34"
                    fill="none" stroke="#25d366" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(birinci.uyumYuzdesi / 100) * 213.6} 213.6`}
                    strokeDashoffset="53.4"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                  <text x="40" y="36" textAnchor="middle" fontSize="16" fontWeight="800" fill="white">
                    {birinci.uyumYuzdesi}%
                  </text>
                  <text x="40" y="50" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)">
                    uyum
                  </text>
                </svg>
              </div>
            </div>

            {/* Güçlü / Zayıf grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#25d366', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  💪 Güçlü Yönler
                </div>
                {birinci.gucluYonler.length > 0
                  ? birinci.gucluYonler.map(g => (
                      <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>
                        <CheckCircle size={12} color="#25d366" />
                        {g}
                      </div>
                    ))
                  : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Veri bekleniyor</div>
                }
              </div>

              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚠️ Dikkat Edilecekler
                </div>
                {birinci.zayifYonler.length > 0
                  ? birinci.zayifYonler.map(z => (
                      <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                        <XCircle size={12} color="#fbbf24" />
                        {z}
                      </div>
                    ))
                  : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Belirgin zayıf yön yok</div>
                }
              </div>
            </div>

            {/* CTA butonları */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => router.push('/ilce/' + birinci.slug)}
                style={{
                  flex: 1, background: '#25d366', color: '#075e54',
                  border: 'none', borderRadius: 12, padding: '13px 20px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                Detaylı İncele
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                  setPaylasild(true)
                  setTimeout(() => setPaylasild(false), 2000)
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12, padding: '13px 16px',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                }}
              >
                <Share2 size={15} />
                {paylasild ? 'Kopyalandı!' : 'Paylaş'}
              </button>
            </div>
          </div>
        )}

        {/* ── DİĞER SONUÇLAR ── */}
        {diger.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#667781', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Diğer Uyumlu İlçeler
            </div>

            {diger.map((ilce, idx) => (
              <div
                key={ilce.slug}
                onClick={() => router.push('/ilce/' + ilce.slug)}
                style={{
                  background: 'white', borderRadius: 16,
                  border: '1.5px solid #e9edef',
                  padding: '16px 20px', marginBottom: 10,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#25d366'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e9edef'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#f0f2f5', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#667781',
                }}>
                  #{idx + 2}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111b21', marginBottom: 3 }}>
                    {ilce.isim}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ilce.gucluYonler.slice(0, 2).map(g => (
                      <span key={g} style={{
                        background: '#dcf8c6', color: '#075e54',
                        borderRadius: 99, padding: '2px 10px',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{
                  fontSize: 22, fontWeight: 800, textAlign: 'right', flexShrink: 0,
                  color: ilce.uyumYuzdesi >= 70 ? '#25d366'
                       : ilce.uyumYuzdesi >= 50 ? '#f59e0b'
                       : '#ef4444',
                }}>
                  {ilce.uyumYuzdesi}%
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>uyum</div>
                </div>

                <ArrowRight size={18} color="#d1d5db" />
              </div>
            ))}
          </div>
        )}

        {/* ── TEKRAR YAP ── */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => router.push('/quiz')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'white', border: '1.5px solid #e9edef',
              borderRadius: 12, padding: '12px 24px',
              fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#25d366'; e.currentTarget.style.color = '#075e54' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9edef'; e.currentTarget.style.color = '#374151' }}
          >
            <RotateCcw size={15} />
            Testi Tekrar Yap
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SonucPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Sonuçlar hesaplanıyor...</div>
        </div>
      </div>
    }>
      <SonucIcerik />
    </Suspense>
  )
}
