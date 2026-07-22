import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { FiMail, FiLock, FiLoader, FiCreditCard, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useWalletAuth } from '@/hooks/useWalletAuth';

const GENESIS_APP_URL = process.env.NEXT_PUBLIC_GENESIS_APP_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useWalletAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      await login(email, password);
      toast.success('Welcome to Veta Wallet!');
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b12] px-4 relative overflow-hidden">
      {/* Ambient glow, Phantom-style */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="bg-[#15151f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
              <FiCreditCard className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Veta Wallet</h1>
            <p className="text-gray-500 text-sm">Orden Global Ecosystem</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <p className="text-gray-400 text-sm text-center mb-2">
              Sign in with your <span className="text-violet-400 font-semibold">GENESIS ID</span> account — one identity across every Orden Global app.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e16] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0e0e16] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="text-right mt-2">
                <a
                  href={`${GENESIS_APP_URL}/auth/forgot-password`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                {error}
                {error.toLowerCase().includes('verif') && (
                  <>
                    {' '}
                    <a href={`${GENESIS_APP_URL}/dashboard`} className="underline font-semibold text-red-200" target="_blank" rel="noreferrer">
                      Finish verification on GENESIS ID
                    </a>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 transition flex items-center justify-center mt-6 shadow-lg shadow-violet-900/40"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-gray-500 text-sm mt-6">
              Don&apos;t have a GENESIS ID yet?{' '}
              <a href={`${GENESIS_APP_URL}/auth/register`} className="text-violet-400 hover:text-violet-300 font-semibold" target="_blank" rel="noreferrer">
                Create one
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
