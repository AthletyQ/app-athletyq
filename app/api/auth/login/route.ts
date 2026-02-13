import { NextRequest, NextResponse } from "next/server";
import { login } from "@/services/auth/login.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Email and password are required" },
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
          error: { message: "Invalid email format" },
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Password must be at least 6 characters long" },
        },
        { status: 400 }
      );
    }

    // Call service
    const result = await login({ email, password });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
        },
        { status: 401 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        ok: true,
        data: {
          userId: result.data.user.id,
          email: result.data.user.email,
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
          expires_at: result.data.session.expires_at,
        },
      },
      { status: 200 }
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
