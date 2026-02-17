import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar variables de entorno ANTES de procesar
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL env variable');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta: SUPABASE_URL faltante. Contacte al administrador.' },
        { status: 500 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY env variable');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta: SERVICE_ROLE_KEY faltante. Contacte al administrador.' },
        { status: 500 }
      );
    }

    // Create Supabase client with SERVICE ROLE key (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId, email, fullName, role } = await request.json();

    // Validate inputs
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // No verificamos si el usuario existe en auth - confiamos en el ID
    // que viene del signUp que acabamos de hacer. El upsert maneja
    // cualquier conflicto automáticamente.

    // Create profile using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName || '',
        role: role || 'usuario',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
