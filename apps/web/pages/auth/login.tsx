import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { FiMail, FiLoader, FiShield } from 'react-icons/fi';
import PasswordInput from '@/components/PasswordInput';
import { apiClient } from '@/lib/apiClient';
import { describeError } from '@/lib/describeError';
import { useT, LanguageToggle, translateServerMessage } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resuming, setResuming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('auth.emailPasswordRequired'));
      return;
    }

    setNeedsVerification(false);

    try {
      const result = await login({ email, password });
      toast.success(t('auth.welcomeBack'));
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message = translateServerMessage(describeError(err, t('auth.loginFailed')), t);
      // An account that exists but never finished verifying is the one login
      // failure the person can actually resolve from here. Saying "not
      // verified" and stopping leaves them with nowhere to go — and no way to
      // reach the verification page, which needs a userId they don't have.
      if (err?.response?.status === 403 && /verif/i.test(message)) {
        setNeedsVerification(true);
      }
      toast.error(message);
    }
  };

  /**
   * Re-opens verification for an existing account. Gated on the password the
   * user just typed, so this can't be used to start verification on someone
   * else's identity.
   */
  const continueVerification = async () => {
    setResuming(true);
    try {
      const { data } = await apiClient.post('/auth/verification-session', { email, password });
      // The KYC endpoints are all this token opens, and it's what /verify
      // needs to authorize the rest of the flow.
      localStorage.setItem('accessToken', data.onboardingToken);
      router.push(`/verify?userId=${data.userId}`);
    } catch (err: any) {
      toast.error(describeError(err, t('auth.loginFailed')));
      setResuming(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-10">
        <div className="w-full max-w-md">
          {/* The site header is hidden on auth pages, so the switcher has to
              live here — otherwise the journey starts in a language the user
              may not read, with no way to change it. */}
          <div className="flex justify-end mb-3">
            <LanguageToggle />
          </div>

          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">GENESIS ID</h1>
              <p className="text-blue-100">{t('auth.login.title')}</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-7 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.email')}</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password')}</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
                  {t('auth.forgot')}
                </Link>
              </div>

              {needsVerification && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-900 text-sm mb-3">{t('auth.alreadyRegistered')}</p>
                  <button
                    type="button"
                    onClick={continueVerification}
                    disabled={resuming}
                    className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 transition flex items-center justify-center"
                  >
                    {resuming ? <FiLoader className="animate-spin mr-2" /> : <FiShield className="mr-2" />}
                    {t('auth.continueVerification')}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center mt-6"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </button>

              <p className="text-center text-gray-600 text-sm mt-6">
                {t('auth.noAccount')}{' '}
                <Link href="/auth/register" className="text-blue-600 hover:underline font-semibold">
                  {t('auth.register')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
