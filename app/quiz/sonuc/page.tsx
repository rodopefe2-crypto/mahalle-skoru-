'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Trophy, ArrowRight, RotateCcw, Share2, Lock } from 'lucide-react'
import { agirliklarHesapla, ilceleriPuanla, kiraMaxAl, ETIKETLER } from '@/lib/oneriMotoru'
import { QuizCevap } from '@/lib/quizTypes'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Radar Chart ──────────────────────────────────────────────
const RADAR_PARAMS = ['ulasim', 'guvenlik', 'imkanlar', 'yesil_alan', 'kultur', 'deprem_skoru']
const RADAR_LABELS = ['Ulaşım', 'Güvenlik', 'İmkanlar', 'Yeşil', 'Kültür', 'Deprem']

function RadarChart({ skorlar, renk = '#25d366' }: { skorlar: Record<string, number>; renk?: string }) {
  const cx = 70, cy = 70, r = 52
  const n = RADAR_PARAMS.length

  const getPoint = (i: number, scale: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * scale * Math.cos(angle), y: cy + r * scale * Math.sin(angle) }
  }

  const dataPoints = RADAR_PARAMS.map((p, i) => getPoint(i, (skorlar[p] || 0) / 100))
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  const gridScales = [0.25, 0.5, 0.75, 1]

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {gridScales.map(scale => {
        const pts = RADAR_PARAMS.map((_, i) => { const p = getPoint(i, scale); return `${p.x},${p.y}` }).join(' ')
        return <polygon key={scale} points={pts} fill="none" stroke="#e9edef" strokeWidth="1" />
      })}
      {RADAR_PARAMS.map((_, i) => {
        const p = getPoint(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e9edef" strokeWidth="1" />
      })}
      <polygon points={dataPolygon} fill={renk + '33'} stroke={renk} strokeWidth="2" />
      {RADAR_LABELS.map((label, i) => {
        const p = getPoint(i, 1.28)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fill="#667781" fontWeight="500">{label}</text>
        )
      })}
    </svg>
  )
}

// ── Markdown Renderer ─────────────────────────────────────────
function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const els: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = (key: string) => {
    if (listBuffer.length) {
      els.push(
        <ul key={key} style={{ margin: '8px 0 8px 4px', paddingLeft: 16 }}>
          {listBuffer.map((item, j) => (
            <li key={j} style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushList(`list-${i}`)
      els.push(
        <div key={i} style={{ fontSize: 15, fontWeight: 700, color: '#075e54', marginTop: 20, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e9edef' }}>
          {line.slice(3)}
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      listBuffer.push(line.slice(2))
    } else if (line.trim() === '') {
      flushList(`list-${i}`)
    } else {
      flushList(`list-${i}`)
      els.push(
        <p key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '4px 0' }}>{line}</p>
      )
    }
  })
  flushList('list-end')
  return <div>{els}</div>
}

// ── Yükleme iskeleti ─────────────────────────────────────────
function Skeleton({ h = 16, w = '100%', mb = 8 }: { h?: number; w?: string | number; mb?: number }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6, marginBottom: mb,
      background: 'linear-gradient(90deg, #f0f2f5 25%, #e9edef 50%, #f0f2f5 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

// ── Ana bileşen ───────────────────────────────────────────────
function SonucIcerik() {
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [topIlceler, setTopIlceler]   = useState<any[]>([])
  const [mahalleler, setMahalleler]   = useState<any[]>([])
  const [rapor, setRapor]             = useState<string | null>(null)
  const [raporYuk, setRaporYuk]       = useState(true)
  const [paylasild, setPaylasild]     = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    async function hesapla() {
      try {
        const cevaplarStr = searchParams.get('cevaplar')
        if (!cevaplarStr) { router.push('/quiz'); return }

        const cevaplar: Record<string, QuizCevap> = JSON.parse(cevaplarStr)

        // ── İlçeleri çek ──
        const { data: ilceler } = await supabase
          .from('ilceler')
          .select(`
            id, slug, isim, aciklama,
            ulasim_skoru, imkanlar_skoru,
            egitim_skoru, saglik_skoru,
            guvenlik_skoru, deprem_skoru,
            yesil_alan_skoru, kultur_skoru,
            yasam_maliyeti_skoru, genel_skor,
            kira_ortalama
          `)

        if (!ilceler?.length) return

        const agirliklar = agirliklarHesapla(cevaplar)
        const kiraMax    = kiraMaxAl(cevaplar)
        const puanli     = ilceleriPuanla(ilceler, agirliklar, kiraMax)
        const top5       = puanli.slice(0, 5)
        setTopIlceler(top5)

        // ── Top 3 ilçenin mahallelerini çek ──
        const top3Ids = top5.slice(0, 3).map((i: any) => i.id).filter(Boolean)
        if (top3Ids.length) {
          const { data: mData } = await supabase
            .from('mahalleler')
            .select(`
              isim, slug, genel_skor,
              ulasim_skoru, guvenlik_skoru,
              imkanlar_skoru, egitim_skoru,
              saglik_skoru, kira_ortalama,
              ilce:ilce_id(isim, slug)
            `)
            .in('ilce_id', top3Ids)
            .gte('genel_skor', 60)
            .not('kira_ortalama', 'is', null)
            .lte('kira_ortalama', kiraMax * 1.3)
            .order('genel_skor', { ascending: false })
            .limit(9)

          setMahalleler(mData || [])

          // ── Claude raporu ──
          fetch('/api/quiz/rapor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cevaplar,
              topIlceler: top5,
              topMahalleler: mData || [],
            }),
          })
            .then(r => r.json())
            .then(d => { if (d.rapor) setRapor(d.rapor) })
            .catch(() => {})
            .finally(() => setRaporYuk(false))
        } else {
          setRaporYuk(false)
        }
      } catch (err) {
        console.error(err)
        router.push('/quiz')
      } finally {
        setYukleniyor(false)
      }
    }
    hesapla()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Yükleme ekranı ──
  if (yukleniyor) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafb, #f0fdf4)',
      gap: 24, paddingTop: 64,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes fadeIn { to{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #075e54, #25d366)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite', fontSize: 36,
      }}>🏙️</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111b21', marginBottom: 8 }}>Senin için analiz ediliyor...</div>
        <div style={{ fontSize: 14, color: '#667781' }}>15 cevabın işleniyor, en uygun ilçeler bulunuyor</div>
      </div>
      {['Profil analiz ediliyor', 'İlçe skorları hesaplanıyor', 'Mahalle önerileri hazırlanıyor', 'Sonuçlar hazırlanıyor'].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0, animation: 'fadeIn 400ms ease forwards', animationDelay: i * 400 + 'ms' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#25d366' }} />
          <span style={{ fontSize: 13, color: '#667781' }}>{t}</span>
        </div>
      ))}
    </div>
  )

  const birinci = topIlceler[0]
  const digerler = topIlceler.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafb, #f0fdf4)', paddingTop: 80, paddingBottom: 60 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { to{opacity:1} }
        .hover-card:hover { border-color:#25d366!important; transform:translateX(3px) }
      `}</style>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>

        {/* ── 1. BAŞLIK ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#dcf8c6', color: '#075e54', borderRadius: 99, padding: '6px 18px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            <Trophy size={14} />
            Analizin tamamlandı
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111b21', marginBottom: 8, lineHeight: 1.2 }}>
            Sana En Uygun İlçeler
          </h1>
          <p style={{ fontSize: 14, color: '#667781' }}>
            {topIlceler.length} ilçe analiz edildi · Uyum %{birinci?.uyumYuzdesi} ile <strong>{birinci?.isim}</strong> öne çıktı
          </p>
        </div>

        {/* ── 2. #1 İLÇE KARTI ── */}
        {birinci && (
          <div style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)', borderRadius: 24, padding: '24px 24px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden', boxShadow: '0 16px 48px rgba(7,94,84,0.25)' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', pointerEvents: 'none' }} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.4)', borderRadius: 99, padding: '4px 14px', marginBottom: 16 }}>
              <Trophy size={11} color="#25d366" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#25d366' }}>#1 EN UYGUN İLÇE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 8 }}>{birinci.isim}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{birinci.aciklama}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <svg viewBox="0 0 80 80" width="76" height="76">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#25d366" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(birinci.uyumYuzdesi / 100) * 213.6} 213.6`}
                    strokeDashoffset="53.4" />
                  <text x="40" y="37" textAnchor="middle" fontSize="15" fontWeight="800" fill="white">{birinci.uyumYuzdesi}%</text>
                  <text x="40" y="50" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)">uyum</text>
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#25d366', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>💪 Güçlü Yönler</div>
                {birinci.gucluYonler.length > 0
                  ? birinci.gucluYonler.map((g: string) => (
                      <div key={g} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>✓ {g}</div>
                    ))
                  : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Veri yok</div>
                }
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠️ Dikkat</div>
                {birinci.zayifYonler.length > 0
                  ? birinci.zayifYonler.map((z: string) => (
                      <div key={z} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>• {z}</div>
                    ))
                  : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Belirgin zayıf yön yok</div>
                }
              </div>
              <div style={{ flexShrink: 0 }}>
                <RadarChart skorlar={birinci.skorlar} renk="#25d366" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => router.push('/ilce/' + birinci.slug)} style={{ flex: 1, background: '#25d366', color: '#075e54', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                İlçeyi İncele <ArrowRight size={15} />
              </button>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setPaylasild(true); setTimeout(() => setPaylasild(false), 2000) }} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '12px 16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Share2 size={14} />
                {paylasild ? 'Kopyalandı!' : 'Paylaş'}
              </button>
            </div>
          </div>
        )}

        {/* ── 3. AI RAPOR ── */}
        <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #e9edef', padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #075e54, #25d366)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21' }}>Kişiselleştirilmiş Analiz</div>
              <div style={{ fontSize: 12, color: '#667781' }}>Quiz cevaplarına göre AI tarafından üretildi</div>
            </div>
          </div>

          {raporYuk ? (
            <div>
              <Skeleton h={14} mb={10} />
              <Skeleton h={14} w="85%" mb={10} />
              <Skeleton h={14} w="90%" mb={20} />
              <Skeleton h={13} mb={8} />
              <Skeleton h={13} w="75%" mb={8} />
              <Skeleton h={13} w="80%" mb={20} />
              <Skeleton h={13} mb={8} />
              <Skeleton h={13} w="70%" mb={8} />
            </div>
          ) : rapor ? (
            <Markdown text={rapor} />
          ) : (
            <div style={{ padding: '16px', background: '#f8fafb', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#667781' }}>AI raporu şu an kullanılamıyor.</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>ANTHROPIC_API_KEY ayarlanmamış olabilir.</div>
            </div>
          )}
        </div>

        {/* ── 4. DİĞER İLÇELER ── */}
        {digerler.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#667781', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Diğer Uyumlu İlçeler
            </div>
            {digerler.map((ilce: any, idx: number) => (
              <div key={ilce.slug} className="hover-card" onClick={() => router.push('/ilce/' + ilce.slug)}
                style={{ background: 'white', borderRadius: 16, border: '1.5px solid #e9edef', padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 180ms ease' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0f2f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#667781' }}>
                  #{idx + 2}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111b21', marginBottom: 4 }}>{ilce.isim}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {ilce.gucluYonler.slice(0, 2).map((g: string) => (
                      <span key={g} style={{ background: '#dcf8c6', color: '#075e54', borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>{g}</span>
                    ))}
                  </div>
                </div>
                <RadarChart skorlar={ilce.skorlar} renk="#128c7e" />
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ilce.uyumYuzdesi >= 70 ? '#25d366' : ilce.uyumYuzdesi >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {ilce.uyumYuzdesi}%
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>uyum</div>
                </div>
                <ArrowRight size={16} color="#d1d5db" />
              </div>
            ))}
          </div>
        )}

        {/* ── 5. ÖNERİLEN MAHALLELER ── */}
        {mahalleler.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#667781', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Önerilen Mahalleler
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {mahalleler.map((m: any) => (
                <div key={m.slug} className="hover-card" onClick={() => router.push('/mahalle/' + m.slug)}
                  style={{ background: 'white', borderRadius: 14, border: '1.5px solid #e9edef', padding: '14px 16px', cursor: 'pointer', transition: 'all 180ms ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111b21' }}>{m.isim}</div>
                      <div style={{ fontSize: 11, color: '#667781' }}>{(m.ilce as any)?.isim}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#25d366' }}>{m.genel_skor}</div>
                      <div style={{ fontSize: 9, color: '#9ca3af' }}>puan</div>
                    </div>
                  </div>
                  {m.kira_ortalama && (
                    <div style={{ fontSize: 12, color: '#374151', background: '#f8fafb', borderRadius: 8, padding: '5px 10px', fontWeight: 500 }}>
                      ~{m.kira_ortalama.toLocaleString('tr')} TL / ay
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. PREMIUM CTA ── */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 20, padding: '24px', marginBottom: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(37,211,102,0.08)', pointerEvents: 'none' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 99, padding: '4px 14px', marginBottom: 12 }}>
            <Lock size={11} color="#fbbf24" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>PREMİUM</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>📄 Detaylı PDF Rapor</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
            30 sayfalık detaylı analiz, mahalle karşılaştırması,<br />kira trend grafikler ve taşınma checklist'i
          </div>
          <button style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1a1a2e', border: 'none', borderRadius: 12, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Lock size={14} />
            Üye Ol ve İndir
          </button>
        </div>

        {/* Tekrar yap */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.push('/quiz')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e9edef', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
            <RotateCcw size={14} />
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
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Sonuçlar hazırlanıyor...</div>
        </div>
      </div>
    }>
      <SonucIcerik />
    </Suspense>
  )
}
