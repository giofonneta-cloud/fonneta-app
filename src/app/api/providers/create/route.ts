import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: NextRequest) {
  try {
    const { providerId, rut_url, cedula_url, camara_comercio_url, cert_bancaria_url } = await request.json();

    if (!providerId) {
      return NextResponse.json({ error: 'providerId es requerido' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('providers')
      .update({
        ...(rut_url !== undefined && { rut_url }),
        ...(cedula_url !== undefined && { cedula_url }),
        ...(camara_comercio_url !== undefined && { camara_comercio_url }),
        ...(cert_bancaria_url !== undefined && { cert_bancaria_url }),
      })
      .eq('id', providerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('Error updating provider documents:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();

    if (!input.business_name || !input.user_id) {
      return NextResponse.json(
        { error: 'business_name y user_id son requeridos' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('providers')
      .insert([{
        business_name: input.business_name,
        user_id: input.user_id,
        contact_name: input.contact_name ?? null,
        contact_email: input.contact_email ?? null,
        contact_phone: input.contact_phone ?? null,
        is_client: input.is_client ?? false,
        is_provider: input.is_provider ?? true,
        is_active: true,
        person_type: input.person_type ?? null,
        document_type: input.document_type ?? null,
        document_number: input.document_number ?? null,
        billing_email: input.billing_email ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        department: input.department ?? null,
        country: input.country ?? 'Colombia',
        onboarding_status: input.onboarding_status ?? 'EN REVISION',
        onboarding_notes: input.onboarding_notes ?? null,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('Error creating provider:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
