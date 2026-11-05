-- =============================================
-- MÓDULO LEGALIZACIÓN DE VIÁTICOS, REINTEGROS Y ANTICIPOS
-- Aplica a empleados y contratistas/proveedores.
--
-- Flujo normal (reintegro): borrador -> enviada -> aprobada -> cerrada
-- Anticipo (opcional):      solicitado -> aprobado -> pagado -> legalizado
--
-- Todo cambio de estado pasa por funciones SECURITY DEFINER: las políticas RLS
-- no permiten modificar `status` desde el cliente.
-- =============================================

-- 1. ANTICIPOS
CREATE TABLE IF NOT EXISTS public.anticipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL UNIQUE,
    doc_year INTEGER NOT NULL,
    doc_sequence INTEGER NOT NULL,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
    beneficiario_tipo TEXT NOT NULL DEFAULT 'empleado' CHECK (beneficiario_tipo IN ('empleado', 'contratista')),
    beneficiario_nombre TEXT NOT NULL,
    beneficiario_documento TEXT,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    motivo TEXT NOT NULL,
    cost_center TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'solicitado'
        CHECK (status IN ('solicitado', 'aprobado', 'rechazado', 'pagado', 'legalizado')),
    motivo_rechazo TEXT,
    aprobado_por UUID REFERENCES auth.users(id),
    aprobado_por_nombre TEXT,
    aprobado_at TIMESTAMPTZ,
    fecha_pago DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_anticipos_year_seq ON public.anticipos(doc_year, doc_sequence);
CREATE INDEX IF NOT EXISTS idx_anticipos_user ON public.anticipos(user_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_status ON public.anticipos(status);

-- 2. LEGALIZACIONES
CREATE TABLE IF NOT EXISTS public.legalizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL UNIQUE,
    doc_year INTEGER NOT NULL,
    doc_sequence INTEGER NOT NULL,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    beneficiario_tipo TEXT NOT NULL DEFAULT 'empleado' CHECK (beneficiario_tipo IN ('empleado', 'contratista')),
    beneficiario_nombre TEXT NOT NULL,
    beneficiario_documento TEXT,
    beneficiario_area TEXT,
    motivo TEXT,
    cost_center TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    fecha_reporte DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_desde DATE,
    periodo_hasta DATE,
    anticipo_id UUID REFERENCES public.anticipos(id) ON DELETE SET NULL,
    total_gastos DECIMAL(12,2) NOT NULL DEFAULT 0,
    anticipo_recibido DECIMAL(12,2) NOT NULL DEFAULT 0,
    saldo_empleado DECIMAL(12,2) NOT NULL DEFAULT 0,
    saldo_empresa DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'cerrada')),
    motivo_rechazo TEXT,
    enviado_at TIMESTAMPTZ,
    aprobado_por UUID REFERENCES auth.users(id),
    aprobado_por_nombre TEXT,
    aprobado_por_cargo TEXT,
    aprobado_at TIMESTAMPTZ,
    cerrado_at TIMESTAMPTZ,
    cierre_nota TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_legalizaciones_year_seq ON public.legalizaciones(doc_year, doc_sequence);
-- Un anticipo solo se puede legalizar una vez.
CREATE UNIQUE INDEX IF NOT EXISTS idx_legalizaciones_anticipo ON public.legalizaciones(anticipo_id) WHERE anticipo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_legalizaciones_user ON public.legalizaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_legalizaciones_status ON public.legalizaciones(status);

-- 3. LÍNEAS DE GASTO
CREATE TABLE IF NOT EXISTS public.legalizacion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legalizacion_id UUID NOT NULL REFERENCES public.legalizaciones(id) ON DELETE CASCADE,
    fecha DATE,
    categoria TEXT,
    categoria_etiqueta TEXT,
    establecimiento TEXT,
    numero_soporte TEXT,
    descripcion TEXT,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    soporte_url TEXT CHECK (soporte_url IS NULL OR soporte_url ~ '^https://'),
    soporte_nombre TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_legalizacion_items_parent ON public.legalizacion_items(legalizacion_id);

-- 4. INTEGRACIÓN CON GASTOS
ALTER TABLE public.gastos
    ADD COLUMN IF NOT EXISTS legalizacion_id UUID REFERENCES public.legalizaciones(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS beneficiario_nombre TEXT;
CREATE INDEX IF NOT EXISTS idx_gastos_legalizacion ON public.gastos(legalizacion_id) WHERE legalizacion_id IS NOT NULL;

-- Finanzas muestra al empleado como "proveedor" cuando el gasto no tiene proveedor registrado.
CREATE OR REPLACE VIEW public.gastos_con_entregables AS
 SELECT id,
    proyecto_id,
    proveedor_id,
    valor_neto,
    iva_porcentaje,
    iva_valor,
    total_con_iva,
    categoria,
    codigo_oc,
    codigo_release,
    numero_factura_proveedor,
    factura_url,
    fecha_radicado,
    fecha_limite_pago,
    estado_pago,
    documentos_faltantes,
    fecha_pago_real,
    comprobante_pago_url,
    metodo_pago,
    observaciones,
    cost_center,
    created_at,
    updated_at,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', e.id, 'nombre', e.nombre, 'fecha_entrega_comprometida', e.fecha_entrega_comprometida, 'fecha_entrega_real', e.fecha_entrega_real, 'estado', e.estado, 'archivos_urls', e.archivos_urls) ORDER BY e.fecha_entrega_comprometida) AS jsonb_agg
           FROM gasto_entregables e
          WHERE e.gasto_id = g.id), '[]'::jsonb) AS entregables,
    ( SELECT count(*) AS count
           FROM gasto_entregables e
          WHERE e.gasto_id = g.id) AS entregables_count,
    ( SELECT count(*) AS count
           FROM gasto_entregables e
          WHERE e.gasto_id = g.id AND e.estado = 'pendiente'::text) AS entregables_pendientes,
    COALESCE(( SELECT providers.business_name
           FROM providers
          WHERE providers.id = g.proveedor_id), g.beneficiario_nombre) AS proveedor_nombre,
    ( SELECT projects.name
           FROM projects
          WHERE projects.id = g.proyecto_id) AS proyecto_nombre,
    legalizacion_id
   FROM gastos g;

-- 5. NUMERACIÓN Y TIMESTAMPS
CREATE OR REPLACE FUNCTION public.legalizacion_generar_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_year INTEGER; v_seq INTEGER; v_prefijo TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    v_prefijo := CASE TG_TABLE_NAME WHEN 'anticipos' THEN 'ANT' ELSE 'LEG' END;
    -- Serializa la numeración: MAX()+1 no es seguro con inserciones concurrentes.
    PERFORM pg_advisory_xact_lock(hashtext(TG_TABLE_NAME || '_numero'));
    EXECUTE format('SELECT COALESCE(MAX(doc_sequence), 0) + 1 FROM public.%I WHERE doc_year = $1', TG_TABLE_NAME)
        INTO v_seq USING v_year;
    NEW.doc_year := v_year;
    NEW.doc_sequence := v_seq;
    NEW.numero := v_prefijo || '-' || v_year::TEXT || '-' || LPAD(v_seq::TEXT, 3, '0');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.legalizacion_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := NOW();
    NEW.numero := OLD.numero;
    NEW.doc_year := OLD.doc_year;
    NEW.doc_sequence := OLD.doc_sequence;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS anticipos_numero ON public.anticipos;
CREATE TRIGGER anticipos_numero BEFORE INSERT ON public.anticipos
    FOR EACH ROW EXECUTE FUNCTION public.legalizacion_generar_numero();
DROP TRIGGER IF EXISTS legalizaciones_numero ON public.legalizaciones;
CREATE TRIGGER legalizaciones_numero BEFORE INSERT ON public.legalizaciones
    FOR EACH ROW EXECUTE FUNCTION public.legalizacion_generar_numero();
DROP TRIGGER IF EXISTS anticipos_touch ON public.anticipos;
CREATE TRIGGER anticipos_touch BEFORE UPDATE ON public.anticipos
    FOR EACH ROW EXECUTE FUNCTION public.legalizacion_touch();
DROP TRIGGER IF EXISTS legalizaciones_touch ON public.legalizaciones;
CREATE TRIGGER legalizaciones_touch BEFORE UPDATE ON public.legalizaciones
    FOR EACH ROW EXECUTE FUNCTION public.legalizacion_touch();

-- 6. RLS
ALTER TABLE public.anticipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legalizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legalizacion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anticipos_select ON public.anticipos;
CREATE POLICY anticipos_select ON public.anticipos FOR SELECT TO authenticated
    USING (user_id = auth.uid()
        OR public.user_has_permission('legalizaciones.view_all')
        OR public.user_has_permission('legalizaciones.approve'));
DROP POLICY IF EXISTS anticipos_insert ON public.anticipos;
CREATE POLICY anticipos_insert ON public.anticipos FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND status = 'solicitado'
        AND aprobado_por IS NULL AND fecha_pago IS NULL
        AND public.user_has_permission('legalizaciones.view'));
DROP POLICY IF EXISTS anticipos_delete ON public.anticipos;
CREATE POLICY anticipos_delete ON public.anticipos FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND status IN ('solicitado', 'rechazado'));

DROP POLICY IF EXISTS legalizaciones_select ON public.legalizaciones;
CREATE POLICY legalizaciones_select ON public.legalizaciones FOR SELECT TO authenticated
    USING (user_id = auth.uid()
        OR public.user_has_permission('legalizaciones.view_all')
        OR public.user_has_permission('legalizaciones.approve'));
DROP POLICY IF EXISTS legalizaciones_insert ON public.legalizaciones;
CREATE POLICY legalizaciones_insert ON public.legalizaciones FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND status = 'borrador'
        AND public.user_has_permission('legalizaciones.view'));
DROP POLICY IF EXISTS legalizaciones_update ON public.legalizaciones;
CREATE POLICY legalizaciones_update ON public.legalizaciones FOR UPDATE TO authenticated
    USING (user_id = auth.uid() AND status IN ('borrador', 'rechazada'))
    WITH CHECK (user_id = auth.uid() AND status IN ('borrador', 'rechazada'));
DROP POLICY IF EXISTS legalizaciones_delete ON public.legalizaciones;
CREATE POLICY legalizaciones_delete ON public.legalizaciones FOR DELETE TO authenticated
    USING (user_id = auth.uid() AND status IN ('borrador', 'rechazada'));

DROP POLICY IF EXISTS legalizacion_items_select ON public.legalizacion_items;
CREATE POLICY legalizacion_items_select ON public.legalizacion_items FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.legalizaciones l
        WHERE l.id = legalizacion_id AND (l.user_id = auth.uid()
            OR public.user_has_permission('legalizaciones.view_all')
            OR public.user_has_permission('legalizaciones.approve'))
    ));
DROP POLICY IF EXISTS legalizacion_items_write ON public.legalizacion_items;
CREATE POLICY legalizacion_items_write ON public.legalizacion_items FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.legalizaciones l
        WHERE l.id = legalizacion_id AND l.user_id = auth.uid() AND l.status IN ('borrador', 'rechazada')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.legalizaciones l
        WHERE l.id = legalizacion_id AND l.user_id = auth.uid() AND l.status IN ('borrador', 'rechazada')
    ));

-- 7. NOTIFICACIONES (los usuarios normales no pueden insertar para otros por RLS)
CREATE OR REPLACE FUNCTION public.legalizacion_notificar_aprobadores(p_title TEXT, p_message TEXT, p_data JSONB)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT u.id, 'legalizacion', p_title, p_message, p_data
    FROM (
        SELECT p.id FROM profiles p WHERE p.role = 'admin' AND COALESCE(p.is_active, true)
        UNION
        SELECT uar.user_id FROM user_app_roles uar
        JOIN app_roles ar ON ar.id = uar.role_id
        WHERE ar.permissions @> '["legalizaciones.approve"]'::jsonb
    ) u
    WHERE u.id IS DISTINCT FROM auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.legalizacion_notificar_usuario(p_user UUID, p_title TEXT, p_message TEXT, p_data JSONB)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user, 'legalizacion', p_title, p_message, p_data);
$$;

CREATE OR REPLACE FUNCTION public.legalizacion_requiere_aprobador()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.user_has_permission('legalizaciones.approve') THEN
        RAISE EXCEPTION 'No tienes permiso para aprobar legalizaciones';
    END IF;
END;
$$;

-- 8. FLUJO DE LEGALIZACIÓN
CREATE OR REPLACE FUNCTION public.legalizacion_enviar(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leg legalizaciones%ROWTYPE;
    v_total NUMERIC;
    v_anticipo NUMERIC := 0;
    v_provider UUID;
BEGIN
    SELECT * INTO v_leg FROM legalizaciones WHERE id = p_id FOR UPDATE;
    IF NOT FOUND OR v_leg.user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Legalización no encontrada';
    END IF;
    IF v_leg.status NOT IN ('borrador', 'rechazada') THEN
        RAISE EXCEPTION 'Esta legalización ya fue enviada';
    END IF;

    IF COALESCE(trim(v_leg.beneficiario_nombre), '') = '' OR COALESCE(trim(v_leg.beneficiario_documento), '') = ''
        OR COALESCE(trim(v_leg.motivo), '') = '' OR COALESCE(trim(v_leg.cost_center), '') = ''
        OR v_leg.periodo_desde IS NULL OR v_leg.periodo_hasta IS NULL THEN
        RAISE EXCEPTION 'Completa nombre, identificación, motivo, centro de costo y período antes de enviar';
    END IF;
    IF v_leg.periodo_hasta < v_leg.periodo_desde THEN
        RAISE EXCEPTION 'El período del gasto es inválido: la fecha final es anterior a la inicial';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM legalizacion_items WHERE legalizacion_id = p_id) THEN
        RAISE EXCEPTION 'Agrega al menos una línea de gasto';
    END IF;
    IF EXISTS (
        SELECT 1 FROM legalizacion_items
        WHERE legalizacion_id = p_id AND (
            fecha IS NULL OR COALESCE(trim(categoria), '') = '' OR COALESCE(trim(establecimiento), '') = ''
            OR COALESCE(trim(numero_soporte), '') = '' OR COALESCE(trim(descripcion), '') = ''
            OR valor <= 0
        )
    ) THEN
        RAISE EXCEPTION 'Todas las líneas deben tener fecha, categoría, proveedor, N° de soporte, descripción y valor';
    END IF;
    IF EXISTS (SELECT 1 FROM legalizacion_items WHERE legalizacion_id = p_id AND soporte_url IS NULL) THEN
        RAISE EXCEPTION 'Todas las líneas deben tener su soporte adjunto';
    END IF;

    IF v_leg.anticipo_id IS NOT NULL THEN
        SELECT monto INTO v_anticipo FROM anticipos
        WHERE id = v_leg.anticipo_id AND user_id = v_leg.user_id AND status = 'pagado';
        IF NOT FOUND THEN
            RAISE EXCEPTION 'El anticipo seleccionado no está pagado o no te pertenece';
        END IF;
    END IF;

    -- El proveedor no se toma del cliente: se deriva del usuario dueño del documento.
    IF v_leg.beneficiario_tipo = 'contratista' THEN
        SELECT id INTO v_provider FROM providers WHERE user_id = v_leg.user_id LIMIT 1;
    END IF;

    SELECT SUM(valor) INTO v_total FROM legalizacion_items WHERE legalizacion_id = p_id;

    UPDATE legalizaciones SET
        status = 'enviada',
        provider_id = v_provider,
        total_gastos = v_total,
        anticipo_recibido = v_anticipo,
        saldo_empleado = GREATEST(v_total - v_anticipo, 0),
        saldo_empresa = GREATEST(v_anticipo - v_total, 0),
        motivo_rechazo = NULL,
        enviado_at = NOW()
    WHERE id = p_id;

    PERFORM legalizacion_notificar_aprobadores(
        'Legalización por aprobar',
        v_leg.numero || ' de ' || v_leg.beneficiario_nombre || ' está pendiente de aprobación',
        jsonb_build_object('legalizacion_id', p_id)
    );
END;
$$;

-- Crea un gasto en Finanzas a partir de una línea (o de una parte de ella).
CREATE OR REPLACE FUNCTION public.legalizacion_crear_gasto(
    p_leg legalizaciones, p_item legalizacion_items, p_valor NUMERIC, p_pagado BOOLEAN
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO gastos (
        legalizacion_id, beneficiario_nombre, proveedor_id, proyecto_id, valor_neto, iva_porcentaje,
        iva_valor, total_con_iva, categoria, numero_factura_proveedor, factura_url, fecha_radicado,
        fecha_limite_pago, estado_pago, fecha_pago_real, metodo_pago, observaciones, cost_center
    ) VALUES (
        p_leg.id, p_leg.beneficiario_nombre, p_leg.provider_id, p_leg.project_id, p_valor, 0,
        0, p_valor, p_item.categoria, p_item.numero_soporte, p_item.soporte_url, CURRENT_DATE,
        CURRENT_DATE, CASE WHEN p_pagado THEN 'pagado' ELSE 'pendiente' END,
        CASE WHEN p_pagado THEN CURRENT_DATE END, CASE WHEN p_pagado THEN 'Anticipo' END,
        p_leg.numero || ' - ' || p_item.establecimiento || ' (' || to_char(p_item.fecha, 'DD/MM/YYYY') || '): ' || p_item.descripcion,
        p_leg.cost_center
    );
$$;

CREATE OR REPLACE FUNCTION public.legalizacion_aprobar(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leg legalizaciones%ROWTYPE;
    v_item legalizacion_items%ROWTYPE;
    v_restante NUMERIC;
    v_nombre TEXT;
    v_cargo TEXT;
    v_rol TEXT;
    v_cubierto NUMERIC;
BEGIN
    PERFORM legalizacion_requiere_aprobador();

    SELECT * INTO v_leg FROM legalizaciones WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Legalización no encontrada'; END IF;
    IF v_leg.status <> 'enviada' THEN
        RAISE EXCEPTION 'Solo se pueden aprobar legalizaciones enviadas';
    END IF;

    SELECT COALESCE(NULLIF(trim(full_name), ''), email), "position", role::TEXT INTO v_nombre, v_cargo, v_rol FROM profiles WHERE id = auth.uid();
    IF v_leg.user_id = auth.uid() AND v_rol <> 'admin' THEN
        RAISE EXCEPTION 'No puedes aprobar tu propia legalización';
    END IF;

    -- El anticipo ya salió de caja: las líneas que cubre entran pagadas y solo
    -- queda por pagar el saldo. Una línea cubierta en parte se divide en dos gastos.
    v_restante := v_leg.anticipo_recibido;
    FOR v_item IN SELECT * FROM legalizacion_items WHERE legalizacion_id = p_id ORDER BY order_index LOOP
        v_cubierto := LEAST(v_restante, v_item.valor);
        IF v_cubierto > 0 THEN
            PERFORM legalizacion_crear_gasto(v_leg, v_item, v_cubierto, true);
            v_restante := v_restante - v_cubierto;
        END IF;
        IF v_item.valor - v_cubierto > 0 THEN
            PERFORM legalizacion_crear_gasto(v_leg, v_item, v_item.valor - v_cubierto, false);
        END IF;
    END LOOP;

    IF v_leg.anticipo_id IS NOT NULL THEN
        UPDATE anticipos SET status = 'legalizado' WHERE id = v_leg.anticipo_id;
    END IF;

    UPDATE legalizaciones SET
        status = CASE WHEN saldo_empleado = 0 AND saldo_empresa = 0 THEN 'cerrada' ELSE 'aprobada' END,
        cerrado_at = CASE WHEN saldo_empleado = 0 AND saldo_empresa = 0 THEN NOW() END,
        aprobado_por = auth.uid(),
        aprobado_por_nombre = v_nombre,
        aprobado_por_cargo = v_cargo,
        aprobado_at = NOW()
    WHERE id = p_id;

    IF v_leg.user_id <> auth.uid() THEN
        PERFORM legalizacion_notificar_usuario(v_leg.user_id, 'Legalización aprobada',
            'Tu legalización ' || v_leg.numero || ' fue aprobada', jsonb_build_object('legalizacion_id', p_id));
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.legalizacion_rechazar(p_id UUID, p_motivo TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_leg legalizaciones%ROWTYPE;
BEGIN
    PERFORM legalizacion_requiere_aprobador();
    IF COALESCE(trim(p_motivo), '') = '' THEN
        RAISE EXCEPTION 'Indica el motivo de la devolución';
    END IF;

    SELECT * INTO v_leg FROM legalizaciones WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Legalización no encontrada'; END IF;
    IF v_leg.status <> 'enviada' THEN
        RAISE EXCEPTION 'Solo se pueden devolver legalizaciones enviadas';
    END IF;

    UPDATE legalizaciones SET status = 'rechazada', motivo_rechazo = trim(p_motivo) WHERE id = p_id;

    IF v_leg.user_id <> auth.uid() THEN
        PERFORM legalizacion_notificar_usuario(v_leg.user_id, 'Legalización devuelta',
            'Tu legalización ' || v_leg.numero || ' fue devuelta: ' || trim(p_motivo), jsonb_build_object('legalizacion_id', p_id));
    END IF;
END;
$$;

-- Registra el pago del reintegro al beneficiario o la devolución a la empresa.
CREATE OR REPLACE FUNCTION public.legalizacion_cerrar(p_id UUID, p_fecha DATE, p_nota TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_leg legalizaciones%ROWTYPE;
BEGIN
    PERFORM legalizacion_requiere_aprobador();
    IF p_fecha IS NULL THEN RAISE EXCEPTION 'Indica la fecha'; END IF;

    SELECT * INTO v_leg FROM legalizaciones WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Legalización no encontrada'; END IF;
    IF v_leg.status <> 'aprobada' THEN
        RAISE EXCEPTION 'Solo se pueden cerrar legalizaciones aprobadas';
    END IF;

    UPDATE legalizaciones SET status = 'cerrada', cerrado_at = NOW(), cierre_nota = NULLIF(trim(p_nota), '')
    WHERE id = p_id;

    UPDATE gastos SET estado_pago = 'pagado', fecha_pago_real = p_fecha, updated_at = NOW()
    WHERE legalizacion_id = p_id AND estado_pago <> 'pagado';

    IF v_leg.user_id <> auth.uid() THEN
        PERFORM legalizacion_notificar_usuario(v_leg.user_id, 'Legalización cerrada',
            'Tu legalización ' || v_leg.numero || ' quedó cerrada', jsonb_build_object('legalizacion_id', p_id));
    END IF;
END;
$$;

-- Si pagan desde CXP todos los gastos de una legalización, esta se cierra sola.
CREATE OR REPLACE FUNCTION public.legalizacion_sync_pago_gasto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM gastos WHERE legalizacion_id = NEW.legalizacion_id AND estado_pago <> 'pagado'
    ) THEN
        UPDATE legalizaciones SET status = 'cerrada', cerrado_at = NOW()
        WHERE id = NEW.legalizacion_id AND status = 'aprobada' AND saldo_empresa = 0;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS gastos_legalizacion_pago ON public.gastos;
CREATE TRIGGER gastos_legalizacion_pago AFTER UPDATE OF estado_pago ON public.gastos
    FOR EACH ROW WHEN (NEW.legalizacion_id IS NOT NULL AND NEW.estado_pago = 'pagado')
    EXECUTE FUNCTION public.legalizacion_sync_pago_gasto();

-- 9. FLUJO DE ANTICIPOS
CREATE OR REPLACE FUNCTION public.anticipo_notificar_solicitud()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM legalizacion_notificar_aprobadores(
        'Anticipo por aprobar',
        NEW.numero || ' de ' || NEW.beneficiario_nombre || ' está pendiente de aprobación',
        jsonb_build_object('anticipo_id', NEW.id)
    );
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS anticipos_notificar ON public.anticipos;
CREATE TRIGGER anticipos_notificar AFTER INSERT ON public.anticipos
    FOR EACH ROW EXECUTE FUNCTION public.anticipo_notificar_solicitud();

CREATE OR REPLACE FUNCTION public.anticipo_decidir(p_id UUID, p_aprobar BOOLEAN, p_motivo TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ant anticipos%ROWTYPE;
    v_nombre TEXT;
    v_rol TEXT;
BEGIN
    PERFORM legalizacion_requiere_aprobador();

    SELECT * INTO v_ant FROM anticipos WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Anticipo no encontrado'; END IF;
    IF v_ant.status <> 'solicitado' THEN
        RAISE EXCEPTION 'Este anticipo ya fue tramitado';
    END IF;

    SELECT COALESCE(NULLIF(trim(full_name), ''), email), role::TEXT INTO v_nombre, v_rol FROM profiles WHERE id = auth.uid();
    IF v_ant.user_id = auth.uid() AND v_rol <> 'admin' THEN
        RAISE EXCEPTION 'No puedes aprobar tu propio anticipo';
    END IF;
    IF NOT p_aprobar AND COALESCE(trim(p_motivo), '') = '' THEN
        RAISE EXCEPTION 'Indica el motivo del rechazo';
    END IF;

    UPDATE anticipos SET
        status = CASE WHEN p_aprobar THEN 'aprobado' ELSE 'rechazado' END,
        motivo_rechazo = CASE WHEN p_aprobar THEN NULL ELSE trim(p_motivo) END,
        aprobado_por = auth.uid(),
        aprobado_por_nombre = v_nombre,
        aprobado_at = NOW()
    WHERE id = p_id;

    IF v_ant.user_id <> auth.uid() THEN
        PERFORM legalizacion_notificar_usuario(v_ant.user_id,
            CASE WHEN p_aprobar THEN 'Anticipo aprobado' ELSE 'Anticipo rechazado' END,
            'Tu anticipo ' || v_ant.numero || CASE WHEN p_aprobar THEN ' fue aprobado' ELSE ' fue rechazado: ' || trim(p_motivo) END,
            jsonb_build_object('anticipo_id', p_id));
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.anticipo_marcar_pagado(p_id UUID, p_fecha DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ant anticipos%ROWTYPE;
BEGIN
    PERFORM legalizacion_requiere_aprobador();
    IF p_fecha IS NULL THEN RAISE EXCEPTION 'Indica la fecha de pago'; END IF;

    SELECT * INTO v_ant FROM anticipos WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Anticipo no encontrado'; END IF;
    IF v_ant.status <> 'aprobado' THEN
        RAISE EXCEPTION 'Solo se pueden pagar anticipos aprobados';
    END IF;

    UPDATE anticipos SET status = 'pagado', fecha_pago = p_fecha WHERE id = p_id;

    IF v_ant.user_id <> auth.uid() THEN
        PERFORM legalizacion_notificar_usuario(v_ant.user_id, 'Anticipo pagado',
            'Tu anticipo ' || v_ant.numero || ' fue pagado. Recuerda legalizarlo con sus soportes.',
            jsonb_build_object('anticipo_id', p_id));
    END IF;
END;
$$;

-- 10. PRIVILEGIOS: solo las acciones del flujo son invocables desde la app.
REVOKE ALL ON FUNCTION public.legalizacion_notificar_aprobadores(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.legalizacion_notificar_usuario(UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.legalizacion_requiere_aprobador() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.legalizacion_crear_gasto(legalizaciones, legalizacion_items, NUMERIC, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.legalizacion_enviar(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.legalizacion_aprobar(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.legalizacion_rechazar(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.legalizacion_cerrar(UUID, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.anticipo_decidir(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.anticipo_marcar_pagado(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.legalizacion_enviar(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.legalizacion_aprobar(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.legalizacion_rechazar(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.legalizacion_cerrar(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.anticipo_decidir(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.anticipo_marcar_pagado(UUID, DATE) TO authenticated;

-- 11. DATOS INICIALES
-- Categorías cortas del formato. `valor` apunta a categorias_gasto para que los
-- reportes de Finanzas agrupen estos gastos junto con los demás.
INSERT INTO public.parametros (categoria, valor, etiqueta, orden)
SELECT 'categorias_legalizacion', v.valor, v.etiqueta, v.orden
FROM (VALUES
    ('alimentacion', 'Alimentación', 1),
    ('transporte_terrestre', 'Transporte', 2),
    ('transporte_aereo', 'Transporte aéreo', 3),
    ('alojamiento', 'Hospedaje', 4),
    ('viaticos', 'Viáticos', 5),
    ('transporte_carga', 'Envíos y mensajería', 6),
    ('reintegros', 'Otros', 7)
) AS v(valor, etiqueta, orden)
WHERE NOT EXISTS (
    SELECT 1 FROM public.parametros p WHERE p.categoria = 'categorias_legalizacion' AND p.valor = v.valor
);

-- Roles listos para que el admin los asigne a quien corresponda.
INSERT INTO public.app_roles (name, description, permissions)
VALUES
    ('Legalización de Gastos', 'Registra sus propias legalizaciones, reintegros y anticipos', '["legalizaciones.view"]'::jsonb),
    ('Aprobador de Legalizaciones', 'Ve todas las legalizaciones y anticipos, los aprueba y registra su pago', '["legalizaciones.view", "legalizaciones.view_all", "legalizaciones.approve"]'::jsonb)
ON CONFLICT (name) DO NOTHING;
