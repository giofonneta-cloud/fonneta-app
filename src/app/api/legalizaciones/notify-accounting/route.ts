export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authPermissionService } from '@/features/auth/services/authPermissionService';
import { getEmailService } from '@/lib/email/emailService';
import { buildAccountingEmail } from '@/lib/email-templates/legalizacion-accounting';
import type { CausedExpense } from '@/lib/email-templates/legalizacion-accounting';
import type { Legalizacion, LegalizacionItem } from '@/features/legalizaciones/types/legalizacion.types';

const ACCOUNTING_EMAIL = 'contabilidad@fonneta.com';
const MAX_PDF_SIZE = 5 * 1024 * 1024;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fonneta-app.vercel.app';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const canNotify = await authPermissionService.hasPermission(user.id, 'legalizaciones.approve');
    if (!canNotify) {
      return NextResponse.json({ error: 'No tienes permiso para notificar a contabilidad' }, { status: 403 });
    }

    const formData = await request.formData();
    const legalizacionId = formData.get('legalizacionId');
    const pdfFile = formData.get('pdfFile');
    const resend = formData.get('resend') === 'true';

    if (typeof legalizacionId !== 'string' || !legalizacionId) {
      return NextResponse.json({ error: 'legalizacionId es requerido' }, { status: 400 });
    }
    if (!(pdfFile instanceof File) || pdfFile.size === 0 || pdfFile.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'El PDF de la legalización es requerido (máx. 5MB)' }, { status: 400 });
    }
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    if (pdfBuffer.subarray(0, 4).toString('latin1') !== '%PDF') {
      return NextResponse.json({ error: 'El archivo adjunto no es un PDF válido' }, { status: 400 });
    }

    // Se lee con service role: el correo debe llevar los datos completos sin depender de la RLS de quien aprueba.
    const admin = createAdminClient();
    const { data: leg, error: legError } = await admin
      .from('legalizaciones')
      .select('*')
      .eq('id', legalizacionId)
      .single();
    if (legError || !leg) {
      return NextResponse.json({ error: 'Legalización no encontrada' }, { status: 404 });
    }
    if (leg.status !== 'aprobada' && leg.status !== 'cerrada') {
      return NextResponse.json({ error: 'Solo se notifica a contabilidad cuando la legalización está aprobada' }, { status: 409 });
    }

    // Reserva atómica del primer envío: evita correos duplicados si se dispara dos veces a la vez.
    const claimedAt = new Date().toISOString();
    if (!resend) {
      const { count } = await admin
        .from('legalizaciones')
        .update({ contabilidad_notificada_at: claimedAt }, { count: 'exact' })
        .eq('id', legalizacionId)
        .is('contabilidad_notificada_at', null);
      if (!count) {
        return NextResponse.json({ error: 'Contabilidad ya fue notificada de esta legalización' }, { status: 409 });
      }
    }

    const [{ data: items }, { data: gastos }] = await Promise.all([
      admin.from('legalizacion_items').select('*').eq('legalizacion_id', legalizacionId).order('order_index'),
      admin
        .from('gastos')
        .select('total_con_iva, estado_pago, categoria, numero_factura_proveedor')
        .eq('legalizacion_id', legalizacionId),
    ]);

    const email = buildAccountingEmail({
      legalizacion: leg as Legalizacion,
      items: (items ?? []) as LegalizacionItem[],
      gastos: (gastos ?? []) as CausedExpense[],
      appUrl: APP_URL,
    });

    try {
      await getEmailService().sendEmail({
        to: ACCOUNTING_EMAIL,
        cc: process.env.ADMIN_EMAIL || 'giofonneta@gmail.com',
        replyTo: 'administrativo@fonneta.com',
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: [{ filename: `Legalizacion_${leg.numero}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
      });
    } catch (sendError) {
      if (!resend) {
        await admin.from('legalizaciones').update({ contabilidad_notificada_at: null }).eq('id', legalizacionId);
      }
      console.error('[legalizacion-accounting] Error enviando correo', sendError);
      return NextResponse.json({ error: 'No se pudo enviar el correo a contabilidad' }, { status: 500 });
    }

    if (resend) {
      await admin.from('legalizaciones').update({ contabilidad_notificada_at: claimedAt }).eq('id', legalizacionId);
    }

    return NextResponse.json({ success: true, notifiedAt: claimedAt });
  } catch (error) {
    console.error('[legalizacion-accounting] Error', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
