"use client";

import { useState, useEffect } from 'react';
import { Provider } from '../types/provider.types';
import { providerService } from '../services/providerService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search, Filter, Building2, Mail, Phone, MapPin, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold">Nombre</TableHead>
                                <TableHead className="font-bold">Tipo Persona</TableHead>
                                <TableHead className="font-bold">Documento</TableHead>
                                <TableHead className="font-bold">Contacto</TableHead>
                                <TableHead className="font-bold">Ubicación</TableHead>
                                <TableHead className="font-bold">Tipo</TableHead>
                                <TableHead className="font-bold">Registro</TableHead>
                                <TableHead className="font-bold">Observaciones</TableHead>
                                <TableHead className="font-bold text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProviders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        No se encontraron resultados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProviders.map((provider) => (
                                    <TableRow key={provider.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 rounded">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{provider.business_name}</p>
                                                    {provider.contact_name && (
                                                        <p className="text-xs text-slate-500">{provider.contact_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
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
                                            {provider.city && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{provider.city}{provider.department && `, ${provider.department}`}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {provider.is_provider && (
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                        Proveedor
                                                    </Badge>
                                                )}
                                                {provider.is_client && (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                                        Cliente
                                                    </Badge>
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
                                        <TableCell>
                                            {provider.onboarding_notes ? (
                                                <p className="text-xs text-slate-600 font-medium line-clamp-2 max-w-[200px]" title={provider.onboarding_notes}>
                                                    {provider.onboarding_notes}
                                                </p>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 italic">Sin observaciones</span>
                                            )}
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
                                    </TableRow>
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
