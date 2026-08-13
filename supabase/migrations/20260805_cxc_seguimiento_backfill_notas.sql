-- Backfill: migra las notas de seguimiento previas (ventas.notas_internas)
-- a la nueva bitácora unificada cxc_seguimiento como entradas tipo 'nota'.
-- Idempotente: no duplica si la nota ya fue migrada.
INSERT INTO public.cxc_seguimiento (venta_id, tipo, descripcion, fecha, es_automatico, test_mode)
SELECT v.id, 'nota', v.notas_internas, v.updated_at::date, false, false
FROM public.ventas v
WHERE v.notas_internas IS NOT NULL AND trim(v.notas_internas) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.cxc_seguimiento s
    WHERE s.venta_id = v.id AND s.tipo = 'nota' AND s.descripcion = v.notas_internas
  );
