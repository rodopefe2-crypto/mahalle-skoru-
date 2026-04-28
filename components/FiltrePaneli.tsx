'use client'

import { useState, useEffect } from 'react'
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react'

export interface FiltreState {
  yasanTarzi: string[]
  ulasimMin: number
  guvenlikMin: number
  egitimMin: number
  saglikMin: number
  yasam_maliyeti: [number, number]
  depremDirenciMin: number
  oncelikliParam: string
}

interface FiltrePaneliProps {
  acik: boolean
  onKapat: () => void
  onFiltrele: (filtreler: FiltreState) => void
  sonucSayisi: number
}

const BASLANGIC: FiltreState = {
  yasanTarzi: [],
  ulasimMin: 0,
  guvenlikMin: 0,
  egitimMin: 0,
  saglikMin: 0,
  yasam_maliyeti: [0, 100],
  depremDirenciMin: 0,
  oncelikliParam: '',
}

function Slider({ label, value, onChange, renk }: {
  label: string
  value: number
  onChange: (v: number) => void
  renk: string
}) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:13, color:renk, fontWeight:700 }}>{value}+</span>
      </div>
      <div style={{ position:'relative', marginTop:8 }}>
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width:'100%', accentColor:renk } as React.CSSProperties}
        />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9ca3af', marginTop:2 }}>
          <span>0</span><span>50</span><span>100</span>
        </div>
      </div>
    </div>
  )
}

export default function FiltrePaneli({ acik, onKapat, onFiltrele, sonucSayisi }: FiltrePaneliProps) {
  const [filtreler, setFiltreler] = useState<FiltreState>(BASLANGIC)

  const toggleYasamTarzi = (deger: string) => {
    setFiltreler(prev => ({
      ...prev,
      yasanTarzi: prev.yasanTarzi.includes(deger)
        ? prev.yasanTarzi.filter(x => x !== deger)
        : [...prev.yasanTarzi, deger],
    }))
  }

  return (
    <>
      {/* Overlay */}
      {acik && (
        <div
          onClick={onKapat}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.4)',
            zIndex:55, backdropFilter:'blur(2px)',
            WebkitBackdropFilter:'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:'min(400px, 100vw)',
        background:'white', zIndex:60,
        display:'flex', flexDirection:'column',
        boxShadow:'-20px 0 60px rgba(0,0,0,0.15)',
        transform: acik ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 350ms cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* ── BAŞLIK ── */}
        <div style={{
          padding:'20px 24px',
          borderBottom:'1px solid #f0f2f5',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <SlidersHorizontal size={18} color="#075e54" />
            <span style={{ fontSize:16, fontWeight:700, color:'#111b21' }}>Filtrele</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button
              onClick={() => setFiltreler(BASLANGIC)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'none', border:'none', cursor:'pointer',
                color:'#667781', fontSize:13, padding:'6px 10px', borderRadius:8,
                transition:'color 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color='#075e54'}
              onMouseLeave={e => e.currentTarget.style.color='#667781'}
            >
              <RotateCcw size={14} />
              Sıfırla
            </button>
            <button
              onClick={onKapat}
              style={{
                width:32, height:32, background:'#f0f2f5', border:'none',
                borderRadius:8, cursor:'pointer', display:'flex',
                alignItems:'center', justifyContent:'center', transition:'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background='#e5e7eb')}
              onMouseLeave={e => (e.currentTarget.style.background='#f0f2f5')}
            >
              <X size={16} color="#374151" />
            </button>
          </div>
        </div>

        {/* ── İÇERİK ── */}
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>

          {/* BÖLÜM 1 — Yaşam Tarzı */}
          <div style={{ marginBottom:28 }}>
            <p style={{ fontSize:13, textTransform:'uppercase', color:'#667781', letterSpacing:'0.06em', marginBottom:12, fontWeight:600 }}>
              Yaşam Tarzı
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {['Sakin 🌿', 'Sosyal 🎉', 'Aile 👨‍👩‍👧', 'Öğrenci 📚'].map(chip => {
                const secili = filtreler.yasanTarzi.includes(chip)
                return (
                  <button
                    key={chip}
                    onClick={() => toggleYasamTarzi(chip)}
                    style={{
                      padding:'8px 16px', borderRadius:99,
                      fontSize:13, fontWeight:500, cursor:'pointer',
                      border:'none', transition:'all 200ms',
                      background: secili ? '#075e54' : '#f0f2f5',
                      color: secili ? 'white' : '#374151',
                      boxShadow: secili ? '0 2px 8px rgba(7,94,84,0.25)' : 'none',
                    }}
                    onMouseEnter={e => { if (!secili) e.currentTarget.style.background='#e5e7eb' }}
                    onMouseLeave={e => { if (!secili) e.currentTarget.style.background='#f0f2f5' }}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>
          </div>

          {/* BÖLÜM 2 — Parametre Skorları */}
          <div style={{ marginBottom:28 }}>
            <p style={{ fontSize:13, textTransform:'uppercase', color:'#667781', letterSpacing:'0.06em', marginBottom:16, fontWeight:600 }}>
              Minimum Skorlar
            </p>
            <Slider label="🚇 Ulaşım"          value={filtreler.ulasimMin}       onChange={v => setFiltreler(p => ({...p, ulasimMin: v}))}       renk="#3b82f6" />
            <div style={{ marginTop:20 }}>
              <Slider label="🛡 Güvenlik"        value={filtreler.guvenlikMin}     onChange={v => setFiltreler(p => ({...p, guvenlikMin: v}))}     renk="#f59e0b" />
            </div>
            <div style={{ marginTop:20 }}>
              <Slider label="📚 Eğitim"          value={filtreler.egitimMin}       onChange={v => setFiltreler(p => ({...p, egitimMin: v}))}       renk="#8b5cf6" />
            </div>
            <div style={{ marginTop:20 }}>
              <Slider label="🏥 Sağlık"          value={filtreler.saglikMin}       onChange={v => setFiltreler(p => ({...p, saglikMin: v}))}       renk="#ef4444" />
            </div>
            <div style={{ marginTop:20 }}>
              <Slider label="⚡ Deprem Direnci"  value={filtreler.depremDirenciMin} onChange={v => setFiltreler(p => ({...p, depremDirenciMin: v}))} renk="#f97316" />
            </div>
          </div>

          {/* BÖLÜM 3 — Öncelikli Parametre */}
          <div>
            <p style={{ fontSize:13, textTransform:'uppercase', color:'#667781', letterSpacing:'0.06em', marginBottom:4, fontWeight:600 }}>
              En Önemli Parametre
            </p>
            <p style={{ fontSize:11, color:'#9ca3af', marginBottom:12 }}>
              Sonuçlar bu parametreye göre ağırlıklandırılır
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {['Ulaşım','Güvenlik','Eğitim','Sağlık','Yaşam Maliyeti','Deprem Direnci'].map(param => {
                const secili = filtreler.oncelikliParam === param
                return (
                  <button
                    key={param}
                    onClick={() => setFiltreler(p => ({...p, oncelikliParam: secili ? '' : param}))}
                    style={{
                      padding:10, borderRadius:10,
                      border:`1.5px solid ${secili ? '#25d366' : '#e9edef'}`,
                      background: secili ? '#f0fdf4' : 'white',
                      color: secili ? '#075e54' : '#667781',
                      fontSize:13, fontWeight:500,
                      cursor:'pointer', textAlign:'center', transition:'all 200ms',
                    }}
                    onMouseEnter={e => { if (!secili) e.currentTarget.style.borderColor='#d1d5db' }}
                    onMouseLeave={e => { if (!secili) e.currentTarget.style.borderColor='#e9edef' }}
                  >
                    {param}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── ALT ── */}
        <div style={{
          padding:'16px 24px',
          borderTop:'1px solid #f0f2f5',
          background:'white', flexShrink:0,
        }}>
          <p style={{ textAlign:'center', marginBottom:12, fontSize:13, color:'#667781' }}>
            {sonucSayisi} ilçe bu kriterlere uyuyor
          </p>
          <button
            onClick={() => { onFiltrele(filtreler); onKapat() }}
            style={{
              width:'100%',
              background:'linear-gradient(135deg,#25d366,#22c55e)',
              color:'#075e54', fontWeight:700, fontSize:15,
              padding:14, borderRadius:12, border:'none',
              cursor:'pointer', transition:'filter 150ms, transform 150ms',
              boxShadow:'0 4px 16px rgba(37,211,102,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.05)'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter='none'; e.currentTarget.style.transform='translateY(0)' }}
          >
            Sonuçları Göster
          </button>
        </div>
      </div>
    </>
  )
}
