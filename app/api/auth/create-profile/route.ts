import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * API route to create a user profile after email confirmation.
 * This is called from the client-side confirmation page.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing auth token" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, fullName, role, email } = body;

    if (!userId || !fullName || !role || !email) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "userId, fullName, role, and email are required" },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration:", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Server configuration error" },
        },
        { status: 500 }
      );
    }

    // Create a Supabase client with SERVICE ROLE key for admin operations
    // This bypasses RLS and allows us to insert into the profiles table
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the user token is valid
    const supabaseClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { ok: false, error: { message: "Invalid authentication token" } },
        { status: 401 }
      );
    }

    // Ensure the userId matches the authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { ok: false, error: { message: "User ID mismatch" } },
        { status: 403 }
      );
    }

    // Check if profile already exists (idempotency)
    // NOTE: Using 'user_id' to match your table structure
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      console.log("Profile already exists for user:", userId);
      return NextResponse.json(
        {
          ok: true,
          data: { user_id: userId, message: "Profile already exists" },
        },
        { status: 200 }
      );
    }

    // Validate role
    const validRoles = ["athlete", "coach", "organization"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: `Invalid role: ${role}` },
        },
        { status: 400 }
      );
    }

    console.log("Creating profile for user:", { userId, email, role });

    // Create the profile using service role (bypasses RLS)
    // NOTE: Matching your table structure: user_id, fullName (camelCase), email, role
    const { data, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: userId,     // Changed from 'id' to 'user_id'
        fullName: fullName,  // Keeping camelCase to match your table
        role: role,
        email: email,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);

      // Check if it's a duplicate key error (profile already exists)
      if (profileError.code === "23505") {
        return NextResponse.json(
          {
            ok: true,
            data: { user_id: userId, message: "Profile already exists" },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Failed to create profile",
            code: profileError.code,
            details: profileError.message,
          },
        },
        { status: 500 }
      );
    }

    console.log("Profile created successfully:", data);

    return NextResponse.json(
      {
        ok: true,
        data: { user_id: data.user_id },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create profile error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Internal server error", details: error.message },
      },
      { status: 500 }
    );
  }
}