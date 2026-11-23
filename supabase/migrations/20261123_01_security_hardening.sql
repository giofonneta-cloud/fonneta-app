-- =====================================================================
-- PRP-001 Fase 1: endurecimiento de seguridad (compatible con el código actual)
-- Hallazgos que corrige: H6 (profiles/role), H7 (provider_documents público),
-- H8 (vista SECURITY DEFINER), H11 (funciones ejecutables por anon / search_path)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helpers de autorización (SECURITY DEFINER, search_path fijo)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text IN ('admin', 'pm', 'administrativo')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 1. provider_documents: eliminar políticas públicas (CRUD anónimo)
--    Queda "Staff or provider owner can manage docs".
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS provider_docs_select_public ON public.provider_documents;
DROP POLICY IF EXISTS provider_docs_insert_public ON public.provider_documents;
DROP POLICY IF EXISTS provider_docs_update_public ON public.provider_documents;
DROP POLICY IF EXISTS provider_docs_delete_public ON public.provider_documents;

-- ---------------------------------------------------------------------
-- 2. Vista de gastos: debe respetar RLS del usuario que consulta
-- ---------------------------------------------------------------------
ALTER VIEW public.gastos_con_entregables SET (security_invoker = true);

-- ---------------------------------------------------------------------
-- 3. profiles: cierre de lectura pública y bloqueo de escalada de rol
-- ---------------------------------------------------------------------
-- Menor privilegio por defecto (antes: 'pm')
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'proveedor';

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

DROP POLICY IF EXISTS profiles_select_staff ON public.profiles;
CREATE POLICY profiles_select_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR public.user_has_permission('users.view')
    OR public.user_has_permission('legalizaciones.view_all')
  );
-- (se conserva "Users can view own profile" y "Users can update own profile")

CREATE OR REPLACE FUNCTION public.profiles_protect_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo aplica a llamadas desde la API (anon/authenticated). service_role y SQL
  -- directo (migraciones, dashboard) quedan fuera.
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'proveedor';
      NEW.is_active := true;
      NEW.approval_limit_expenses := NULL;
      NEW.approval_limit_sales := NULL;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.approval_limit_expenses IS DISTINCT FROM OLD.approval_limit_expenses
       OR NEW.approval_limit_sales IS DISTINCT FROM OLD.approval_limit_sales THEN
      RAISE EXCEPTION 'No autorizado para modificar campos privilegiados del perfil'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_protect_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_privileged_columns();

-- ---------------------------------------------------------------------
-- 4. Funciones SECURITY DEFINER: nadie anónimo las ejecuta
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

-- Funciones de trigger / internas: no deben exponerse como RPC a usuarios
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'anticipo_notificar_solicitud', 'generate_radicado_number', 'handle_new_server',
      'handle_new_user', 'legalizacion_reiniciar_revision', 'legalizacion_sync_pago_gasto',
      'legalizacion_crear_gasto', 'legalizacion_notificar_aprobadores',
      'legalizacion_notificar_usuario', 'legalizacion_requiere_aprobador',
      'get_user_email_by_document', 'profiles_protect_privileged_columns'
    )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
  END LOOP;
END $$;

-- search_path fijo en funciones que lo tenían mutable
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN
      ('update_quotes_updated_at', 'generate_quote_number', 'legalizacion_items_proteger')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- update_task_status no validaba al llamante: solo personal interno
CREATE OR REPLACE FUNCTION public.update_task_status(p_task_id uuid, p_new_status text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_task RECORD;
    v_completed_at TIMESTAMPTZ;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_staff() THEN
        RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
    END IF;

    IF p_new_status NOT IN ('todo', 'in_progress', 'review', 'done') THEN
        RAISE EXCEPTION 'Estado inválido: %. Valores permitidos: todo, in_progress, review, done', p_new_status;
    END IF;

    SELECT * INTO v_task
    FROM project_tasks
    WHERE id = p_task_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tarea no encontrada';
    END IF;

    IF p_new_status = 'done' AND v_task.status != 'done' THEN
        v_completed_at := NOW();
    ELSIF p_new_status != 'done' THEN
        v_completed_at := NULL;
    ELSE
        v_completed_at := v_task.completed_at;
    END IF;

    UPDATE project_tasks
    SET
        status = p_new_status,
        completed_at = v_completed_at,
        updated_at = NOW()
    WHERE id = p_task_id;

    RETURN jsonb_build_object(
        'success', true,
        'task_id', p_task_id,
        'old_status', v_task.status,
        'new_status', p_new_status,
        'completed_at', v_completed_at
    );
END;
$function$;
