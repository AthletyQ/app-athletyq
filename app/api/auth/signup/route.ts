import { NextRequest, NextResponse } from "next/server";
import { signUp, UserRole } from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    // Validate input
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Email, password, fullName, and role are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ["athlete", "coach", "organization"];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Invalid email format",
          },
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Password must be at least 6 characters long",
          },
        },
        { status: 400 }
      );
    }

    // Build the email confirmation redirect URL (client-side page)
    // Route groups like (auth) are not part of the URL path
    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const emailRedirectTo = `${origin}/confirm?redirect_to=/`;

    // Call the signup service
    const result = await signUp({ 
      email, 
      password, 
      fullName, 
      role: role as UserRole,
      emailRedirectTo,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
        },
        { status: result.error.status || 500 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        ok: true,
        data: {
          userId: result.data.user?.id,
          email: result.data.user?.email,
          confirmationRequired: result.data.confirmationRequired,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Invalid JSON in request body" },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: { message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
