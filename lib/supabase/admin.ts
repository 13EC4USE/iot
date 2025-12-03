import { createClient } from '@supabase/supabase-js'

/**
 * Create a server-side Supabase client using the Service Role Key.
 * This client has elevated privileges and MUST only be used on the server.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase URL or Service Role Key for admin client')
  }

  return createClient(url, key)
}
