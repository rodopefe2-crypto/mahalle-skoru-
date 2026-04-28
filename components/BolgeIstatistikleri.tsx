'use client'

import { useEffect, useState } from 'react'
import { Loader2, BarChart3 } from 'lucide-react'
import { KategoriIstatistikKarti } from './istatistik/KategoriIstatistikKarti'
import {
  TESIS_KATEGORILERI,
  TesisSayisi,
} from '@/lib/bolgeIstatistikleri'

interface BolgeIstatistikleriProps {
  slug:    string
  tip:     'ilce' | 'mahalle'
  baslik?: string
}

export function BolgeIstatistikleri({
  slug, tip, baslik,
}: BolgeIstatistikleriProps) {
  const [veri, setVeri]             = useState<Record<string, Record<string, number>>>({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplam, setToplam]         = useState(0)

  useEffect(() => {
    const endpoint = tip === 'ilce'
      ? `/api/ilce/${slug}/istatistik`
      : `/api/mahalle/${slug}/istatistik`

    fetch(endpoint)
      .then(r => r.json())
      .then(d => {
        setVeri(d.istatistikler || {})
        setToplam(d.toplam || 0)
      })
      .catch(() => setVeri({}))
      .finally(() => setYukleniyor(false))
  }, [slug, tip])

  if (yukleniyor) return (
    <div style={{
      display:        'flex',
      justifyContent: 'center',
      padding:        '40px 0',
    }}>
      <Loader2
        size={28} color="#25d366"
        style={{animation: 'spin 1s linear infinite'}}
      />
    </div>
  )

  return (
    <section style={{marginBottom: 48}}>

      <div style={{
        display:        'flex',
        alignItems:     'flex-end',
        justifyContent: 'space-between',
        marginBottom:   20,
        flexWrap:       'wrap',
        gap:            12,
      }}>
        <div>
          <div style={{
            fontSize:      11,
            fontWeight:    700,
            color:         '#25d366',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom:  5,
            display:       'flex',
            alignItems:    'center',
            gap:           6,
          }}>
            <BarChart3 size={12}/>
            Bölge İstatistikleri
          </div>
          <h2 style={{
            fontSize:   22,
            fontWeight: 800,
            color:      '#111b21',
            marginBottom: 3,
          }}>
            {baslik || 'Tesis & Hizmet Analizi'}
          </h2>
          <p style={{fontSize: 13, color: '#667781'}}>
            Kategoriye tıklayarak detayları gör
          </p>
        </div>

        <div style={{
          background:   '#f0fdf4',
          border:       '1px solid #bbf7d0',
          borderRadius: 12,
          padding:      '10px 16px',
          textAlign:    'center',
        }}>
          <div style={{
            fontSize:   24,
            fontWeight: 900,
            color:      '#075e54',
            lineHeight: 1,
          }}>
            {toplam}
          </div>
          <div style={{fontSize: 11, color: '#667781', marginTop: 3}}>
            toplam tesis
          </div>
        </div>
      </div>

      <div style={{
        display:      'flex',
        flexWrap:     'wrap',
        gap:          8,
        marginBottom: 20,
      }}>
        {TESIS_KATEGORILERI.map(kat => {
          const katVerisi = veri[kat.id] || {}
          const katToplam = Object.values(katVerisi)
            .reduce((t, s) => t + s, 0)
          if (katToplam === 0) return null

          return (
            <div key={kat.id} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              background:   kat.acikRenk,
              border:       `1px solid ${kat.renk}25`,
              borderRadius: 99,
              padding:      '5px 12px',
              fontSize:     12,
              fontWeight:   600,
              color:        kat.renk,
            }}>
              <span>{kat.ikon}</span>
              <span>{kat.baslik}</span>
              <span style={{
                background:   kat.renk,
                color:        'white',
                borderRadius: 99,
                padding:      '1px 7px',
                fontSize:     10,
                fontWeight:   800,
              }}>
                {katToplam}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           12,
      }}>
        {TESIS_KATEGORILERI.map((kat, idx) => {
          const katVerisi = veri[kat.id] || {}
          const tesisler: TesisSayisi[] = Object.entries(katVerisi)
            .map(([altKategori, sayi]) => ({ altKategori, sayi }))

          return (
            <KategoriIstatistikKarti
              key={kat.id}
              kategori={kat}
              tesisler={tesisler}
              varsayilanAcik={idx === 0}
            />
          )
        })}
      </div>

      <div style={{
        textAlign:  'center',
        marginTop:  16,
        fontSize:   11,
        color:      '#9ca3af',
      }}>
        Veriler OpenStreetMap ve Foursquare OS Places kaynaklıdır
      </div>
    </section>
  )
}
