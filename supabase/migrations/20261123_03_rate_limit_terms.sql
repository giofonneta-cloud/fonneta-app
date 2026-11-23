-- =====================================================================
-- PRP-001: rate limiting persistente (compartido entre instancias serverless)
-- y registro de aceptación de Términos / Política de datos.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits         integer     NOT NULL DEFAULT 0
);

-- RLS activado sin políticas: nadie vía API REST; solo service_role (bypass)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;

-- Devuelve true si la petición está dentro del límite de la ventana.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hits integer;
BEGIN
  INSERT INTO public.api_rate_limits AS rl (key, window_start, hits)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
                THEN 1 ELSE rl.hits + 1 END,
    window_start = CASE WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
                THEN now() ELSE rl.window_start END
  RETURNING hits INTO v_hits;

  -- Limpieza oportunista de ventanas viejas
  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN v_hits <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;

-- Evidencia de aceptación de Términos de uso y Política de datos
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;
