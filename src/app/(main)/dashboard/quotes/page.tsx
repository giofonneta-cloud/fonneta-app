'use client';

import { useState } from 'react';
import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { QuotesList } from '@/features/quotes/components/QuotesList';
import { QuoteForm } from '@/features/quotes/components/QuoteForm';
import { QuotePreview } from '@/features/quotes/components/QuotePreview';
import { QuoteAccessManager } from '@/features/quotes/components/QuoteAccessManager';
import { quotesService } from '@/features/quotes/services/quotesService';
import type { Quote } from '@/features/quotes/types/quote.types';

type View = 'list' | 'form';

export default function QuotesPage() {
  const { hasPermission, isLoading } = useAuthStore();
  const [view, setView] = useState<View>('list');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAccessManager, setShowAccessManager] = useState(false);

  if (isLoading) return null;

  if (!hasPermission('quotes.view')) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
        <h1 className="text-lg font-bold text-slate-800">No tienes acceso a Cotizaciones</h1>
        <p className="text-sm text-slate-500">
          Solicita al administrador que te habilite el permiso &quot;Ver cotizaciones&quot; para usar este espacio.
        </p>
      </div>
    );
  }

  const goBack = () => {
    setView('list');
    setEditingQuote(null);
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setView('form');
  };

  const handleNewQuote = () => {
    setEditingQuote(null);
    setView('form');
  };

  const handlePreview = async (quote: Quote) => {
    try {
      const full = await quotesService.getQuoteById(quote.id);
      setPreviewQuote(full);
    } catch {
      setPreviewQuote(quote);
    }
  };

  const handleFormSuccess = (quote: Quote) => {
    goBack();
    handlePreview(quote);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {view !== 'list' && (
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Cotizaciones
        </button>
      )}

      {view === 'list' && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cotizaciones</h1>
              <p className="text-sm text-slate-500 mt-0.5">Crea, envía y da seguimiento a propuestas comerciales</p>
            </div>
            {hasPermission('quotes.view_all') && (
              <button
                onClick={() => setShowAccessManager(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Accesos por Centro de Costo
              </button>
            )}
          </div>
          <div key={refreshKey} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <QuotesList onEdit={handleEdit} onPreview={handlePreview} onNewQuote={handleNewQuote} />
          </div>
        </>
      )}

      {showAccessManager && <QuoteAccessManager onClose={() => setShowAccessManager(false)} />}

      {view === 'form' && (
        <QuoteForm
          key={editingQuote?.id ?? 'new-quote'}
          initialData={editingQuote ?? undefined}
          onSuccess={handleFormSuccess}
          onCancel={goBack}
        />
      )}

      {previewQuote && (
        <QuotePreview
          quote={previewQuote}
          onClose={() => {
            setPreviewQuote(null);
            setRefreshKey((k) => k + 1);
          }}
          onEdit={() => {
            setEditingQuote(previewQuote);
            setPreviewQuote(null);
            setView('form');
          }}
          onSent={() => {
            setPreviewQuote(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
