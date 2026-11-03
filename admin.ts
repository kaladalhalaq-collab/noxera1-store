import { createClient } from "@supabase/supabase-js";

/** SERVER ONLY. Uses the service-role key, which bypasses RLS. Import only from route handlers. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
