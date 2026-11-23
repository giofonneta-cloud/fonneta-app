-- Función de trigger nueva (numeración de anticipos/legalizaciones): no es un RPC
REVOKE EXECUTE ON FUNCTION public.legalizacion_generar_numero() FROM PUBLIC, anon, authenticated;

-- Las funciones que se creen a partir de ahora ya no quedan ejecutables por `anon`.
-- (Las que necesiten authenticated/service_role siguen heredando esos permisos.)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
