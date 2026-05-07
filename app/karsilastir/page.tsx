'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Trophy, ArrowLeft, Share2,
  CheckCircle, XCircle, Minus,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ilceyiDonustur, ozetUret, kazananBul } from '@/lib/karsilastirmaMotoru'
import { BOYUTLAR, KATEGORI_ETIKETLERI } from '@/lib/karsilastirmaBoyutlari'
import { IlceKarsilastirma } from '@/lib/karsilastirmaTypes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function skorRengi(skor: number): string {
  if (skor >= 75) return '#25d366'
  if (skor >= 55) return '#f59e0b'
  return '#ef4444'
}

function skorEtiketi(skor: number): string {
  if (skor >= 80) return 'Mükemmel'
  if (skor >= 70) return 'Çok İyi'
  if (skor >= 55) return 'İyi'
  if (skor >= 40) return 'Orta'
  return 'Zayıf'
}

function KarsilastirIcerik() {
  const [ilceler, setIlceler]           = useState<IlceKarsilastirma[]>([])
  const [tumIlceler, setTumIlceler]     = useState<any[]>([])
  const [yukleniyor, setYukleniyor]     = useState(true)
  const [acikKategori, setAcikKategori] = useState<string | null>('temel')
  const [paylasild, setPaylasild]       = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    async function yukle() {
      const { data } = await supabase
        .from('ilceler')
        .select(`
          slug, isim, aciklama, genel_skor,
          ulasim_skoru, guvenlik_skoru,
          imkanlar_skoru, egitim_skoru,
          saglik_skoru, deprem_skoru,
          yasam_maliyeti_skoru,
          sakin_memnuniyeti_skoru,
          yesil_alan_skoru,
          kultur_skoru
        `)
      if (!data) return
      setTumIlceler(data)

      const sluglar = searchParams.get('ilceler')?.split(',') || []
      const secili  = data.filter(i => sluglar.includes(i.slug)).map(ilceyiDonustur)
      setIlceler(secili.length >= 2 ? secili : data.slice(0, 2).map(ilceyiDonustur))
      setYukleniyor(false)
    }
    yukle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ozet = useMemo(() => ozetUret(ilceler), [ilceler])

  function ilceDegistir(idx: number, slug: string) {
    const yeni = tumIlceler.find(i => i.slug === slug)
    if (!yeni) return
    setIlceler(prev => {
      const kopya = [...prev]
      kopya[idx] = ilceyiDonustur(yeni)
      return kopya
    })
  }

  /* ── YÜKLEME ── */
  if (yukleniyor) return (
    <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>⚖️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Karşılaştırma hazırlanıyor...</div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', paddingTop: 80, paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>

        {/* ── GERİ + PAYLAŞ ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#667781', fontSize: 14, cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={16} /> Ana Sayfa
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href); setPaylasild(true); setTimeout(() => setPaylasild(false), 2000) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #e9edef', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer' }}
          >
            <Share2 size={14} />
            {paylasild ? '✓ Kopyalandı' : 'Paylaş'}
          </button>
        </div>

        {/* ── BAŞLIK ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcf8c6', color: '#075e54', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            ⚖️ Karşılaştırma Modu
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111b21', marginBottom: 8 }}>İlçe Karşılaştırması</h1>
          <p style={{ fontSize: 14, color: '#667781' }}>İki ilçeyi 8 parametre üzerinden karşılaştır</p>
        </div>

        {/* ── İLÇE SEÇİCİLER ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          {[0, 1].map(idx => (
            <div key={idx} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #e9edef', padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: idx === 0 ? '#3b82f6' : '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {idx === 0 ? '1. İlçe' : '2. İlçe'}
              </div>
              <select
                value={ilceler[idx]?.slug || ''}
                onChange={e => ilceDegistir(idx, e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 18, fontWeight: 800, color: '#111b21', cursor: 'pointer', outline: 'none' }}
              >
                {tumIlceler.map(i => (
                  <option key={i.slug} value={i.slug}>{i.isim}</option>
                ))}
              </select>
              {ilceler[idx] && (
                <div style={{ fontSize: 12, color: '#667781', marginTop: 4 }}>
                  Genel Skor:{' '}
                  <strong style={{ color: skorRengi(ilceler[idx].genel_skor) }}>{ilceler[idx].genel_skor}</strong>
                </div>
              )}
            </div>
          ))}

          {/* VS rozeti */}
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #075e54, #25d366)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0, margin: '0 auto', boxShadow: '0 4px 12px rgba(7,94,84,0.25)' }}>
            VS
          </div>
        </div>

        {/* ── GENEL SKOR BANNER ── */}
        {ilceler.length >= 2 && (
          <div style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)', borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'center' }}>
            {[0, 1].map(idx => {
              const ilce = ilceler[idx]
              const kazandiMi = ozet.kazanan === ilce.slug
              return (
                <div key={idx} style={{ textAlign: idx === 0 ? 'left' : 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{ilce.isim}</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: kazandiMi ? '#25d366' : 'white', lineHeight: 1, marginBottom: 6 }}>{ilce.genel_skor}</div>
                  {kazandiMi && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.4)', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#25d366' }}>
                      <Trophy size={10} /> Genel Kazanan
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, justifyContent: idx === 0 ? 'flex-start' : 'flex-end' }}>
                    {ilce.kimIcin.slice(0, 2).map(k => (
                      <span key={k} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 99, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Orta: fark */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fark</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#25d366' }}>{Math.abs(ilceler[0].genel_skor - ilceler[1].genel_skor)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>puan</div>
            </div>
          </div>
        )}

        {/* ── KATEGORİ ACCORDION ── */}
        {(['temel', 'yasam', 'profil'] as const).map(kategori => {
          const kategoriBoyutlar = BOYUTLAR.filter(b => b.kategori === kategori)
          const acik = acikKategori === kategori

          return (
            <div key={kategori} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #e9edef', marginBottom: 12, overflow: 'hidden' }}>

              {/* Başlık */}
              <div
                onClick={() => setAcikKategori(acik ? null : kategori)}
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: acik ? '#f8fffe' : 'white', borderBottom: acik ? '1px solid #e9edef' : 'none', transition: 'background 150ms' }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111b21' }}>{KATEGORI_ETIKETLERI[kategori]}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#667781' }}>{kategoriBoyutlar.length} kriter</span>
                  {acik ? <ChevronUp size={16} color="#667781" /> : <ChevronDown size={16} color="#667781" />}
                </div>
              </div>

              {/* Boyutlar */}
              {acik && kategoriBoyutlar.map((boyut, bIdx) => {
                if (ilceler.length < 2) return null
                const key = boyut.key as keyof IlceKarsilastirma['skorlar']
                const skorA = ilceler[0].skorlar[key]
                const skorB = ilceler[1].skorlar[key]
                const { kazanan, fark } = kazananBul(ilceler[0], ilceler[1], key)

                return (
                  <div key={boyut.key} style={{ padding: '16px 20px', borderBottom: bIdx < kategoriBoyutlar.length - 1 ? '1px solid #f0f2f5' : 'none' }}>

                    {/* Boyut başlığı */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 16 }}>{boyut.ikon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{boyut.label}</span>
                      {fark > 5 && (
                        <span style={{ background: boyut.renk + '15', color: boyut.renk, borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, marginLeft: 'auto' }}>
                          {fark} puan fark
                        </span>
                      )}
                    </div>

                    {/* İki ilçe barları */}
                    {[0, 1].map(idx => {
                      const skor = idx === 0 ? skorA : skorB
                      const ilce = ilceler[idx]
                      const buKazandi = kazanan === ilce.slug

                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: idx === 0 ? 8 : 0 }}>
                          <div style={{ fontSize: 12, color: buKazandi ? '#111b21' : '#9ca3af', fontWeight: buKazandi ? 700 : 400, width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {buKazandi && fark > 5 && <Trophy size={10} color="#f59e0b" />}
                            {ilce.isim}
                          </div>
                          <div style={{ flex: 1, background: '#f0f2f5', height: 8, borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: skor + '%', background: buKazandi ? boyut.renk : boyut.renk + '60', borderRadius: 99, transition: 'width 800ms ease-out', boxShadow: buKazandi ? `0 0 6px ${boyut.renk}60` : 'none' }} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: buKazandi ? skorRengi(skor) : '#9ca3af', width: 32, textAlign: 'right', flexShrink: 0 }}>{skor}</div>
                          <div style={{ fontSize: 10, color: buKazandi ? boyut.renk : '#d1d5db', width: 56, flexShrink: 0, fontWeight: 500 }}>
                            {buKazandi ? skorEtiketi(skor) : ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* ── GÜÇLÜ / ZAYIF YÖNLER ── */}
        {ilceler.length >= 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {ilceler.map((ilce, idx) => (
              <div key={ilce.slug} style={{ background: 'white', borderRadius: 16, border: '1.5px solid #e9edef', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: idx === 0 ? '#3b82f6' : '#8b5cf6', marginBottom: 12 }}>{ilce.isim}</div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#25d366', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>💪 Güçlü</div>
                  {ilce.gucluYonler.length > 0
                    ? ilce.gucluYonler.map(g => (
                        <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, color: '#374151' }}>
                          <CheckCircle size={12} color="#25d366" />{g}
                        </div>
                      ))
                    : <div style={{ fontSize: 12, color: '#9ca3af' }}>Belirgin güçlü yön yok</div>
                  }
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>⚠️ Dikkat</div>
                  {ilce.zayifYonler.length > 0
                    ? ilce.zayifYonler.map(z => (
                        <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, color: '#374151' }}>
                          <Minus size={12} color="#f59e0b" />{z}
                        </div>
                      ))
                    : <div style={{ fontSize: 12, color: '#9ca3af' }}>Belirgin zayıf yön yok</div>
                  }
                </div>

                {ilce.kirmiziBayraklar.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>🚩 Risk</div>
                    {ilce.kirmiziBayraklar.map(k => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, color: '#ef4444' }}>
                        <XCircle size={12} color="#ef4444" />{k}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SONUÇ TAVSİYE ── */}
        {ozet.tavsiye && (
          <div style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)', borderRadius: 20, padding: '24px 28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Trophy size={18} color="#25d366" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#25d366', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sonuç & Tavsiye</span>
            </div>

            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, margin: '0 0 16px', fontWeight: 500 }}>
              {ozet.tavsiye}
            </p>

            {ozet.farklar.slice(0, 3).map(f => (
              <div key={f.boyut} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#25d366', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  <strong style={{ color: 'white' }}>
                    {f.kazanan === ilceler[0]?.slug ? ilceler[0]?.isim : ilceler[1]?.isim}
                  </strong>
                  {' '}{f.boyut} alanında {f.fark} puan önde
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              {ilceler.map(ilce => (
                <button
                  key={ilce.slug}
                  onClick={() => router.push('/ilce/' + ilce.slug)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 18px', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {ilce.isim} Detayı →
                </button>
              ))}
              <button
                onClick={() => router.push('/quiz')}
                style={{ background: '#25d366', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#075e54', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🎯 Bana Uygun Yeri Bul
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function KarsilastirPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚖️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Karşılaştırma hazırlanıyor...</div>
        </div>
      </div>
    }>
      <KarsilastirIcerik />
    </Suspense>
  )
}
