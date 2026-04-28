'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TesisStatKarti } from './TesisStatKarti'
import {
  TesisKategori, TesisSayisi,
  yogunlukHesapla, insightUret,
} from '@/lib/bolgeIstatistikleri'

interface KategoriIstatistikKartiProps {
  kategori:  TesisKategori
  tesisler:  TesisSayisi[]
  varsayilanAcik?: boolean
}

const YOGUNLUK_RENK = {
  'Düşük':      { renk: '#9ca3af', bg: '#f3f4f6' },
  'Orta':       { renk: '#f59e0b', bg: '#fffbeb' },
  'Yüksek':     { renk: '#10b981', bg: '#ecfdf5' },
  'Çok Yüksek': { renk: '#25d366', bg: '#f0fdf4' },
}

export function KategoriIstatistikKarti({
  kategori, tesisler, varsayilanAcik = false,
}: KategoriIstatistikKartiProps) {
  const [acik, setAcik] = useState(varsayilanAcik)

  const toplam = tesisler.reduce((t, s) => t + s.sayi, 0)
  const yogunluk = yogunlukHesapla(toplam, kategori.id)
  const insight  = insightUret(kategori.id, yogunluk, toplam)
  const yogRenk  = YOGUNLUK_RENK[yogunluk]

  if (toplam === 0) return null

  return (
    <div style={{
      background:    'white',
      borderRadius:  16,
      border:        `1.5px solid ${acik ? kategori.renk + '40' : '#e9edef'}`,
      overflow:      'hidden',
      transition:    'all 250ms ease',
      boxShadow:     acik
        ? `0 8px 24px ${kategori.renk}15`
        : '0 1px 3px rgba(0,0,0,0.04)',
    }}>

      <div
        onClick={() => setAcik(p => !p)}
        style={{
          padding:        '16px 20px',
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          cursor:         'pointer',
          background:     acik ? kategori.renk + '06' : 'white',
          borderBottom:   acik ? `1px solid ${kategori.renk}15` : 'none',
        }}
      >
        <div style={{
          width:          44,
          height:         44,
          borderRadius:   12,
          background:     kategori.acikRenk,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       22,
          flexShrink:     0,
        }}>
          {kategori.ikon}
        </div>

        <div style={{flex: 1}}>
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
            marginBottom: 3,
          }}>
            <span style={{
              fontSize:   15,
              fontWeight: 700,
              color:      '#111b21',
            }}>
              {kategori.baslik}
            </span>
            <span style={{
              background:   yogRenk.bg,
              color:        yogRenk.renk,
              borderRadius: 99,
              padding:      '2px 10px',
              fontSize:     10,
              fontWeight:   700,
            }}>
              {yogunluk}
            </span>
          </div>
          <div style={{fontSize: 12, color: '#667781'}}>
            {insight}
          </div>
        </div>

        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          flexShrink: 0,
        }}>
          <div style={{textAlign: 'right'}}>
            <div style={{
              fontSize:   22,
              fontWeight: 900,
              color:      kategori.renk,
              lineHeight: 1,
            }}>
              {toplam}
            </div>
            <div style={{
              fontSize: 10,
              color:    '#9ca3af',
            }}>
              toplam
            </div>
          </div>
          {acik
            ? <ChevronUp size={16} color="#9ca3af"/>
            : <ChevronDown size={16} color="#9ca3af"/>
          }
        </div>
      </div>

      {acik && (
        <div style={{padding: '16px 20px'}}>
          <div style={{
            display:               'grid',
            gridTemplateColumns:   'repeat(auto-fill, minmax(160px, 1fr))',
            gap:                   10,
          }}>
            {kategori.altKategoriler.map((altKat, idx) => {
              const bulunan = tesisler.find(
                t => t.altKategori === altKat.key
              )
              const sayi = bulunan?.sayi || 0

              return (
                <TesisStatKarti
                  key={altKat.key}
                  ikon={altKat.ikon}
                  label={altKat.label}
                  sayi={sayi}
                  birim={altKat.birim}
                  renk={kategori.renk}
                  acikRenk={kategori.acikRenk}
                  animDelay={idx * 60}
                />
              )
            })}
          </div>

          <div style={{
            marginTop:    16,
            paddingTop:   14,
            borderTop:    `1px solid ${kategori.renk}15`,
            display:      'flex',
            alignItems:   'center',
            gap:          10,
          }}>
            <div style={{
              flex:       1,
              background: '#f0f2f5',
              height:     6,
              borderRadius: 99,
              overflow:   'hidden',
            }}>
              <div style={{
                height:       '100%',
                width:        Math.min(toplam * 2, 100) + '%',
                background:   kategori.renk,
                borderRadius: 99,
                transition:   'width 800ms ease-out',
              }}/>
            </div>
            <span style={{
              fontSize:   12,
              color:      kategori.renk,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {toplam} tesis
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
