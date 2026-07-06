import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, providerId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Si existe providerId, eliminar el proveedor de la tabla providers
    if (providerId) {
      const { error: providerError } = await supabaseAdmin
        .from('providers')
        .delete()
        .eq('id', providerId);
      
      if (providerError) {
        console.error('Error in rollback for provider record:', providerError.message);
      } else {
        console.log(`Rollback: Deleted provider record ${providerId}`);
      }
    }

    // 2. Eliminar el perfil de la tabla profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error in rollback for profile record:', profileError.message);
    } else {
      console.log(`Rollback: Deleted profile record ${userId}`);
    }

    // 3. Eliminar el usuario en Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`Rollback completed successfully for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('Error in rollback endpoint:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
