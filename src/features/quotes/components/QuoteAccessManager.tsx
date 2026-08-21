'use client';

import { useState, useEffect, useCallback } from 'react';
import { quoteAccessService, type QuoteCostCenterAccess } from '../services/quoteAccessService';
import { useParametros } from '@/features/admin/hooks/useParametros';
import { X, Trash2, Plus, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function QuoteAccessManager({ onClose }: Props) {
  const { opciones: centrosCosto } = useParametros('centros_costo');
  const [access, setAccess] = useState<QuoteCostCenterAccess[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accessData, usersData] = await Promise.all([
        quoteAccessService.getAllAccess(),
        quoteAccessService.getQuoteUsers(),
      ]);
      setAccess(accessData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error cargando accesos:', err);
      setError('No se pudieron cargar los accesos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGrant = async () => {
    if (!selectedUser || !selectedCostCenter) return;
    setSaving(true);
    setError(null);
    try {
      await quoteAccessService.grantAccess(selectedUser, selectedCostCenter);
      setSelectedCostCenter('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al otorgar acceso');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await quoteAccessService.revokeAccess(id);
      setAccess((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al quitar acceso');
    }
  };

  const usersById = new Map(users.map((u) => [u.id, u]));
  const accessByUser = new Map<string, QuoteCostCenterAccess[]>();
  for (const a of access) {
    const list = accessByUser.get(a.user_id) ?? [];
    list.push(a);
    accessByUser.set(a.user_id, list);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Accesos por Centro de Costo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-2">
          <p className="text-xs text-gray-500">
            Los usuarios sin permiso &quot;Ver todas&quot; solo ven cotizaciones del centro de costo que les habilites aquí (de cualquier autor).
          </p>
          <div className="flex gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">Selecciona usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
            <select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-40 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">Centro de costo</option>
              {centrosCosto.map((o) => (
                <option key={o.valor} value={o.etiqueta}>{o.etiqueta}</option>
              ))}
            </select>
            <button
              onClick={handleGrant}
              disabled={!selectedUser || !selectedCostCenter || saving}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Agregar
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : usersById.size === 0 || accessByUser.size === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Aún no hay accesos configurados. Los usuarios con permiso de cotizaciones sin &quot;Ver todas&quot; no verán nada hasta que les asignes un centro de costo.
            </p>
          ) : (
            <div className="space-y-3">
              {Array.from(accessByUser.entries()).map(([userId, grants]) => {
                const user = usersById.get(userId);
                return (
                  <div key={userId} className="border border-gray-200 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name || grants[0]?.user_name || 'Usuario'}
                      <span className="text-xs text-gray-400 font-normal ml-1.5">{user?.email || grants[0]?.user_email}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {grants.map((g) => (
                        <span key={g.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          {g.cost_center}
                          <button onClick={() => handleRevoke(g.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
