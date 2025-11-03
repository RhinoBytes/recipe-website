import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || supabaseUrl === "https://your-project-ref.supabase.co") {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not configured. " +
    "Please set it in your .env file to your Supabase project URL. " +
    "Find it at: https://app.supabase.com/project/_/settings/api"
  );
}

if (!supabaseAnonKey || supabaseAnonKey === "your-anon-key") {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. " +
    "Please set it in your .env file to your Supabase anon/public key. " +
    "Find it at: https://app.supabase.com/project/_/settings/api"
  );
}

/**
 * Supabase client for client-side operations
 * Uses the anon key which respects Row Level Security policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get Supabase configuration (safe for client)
 */
export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}
