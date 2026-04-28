'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { QUIZ_SORULARI } from '@/lib/quizSorulari'
import { QuizCevap } from '@/lib/quizTypes'

export default function QuizPage() {
  const [adim, setAdim]         = useState(0)
  const [cevaplar, setCevaplar] = useState<QuizCevap[]>([])
  const [gecis, setGecis]       = useState(false)
  const router = useRouter()

  const mevcutSoru  = QUIZ_SORULARI[adim]
  const toplamSoru  = QUIZ_SORULARI.length
  const ilerleme    = (adim / toplamSoru) * 100
  const mevcutCevap = cevaplar.find(c => c.soruId === mevcutSoru.id)
  const cevapVerildi = !!mevcutCevap?.secenekIds?.length

  function secenekSec(secId: string) {
    setCevaplar(prev => {
      const mevcut = prev.find(c => c.soruId === mevcutSoru.id)
      if (mevcut) {
        return prev.map(c =>
          c.soruId === mevcutSoru.id ? { ...c, secenekIds: [secId] } : c
        )
      }
      return [...prev, { soruId: mevcutSoru.id, secenekIds: [secId] }]
    })
  }

  function ileriGit() {
    if (!cevapVerildi) return
    if (adim < toplamSoru - 1) {
      setGecis(true)
      setTimeout(() => { setAdim(a => a + 1); setGecis(false) }, 200)
    } else {
      const params = new URLSearchParams()
      params.set('cevaplar', JSON.stringify(cevaplar))
      router.push('/quiz/sonuc?' + params.toString())
    }
  }

  function geriGit() {
    if (adim > 0) {
      setGecis(true)
      setTimeout(() => { setAdim(a => a - 1); setGecis(false) }, 200)
    }
  }

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

      {/* ── SABİT İLERLEME BARI ── */}
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
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {toplamSoru - adim} soru kaldı
            </span>
          </div>
          <div style={{ background: '#e9edef', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: ilerleme + '%',
              background: 'linear-gradient(90deg, #25d366, #128c7e)',
              borderRadius: 99,
              transition: 'width 400ms ease',
            }} />
          </div>
        </div>
      </div>

      {/* ── ANA KUTU ── */}
      <div style={{ maxWidth: 600, width: '100%' }}>

        {/* Soru başlığı */}
        <div style={{
          opacity: gecis ? 0 : 1,
          transform: gecis ? 'translateY(8px)' : 'translateY(0)',
          transition: 'all 200ms ease',
          marginBottom: 32,
          textAlign: 'center',
        }}>
          <span style={{
            background: '#dcf8c6', color: '#075e54',
            borderRadius: 99, padding: '4px 14px',
            fontSize: 12, fontWeight: 700,
            display: 'inline-block', marginBottom: 16,
          }}>
            Soru {adim + 1}
          </span>
          <h1 style={{
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontWeight: 800, color: '#111b21',
            lineHeight: 1.3, marginBottom: 10,
          }}>
            {mevcutSoru.soru}
          </h1>
          <p style={{ fontSize: 15, color: '#667781', lineHeight: 1.5 }}>
            {mevcutSoru.altBaslik}
          </p>
        </div>

        {/* Seçenekler */}
        <div style={{
          opacity: gecis ? 0 : 1,
          transition: 'opacity 200ms ease',
          display: 'flex', flexDirection: 'column',
          gap: 12, marginBottom: 32,
        }}>
          {mevcutSoru.secenekler?.map((secenek, idx) => {
            const secili = mevcutCevap?.secenekIds?.includes(secenek.id)
            return (
              <div
                key={secenek.id}
                onClick={() => secenekSec(secenek.id)}
                className="secenekGir-animasyon"
                style={{
                  background: secili ? '#f0fdf4' : 'white',
                  border: secili ? '2px solid #25d366' : '1.5px solid #e9edef',
                  borderRadius: 16,
                  padding: '18px 20px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'all 200ms ease',
                  boxShadow: secili
                    ? '0 4px 16px rgba(37,211,102,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  animationDelay: idx * 80 + 'ms',
                }}
                onMouseEnter={e => {
                  if (!secili) e.currentTarget.style.borderColor = '#86efac'
                }}
                onMouseLeave={e => {
                  if (!secili) e.currentTarget.style.borderColor = '#e9edef'
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: secili ? '#dcf8c6' : '#f8fafb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0, transition: 'background 200ms',
                }}>
                  {secenek.ikon}
                </div>
                <span style={{
                  fontSize: 15,
                  fontWeight: secili ? 700 : 500,
                  color: secili ? '#075e54' : '#374151',
                  flex: 1, transition: 'all 200ms',
                }}>
                  {secenek.etiket}
                </span>
                {secili
                  ? <CheckCircle size={22} color="#25d366" />
                  : <Circle size={22} color="#d1d5db" />
                }
              </div>
            )
          })}
        </div>

        {/* ── ALT BUTONLAR ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          {adim > 0 ? (
            <button
              onClick={geriGit}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'white', border: '1.5px solid #e9edef',
                borderRadius: 12, padding: '13px 20px',
                fontSize: 14, fontWeight: 500, color: '#667781',
                cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9edef'; e.currentTarget.style.color = '#667781' }}
            >
              <ArrowLeft size={16} />
              Geri
            </button>
          ) : <div />}

          <button
            onClick={ileriGit}
            disabled={!cevapVerildi}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: cevapVerildi
                ? 'linear-gradient(135deg, #25d366, #22c55e)'
                : '#e9edef',
              border: 'none', borderRadius: 12,
              padding: '13px 28px',
              fontSize: 15, fontWeight: 700,
              color: cevapVerildi ? '#075e54' : '#9ca3af',
              cursor: cevapVerildi ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: cevapVerildi ? '0 4px 16px rgba(37,211,102,0.3)' : 'none',
              flex: 1,
            }}
          >
            {adim === toplamSoru - 1 ? 'Sonuçları Gör 🎯' : 'Devam Et'}
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Alt bilgi */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
          Cevapların gizlidir · Hesap açmana gerek yok
        </div>
      </div>
    </div>
  )
}
