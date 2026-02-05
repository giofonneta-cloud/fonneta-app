"use client";

import { useState, useEffect } from 'react';
import { Provider } from '../types/provider.types';
import { providerService } from '../services/providerService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search, Filter, Building2, Mail, Phone, MapPin, FileText, MoreHorizontal, Pencil, Trash2, ExternalLink, FileCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { OnboardingStatus } from '../types/provider.types';

interface ProvidersTableProps {
    onEdit?: (provider: Provider) => void;
    onDelete?: (id: string) => void;
}

export function ProvidersTable({ onEdit, onDelete }: ProvidersTableProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'provider' | 'client'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
    const [selectedProviderForNotes, setSelectedProviderForNotes] = useState<Provider | null>(null);
    const [tempNotes, setTempNotes] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    useEffect(() => {
        filterProviders();
    }, [providers, searchTerm, typeFilter, statusFilter]);

    const loadProviders = async () => {
        try {
            const data = await providerService.getProviders();
            setProviders(data);
        } catch (error) {
            console.error('Error loading providers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterProviders = () => {
        let filtered = [...providers];

        // Filtro de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de tipo
        if (typeFilter === 'provider') {
            filtered = filtered.filter(p => p.is_provider);
        } else if (typeFilter === 'client') {
            filtered = filtered.filter(p => p.is_client);
        }

        // Filtro de estado
        if (statusFilter === 'active') {
            filtered = filtered.filter(p => p.is_active);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(p => !p.is_active);
        }

        setFilteredProviders(filtered);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            setIsDeleting(id);
            try {
                await providerService.deleteProvider(id);
                setProviders(providers.filter(p => p.id !== id));
                if (onDelete) onDelete(id);
            } catch (error) {
                console.error('Error deleting provider:', error);
                alert('Error al eliminar el registro');
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleStatusChange = async (provider: Provider, newStatus: OnboardingStatus) => {
        if (newStatus === 'DEVUELTO') {
            setSelectedProviderForNotes(provider);
            setTempNotes(provider.onboarding_notes || '');
            setIsNotesDialogOpen(true);
            return;
        }

        try {
            setIsUpdatingStatus(provider.id);
            const updated = await providerService.updateProvider(provider.id, {
                onboarding_status: newStatus
            });
            setProviders(providers.map(p => p.id === provider.id ? updated : p));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedProviderForNotes) return;

        try {
            setIsUpdatingStatus(selectedProviderForNotes.id);
            const updated = await providerService.updateProvider(selectedProviderForNotes.id, {
                onboarding_status: 'DEVUELTO',
                onboarding_notes: tempNotes
            });
            setProviders(providers.map(p => p.id === selectedProviderForNotes.id ? updated : p));
            setIsNotesDialogOpen(false);
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('Error al guardar las notas');
        } finally {
            setIsUpdatingStatus(null);
            setSelectedProviderForNotes(null);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Cargando...</p>
            </div>
        );
    }

    if (providers.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-slate-600">No hay proveedores o clientes registrados</p>
                <p className="text-sm mt-1">Haz clic en "Nuevo Proveedor/Cliente" para comenzar</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros y Búsqueda */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nombre, documento, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="provider">Solo Proveedores</SelectItem>
                                <SelectItem value="client">Solo Clientes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activos</SelectItem>
                                <SelectItem value="inactive">Inactivos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <Filter className="w-4 h-4" />
                    <span>Mostrando {filteredProviders.length} de {providers.length} registros</span>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Nombre / Entidad</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Docs Cargados</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Estado Onboarding</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {filteredProviders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <Building2 className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron registros</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProviders.map((provider) => (
                                    <tr key={provider.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-all">
                                                    <Building2 className="w-5 h-5 text-blue-600 group-hover:text-white transition-all" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors uppercase italic">{provider.business_name}</div>
                                                    {provider.contact_name && (
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{provider.contact_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <TableCell>
                                            {provider.person_type && (
                                                <Badge variant="outline" className="capitalize">
                                                    {provider.person_type === 'natural' ? 'Natural' : 'Jurídica'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {provider.document_type && provider.document_number && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500 uppercase">
                                                            {provider.document_type.replace('_', ' ')}
                                                        </p>
                                                        <p className="font-medium">{provider.document_number}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {provider.contact_email && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate max-w-[200px]">{provider.contact_email}</span>
                                                    </div>
                                                )}
                                                {provider.contact_phone && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{provider.contact_phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {/* Documentos Cargados */}
                                            <div className="flex items-center gap-2">
                                                {(provider.rut_url || provider.cedula_url || provider.cert_bancaria_url || provider.camara_comercio_url) ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {provider.rut_url && (
                                                            <a
                                                                href={provider.rut_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors"
                                                                title="Ver RUT"
                                                            >
                                                                <FileCheck className="w-3 h-3" />
                                                                RUT
                                                                <ExternalLink className="w-2.5 h-2.5" />
                                                            </a>
                                                        )}
                                                        {provider.cedula_url && (
                                                            <a
                                                                href={provider.cedula_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors"
                                                                title="Ver Cédula"
                                                            >
                                                                <FileCheck className="w-3 h-3" />
                                                                Cédula
                                                                <ExternalLink className="w-2.5 h-2.5" />
                                                            </a>
                                                        )}
                                                        {provider.cert_bancaria_url && (
                                                            <a
                                                                href={provider.cert_bancaria_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors"
                                                                title="Ver Certificación Bancaria"
                                                            >
                                                                <FileCheck className="w-3 h-3" />
                                                                Bancaria
                                                                <ExternalLink className="w-2.5 h-2.5" />
                                                            </a>
                                                        )}
                                                        {provider.camara_comercio_url && (
                                                            <a
                                                                href={provider.camara_comercio_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors"
                                                                title="Ver Cámara de Comercio"
                                                            >
                                                                <FileCheck className="w-3 h-3" />
                                                                C.Com
                                                                <ExternalLink className="w-2.5 h-2.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-orange-500">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold">Sin documentos</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="min-w-[140px]">
                                                <Select
                                                    value={provider.onboarding_status}
                                                    onValueChange={(value: OnboardingStatus) => handleStatusChange(provider, value)}
                                                    disabled={isUpdatingStatus === provider.id}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-8 text-xs font-bold",
                                                        provider.onboarding_status === 'VALIDADO' && "bg-green-50 text-green-700 border-green-200",
                                                        provider.onboarding_status === 'DEVUELTO' && "bg-orange-50 text-orange-700 border-orange-200",
                                                        provider.onboarding_status === 'EN REVISION' && "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="EN REVISION">EN REVISIÓN</SelectItem>
                                                        <SelectItem value="DEVUELTO">DEVUELTO</SelectItem>
                                                        <SelectItem value="VALIDADO">VALIDADO</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell align="right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onEdit?.(provider)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
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
                                        </TableCell>
                                    </tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

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
                                onChange={(e) => setTempNotes(e.target.value)}
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
