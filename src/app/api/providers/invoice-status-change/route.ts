import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/email/emailService';
import { createClient } from '@/lib/supabase/server';

interface StatusChangeRequest {
    invoiceId: string;
    providerId: string;
    invoiceNumber: string;
    radicadoNumber: string;
    newStatus: string;
    adminNotes?: string;
}

const STATUS_LABELS: Record<string, string> = {
    'pendiente': 'Pendiente',
    'en_revision': 'En Revisión',
    'aprobado': 'Aprobado',
    'pagado': 'Pagado',
    'rechazado': 'Rechazado',
    'devuelto': 'Devuelto'
};

/**
 * API Route para enviar notificaciones cuando el admin cambia el estado de una factura
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

        // 2. Verificar que sea admin/administrativo
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'pm', 'administrativo'].includes(profile.role)) {
            return NextResponse.json(
                { error: 'Sin permisos para esta acción' },
                { status: 403 }
            );
        }

        // 3. Obtener datos de la solicitud
        const body: StatusChangeRequest = await request.json();
        const {
            providerId,
            invoiceNumber,
            radicadoNumber,
            newStatus,
            adminNotes
        } = body;

        if (!providerId || !invoiceNumber || !newStatus) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos' },
                { status: 400 }
            );
        }

        // 4. Obtener información del proveedor
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

        // 5. Enviar notificación al proveedor si tiene email
        if (provider.contact_email) {
            const emailService = getEmailService();
            await emailService.sendProviderInvoiceStatusChange(
                provider.contact_email,
                provider.business_name,
                invoiceNumber,
                radicadoNumber || 'N/A',
                STATUS_LABELS[newStatus] || newStatus,
                adminNotes
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Notificación enviada correctamente'
        });

    } catch (error) {
        console.error('Error sending status change notification:', error);
        return NextResponse.json(
            { error: 'Error al enviar notificación' },
            { status: 500 }
        );
    }
}
