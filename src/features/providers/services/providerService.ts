import { supabase } from '@/shared/lib/supabase';
import { Provider, ProviderDocument, CreateProviderInput } from '../types/provider.types';

export const providerService = {
    async createProvider(input: CreateProviderInput) {
        const { data, error } = await supabase
            .from('providers')
            .insert([{
                business_name: input.business_name,
                user_id: input.user_id || null,
                contact_name: input.contact_name || null,
                contact_email: input.contact_email || null,
                contact_phone: input.contact_phone || null,
                is_client: input.is_client ?? false,
                is_provider: input.is_provider ?? true,
                is_active: true,
                person_type: input.person_type || null,
                document_type: input.document_type || null,
                document_number: input.document_number || null,
                billing_email: input.billing_email || null,
                address: input.address || null,
                city: input.city || null,
                department: input.department || null,
                country: input.country || 'Colombia',
                onboarding_status: input.onboarding_status || 'EN REVISION',
                onboarding_notes: input.onboarding_notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Provider;
    },

    async getProviders() {
        const { data, error } = await supabase
            .from('providers')
            .select('*')
            .order('business_name');

        if (error) throw error;
        return data as Provider[];
    },

    async getClients() {
        const { data, error } = await supabase
            .from('providers')
            .select('*')
            .eq('is_client', true)
            .order('business_name');

        if (error) throw error;
        return data as Provider[];
    },

    async getProviderByUserId(userId: string) {
        const { data, error } = await supabase
            .from('providers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data as Provider;
    },

    async updateProvider(id: string, input: Partial<CreateProviderInput>) {
        const { data, error } = await supabase
            .from('providers')
            .update({
                ...input,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Provider;
    },

    async deleteProvider(id: string) {
        const { error } = await supabase
            .from('providers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    async uploadDocument(providerId: string, type: string, file: File) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('providerId', providerId);
            formData.append('type', type);

            const response = await fetch('/api/upload/provider-document', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al subir el documento');
            }

            const result = await response.json();
            return result.document as ProviderDocument;
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },

    async getProviderDocuments(providerId: string) {
        const { data, error } = await supabase
            .from('provider_documents')
            .select('*')
            .eq('provider_id', providerId);

        if (error) throw error;
        return data as ProviderDocument[];
    }
};
