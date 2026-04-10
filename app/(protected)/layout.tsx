'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const links = [
    { href: '/app/chat', label: 'Sobre mí' },
    { href: '/app/apply', label: 'Aplicar' },
    { href: '/app/cvs', label: 'Mis CVs' },
    { href: '/app/profile', label: 'Mi Perfil' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-blue-600 font-semibold text-sm">CV Builder</span>
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
} 
