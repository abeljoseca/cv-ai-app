'use client';

import { useState } from 'react';
import { exportToPDF, exportToDOCX } from '@/lib/export';
import PaymentModal from '@/components/PaymentModal';

interface ExportButtonsProps {
  cvElementId: string;
  cvData?: any;
  filename?: string;
  isPro?: boolean;
  cvId?: string;
  hasPaid?: boolean;
  onPaymentSuccess?: () => void;
}

export default function ExportButtons({
  cvElementId,
  cvData,
  filename = 'CV_Momentum.pdf',
  isPro = false,
  cvId,
  hasPaid = false,
  onPaymentSuccess,
}: ExportButtonsProps) {
  const [loading, setLoading]           = useState(false);
  const [showPayment, setShowPayment]   = useState(false);

  const canDownload = isPro || hasPaid;

  async function triggerDownloadPDF() {
    setLoading(true);
    try {
      await exportToPDF(cvElementId, filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function triggerDownloadDOCX() {
    if (!cvData) return;
    setLoading(true);
    try {
      await exportToDOCX(cvData, filename.replace('.pdf', '.docx'));
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Error al exportar DOCX. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    if (!canDownload) {
      setShowPayment(true);
      return;
    }
    triggerDownloadPDF();
  }

  function handlePaymentSuccess() {
    setShowPayment(false);
    onPaymentSuccess?.();
    triggerDownloadPDF();
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* PDF — siempre visible, paywall si no ha pagado */}
        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Descargando…' : canDownload ? '↓ Descargar PDF' : '🔒 Descargar PDF — $2.99'}
        </button>

        {/* DOCX — solo para suscripción Pro */}
        {isPro ? (
          <button
            onClick={triggerDownloadDOCX}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Descargando…' : '↓ Descargar DOCX'}
          </button>
        ) : (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium border border-gray-200"
          >
            DOCX — Plan Pro
          </button>
        )}
      </div>

      {showPayment && cvId && (
        <PaymentModal
          cvId={cvId}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
}