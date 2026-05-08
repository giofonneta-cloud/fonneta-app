"use client";

import { useState, useEffect, useCallback } from 'react';
import { Provider, OnboardingStatus } from '../types/provider.types';
import { providerService } from '../services/providerService';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';
import {
  Search, Building2, Mail, Phone, FileText, MoreHorizontal,
  Pencil, Trash2, ExternalLink, FileCheck, AlertCircle, Filter,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

// Nombre | Registro | Tipo | Documento | Contacto | Docs | Estado | Acciones
const INITIAL_WIDTHS = [230, 95, 90, 150, 195, 165, 145, 70];

const ONBOARDING_STYLES: Record<OnboardingStatus, string> = {
  'VALIDADO':    'bg-green-50 text-green-700 border-green-200',
  'EN REVISION': 'bg-blue-50 text-blue-700 border-blue-200',
  'DEVUELTO':    'bg-orange-50 text-orange-700 border-orange-200',
};

const formatDate = (dateStr: string) => {
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-slate-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface ProvidersTableProps {
  onEdit?: (provider: Provider) => void;
  onDelete?: (id: string) => void;
}

export function ProvidersTable({ onEdit, onDelete }: ProvidersTableProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'provider' | 'client'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedProviderForNotes, setSelectedProviderForNotes] = useState<Provider | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await providerService.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const filtered = providers.filter(p => {
    const matchSearch = !searchTerm || [p.business_name, p.document_number, p.contact_email, p.contact_name]
      .some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter === 'all' || (typeFilter === 'provider' ? p.is_provider : p.is_client);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
    return matchSearch && matchType && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    setIsDeleting(id);
    try {
      await providerService.deleteProvider(id);
      setProviders(prev => prev.filter(p => p.id !== id));
      onDelete?.(id);
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Error al eliminar el registro');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (provider: Provider, newStatus: OnboardingStatus) => {
    if (newStatus === 'DEVUELTO') {
      setSelectedProviderForNotes(provider);
      setTempNotes(provider.onboarding_notes || '');
      setIsNotesDialogOpen(true);
      return;
    }
    setIsUpdatingStatus(provider.id);
    try {
      const updated = await providerService.updateProvider(provider.id, { onboarding_status: newStatus });
      setProviders(prev => prev.map(p => p.id === provider.id ? updated : p));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedProviderForNotes) return;
    setIsUpdatingStatus(selectedProviderForNotes.id);
    try {
      const updated = await providerService.updateProvider(selectedProviderForNotes.id, {
        onboarding_status: 'DEVUELTO',
        onboarding_notes: tempNotes,
      });
      setProviders(prev => prev.map(p => p.id === selectedProviderForNotes.id ? updated : p));
      setIsNotesDialogOpen(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error al guardar las notas');
    } finally {
      setIsUpdatingStatus(null);
      setSelectedProviderForNotes(null);
    }
  };

  const totalWidth = widths.reduce((a, b) => a + b, 0);
  const COLS = ['Nombre / Entidad', 'Registro', 'Tipo', 'Documento', 'Contacto', 'Docs Cargados', 'Estado', 'Acc.'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-700 min-w-[150px]"
        >
          <option value="all">Todos</option>
          <option value="provider">Solo Proveedores</option>
          <option value="client">Solo Clientes</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-700 min-w-[130px]"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Filter className="w-3.5 h-3.5" />
        <span>Mostrando <strong>{filtered.length}</strong> de <strong>{providers.length}</strong> registros</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table
          className="text-sm text-left"
          style={{ tableLayout: 'fixed', width: totalWidth }}
        >
          <colgroup>
            {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              {COLS.map((col, i) => (
                <th
                  key={i}
                  className="relative select-none overflow-hidden px-4 py-3 font-black tracking-wider"
                >
                  <span className="block truncate">{col}</span>
                  {i < COLS.length - 1 && (
                    <div
                      onMouseDown={startResize(i)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 transition-colors"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No se encontraron registros</p>
                </td>
              </tr>
            ) : (
              filtered.map(provider => (
                <tr key={provider.id} className="hover:bg-slate-50/70 transition-colors group">

                  {/* Nombre */}
                  <td className="px-4 py-3 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-all">
                        <Building2 className="w-4 h-4 text-blue-600 group-hover:text-white transition-all" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block truncate font-black text-gray-900 uppercase italic text-xs group-hover:text-blue-600 transition-colors">
                          {provider.business_name}
                        </span>
                        {provider.contact_name && (
                          <span className="block truncate text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {provider.contact_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Registro */}
                  <td className="px-4 py-3 overflow-hidden">
                    <span className="block truncate text-xs text-slate-500 font-medium">
                      {formatDate(provider.created_at)}
                    </span>
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 overflow-hidden">
                    {provider.person_type && (
                      <span className={cn(
                        'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        provider.person_type === 'natural'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      )}>
                        {provider.person_type === 'natural' ? 'Natural' : 'Jurídica'}
                      </span>
                    )}
                  </td>

                  {/* Documento */}
                  <td className="px-4 py-3 overflow-hidden">
                    {provider.document_type && provider.document_number && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold truncate">
                          {provider.document_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {provider.document_number}
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Contacto */}
                  <td className="px-4 py-3 overflow-hidden">
                    <div className="space-y-0.5">
                      {provider.contact_email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="text-xs text-slate-600 truncate">{provider.contact_email}</span>
                        </div>
                      )}
                      {provider.contact_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="text-xs text-slate-500 truncate">{provider.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Docs */}
                  <td className="px-4 py-3 overflow-hidden">
                    {(provider.rut_url || provider.cedula_url || provider.cert_bancaria_url || provider.camara_comercio_url) ? (
                      <div className="flex flex-wrap gap-1">
                        {provider.rut_url && (
                          <a href={provider.rut_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold hover:bg-green-100 transition-colors">
                            <FileCheck className="w-2.5 h-2.5" /> RUT <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                        {provider.cedula_url && (
                          <a href={provider.cedula_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold hover:bg-green-100 transition-colors">
                            <FileCheck className="w-2.5 h-2.5" /> Cédula <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                        {provider.camara_comercio_url && (
                          <a href={provider.camara_comercio_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold hover:bg-green-100 transition-colors">
                            <FileCheck className="w-2.5 h-2.5" /> C.Com <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                        {provider.cert_bancaria_url && (
                          <a href={provider.cert_bancaria_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold hover:bg-green-100 transition-colors">
                            <FileCheck className="w-2.5 h-2.5" /> Bancaria <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-500">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-bold">Sin documentos</span>
                      </div>
                    )}
                  </td>

                  {/* Estado onboarding */}
                  <td className="px-4 py-3 overflow-hidden">
                    <Select
                      value={provider.onboarding_status}
                      onValueChange={(v: OnboardingStatus) => handleStatusChange(provider, v)}
                      disabled={isUpdatingStatus === provider.id}
                    >
                      <SelectTrigger className={cn(
                        'h-7 text-[10px] font-bold px-2',
                        ONBOARDING_STYLES[provider.onboarding_status]
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN REVISION">EN REVISIÓN</SelectItem>
                        <SelectItem value="DEVUELTO">DEVUELTO</SelectItem>
                        <SelectItem value="VALIDADO">VALIDADO</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 overflow-hidden text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit?.(provider)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(provider.id)}
                          className="text-red-600 cursor-pointer focus:text-red-600"
                          disabled={isDeleting === provider.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting === provider.id ? 'Eliminando...' : 'Eliminar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Notes dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver Registro de Proveedor</DialogTitle>
            <DialogDescription>
              Explica al proveedor por qué su registro está siendo devuelto y qué ajustes debe realizar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas de Retroalimentación</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Por favor adjunta el RUT actualizado a 2024..."
                value={tempNotes}
                onChange={e => setTempNotes(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveNotes}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!tempNotes.trim()}
            >
              Guardar y Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
