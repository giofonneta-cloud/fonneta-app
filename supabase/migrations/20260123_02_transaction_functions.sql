-- ============================================
-- MIGRACIÓN: Funciones Transaccionales
-- Fecha: 2026-01-23
-- Descripción: Funciones PostgreSQL con transacciones atómicas
-- ============================================

-- ============================================
-- FUNCIÓN: Crear gasto con entregables (atómico)
-- ============================================
CREATE OR REPLACE FUNCTION create_gasto_with_entregables(
    p_gasto JSONB,
    p_entregables JSONB[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_gasto_id UUID;
    v_entregable JSONB;
    v_result JSONB;
    v_iva_valor DECIMAL;
    v_total DECIMAL;
BEGIN
    -- Calcular IVA y total
    v_iva_valor := (p_gasto->>'valor_neto')::DECIMAL * COALESCE((p_gasto->>'iva_porcentaje')::DECIMAL, 19) / 100;
    v_total := (p_gasto->>'valor_neto')::DECIMAL + v_iva_valor;

    -- 1. Insertar gasto
    INSERT INTO gastos (
        proyecto_id,
        proveedor_id,
        valor_neto,
        iva_porcentaje,
        iva_valor,
        total_con_iva,
        categoria,
        codigo_oc,
        observaciones
    )
    VALUES (
        NULLIF(p_gasto->>'proyecto_id', '')::UUID,
        (p_gasto->>'proveedor_id')::UUID,
        (p_gasto->>'valor_neto')::DECIMAL,
        COALESCE((p_gasto->>'iva_porcentaje')::DECIMAL, 19),
        v_iva_valor,
        v_total,
        p_gasto->>'categoria',
        p_gasto->>'codigo_oc',
        p_gasto->>'observaciones'
    )
    RETURNING id INTO v_gasto_id;

    -- 2. Insertar entregables (si existen)
    IF p_entregables IS NOT NULL AND array_length(p_entregables, 1) > 0 THEN
        FOREACH v_entregable IN ARRAY p_entregables
        LOOP
            INSERT INTO gasto_entregables (
                gasto_id,
                nombre,
                fecha_entrega_comprometida,
                estado
            )
            VALUES (
                v_gasto_id,
                v_entregable->>'nombre',
                NULLIF(v_entregable->>'fecha_entrega_comprometida', '')::DATE,
                COALESCE(v_entregable->>'estado', 'pendiente')
            );
        END LOOP;
    END IF;

    -- 3. Retornar gasto completo con entregables
    SELECT jsonb_build_object(
        'id', g.id,
        'proyecto_id', g.proyecto_id,
        'proveedor_id', g.proveedor_id,
        'valor_neto', g.valor_neto,
        'iva_valor', g.iva_valor,
        'total_con_iva', g.total_con_iva,
        'categoria', g.categoria,
        'created_at', g.created_at,
        'entregables', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', e.id,
                'nombre', e.nombre,
                'fecha_entrega_comprometida', e.fecha_entrega_comprometida,
                'estado', e.estado
            )) FROM gasto_entregables e WHERE e.gasto_id = g.id),
            '[]'::jsonb
        )
    )
    INTO v_result
    FROM gastos g
    WHERE g.id = v_gasto_id;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Rollback automático y re-lanzar error con contexto
    RAISE EXCEPTION 'Error creando gasto: %', SQLERRM;
END;
$$;

-- ============================================
-- FUNCIÓN: Registrar pago de venta (atómico con bloqueo)
-- ============================================
CREATE OR REPLACE FUNCTION registrar_pago_venta(
    p_venta_id UUID,
    p_monto_pago DECIMAL,
    p_fecha_pago DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta RECORD;
    v_total DECIMAL;
    v_nuevo_pagado DECIMAL;
    v_nuevo_estado TEXT;
BEGIN
    -- Validar monto
    IF p_monto_pago <= 0 THEN
        RAISE EXCEPTION 'El monto de pago debe ser positivo';
    END IF;

    -- Obtener venta actual con bloqueo para evitar race conditions
    SELECT * INTO v_venta
    FROM ventas
    WHERE id = p_venta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta no encontrada: %', p_venta_id;
    END IF;

    -- Calcular nuevo total pagado
    v_total := COALESCE(v_venta.total_con_iva, v_venta.valor_venta_neto);
    v_nuevo_pagado := COALESCE(v_venta.valor_pagado, 0) + p_monto_pago;

    -- Determinar nuevo estado
    IF v_nuevo_pagado >= v_total THEN
        v_nuevo_estado := 'pagado';
        v_nuevo_pagado := v_total; -- No exceder el total
    ELSIF v_nuevo_pagado > 0 THEN
        v_nuevo_estado := 'parcial';
    ELSE
        v_nuevo_estado := 'pendiente';
    END IF;

    -- Actualizar venta
    UPDATE ventas
    SET
        valor_pagado = v_nuevo_pagado,
        fecha_pago_real = p_fecha_pago,
        estado_pago = v_nuevo_estado,
        updated_at = NOW()
    WHERE id = p_venta_id;

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'venta_id', p_venta_id,
        'monto_pagado', p_monto_pago,
        'total_pagado', v_nuevo_pagado,
        'total_factura', v_total,
        'estado_pago', v_nuevo_estado,
        'pendiente', GREATEST(v_total - v_nuevo_pagado, 0)
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error registrando pago: %', SQLERRM;
END;
$$;

-- ============================================
-- FUNCIÓN: Completar proyecto (con validaciones)
-- ============================================
CREATE OR REPLACE FUNCTION completar_proyecto(
    p_project_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project RECORD;
    v_task_count INTEGER;
    v_pending_tasks INTEGER;
    v_total_ventas DECIMAL;
    v_total_gastos DECIMAL;
    v_margen_presupuestado DECIMAL;
    v_margen_real DECIMAL;
    v_desviacion DECIMAL;
BEGIN
    -- 1. Obtener proyecto con bloqueo
    SELECT * INTO v_project
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proyecto no encontrado';
    END IF;

    IF v_project.status = 'completado' THEN
        RAISE EXCEPTION 'El proyecto ya está completado';
    END IF;

    -- 2. Contar tareas
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status != 'done')
    INTO v_task_count, v_pending_tasks
    FROM project_tasks
    WHERE project_id = p_project_id AND parent_task_id IS NULL;

    -- Validar que hay tareas (opcional - comentar si no se requiere)
    -- IF v_task_count = 0 THEN
    --     RAISE EXCEPTION 'El proyecto debe tener al menos una tarea';
    -- END IF;

    IF v_pending_tasks > 0 THEN
        RAISE EXCEPTION 'Hay % tarea(s) sin completar. Complete todas las tareas antes de cerrar el proyecto.', v_pending_tasks;
    END IF;

    -- 3. Calcular totales financieros
    SELECT COALESCE(SUM(total_con_iva), 0) INTO v_total_ventas
    FROM ventas WHERE proyecto_id = p_project_id;

    SELECT COALESCE(SUM(total_con_iva), 0) INTO v_total_gastos
    FROM gastos WHERE proyecto_id = p_project_id;

    -- 4. Calcular márgenes
    -- Margen presupuestado
    IF v_project.budget_income > 0 THEN
        v_margen_presupuestado := ((v_project.budget_income - COALESCE(v_project.budget_expense, 0)) / v_project.budget_income) * 100;
    ELSE
        v_margen_presupuestado := 0;
    END IF;

    -- Margen real
    IF v_total_ventas > 0 THEN
        v_margen_real := ((v_total_ventas - v_total_gastos) / v_total_ventas) * 100;
    ELSE
        v_margen_real := 0;
    END IF;

    -- Desviación
    v_desviacion := v_margen_real - v_margen_presupuestado;

    -- 5. Actualizar proyecto
    UPDATE projects
    SET
        status = 'completado',
        updated_at = NOW()
    WHERE id = p_project_id;

    -- 6. Retornar resumen
    RETURN jsonb_build_object(
        'success', true,
        'project_id', p_project_id,
        'project_name', v_project.name,
        'financials', jsonb_build_object(
            'total_ventas', v_total_ventas,
            'total_gastos', v_total_gastos,
            'utilidad', v_total_ventas - v_total_gastos,
            'margen_presupuestado', ROUND(v_margen_presupuestado, 2),
            'margen_real', ROUND(v_margen_real, 2),
            'desviacion', ROUND(v_desviacion, 2)
        ),
        'tasks', jsonb_build_object(
            'total', v_task_count,
            'completed', v_task_count - v_pending_tasks
        ),
        'completed_at', NOW(),
        'completed_by', p_user_id
    );

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================
-- FUNCIÓN: Crear venta con cálculos automáticos
-- ============================================
CREATE OR REPLACE FUNCTION create_venta_calculada(
    p_venta JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta_id UUID;
    v_valor_neto DECIMAL;
    v_iva_porcentaje DECIMAL;
    v_iva_valor DECIMAL;
    v_total DECIMAL;
    v_comision_valor DECIMAL;
    v_result JSONB;
BEGIN
    -- Extraer y calcular valores
    v_valor_neto := (p_venta->>'valor_venta_neto')::DECIMAL;
    v_iva_porcentaje := COALESCE((p_venta->>'iva_porcentaje')::DECIMAL, 19);
    v_iva_valor := v_valor_neto * (v_iva_porcentaje / 100);
    v_total := v_valor_neto + v_iva_valor;

    -- Calcular comisión si aplica
    IF (p_venta->>'tiene_comision')::BOOLEAN = true THEN
        v_comision_valor := v_valor_neto * COALESCE((p_venta->>'porcentaje_comision')::DECIMAL, 0) / 100;
    ELSE
        v_comision_valor := 0;
    END IF;

    -- Insertar venta
    INSERT INTO ventas (
        proyecto_id,
        valor_venta_neto,
        iva_porcentaje,
        iva_valor,
        total_con_iva,
        estado_oc,
        numero_oc,
        numero_factura,
        fecha_factura,
        plazo_pago_dias,
        fecha_cobro_estimada,
        porcentaje_comision,
        valor_comision,
        responsable_comision_id,
        notas_internas,
        estado_pago
    )
    VALUES (
        (p_venta->>'proyecto_id')::UUID,
        v_valor_neto,
        v_iva_porcentaje,
        v_iva_valor,
        v_total,
        COALESCE(p_venta->>'estado_oc', 'facturar_sin_oc'),
        p_venta->>'numero_oc',
        p_venta->>'numero_factura',
        NULLIF(p_venta->>'fecha_factura', '')::DATE,
        COALESCE((p_venta->>'plazo_pago_dias')::INTEGER, 30),
        CASE
            WHEN (p_venta->>'fecha_factura') IS NOT NULL
            THEN (p_venta->>'fecha_factura')::DATE + COALESCE((p_venta->>'plazo_pago_dias')::INTEGER, 30)
            ELSE NULL
        END,
        COALESCE((p_venta->>'porcentaje_comision')::DECIMAL, 0),
        v_comision_valor,
        NULLIF(p_venta->>'responsable_comision_id', '')::UUID,
        p_venta->>'notas_internas',
        'pendiente'
    )
    RETURNING id INTO v_venta_id;

    -- Retornar venta creada
    SELECT row_to_json(v)::jsonb INTO v_result
    FROM ventas v
    WHERE v.id = v_venta_id;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creando venta: %', SQLERRM;
END;
$$;

-- ============================================
-- FUNCIÓN: Actualizar estado de tarea con timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_task_status(
    p_task_id UUID,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task RECORD;
    v_completed_at TIMESTAMPTZ;
BEGIN
    -- Validar status
    IF p_new_status NOT IN ('todo', 'in_progress', 'review', 'done') THEN
        RAISE EXCEPTION 'Estado inválido: %. Valores permitidos: todo, in_progress, review, done', p_new_status;
    END IF;

    -- Obtener tarea actual
    SELECT * INTO v_task
    FROM project_tasks
    WHERE id = p_task_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tarea no encontrada';
    END IF;

    -- Determinar completed_at
    IF p_new_status = 'done' AND v_task.status != 'done' THEN
        v_completed_at := NOW();
    ELSIF p_new_status != 'done' THEN
        v_completed_at := NULL;
    ELSE
        v_completed_at := v_task.completed_at;
    END IF;

    -- Actualizar tarea
    UPDATE project_tasks
    SET
        status = p_new_status,
        completed_at = v_completed_at,
        updated_at = NOW()
    WHERE id = p_task_id;

    RETURN jsonb_build_object(
        'success', true,
        'task_id', p_task_id,
        'old_status', v_task.status,
        'new_status', p_new_status,
        'completed_at', v_completed_at
    );
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Funciones transaccionales creadas: create_gasto_with_entregables, registrar_pago_venta, completar_proyecto, create_venta_calculada, update_task_status';
END $$;
