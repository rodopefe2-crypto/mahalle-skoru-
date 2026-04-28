'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, SlidersHorizontal,
  ChevronDown, MapPin,
  ArrowRight, RotateCcw,
} from 'lucide-react'
import {
  SEHIRLER, FILTRE_TANIMI,
  BASLANGIC_FILTRE, FiltreDegerleri,
} from '@/lib/aramaPaneliData'
import { useMahalleler } from '@/hooks/useMahalleler'

interface AramaPaneliProps {
  ilceler?: any[]
}

const PRESETLER = [
  { label: '👨‍👩‍👧 Aile Profili',   degerler: { guvenlik: 80, aileDostu: 90, yesilanAlan: 60, sessizlik: 70 } },
  { label: '📚 Öğrenci Profili', degerler: { ulasim: 90, imkanlar: 70, ogrenciDostu: 90, butce: 80 } },
  { label: '🎉 Sosyal Profil',   degerler: { imkanlar: 90, ulasim: 70, yesilanAlan: 40 } },
  { label: '🌿 Sakin Yaşam',     degerler: { sessizlik: 90, yesilanAlan: 80, guvenlik: 70 } },
]

export function AramaPaneli({ ilceler = [] }: AramaPaneliProps) {
  const router = useRouter()
  const [filtre, setFiltre]               = useState<FiltreDegerleri>(BASLANGIC_FILTRE)
  const [filtrePaneliAcik, setFiltrePaneliAcik] = useState(false)

  const { mahalleler, yukleniyor: mahalleYukleniyor } = useMahalleler(filtre.ilceSlug)

  const mevcutSehir = SEHIRLER.find(s => s.id === filtre.sehirId)
  const ilceListesi = mevcutSehir?.ilceler || []

  const aktifSayisi = useMemo(() =>
    Object.entries(filtre).filter(([k, v]) =>
      !['sehirId', 'ilceSlug', 'mahalleSlug'].includes(k) && (v as number) > 0
    ).length
  , [filtre])

  function filtreGuncelle<K extends keyof FiltreDegerleri>(key: K, deger: FiltreDegerleri[K]) {
    setFiltre(prev => ({ ...prev, [key]: deger }))
  }

  function aramayiUygula() {
    if (filtre.mahalleSlug) {
      router.push('/mahalle/' + filtre.mahalleSlug)
      return
    }
    if (filtre.ilceSlug) {
      router.push('/ilce/' + filtre.ilceSlug)
      return
    }
    router.push('/quiz')
  }

  const araButonMetni = filtre.mahalleSlug ? 'Mahalleyi İncele'
    : filtre.ilceSlug ? 'İlçeyi İncele'
    : 'Keşfet'

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        background: 'white', borderRadius: 20,
        border: '1.5px solid #e9edef', padding: '20px 24px',
        boxShadow: '0 4px 24px rgba(7,94,84,0.08)',
      }}>

        {/* Başlık */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#25d366', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={13} /> Yer Keşfet
        </div>

        {/* Üst satır — 3 dropdown + 2 buton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 10, alignItems: 'start', marginBottom: filtrePaneliAcik ? 20 : 0 }}>

          {/* Şehir */}
          <div style={{ position: 'relative' }}>
            <select
              value={filtre.sehirId}
              onChange={e => {
                filtreGuncelle('sehirId', e.target.value)
                filtreGuncelle('ilceSlug', '')
                filtreGuncelle('mahalleSlug', '')
              }}
              style={{ width: '100%', appearance: 'none', background: '#f8fafb', border: '1.5px solid #e9edef', borderRadius: 12, padding: '11px 36px 11px 14px', fontSize: 14, fontWeight: 500, color: '#111b21', cursor: 'pointer', outline: 'none' }}
            >
              {SEHIRLER.map(s => <option key={s.id} value={s.id}>{s.isim}</option>)}
            </select>
            <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 14, pointerEvents: 'none' }} />
          </div>

          {/* İlçe */}
          <div style={{ position: 'relative' }}>
            <select
              value={filtre.ilceSlug}
              onChange={e => {
                filtreGuncelle('ilceSlug', e.target.value)
                filtreGuncelle('mahalleSlug', '')
              }}
              style={{ width: '100%', appearance: 'none', background: '#f8fafb', border: '1.5px solid #e9edef', borderRadius: 12, padding: '11px 36px 11px 14px', fontSize: 14, fontWeight: 500, color: filtre.ilceSlug ? '#111b21' : '#9ca3af', cursor: 'pointer', outline: 'none' }}
            >
              <option value="">Tüm ilçeler</option>
              {ilceListesi.map(i => <option key={i.slug} value={i.slug}>{i.isim}</option>)}
            </select>
            <ChevronDown size={14} color="#9ca3af" style={{ position: 'absolute', right: 12, top: 14, pointerEvents: 'none' }} />
          </div>

          {/* Mahalle */}
          <div>
            <div style={{ position: 'relative' }}>
              <select
                value={filtre.mahalleSlug}
                onChange={e => filtreGuncelle('mahalleSlug', e.target.value)}
                disabled={!filtre.ilceSlug || mahalleYukleniyor}
                style={{
                  width: '100%', appearance: 'none',
                  background: filtre.ilceSlug ? '#f8fafb' : '#f4f4f4',
                  border: `1.5px solid ${filtre.mahalleSlug ? '#25d366' : '#e9edef'}`,
                  borderRadius: 12,
                  padding: '11px 36px 11px 14px',
                  fontSize: 14, fontWeight: 500,
                  color: filtre.mahalleSlug ? '#075e54' : '#9ca3af',
                  cursor: filtre.ilceSlug ? 'pointer' : 'not-allowed',
                  outline: 'none',
                  opacity: filtre.ilceSlug ? 1 : 0.6,
                }}
              >
                <option value="">
                  {mahalleYukleniyor ? 'Yükleniyor...'
                    : !filtre.ilceSlug ? 'Önce ilçe seçin'
                    : 'Tüm mahalleler'}
                </option>
                {mahalleler.map(m => (
                  <option key={m.slug} value={m.slug}>{m.isim}</option>
                ))}
              </select>

              <div style={{ position: 'absolute', right: 12, top: 14, pointerEvents: 'none' }}>
                {mahalleYukleniyor
                  ? <div style={{ width: 12, height: 12, border: '2px solid #e9edef', borderTopColor: '#128c7e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <ChevronDown size={14} color={filtre.mahalleSlug ? '#25d366' : '#9ca3af'} />
                }
              </div>
            </div>

            {/* Hint metin */}
            {filtre.ilceSlug && !mahalleYukleniyor && (
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, paddingLeft: 4 }}>
                {mahalleler.length > 0
                  ? `${mahalleler.length} mahalle listelendi`
                  : 'Bu ilçe için mahalle verisi yakında'}
              </div>
            )}
          </div>

          {/* Filtre butonu */}
          <button
            onClick={() => setFiltrePaneliAcik(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: filtrePaneliAcik ? '#075e54' : '#f8fafb',
              border: `1.5px solid ${filtrePaneliAcik ? '#075e54' : '#e9edef'}`,
              borderRadius: 12, padding: '11px 16px',
              fontSize: 13, fontWeight: 600,
              color: filtrePaneliAcik ? 'white' : '#374151',
              cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative',
            }}
          >
            <SlidersHorizontal size={14} />
            Filtrele
            {aktifSayisi > 0 && (
              <div style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#25d366', color: '#075e54', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {aktifSayisi}
              </div>
            )}
          </button>

          {/* Ara */}
          <button
            onClick={aramayiUygula}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #25d366, #22c55e)', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, color: '#075e54', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}
          >
            <Search size={14} />
            {araButonMetni}
          </button>
        </div>

        {/* Genişleyen filtre paneli */}
        {filtrePaneliAcik && (
          <div style={{ borderTop: '1px solid #f0f2f5', paddingTop: 20 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111b21' }}>Kriterlerin neler?</span>
                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>Önemli gördüğün kriterleri öne çıkar</span>
              </div>
              {aktifSayisi > 0 && (
                <button
                  onClick={() => setFiltre(BASLANGIC_FILTRE)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#667781', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
                >
                  <RotateCcw size={12} /> Sıfırla
                </button>
              )}
            </div>

            {/* Filtre grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {FILTRE_TANIMI.map(f => {
                const deger = filtre[f.key as keyof FiltreDegerleri] as number
                const aktif = deger > 0
                return (
                  <div key={f.key} style={{ background: aktif ? f.renk + '08' : '#fafafa', border: `1.5px solid ${aktif ? f.renk + '40' : '#f0f2f5'}`, borderRadius: 12, padding: '12px 14px', transition: 'all 200ms ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{f.ikon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: aktif ? f.renk : '#374151' }}>{f.label}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{f.aciklama}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: aktif ? f.renk : '#d1d5db', minWidth: 28, textAlign: 'right' }}>
                        {deger > 0 ? deger + '+' : '—'}
                      </div>
                    </div>
                    <input
                      type="range" min={0} max={100} step={10}
                      value={deger}
                      onChange={e => filtreGuncelle(f.key as keyof FiltreDegerleri, Number(e.target.value) as any)}
                      style={{ width: '100%', accentColor: f.renk, height: 4, cursor: 'pointer' } as React.CSSProperties}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#c4c9cf' }}>
                      <span>Önemli değil</span><span>Çok önemli</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Presetler */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Hızlı Seçim
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESETLER.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setFiltre(prev => ({ ...BASLANGIC_FILTRE, sehirId: prev.sehirId, ilceSlug: prev.ilceSlug, mahalleSlug: prev.mahalleSlug, ...preset.degerler }))}
                    style={{ background: 'white', border: '1.5px solid #e9edef', borderRadius: 99, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all 150ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#25d366'; e.currentTarget.style.color = '#075e54' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9edef'; e.currentTarget.style.color = '#374151' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Uygula */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={aramayiUygula}
                style={{ width: '100%', background: 'linear-gradient(135deg, #075e54, #128c7e)', color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(7,94,84,0.2)' }}
              >
                {filtre.mahalleSlug ? 'Mahalleyi incele'
                  : aktifSayisi > 0 ? `${aktifSayisi} kritere göre keşfet`
                  : 'Tüm ilçeleri gör'}
                <ArrowRight size={16} />
              </button>
              {aktifSayisi > 0 && !filtre.mahalleSlug && (
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                  veya{' '}
                  <button
                    onClick={() => router.push('/quiz')}
                    style={{ background: 'none', border: 'none', color: '#128c7e', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    quiz ile daha detaylı eşleştir →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
