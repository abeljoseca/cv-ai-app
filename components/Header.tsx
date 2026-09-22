'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="text-2xl font-bold text-blue-600">Momentum</div>

      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
        >
          Mejorar Cuenta
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
