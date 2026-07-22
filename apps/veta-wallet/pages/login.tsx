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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-center">
            <FiCreditCard className="mx-auto text-white mb-2" size={36} />
            <h1 className="text-3xl font-bold text-white mb-1">Veta Wallet</h1>
            <p className="text-emerald-100 text-sm">Orden Global Ecosystem</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-4">
            <p className="text-gray-600 text-sm text-center mb-2">
              Sign in with your <span className="font-semibold">GENESIS ID</span> account — one identity across every Orden Global app.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
                {error.toLowerCase().includes('verif') && (
                  <>
                    {' '}
                    <a href={`${GENESIS_APP_URL}/dashboard`} className="underline font-semibold" target="_blank" rel="noreferrer">
                      Finish verification on GENESIS ID
                    </a>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center mt-6"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-gray-600 text-sm mt-6">
              Don&apos;t have a GENESIS ID yet?{' '}
              <a href={`${GENESIS_APP_URL}/auth/register`} className="text-emerald-600 hover:underline font-semibold" target="_blank" rel="noreferrer">
                Create one
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
