import { supabase } from '@/shared/lib/supabase';
import type { ReleaseDocument, CreateReleaseDocumentInput } from '../types/release-document.types';

export const releaseDocumentService = {
    async getByPurchaseOrderId(purchaseOrderId: string): Promise<ReleaseDocument[]> {
        const { data, error } = await supabase
            .from('release_documents')
            .select('*')
            .eq('purchase_order_id', purchaseOrderId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []) as ReleaseDocument[];
    },

    async create(input: CreateReleaseDocumentInput): Promise<ReleaseDocument> {
        const { data, error } = await supabase
            .from('release_documents')
            .insert({ ...input, status: 'pendiente_firma' })
            .select()
            .single();

        if (error) throw error;
        return data as ReleaseDocument;
    },

    async markAsSent(id: string, documentUrl?: string): Promise<void> {
        const { error } = await supabase
            .from('release_documents')
            .update({
                ...(documentUrl ? { document_url: documentUrl } : {}),
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    },

    async markAsSigned(id: string, signedDocumentUrl: string): Promise<void> {
        const { error } = await supabase
            .from('release_documents')
            .update({
                status: 'firmado',
                signed_document_url: signedDocumentUrl,
                signed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteReleaseDocument(id: string): Promise<void> {
        const { error } = await supabase.from('release_documents').delete().eq('id', id);
        if (error) throw error;
    },
};
