import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { describeError } from '@/lib/describeError';
import { apiClient } from '@/lib/apiClient';
import { useT, LanguageToggle, translateServerMessage } from '@/lib/i18n';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { FiMail, FiUser, FiPhone, FiLoader, FiShield } from 'react-icons/fi';
import PasswordInput from '@/components/PasswordInput';

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const { register, loading, error } = useAuth();
  const [existingAccount, setExistingAccount] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error(t('auth.emailPasswordRequired'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordsNoMatch'));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('auth.passwordShort'));
      return;
    }

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone
      });

      // Short-lived token authorizing this user to complete KYC before
      // they have a full session (that starts once verification is approved).
      localStorage.setItem('accessToken', result.onboardingToken);

      toast.success(t('auth.accountCreated'));
      router.push(`/verify?userId=${result.userId}`);
    } catch (err) {
      // Read the failure off the error itself, not off `error` state: that
      // state belongs to the render this handler closed over, so it's still
      // the previous attempt's value (null on the first try) — which is why
      // every failure here reported the same generic "Registration failed"
      // no matter what actually went wrong.
      const message = translateServerMessage(describeError(err, t('auth.registerFailed')), t);
      // The email already having an account is not a wall: it usually means a
      // half-finished attempt, so offer the way to finish it rather than
      // leaving them to guess.
      if ((err as any)?.response?.status === 409) {
        setExistingAccount(true);
        toast.error(t('auth.emailTaken'));
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4">
        <div className="w-full max-w-md">
          {/* Auth pages hide the site header, so the switcher lives here —
              otherwise the journey starts in a language the user may not read. */}
          <div className="flex justify-end mb-3">
            <LanguageToggle />
          </div>

          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">GENESIS ID</h1>
              <p className="text-blue-100">{t('auth.register.title')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-8 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.phone')}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.confirmPassword')}
                </label>
                <PasswordInput
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
              </div>

              {existingAccount && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-900 text-sm mb-3">{t('auth.alreadyRegistered')}</p>
                  <button
                    type="button"
                    disabled={resuming}
                    onClick={async () => {
                      setResuming(true);
                      try {
                        const { data } = await apiClient.post('/auth/verification-session', {
                          email: formData.email,
                          password: formData.password
                        });
                        localStorage.setItem('accessToken', data.onboardingToken);
                        router.push(`/verify?userId=${data.userId}`);
                      } catch (e: any) {
                        toast.error(describeError(e, t('auth.registerFailed')));
                        setResuming(false);
                      }
                    }}
                    className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 transition flex items-center justify-center"
                  >
                    {resuming ? <FiLoader className="animate-spin mr-2" /> : <FiShield className="mr-2" />}
                    {t('auth.continueVerification')}
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center mt-6"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    {t('auth.creating')}
                  </>
                ) : (
                  t('auth.createAccount')
                )}
              </button>

              {/* Footer */}
              <p className="text-center text-gray-600 text-sm mt-6">
                {t('auth.haveAccount')}{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                  {t('auth.login')}
                </Link>
              </p>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-white bg-opacity-20 text-white rounded-lg p-4">
            <p className="text-sm">
              🔒 Your data is encrypted and secured. We comply with GDPR and data protection regulations.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
