import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLock, FiLoader, FiCheckCircle } from 'react-icons/fi';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || typeof token !== 'string') {
      toast.error('Invalid or missing reset link. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password reset! You can now log in.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <h1 className="text-3xl font-bold text-white mb-2">GENESIS ID</h1>
              <p className="text-blue-100">Choose a new password</p>
            </div>

            {done ? (
              <div className="px-6 py-10 text-center">
                <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
                  <FiCheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated</h2>
                <p className="text-gray-600 mb-6">Your password has been changed successfully.</p>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Go to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center mt-6"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>

                <p className="text-center text-gray-600 text-sm mt-6">
                  <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
