-- =============================================
-- Continuidad de numeración de cotizaciones
-- La numeración manual previa de Fonneta llegó hasta COT074-2026,
-- así que la numeración automática del sistema debe continuar en COT075-2026.
-- Para años distintos a 2026 no aplica offset (arranca en 001 como siempre).
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE current_year INTEGER; next_seq INTEGER; base_offset INTEGER := 0;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    IF current_year = 2026 THEN
        base_offset := 74;
    END IF;
    SELECT GREATEST(COALESCE(MAX(quote_sequence), 0), base_offset) + 1 INTO next_seq
    FROM public.quotes WHERE quote_year = current_year;
    NEW.quote_year := current_year;
    NEW.quote_sequence := next_seq;
    NEW.quote_number := 'COT' || LPAD(next_seq::TEXT, 3, '0') || '-' || current_year::TEXT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
