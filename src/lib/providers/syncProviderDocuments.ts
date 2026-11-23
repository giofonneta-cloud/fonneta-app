import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProviderDocumentUrls {
  rut_url?: string | null;
  cedula_url?: string | null;
  camara_comercio_url?: string | null;
  cert_bancaria_url?: string | null;
}

const DOCUMENT_TYPE_BY_FIELD: Record<keyof ProviderDocumentUrls, string> = {
  rut_url: 'RUT',
  cedula_url: 'Cedula_Rep_Legal',
  camara_comercio_url: 'Camara_Comercio',
  cert_bancaria_url: 'Cert_Bancaria',
};

/**
 * Sincroniza la tabla relacional provider_documents con las URLs de documentos
 * del proveedor: reemplaza los registros previos del mismo tipo.
 */
export async function syncProviderDocuments(
  admin: SupabaseClient,
  providerId: string,
  urls: ProviderDocumentUrls
): Promise<void> {
  const now = new Date().toISOString();
  const rows = (Object.keys(DOCUMENT_TYPE_BY_FIELD) as (keyof ProviderDocumentUrls)[])
    .filter((field) => Boolean(urls[field]))
    .map((field) => ({
      provider_id: providerId,
      tipo_documento: DOCUMENT_TYPE_BY_FIELD[field],
      archivo_url: urls[field] as string,
      estado: 'en_revision',
      created_at: now,
      updated_at: now,
    }));

  if (rows.length === 0) return;

  const { error: deleteError } = await admin
    .from('provider_documents')
    .delete()
    .eq('provider_id', providerId)
    .in('tipo_documento', rows.map((row) => row.tipo_documento));
  if (deleteError) console.error('[sync-docs] delete error:', deleteError.message);

  const { error: insertError } = await admin.from('provider_documents').insert(rows);
  if (insertError) console.error('[sync-docs] insert error:', insertError.message);
}
