import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiMail, FiLoader, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Enter your email address');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      // The backend always responds the same way whether or not the email
      // exists, so we show the same confirmation either way.
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
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
              <p className="text-blue-100">Reset your password</p>
            </div>

            {sent ? (
              <div className="px-6 py-10 text-center">
                <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
                  <FiCheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-600 mb-6">
                  If an account exists for <span className="font-semibold">{email}</span>, we've sent a link
                  to reset your password. The link expires in 1 hour.
                </p>
                <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-8 space-y-4">
                <p className="text-gray-600 text-sm">
                  Enter the email address for your account and we'll send you a link to reset your password.
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
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>

                <p className="text-center text-gray-600 text-sm mt-6">
                  <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold inline-flex items-center">
                    <FiArrowLeft className="mr-1" /> Back to login
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
