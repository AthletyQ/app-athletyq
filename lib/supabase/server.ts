import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Plain Supabase client for server-side use (API routes, services).
// Does NOT use browser APIs — safe to import in Node.js / Edge runtime.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
