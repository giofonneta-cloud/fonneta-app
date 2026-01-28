'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  user_email: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

interface AuditFilters {
  entity_type?: string;
  action?: string;
  user_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface Props {
  entityType?: string; // Pre-filtrar por tipo de entidad
  entityId?: string;   // Pre-filtrar por ID específico
  limit?: number;
}

// ============================================
// CONSTANTS
// ============================================

const ACTION_LABELS: Record<string, string> = {
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
};

const ENTITY_LABELS: Record<string, string> = {
  project: 'Proyecto',
  task: 'Tarea',
  venta: 'Venta',
  gasto: 'Gasto',
  provider: 'Proveedor',
  comment: 'Comentario',
};

// ============================================
// COMPONENT
// ============================================

export function AuditLogViewer({ entityType, entityId, limit = 50 }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({
    entity_type: entityType,
  });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Aplicar filtros
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar logs');
    } finally {
      setLoading(false);
    }
  }, [supabase, filters, entityId, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatChanges = (changes: Record<string, unknown> | null) => {
    if (!changes || Object.keys(changes).length === 0) return null;

    return Object.entries(changes).map(([key, value]) => (
      <div key={key} className="text-xs">
        <span className="font-medium text-gray-600">{key}:</span>{' '}
        <span className="text-gray-800">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
  };

  const toggleExpanded = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Error al cargar historial</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      {!entityType && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
          <select
            value={filters.entity_type || ''}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value || undefined })}
            className="px-3 py-1.5 border rounded-md text-sm bg-white"
          >
            <option value="">Todas las entidades</option>
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filters.action || ''}
            onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
            className="px-3 py-1.5 border rounded-md text-sm bg-white"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
            className="px-3 py-1.5 border rounded-md text-sm bg-white"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
            className="px-3 py-1.5 border rounded-md text-sm bg-white"
            placeholder="Hasta"
          />

          {(filters.entity_type || filters.action || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ entity_type: entityType })}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Lista de logs */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              {/* Header */}
              <button
                onClick={() => toggleExpanded(log.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${ACTION_COLORS[log.action]}`}>
                    {ACTION_LABELS[log.action]}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {ENTITY_LABELS[log.entity_type] || log.entity_type}
                  </span>
                  {log.user_email && (
                    <span className="text-xs text-gray-500">
                      por {log.user_email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDate(log.created_at)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedLogId === log.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Detalles expandidos */}
              {expandedLogId === log.id && (
                <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cambios */}
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                          Campos Modificados
                        </h5>
                        <div className="bg-white p-3 rounded border space-y-1">
                          {formatChanges(log.changes)}
                        </div>
                      </div>
                    )}

                    {/* Datos anteriores (para updates/deletes) */}
                    {log.old_data && log.action !== 'create' && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                          Datos Anteriores
                        </h5>
                        <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                          {JSON.stringify(log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Datos nuevos (para creates/updates) */}
                    {log.new_data && log.action !== 'delete' && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                          {log.action === 'create' ? 'Datos Creados' : 'Datos Nuevos'}
                        </h5>
                        <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* ID de entidad */}
                  {log.entity_id && (
                    <div className="mt-3 text-xs text-gray-500">
                      ID: <code className="bg-gray-200 px-1 rounded">{log.entity_id}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      <div className="text-center text-xs text-gray-400">
        Mostrando {logs.length} de {limit} registros máximos
      </div>
    </div>
  );
}
