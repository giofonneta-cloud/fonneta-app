-- Revisión por línea: el aprobador puede dejar una observación en cada línea al devolver.
ALTER TABLE public.legalizacion_items ADD COLUMN IF NOT EXISTS observacion_revisor TEXT;

DROP FUNCTION IF EXISTS public.legalizacion_rechazar(UUID, TEXT);

-- p_observaciones: [{"item_id": "<uuid>", "observacion": "texto"}]. Las líneas que no
-- aparezcan quedan sin observación (se limpian las de una revisión anterior).
CREATE OR REPLACE FUNCTION public.legalizacion_rechazar(p_id UUID, p_motivo TEXT, p_observaciones JSONB DEFAULT '[]'::jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leg legalizaciones%ROWTYPE;
    v_obs JSONB;
    v_count INT := 0;
    v_motivo TEXT := NULLIF(trim(COALESCE(p_motivo, '')), '');
BEGIN
    PERFORM legalizacion_requiere_aprobador();

    IF p_observaciones IS NULL OR jsonb_typeof(p_observaciones) <> 'array' THEN
        RAISE EXCEPTION 'Las observaciones por línea no son válidas';
    END IF;

    SELECT * INTO v_leg FROM legalizaciones WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Legalización no encontrada'; END IF;
    IF v_leg.status <> 'enviada' THEN
        RAISE EXCEPTION 'Solo se pueden devolver legalizaciones enviadas';
    END IF;

    UPDATE legalizacion_items SET observacion_revisor = NULL WHERE legalizacion_id = p_id;

    FOR v_obs IN SELECT * FROM jsonb_array_elements(p_observaciones) LOOP
        IF COALESCE(trim(v_obs->>'observacion'), '') = '' THEN
            RAISE EXCEPTION 'Escribe la observación de cada línea marcada';
        END IF;
        UPDATE legalizacion_items SET observacion_revisor = trim(v_obs->>'observacion')
        WHERE id = (v_obs->>'item_id')::UUID AND legalizacion_id = p_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Una de las líneas marcadas no pertenece a esta legalización';
        END IF;
        v_count := v_count + 1;
    END LOOP;

    IF v_count = 0 AND v_motivo IS NULL THEN
        RAISE EXCEPTION 'Marca al menos una línea con observación o indica un motivo general';
    END IF;

    v_motivo := COALESCE(v_motivo,
        'Se solicitaron ajustes en ' || v_count || CASE WHEN v_count = 1 THEN ' línea' ELSE ' líneas' END);

    UPDATE legalizaciones SET status = 'rechazada', motivo_rechazo = v_motivo WHERE id = p_id;

    IF v_leg.user_id <> auth.uid() THEN
        PERFORM legalizacion_notificar_usuario(v_leg.user_id, 'Legalización devuelta',
            'Tu legalización ' || v_leg.numero || ' fue devuelta: ' || v_motivo, jsonb_build_object('legalizacion_id', p_id));
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.legalizacion_rechazar(UUID, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.legalizacion_rechazar(UUID, TEXT, JSONB) TO authenticated;
