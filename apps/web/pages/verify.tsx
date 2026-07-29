import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import KYCFlow from '@/components/KYCFlow';
import { upgradeOnboardingSession } from '@/lib/onboardingSession';
import { useT, LanguageToggle } from '@/lib/i18n';
import { FiAlertCircle, FiLogIn } from 'react-icons/fi';

export default function VerifyPage() {
  const router = useRouter();
  const t = useT();
  const { userId } = router.query;
  const [ready, setReady] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    // The KYC endpoints need a token. Arriving here without one — a stale
    // link, a cleared browser, a login that failed — used to leave the page
    // asking the API forever and being bounced back by the 401 handler.
    setHasCredential(!!localStorage.getItem('accessToken'));
    setReady(true);
  }, [router.isReady]);

  if (!ready) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userId || !hasCredential) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-xl shadow-lg p-7 max-w-md w-full text-center">
            <div className="flex justify-end mb-2">
              <LanguageToggle tone="dark" />
            </div>
            <FiAlertCircle className="text-amber-500 mx-auto mb-4" size={44} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('verify.needSession.title')}</h2>
            <p className="text-gray-600 mb-6">{t('verify.needSession.desc')}</p>
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <FiLogIn />
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <KYCFlow
          userId={userId as string}
          onSuccess={async () => {
            // A user who just registered is still holding the short-lived
            // onboarding token, which only authorizes the KYC endpoints — the
            // dashboard would bounce them straight back to login. Now that
            // they're verified, trade it for a real session first.
            await upgradeOnboardingSession();
            router.push('/dashboard');
          }}
        />
      </div>
    </Layout>
  );
}
