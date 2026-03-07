import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

// createBrowserClient stores the session in cookies (not localStorage),
// making it accessible to the Next.js middleware for auth checks.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);