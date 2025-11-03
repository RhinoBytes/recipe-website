import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY is not configured");
}

log.info(
  { keyLength: process.env.SUPABASE_SERVICE_KEY?.length },
  "Supabase service key configured"
);

/**
 * Supabase client for server-side operations
 * Uses the service role key which bypasses Row Level Security
 * Use with caution - only for trusted server-side operations
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
