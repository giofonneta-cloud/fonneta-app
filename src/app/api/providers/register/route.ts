import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDriveService } from '@/lib/google-drive/driveService';
import { getClientIp, jsonError, tooManyRequests, withinRateLimit } from '@/lib/auth/guard';
import {
  ALLOWED_DOCUMENT_MIMES,
  EXTENSION_BY_MIME,
  MAX_DOCUMENT_BYTES,
  MIN_PASSWORD_LENGTH,
  TERMS_VERSION,
  detectMime,
  registrationSchema,
  type AllowedDocumentMime,
  type RegistrationInput,
} from '@/lib/providers/registrationSchema';
import { syncProviderDocuments, type ProviderDocumentUrls } from '@/lib/providers/syncProviderDocuments';

export const maxDuration = 60;

type DocumentType = 'RUT' | 'Cedula_Rep_Legal' | 'Camara_Comercio' | 'Cert_Bancaria';

interface DocumentSpec {
  type: DocumentType;
  urlKey: keyof ProviderDocumentUrls;
  label: string;
  required: (personType: RegistrationInput['person_type']) => boolean;
}

const DOCUMENT_SPECS: DocumentSpec[] = [
  { type: 'RUT', urlKey: 'rut_url', label: 'RUT', required: () => true },
  { type: 'Cedula_Rep_Legal', urlKey: 'cedula_url', label: 'Cédula del Representante Legal', required: () => true },
  { type: 'Camara_Comercio', urlKey: 'camara_comercio_url', label: 'Cámara de Comercio', required: (p) => p === 'juridica' },
  { type: 'Cert_Bancaria', urlKey: 'cert_bancaria_url', label: 'Certificación Bancaria', required: () => false },
];

interface PreparedDocument {
  spec: DocumentSpec;
  buffer: Buffer;
  mime: AllowedDocumentMime;
}

const FIELD_MESSAGES: Record<string, string> = {
  password: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  contact_email: 'El correo de contacto no es válido.',
  billing_email: 'El correo de facturación no es válido.',
  contact_phone: 'El teléfono de contacto no es válido.',
  document_number: 'El número de documento / NIT no es válido.',
  terms_accepted: 'Debes aceptar los Términos de uso y la Política de Tratamiento de Datos Personales.',
};

async function prepareDocuments(
  form: FormData,
  personType: RegistrationInput['person_type']
): Promise<{ ok: true; docs: PreparedDocument[] } | { ok: false; error: string }> {
  const docs: PreparedDocument[] = [];

  for (const spec of DOCUMENT_SPECS) {
    const entry = form.get(spec.type);
    const hasFile = entry instanceof File && entry.size > 0;

    if (!hasFile) {
      if (spec.required(personType)) return { ok: false, error: `${spec.label} es obligatorio.` };
      continue;
    }

    if (entry.size > MAX_DOCUMENT_BYTES) {
      return { ok: false, error: `${spec.label}: el archivo excede el tamaño máximo de 10MB.` };
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    const mime = detectMime(buffer);
    if (!mime || !ALLOWED_DOCUMENT_MIMES.includes(mime)) {
      return { ok: false, error: `${spec.label}: solo se permiten archivos PDF, PNG o JPG.` };
    }
    docs.push({ spec, buffer, mime });
  }

  return { ok: true, docs };
}

async function rollbackRegistration(admin: SupabaseClient, userId: string | null, providerId: string | null): Promise<void> {
  try {
    if (providerId) {
      await admin.from('provider_documents').delete().eq('provider_id', providerId);
      await admin.from('providers').delete().eq('id', providerId);
    }
    if (userId) {
      await admin.from('profiles').delete().eq('id', userId);
      await admin.auth.admin.deleteUser(userId);
    }
  } catch (err) {
    console.error('[register] rollback failed:', err instanceof Error ? err.message : 'unknown');
  }
}

function mapDatabaseError(message: string): string | null {
  if (message.includes('business_name')) {
    return 'Ya existe una empresa registrada con esta Razón Social. Por favor verifica o contacta a soporte.';
  }
  if (message.includes('document_number')) {
    return 'Ya existe una empresa registrada con este Número de Documento / NIT.';
  }
  return null;
}

/**
 * Registro público de proveedor/cliente. Es el ÚNICO endpoint anónimo de escritura:
 * crea usuario, perfil (rol fijo `proveedor`), registro de proveedor y documentos en el
 * servidor, con límite de peticiones, validación estricta y rollback completo.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await withinRateLimit(`register:ip:${getClientIp(request)}`, 5, 3600))) return tooManyRequests();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, 'Solicitud inválida.');
  }

  const raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === 'string'));
  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? '');
    return jsonError(400, FIELD_MESSAGES[field] ?? 'Revisa los datos ingresados e inténtalo de nuevo.');
  }
  const input = parsed.data;

  const prepared = await prepareDocuments(form, input.person_type);
  if (!prepared.ok) return jsonError(400, prepared.error);

  const documentKey = input.document_number.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  if (!(await withinRateLimit(`register:doc:${documentKey}`, 3, 3600))) return tooManyRequests();

  const admin = createAdminClient();
  let userId: string | null = null;
  let providerId: string | null = null;

  try {
    const { data: existing } = await admin
      .from('providers')
      .select('id')
      .eq('document_number', input.document_number)
      .maybeSingle();
    if (existing) return jsonError(409, 'Ya existe una empresa registrada con este Número de Documento / NIT.');

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: input.contact_email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.contact_name, role: 'proveedor' },
    });
    if (createError || !created.user) {
      if (/already|registered|exists/i.test(createError?.message ?? '')) {
        return jsonError(
          409,
          `El correo electrónico ingresado (${input.contact_email}) ya está registrado en el sistema. Si intentaste registrarte antes y no completaste el proceso, contacta a administrativo@fonneta.com.`
        );
      }
      console.error('[register] createUser failed:', createError?.message);
      return jsonError(500, 'No se pudo completar el registro. Inténtalo de nuevo.');
    }
    userId = created.user.id;

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        { id: userId, email: input.contact_email, full_name: input.contact_name, role: 'proveedor' },
        { onConflict: 'id' }
      );
    if (profileError) throw new Error(`profile: ${profileError.message}`);

    const { data: provider, error: providerError } = await admin
      .from('providers')
      .insert({
        user_id: userId,
        business_name: input.business_name,
        person_type: input.person_type,
        document_type: input.document_type,
        document_number: input.document_number,
        contact_name: input.contact_name,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone,
        billing_email: input.billing_email,
        address: input.address,
        city: input.city || null,
        department: input.department || null,
        country: input.country,
        is_provider: true,
        is_client: false,
        is_active: true,
        onboarding_status: 'EN REVISION',
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
      })
      .select('id')
      .single();
    if (providerError || !provider) {
      const friendly = mapDatabaseError(providerError?.message ?? '');
      await rollbackRegistration(admin, userId, null);
      userId = null;
      return friendly ? jsonError(409, friendly) : jsonError(500, 'No se pudo completar el registro. Inténtalo de nuevo.');
    }
    providerId = provider.id as string;

    const drive = getDriveService();
    const folders = await drive.getOrCreateProviderFolders(providerId, input.business_name, input.document_number);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urls: ProviderDocumentUrls = {};

    for (const doc of prepared.docs) {
      const fileName = `${doc.spec.type}_${stamp}.${EXTENSION_BY_MIME[doc.mime]}`;
      const uploaded = await drive.uploadFile(doc.buffer, fileName, doc.mime, folders.documentsFolder);
      urls[doc.spec.urlKey] = uploaded.webViewLink;
    }

    const { error: updateError } = await admin
      .from('providers')
      .update({ ...urls, updated_at: new Date().toISOString() })
      .eq('id', providerId);
    if (updateError) throw new Error(`provider docs: ${updateError.message}`);

    await syncProviderDocuments(admin, providerId, urls);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[register] failed:', err instanceof Error ? err.message : 'unknown');
    await rollbackRegistration(admin, userId, providerId);
    return jsonError(500, 'No se pudo completar el registro. Inténtalo de nuevo.');
  }
}
