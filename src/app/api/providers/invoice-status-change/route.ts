import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/shared/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, providerId, invoiceNumber, radicadoNumber, newStatus, adminNotes } = body;

    if (!invoiceId || !providerId) {
      return NextResponse.json(
        { error: 'invoiceId y providerId son requeridos' },
        { status: 400 }
      );
    }

    // Get provider email
    const { data: provider } = await supabase
      .from('providers')
      .select('contact_email, user_id, business_name')
      .eq('id', providerId)
      .single();

    if (!provider?.contact_email) {
      console.warn(`Provider ${providerId} no tiene email de contacto`);
      return NextResponse.json({ success: true, message: 'Sin email para notificar' });
    }

    // Get user to send proper notifications
    if (provider.user_id) {
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', provider.user_id)
        .single();

      if (user?.email) {
        // Send email notification via API (this is just logging it - no actual email service configured)
        console.log(`Email notification would be sent to ${user.email}:`, {
          invoiceNumber,
          radicadoNumber,
          newStatus,
          adminNotes
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación procesada'
    });

  } catch (error) {
    console.error('Error en invoice-status-change:', error);
    return NextResponse.json(
      { error: 'Error al procesar notificación' },
      { status: 500 }
    );
  }
}
