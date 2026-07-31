import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && ANON);

let browserClient: SupabaseClient | null = null;

/** Returns null when env vars are absent — the app then runs local-only. */
export function supabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(URL!, ANON!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

/** Non-singleton server client for auth actions without session persistence pollution. */
export function supabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(URL!, ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Server-side client using the service role key (never exposed to the client). */
export function supabaseAdmin(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !serviceKey) return null;
  return createClient(URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server-side client that forwards the caller's `Authorization: Bearer <jwt>`
 * so Postgres row level security applies to every query.
 */
export function supabaseFromRequest(request: Request): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  return createClient(URL!, ANON!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
