'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { QUIZ_SORULARI } from '@/lib/quizSorulari'
import { QuizCevap } from '@/lib/quizTypes'

const BOLUM_RENKLERI: Record<string, string> = {
  'Kişisel Profil':  '#075e54',
  'Ulaşım':          '#1a6b8a',
  'Güvenlik':        '#7c3aed',
  'Eğitim & Sağlık': '#b45309',
  'Yaşam Kalitesi':  '#047857',
  'Bütçe':           '#b91c1c',
  'Öncelikler':      '#075e54',
}

export default function QuizPage() {
  const [adim, setAdim]         = useState(0)
  const [cevaplar, setCevaplar] = useState<Record<string, QuizCevap>>({})
  const [gecis, setGecis]       = useState(false)
  const router = useRouter()

  const soru        = QUIZ_SORULARI[adim]
  const toplamSoru  = QUIZ_SORULARI.length
  const ilerleme    = (adim / toplamSoru) * 100
  const seciliCevap = cevaplar[soru.id]
  const bolumRenk   = BOLUM_RENKLERI[soru.bolum] || '#075e54'

  function secenekSec(secenek: (typeof soru.secenekler)[number]) {
    setCevaplar(prev => ({
      ...prev,
      [soru.id]: {
        value:    secenek.value,
        agirlik:  secenek.agirlik,
        kira_max: secenek.kira_max,
      },
    }))
  }

  function ileriGit() {
    if (!seciliCevap) return
    if (adim < toplamSoru - 1) {
      setGecis(true)
      setTimeout(() => { setAdim(a => a + 1); setGecis(false) }, 180)
    } else {
      const params = new URLSearchParams()
      params.set('cevaplar', JSON.stringify(cevaplar))
      router.push('/quiz/sonuc?' + params.toString())
    }
  }

  function geriGit() {
    if (adim > 0) {
      setGecis(true)
      setTimeout(() => { setAdim(a => a - 1); setGecis(false) }, 180)
    }
  }

  // Önceki / sonraki bölüm geçişini hesapla
  const oncekiBolum = adim > 0 ? QUIZ_SORULARI[adim - 1].bolum : null
  const bolumDegisti = oncekiBolum !== soru.bolum

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafb 0%, #f0fdf4 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 16px 40px',
    }}>

      {/* ── İLERLEME BARI ── */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0,
        zIndex: 40, background: 'white',
        borderBottom: '1px solid #e9edef',
        padding: '12px 24px',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#667781', fontWeight: 500 }}>
              Soru {adim + 1} / {toplamSoru}
            </span>
            <span style={{
              fontSize: 11, color: 'white', fontWeight: 700,
              background: bolumRenk, borderRadius: 99,
              padding: '2px 10px', transition: 'background 300ms',
            }}>
              {soru.bolum}
            </span>
          </div>
          <div style={{ background: '#e9edef', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: ilerleme + '%',
              background: `linear-gradient(90deg, ${bolumRenk}, #25d366)`,
              borderRadius: 99,
              transition: 'width 400ms ease',
            }} />
          </div>
        </div>
      </div>

      {/* ── ANA KUTU ── */}
      <div style={{ maxWidth: 600, width: '100%' }}>

        {/* Bölüm başlığı — sadece bölüm değişince göster */}
        {bolumDegisti && (
          <div style={{
            opacity: gecis ? 0 : 1,
            transition: 'opacity 180ms',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: bolumRenk,
            }}>
              — {soru.bolum} —
            </span>
          </div>
        )}

        {/* Soru */}
        <div style={{
          opacity: gecis ? 0 : 1,
          transform: gecis ? 'translateY(8px)' : 'translateY(0)',
          transition: 'all 180ms ease',
          marginBottom: 28,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{soru.ikon}</div>
          <h1 style={{
            fontSize: 'clamp(20px, 4vw, 26px)',
            fontWeight: 800, color: '#111b21',
            lineHeight: 1.3,
          }}>
            {soru.soru}
          </h1>
        </div>

        {/* Seçenekler */}
        <div style={{
          opacity: gecis ? 0 : 1,
          transition: 'opacity 180ms ease',
          display: 'flex', flexDirection: 'column',
          gap: 10, marginBottom: 28,
        }}>
          {soru.secenekler.map((secenek, idx) => {
            const secili = seciliCevap?.value === secenek.value
            return (
              <div
                key={secenek.value}
                onClick={() => secenekSec(secenek)}
                style={{
                  background: secili ? '#f0fdf4' : 'white',
                  border: secili ? `2px solid ${bolumRenk}` : '1.5px solid #e9edef',
                  borderRadius: 14,
                  padding: '15px 18px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 180ms ease',
                  boxShadow: secili
                    ? `0 4px 16px ${bolumRenk}22`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  animationDelay: idx * 60 + 'ms',
                }}
                onMouseEnter={e => {
                  if (!secili) e.currentTarget.style.borderColor = '#86efac'
                }}
                onMouseLeave={e => {
                  if (!secili) e.currentTarget.style.borderColor = '#e9edef'
                }}
              >
                <span style={{
                  fontSize: 15,
                  fontWeight: secili ? 700 : 500,
                  color: secili ? bolumRenk : '#374151',
                  flex: 1, transition: 'all 180ms',
                  lineHeight: 1.4,
                }}>
                  {secenek.label}
                </span>
                {secili
                  ? <CheckCircle size={20} color={bolumRenk} />
                  : <Circle size={20} color="#d1d5db" />
                }
              </div>
            )
          })}
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: 10 }}>
          {adim > 0 ? (
            <button
              onClick={geriGit}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white', border: '1.5px solid #e9edef',
                borderRadius: 12, padding: '13px 18px',
                fontSize: 14, fontWeight: 500, color: '#667781',
                cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9edef'; e.currentTarget.style.color = '#667781' }}
            >
              <ArrowLeft size={15} />
              Geri
            </button>
          ) : <div />}

          <button
            onClick={ileriGit}
            disabled={!seciliCevap}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: seciliCevap
                ? `linear-gradient(135deg, ${bolumRenk}, #25d366)`
                : '#e9edef',
              border: 'none', borderRadius: 12,
              padding: '13px 24px',
              fontSize: 15, fontWeight: 700,
              color: seciliCevap ? 'white' : '#9ca3af',
              cursor: seciliCevap ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: seciliCevap ? `0 4px 16px ${bolumRenk}44` : 'none',
              flex: 1,
            }}
          >
            {adim === toplamSoru - 1 ? 'Sonuçları Gör 🎯' : 'Devam Et'}
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Alt bilgi */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#9ca3af' }}>
          {toplamSoru - adim - 1} soru kaldı · Cevapların gizlidir
        </div>
      </div>
    </div>
  )
}
