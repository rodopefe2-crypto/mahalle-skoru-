'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, GitCompare, SlidersHorizontal,
  Plus, Menu, X, ChevronRight, MapPin, Sparkles,
} from 'lucide-react'

const ilceler = ['Beşiktaş', 'Şişli', 'Kağıthane', 'Sarıyer', 'Beyoğlu']
const akillıOneri = [
  'Sosyal yaşamı yüksek ilçeler',
  'Ulaşımı en iyi ilçeler',
  'Aile dostu ilçeler',
  'Uygun fiyatlı ilçeler',
  'Güvenli ilçeler',
]

const MENU_LINKS = [
  { href: '/',            label: 'Ana Sayfa',                    vurgulu: false },
  { href: '/quiz',        label: '🎯 Mahallemi Bul — Testi Başlat', vurgulu: true  },
  { href: '/hakkimizda',  label: 'Hakkımızda',                   vurgulu: false },
  { href: '/iletisim',    label: 'İletişim',                     vurgulu: false },
  { href: '/karsilastir', label: 'Karşılaştır',                  vurgulu: false },
]

function slugify(isim: string) {
  return isim
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/\s+/g, '-')
}

export default function Navbar() {
  const [aramaMetni, setAramaMetni] = useState('')
  const [menuAcik, setMenuAcik]     = useState(false)
  const [oneriListesi, setOneriListesi] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    if (aramaMetni.length < 1) {
      setOneriListesi([])
      return
    }
    const ilceOneri    = ilceler.filter(i => i.toLowerCase().includes(aramaMetni.toLowerCase()))
    const akilliFiltrelı = akillıOneri.filter(o => o.toLowerCase().includes(aramaMetni.toLowerCase()))
    setOneriListesi([...ilceOneri, ...akilliFiltrelı].slice(0, 6))
  }, [aramaMetni])

  const isIlce = (oneri: string) => ilceler.includes(oneri)

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0,
        zIndex:50, height:64,
        background:'rgba(7,94,84,0.97)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        boxShadow:'0 1px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          maxWidth:1280, margin:'0 auto', padding:'0 16px',
          display:'flex', alignItems:'center', gap:12, height:'100%',
        }}>

          {/* ── LOGO ── */}
          <button
            onClick={() => router.push('/')}
            style={{
              flexShrink:0, display:'flex', alignItems:'center', gap:8,
              background:'none', border:'none', cursor:'pointer', padding:0,
            }}
          >
            <span style={{
              width:10, height:10, borderRadius:'50%', background:'#25d366',
              animation:'neonPulse 2s infinite', flexShrink:0,
            }} />
            <span style={{ color:'white', fontSize:17, fontWeight:700, letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>
              Mahalle Skoru
            </span>
          </button>

          {/* ── AKILLI ARAMA ── */}
          <div style={{ flex:1, maxWidth:480, margin:'0 auto', position:'relative' }}>
            <div style={{ position:'relative', width:'100%' }}>
              <Search
                size={16}
                style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.5)', pointerEvents:'none' }}
              />
              <input
                type="text"
                value={aramaMetni}
                onChange={e => setAramaMetni(e.target.value)}
                placeholder="İlçe ara... (Beşiktaş, Şişli...)"
                style={{
                  width:'100%', height:40,
                  background:'rgba(255,255,255,0.1)',
                  border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:99,
                  padding:'0 40px 0 42px',
                  color:'white', fontSize:14,
                  outline:'none', transition:'all 200ms',
                }}
                onFocus={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.borderColor = 'rgba(37,211,102,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,211,102,0.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              {aramaMetni && (
                <button
                  onClick={() => { setAramaMetni(''); setOneriListesi([]) }}
                  style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer',
                    color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center',
                    padding:0, transition:'color 150ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color='white'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* AUTOCOMPLETE DROPDOWN */}
            {oneriListesi.length > 0 && (
              <div style={{
                position:'absolute', top:'calc(100% + 8px)', left:0, right:0,
                background:'#0f2419',
                border:'1px solid rgba(37,211,102,0.2)',
                borderRadius:16, overflow:'hidden',
                boxShadow:'0 20px 40px rgba(0,0,0,0.4)',
                zIndex:60,
              }}>
                <div style={{ padding:'10px 16px 6px', fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Öneriler
                </div>
                {oneriListesi.map((oneri, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (isIlce(oneri)) {
                        router.push('/ilce/' + slugify(oneri))
                      } else {
                        setAramaMetni(oneri)
                      }
                      setOneriListesi([])
                    }}
                    style={{
                      padding:'10px 16px',
                      display:'flex', alignItems:'center', gap:10,
                      cursor:'pointer', transition:'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,211,102,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {isIlce(oneri)
                      ? <MapPin size={14} color="#25d366" />
                      : <Sparkles size={14} color="#8b5cf6" />
                    }
                    <span style={{ color:'white', fontSize:14, flex:1 }}>{oneri}</span>
                    <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── SAĞ: AKSİYON BUTONLARI ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>

            {/* Karşılaştır */}
            <button
              onClick={() => router.push('/karsilastir')}
              className="hidden md:flex"
              style={{
                alignItems:'center', gap:6,
                background:'rgba(255,255,255,0.08)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:10, padding:'8px 14px',
                color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500,
                cursor:'pointer', transition:'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; e.currentTarget.style.color='white' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}
            >
              <GitCompare size={15} />
              Karşılaştır
            </button>

            {/* Filtrele */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-filter'))}
              className="hidden md:flex"
              style={{
                alignItems:'center', gap:6,
                background:'rgba(255,255,255,0.08)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:10, padding:'8px 14px',
                color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500,
                cursor:'pointer', transition:'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; e.currentTarget.style.color='white' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}
            >
              <SlidersHorizontal size={15} />
              Filtrele
            </button>

            {/* Quiz CTA — sadece md+ */}
            <button
              onClick={() => router.push('/quiz')}
              className="hidden md:flex"
              style={{
                alignItems:'center', gap:6,
                background:'rgba(37,211,102,0.15)',
                border:'1px solid rgba(37,211,102,0.35)',
                borderRadius:99, padding:'7px 16px',
                fontSize:13, fontWeight:600,
                color:'#25d366', cursor:'pointer',
                transition:'all 200ms', whiteSpace:'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(37,211,102,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(37,211,102,0.15)' }}
            >
              🎯 Mahallemi Bul
            </button>

            {/* Yorum Ekle — sadece md+ */}
            <button
              onClick={() => router.push('/yorum-ekle')}
              className="hidden md:flex"
              style={{
                alignItems:'center', gap:6,
                background:'#25d366', color:'#075e54',
                fontWeight:700, fontSize:13,
                padding:'8px 16px', borderRadius:10,
                border:'none', cursor:'pointer',
                transition:'filter 150ms, transform 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.08)'; e.currentTarget.style.transform='scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.filter='none'; e.currentTarget.style.transform='scale(1)' }}
            >
              <Plus size={14} />
              Yorum Ekle
            </button>

            {/* Hamburger — sadece mobil */}
            <button
              onClick={() => setMenuAcik(!menuAcik)}
              className="md:hidden"
              style={{
                width:32, height:32,
                background:'rgba(255,255,255,0.08)',
                border:'none', borderRadius:8,
                color:'white', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              {menuAcik ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBİL MENÜ ── */}
      {menuAcik && (
        <div style={{
          position:'fixed', top:64, left:0, right:0, bottom:0,
          background:'rgba(7,94,84,0.98)',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          zIndex:49, padding:24,
          display:'flex', flexDirection:'column', gap:4,
        }}>
          {MENU_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => { setMenuAcik(false); router.push(link.href) }}
              style={{
                padding: link.vurgulu ? '12px 16px' : '14px 16px',
                borderRadius: link.vurgulu ? 10 : 12,
                color: link.vurgulu ? '#25d366' : 'white',
                fontSize: 16,
                fontWeight: link.vurgulu ? 700 : 500,
                background: link.vurgulu ? 'rgba(37,211,102,0.12)' : 'none',
                border: link.vurgulu ? '1px solid rgba(37,211,102,0.25)' : 'none',
                cursor:'pointer', textAlign:'left', transition:'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = link.vurgulu ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = link.vurgulu ? 'rgba(37,211,102,0.12)' : 'transparent')}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setMenuAcik(false); router.push('/yorum-ekle') }}
            style={{
              marginTop:'auto',
              background:'#25d366', color:'#075e54',
              fontWeight:700, fontSize:15,
              padding:14, borderRadius:12,
              border:'none', cursor:'pointer', width:'100%',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}
          >
            <Plus size={16} />
            Yorum Ekle
          </button>
        </div>
      )}
    </>
  )
}
