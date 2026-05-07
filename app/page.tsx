'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Ilce, Parametreler } from '@/lib/types'
import { ilceSirala } from '@/lib/skorHesapla'
import { supabase } from '@/lib/supabase'
import { TrendingUp, MapPin, Database, BarChart2, Users, Play, Heart, Search, GitCompare, ArrowRight, Star, X, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import FiltrePaneli, { FiltreState } from '@/components/FiltrePaneli'
import KarsilastirmaPanel from '@/components/KarsilastirmaPanel'
import { IlceKarti } from '@/components/IlceKarti'
import { MahalleKarti, MahalleKartiData } from '@/components/MahalleKarti'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

/* ── Demo verisi (sadece hero görsel için) ── */
const radarData = [
  { param: 'Ulaşım',   skor: 88 },
  { param: 'İmkanlar', skor: 92 },
  { param: 'Eğitim',   skor: 80 },
  { param: 'Sağlık',   skor: 85 },
  { param: 'Güvenlik', skor: 72 },
  { param: 'Yaşam',    skor: 75 },
  { param: 'Deprem',   skor: 65 },
  { param: 'Sakinler', skor: 90 },
]

const topIlceler = [
  { isim: 'Beşiktaş',  skor: 82, renk: '#25d366' },
  { isim: 'Sarıyer',   skor: 74, renk: '#128c7e' },
  { isim: 'Şişli',     skor: 73, renk: '#075e54' },
  { isim: 'Beyoğlu',   skor: 70, renk: '#128c7e' },
  { isim: 'Kağıthane', skor: 63, renk: '#667781' },
]

const AVATARS = [
  { renk: '#075e54', harf: 'B' },
  { renk: '#128c7e', harf: 'S' },
  { renk: '#25d366', harf: 'K' },
  { renk: '#128c7e', harf: 'Y' },
  { renk: '#075e54', harf: 'E' },
]

/* ── Mock ilçe verisi ── */
const mockIlceler: Ilce[] = [
  { id:'1', isim:'Beşiktaş',  slug:'besiktas',  aciklama:'Boğaz kıyısında prestijli, kültürün merkezi',   koordinat_lat:41.0422, koordinat_lng:29.0073, ulasim_skoru:85, imkanlar_skoru:90, egitim_skoru:80, yasam_maliyeti_skoru:75, guvenlik_skoru:70, saglik_skoru:85, deprem_skoru:62, sakin_memnuniyeti_skoru:75, yesil_alan_skoru:60, kultur_skoru:80, nufus_yogunlugu_skoru:15, genel_skor:82 },
  { id:'2', isim:'Şişli',     slug:'sisli',     aciklama:'Merkezi konum, güçlü metro ağı',               koordinat_lat:41.0602, koordinat_lng:28.9872, ulasim_skoru:88, imkanlar_skoru:85, egitim_skoru:75, yasam_maliyeti_skoru:70, guvenlik_skoru:65, saglik_skoru:80, deprem_skoru:48, sakin_memnuniyeti_skoru:70, yesil_alan_skoru:45, kultur_skoru:70, genel_skor:73 },
  { id:'3', isim:'Kağıthane', slug:'kagithane', aciklama:'Gelişim potansiyeli, uygun fiyatlar',           koordinat_lat:41.0784, koordinat_lng:28.9706, ulasim_skoru:75, imkanlar_skoru:70, egitim_skoru:65, yasam_maliyeti_skoru:65, guvenlik_skoru:60, saglik_skoru:70, deprem_skoru:38, sakin_memnuniyeti_skoru:65, yesil_alan_skoru:40, kultur_skoru:30, genel_skor:63 },
  { id:'4', isim:'Sarıyer',   slug:'sariyer',   aciklama:'Sakin, doğaya yakın, yüksek memnuniyet',       koordinat_lat:41.1672, koordinat_lng:29.0572, ulasim_skoru:70, imkanlar_skoru:65, egitim_skoru:70, yasam_maliyeti_skoru:80, guvenlik_skoru:80, saglik_skoru:75, deprem_skoru:70, sakin_memnuniyeti_skoru:85, yesil_alan_skoru:85, kultur_skoru:40, genel_skor:74 },
  { id:'5', isim:'Beyoğlu',   slug:'beyoglu',   aciklama:'Tarihi doku, kültürel çeşitlilik, eğlence',    koordinat_lat:41.0335, koordinat_lng:28.9772, ulasim_skoru:82, imkanlar_skoru:88, egitim_skoru:72, yasam_maliyeti_skoru:72, guvenlik_skoru:55, saglik_skoru:78, deprem_skoru:44, sakin_memnuniyeti_skoru:68, yesil_alan_skoru:50, kultur_skoru:95, genel_skor:70 },
]

const defaultWeights: Parametreler = {
  ulasim:5, imkanlar:5, egitim:5, yasam_maliyeti:5,
  guvenlik:5, saglik:5, deprem:5, sakin_memnuniyeti:5,
  yesil_alan:5, kultur:5,
}

function formatSayi(sayi: number): string {
  if (sayi >= 1000000) return (sayi / 1000000).toFixed(1) + 'M+'
  if (sayi >= 1000)    return (sayi / 1000).toFixed(0) + 'K+'
  return sayi.toString()
}

/* ── Küçük skor dairesi (hero mockup) ── */
function MiniSkorDairesi() {
  const r = 30, c = 2 * Math.PI * r   // 188.5
  const fill = (82 / 100) * c
  return (
    <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
      <svg width={80} height={80} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
        <circle cx={40} cy={40} r={r} fill="none" stroke="#25d366" strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${c}`}
          style={{ animation:'skorCiz 1.2s ease-out forwards' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:22, fontWeight:800, color:'white', lineHeight:1 }}>82</span>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [ilceler, setIlceler]   = useState<Ilce[]>(mockIlceler)
  const [weights]  = useState<Parametreler>(defaultWeights)
  const [mounted, setMounted]   = useState(false)
  const [ilceCount,    setIlceCount]    = useState(39)
  const [mahalleCount, setMahalleCount] = useState(961)
  const [tesisCount,   setTesisCount]   = useState(128366)

  // District list state
  const [aramaMetni, setAramaMetni]                     = useState('')
  const [siralamaKriteri, setSiralamaKriteri]             = useState('en_iyi')
  const [karsilastirmaListesi, setKarsilastirmaListesi]   = useState<string[]>([])
  const [favoriler, setFavoriler]                         = useState<string[]>([])
  const [karsilastirmaModu, setKarsilastirmaModu]         = useState(false)
  const [filtrePaneliAcik, setFiltrePaneliAcik]             = useState(false)
  const [karsilastirmaPaneliAcik, setKarsilastirmaPaneliAcik] = useState(false)
  const [aktifFiltreler, setAktifFiltreler]                 = useState<FiltreState | null>(null)
  const [siralamaParametresi, setSiralamaParametresi] = useState<string>('genel_skor')
  const [siralamaYonu, setSiralamaYonu]               = useState<'desc' | 'asc'>('desc')

  // İlçe / Mahalle görünüm modu
  const [gorunumModu, setGorunumModu]       = useState<'ilce' | 'mahalle'>('ilce')
  const [mahalleler, setMahalleler]         = useState<MahalleKartiData[]>([])
  const [mahalleYukleniyor, setMahalleYukleniyor] = useState(false)
  const [ilceFiltreMahalle, setIlceFiltreMahalle] = useState<string>('')

  useEffect(() => {
    supabase.from('ilceler').select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setIlceCount(count) })
    supabase.from('mahalleler').select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setMahalleCount(count) })
    supabase.from('mahalle_tesisler').select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count) setTesisCount(count) })
  }, [])

  useEffect(() => {
    setMounted(true)
    supabase
      .from('ilceler')
      .select(`
        id, isim, slug, aciklama,
        koordinat_lat, koordinat_lng,
        ulasim_skoru, imkanlar_skoru,
        egitim_skoru, saglik_skoru,
        guvenlik_skoru, deprem_skoru,
        yasam_maliyeti_skoru,
        sakin_memnuniyeti_skoru,
        yesil_alan_skoru,
        kultur_skoru,
        genel_skor,
        deprem_fay_mesafe,
        deprem_son_yil,
        deprem_max_mag,
        deprem_yorum,
        deprem_guncellendi
      `)
      .order('genel_skor', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setIlceler(data as Ilce[])
      })
  }, [])

  // Mahalle moduna geçince veriyi yükle
  useEffect(() => {
    if (gorunumModu !== 'mahalle' || mahalleler.length > 0) return
    setMahalleYukleniyor(true)
    supabase
      .from('mahalleler')
      .select(`
        id, isim, slug, genel_skor,
        ulasim_skoru, saglik_skoru, egitim_skoru,
        imkanlar_skoru, deprem_skoru, kira_ortalama,
        yesil_alan_skoru, kultur_skoru,
        guvenlik_skoru, sakin_memnuniyeti_skoru,
        ilceler!inner(isim, slug)
      `)
      .order('genel_skor', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setMahalleler(data.map((m: any) => ({
            id:             m.id,
            slug:           m.slug,
            isim:           m.isim,
            ilce_slug:      m.ilceler.slug,
            ilce_isim:      m.ilceler.isim,
            genel_skor:     m.genel_skor     || 0,
            ulasim_skoru:   m.ulasim_skoru   || 0,
            saglik_skoru:   m.saglik_skoru   || 0,
            egitim_skoru:   m.egitim_skoru   || 0,
            imkanlar_skoru:          m.imkanlar_skoru          || 0,
            deprem_skoru:            m.deprem_skoru            || 0,
            yesil_alan_skoru:        m.yesil_alan_skoru        || 0,
            kultur_skoru:            m.kultur_skoru            || 0,
            guvenlik_skoru:          m.guvenlik_skoru          || 0,
            sakin_memnuniyeti_skoru: m.sakin_memnuniyeti_skoru || 0,
            kira_ortalama:           m.kira_ortalama           || null,
          })))
        }
        setMahalleYukleniyor(false)
      })
  }, [gorunumModu])

  useEffect(() => {
    const filterHandler  = () => setFiltrePaneliAcik(prev => !prev)
    const compareHandler = () => setKarsilastirmaPaneliAcik(prev => !prev)
    window.addEventListener('toggle-filter',  filterHandler)
    window.addEventListener('toggle-compare', compareHandler)
    return () => {
      window.removeEventListener('toggle-filter',  filterHandler)
      window.removeEventListener('toggle-compare', compareHandler)
    }
  }, [])

  const SIRALAMA_PARAMETRELER = [
    { key: 'genel_skor',              label: 'Genel'     },
    { key: 'ulasim_skoru',            label: 'Ulaşım'    },
    { key: 'guvenlik_skoru',          label: 'Güvenlik'  },
    { key: 'imkanlar_skoru',          label: 'İmkanlar'  },
    { key: 'egitim_skoru',            label: 'Eğitim'    },
    { key: 'saglik_skoru',            label: 'Sağlık'    },
    { key: 'deprem_skoru',            label: 'Deprem'    },
    { key: 'yesil_alan_skoru',        label: 'Yeşil Alan'},
    { key: 'kultur_skoru',            label: 'Kültür'    },
    { key: 'sakin_memnuniyeti_skoru', label: 'Sakinlik'  },
  ]

  const overallSiralama = useMemo(() => {
    const sirali = [...ilceler].sort((a, b) => b.genel_skor - a.genel_skor)
    const map: Record<string, number> = {}
    sirali.forEach((ilce, idx) => { map[ilce.slug] = idx + 1 })
    return map
  }, [ilceler])

  const filtrelenmisIlceler = useMemo(() => {
    let liste = [...ilceler]
    if (aramaMetni) {
      liste = liste.filter(i => i.isim.toLowerCase().includes(aramaMetni.toLowerCase()))
    }
    if (aktifFiltreler) {
      const f = aktifFiltreler
      liste = liste.filter(i =>
        i.ulasim_skoru        >= f.ulasimMin    &&
        i.guvenlik_skoru      >= f.guvenlikMin  &&
        i.egitim_skoru        >= f.egitimMin    &&
        i.saglik_skoru        >= f.saglikMin    &&
        i.deprem_skoru        >= f.depremDirenciMin
      )
    }
    liste.sort((a, b) => {
      const aVal = (a as any)[siralamaParametresi] || 0
      const bVal = (b as any)[siralamaParametresi] || 0
      return siralamaYonu === 'desc' ? bVal - aVal : aVal - bVal
    })
    return liste
  }, [ilceler, aramaMetni, aktifFiltreler, siralamaParametresi, siralamaYonu])

  const filtrelenmisIlcelerForMahalle = useMemo(() => {
    return ilceler.map(i => ({ slug: i.slug, isim: i.isim }))
      .sort((a, b) => a.isim.localeCompare(b.isim, 'tr'))
  }, [ilceler])

  const filtrelenmisMAhalleler = useMemo(() => {
    let liste = [...mahalleler]
    if (aramaMetni) {
      liste = liste.filter(m =>
        m.isim.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        m.ilce_isim.toLowerCase().includes(aramaMetni.toLowerCase())
      )
    }
    if (ilceFiltreMahalle) {
      liste = liste.filter(m => m.ilce_slug === ilceFiltreMahalle)
    }
    liste.sort((a, b) => {
      const aVal = (a as any)[siralamaParametresi] || 0
      const bVal = (b as any)[siralamaParametresi] || 0
      return siralamaYonu === 'desc' ? bVal - aVal : aVal - bVal
    })
    return liste
  }, [mahalleler, aramaMetni, ilceFiltreMahalle, siralamaParametresi, siralamaYonu])

  const toggleKarsilastirma = (slug: string) => {
    setKarsilastirmaListesi(prev =>
      prev.includes(slug) ? prev.filter(x => x !== slug) : prev.length < 3 ? [...prev, slug] : prev
    )
  }
  const toggleFavori = (id: string) =>
    setFavoriler(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div style={{ background:'var(--color-bg)', minHeight:'100vh' }}>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO                                         */}
      {/* ═══════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0a2820 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '80px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>

        {/* Dekoratif blur daireleri */}
        {[
          { top:'-100px', left:'-100px', w:500, colors:'rgba(37,211,102,0.08)' },
          { top:'20%', right:'-50px', w:400, colors:'rgba(18,140,126,0.10)' },
          { bottom:'-50px', left:'30%', w:350, colors:'rgba(37,211,102,0.06)' },
        ].map((b, i) => (
          <div key={i} style={{
            position:'absolute', pointerEvents:'none',
            width: b.w, height: b.w, borderRadius:'50%',
            background: `radial-gradient(circle, ${b.colors}, transparent 70%)`,
            top: b.top, left: (b as any).left, right: (b as any).right, bottom: (b as any).bottom,
          }} />
        ))}

        {/* 2 kolon */}
        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64, alignItems: 'center',
        }}>

          {/* ─── SOL KOLON ─── */}
          <div>
            {/* Badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.25)',
              borderRadius:99, padding:'6px 16px', marginBottom:20,
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#25d366', animation:'pulse-dot 2s infinite', flexShrink:0 }} />
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 }}>
                İstanbul Mahalle Analiz Platformu
              </span>
            </div>

            {/* Başlık */}
            <h1 style={{
              fontSize:'clamp(36px,4.5vw,56px)', fontWeight:800,
              lineHeight:1.1, letterSpacing:'-0.02em',
              margin:'0 0 16px', color:'white',
            }}>
              İstanbul'da{' '}Nerede<br />
              <span style={{
                background:'linear-gradient(135deg,#25d366,#86efac)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>
                Yaşamalısın?
              </span>
            </h1>

            {/* Alt başlık */}
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:18, lineHeight:1.6, maxWidth:440, marginBottom:36 }}>
              Mahalleleri 8 farklı parametreyle analiz et, sana en uygun yeri keşfet.
            </p>

            {/* CTA butonları */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
              <button
                onClick={() => document.getElementById('districts')?.scrollIntoView({ behavior:'smooth' })}
                style={{
                  background:'linear-gradient(135deg,#25d366,#22c55e)',
                  color:'#075e54', fontWeight:700, fontSize:16,
                  padding:'14px 28px', borderRadius:12, border:'none',
                  cursor:'pointer', boxShadow:'0 4px 20px rgba(37,211,102,0.35)',
                  transition:'transform 200ms, box-shadow 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(37,211,102,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(37,211,102,0.35)' }}
              >
                Analize Başla →
              </button>

              <button
                onClick={() => router.push('/quiz')}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  background:'rgba(37,211,102,0.15)',
                  border:'1.5px solid rgba(37,211,102,0.4)',
                  borderRadius:12, padding:'14px 24px',
                  fontSize:15, fontWeight:700,
                  color:'#25d366', cursor:'pointer',
                  transition:'all 200ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(37,211,102,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background='rgba(37,211,102,0.15)')}
              >
                🎯 Bana Uygun Yeri Bul
              </button>
            </div>

            {/* Güven sinyalleri */}
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ display:'flex' }}>
                {AVATARS.map((a, i) => (
                  <div key={i} style={{
                    width:32, height:32, borderRadius:'50%',
                    background: a.renk,
                    border:'2px solid #0a1628',
                    marginLeft: i > 0 ? -8 : 0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:700, color:'white',
                    position:'relative', zIndex: 5-i,
                  }}>
                    {a.harf}
                  </div>
                ))}
              </div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>
                500+ kullanıcı İstanbul'un en iyi mahallelerini keşfetti
              </span>
            </div>
          </div>

          {/* ─── SAĞ KOLON: Dashboard Mockup ─── */}
          <div style={{ position:'relative' }}>
            {/* Glassmorphism kart */}
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.10)',
              borderRadius:24, padding:24,
              backdropFilter:'blur(20px)',
              boxShadow:'0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              position:'relative',
            }}>

              {/* Dashboard başlık */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div>
                  <div style={{ color:'white', fontSize:14, fontWeight:700 }}>Mahalle Skoru</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:2 }}>Beşiktaş Analizi</div>
                </div>
                <div style={{
                  background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.3)',
                  borderRadius:99, padding:'4px 12px',
                  color:'#25d366', fontSize:12, display:'flex', alignItems:'center', gap:6,
                }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#25d366', animation:'pulse-dot 2s infinite' }} />
                  Canlı Veri
                </div>
              </div>

              {/* Skor göstergesi */}
              <div style={{
                display:'flex', alignItems:'center', gap:20, marginBottom:20,
                padding:16, background:'rgba(37,211,102,0.08)',
                border:'1px solid rgba(37,211,102,0.15)', borderRadius:16,
              }}>
                <MiniSkorDairesi />
                <div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>Genel Skor</div>
                  <div style={{ color:'white', fontSize:18, fontWeight:700, marginTop:2 }}>Beşiktaş</div>
                  <div style={{ color:'#25d366', fontSize:12, marginTop:4 }}>↑ Top %15</div>
                </div>
              </div>

              {/* Radar chart */}
              {mounted && (
                <div style={{ height:200, marginBottom:16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="param" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:10 }} />
                      <Radar
                        dataKey="skor"
                        fill="#25d366" fillOpacity={0.15}
                        stroke="#25d366" strokeWidth={1.5}
                        dot={{ fill:'#25d366', r:3 } as any}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* İlçe sıralaması */}
              <div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 10px' }}>
                  Top İlçeler
                </div>
                {topIlceler.map((ilce, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{
                      width:20, height:20, borderRadius:4, flexShrink:0,
                      background:`${ilce.renk}20`, color:ilce.renk,
                      fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {i+1}
                    </div>
                    <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, flex:1 }}>{ilce.isim}</span>
                    <div style={{ width:80, height:4, borderRadius:99, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${ilce.skor}%`, background:ilce.renk, borderRadius:99 }} />
                    </div>
                    <span style={{ color:ilce.renk, fontSize:12, fontWeight:700, minWidth:24, textAlign:'right' }}>{ilce.skor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating kart 1 */}
            <div className="hidden md:block" style={{
              position:'absolute', top:-20, left:-30,
              background:'rgba(7,94,84,0.9)', backdropFilter:'blur(12px)',
              border:'1px solid rgba(37,211,102,0.3)', borderRadius:14,
              padding:'12px 16px', animation:'float1 4s ease-in-out infinite',
              boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginBottom:4 }}>🚇 Ulaşım Skoru</div>
              <div style={{ color:'#25d366', fontSize:20, fontWeight:700 }}>88 / 100</div>
            </div>

            {/* Floating kart 2 */}
            <div className="hidden md:block" style={{
              position:'absolute', bottom:-20, right:-20,
              background:'rgba(37,211,102,0.12)', backdropFilter:'blur(12px)',
              border:'1px solid rgba(37,211,102,0.25)', borderRadius:14,
              padding:'12px 16px', animation:'float2 5s ease-in-out infinite 1s',
              boxShadow:'0 8px 24px rgba(0,0,0,0.25)',
            }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginBottom:4 }}>📍 1.062 Tesis</div>
              <div style={{ color:'white', fontSize:13, fontWeight:700 }}>Haritada Görün →</div>
            </div>

            {/* Floating kart 3 */}
            <div className="hidden md:block" style={{
              position:'absolute', top:30, right:-40,
              background:'rgba(255,255,255,0.06)', backdropFilter:'blur(12px)',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:14,
              padding:'10px 14px', animation:'float1 6s ease-in-out infinite 0.5s',
              boxShadow:'0 8px 24px rgba(0,0,0,0.2)',
            }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, marginBottom:4 }}>⭐ Sakin Memnuniyeti</div>
              <div style={{ color:'#fbbf24', fontSize:14 }}>★★★★☆  4.2</div>
            </div>
          </div>
        </div>

        {/* ─── STATS BAR ─── */}
        <div style={{
          maxWidth:1200, margin:'60px auto 0', width:'100%',
          background:'rgba(255,255,255,0.03)',
          borderTop:'1px solid rgba(255,255,255,0.08)',
          borderBottom:'1px solid rgba(255,255,255,0.08)',
          borderRadius:16, padding:'20px 24px',
          display:'flex', justifyContent:'center',
          gap: 'clamp(24px, 5vw, 64px)', flexWrap:'wrap',
        }}>
          {[
            { ikon: '🏙️', sayi: formatSayi(ilceCount),    etiket: 'İlçe'      },
            { ikon: '🏘️', sayi: formatSayi(mahalleCount), etiket: 'Mahalle'   },
            { ikon: '📍', sayi: formatSayi(tesisCount),   etiket: 'Tesis'     },
            { ikon: '📊', sayi: '8',                      etiket: 'Parametre' },
          ].map(({ ikon, sayi, etiket }) => (
            <div key={etiket} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(37,211,102,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                {ikon}
              </div>
              <div>
                <div style={{ color:'white', fontSize:20, fontWeight:800, lineHeight:1 }}>{sayi}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:3 }}>{etiket}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── İLÇELER ─── */}
      <section id="districts" style={{ background:'var(--color-bg)', paddingBottom:80 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>

          {/* ── QUIZ BANNER ── */}
          <div
            onClick={() => router.push('/quiz')}
            style={{
              background:'linear-gradient(135deg, #075e54 0%, #128c7e 60%, #25d366 100%)',
              borderRadius:20, padding:'28px 32px', marginTop:40, marginBottom:32,
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'space-between', gap:24,
              position:'relative', overflow:'hidden',
              boxShadow:'0 8px 32px rgba(7,94,84,0.2)',
              transition:'transform 200ms ease, box-shadow 200ms ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(7,94,84,0.3)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(7,94,84,0.2)'
            }}
          >
            <div style={{ position:'absolute', top:-30, right:120, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-20, right:60, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />

            <div style={{ zIndex:1 }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background:'rgba(37,211,102,0.25)', border:'1px solid rgba(37,211,102,0.4)',
                borderRadius:99, padding:'3px 12px', fontSize:11, fontWeight:700,
                color:'#25d366', marginBottom:10, letterSpacing:'0.05em', textTransform:'uppercase',
              }}>
                ✨ Kişiselleştirilmiş Öneri
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:6, lineHeight:1.2 }}>
                Sana en uygun ilçeyi bul
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.5, maxWidth:380 }}>
                6 kısa soruyla yaşam tarzına göre kişiselleştirilmiş ilçe önerisi al
              </div>
              <div style={{ display:'flex', gap:16, marginTop:14, flexWrap:'wrap' }}>
                {['⚡ 2 dakika', '🎯 Kişiselleştirilmiş', '🔒 Hesap gerekmez'].map(f => (
                  <span key={f} style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>{f}</span>
                ))}
              </div>
            </div>

            <div style={{ flexShrink:0, zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <div style={{
                background:'#25d366', color:'#075e54', borderRadius:14, padding:'14px 24px',
                fontSize:15, fontWeight:800, display:'flex', alignItems:'center', gap:8,
                boxShadow:'0 4px 16px rgba(37,211,102,0.4)', whiteSpace:'nowrap',
              }}>
                Testi Başlat <span style={{ fontSize:18 }}>→</span>
              </div>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Ücretsiz · Kayıt gerekmez</span>
            </div>
          </div>

          {/* Bölüm başlığı */}
          <div style={{ padding:'0 0 32px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16 }}>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:'#25d366', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                İSTANBUL
              </p>
              <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#111b21', margin:0 }}>
                En İyi Mahalleni Bul
              </h2>
              <p style={{ fontSize:15, color:'#667781', marginTop:6 }}>
                8 parametre, gerçek veri, tarafsız analiz
              </p>

              {/* İlçe / Mahalle toggle */}
              <div style={{ display:'flex', marginTop:16, background:'#f0f2f5', borderRadius:12, padding:4, width:'fit-content', gap:2 }}>
                {(['ilce', 'mahalle'] as const).map(mod => (
                  <button
                    key={mod}
                    onClick={() => { setGorunumModu(mod); setAramaMetni(''); setIlceFiltreMahalle('') }}
                    style={{
                      padding:'8px 20px', borderRadius:9, fontSize:14, fontWeight:700,
                      border:'none', cursor:'pointer', transition:'all 200ms',
                      background: gorunumModu === mod ? 'white' : 'transparent',
                      color:      gorunumModu === mod ? '#075e54' : '#667781',
                      boxShadow:  gorunumModu === mod ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                    }}
                  >
                    {mod === 'ilce' ? '🏙️ İlçe' : '🏘️ Mahalle'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setKarsilastirmaModu(m => !m); if (karsilastirmaModu) setKarsilastirmaListesi([]) }}
              style={{
                display:'flex', alignItems:'center', gap:8,
                background: karsilastirmaModu ? '#075e54' : 'white',
                color: karsilastirmaModu ? 'white' : '#374151',
                border: karsilastirmaModu ? 'none' : '1px solid #e9edef',
                padding:'10px 18px', borderRadius:10,
                fontSize:14, fontWeight:500, cursor:'pointer',
                transition:'all 200ms',
              }}
            >
              <GitCompare size={16} />
              {karsilastirmaModu ? 'Karşılaştırmayı Kapat' : 'Karşılaştır'}
            </button>
          </div>

          {/* Sticky filtre barı */}
          <div style={{
            position:'sticky', top:64, zIndex:40,
            background:'rgba(248,250,251,0.95)',
            backdropFilter:'blur(12px)',
            borderBottom:'1px solid #e9edef',
            padding:'14px 0', marginBottom:28,
          }}>
            {/* Üst satır: arama + sonuç sayısı */}
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:1, maxWidth:320 }}>
                <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                <input
                  type="text"
                  value={aramaMetni}
                  onChange={e => setAramaMetni(e.target.value)}
                  placeholder={gorunumModu === 'mahalle' ? 'Mahalle veya ilçe ara...' : 'İlçe ara...'}
                  style={{
                    width:'100%', background:'white',
                    border:'1.5px solid #e9edef', borderRadius:10,
                    padding:'10px 14px 10px 40px', fontSize:14, color:'#111b21',
                    outline:'none', transition:'border-color 200ms, box-shadow 200ms',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor='#25d366'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(37,211,102,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor='#e9edef'; e.currentTarget.style.boxShadow='none' }}
                />
              </div>
              {/* Mahalle modunda ilçe filtresi */}
              {gorunumModu === 'mahalle' && (
                <select
                  value={ilceFiltreMahalle}
                  onChange={e => setIlceFiltreMahalle(e.target.value)}
                  style={{
                    padding:'9px 14px', borderRadius:10, border:'1.5px solid #e9edef',
                    fontSize:14, color:'#374151', background:'white', cursor:'pointer',
                    outline:'none', minWidth:160,
                  }}
                >
                  <option value="">Tüm İlçeler</option>
                  {filtrelenmisIlcelerForMahalle.map(i => (
                    <option key={i.slug} value={i.slug}>{i.isim}</option>
                  ))}
                </select>
              )}

              <span style={{ fontSize:13, color:'#667781', marginLeft:'auto' }}>
                {gorunumModu === 'mahalle'
                  ? `${filtrelenmisMAhalleler.length} mahalle`
                  : `${filtrelenmisIlceler.length} ilçe`}{' · '}
                {siralamaParametresi === 'genel_skor'
                  ? 'Genel skora göre'
                  : `${SIRALAMA_PARAMETRELER.find(p => p.key === siralamaParametresi)?.label} parametresine göre`}
                {siralamaYonu === 'desc' ? ' ↓' : ' ↑'}
              </span>
            </div>

            {/* Alt satır: parametre sıralama */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', paddingTop:10, borderTop:'1px solid rgba(0,0,0,0.06)', marginTop:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>
                Sırala:
              </span>
              <div style={{ display:'flex', gap:4, overflowX:'auto', flexWrap:'nowrap', paddingBottom:2 }}>
                {SIRALAMA_PARAMETRELER.map(p => {
                  const aktif = siralamaParametresi === p.key
                  return (
                    <button
                      key={p.key}
                      onClick={() => {
                        if (aktif) {
                          setSiralamaYonu(y => y === 'desc' ? 'asc' : 'desc')
                        } else {
                          setSiralamaParametresi(p.key)
                          setSiralamaYonu('desc')
                        }
                      }}
                      style={{
                        display:'flex', alignItems:'center', gap:4,
                        padding:'5px 12px', borderRadius:8,
                        border: aktif ? 'none' : '1px solid #e9edef',
                        background: aktif ? '#075e54' : 'white',
                        color: aktif ? 'white' : '#374151',
                        fontSize:12, fontWeight: aktif ? 700 : 500,
                        cursor:'pointer', transition:'all 150ms ease',
                        whiteSpace:'nowrap', flexShrink:0,
                        boxShadow: aktif ? '0 2px 8px rgba(7,94,84,0.25)' : 'none',
                      }}
                    >
                      {p.label}
                      {aktif && <span style={{fontSize:10}}>{siralamaYonu === 'desc' ? '↓' : '↑'}</span>}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setSiralamaYonu(y => y === 'desc' ? 'asc' : 'desc')}
                style={{
                  display:'flex', alignItems:'center', gap:4,
                  padding:'5px 12px', borderRadius:8,
                  border:'1px solid #e9edef', background:'white',
                  color:'#374151', fontSize:12, fontWeight:500,
                  cursor:'pointer', flexShrink:0,
                }}
              >
                {siralamaYonu === 'desc' ? '↓ Yüksekten Düşüğe' : '↑ Düşükten Yükseğe'}
              </button>
              {siralamaParametresi !== 'genel_skor' && (
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'#dcf8c6', borderRadius:99, padding:'3px 10px', fontSize:11, color:'#075e54', fontWeight:600 }}>
                  {SIRALAMA_PARAMETRELER.find(p => p.key === siralamaParametresi)?.label} sıralaması aktif
                  <button
                    onClick={() => { setSiralamaParametresi('genel_skor'); setSiralamaYonu('desc') }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#075e54', padding:0, fontSize:13, lineHeight:1 }}
                  >×</button>
                </div>
              )}
            </div>
          </div>

          {/* Kartlar */}
          {gorunumModu === 'mahalle' ? (
            mahalleYukleniyor ? (
              <div style={{ textAlign:'center', padding:'80px 0' }}>
                <div style={{ width:32, height:32, border:'3px solid #25d366', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
                <p style={{ color:'#667781', fontSize:14 }}>935 mahalle yükleniyor...</p>
              </div>
            ) : filtrelenmisMAhalleler.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#374151', marginBottom:8 }}>Mahalle bulunamadı</h3>
                <button onClick={() => { setAramaMetni(''); setIlceFiltreMahalle('') }}
                  style={{ background:'white', color:'#374151', border:'1px solid #e9edef', borderRadius:8, padding:'8px 20px', fontSize:14, cursor:'pointer' }}>
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20, marginBottom:48 }}>
                {filtrelenmisMAhalleler.map((mah, idx) => (
                  <MahalleKarti
                    key={mah.id}
                    mahalle={mah}
                    sira={idx + 1}
                    aktifSiralama={siralamaParametresi}
                  />
                ))}
              </div>
            )
          ) : filtrelenmisIlceler.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
              <h3 style={{ fontSize:18, fontWeight:600, color:'#374151', marginBottom:8 }}>İlçe bulunamadı</h3>
              <p style={{ fontSize:14, color:'#9ca3af', marginBottom:20 }}>
                "{aramaMetni}" ile eşleşen ilçe yok
              </p>
              <button
                onClick={() => setAramaMetni('')}
                style={{ background:'white', color:'#374151', border:'1px solid #e9edef', borderRadius:8, padding:'8px 20px', fontSize:14, cursor:'pointer' }}
              >
                Aramayı Temizle
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20,
              marginBottom: 48,
            }}>
              {filtrelenmisIlceler.map((ilce, idx) => (
                <IlceKarti
                  key={ilce.slug}
                  ilce={ilce}
                  sira={idx + 1}
                  overallSira={overallSiralama[ilce.slug] || 0}
                  aktifSiralama={siralamaParametresi}
                  karsilastirmaModu={karsilastirmaModu}
                  secili={karsilastirmaListesi.includes(ilce.slug)}
                  onSecimDegis={toggleKarsilastirma}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Karşılaştırma paneli */}
      {karsilastirmaListesi.length >= 2 && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:50,
          background:'#075e54', padding:'16px 24px',
          display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
          boxShadow:'0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {karsilastirmaListesi.map(slug => {
              const ilce = ilceler.find(i => i.slug === slug)
              if (!ilce) return null
              return (
                <span key={slug} style={{
                  background:'rgba(255,255,255,0.15)', borderRadius:99,
                  padding:'6px 12px', fontSize:13, color:'white',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                  {ilce.isim}
                  <button onClick={() => toggleKarsilastirma(slug)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', lineHeight:1, padding:0, fontSize:14 }}>×</button>
                </span>
              )
            })}
          </div>
          <div style={{ flex:1, textAlign:'center' }}>
            <span style={{ color:'rgba(255,255,255,0.8)', fontSize:14 }}>{karsilastirmaListesi.length} ilçe seçildi</span>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <button
              onClick={() => setKarsilastirmaPaneliAcik(true)}
              style={{ background:'#25d366', color:'#075e54', fontWeight:700, padding:'10px 24px', borderRadius:10, fontSize:14, border:'none', cursor:'pointer' }}
            >
              Karşılaştır
            </button>
            <button
              onClick={() => setKarsilastirmaListesi([])}
              style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.6)', transition:'color 150ms' }}
              onMouseEnter={e => e.currentTarget.style.color='white'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <FiltrePaneli
        acik={filtrePaneliAcik}
        onKapat={() => setFiltrePaneliAcik(false)}
        onFiltrele={(f) => setAktifFiltreler(f)}
        sonucSayisi={filtrelenmisIlceler.length}
      />

      <KarsilastirmaPanel
        acik={karsilastirmaPaneliAcik}
        onKapat={() => setKarsilastirmaPaneliAcik(false)}
        seciliIlceler={ilceler.filter(i => karsilastirmaListesi.includes(i.slug))}
        onIlceCikar={(id) => toggleKarsilastirma(id)}
      />

      {/* ─── CTA ─── */}
      <section className="py-20 px-4" style={{ background:'#075e54' }}>
        <div className="container max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Karar vermeye hazır mısın?</h2>
          <p className="mb-8" style={{ color:'rgba(255,255,255,0.75)' }}>
            5 ilçeyi detaylı olarak karşılaştır, senin için en uygun mahalle tavsiyesi al.
          </p>
          <Link
            href="/karsilastir"
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl"
            style={{ background:'#25d366', color:'#075e54' }}
          >
            <TrendingUp size={18} />
            Şimdi Karşılaştır
          </Link>
        </div>
      </section>

    </div>
  )
}
