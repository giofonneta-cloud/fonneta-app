import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { documentNumber, password, contactName, contactEmail } = await request.json();

    if (!documentNumber || !password || !contactEmail) {
      return NextResponse.json({ error: 'documentNumber, password y contactEmail son requeridos' }, { status: 400 });
    }

    const authEmail = contactEmail.trim().toLowerCase();

    // Usar admin API: sin rate limit de cliente, sin email de confirmación
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true, // pre-confirmado, no envía email a la dirección sintética
      user_metadata: {
        full_name: contactName || '',
        role: 'proveedor',
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ userId: data.user.id, authEmail });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('Error creating provider auth user:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
