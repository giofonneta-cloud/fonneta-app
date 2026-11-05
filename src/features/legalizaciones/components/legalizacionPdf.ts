import { FONNETA_LOGO_B64 } from '@/shared/lib/pdf/fonnetaLogoBase64';
import type { Legalizacion, LegalizacionItem } from '../types/legalizacion.types';

const MIN_FILAS = 8;

const INK = '#111827';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const SOFT = '#f3f4f6';
const FONT = "Arial, Helvetica, sans-serif";

// Este HTML va a innerHTML en el navegador de quien descarga (a veces otro usuario):
// todo dato escrito por el usuario debe pasar por esc().
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const fmtMoney = (n: number) =>
  `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n) || 0)}`;

const fmtDate = (d?: string | null) => {
  if (!d) return '';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
};

const fmtDateShort = (d?: string | null) => {
  const full = fmtDate(d);
  return full ? `${full.slice(0, 6)}${full.slice(-2)}` : '';
};

// Datos de cabecera: etiqueta pequeña arriba, valor debajo. Se usan tablas (no flex)
// porque html2canvas las alinea de forma más fiable.
function dato(label: string, value: unknown, colspan = 1): string {
  return `<td colspan="${colspan}" style="padding:7px 10px; vertical-align:top; border-bottom:1px solid ${LINE};">
    <div style="font-size:7.5px; font-weight:700; letter-spacing:0.8px; color:${MUTED}; text-transform:uppercase; margin-bottom:3px;">${esc(label)}</div>
    <div style="font-size:10.5px; font-weight:600; color:${INK}; min-height:13px;">${esc(value) || '&nbsp;'}</div>
  </td>`;
}

function titulo(texto: string): string {
  return `<div style="font-size:9px; font-weight:700; letter-spacing:1.2px; color:${INK}; text-transform:uppercase; margin:0 0 6px; padding-left:8px; border-left:3px solid ${INK};">${esc(texto)}</div>`;
}

function filaGasto(item: LegalizacionItem | null, index: number): string {
  const fondo = index % 2 === 1 ? `background:${SOFT};` : '';
  const td = (content: string, extra = '') =>
    `<td style="padding:6px 8px; border-bottom:1px solid ${LINE}; font-size:9.5px; height:16px; vertical-align:top; ${fondo}${extra}">${content || '&nbsp;'}</td>`;

  if (!item) return `<tr style="page-break-inside:avoid;">${td('')}${td('')}${td('')}${td('')}${td('')}${td('')}</tr>`;

  const soporte = item.soporte_url?.startsWith('https://')
    ? `<a href="${esc(item.soporte_url)}" style="color:${INK}; text-decoration:underline;">${esc(item.numero_soporte)}</a>`
    : esc(item.numero_soporte);

  return `<tr style="page-break-inside:avoid;">
    ${td(esc(fmtDateShort(item.fecha)), 'white-space:nowrap;')}
    ${td(esc(item.categoria_etiqueta || item.categoria))}
    ${td(`${esc(item.establecimiento)}${item.establecimiento_nit ? `<div style="font-size:8px; color:${MUTED}; margin-top:2px;">NIT ${esc(item.establecimiento_nit)}</div>` : ''}`)}
    ${td(soporte)}
    ${td(`${esc(item.descripcion)}${item.comentario ? `<div style="font-size:8px; font-style:italic; color:${MUTED}; margin-top:2px;">${esc(item.comentario)}</div>` : ''}`)}
    ${td(esc(fmtMoney(item.valor)), 'text-align:right; font-weight:600; white-space:nowrap;')}
  </tr>`;
}

function filaResumen(label: string, value: number, opts: { strong?: boolean; dark?: boolean } = {}): string {
  const bg = opts.dark ? `background:${INK}; color:#fff;` : `border-bottom:1px solid ${LINE};`;
  const weight = opts.strong || opts.dark ? '700' : '500';
  return `<tr>
    <td style="padding:6px 10px; font-size:9.5px; font-weight:${weight}; ${bg}">${esc(label)}</td>
    <td style="padding:6px 10px; font-size:9.5px; font-weight:${weight}; text-align:right; white-space:nowrap; width:105px; ${bg}">${esc(fmtMoney(value))}</td>
  </tr>`;
}

function firma(titulo: string, detalle: string, nombre = ''): string {
  return `<td style="width:33.33%; padding:0 14px; text-align:center; vertical-align:bottom;">
    <div style="height:15px; font-size:9.5px; font-weight:600; color:${INK};">${esc(nombre) || '&nbsp;'}</div>
    <div style="border-top:1px solid ${INK}; margin-top:30px; padding-top:5px; font-size:9px; font-weight:700; color:${INK};">${esc(titulo)}</div>
    <div style="font-size:8px; color:${MUTED}; margin-top:2px;">${esc(detalle)}</div>
  </td>`;
}

export function buildLegalizacionHTML(leg: Legalizacion): string {
  const items = leg.items ?? [];
  const filas: (LegalizacionItem | null)[] = [...items];
  while (filas.length < MIN_FILAS) filas.push(null);

  const total = items.reduce((sum, i) => sum + (Number(i.valor) || 0), 0);
  const anticipo = Number(leg.anticipo_recibido) || 0;
  const esContratista = leg.beneficiario_tipo === 'contratista';
  const rol = esContratista ? 'Contratista' : 'Empleado';
  const idLabel = esContratista ? 'C.C. / NIT' : 'C.C.';
  const aprobada = leg.status === 'aprobada' || leg.status === 'cerrada';
  const reembolso = Math.max(total - anticipo, 0);
  const devolucion = Math.max(anticipo - total, 0);
  const periodo = leg.periodo_desde || leg.periodo_hasta
    ? `${fmtDate(leg.periodo_desde)}  al  ${fmtDate(leg.periodo_hasta)}`
    : '';

  return `<div style="width:190mm; font-family:${FONT}; color:${INK}; background:#fff;">

    <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
      <tr>
        <td style="vertical-align:middle; width:50%;">
          <table style="border-collapse:collapse;"><tr>
            <td style="vertical-align:middle; padding-right:10px;"><img src="${FONNETA_LOGO_B64}" alt="Fonneta" style="height:34px; width:auto; display:block;" /></td>
            <td style="vertical-align:middle;">
              <div style="font-size:16px; font-weight:700; letter-spacing:1.5px; line-height:1;">FONNETA</div>
              <div style="font-size:8px; color:${MUTED}; letter-spacing:1.5px; margin-top:4px; text-transform:uppercase;">Comunicaciones</div>
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:middle; text-align:right;">
          <div style="font-size:7.5px; font-weight:700; letter-spacing:1.4px; color:${MUTED}; text-transform:uppercase;">Documento N°</div>
          <div style="font-size:15px; font-weight:700; letter-spacing:0.5px; margin-top:2px;">${esc(leg.numero)}</div>
        </td>
      </tr>
    </table>

    <div style="background:${INK}; color:#fff; text-align:center; padding:10px 0; margin-bottom:12px;">
      <div style="font-size:13px; font-weight:700; letter-spacing:2px;">FORMATO DE LEGALIZACIÓN DE GASTOS</div>
      <div style="font-size:8px; letter-spacing:1.4px; opacity:0.75; margin-top:3px;">VIÁTICOS · REINTEGROS · ANTICIPOS</div>
    </div>

    <table style="width:100%; border-collapse:collapse; border:1px solid ${LINE}; margin-bottom:16px; table-layout:fixed;">
      <tr>
        ${dato(rol, leg.beneficiario_nombre, 2)}
        ${dato(`Identificación (${idLabel})`, leg.beneficiario_documento)}
        ${dato('Fecha reporte', fmtDate(leg.fecha_reporte))}
      </tr>
      <tr>
        ${dato('Área / Departamento', leg.beneficiario_area)}
        ${dato('Centro de costos', leg.cost_center)}
        ${dato('Período del gasto', periodo, 2)}
      </tr>
      <tr>
        ${dato('Motivo del gasto', leg.motivo, 3)}
        ${dato('Aprobado por (Jefe)', aprobada ? leg.aprobado_por_nombre : '')}
      </tr>
    </table>

    ${titulo('Relación de gastos detallada')}
    <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
      <thead>
        <tr style="background:${INK}; color:#fff; font-size:8.5px; font-weight:700; letter-spacing:0.3px;">
          <th style="padding:7px 8px; width:10%; text-align:left;">Fecha</th>
          <th style="padding:7px 8px; width:14%; text-align:left;">Categoría</th>
          <th style="padding:7px 8px; width:19%; text-align:left;">Proveedor / Establecimiento</th>
          <th style="padding:7px 8px; width:13%; text-align:left;">N° Factura / Soporte</th>
          <th style="padding:7px 8px; width:27%; text-align:left;">Descripción / Concepto</th>
          <th style="padding:7px 8px; width:17%; text-align:right;">Valor</th>
        </tr>
      </thead>
      <tbody>${filas.map(filaGasto).join('')}</tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="padding:8px 8px; text-align:right; font-size:9.5px; font-weight:700; letter-spacing:0.8px; border-top:2px solid ${INK};">TOTAL GASTOS LEGALIZADOS</td>
          <td style="padding:8px 8px; text-align:right; font-size:11px; font-weight:700; white-space:nowrap; border-top:2px solid ${INK};">${esc(fmtMoney(total))}</td>
        </tr>
      </tfoot>
    </table>
    <div style="font-size:8px; font-style:italic; color:${MUTED}; margin:6px 0 16px;">
      Es obligatorio adjuntar los soportes físicos o digitales válidos correspondientes a cada gasto listado.
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:18px;">
      <tr>
        <td style="vertical-align:top; padding-right:20px;">&nbsp;</td>
        <td style="width:56%; vertical-align:top;">
          ${titulo('Liquidación / Resumen')}
          <table style="width:100%; border-collapse:collapse; border:1px solid ${LINE};">
            ${filaResumen('Total gastos legalizados', total)}
            ${filaResumen('Anticipo recibido', anticipo)}
            ${filaResumen(`Saldo a favor del ${rol.toLowerCase()} (reembolso)`, reembolso, { strong: reembolso > 0, dark: reembolso > 0 })}
            ${filaResumen('Saldo a favor de la empresa (devolución)', devolucion, { strong: devolucion > 0, dark: devolucion > 0 })}
          </table>
        </td>
      </tr>
    </table>

    <div style="page-break-inside:avoid;">
      ${titulo('Firmas y declaración')}
      <div style="font-size:8.5px; color:${MUTED}; line-height:1.5; background:${SOFT}; padding:8px 10px; border-radius:3px;">
        Declaro bajo la gravedad de juramento que los gastos detallados aquí son verídicos, exactos y fueron incurridos para fines exclusivos del negocio.
      </div>
      <table style="width:100%; border-collapse:collapse; margin-top:6px;">
        <tr>
          ${firma(`Firma del ${rol}`, `${idLabel}: ${leg.beneficiario_documento ?? ''}`)}
          ${firma('Aprobado por (Jefe Directo)', `Cargo: ${(aprobada && leg.aprobado_por_cargo) || ''}`, aprobada ? leg.aprobado_por_nombre ?? '' : '')}
          ${firma('Revisado por (Contabilidad)', 'Fecha rev.:')}
        </tr>
      </table>
    </div>
  </div>`;
}
