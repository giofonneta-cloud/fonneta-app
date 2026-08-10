'use client';

import { useState, useEffect, useRef } from 'react';
import { FileSignature, Loader2, Plus, Trash2, Paperclip, Upload, ExternalLink } from 'lucide-react';
import type { PurchaseOrder } from '../types/purchase-order.types';
import {
    MARCAS_RELEASE,
    TIPO_RELEASE_LABELS,
    RELEASE_STATUS_LABELS,
    RELEASE_STATUS_COLORS,
    type TipoRelease,
    type MarcaRelease,
    type ReleaseDocument,
    type ReleaseAimCampos,
    type ReleaseObrCampos,
    type ReleaseObra,
    type ReleaseCoeCampos,
    type ReleaseCoeObra,
} from '../types/release-document.types';
import { releaseDocumentService } from '../services/releaseDocumentService';
import { buildReleaseHTML } from './release-templates';
import { generatePdfBlob } from '@/shared/lib/pdf/generatePdfBlob';

interface Props {
    po: PurchaseOrder;
    // Notifica al padre (PurchaseOrderPreview) que un Release quedó listo para
    // adjuntarse al correo de la Orden de Compra.
    onReleasePrepared: (r: { id: string; releaseNumber: string; file: File }) => void;
}

const emptyAim = (po: PurchaseOrder): ReleaseAimCampos => ({
    sesion_nombre: po.description ?? '',
    lugar_fecha: '',
    fotografo_nombre: po.recipient_name,
    no_fotografias: '',
    no_audiovisuales: '',
});

const emptyObraRow = (): ReleaseObra => ({
    tipo_obra: 'Fotográfica',
    nombre_descripcion: '',
    autor: '',
    producto_editorial: '',
});

const emptyObr = (po: PurchaseOrder): ReleaseObrCampos => ({
    autor_nombre: po.recipient_name,
    representa_sociedad: po.recipient_nit ? po.recipient_name : '',
    nombre_campana: po.description ?? '',
    tipo_derecho: 'obra',
    obras: [emptyObraRow()],
    forma_pago: 'gratuito',
    valor_pago: undefined,
    fecha_firma: '',
});

const emptyCoeObraRow = (): ReleaseCoeObra => ({ descripcion: '' });

const emptyCoe = (po: PurchaseOrder): ReleaseCoeCampos => ({
    encargado_nombre: po.recipient_name,
    tipo_derecho: 'obra',
    obras: [emptyCoeObraRow()],
    valor_pago: po.total || 0,
    representante_fonneta: po.authorized_by ?? '',
    fecha_firma: '',
});

export function ReleaseDocumentPanel({ po, onReleasePrepared }: Props) {
    const [releases, setReleases] = useState<ReleaseDocument[]>([]);
    const [loadingReleases, setLoadingReleases] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [tipoRelease, setTipoRelease] = useState<TipoRelease>('aim');
    const [marca, setMarca] = useState<MarcaRelease | ''>('');
    const [recipientName, setRecipientName] = useState(po.recipient_name);
    const [recipientEmail, setRecipientEmail] = useState(po.recipient_email);

    const [aimCampos, setAimCampos] = useState<ReleaseAimCampos>(() => emptyAim(po));
    const [obrCampos, setObrCampos] = useState<ReleaseObrCampos>(() => emptyObr(po));
    const [coeCampos, setCoeCampos] = useState<ReleaseCoeCampos>(() => emptyCoe(po));

    const [generating, setGenerating] = useState(false);
    const [formError, setFormError] = useState('');
    const sendingRef = useRef(false);

    const [signingId, setSigningId] = useState<string | null>(null);
    const [pickerReleaseId, setPickerReleaseId] = useState<string | null>(null);
    const signFileInputRef = useRef<HTMLInputElement>(null);

    const loadReleases = () => {
        setLoadingReleases(true);
        releaseDocumentService
            .getByPurchaseOrderId(po.id)
            .then(setReleases)
            .catch((err) => console.error('Error cargando releases', err))
            .finally(() => setLoadingReleases(false));
    };

    useEffect(() => {
        loadReleases();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [po.id]);

    const validate = (): string | null => {
        if (!recipientName.trim()) return 'El nombre del destinatario es requerido';
        if (!recipientEmail.trim()) return 'El correo del destinatario es requerido';
        if (!marca) return 'Selecciona la marca relacionada';

        if (tipoRelease === 'aim') {
            if (!aimCampos.sesion_nombre.trim()) return 'El nombre de la sesión/producción es requerido';
            if (!aimCampos.lugar_fecha.trim()) return 'El lugar y fecha de realización es requerido';
            if (!aimCampos.fotografo_nombre.trim()) return 'El nombre del fotógrafo es requerido';
        }

        if (tipoRelease === 'obr') {
            if (!obrCampos.autor_nombre.trim()) return 'El nombre del autor es requerido';
            if (!obrCampos.nombre_campana.trim()) return 'El nombre de la campaña es requerido';
            if (obrCampos.obras.length === 0) return 'Agrega al menos una obra';
            for (const o of obrCampos.obras) {
                if (!o.nombre_descripcion.trim() || !o.autor.trim() || !o.producto_editorial.trim()) {
                    return 'Completa todos los campos de cada obra (o elimina la fila vacía)';
                }
            }
            if (obrCampos.forma_pago === 'oneroso' && !(obrCampos.valor_pago && obrCampos.valor_pago > 0)) {
                return 'Especifica el valor del pago';
            }
        }

        if (tipoRelease === 'coe') {
            if (!coeCampos.encargado_nombre.trim()) return 'El nombre del autor encargado es requerido';
            if (!coeCampos.representante_fonneta.trim()) return 'El representante de Fonneta es requerido';
            if (coeCampos.obras.length === 0) return 'Agrega al menos una obra/fonograma';
            for (const o of coeCampos.obras) {
                if (!o.descripcion.trim()) return 'Completa la descripción de cada obra (o elimina la fila vacía)';
            }
            if (!(coeCampos.valor_pago > 0)) return 'El valor del pago debe ser mayor a 0';
        }

        return null;
    };

    const handleAttachRelease = async () => {
        if (sendingRef.current) return;
        const error = validate();
        if (error) {
            setFormError(error);
            return;
        }
        sendingRef.current = true;
        setGenerating(true);
        setFormError('');

        try {
            const campos = tipoRelease === 'aim' ? aimCampos : tipoRelease === 'obr' ? obrCampos : coeCampos;

            const created = await releaseDocumentService.create({
                purchase_order_id: po.id,
                provider_id: po.provider_id ?? null,
                recipient_email: recipientEmail,
                recipient_name: recipientName,
                tipo_release: tipoRelease,
                marca: marca as MarcaRelease,
                campos,
            });

            const html = buildReleaseHTML(tipoRelease, {
                marca: marca as MarcaRelease,
                releaseNumber: created.release_number,
                campos,
                po,
            });
            const blob = await generatePdfBlob(html, { pageNumbers: true });
            const pdfFile = new File([blob], `${created.release_number}.pdf`, { type: 'application/pdf' });

            // El PDF NO se envía por separado: se entrega al padre para adjuntarlo
            // al correo de la Orden de Compra (un solo correo con OC + Release).
            onReleasePrepared({ id: created.id, releaseNumber: created.release_number, file: pdfFile });

            setShowForm(false);
            setAimCampos(emptyAim(po));
            setObrCampos(emptyObr(po));
            setCoeCampos(emptyCoe(po));
            setMarca('');
            loadReleases();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Error al generar el release');
        } finally {
            setGenerating(false);
            sendingRef.current = false;
        }
    };

    const handleUploadSigned = async (releaseId: string, file: File) => {
        setSigningId(releaseId);
        try {
            const formData = new FormData();
            formData.append('releaseDocumentId', releaseId);
            formData.append('file', file);
            const res = await fetch('/api/upload/release-signed', { method: 'POST', body: formData });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Error al subir el documento firmado');
            }
            loadReleases();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al subir el documento firmado');
        } finally {
            setSigningId(null);
        }
    };

    return (
        <div className="border border-purple-200 bg-purple-50/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-800">Documentos Release</span>
                </div>
                {!showForm && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="text-xs font-medium text-purple-700 hover:text-purple-900"
                    >
                        + Requiere Release
                    </button>
                )}
            </div>

            {/* Existing releases list */}
            {!loadingReleases && releases.length > 0 && (
                <div className="space-y-2">
                    {releases.map((r) => (
                        <div key={r.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2 text-xs">
                            <div className="min-w-0">
                                <p className="font-mono font-semibold text-gray-800 truncate">{r.release_number}</p>
                                <p className="text-gray-400 truncate">{TIPO_RELEASE_LABELS[r.tipo_release]} &middot; {r.marca}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${RELEASE_STATUS_COLORS[r.status]}`}>
                                    {RELEASE_STATUS_LABELS[r.status]}
                                </span>
                                {r.document_url && (
                                    <a href={r.document_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800" title="Ver PDF">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                {r.status === 'pendiente_firma' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPickerReleaseId(r.id);
                                            signFileInputRef.current?.click();
                                        }}
                                        disabled={signingId === r.id}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                        title="Subir PDF firmado"
                                    >
                                        {signingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <input
                ref={signFileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && pickerReleaseId) handleUploadSigned(pickerReleaseId, f);
                    if (signFileInputRef.current) signFileInputRef.current.value = '';
                    setPickerReleaseId(null);
                }}
            />

            {showForm && (
                <div className="space-y-3 pt-2 border-t border-purple-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipo de Release</label>
                            <select
                                value={tipoRelease}
                                onChange={(e) => setTipoRelease(e.target.value as TipoRelease)}
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                            >
                                {(Object.keys(TIPO_RELEASE_LABELS) as TipoRelease[]).map((t) => (
                                    <option key={t} value={t}>{TIPO_RELEASE_LABELS[t]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Marca Relacionada</label>
                            <select
                                value={marca}
                                onChange={(e) => setMarca(e.target.value as MarcaRelease)}
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                            >
                                <option value="">Selecciona...</option>
                                {MARCAS_RELEASE.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nombre del firmante</label>
                            <input
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Correo del firmante</label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                            />
                        </div>
                    </div>

                    {tipoRelease === 'aim' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white rounded-lg border border-gray-200 p-3">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nombre y descripción de la sesión/producción</label>
                                <input value={aimCampos.sesion_nombre} onChange={(e) => setAimCampos((c) => ({ ...c, sesion_nombre: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lugar y fecha de realización</label>
                                <input value={aimCampos.lugar_fecha} onChange={(e) => setAimCampos((c) => ({ ...c, lugar_fecha: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fotógrafo</label>
                                <input value={aimCampos.fotografo_nombre} onChange={(e) => setAimCampos((c) => ({ ...c, fotografo_nombre: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">No. fotografías (opcional)</label>
                                <input value={aimCampos.no_fotografias} onChange={(e) => setAimCampos((c) => ({ ...c, no_fotografias: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">No. audiovisuales (opcional)</label>
                                <input value={aimCampos.no_audiovisuales} onChange={(e) => setAimCampos((c) => ({ ...c, no_audiovisuales: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                            </div>
                        </div>
                    )}

                    {tipoRelease === 'obr' && (
                        <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Autor</label>
                                    <input value={obrCampos.autor_nombre} onChange={(e) => setObrCampos((c) => ({ ...c, autor_nombre: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Representa a la sociedad (opcional)</label>
                                    <input value={obrCampos.representa_sociedad} onChange={(e) => setObrCampos((c) => ({ ...c, representa_sociedad: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nombre de la campaña</label>
                                    <input value={obrCampos.nombre_campana} onChange={(e) => setObrCampos((c) => ({ ...c, nombre_campana: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fonograma u Obra</label>
                                    <select value={obrCampos.tipo_derecho} onChange={(e) => setObrCampos((c) => ({ ...c, tipo_derecho: e.target.value as 'fonograma' | 'obra' }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                                        <option value="obra">Obra</option>
                                        <option value="fonograma">Fonograma</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Forma de pago</label>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <label className="flex items-center gap-1.5 text-sm">
                                            <input type="radio" checked={obrCampos.forma_pago === 'gratuito'} onChange={() => setObrCampos((c) => ({ ...c, forma_pago: 'gratuito' }))} />
                                            Gratuito
                                        </label>
                                        <label className="flex items-center gap-1.5 text-sm">
                                            <input type="radio" checked={obrCampos.forma_pago === 'oneroso'} onChange={() => setObrCampos((c) => ({ ...c, forma_pago: 'oneroso' }))} />
                                            Oneroso
                                        </label>
                                    </div>
                                </div>
                                {obrCampos.forma_pago === 'oneroso' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valor (COP)</label>
                                        <input type="number" value={obrCampos.valor_pago ?? ''} onChange={(e) => setObrCampos((c) => ({ ...c, valor_pago: Number(e.target.value) || 0 }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fecha de firma / suscripción (opcional)</label>
                                    <input type="date" value={obrCampos.fecha_firma ?? ''} onChange={(e) => setObrCampos((c) => ({ ...c, fecha_firma: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Obras</label>
                                    <button type="button" onClick={() => setObrCampos((c) => ({ ...c, obras: [...c.obras, emptyObraRow()] }))} className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-800">
                                        <Plus className="w-3 h-3" /> Agregar obra
                                    </button>
                                </div>
                                {obrCampos.obras.map((o, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-1.5 items-center">
                                        <select value={o.tipo_obra} onChange={(e) => setObrCampos((c) => ({ ...c, obras: c.obras.map((row, idx) => idx === i ? { ...row, tipo_obra: e.target.value as ReleaseObra['tipo_obra'] } : row) }))} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                                            <option>Fotográfica</option>
                                            <option>Audiovisual</option>
                                            <option>Literaria</option>
                                            <option>Artística</option>
                                            <option>Otro</option>
                                        </select>
                                        <input placeholder="Nombre/descripción" value={o.nombre_descripcion} onChange={(e) => setObrCampos((c) => ({ ...c, obras: c.obras.map((row, idx) => idx === i ? { ...row, nombre_descripcion: e.target.value } : row) }))} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                                        <input placeholder="Autor" value={o.autor} onChange={(e) => setObrCampos((c) => ({ ...c, obras: c.obras.map((row, idx) => idx === i ? { ...row, autor: e.target.value } : row) }))} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                                        <input placeholder="Producto editorial" value={o.producto_editorial} onChange={(e) => setObrCampos((c) => ({ ...c, obras: c.obras.map((row, idx) => idx === i ? { ...row, producto_editorial: e.target.value } : row) }))} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                                        <button type="button" onClick={() => setObrCampos((c) => ({ ...c, obras: c.obras.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-500 justify-self-start">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tipoRelease === 'coe' && (
                        <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Autor Encargado</label>
                                    <input value={coeCampos.encargado_nombre} onChange={(e) => setCoeCampos((c) => ({ ...c, encargado_nombre: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Representante de Fonneta</label>
                                    <input value={coeCampos.representante_fonneta} onChange={(e) => setCoeCampos((c) => ({ ...c, representante_fonneta: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fonograma u Obra</label>
                                    <select value={coeCampos.tipo_derecho} onChange={(e) => setCoeCampos((c) => ({ ...c, tipo_derecho: e.target.value as 'fonograma' | 'obra' }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                                        <option value="obra">Obra</option>
                                        <option value="fonograma">Fonograma</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valor del pago (COP)</label>
                                    <input type="number" value={coeCampos.valor_pago || ''} onChange={(e) => setCoeCampos((c) => ({ ...c, valor_pago: Number(e.target.value) || 0 }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fecha de firma / suscripción (opcional)</label>
                                    <input type="date" value={coeCampos.fecha_firma ?? ''} onChange={(e) => setCoeCampos((c) => ({ ...c, fecha_firma: e.target.value }))} className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Obras / Fonogramas</label>
                                    <button type="button" onClick={() => setCoeCampos((c) => ({ ...c, obras: [...c.obras, emptyCoeObraRow()] }))} className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-800">
                                        <Plus className="w-3 h-3" /> Agregar
                                    </button>
                                </div>
                                {coeCampos.obras.map((o, i) => (
                                    <div key={i} className="flex gap-1.5 items-center">
                                        <input placeholder="Descripción breve" value={o.descripcion} onChange={(e) => setCoeCampos((c) => ({ ...c, obras: c.obras.map((row, idx) => idx === i ? { descripcion: e.target.value } : row) }))} className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                                        <button type="button" onClick={() => setCoeCampos((c) => ({ ...c, obras: c.obras.filter((_, idx) => idx !== i) }))} className="text-gray-300 hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {formError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{formError}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleAttachRelease}
                            disabled={generating}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                            {generating ? 'Generando...' : 'Adjuntar Release a la Orden de Compra'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
