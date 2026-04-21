'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface SidebarProps {
  profile: Profile;
}

export default function Sidebar({ profile }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const links = [
    { href: '/perfil', label: 'Mi Perfil', icon: '👤' },
    { href: '/crear-cv', label: 'Crear CV', icon: '📄' },
    { href: '/mis-cvs', label: 'Mis CVs', icon: '📚' },
    { href: '/aplicaciones', label: 'Seguimiento', icon: '🎯' },
    { href: '/cuenta', label: 'Mejorar Cuenta', icon: '⚙️' },
    { href: '/admin', label: 'Admin', icon: '🔧' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          {profile.foto_url ? (
            <Image
              src={profile.foto_url}
              alt={profile.nombre}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {profile.nombre[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {profile.nombre} {profile.apellido}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {profile.profesion_perfil || 'Sin profesión'}
            </p>
          </div>
        </div>
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
          {profile.plan === 'gratuito' ? 'Gratuito' : 'Pro'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
