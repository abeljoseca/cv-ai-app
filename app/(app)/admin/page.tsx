'use client';

import AdminDashboard from '@/components/AdminDashboard';
import AdminUsersTable from '@/components/AdminUsersTable';
import { useState } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Administrativo</h1>
        <p className="text-gray-600">
          Gestiona datos, usuarios y visualiza estadísticas del producto
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 font-medium border-b-2 ${
            activeTab === 'dashboard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium border-b-2 ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Usuarios
        </button>
      </div>

      {/* Contenido */}
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'users' && <AdminUsersTable />}
    </div>
  );
}
