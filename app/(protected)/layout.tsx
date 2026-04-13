'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const links = [
  { href: '/app/chat', label: 'Sobre mí', sub: 'Ver perfil' },
  { href: '/app/apply', label: 'Aplicar', sub: 'Crear mi CV' },
  { href: '/app/cvs', label: 'Mis CVs', sub: 'Ver mis CVs' },
  { href: '/app/applications', label: 'Historial', sub: 'Sigue tu proceso' },
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('?')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
      if (data?.first_name) {
        const name = `${data.first_name} ${data.last_name ?? ''}`.trim()
        setUserName(name)
        setUserInitial(name.charAt(0).toUpperCase())
      } else {
        const name = user.email?.split('@')[0] ?? 'Usuario'
        setUserName(name)
        setUserInitial(name.charAt(0).toUpperCase())
      }
    }
    loadUser()
  }, [])

  return (
    <div style={{
  height: '100vh',
  background: '#E8E8EC',
  display: 'flex',
  alignItems: 'stretch',
  padding: '16px',
  fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
  boxSizing: 'border-box',
}}>

      {/* Card principal — todo adentro */}
      <div style={{
        flex: 1,
        background: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header — dentro de la card */}
        <div style={{
          height: '52px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          background: '#FFFFFF',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.4px' }}>
            <span style={{ color: '#1A2B4C' }}>Resum</span><span style={{ color: '#4B6BFB' }}>int</span>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push('/app/upgrade')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: '#4B6BFB', color: '#fff', border: 'none',
                borderRadius: '50px', padding: '7px 16px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              💎 Mejorar Cuenta
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              style={{
                background: '#fff', color: '#666', border: '1px solid #E5E5E5',
                borderRadius: '50px', padding: '7px 16px',
                fontSize: '12px', cursor: 'pointer',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar */}
          <aside style={{
            width: '180px',
            flexShrink: 0,
            background: '#FFFFFF',
            borderRight: '1px solid #F0F0F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 12px',
            justifyContent: 'space-between',
          }}>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>

              {/* Plan badge */}
<div style={{
  background: '#4B6BFB',
  color: '#fff',
  borderRadius: '50px',
  padding: '10px 16px',
  fontSize: '12px',
  fontWeight: 700,
  marginBottom: '16px',
  textAlign: 'center',
  width: '100%',
  cursor: 'pointer',
}}>
  Tipo de cuenta
</div>

              {/* Nav links */}
              {links.map(link => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      width: '100%',
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isActive ? '#F3F5FF' : 'transparent',
                      textDecoration: 'none',
                      textAlign: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#4B6BFB' : '#1A1A1A',
                      lineHeight: 1.4,
                    }}>
                      {link.label}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: isActive ? '#8FA4FC' : '#BBBBBB',
                      marginTop: '1px',
                    }}>
                      {link.sub}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* User section */}
            <Link
              href="/app/profile"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                padding: '12px 8px',
                borderRadius: '14px',
                background: pathname === '/app/profile' ? '#F3F5FF' : '#F9F9F9',
                width: '100%',
                border: '1px solid #F0F0F0',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#EEF1FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                color: '#4B6BFB',
              }}>
                {userInitial}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3 }}>
                  {userName || 'Usuario'}
                </div>
                <div style={{ fontSize: '10px', color: '#BBBBBB', marginTop: '2px' }}>
                  Configurar Perfil
                </div>
              </div>
            </Link>

          </aside>

          {/* Content */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px',
            background: '#FAFAFA',
          }}>
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}