'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function Navbar() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [userMenu, setUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 1000, background: '#075e54', height: 64,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', paddingInline: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>

      {/* Logo */}
      <div
        onClick={() => router.push('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{
          width: 36, height: 36, background: '#25d366', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🏘️</div>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
          Mahalle Skoru
        </span>
      </div>

      {/* Auth butonları */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenu(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, padding: '7px 14px',
                color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#25d366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#075e54',
              }}>
                {(user.user_metadata?.kullanici_adi as string)?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <ChevronDown size={14} />
            </button>

            {userMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'white', borderRadius: 14,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                minWidth: 200, overflow: 'hidden', zIndex: 100,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5' }}>
                  <div style={{
                    fontSize: 11, color: '#9ca3af', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
                  }}>
                    Giriş yapıldı
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111b21' }}>
                    {(user.user_metadata?.kullanici_adi as string) || user.email}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {user.email}
                  </div>
                </div>

                {[
                  { label: 'Profilim',    ikon: '👤', href: '/profil'    },
                  { label: 'Favorilerim', ikon: '❤️',  href: '/favoriler' },
                  { label: 'Ayarlar',     ikon: '⚙️',  href: '/ayarlar'  },
                ].map(item => (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setUserMenu(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '12px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: '#374151', fontWeight: 500,
                      textAlign: 'left', borderBottom: '1px solid #f0f2f5',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafb' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                  >
                    <span style={{ fontSize: 16 }}>{item.ikon}</span>
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={async () => { await signOut(); setUserMenu(false); router.push('/') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, color: '#ef4444', fontWeight: 600, textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                >
                  <LogOut size={15} color="#ef4444" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => router.push('/auth')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 10, padding: '8px 16px',
                color: 'white', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)' }}
            >
              <LogIn size={15} /> Giriş Yap
            </button>

            <button
              onClick={() => router.push('/auth?mod=uye')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#25d366', border: 'none',
                borderRadius: 10, padding: '8px 16px',
                color: '#075e54', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'all 150ms',
                boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#22c55e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#25d366' }}
            >
              <UserPlus size={15} /> Üye Ol
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
