import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/services/auth/auth.service";

export async function POST(request: NextRequest) {
    console.log("Signup API called");
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Email and password are required",
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

    // Call the signup service
    const result = await signUp({ email, password });

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
    // Handle JSON parsing errors or other unexpected errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Invalid JSON in request body",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

