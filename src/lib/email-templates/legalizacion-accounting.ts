import type { Legalizacion, LegalizacionItem } from '@/features/legalizaciones/types/legalizacion.types';

export interface CausedExpense {
  total_con_iva: number;
  estado_pago: string;
  categoria: string | null;
  numero_factura_proveedor: string | null;
}

export interface AccountingEmailInput {
  legalizacion: Legalizacion;
  items: LegalizacionItem[];
  gastos: CausedExpense[];
  appUrl: string;
}

export interface AccountingEmail {
  subject: string;
  html: string;
  text: string;
}

// Los textos los escribe el usuario: todo valor dinámico pasa por esc() antes de ir al HTML.
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const money = (n: number) => `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n) || 0)}`;

const date = (d?: string | null) => {
  if (!d) return '-';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
};

const TH = 'padding:6px 8px; text-align:left; background:#f3f4f6; font-size:12px; border-bottom:1px solid #e5e7eb;';
const TD = 'padding:6px 8px; font-size:12px; border-bottom:1px solid #f3f4f6; vertical-align:top;';

function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 12px 4px 0; color:#6b7280; font-size:13px;">${esc(label)}</td><td style="padding:4px 0; font-size:13px;"><strong>${esc(value) || '-'}</strong></td></tr>`;
}

export function buildAccountingEmail({ legalizacion: leg, items, gastos, appUrl }: AccountingEmailInput): AccountingEmail {
  const pagados = gastos.filter((g) => g.estado_pago === 'pagado');
  const pendientes = gastos.filter((g) => g.estado_pago !== 'pagado');
  const sum = (list: CausedExpense[]) => list.reduce((acc, g) => acc + (Number(g.total_con_iva) || 0), 0);
  const totalCausado = sum(gastos);
  const esContratista = leg.beneficiario_tipo === 'contratista';
  const periodo = `${date(leg.periodo_desde)} al ${date(leg.periodo_hasta)}`;
  const gastosUrl = `${appUrl}/dashboard/finance`;

  const causacion =
    `Se causaron ${gastos.length} gasto${gastos.length === 1 ? '' : 's'} en Finanzas por ${money(totalCausado)}: ` +
    `${pagados.length} ya pagado${pagados.length === 1 ? '' : 's'} con anticipo (${money(sum(pagados))}) y ` +
    `${pendientes.length} pendiente${pendientes.length === 1 ? '' : 's'} de pago en CXP (${money(sum(pendientes))}).`;

  const itemRows = items
    .map((item) => {
      const soporte = item.soporte_url?.startsWith('https://')
        ? `<a href="${esc(item.soporte_url)}" style="color:#2563eb;">${esc(item.numero_soporte) || 'Ver'}</a>`
        : esc(item.numero_soporte);
      return `<tr>
        <td style="${TD}">${esc(date(item.fecha))}</td>
        <td style="${TD}">${esc(item.categoria_etiqueta || item.categoria)}</td>
        <td style="${TD}">${esc(item.establecimiento)}${item.establecimiento_nit ? `<br><span style="color:#6b7280;">NIT ${esc(item.establecimiento_nit)}</span>` : ''}</td>
        <td style="${TD}">${soporte}</td>
        <td style="${TD}">${esc(item.descripcion)}${item.comentario ? `<br><span style="color:#6b7280;">${esc(item.comentario)}</span>` : ''}</td>
        <td style="${TD} text-align:right; white-space:nowrap;">${esc(money(item.valor))}</td>
      </tr>`;
    })
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; color:#111827;">
      <h2 style="margin:0 0 4px; color:#111827;">Legalización aprobada y causada</h2>
      <p style="margin:0 0 16px; color:#6b7280; font-size:13px;">Se adjunta el formato de legalización de gastos en PDF.</p>

      <table style="border-collapse:collapse; margin-bottom:16px;">
        ${row('Documento', leg.numero)}
        ${row(esContratista ? 'Contratista' : 'Empleado', leg.beneficiario_nombre)}
        ${row('Identificación', leg.beneficiario_documento ?? '')}
        ${row('Centro de costo', leg.cost_center ?? '')}
        ${row('Período del gasto', periodo)}
        ${row('Motivo', leg.motivo ?? '')}
        ${row('Aprobado por', `${leg.aprobado_por_nombre ?? ''} - ${date(leg.aprobado_at)}`)}
      </table>

      <div style="background:#f3f4f6; border-radius:6px; padding:12px 14px; margin-bottom:18px; font-size:13px;">
        <strong>Causación:</strong> ${esc(causacion)}
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        <thead><tr>
          <th style="${TH}">Fecha</th><th style="${TH}">Categoría</th><th style="${TH}">Proveedor</th>
          <th style="${TH}">Soporte</th><th style="${TH}">Descripción</th><th style="${TH} text-align:right;">Valor</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="border-collapse:collapse; margin-left:auto; margin-bottom:20px;">
        ${row('Total gastos legalizados', money(leg.total_gastos))}
        ${row('Anticipo recibido', money(leg.anticipo_recibido))}
        ${row(`Saldo a favor del ${esContratista ? 'contratista' : 'empleado'} (reembolso)`, money(leg.saldo_empleado))}
        ${row('Saldo a favor de la empresa (devolución)', money(leg.saldo_empresa))}
      </table>

      <p style="font-size:13px;">Puedes revisar los gastos causados en <a href="${esc(gastosUrl)}" style="color:#2563eb;">Finanzas</a>. Los soportes de cada línea están enlazados en la tabla.</p>
      <hr style="border:1px solid #e5e7eb; margin:20px 0;">
      <p style="color:#9ca3af; font-size:12px;">Mensaje automático de Fonneta App al aprobar una legalización de gastos. Dudas: administrativo@fonneta.com.</p>
    </div>
  `;

  const lines = items
    .map((i) => `- ${date(i.fecha)} | ${i.categoria_etiqueta || i.categoria || ''} | ${i.establecimiento || ''}${i.establecimiento_nit ? ` (NIT ${i.establecimiento_nit})` : ''} | ${i.numero_soporte || ''} | ${i.descripcion || ''} | ${money(i.valor)}`)
    .join('\n');

  const text = `Legalización aprobada y causada - ${leg.numero}

${esContratista ? 'Contratista' : 'Empleado'}: ${leg.beneficiario_nombre}
Identificación: ${leg.beneficiario_documento ?? '-'}
Centro de costo: ${leg.cost_center ?? '-'}
Período: ${periodo}
Motivo: ${leg.motivo ?? '-'}
Aprobado por: ${leg.aprobado_por_nombre ?? '-'} (${date(leg.aprobado_at)})

Causación: ${causacion}

Líneas:
${lines}

Total gastos: ${money(leg.total_gastos)}
Anticipo recibido: ${money(leg.anticipo_recibido)}
Saldo a favor del beneficiario: ${money(leg.saldo_empleado)}
Saldo a favor de la empresa: ${money(leg.saldo_empresa)}

Se adjunta el PDF del formato de legalización. Finanzas: ${gastosUrl}`;

  return {
    subject: `[LEGALIZACIÓN] Aprobada y causada - ${leg.numero} - ${leg.beneficiario_nombre}`,
    html,
    text,
  };
}
