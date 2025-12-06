-- Check if user exists in auth.users and public.users
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created,
  pu.id as profile_id,
  pu.email as profile_email,
  pu.full_name,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'foolkzaza@gmail.com';

-- If user exists in auth.users but not in public.users, add them:
-- INSERT INTO public.users (id, email, full_name, role)
-- SELECT id, email, raw_user_meta_data->>'full_name', 'user'
-- FROM auth.users
-- WHERE email = 'foolkzaza@gmail.com'
-- ON CONFLICT (id) DO NOTHING;

-- If email is not confirmed, confirm it:
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'foolkzaza@gmail.com' AND email_confirmed_at IS NULL;
