import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses Row Level Security — use ONLY for
 * trusted server-side operations that explicitly need to cross workspace
 * boundaries (e.g. processing an invite before the invitee is a member).
 *
 * Never import this file from a Client Component. The `server-only` import
 * above will throw a build error if that happens.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
