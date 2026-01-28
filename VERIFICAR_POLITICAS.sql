-- ============================================================
-- VERIFICACIÓN RÁPIDA: ¿Qué políticas están activas?
-- ============================================================
-- Ejecuta en: https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new

SELECT
    policyname AS "Política",
    cmd AS "Comando"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'project_tasks'
ORDER BY cmd, policyname;

-- ============================================================
-- DEBERÍAS VER EXACTAMENTE 4 POLÍTICAS:
-- delete_authenticated | DELETE
-- insert_authenticated | INSERT
-- select_authenticated | SELECT
-- update_authenticated | UPDATE
--
-- Si ves otras políticas o nombres diferentes, las políticas
-- NO se aplicaron correctamente.
-- ============================================================
