import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type UserRole = "athlete" | "coach" | "organization";

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  /**
   * Optional email redirect URL for email confirmation flows.
   */
  emailRedirectTo?: string;
};

export type AuthServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string; status?: number } };

export type SignUpResult = {
  user: User | null;
  confirmationRequired: boolean;
};

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && anonKey);
}

function toServiceError(error: AuthError | Error): AuthServiceResult<never> {
  return {
    ok: false,
    error: {
      message: error.message,
      code: (error as any).code,
      status: (error as any).status,
    },
  };
}

/**
 * Handles the signup flow:
 * 1. Creates the auth user in Supabase Auth
 * 2. Stores signup data (fullName, role) in user_metadata for later use
 * 
 * Profile is NOT created here. It will be created after email confirmation
 * via the email confirmation callback handler.
 */
export async function signUp(
  input: SignUpInput,
): Promise<AuthServiceResult<SignUpResult>> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: {
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      },
    };
  }

  const { email, password, fullName, role, emailRedirectTo } = input;

  // Create the Auth User and store signup data in user_metadata
  // This metadata will be available after email confirmation
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        fullName,
        role,
        // Store original email for profile creation
        email,
      },
    },
  });

  if (authError) return toServiceError(authError);
  if (!authData.user) {
    return {
      ok: false,
      error: { message: "Failed to create user account." },
    };
  }

  // Profile will be created after email confirmation via callback handler
  return {
    ok: true,
    data: {
      user: authData.user,
      confirmationRequired: !authData.session,
    },
  };
}

/**
 * Creates a user profile in the 'profiles' table.
 * This should be called after email confirmation is complete.
 * 
 * @param userId - The authenticated user's ID
 * @param userMetadata - The user_metadata from the confirmed user
 */
export async function createProfile(
  userId: string,
  userMetadata: {
    fullName?: string;
    role?: UserRole;
    email?: string;
  },
): Promise<AuthServiceResult<{ user_id: string }>> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: {
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      },
    };
  }

  const { fullName, role, email } = userMetadata;

  if (!fullName || !role || !email) {
    return {
      ok: false,
      error: {
        message: "Missing required profile data (fullName, role, or email).",
      },
    };
  }

  // Validate role
  const validRoles: UserRole[] = ["athlete", "coach", "organization"];
  if (!validRoles.includes(role)) {
    return {
      ok: false,
      error: {
        message: `Invalid role: ${role}`,
      },
    };
  }

  // Create the profile - NOTE: matching your table structure
  // Your table uses: user_id (PK), fullName (camelCase), email, role
  const { data, error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,    
      fullName: fullName, 
      role: role,
      email: email,
    })
    .select()
    .single();

  if (profileError) {
    // Check if profile already exists (idempotency)
    if (profileError.code === "23505") {
      // Unique constraint violation - profile already exists
      return {
        ok: true,
        data: { user_id: userId },
      };
    }

    return {
      ok: false,
      error: {
        message: "Failed to create profile.",
        code: profileError.code,
      },
    };
  }

  return {
    ok: true,
    data: { user_id: data.user_id },
  };
}