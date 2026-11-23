-- La numeración debe ver TODAS las filas (no solo las del usuario por RLS), si no dos usuarios obtienen el mismo número.
CREATE OR REPLACE FUNCTION public.legalizacion_generar_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;
