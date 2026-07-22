import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import KYCFlow from '@/components/KYCFlow';

/**
 * Embeddable KYC page, meant to be loaded inside an <iframe> by ecosystem apps
 * (Veta Wallet, My Token Pay, etc.) via the genesis-kyc-sdk widget.
 *
 * Query params:
 *   userId          - required, the GENESIS ID user completing verification
 *   appName         - required, identifies which app initiated the flow
 *   onboardingToken - required unless the browser already holds a GENESIS ID
 *                     session for this user (e.g. a native app embedding this
 *                     page has never logged into genesisid.online directly,
 *                     so it has no other way to authenticate the KYC calls)
 *   returnUrl       - optional, if present the page will do a full redirect
 *                     instead of posting a message (used for non-iframe /
 *                     full-page flows, including deep-linking back into a
 *                     native app via a custom URL scheme)
 */
export default function EmbedVerifyPage() {
  const router = useRouter();
  const { userId, appName, returnUrl, onboardingToken } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    // apiClient reads its Authorization token from this key — this is the
    // only session GENESIS ID's own browser storage has for a user who
    // registered through an external app rather than genesisid.online.
    if (typeof onboardingToken === 'string' && onboardingToken) {
      localStorage.setItem('accessToken', onboardingToken);
    }
  }, [router.isReady, onboardingToken]);

  const postToParent = (payload: Record<string, any>) => {
    const message = { source: 'genesis-kyc-sdk', ...payload };

    if (returnUrl && typeof returnUrl === 'string') {
      const url = new URL(returnUrl);
      url.searchParams.set('status', payload.status);
      if (payload.verificationId) url.searchParams.set('verificationId', payload.verificationId);
      window.location.href = url.toString();
      return;
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'genesis-kyc-sdk', event: 'ready' }, '*');
    }
  }, [router.isReady]);

  if (!router.isReady) return null;

  if (!userId || !appName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8 text-center">
        <p>Missing required parameters: userId and appName.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GENESIS ID Verification</title>
      </Head>
      <KYCFlow
        userId={userId as string}
        onStatusChange={(status, data) => {
          postToParent({ event: 'status', status, verificationId: data.verificationId });
        }}
      />
    </>
  );
}
