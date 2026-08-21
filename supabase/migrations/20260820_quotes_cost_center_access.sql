-- =============================================
-- Seguridad de Cotizaciones por Centro de Costo
-- - quotes.view_all: ve y gestiona todas las cotizaciones (admin / roles con ese permiso)
-- - quotes.view (sin view_all): solo ve/crea cotizaciones de los centros de costo
--   que el admin le haya habilitado en quote_cost_center_access, más las que él
--   mismo creó (fallback si aún no tiene ningún centro de costo asignado)
-- =============================================

-- 1. Helper: ¿el usuario actual tiene un permiso granular? (admin = bypass total,
--    igual que el resto de la app en useAuthStore/authPermissionService)
CREATE OR REPLACE FUNCTION public.user_has_permission(check_permission text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1
      FROM user_app_roles uar
      JOIN app_roles ar ON ar.id = uar.role_id
      WHERE uar.user_id = auth.uid()
        AND ar.permissions @> to_jsonb(ARRAY[check_permission])
    );
$$;

-- 2. Tabla de accesos por centro de costo (gestionada por el admin)
CREATE TABLE IF NOT EXISTS public.quote_cost_center_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cost_center TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, cost_center)
);

CREATE INDEX IF NOT EXISTS idx_quote_cca_user ON public.quote_cost_center_access(user_id);

ALTER TABLE public.quote_cost_center_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote_cca_select" ON public.quote_cost_center_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.user_has_permission('quotes.view_all'));

CREATE POLICY "quote_cca_manage" ON public.quote_cost_center_access FOR ALL TO authenticated
  USING (public.user_has_permission('quotes.view_all'))
  WITH CHECK (public.user_has_permission('quotes.view_all'));

-- 3. Helper: ¿el usuario actual puede operar sobre este centro de costo?
CREATE OR REPLACE FUNCTION public.user_can_access_cost_center(check_cost_center text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    public.user_has_permission('quotes.view_all')
    OR EXISTS (
      SELECT 1 FROM quote_cost_center_access
      WHERE user_id = auth.uid() AND cost_center = check_cost_center
    );
$$;

-- 4. created_by se autocompleta con el usuario autenticado (no lo envía el cliente)
ALTER TABLE public.quotes ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 5. Reemplazar la policy abierta de quotes por policies granulares
DROP POLICY IF EXISTS "Authenticated users can manage quotes" ON public.quotes;

CREATE POLICY "quotes_select" ON public.quotes FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.user_has_permission('quotes.view_all')
    OR (cost_center IS NOT NULL AND public.user_can_access_cost_center(cost_center))
  );

CREATE POLICY "quotes_insert" ON public.quotes FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.user_has_permission('quotes.create')
    AND (cost_center IS NULL OR public.user_can_access_cost_center(cost_center))
  );

CREATE POLICY "quotes_update" ON public.quotes FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.user_has_permission('quotes.view_all')
    OR (cost_center IS NOT NULL AND public.user_can_access_cost_center(cost_center))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.user_has_permission('quotes.view_all')
    OR (cost_center IS NOT NULL AND public.user_can_access_cost_center(cost_center))
  );

CREATE POLICY "quotes_delete" ON public.quotes FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.user_has_permission('quotes.view_all')
  );

-- 6. Reemplazar la policy abierta de quote_items: sigue el acceso del quote padre
DROP POLICY IF EXISTS "Authenticated users can manage po_items" ON public.quote_items;
DROP POLICY IF EXISTS "Authenticated users can manage quote_items" ON public.quote_items;

CREATE POLICY "quote_items_select" ON public.quote_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quotes q WHERE q.id = quote_items.quote_id
    AND (
      q.created_by = auth.uid()
      OR public.user_has_permission('quotes.view_all')
      OR (q.cost_center IS NOT NULL AND public.user_can_access_cost_center(q.cost_center))
    )
  ));

CREATE POLICY "quote_items_write" ON public.quote_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quotes q WHERE q.id = quote_items.quote_id
    AND (
      q.created_by = auth.uid()
      OR public.user_has_permission('quotes.view_all')
      OR (q.cost_center IS NOT NULL AND public.user_can_access_cost_center(q.cost_center))
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM quotes q WHERE q.id = quote_items.quote_id
    AND (
      q.created_by = auth.uid()
      OR public.user_has_permission('quotes.view_all')
      OR (q.cost_center IS NOT NULL AND public.user_can_access_cost_center(q.cost_center))
    )
  ));
