import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { purchaseOrderId } = body as { purchaseOrderId?: string };

    if (!purchaseOrderId) {
      return NextResponse.json({ error: 'purchaseOrderId es requerido' }, { status: 400 });
    }

    // Verificar que el usuario es un proveedor y que la OC le pertenece
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 403 });
    }

    // Verificar que la OC pertenece a este proveedor y está en estado 'enviada'
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, status, provider_id')
      .eq('id', purchaseOrderId)
      .eq('provider_id', provider.id)
      .single();

    if (poError || !po) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    if (po.status !== 'enviada') {
      return NextResponse.json(
        { error: `No se puede aceptar una OC en estado: ${po.status}` },
        { status: 409 }
      );
    }

    // Actualizar status a 'aceptada'
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ status: 'aceptada', updated_at: new Date().toISOString() })
      .eq('id', purchaseOrderId);

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar la orden de compra' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error accepting purchase order:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
