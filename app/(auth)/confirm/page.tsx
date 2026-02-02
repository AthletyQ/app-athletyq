"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [redirectIn, setRedirectIn] = useState<number>(3);

  const REDIRECT_TO = "/login";
  const REDIRECT_DELAY_MS = 3000;

  useEffect(() => {
    async function handleConfirmation() {
      try {
        // Get the hash fragment from the URL (contains access_token, refresh_token, etc.)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // If we have tokens in the hash, Supabase has already confirmed the email
        if (accessToken && refreshToken && type === "signup") {
          // Set the session using the tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (!sessionData.user) {
            throw new Error("User not found after setting session");
          }

          // Call API to create profile (idempotent - won't create if exists)
          const response = await fetch("/api/auth/create-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session?.access_token}`,
            },
            body: JSON.stringify({
              userId: sessionData.user.id,
              fullName: sessionData.user.user_metadata?.fullName,
              role: sessionData.user.user_metadata?.role,
              email: sessionData.user.email,
            }),
          });

          console.log("create profile response: ", response);

          if (!response.ok) {
            const errorData = await response.text();
            console.error("Profile creation error:", errorData);
            // Still redirect even if profile creation fails (it might already exist)
          }

          setStatus("success");
        } else {
          // Check if we have token_hash in query params (alternative flow)
          const tokenHash = searchParams.get("token_hash");
          const typeParam = searchParams.get("type");

          if (tokenHash && typeParam) {
            // Verify OTP token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: typeParam as "signup" | "email",
            });

            if (error) throw error;
            if (!data.user) throw new Error("User not found after confirmation");

            // Create profile
            const response = await fetch("/api/auth/create-profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: data.user.id,
                fullName: data.user.user_metadata?.fullName,
                role: data.user.user_metadata?.role,
                email: data.user.email,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error("Profile creation error:", errorData);
            }

            setStatus("success");
          } else {
            throw new Error("Missing confirmation tokens");
          }
        }
      } catch (error: any) {
        console.error("Confirmation error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to confirm email");
      }
    }

    handleConfirmation();
  }, [router, searchParams]);

  useEffect(() => {
    if (status !== "success") return;

    const startedAt = Date.now();
    setRedirectIn(Math.ceil(REDIRECT_DELAY_MS / 1000));

    const timeoutId = window.setTimeout(() => {
      router.replace(REDIRECT_TO);
    }, REDIRECT_DELAY_MS);

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, REDIRECT_DELAY_MS - elapsed);
      setRedirectIn(Math.ceil(remainingMs / 1000));
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [status, router]);

  const CardShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)]">
        <div className="px-7 py-10 sm:px-10">{children}</div>
      </div>
    </div>
  );

  const IconCircle = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
      {children}
    </div>
  );

  if (status === "loading") {
    return (
      <CardShell>
        <IconCircle>
          <div
            className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600/20 border-t-blue-600"
            aria-label="Loading"
            role="status"
          />
        </IconCircle>
        <div className="text-center">
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-950">
            Confirming your email
          </h1>
          <p className="mt-2 text-slate-600">
            Hang tight — we’re verifying your magic link and setting up your account.
          </p>
        </div>
        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] rounded-full bg-blue-600" />
        </div>
        <style jsx>{`
          @keyframes progress {
            0% {
              transform: translateX(-70%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(220%);
            }
          }
        `}</style>
      </CardShell>
    );
  }

  if (status === "error") {
    return (
      <CardShell>
        <IconCircle>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.82A2 2 0 0 0 4.62 20h14.76a2 2 0 0 0 1.73-3.32l-7.4-12.82a2 2 0 0 0-3.46 0Z"
              stroke="#0F172A"
              strokeOpacity="0.85"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconCircle>
        <div className="text-center">
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-950">
            Confirmation failed
          </h1>
          <p className="mt-2 text-slate-600">{errorMessage || "We couldn’t confirm your email link."}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.replace(REDIRECT_TO)}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          >
            Go to login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            Try again
          </button>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <IconCircle>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            stroke="#2563EB"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconCircle>

      <div className="text-center">
        <h1 className="text-2xl sm:text-[30px] font-semibold tracking-tight text-slate-950">
          Your account is created
        </h1>
        <p className="mt-2 text-slate-600">
          Welcome to <span className="font-medium text-slate-900">AthletyQ</span>. You’re all set to get started.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-700">
          Redirecting you to login in{" "}
          <span className="font-semibold text-slate-950">{redirectIn}</span>s…
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => router.replace(REDIRECT_TO)}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
        >
          Continue to login
        </button>
      </div>
    </CardShell>
  );
}
