-- ============================================================================
-- COMPREHENSIVE FIX FOR PROFILES TABLE - RLS + TRIGGER
-- ============================================================================
-- This migration ensures that user profiles can be created both automatically
-- (via trigger) and manually (via frontend fallback) without RLS blocking.

-- STEP 1: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- STEP 2: Create comprehensive RLS policies
-- Allow users to INSERT their own profile (CRITICAL for fallback)
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- STEP 3: Create failsafe trigger function
-- This version catches ALL exceptions to prevent auth rollback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Wrap in exception handler to prevent transaction rollback
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, created_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      COALESCE(new.raw_user_meta_data->>'role', 'usuario'),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Profile creation failed in trigger: % %', SQLERRM, SQLSTATE;
  END;
  
  RETURN new;
END;
$$;

-- STEP 4: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO authenticated, service_role;
GRANT SELECT ON TABLE public.profiles TO anon;

-- STEP 6: Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STEP 7: Add helpful comment
COMMENT ON TABLE profiles IS 'User profiles with RLS. Users can insert/view/update their own profile. Trigger auto-creates on signup with exception handling.';
