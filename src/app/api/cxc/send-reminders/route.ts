export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailService } from '@/lib/email/emailService';

type ReminderTipo = 'previo_5d' | 'vencimiento' | 'vencida_8d';

interface VentaRow {
  id: string;
  cliente_id: string | null;
  numero_factura: string | null;
  fecha_cobro_estimada: string | null;
  total_con_iva: number;
  valor_pagado: number | null;
  estado_pago: string;
  nota_credito: boolean | null;
  line_of_business: string | null;
  numero_oc: string | null;
  cliente: { business_name?: string; billing_email?: string | null; contact_email?: string | null } | null;
  proyecto: { name?: string } | null;
}

interface FacturaGrupo {
  key: string;
  ventaIds: string[];
  numeroFactura: string;
  fechaCobro: string;
  cliente: VentaRow['cliente'];
  saldo: number;
  proyectoNombre?: string;
  descripcion?: string;
  numeroOc?: string;
}

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

// Días transcurridos entre dos fechas YYYY-MM-DD (a - b).
function diasEntre(a: string, b: string): number {
  return Math.round((new Date(a + 'T12:00:00Z').getTime() - new Date(b + 'T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24));
}

// Une valores distintos y no vacíos con ", " (para descripción/OC cuando la
// factura está dividida en varios ítems con datos distintos).
function unirDistintos(valores: (string | null | undefined)[]): string | undefined {
  const set = Array.from(new Set(valores.filter((v): v is string => !!v && v.trim() !== '')));
  return set.length > 0 ? set.join(', ') : undefined;
}

// El job corre SOLO los lunes (ver vercel.json). Cada corrida revisa todas
// las facturas pendientes y clasifica en 3 ventanas semanales, sin huecos
// entre ellas (todo valor entero de `dias` cae en exactamente una):
//   dias en (0, 7]    -> previo_5d   ("próxima a vencer esta semana")
//   dias en (-7, 0]   -> vencimiento ("vence hoy / venció esta semana")
//   dias <= -7        -> vencida_8d  ("en mora", se reenvía cada semana)
// Nota: los nombres internos ('previo_5d', 'vencida_8d') se mantienen tal
// cual están en la base de datos (CHECK constraint) aunque ya no reflejen
// literalmente "5 días" / "8 días" — ahora son códigos, no descripciones.
const CADENCIA_MORA_DIAS = 7; // re-enviar aviso de mora cada semana (el job solo corre los lunes)
const VENTANA_PREVIA_DIAS = 7; // avisar con hasta una semana de anticipación

function evaluarRecordatorio(dias: number): { tipo: ReminderTipo; diasRelativos: number } | null {
  if (dias > 0 && dias <= VENTANA_PREVIA_DIAS) return { tipo: 'previo_5d', diasRelativos: dias };
  if (dias <= 0 && dias > -CADENCIA_MORA_DIAS) return { tipo: 'vencimiento', diasRelativos: dias };
  if (dias <= -CADENCIA_MORA_DIAS) return { tipo: 'vencida_8d', diasRelativos: dias };
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

// Agrupa filas de ventas que en realidad son UNA sola factura para el
// cliente, dividida internamente por centro de costo o producto. Se agrupan
// por (cliente, número de factura); las filas sin número de factura quedan
// como su propio grupo (no hay con qué agruparlas).
function agruparPorFactura(rows: VentaRow[]): FacturaGrupo[] {
  const grupos = new Map<string, VentaRow[]>();
  for (const row of rows) {
    const numero = row.numero_factura?.trim();
    const key = numero ? `${row.cliente_id ?? 'sin-cliente'}::${numero}` : `venta::${row.id}`;
    const arr = grupos.get(key);
    if (arr) arr.push(row);
    else grupos.set(key, [row]);
  }

  return Array.from(grupos.entries()).map(([key, rows]) => ({
    key,
    ventaIds: rows.map(r => r.id),
    numeroFactura: rows[0].numero_factura || 'N/A',
    fechaCobro: rows[0].fecha_cobro_estimada as string,
    cliente: rows[0].cliente,
    saldo: rows.reduce((acc, r) => acc + (Number(r.total_con_iva) || 0) - (Number(r.valor_pagado) || 0), 0),
    proyectoNombre: unirDistintos(rows.map(r => r.proyecto?.name)),
    descripcion: unirDistintos(rows.map(r => r.line_of_business)),
    numeroOc: unirDistintos(rows.map(r => r.numero_oc)),
  }));
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
        id, cliente_id, numero_factura, fecha_cobro_estimada, total_con_iva, valor_pagado, estado_pago, nota_credito,
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

    const rows = ((ventas ?? []) as unknown as VentaRow[]).filter(r => r.nota_credito !== true && !!r.fecha_cobro_estimada);
    const grupos = agruparPorFactura(rows);

    const resumen = {
      checked: 0, // facturas (agrupadas) revisadas
      itemsConsolidados: 0, // ítems adicionales fusionados en un solo correo (facturas divididas por centro de costo/producto)
      sent: 0, skipped: 0, sinEmail: 0, yaEnviado: 0, errores: 0, testMode,
    };

    for (const grupo of grupos) {
      resumen.checked++;
      if (grupo.ventaIds.length > 1) resumen.itemsConsolidados += grupo.ventaIds.length - 1;

      const dias = diasHasta(grupo.fechaCobro, hoy);
      const evalRes = evaluarRecordatorio(dias);
      if (!evalRes) { resumen.skipped++; continue; }

      // ¿Debe enviarse hoy? (se revisa contra CUALQUIER ítem de la factura)
      if (evalRes.tipo === 'vencida_8d') {
        // Recordatorio semanal: enviar si nunca se ha mandado aviso de mora,
        // o si ya pasó una semana (>= 7 días) desde el último.
        const { data: last } = await admin
          .from('cxc_seguimiento')
          .select('fecha')
          .in('venta_id', grupo.ventaIds)
          .eq('es_automatico', true)
          .eq('recordatorio_tipo', 'vencida_8d')
          .eq('test_mode', testMode)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (last && diasEntre(hoy, last.fecha as string) < CADENCIA_MORA_DIAS) {
          resumen.yaEnviado++;
          continue;
        }
      } else {
        // previo_5d / vencimiento: se envían una sola vez por factura.
        const { data: existing } = await admin
          .from('cxc_seguimiento')
          .select('id')
          .in('venta_id', grupo.ventaIds)
          .eq('es_automatico', true)
          .eq('recordatorio_tipo', evalRes.tipo)
          .eq('test_mode', testMode)
          .maybeSingle();
        if (existing) { resumen.yaEnviado++; continue; }
      }

      const realEmail = grupo.cliente?.billing_email || grupo.cliente?.contact_email || null;
      const destinatario = testMode ? testEmail : realEmail;

      if (!destinatario) { resumen.sinEmail++; continue; }

      try {
        // Un solo correo por factura, con el saldo total sumado de todos sus ítems.
        await getEmailService().sendCxcPaymentReminder({
          recipientEmail: destinatario,
          recipientName: grupo.cliente?.business_name || 'Cliente',
          invoiceNumber: grupo.numeroFactura,
          projectName: grupo.proyectoNombre,
          descripcion: grupo.descripcion,
          numeroOc: grupo.numeroOc,
          saldo: grupo.saldo,
          fechaCobro: grupo.fechaCobro,
          tipo: evalRes.tipo,
          diasRelativos: evalRes.diasRelativos,
        });

        const tipoLabel = evalRes.tipo === 'previo_5d'
          ? 'Aviso previo (próxima a vencer)'
          : evalRes.tipo === 'vencimiento'
            ? 'Aviso de vencimiento'
            : 'Recordatorio de mora (semanal)';

        const descripcionLog = grupo.ventaIds.length > 1
          ? `${tipoLabel} enviado por correo a ${destinatario} (factura consolidada, ${grupo.ventaIds.length} ítems)`
          : `${tipoLabel} enviado por correo a ${destinatario}`;

        // Se registra en CADA ítem de la factura para que el seguimiento y la
        // deduplicación queden completos en todas las filas de la tabla CXC.
        await admin.from('cxc_seguimiento').insert(
          grupo.ventaIds.map(ventaId => ({
            venta_id: ventaId,
            tipo: 'correo_recordatorio' as const,
            descripcion: descripcionLog,
            fecha: hoy,
            es_automatico: true,
            recordatorio_tipo: evalRes.tipo,
            dias_relativos: evalRes.diasRelativos,
            recipient_email: destinatario,
            test_mode: testMode,
          }))
        );

        resumen.sent++;
      } catch (sendErr) {
        console.error('[cxc-reminders] Error enviando recordatorio', { grupo: grupo.key, error: sendErr });
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
