-- Migración para el Módulo 3.6: Gestión de Ventas y Gastos (Completa)

-- Tabla de Marcas
CREATE TABLE IF NOT EXISTS public.marcas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cliente_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    marca_id UUID REFERENCES public.marcas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Gastos (Base + Extensiones del 3.6.4)
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    marca_id UUID REFERENCES public.marcas(id),
    producto_id UUID REFERENCES public.productos(id),
    valor_neto DECIMAL(12,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    iva_valor DECIMAL(12,2) DEFAULT 0.00,
    total_con_iva DECIMAL(12,2) NOT NULL,
    categoria TEXT NOT NULL,
    codigo_oc TEXT,
    codigo_release TEXT,
    numero_factura_proveedor TEXT,
    factura_url TEXT,
    fecha_radicado DATE,
    fecha_limite_pago DATE,
    estado_pago TEXT CHECK (estado_pago IN ('pendiente', 'solicite_documentos', 'pagado')) DEFAULT 'pendiente',
    documentos_faltantes TEXT[],
    fecha_pago_real DATE,
    comprobante_pago_url TEXT,
    metodo_pago TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Entregables vinculados a Gastos
CREATE TABLE IF NOT EXISTS public.gasto_entregables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gasto_id UUID REFERENCES public.gastos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    fecha_entrega_comprometida DATE,
    fecha_entrega_real DATE,
    estado TEXT CHECK (estado IN ('pendiente', 'recibido', 'aprobado')) DEFAULT 'pendiente',
    archivos_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Ventas
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    valor_venta_neto DECIMAL(12,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    iva_valor DECIMAL(12,2) DEFAULT 0.00,
    total_con_iva DECIMAL(12,2) NOT NULL,
    estado_oc TEXT CHECK (estado_oc IN ('oc_recibida', 'facturar_sin_oc')),
    numero_oc TEXT,
    numero_factura TEXT,
    fecha_factura DATE,
    plazo_pago_dias INTEGER DEFAULT 30,
    fecha_cobro_estimada DATE,
    fecha_pago_real DATE,
    valor_pagado DECIMAL(12,2) DEFAULT 0,
    estado_pago TEXT CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado')) DEFAULT 'pendiente',
    calificacion_cumplimiento TEXT CHECK (calificacion_cumplimiento IN ('puntual', 'impuntual')),
    porcentaje_comision DECIMAL(5,2),
    valor_comision DECIMAL(12,2),
    responsable_comision_id UUID REFERENCES auth.users(id),
    notas_internas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
