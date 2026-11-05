-- Comentario opcional por línea de legalización (aclaraciones del beneficiario).
ALTER TABLE public.legalizacion_items ADD COLUMN IF NOT EXISTS comentario TEXT;

-- El comentario viaja al gasto de Finanzas dentro de observaciones.
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
        p_leg.numero || ' - ' || p_item.establecimiento || ' (' || to_char(p_item.fecha, 'DD/MM/YYYY') || '): ' || p_item.descripcion
            || COALESCE(' | Comentario: ' || NULLIF(trim(p_item.comentario), ''), ''),
        p_leg.cost_center
    );
$$;
