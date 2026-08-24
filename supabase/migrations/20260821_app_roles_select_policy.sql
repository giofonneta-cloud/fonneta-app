-- =============================================
-- Fix: usuarios con un rol dinámico asignado no recibían sus permisos
-- - app_roles solo tenía una policy "Admins can manage app roles" (ALL,
--   admin-only). Un usuario no-admin con un rol asignado en user_app_roles
--   podía ver LA ASIGNACIÓN (esa policy sí existía), pero no podía leer
--   los permisos DEL ROL en sí vía el embed role:app_roles(*) usado en
--   authStore.fetchProfile(), porque RLS bloqueaba el SELECT en app_roles.
-- - Resultado: profile.permissions quedaba vacío para cualquier no-admin
--   sin importar qué rol tuviera asignado → hasPermission() siempre false.
-- - Los datos de app_roles (nombre/permisos de un rol) no son sensibles por
--   sí solos; lo sensible es QUIÉN tiene cada rol, ya protegido aparte en
--   user_app_roles. Se habilita lectura general para cualquier autenticado.
-- =============================================

CREATE POLICY "Authenticated users can view app_roles" ON public.app_roles FOR SELECT TO authenticated
  USING (true);
