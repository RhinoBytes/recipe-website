import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || supabaseUrl === "https://your-project-ref.supabase.co") {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not configured. " +
    "Please set it in your .env file to your Supabase project URL. " +
    "Find it at: https://app.supabase.com/project/_/settings/api"
  );
}

if (!supabaseServiceKey || supabaseServiceKey === "your-service-role-key") {
  throw new Error(
    "SUPABASE_SERVICE_KEY is not configured. " +
    "Please set it in your .env file to your Supabase service role key. " +
    "Find it at: https://app.supabase.com/project/_/settings/api " +
    "⚠️  WARNING: This is a secret key - never commit it to version control!"
  );
}

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
