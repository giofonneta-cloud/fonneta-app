/**
 * MCP server local para Fonneta — expone los datos financieros (Ventas, Gastos, CXC, CXP)
 * a Claude vía stdio, reutilizando exactamente la misma lógica de negocio que la app
 * (mismos campos de fecha por periodo, misma exclusión de facturas ya pagadas / notas de
 * crédito, mismo cálculo de saldo) para que los números coincidan siempre con el dashboard.
 *
 * Uso: registrado en .mcp.json como servidor "fonneta-finance", vía `npx tsx mcp-server/finance-server.ts`.
 */
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
// quiet: true — dotenv normalmente imprime un log a stdout, y stdout está reservado
// exclusivamente para mensajes JSON-RPC del protocolo MCP.
loadEnv({ path: resolve(__dirname, '../.env.local'), quiet: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const COST_CENTERS = ['FUSCIA', 'SOHO', 'MONICA J', 'FONNETA', 'CLUB INDOMITAS'] as const;

// ---- Tipos mínimos de las filas que consultamos (mismo shape que src/features/finance) ----

type PaymentStatus = 'pendiente' | 'parcial' | 'pagado';
type GastoEstado = 'pendiente' | 'solicite_documentos' | 'pagado';

interface VentaRow {
    id: string;
    proyecto_id: string;
    proyecto?: { name?: string } | null;
    cliente_id?: string | null;
    cliente?: { id: string; business_name?: string } | null;
    comercial_id?: string | null;
    comercial?: { nombre?: string } | null;
    valor_venta_neto: number;
    total_con_iva: number;
    valor_pagado: number;
    estado_pago: PaymentStatus;
    cost_center?: string | null;
    fecha_factura?: string | null;
    fecha_cobro_estimada?: string | null;
    numero_factura?: string | null;
    nota_credito?: boolean | null;
    created_at: string;
}

interface GastoRow {
    id: string;
    proyecto_id?: string | null;
    proveedor_id: string;
    proveedor_nombre?: string | null;
    valor_neto: number;
    total_con_iva: number;
    categoria: string;
    codigo_oc?: string | null;
    numero_factura_proveedor?: string | null;
    fecha_radicado?: string | null;
    fecha_limite_pago?: string | null;
    estado_pago: GastoEstado;
    cost_center?: string | null;
    created_at: string;
}

// ---- Helpers de periodo (idénticos a src/app/(main)/dashboard/finance/page.tsx) ----

function isInPeriod(dateStr: string | null | undefined, periodStr: string): boolean {
    if (periodStr === 'all') return true;
    if (!dateStr) return false;
    const part = dateStr.split('T')[0];
    const [y, m] = part.split('-').map(Number);
    if (!y || !m) return false;

    const qMatch = periodStr.match(/^(\d{4})-Q([1-4])$/);
    if (qMatch) {
        const py = Number(qMatch[1]);
        const q = Number(qMatch[2]);
        if (y !== py) return false;
        const start = (q - 1) * 3 + 1;
        return m >= start && m <= start + 2;
    }
    const [py, pm] = periodStr.split('-').map(Number);
    return y === py && m === pm;
}

function getDaysUntil(dateStr?: string | null): number | null {
    if (!dateStr) return null;
    const target = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function normalizeEstado(e: string): string {
    return e.toLowerCase().replace(/ /g, '_');
}

// ---- Data access ----

async function fetchAllSales(): Promise<VentaRow[]> {
    const { data, error } = await supabase
        .from('ventas')
        .select('*, proyecto:projects(*), cliente:providers(*), comercial:comerciales(*)')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`Error consultando ventas: ${error.message}`);
    return (data ?? []) as unknown as VentaRow[];
}

async function fetchAllExpenses(): Promise<GastoRow[]> {
    const { data, error } = await supabase
        .from('gastos_con_entregables')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`Error consultando gastos: ${error.message}`);
    return (data ?? []) as unknown as GastoRow[];
}

async function fetchGoalAmount(): Promise<number | null> {
    const { data, error } = await supabase
        .from('system_config')
        .select('config_data')
        .eq('module_name', 'finanzas_config')
        .maybeSingle();
    if (error || !data) return null;
    const meta = (data.config_data as { meta_anual?: number | string } | null)?.meta_anual;
    return meta ? Number(meta) : null;
}

// ---- Filtros comunes (mismos nombres/semántica que los MultiSelectFilter de la UI) ----

const filterShape = {
    period: z.string().default('all').describe(
        "Periodo: 'all', 'YYYY-QN' (ej. '2026-Q1') o 'YYYY-MM' (ej. '2026-08')."
    ),
    costCenters: z.array(z.string()).optional().describe(
        `Filtra por centro de costo. Valores válidos: ${COST_CENTERS.join(', ')}.`
    ),
    projects: z.array(z.string()).optional().describe('Filtra por nombre exacto de proyecto.'),
    estados: z.array(z.string()).optional().describe(
        "Filtra por estado de pago: 'Pendiente', 'Parcial', 'Pagado', 'Solicite documentos'."
    ),
    search: z.string().optional().describe('Búsqueda de texto libre (cliente/proveedor, factura, proyecto).'),
    limit: z.number().int().min(1).max(200).default(25).describe('Máximo de filas a devolver en el detalle (los totales siempre son sobre el conjunto completo filtrado).'),
};

function matchesVenta(
    s: VentaRow,
    dateField: 'fecha_factura' | 'fecha_cobro_estimada',
    period: string,
    projects?: string[],
    costCenters?: string[],
    estados?: string[],
): boolean {
    if (!isInPeriod(s[dateField], period)) return false;
    if (projects?.length && !projects.includes(s.proyecto?.name ?? '')) return false;
    if (costCenters?.length && !costCenters.includes(s.cost_center ?? '')) return false;
    if (estados?.length && !estados.some(e => s.estado_pago === normalizeEstado(e))) return false;
    return true;
}

function matchesGasto(
    e: GastoRow,
    dateField: 'fecha_radicado' | 'fecha_limite_pago',
    period: string,
    costCenters?: string[],
    estados?: string[],
): boolean {
    if (!isInPeriod(e[dateField], period)) return false;
    if (costCenters?.length && !costCenters.includes(e.cost_center ?? '')) return false;
    if (estados?.length && !estados.some(es => e.estado_pago === normalizeEstado(es))) return false;
    return true;
}

// ---- Server ----

const server = new McpServer({ name: 'fonneta-finance', version: '1.0.0' });

server.registerTool(
    'finance_kpis',
    {
        title: 'KPIs financieros',
        description:
            'Ingresos, gastos, utilidad neta, margen y avance de meta anual (los mismos 5 KPIs del header del dashboard de Gestión Financiera). Filtra por periodo (fecha de factura/radicado), proyecto, centro de costo y estado de pago. Excluye notas de crédito.',
        inputSchema: {
            period: filterShape.period,
            costCenters: filterShape.costCenters,
            projects: filterShape.projects,
            estados: filterShape.estados,
        },
    },
    async ({ period, costCenters, projects, estados }) => {
        const [sales, expenses, goalAmount] = await Promise.all([
            fetchAllSales(),
            fetchAllExpenses(),
            fetchGoalAmount(),
        ]);

        const fs = sales.filter(s =>
            !s.nota_credito && matchesVenta(s, 'fecha_factura', period, projects, costCenters, estados)
        );
        const fe = expenses.filter(e =>
            matchesGasto(e, 'fecha_radicado', period, costCenters, estados)
        );

        const ingresos = fs.reduce((a, s) => a + (Number(s.valor_venta_neto) || 0), 0);
        const gastos = fe.reduce((a, e) => a + (Number(e.valor_neto) || 0), 0);
        const utilidadNeta = ingresos - gastos;
        const margen = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;
        const meta = goalAmount ?? null;

        const result = {
            filtros: { period, costCenters, projects, estados },
            ingresosTotales: ingresos,
            numFacturas: fs.length,
            gastosTotales: gastos,
            numPagos: fe.length,
            utilidadNeta,
            margenUtilidadPct: Number(margen.toFixed(1)),
            metaAnual: meta,
            avanceMetaPct: meta ? Number(Math.min((ingresos / meta) * 100, 100).toFixed(1)) : null,
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'cxc_cartera',
    {
        title: 'Cuentas por Cobrar (CXC)',
        description:
            'Estado de cartera: distribución Pagado/Parcial/Pendiente y el monto real "por cobrar" (excluye lo ya pagado) — coincide con la pestaña CXC del dashboard. Incluye el detalle de facturas pendientes ordenadas por urgencia. Filtra por fecha_cobro_estimada.',
        inputSchema: {
            period: filterShape.period,
            costCenters: filterShape.costCenters,
            projects: filterShape.projects,
            estados: filterShape.estados,
            search: filterShape.search,
            limit: filterShape.limit,
        },
    },
    async ({ period, costCenters, projects, estados, search, limit }) => {
        const sales = await fetchAllSales();
        const matched = sales.filter(s =>
            matchesVenta(s, 'fecha_cobro_estimada', period, projects, costCenters, estados)
        );

        const pagado = matched.filter(s => s.estado_pago === 'pagado')
            .reduce((a, s) => a + (Number(s.total_con_iva) || 0), 0);
        const parcial = matched.filter(s => s.estado_pago === 'parcial')
            .reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);
        const pendienteTotal = matched.filter(s => s.estado_pago === 'pendiente')
            .reduce((a, s) => a + (Number(s.total_con_iva) || 0), 0);

        const pendientes = matched
            .filter(s => s.estado_pago !== 'pagado')
            .sort((a, b) => (getDaysUntil(a.fecha_cobro_estimada) ?? 9999) - (getDaysUntil(b.fecha_cobro_estimada) ?? 9999));

        const q = search?.trim().toLowerCase();
        const visible = q
            ? pendientes.filter(s =>
                (s.cliente?.business_name ?? '').toLowerCase().includes(q) ||
                (s.numero_factura ?? '').toLowerCase().includes(q) ||
                (s.proyecto?.name ?? '').toLowerCase().includes(q))
            : pendientes;

        const overdue = pendientes.filter(s => (getDaysUntil(s.fecha_cobro_estimada) ?? 1) < 0);
        const totalVencido = overdue.reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);

        const result = {
            filtros: { period, costCenters, projects, estados, search },
            resumenPorEstado: { pagado, parcial, pendiente: pendienteTotal, totalFacturado: pagado + parcial + pendienteTotal },
            porCobrar: parcial + pendienteTotal,
            facturasVencidas: overdue.length,
            totalVencido,
            totalFacturasPendientes: pendientes.length,
            detalle: visible.slice(0, limit).map(s => ({
                cliente: s.cliente?.business_name ?? 'Sin cliente',
                factura: s.numero_factura ?? null,
                proyecto: s.proyecto?.name ?? null,
                costCenter: s.cost_center ?? null,
                totalFactura: Number(s.total_con_iva) || 0,
                saldoPorCobrar: Number(s.total_con_iva) - Number(s.valor_pagado || 0),
                fechaCobroEstimada: s.fecha_cobro_estimada ?? null,
                diasParaVencer: getDaysUntil(s.fecha_cobro_estimada),
                estadoPago: s.estado_pago,
            })),
            detalleTruncado: visible.length > limit,
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'cxp_obligaciones',
    {
        title: 'Cuentas por Pagar (CXP)',
        description:
            'Estado de obligaciones: distribución Pagado/Pendiente/Solicite Documentos y el monto real "por pagar" (excluye lo ya pagado) — coincide con la pestaña CXP del dashboard. Incluye el detalle de gastos pendientes ordenados por urgencia. Filtra por fecha_limite_pago.',
        inputSchema: {
            period: filterShape.period,
            costCenters: filterShape.costCenters,
            estados: filterShape.estados,
            search: filterShape.search,
            limit: filterShape.limit,
        },
    },
    async ({ period, costCenters, estados, search, limit }) => {
        const expenses = await fetchAllExpenses();
        const matched = expenses.filter(e =>
            matchesGasto(e, 'fecha_limite_pago', period, costCenters, estados)
        );

        const pagado = matched.filter(e => e.estado_pago === 'pagado')
            .reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);
        const pendienteTotal = matched.filter(e => e.estado_pago === 'pendiente')
            .reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);
        const solicite = matched.filter(e => e.estado_pago === 'solicite_documentos')
            .reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);

        const pendientes = matched
            .filter(e => e.estado_pago !== 'pagado')
            .sort((a, b) => (getDaysUntil(a.fecha_limite_pago) ?? 9999) - (getDaysUntil(b.fecha_limite_pago) ?? 9999));

        const q = search?.trim().toLowerCase();
        const visible = q
            ? pendientes.filter(e =>
                (e.proveedor_nombre ?? '').toLowerCase().includes(q) ||
                (e.numero_factura_proveedor ?? '').toLowerCase().includes(q) ||
                (e.categoria ?? '').toLowerCase().includes(q) ||
                (e.codigo_oc ?? '').toLowerCase().includes(q))
            : pendientes;

        const overdue = pendientes.filter(e => (getDaysUntil(e.fecha_limite_pago) ?? 1) < 0);

        const result = {
            filtros: { period, costCenters, estados, search },
            resumenPorEstado: { pagado, pendiente: pendienteTotal, soliciteDocumentos: solicite, totalRadicado: pagado + pendienteTotal + solicite },
            porPagar: pendienteTotal + solicite,
            gastosVencidos: overdue.length,
            totalGastosPendientes: pendientes.length,
            detalle: visible.slice(0, limit).map(e => ({
                proveedor: e.proveedor_nombre ?? 'Sin proveedor',
                facturaProveedor: e.numero_factura_proveedor ?? null,
                categoria: e.categoria,
                codigoOc: e.codigo_oc ?? null,
                costCenter: e.cost_center ?? null,
                valorNeto: Number(e.valor_neto) || 0,
                totalConIva: Number(e.total_con_iva) || 0,
                fechaLimitePago: e.fecha_limite_pago ?? null,
                diasParaVencer: getDaysUntil(e.fecha_limite_pago),
                estadoPago: e.estado_pago,
            })),
            detalleTruncado: visible.length > limit,
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'sales_query',
    {
        title: 'Consultar ventas',
        description:
            'Lista de ventas/facturas (pestaña Ventas del dashboard), con sus totales. Filtra por fecha_factura, proyecto, centro de costo, estado de pago y comercial. Excluye notas de crédito.',
        inputSchema: {
            period: filterShape.period,
            costCenters: filterShape.costCenters,
            projects: filterShape.projects,
            estados: filterShape.estados,
            comerciales: z.array(z.string()).optional().describe('Filtra por nombre del comercial.'),
            search: filterShape.search,
            limit: filterShape.limit,
        },
    },
    async ({ period, costCenters, projects, estados, comerciales, search, limit }) => {
        const sales = await fetchAllSales();
        const matched = sales.filter(s => {
            if (s.nota_credito) return false;
            if (!matchesVenta(s, 'fecha_factura', period, projects, costCenters, estados)) return false;
            if (comerciales?.length && !comerciales.includes(s.comercial?.nombre ?? '')) return false;
            return true;
        });

        const q = search?.trim().toLowerCase();
        const visible = q
            ? matched.filter(s =>
                (s.cliente?.business_name ?? '').toLowerCase().includes(q) ||
                (s.numero_factura ?? '').toLowerCase().includes(q) ||
                (s.proyecto?.name ?? '').toLowerCase().includes(q))
            : matched;

        const result = {
            filtros: { period, costCenters, projects, estados, comerciales, search },
            totalFacturas: matched.length,
            ingresosTotales: matched.reduce((a, s) => a + (Number(s.valor_venta_neto) || 0), 0),
            detalle: visible.slice(0, limit).map(s => ({
                cliente: s.cliente?.business_name ?? 'Sin cliente',
                factura: s.numero_factura ?? null,
                proyecto: s.proyecto?.name ?? null,
                comercial: s.comercial?.nombre ?? null,
                costCenter: s.cost_center ?? null,
                valorVentaNeto: Number(s.valor_venta_neto) || 0,
                totalConIva: Number(s.total_con_iva) || 0,
                fechaFactura: s.fecha_factura ?? null,
                estadoPago: s.estado_pago,
            })),
            detalleTruncado: visible.length > limit,
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
);

server.registerTool(
    'expenses_query',
    {
        title: 'Consultar gastos',
        description:
            'Lista de gastos/pagos a proveedores (pestaña Gastos del dashboard), con sus totales. Filtra por fecha_radicado, centro de costo y estado de pago.',
        inputSchema: {
            period: filterShape.period,
            costCenters: filterShape.costCenters,
            estados: filterShape.estados,
            search: filterShape.search,
            limit: filterShape.limit,
        },
    },
    async ({ period, costCenters, estados, search, limit }) => {
        const expenses = await fetchAllExpenses();
        const matched = expenses.filter(e => matchesGasto(e, 'fecha_radicado', period, costCenters, estados));

        const q = search?.trim().toLowerCase();
        const visible = q
            ? matched.filter(e =>
                (e.proveedor_nombre ?? '').toLowerCase().includes(q) ||
                (e.numero_factura_proveedor ?? '').toLowerCase().includes(q) ||
                (e.categoria ?? '').toLowerCase().includes(q))
            : matched;

        const result = {
            filtros: { period, costCenters, estados, search },
            totalGastos: matched.length,
            gastosTotales: matched.reduce((a, e) => a + (Number(e.valor_neto) || 0), 0),
            detalle: visible.slice(0, limit).map(e => ({
                proveedor: e.proveedor_nombre ?? 'Sin proveedor',
                facturaProveedor: e.numero_factura_proveedor ?? null,
                categoria: e.categoria,
                costCenter: e.cost_center ?? null,
                valorNeto: Number(e.valor_neto) || 0,
                totalConIva: Number(e.total_con_iva) || 0,
                fechaRadicado: e.fecha_radicado ?? null,
                estadoPago: e.estado_pago,
            })),
            detalleTruncado: visible.length > limit,
        };
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('fonneta-finance MCP server listo (stdio)');
}

main().catch(err => {
    console.error('Error fatal iniciando fonneta-finance MCP server:', err);
    process.exit(1);
});
