import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/email/emailService';
import { createClient } from '@/lib/supabase/server';

interface NotificationRequest {
  invoiceId: string;
  providerId: string;
  invoiceNumber: string;
  radicadoNumber: string;
  invoiceType: 'factura' | 'cuenta_cobro';
  amount: number;
  concept: string;
  documents: {
    name: string;
    uploaded: boolean;
  }[];
}

/**
 * API Route para enviar notificaciones de factura radicada
 * Se llama DESPUÉS de crear exitosamente la factura con todos sus documentos
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener datos de la solicitud
    const body: NotificationRequest = await request.json();
    const {
      providerId,
      invoiceNumber,
      radicadoNumber,
      invoiceType,
      amount,
      concept,
      documents
    } = body;

    if (!providerId || !invoiceNumber || !radicadoNumber) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // 3. Obtener información del proveedor
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('business_name, contact_email')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // 4. Enviar notificaciones
    const emailService = getEmailService();

    // 4a. Notificar al proveedor
    if (provider.contact_email) {
      await emailService.sendProviderInvoiceReceived(
        provider.contact_email,
        provider.business_name,
        invoiceNumber,
        radicadoNumber,
        invoiceType,
        amount,
        concept,
        documents
      );
    }

    // 4b. Notificar al admin
    await emailService.sendAdminInvoiceReview(
      provider.business_name,
      invoiceNumber,
      radicadoNumber,
      invoiceType,
      amount,
      concept,
      documents
    );

    return NextResponse.json({
      success: true,
      message: 'Notificaciones enviadas correctamente'
    });

  } catch (error) {
    console.error('Error sending invoice notifications:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificaciones' },
      { status: 500 }
    );
  }
}
