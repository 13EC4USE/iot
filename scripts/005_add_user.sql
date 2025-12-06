-- Add new user to public.users table after creating in Supabase Auth
-- Replace 'YOUR_USER_ID' with the actual UUID from auth.users

-- Example: Insert user record (adjust the ID from Supabase Auth panel)
-- INSERT INTO public.users (id, email, full_name, role) 
-- VALUES (
--   'YOUR_USER_ID_FROM_AUTH_USERS',
--   'foolkzaza@gmail.com',
--   'Fool Kzaza',
--   'user'
-- );

-- Or use this to sync all auth.users to public.users automatically:
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email),
  'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
