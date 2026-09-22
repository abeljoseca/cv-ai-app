'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email_cv: string;
  plan: 'gratuito' | 'pro';
  puntaje_completitud: number;
  onboarding_completado: boolean;
  created_at: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, [pagination.page, search, planFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        plan: planFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Error loading users');
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header con filtros */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usuarios</h2>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los planes</option>
            <option value="gratuito">Plan Inicio</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Usuario</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Plan</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Completitud</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Estado</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {user.nombre} {user.apellido}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email_cv}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.plan === 'pro'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.plan === 'pro' ? 'Pro' : 'Plan Inicio'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${user.puntaje_completitud}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {user.puntaje_completitud}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.onboarding_completado ? (
                      <span className="text-green-600 font-medium">✓ Completado</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">⚠ Pendiente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} usuarios
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.max(1, pagination.page - 1),
                })
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setPagination({ ...pagination, page })}
                className={`px-3 py-2 rounded-lg text-sm ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.min(pagination.pages, pagination.page + 1),
                })
              }
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
