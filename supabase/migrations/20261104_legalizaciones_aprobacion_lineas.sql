-- Aprobación por línea. La legalización se aprueba (y crea los gastos) cuando todas
-- sus líneas están aprobadas; las aprobadas quedan bloqueadas para el dueño.
ALTER TABLE public.legalizacion_items
    ADD COLUMN IF NOT EXISTS revision_estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (revision_estado IN ('pendiente', 'aprobada', 'observada'));

-- El dueño nunca puede decidir el estado de revisión ni tocar líneas aprobadas.
-- Las funciones del flujo (SECURITY DEFINER) no corren como authenticated, así que pasan.
CREATE OR REPLACE FUNCTION public.legalizacion_items_proteger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_user NOT IN ('authenticated', 'anon') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.revision_estado := 'pendiente';
        NEW.observacion_revisor := NULL;
        RETURN NEW;
    END IF;

    IF OLD.revision_estado = 'aprobada' THEN
        RAISE EXCEPTION 'Las líneas aprobadas no se pueden modificar ni eliminar';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    NEW.observacion_revisor := OLD.observacion_revisor;
    NEW.revision_estado := OLD.revision_estado;
    IF OLD.revision_estado = 'observada' AND (
        NEW.fecha IS DISTINCT FROM OLD.fecha OR NEW.categoria IS DISTINCT FROM OLD.categoria
        OR NEW.establecimiento IS DISTINCT FROM OLD.establecimiento
        OR NEW.establecimiento_nit IS DISTINCT FROM OLD.establecimiento_nit
        OR NEW.numero_soporte IS DISTINCT FROM OLD.numero_soporte
        OR NEW.descripcion IS DISTINCT FROM OLD.descripcion OR NEW.comentario IS DISTINCT FROM OLD.comentario
        OR NEW.valor IS DISTINCT FROM OLD.valor OR NEW.soporte_url IS DISTINCT FROM OLD.soporte_url
    ) THEN
        NEW.revision_estado := 'pendiente';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS legalizacion_items_proteger ON public.legalizacion_items;
CREATE TRIGGER legalizacion_items_proteger
    BEFORE INSERT OR UPDATE OR DELETE ON public.legalizacion_items
    FOR EACH ROW EXECUTE FUNCTION public.legalizacion_items_proteger();

-- Al enviar, lo no aprobado vuelve a revisión (conserva el texto de la observación anterior).
CREATE OR REPLACE FUNCTION public.legalizacion_reiniciar_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'enviada' AND OLD.status IN ('borrador', 'rechazada') THEN
        UPDATE legalizacion_items SET revision_estado = 'pendiente'
        WHERE legalizacion_id = NEW.id AND revision_estado <> 'aprobada';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS legalizaciones_reiniciar_revision ON public.legalizaciones;
CREATE TRIGGER legalizaciones_reiniciar_revision
    AFTER UPDATE OF status ON public.legalizaciones
    FOR EACH ROW EXECUTE FUNCTION public.legalizacion_reiniciar_revision();

DROP FUNCTION IF EXISTS public.legalizacion_rechazar(UUID, TEXT, JSONB);

-- p_aprobadas: ids de líneas aprobadas. p_observaciones: [{"item_id": "...", "observacion": "..."}].
-- Con todas las líneas aprobadas se aprueba la legalización; si no, se devuelve.
CREATE OR REPLACE FUNCTION public.legalizacion_revisar(
    p_id UUID, p_aprobadas UUID[], p_observaciones JSONB, p_motivo TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leg legalizaciones%ROWTYPE;
    v_obs JSONB;
    v_aprobadas UUID[] := COALESCE(p_aprobadas, '{}');
    v_count INT := 0;
    v_n INT;
    v_rol TEXT;
    v_pendientes INT;
    v_motivo TEXT := NULLIF(trim(COALESCE(p_motivo, '')), '');
BEGIN
    PERFORM legalizacion_requiere_aprobador();

    IF p_observaciones IS NULL OR jsonb_typeof(p_observaciones) <> 'array' THEN
        RAISE EXCEPTION 'Las observaciones por línea no son válidas';
    END IF;

    SELECT * INTO v_leg FROM legalizaciones WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Legalización no encontrada'; END IF;
    IF v_leg.status <> 'enviada' THEN
        RAISE EXCEPTION 'Solo se pueden revisar legalizaciones enviadas';
    END IF;

    SELECT role::TEXT INTO v_rol FROM profiles WHERE id = auth.uid();
    IF v_leg.user_id = auth.uid() AND v_rol <> 'admin' THEN
        RAISE EXCEPTION 'No puedes revisar tu propia legalización';
    END IF;

    UPDATE legalizacion_items SET revision_estado = 'aprobada', observacion_revisor = NULL
    WHERE legalizacion_id = p_id AND id = ANY(v_aprobadas);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n <> COALESCE(array_length(v_aprobadas, 1), 0) THEN
        RAISE EXCEPTION 'Una de las líneas aprobadas no pertenece a esta legalización';
    END IF;

    FOR v_obs IN SELECT * FROM jsonb_array_elements(p_observaciones) LOOP
        IF COALESCE(trim(v_obs->>'observacion'), '') = '' THEN
            RAISE EXCEPTION 'Escribe la observación de cada línea marcada';
        END IF;
        IF (v_obs->>'item_id')::UUID = ANY(v_aprobadas) THEN
            RAISE EXCEPTION 'Una línea no puede estar aprobada y observada a la vez';
        END IF;
        UPDATE legalizacion_items SET revision_estado = 'observada', observacion_revisor = trim(v_obs->>'observacion')
        WHERE id = (v_obs->>'item_id')::UUID AND legalizacion_id = p_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Una de las líneas marcadas no pertenece a esta legalización';
        END IF;
        v_count := v_count + 1;
    END LOOP;

    SELECT count(*) INTO v_pendientes FROM legalizacion_items
    WHERE legalizacion_id = p_id AND revision_estado <> 'aprobada';

    IF v_pendientes = 0 THEN
        PERFORM legalizacion_aprobar(p_id);
        RETURN;
    END IF;

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

REVOKE ALL ON FUNCTION public.legalizacion_revisar(UUID, UUID[], JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.legalizacion_revisar(UUID, UUID[], JSONB, TEXT) TO authenticated;
