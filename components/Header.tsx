'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="text-2xl font-bold text-blue-600">Resumint</div>

      <div className="flex items-center gap-4">
        <Link
          href="/cuenta"
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
        >
          Mejorar Cuenta
        </Link>
      </div>
    </header>
  );
}
