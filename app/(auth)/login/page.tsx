 'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login submitted:', { email, password, rememberMe });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-whit flex items-center justify-center p-4">

      <div className="relative w-full max-w-md z-10">

        <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black">
            AthletyQ
        </h1>
        <p className="text-gray-500 text-sm font-medium tracking-wide mt-2">Welcome back</p>
        </div>

        <div className="relative bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          <div className="relative p-8">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-1">Log in</h2>
              <p className="text-gray-400 text-sm">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                    Password
                  </label>
                  <a href="#" className="text-xs text-blue-400 hover:text-cyan-300 font-medium">
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
                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1"
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
                  className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-300 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-blue-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Log in</span>
                <ArrowRight size={18} />
              </button>

            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-500">OR</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <a href="#" className="text-blue-400 hover:text-cyan-300 font-semibold">
                Sign up
              </a>
            </p>

          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By logging in, you agree to our{' '}
          <a href="#" className="text-gray-400 underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-gray-400 underline">Privacy Policy</a>
        </p>

      </div>
    </div>
  );
}