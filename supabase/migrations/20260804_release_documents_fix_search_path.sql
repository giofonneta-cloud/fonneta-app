-- Fija search_path en las funciones de release_documents para evitar el
-- warning de seguridad "function_search_path_mutable" del linter de Supabase.
CREATE OR REPLACE FUNCTION public.update_release_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.generate_release_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE current_year INTEGER; current_month INTEGER; next_seq INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    current_month := EXTRACT(MONTH FROM NOW())::INTEGER;

    SELECT COALESCE(MAX(release_sequence), 0) + 1 INTO next_seq
    FROM public.release_documents
    WHERE tipo_release = NEW.tipo_release
      AND release_year = current_year
      AND release_month = current_month;

    NEW.release_year := current_year;
    NEW.release_month := current_month;
    NEW.release_sequence := next_seq;
    NEW.release_number := 'RELEASE-' || UPPER(NEW.tipo_release)
        || current_year::TEXT || LPAD(current_month::TEXT, 2, '0')
        || '-' || LPAD(next_seq::TEXT, 2, '0');
    RETURN NEW;
END;
$$;
