-- ============================================================================
-- SOLUTION: Server-side RPC function for profile creation
-- ============================================================================
-- This creates a function that runs with SECURITY DEFINER (elevated privileges)
-- so it can create profiles even when the client isn't authenticated yet.

-- STEP 1: Create the RPC function
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT '',
  user_role TEXT DEFAULT 'usuario'
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert the profile with elevated privileges
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (user_id, user_email, user_full_name, user_role, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'Profile created successfully'
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  SELECT json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  ) INTO result;
  
  RETURN result;
END;
$$;

-- STEP 2: Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user TO authenticated, anon;

-- STEP 3: Add comment
COMMENT ON FUNCTION public.create_profile_for_new_user IS 
  'Creates or updates a user profile with elevated privileges. Used as fallback when trigger fails during signup.';
