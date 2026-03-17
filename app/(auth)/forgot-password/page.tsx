'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        const message = json?.error?.message || 'Unable to send reset email. Please try again.';
        setError(message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center p-4">
      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            AthletyQ
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide mt-2">
            Password Recovery
          </p>
        </div>

        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="relative p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950 mb-1">Forgot Password?</h2>
              <p className="text-slate-600 text-sm">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {success ? (
              <div className="space-y-6">
                <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
                  Check your email! We&apos;ve sent a password reset link to <span className="font-bold">{email}</span>.
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  <span>Back to login</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-cyan-500 disabled:bg-blue-600/60 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Sending...' : 'Send reset link'}</span>
                  {!isLoading && <Send size={18} />}
                </button>

                <div className="text-center pt-2">
                  <a
                    href="/login"
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={14} />
                    Back to login
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
