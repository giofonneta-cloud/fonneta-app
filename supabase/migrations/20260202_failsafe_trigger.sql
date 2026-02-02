-- 1. Actualizar la funcion del trigger para que sea "A PRUEBA DE FALLOS"
-- Usamos un bloque BEGIN...EXCEPTION para asegurar que si falla el insert en profiles,
-- NO aborte la creacion del usuario en auth.users.
-- Esto permite que el frontend detecte la falta de perfil y use el fallback manual.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      COALESCE(new.raw_user_meta_data->>'role', 'usuario')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Si falla, lo ignoramos silenciosamente en la DB para que el usuario se cree.
    -- El frontend se encargara de crearlo manualmente.
    RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurarse que el trigger este activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Confirmar permisos (por si acaso)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
