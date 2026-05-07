'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [mod, setMod] = useState<'giris' | 'uye'>(
    searchParams.get('mod') === 'uye' ? 'uye' : 'giris'
  )
  const [form, setForm] = useState({ kullaniciAdi: '', email: '', sifre: '' })
  const [hata,       setHata]       = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const handleSubmit = async () => {
    setHata('')
    setYukleniyor(true)
    try {
      if (mod === 'uye') {
        const { error } = await supabase.auth.signUp({
          email:    form.email,
          password: form.sifre,
          options:  { data: { kullanici_adi: form.kullaniciAdi } },
        })
        if (error) throw error
        setHata('✓ Kayıt başarılı! Email adresinizi onaylayın.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email:    form.email,
          password: form.sifre,
        })
        if (error) throw error
        router.push('/')
      }
    } catch (err: unknown) {
      setHata((err as Error).message || 'Bir hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '14px 16px', borderRadius: 12,
    border: '1.5px solid #e9edef', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #075e54, #128c7e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: 40,
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: '#25d366', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, fontSize: 24,
          }}>
            🏘️
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#075e54' }}>
            Mahalle Skoru
          </div>
        </div>

        {/* Tab */}
        <div style={{
          display: 'flex', background: '#f0f2f5',
          borderRadius: 12, padding: 4, marginBottom: 24,
        }}>
          {(['giris', 'uye'] as const).map(m => (
            <button key={m} onClick={() => setMod(m)} style={{
              flex: 1, padding: 10, borderRadius: 10, border: 'none',
              background: mod === m ? 'white' : 'transparent',
              color: mod === m ? '#075e54' : '#667781',
              fontWeight: mod === m ? 700 : 500, fontSize: 14,
              cursor: 'pointer',
              boxShadow: mod === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 200ms',
            }}>
              {m === 'giris' ? 'Giriş Yap' : 'Üye Ol'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mod === 'uye' && (
            <input
              placeholder="Kullanıcı adı"
              value={form.kullaniciAdi}
              onChange={e => setForm(f => ({ ...f, kullaniciAdi: e.target.value }))}
              style={inputStyle}
            />
          )}
          <input
            placeholder="E-posta adresi"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Şifre"
            type="password"
            value={form.sifre}
            onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />

          {hata && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: hata.startsWith('✓') ? '#f0fdf4' : '#fef2f2',
              color: hata.startsWith('✓') ? '#16a34a' : '#dc2626',
            }}>
              {hata}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={yukleniyor}
            style={{
              padding: 14, borderRadius: 12, border: 'none',
              background: yukleniyor ? '#9ca3af' : 'linear-gradient(135deg, #075e54, #25d366)',
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: yukleniyor ? 'not-allowed' : 'pointer', transition: 'all 200ms',
            }}
          >
            {yukleniyor ? 'Bekleyin...' : mod === 'giris' ? 'Giriş Yap' : 'Üye Ol'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#667781' }}>
          {mod === 'giris' ? 'Hesabın yok mu? ' : 'Hesabın var mı? '}
          <button
            onClick={() => setMod(mod === 'giris' ? 'uye' : 'giris')}
            style={{
              background: 'none', border: 'none',
              color: '#075e54', fontWeight: 700, cursor: 'pointer', fontSize: 13,
            }}
          >
            {mod === 'giris' ? 'Üye Ol' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
