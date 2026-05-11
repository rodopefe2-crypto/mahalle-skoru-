'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { UnifiedParametre } from '@/lib/unifiedParametre'
import { DepremRiskKarti } from '@/components/DepremRiskKarti'
import { KIRA_VERISI, kiraEtiketi, kiraRengi } from '@/lib/kiraVerisi'

interface DepremVeri {
  yorum:       string | null
  fayMesafe:   number | null
  sonYil:      number | null
  maxMag:      number | null
  guncellendi: string | null
}

import type { TesisItem } from './UnifiedParametreListesi'

const TESIS_IKON: Record<string, string> = {
  hospital:      '🏥',
  clinic:        '🏥',
  pharmacy:      '💊',
  dentist:       '🦷',
  doctors:       '👨‍⚕️',
  school:        '🏫',
  university:    '🎓',
  college:       '🎓',
  kindergarten:  '👶',
  library:       '📚',
  museum:        '🏛️',
  art_gallery:   '🎨',
  movie_theater: '🎬',
  park:          '🌳',
  cinema:        '🎬',
  theatre:       '🎭',
  gallery:       '🖼️',
  arts_centre:   '🎨',
  sports_centre: '🏋️',
  playground:    '🎠',
  garden:        '🌿',
  // Türkçe keyler
  hastane:       '🏥',
  eczane:        '💊',
  klinik:        '🩺',
  okul:          '🏫',
  universite:    '🎓',
  anaokulu:      '👶',
  kutuphane:     '📚',
  muze:          '🏛️',
  sinema:        '🎬',
  tiyatro:       '🎭',
  galeri:        '🖼️',
}

interface Props {
  parametre:       UnifiedParametre
  varsayilanAcik?: boolean
  index:           number
  depremVeri?:     DepremVeri
  ilceSlug?:       string
  tesisListesi?:   Record<string, TesisItem[]>  // alt_kategori → TesisItem[]
}

function skorRengi(skor: number): string {
  if (skor >= 75) return '#25d366'
  if (skor >= 55) return '#f59e0b'
  if (skor >= 35) return '#f97316'
  return '#ef4444'
}

function skorEtiketi(skor: number): string {
  if (skor >= 80) return 'Mükemmel'
  if (skor >= 70) return 'Çok İyi'
  if (skor >= 55) return 'İyi'
  if (skor >= 40) return 'Orta'
  return 'Gelişime Açık'
}

const KAT_TANIMLAR: Record<string, { key: string; label: string; ikon: string; renk: string; bg: string }[]> = {
  saglik: [
    { key: 'hospital', label: 'Hastane',     ikon: '🏥', renk: '#ef4444', bg: '#fef2f2' },
    { key: 'clinic',   label: 'Klinik',      ikon: '🩺', renk: '#f97316', bg: '#fff7ed' },
    { key: 'pharmacy', label: 'Eczane',      ikon: '💊', renk: '#10b981', bg: '#ecfdf5' },
    { key: 'dentist',  label: 'Diş Hekimi',  ikon: '🦷', renk: '#06b6d4', bg: '#ecfeff' },
    { key: 'doctors',  label: 'Doktor',      ikon: '👨‍⚕️', renk: '#8b5cf6', bg: '#f5f3ff' },
  ],
  egitim: [
    { key: 'kindergarten', label: 'Anaokulu',      ikon: '👶', renk: '#f59e0b', bg: '#fffbeb' },
    { key: 'school',       label: 'İlk/Orta/Lise', ikon: '🏫', renk: '#3b82f6', bg: '#eff6ff' },
    { key: 'university',   label: 'Üniversite',    ikon: '🎓', renk: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'college',      label: 'Kolej',         ikon: '🏛️', renk: '#06b6d4', bg: '#ecfeff' },
    { key: 'library',      label: 'Kütüphane',     ikon: '📚', renk: '#10b981', bg: '#ecfdf5' },
  ],
  kultur: [
    { key: 'museum',         label: 'Müze',       ikon: '🏛️', renk: '#f59e0b', bg: '#fffbeb' },
    { key: 'art_gallery',    label: 'Galeri',     ikon: '🎨', renk: '#ec4899', bg: '#fdf2f8' },
    { key: 'movie_theater',  label: 'Sinema',     ikon: '🎬', renk: '#6366f1', bg: '#eef2ff' },
    { key: 'library',        label: 'Kütüphane',  ikon: '📚', renk: '#10b981', bg: '#ecfdf5' },
    { key: 'theatre',        label: 'Tiyatro',    ikon: '🎭', renk: '#8b5cf6', bg: '#f5f3ff' },
  ],
  yesil: [
    { key: 'park',            label: 'Park',       ikon: '🌳', renk: '#22c55e', bg: '#f0fdf4' },
    { key: 'natural_feature', label: 'Doğal Alan', ikon: '🏔️', renk: '#84cc16', bg: '#f7fee7' },
    { key: 'playground',      label: 'Oyun Alanı', ikon: '🎠', renk: '#f59e0b', bg: '#fffbeb' },
    { key: 'sports_centre',   label: 'Spor Mrk.',  ikon: '🏋️', renk: '#3b82f6', bg: '#eff6ff' },
    { key: 'garden',          label: 'Bahçe',      ikon: '🌿', renk: '#10b981', bg: '#ecfdf5' },
  ],
}

export function UnifiedParametreKarti({
  parametre, varsayilanAcik = false, index, depremVeri, ilceSlug, tesisListesi = {},
}: Props) {
  const [acik, setAcik]                 = useState(varsayilanAcik)
  const [acikKategori, setAcikKategori] = useState<string | null>(null)

  const toggleKategori = (key: string) =>
    setAcikKategori(prev => (prev === key ? null : key))

  const sRenk   = skorRengi(parametre.skor)
  const sEtiket = skorEtiketi(parametre.skor)

  const maxSayi = Math.max(
    ...parametre.altKategoriler.map(a => a.sayi), 1
  )

  return (
    <div style={{
      background:    'white',
      borderRadius:  16,
      border:        acik
        ? `1.5px solid ${parametre.renk}50`
        : '1.5px solid #e9edef',
      overflow:      'hidden',
      transition:    'all 250ms ease',
      boxShadow:     acik
        ? `0 8px 28px ${parametre.renk}12`
        : '0 1px 3px rgba(0,0,0,0.04)',
      animation:     `kartGir 350ms ease-out forwards`,
      animationDelay:`${index * 60}ms`,
      opacity:       0,
    }}>

      {/* ── BAŞLIK SATIRI ── */}
      <div
        onClick={() => setAcik(p => !p)}
        style={{
          padding:        '16px 20px',
          display:        'flex',
          alignItems:     'center',
          gap:            14,
          cursor:         'pointer',
          background:     acik ? parametre.renk + '06' : 'white',
          borderBottom:   acik ? `1px solid ${parametre.renk}15` : 'none',
        }}
      >
        {/* İkon */}
        <div style={{
          width:          44,
          height:         44,
          borderRadius:   12,
          background:     parametre.acikRenk,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       22,
          flexShrink:     0,
        }}>
          {parametre.ikon}
        </div>

        {/* Başlık + insight */}
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{marginBottom: 3}}>
            <span style={{
              fontSize:   15,
              fontWeight: 700,
              color:      '#111b21',
            }}>
              {parametre.baslik}
            </span>
          </div>
          <div style={{
            fontSize:     12,
            color:        '#667781',
            lineHeight:   1.4,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {parametre.insight}
          </div>
        </div>

        {/* Skor göstergesi — büyük ve çarpıcı */}
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          gap:            4,
        }}>
          <div style={{
            position:   'relative',
            width:      72,
            height:     72,
            flexShrink: 0,
          }}>
            <svg
              width={72} height={72}
              viewBox="0 0 72 72"
              style={{position: 'absolute', top: 0, left: 0}}
            >
              <circle cx="36" cy="36" r="30"
                fill="none" stroke="#f0f2f5" strokeWidth="6"
              />
              <circle cx="36" cy="36" r="30"
                fill="none"
                stroke={sRenk}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(parametre.skor / 100) * (2 * Math.PI * 30)} ${2 * Math.PI * 30}`}
                strokeDashoffset={2 * Math.PI * 30 * 0.25}
                style={{transition: 'stroke-dasharray 1s ease-out'}}
              />
            </svg>
            <div style={{
              position:       'absolute',
              inset:          0,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontSize:   18,
                fontWeight: 900,
                color:      sRenk,
                lineHeight: 1,
              }}>
                {parametre.skor}
              </span>
              <span style={{fontSize: 9, color: '#9ca3af'}}>
                /100
              </span>
            </div>
          </div>

          {/* Skor etiketi dairenin altında */}
          <div style={{
            background:   sRenk + '18',
            color:        sRenk,
            borderRadius: 99,
            padding:      '2px 10px',
            fontSize:     10,
            fontWeight:   700,
            whiteSpace:   'nowrap',
          }}>
            {sEtiket}
          </div>
        </div>

        {acik
          ? <ChevronUp   size={16} color="#9ca3af" style={{flexShrink: 0}}/>
          : <ChevronDown size={16} color="#9ca3af" style={{flexShrink: 0}}/>
        }
      </div>

      {/* ── AÇIK İÇERİK ── */}
      {acik && (
        <div style={{padding: '16px 20px'}}>

          {/* Skor progress barı */}
          <div style={{marginBottom: 16}}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   6,
            }}>
              <span style={{fontSize: 11, color: '#9ca3af'}}>
                Performans Skoru
              </span>
              <span style={{
                fontSize:   13,
                fontWeight: 700,
                color:      sRenk,
              }}>
                {parametre.skor} / 100
              </span>
            </div>
            <div style={{
              background:   '#f0f2f5',
              height:       8,
              borderRadius: 99,
              overflow:     'hidden',
            }}>
              <div style={{
                height:       '100%',
                width:        parametre.skor + '%',
                background:   `linear-gradient(90deg, ${sRenk}cc, ${sRenk})`,
                borderRadius: 99,
                transition:   'width 800ms ease-out',
                boxShadow:    `0 0 8px ${sRenk}40`,
              }}/>
            </div>
          </div>

          {/* Alt kategori listesi */}
          {parametre.altKategoriler.filter(a => a.sayi > 0).length > 0 && (
            <div>
              <div style={{
                fontSize:      10,
                fontWeight:    700,
                color:         '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom:  10,
              }}>
                Detaylı Dağılım
              </div>

              <div style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           8,
              }}>
                {parametre.altKategoriler
                  .filter(a => a.sayi > 0)
                  .reduce((acc, curr) => {
                    const mevcut = acc.find(a => a.label === curr.label)
                    if (mevcut) { mevcut.sayi += curr.sayi; return acc }
                    return [...acc, curr]
                  }, [] as typeof parametre.altKategoriler)
                  .sort((x, y) => y.sayi - x.sayi)
                  .map((alt, idx) => {
                    const barYuzde = Math.round((alt.sayi / maxSayi) * 100)
                    return (
                      <div key={alt.key} style={{
                        display:     'flex',
                        alignItems:  'center',
                        gap:         10,
                        padding:     '8px 12px',
                        borderRadius:10,
                        background:  alt.vurgulu ? parametre.acikRenk : '#fafafa',
                        border:      alt.vurgulu
                          ? `1px solid ${parametre.renk}20`
                          : '1px solid transparent',
                      }}>
                        <span style={{
                          fontSize:   16,
                          flexShrink: 0,
                          width:      24,
                          textAlign:  'center',
                        }}>
                          {alt.ikon}
                        </span>

                        <span style={{
                          fontSize:   13,
                          color:      '#374151',
                          minWidth:   120,
                          flexShrink: 0,
                          fontWeight: alt.vurgulu ? 600 : 400,
                        }}>
                          {alt.label}
                        </span>

                        <div style={{
                          flex:         1,
                          background:   '#f0f2f5',
                          height:       6,
                          borderRadius: 99,
                          overflow:     'hidden',
                        }}>
                          <div style={{
                            height:       '100%',
                            width:        barYuzde + '%',
                            background:   parametre.renk,
                            borderRadius: 99,
                            transition:   `width ${600 + idx * 80}ms ease-out`,
                            opacity:      alt.vurgulu ? 1 : 0.65,
                          }}/>
                        </div>

                        <div style={{
                          background:   parametre.renk + '15',
                          color:        parametre.renk,
                          borderRadius: 99,
                          padding:      '3px 10px',
                          fontSize:     12,
                          fontWeight:   800,
                          minWidth:     32,
                          textAlign:    'center',
                          flexShrink:   0,
                        }}>
                          {alt.sayi}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Kira analizi — sadece yasam_maliyeti */}
          {parametre.id === 'yasam_maliyeti' && ilceSlug && (() => {
            const kira = KIRA_VERISI[ilceSlug]
            if (!kira) return null
            const kRenk  = kiraRengi(kira)
            const etiket = kiraEtiketi(kira)
            return (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f2f5' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Ortalama Kira Analizi
                </div>

                <div style={{ background: kRenk + '10', border: `1.5px solid ${kRenk}30`, borderRadius: 14, padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#667781', marginBottom: 4 }}>
                      Aylık Ortalama Kira (100 m²)
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: kRenk, lineHeight: 1 }}>
                      {kira.toLocaleString('tr-TR')} TL
                    </div>
                  </div>
                  <div style={{ background: kRenk, color: 'white', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>
                    {etiket}
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>
                    <span>En Ucuz (Esenyurt: 16.717 TL)</span>
                    <span>En Pahalı (Sarıyer: 64.454 TL)</span>
                  </div>
                  <div style={{ background: '#f0f2f5', height: 10, borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: ((kira - 16717) / (64454 - 16717) * 100) + '%',
                      background: kRenk, borderRadius: 99, transition: 'width 800ms ease-out',
                    }}/>
                  </div>
                  <div style={{ fontSize: 11, color: '#667781', marginTop: 6, textAlign: 'center' }}>
                    İstanbul ortalaması: ~27.000 TL
                  </div>
                </div>

                <div style={{ fontSize: 10, color: '#c4c9cf', textAlign: 'center', marginTop: 8 }}>
                  Kaynak: Endeksa — Mart 2025
                </div>
              </div>
            )
          })()}

          {/* Deprem risk kartı */}
          {parametre.id === 'deprem_direnci' && depremVeri && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f2f5' }}>
              <DepremRiskKarti
                skor={parametre.skor}
                yorum={depremVeri.yorum}
                fayMesafe={depremVeri.fayMesafe}
                sonYilSayisi={depremVeri.sonYil}
                maxMag={depremVeri.maxMag}
                guncellendi={depremVeri.guncellendi}
              />
            </div>
          )}

          {/* Tesis accordion — saglik/egitim/kultur/yesil */}
          {KAT_TANIMLAR[parametre.id] && (() => {
            const herhangiVar = KAT_TANIMLAR[parametre.id].some(
              kat => (tesisListesi[kat.key] || []).length > 0
            )
            if (!herhangiVar) return (
              <div style={{ marginTop: 16, borderTop: '1px solid #f0f2f5', paddingTop: 12,
                fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
                Tesis verisi henüz mevcut değil
              </div>
            )
            return (
            <div style={{ marginTop: 16, borderTop: '1px solid #f0f2f5', paddingTop: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
              }}>
                Tesisler
              </div>
              {KAT_TANIMLAR[parametre.id].map(kat => {
                const liste = tesisListesi[kat.key] || []
                if (liste.length === 0) return null
                const katAcik = acikKategori === kat.key
                return (
                  <div key={kat.key} style={{
                    marginBottom: 8, borderRadius: 12, overflow: 'hidden',
                    border: `1px solid ${katAcik ? kat.renk + '40' : '#e5e7eb'}`,
                    transition: 'border-color 200ms',
                  }}>
                    <button
                      onClick={() => toggleKategori(kat.key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', padding: '11px 14px',
                        background: katAcik ? kat.bg : 'white',
                        border: 'none', cursor: 'pointer', transition: 'background 200ms',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 30, height: 30, background: kat.bg,
                          borderRadius: 8, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 15,
                        }}>
                          {kat.ikon}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                          {kat.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: kat.renk, color: 'white',
                          fontSize: 11, fontWeight: 700,
                          padding: '2px 9px', borderRadius: 20,
                        }}>
                          {liste.length}
                        </span>
                        <span style={{
                          fontSize: 11, color: '#9ca3af',
                          display: 'inline-block',
                          transform: katAcik ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms',
                        }}>▼</span>
                      </div>
                    </button>
                    {katAcik && (
                      <div style={{
                        background: 'white',
                        borderTop: `1px solid ${kat.renk}20`,
                        maxHeight: 280, overflowY: 'auto',
                      }}>
                        {liste.map((t, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 14px',
                            borderBottom: i < liste.length - 1 ? '1px solid #f9fafb' : 'none',
                          }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{kat.ikon}</span>
                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                              {t.isim}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )
          })()}

          {/* Toplam özet */}
          {parametre.toplamSayi !== undefined && parametre.toplamSayi > 0 && (
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              marginTop:      14,
              paddingTop:     12,
              borderTop:      `1px solid ${parametre.renk}15`,
            }}>
              <span style={{fontSize: 12, color: '#667781'}}>
                Toplam tesis
              </span>
              <span style={{
                fontSize:   14,
                fontWeight: 800,
                color:      parametre.renk,
              }}>
                {parametre.toplamSayi} mekan
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
