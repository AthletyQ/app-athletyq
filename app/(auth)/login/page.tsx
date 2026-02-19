'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        const message =
          json?.error?.message || 'Unable to log you in. Please check your credentials.';
        setError(message);
        return;
      }

      const { access_token, refresh_token } = json.data;

      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        setError(sessionError.message || 'Failed to establish session.');
        return;
      }

      // TODO: adjust redirect path if you have a dedicated dashboard
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
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
            Welcome back
          </p>
        </div>

        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="relative p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-950 mb-1">Log in</h2>
              <p className="text-slate-600 text-sm">
                Enter your credentials to access your account
              </p>
            </div>

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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs text-blue-400 hover:text-cyan-300 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-400 cursor-pointer bg-white text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-slate-600 cursor-pointer"
                >
                  Remember me for 30 days
                </label>
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
                <span>{isLoading ? 'Logging in...' : 'Log in'}</span>
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-slate-500">OR</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          By logging in, you agree to our{' '}
          <a href="#" className="text-slate-500 underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-slate-500 underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}