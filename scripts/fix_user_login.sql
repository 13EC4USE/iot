-- Create user with email already confirmed (for development/testing)
-- Run this in Supabase SQL Editor

-- First, check if user already exists
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Try to get existing user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'foolkzaza@gmail.com';
  
  IF v_user_id IS NULL THEN
    -- User doesn't exist, this won't work in SQL - use Dashboard instead
    RAISE NOTICE 'User not found. Please create via Dashboard or signup page.';
  ELSE
    -- User exists, confirm email and ensure profile exists
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = v_user_id AND email_confirmed_at IS NULL;
    
    -- Ensure profile exists
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      v_user_id,
      'foolkzaza@gmail.com',
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id), 'User'),
      'user'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
    
    RAISE NOTICE 'User confirmed and profile synced: %', v_user_id;
  END IF;
END $$;
