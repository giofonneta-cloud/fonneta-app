export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailService } from '@/lib/email/emailService';

type ReminderTipo = 'previo_5d' | 'vencimiento' | 'vencida_8d';

// Fecha "hoy" en zona horaria de Colombia (UTC-5), como YYYY-MM-DD.
function hoyBogota(): string {
  const bogota = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return bogota.toISOString().split('T')[0];
}

// Diferencia en días entre fecha_cobro y hoy (positivo = faltan días, negativo = vencida).
function diasHasta(fechaCobro: string, hoy: string): number {
  const a = new Date(fechaCobro + 'T12:00:00Z').getTime();
  const b = new Date(hoy + 'T12:00:00Z').getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

// Decide si hoy corresponde enviar recordatorio y de qué tipo.
function evaluarRecordatorio(dias: number): { tipo: ReminderTipo; diasRelativos: number } | null {
  if (dias === 5) return { tipo: 'previo_5d', diasRelativos: -5 };
  if (dias === 0) return { tipo: 'vencimiento', diasRelativos: 0 };
  if (dias < 0 && Math.abs(dias) % 8 === 0) return { tipo: 'vencida_8d', diasRelativos: Math.abs(dias) };
  return null;
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // 1. Cron de Vercel (envía Authorization: Bearer <CRON_SECRET> si está configurado)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${cronSecret}`) return true;
  }
  // 2. Usuario autenticado (disparo manual desde la app)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handle(request);
}

// Vercel Cron invoca por GET.
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handle(request);
}

async function handle(request: NextRequest): Promise<NextResponse> {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Modo prueba (por defecto ACTIVO): envía todo a un solo correo de prueba.
    const testMode = process.env.CXC_REMINDERS_TEST_MODE !== 'false';
    const testEmail = process.env.CXC_REMINDERS_TEST_EMAIL || 'giofonneta@gmail.com';

    const admin = createAdminClient();
    const hoy = hoyBogota();

    // Facturas de venta pendientes de cobro con fecha estimada.
    const { data: ventas, error } = await admin
      .from('ventas')
      .select(`
        id, numero_factura, fecha_cobro_estimada, total_con_iva, valor_pagado, estado_pago, nota_credito,
        line_of_business, numero_oc,
        cliente:providers(business_name, billing_email, contact_email),
        proyecto:projects(name)
      `)
      .neq('estado_pago', 'pagado')
      .not('fecha_cobro_estimada', 'is', null);

    if (error) {
      console.error('[cxc-reminders] Error querying ventas', error);
      return NextResponse.json({ error: 'Error consultando cuentas por cobrar' }, { status: 500 });
    }

    const resumen = { checked: 0, sent: 0, skipped: 0, sinEmail: 0, yaEnviado: 0, errores: 0, testMode };

    for (const v of ventas ?? []) {
      const row = v as Record<string, unknown>;
      if (row.nota_credito === true) continue;
      const fechaCobro = row.fecha_cobro_estimada as string | null;
      if (!fechaCobro) continue;

      resumen.checked++;

      const dias = diasHasta(fechaCobro, hoy);
      const evalRes = evaluarRecordatorio(dias);
      if (!evalRes) { resumen.skipped++; continue; }

      // Dedup: ¿ya se envió este recordatorio (mismo día relativo) para esta venta?
      const { data: existing } = await admin
        .from('cxc_reminders')
        .select('id')
        .eq('venta_id', row.id as string)
        .eq('dias_relativos', evalRes.diasRelativos)
        .eq('test_mode', testMode)
        .maybeSingle();
      if (existing) { resumen.yaEnviado++; continue; }

      const cliente = row.cliente as { business_name?: string; billing_email?: string | null; contact_email?: string | null } | null;
      const proyecto = row.proyecto as { name?: string } | null;
      const realEmail = cliente?.billing_email || cliente?.contact_email || null;
      const destinatario = testMode ? testEmail : realEmail;

      if (!destinatario) { resumen.sinEmail++; continue; }

      const saldo = Number(row.total_con_iva || 0) - Number(row.valor_pagado || 0);

      try {
        await getEmailService().sendCxcPaymentReminder({
          recipientEmail: destinatario,
          recipientName: cliente?.business_name || 'Cliente',
          invoiceNumber: (row.numero_factura as string) || 'N/A',
          projectName: proyecto?.name,
          descripcion: (row.line_of_business as string) || undefined,
          numeroOc: (row.numero_oc as string) || undefined,
          saldo,
          fechaCobro,
          tipo: evalRes.tipo,
          diasVencida: evalRes.tipo === 'vencida_8d' ? evalRes.diasRelativos : undefined,
        });

        await admin.from('cxc_reminders').insert({
          venta_id: row.id as string,
          tipo: evalRes.tipo,
          dias_relativos: evalRes.diasRelativos,
          recipient_email: destinatario,
          test_mode: testMode,
        });

        resumen.sent++;
      } catch (sendErr) {
        console.error('[cxc-reminders] Error enviando recordatorio', { ventaId: row.id, error: sendErr });
        resumen.errores++;
      }
    }

    console.log('[cxc-reminders] Resumen', resumen);
    return NextResponse.json({ success: true, ...resumen });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[cxc-reminders] Unhandled error', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
