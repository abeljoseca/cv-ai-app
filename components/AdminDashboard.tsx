'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  overview: {
    totalUsers: number;
    totalCVs: number;
    totalApplications: number;
    cvs7days: number;
  };
  cvs: {
    byStyle: Record<string, number>;
    byIntention: Record<string, number>;
  };
  plans: Record<string, number>;
}

const COLORS = ['#4B6BFB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Error loading stats');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return <div>No hay datos</div>;
  }

  const styleChartData = Object.entries(stats.cvs.byStyle).map(([style, count]) => ({
    name: style,
    value: count,
  }));

  const intentionChartData = Object.entries(stats.cvs.byIntention).map(([intention, count]) => ({
    name: intention === 'general' ? 'CV General' : 'CV Vacante',
    value: count,
  }));

  const planChartData = Object.entries(stats.plans).map(([plan, count]) => ({
    name: plan === 'gratuito' ? 'Gratuito' : 'Pro',
    value: count,
  }));

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-sm">Total Usuarios</p>
          <p className="text-3xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-sm">CVs Generados</p>
          <p className="text-3xl font-bold text-blue-600">{stats.overview.totalCVs}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-sm">Aplicaciones Registradas</p>
          <p className="text-3xl font-bold text-green-600">{stats.overview.totalApplications}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 text-sm">CVs (Últimos 7 días)</p>
          <p className="text-3xl font-bold text-purple-600">{stats.overview.cvs7days}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Estilos de CV */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CVs por Estilo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={styleChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {styleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Intención de CV */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CVs por Intención</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={intentionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4B6BFB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de Planes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Planes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ratio CVs/Usuario:</span>
              <span className="font-semibold">
                {stats.overview.totalUsers > 0
                  ? (stats.overview.totalCVs / stats.overview.totalUsers).toFixed(2)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usuarios Pro:</span>
              <span className="font-semibold">{stats.plans.pro || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usuarios Gratuitos:</span>
              <span className="font-semibold">{stats.plans.gratuito || 0}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Tasa de Conversión:</span>
              <span className="font-semibold text-green-600">
                {stats.overview.totalUsers > 0
                  ? ((stats.overview.totalCVs / stats.overview.totalUsers) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
