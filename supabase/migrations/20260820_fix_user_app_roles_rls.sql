-- =============================================
-- Fix: asignación de roles desde la UI fallaba con 403 / 400
-- - user_app_roles.user_id no tenía FK a profiles → PostgREST no podía
--   resolver el embed profiles:user_id(...) usado por getUsersForRole()
-- - user_app_roles solo tenía policy de SELECT ("mis propios roles"), sin
--   INSERT/DELETE ni una policy que permitiera a un admin ver TODOS los
--   assignments (necesario para listar "quién tiene este rol")
-- - quote_cost_center_access.user_id tampoco tenía FK a profiles, mismo
--   problema para el embed usado en el panel de accesos por centro de costo
-- =============================================

ALTER TABLE public.user_app_roles
  ADD CONSTRAINT user_app_roles_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.quote_cost_center_access
  ADD CONSTRAINT quote_cost_center_access_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

CREATE POLICY "Admins can view all user_app_roles" ON public.user_app_roles FOR SELECT TO authenticated
  USING (public.user_has_permission('users.edit'));

CREATE POLICY "Admins can assign roles" ON public.user_app_roles FOR INSERT TO authenticated
  WITH CHECK (public.user_has_permission('users.edit'));

CREATE POLICY "Admins can remove role assignments" ON public.user_app_roles FOR DELETE TO authenticated
  USING (public.user_has_permission('users.edit'));
