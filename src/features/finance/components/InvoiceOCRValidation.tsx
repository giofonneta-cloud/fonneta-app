'use client';

import { useState } from 'react';
import { OCRResult } from '../services/ocrService';
import { Check, X, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InvoiceOCRValidationProps {
    ocrResult: OCRResult;
    onConfirm: (data: OCRResult) => void;
    onCancel: () => void;
}

export function InvoiceOCRValidation({ ocrResult, onConfirm, onCancel }: InvoiceOCRValidationProps) {
    const [editedData, setEditedData] = useState<OCRResult>(ocrResult);

    const isValid = (confidence: number) => confidence > 0.85;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in duration-500 max-w-5xl mx-auto flex flex-col md:flex-row h-[700px]">
            {/* File Preview Placeholder */}
            <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center p-8 text-center border-r border-gray-800">
                <div className="w-full h-full border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-500 gap-4">
                    <AlertCircle className="w-12 h-12" />
                    <p className="font-bold text-sm tracking-widest uppercase">Vista Previa de Factura</p>
                    <span className="text-xs max-w-[200px]">En una implementación real, aquí verías el PDF renderizado.</span>
                </div>
            </div>

            {/* Validation Panel */}
            <div className="w-full md:w-[450px] flex flex-col bg-white">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Validación OCR</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Revisión de Extracción</p>
                    </div>
                    <div className={cn(
                        "p-2 rounded-xl border flex items-center gap-1",
                        isValid(ocrResult.confidence) ? "bg-green-50 border-green-100 text-green-600" : "bg-orange-50 border-orange-100 text-orange-600"
                    )}>
                        <RefreshCw className={cn("w-4 h-4", isValid(ocrResult.confidence) ? "" : "animate-spin")} />
                        <span className="text-xs font-black">{(ocrResult.confidence * 100).toFixed(0)}% Confianza</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <ValidationField
                        label="Proveedor"
                        value={editedData.provider_name}
                        onChange={(v) => setEditedData({ ...editedData, provider_name: v })}
                    />
                    <ValidationField
                        label="Número de Factura"
                        value={editedData.invoice_number}
                        onChange={(v) => setEditedData({ ...editedData, invoice_number: v })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <ValidationField
                            label="Fecha"
                            value={editedData.issue_date}
                            onChange={(v) => setEditedData({ ...editedData, issue_date: v })}
                        />
                        <ValidationField
                            label="Moneda"
                            value={editedData.currency}
                            onChange={(v) => setEditedData({ ...editedData, currency: v })}
                        />
                    </div>
                    <ValidationField
                        label="Monto Total"
                        value={editedData.total_amount.toString()}
                        onChange={(v) => setEditedData({ ...editedData, total_amount: parseFloat(v) || 0 })}
                    />
                    <ValidationField
                        label="IVA / Impuestos"
                        value={editedData.tax_amount.toString()}
                        onChange={(v) => setEditedData({ ...editedData, tax_amount: parseFloat(v) || 0 })}
                    />
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-3">
                    <button
                        onClick={() => onConfirm(editedData)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100"
                    >
                        <Check className="w-5 h-5" />
                        Confirmar y Registrar Gasto
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full bg-white hover:bg-gray-50 text-gray-400 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-gray-200 transition-all"
                    >
                        <X className="w-5 h-5" />
                        Cancelar Revisión
                    </button>
                </div>
            </div>
        </div>
    );
}

function ValidationField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-blue-500 uppercase tracking-widest">Sugerido por IA</span>
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </div>
            </div>
        </div>
    );
}
