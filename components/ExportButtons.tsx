'use client';

import { useState } from 'react';
import { exportToPDF, exportToDOCX } from '@/lib/export';

interface ExportButtonsProps {
  cvElementId: string;
  cvData?: any;
  filename?: string;
  isPro?: boolean;
}

export default function ExportButtons({
  cvElementId,
  cvData,
  filename = 'CV_Resumint.pdf',
  isPro = false,
}: ExportButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function handleExportPDF() {
    setLoading(true);
    try {
      await exportToPDF(cvElementId, filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportDOCX() {
    if (!isPro) {
      alert('La exportación a DOCX está disponible solo en plan Pro');
      return;
    }

    setLoading(true);
    try {
      if (!cvData) {
        throw new Error('No hay datos del CV para exportar');
      }

      const docFilename = filename.replace('.pdf', '.docx');
      await exportToDOCX(cvData, docFilename);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Error al exportar DOCX');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleExportPDF}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
      >
        {loading ? 'Descargando...' : '📥 Descargar PDF'}
      </button>

      {isPro && (
        <button
          onClick={handleExportDOCX}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Descargando...' : '📥 Descargar DOCX'}
        </button>
      )}

      {!isPro && (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium"
        >
          📥 DOCX (Plan Pro)
        </button>
      )}
    </div>
  );
}
