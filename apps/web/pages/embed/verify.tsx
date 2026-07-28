import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import KYCFlow from '@/components/KYCFlow';
import GenesisIDCard from '@/components/GenesisIDCard';
import IdCardPhotoCapture from '@/components/IdCardPhotoCapture';
import SignaturePad from '@/components/SignaturePad';
import EcosystemReturn from '@/components/EcosystemReturn';
import { apiClient } from '@/lib/apiClient';
import { User } from '@/types';
import { FiAlertCircle, FiCamera, FiClock, FiLoader, FiXCircle } from 'react-icons/fi';

const APP_LABELS: Record<string, string> = {
  'veta-wallet': 'Veta Wallet',
  vetawallet: 'Veta Wallet',
  'my-token-pay': 'My Token Pay',
  mytokenpay: 'My Token Pay'
};

type Phase = 'kyc' | 'finishing' | 'photo' | 'signature' | 'card' | 'review' | 'rejected';

/**
 * Embeddable identity flow, opened by ecosystem apps (Veta Wallet, My Token
 * Pay) either in an <iframe> via the genesis-kyc-sdk widget or as a full-page
 * browser session from a native app.
 *
 * Unlike the plain /verify page, this one carries the user all the way to a
 * finished GENESIS ID — verification, then ID photo, then signature, then the
 * card itself — and ends on an explicit "back to the app" button. Native apps
 * have nowhere to land otherwise: they can't use GENESIS ID's own dashboard,
 * so anything left to do there would strand the user.
 *
 * Query params:
 *   userId          - required, the GENESIS ID user completing verification
 *   appName         - required, identifies which app initiated the flow
 *   onboardingToken - required unless the browser already holds a GENESIS ID
 *                     session for this user (a native app has its own login,
 *                     not genesisid.online's, so it has no other way to
 *                     authenticate these calls)
 *   returnUrl       - optional deep link back into the calling app
 */
export default function EmbedVerifyPage() {
  const router = useRouter();
  const { userId, appName, returnUrl, onboardingToken } = router.query;

  const [phase, setPhase] = useState<Phase>('kyc');
  const [profile, setProfile] = useState<User | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | undefined>();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appLabel = (typeof appName === 'string' && APP_LABELS[appName]) || 'la app';
  const deepLink = typeof returnUrl === 'string' && returnUrl ? returnUrl : null;

  useEffect(() => {
    if (!router.isReady) return;
    // apiClient reads its Authorization token from this key — this is the only
    // session GENESIS ID's own browser storage has for a user who registered
    // through an external app rather than genesisid.online.
    if (typeof onboardingToken === 'string' && onboardingToken) {
      localStorage.setItem('accessToken', onboardingToken);
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'genesis-kyc-sdk', event: 'ready' }, '*');
    }
  }, [router.isReady, onboardingToken]);

  const notifyParent = useCallback((status: string, id?: string) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'genesis-kyc-sdk', event: 'status', status, verificationId: id }, '*');
    }
  }, []);

  /**
   * Once approved, trade the onboarding token for a real session so the rest
   * of this page (profile, ID photo, signature) is authorized properly — the
   * onboarding token only ever authorizes the KYC endpoints.
   */
  const startFinishFlow = useCallback(async () => {
    setPhase('finishing');
    try {
      if (typeof onboardingToken === 'string' && onboardingToken) {
        const session = await apiClient.post('/auth/exchange-onboarding', { onboardingToken });
        localStorage.setItem('accessToken', session.data.accessToken);
        localStorage.setItem('refreshToken', session.data.refreshToken);
      }
      const me = await apiClient.get<{ user: User }>('/auth/me');
      setProfile(me.data.user);
      setPhase(me.data.user.idCardPhoto ? 'card' : 'photo');
    } catch (err: any) {
      // Verification itself succeeded — only the extras below need a session.
      // Don't strand the user: send them on to the card/return step anyway.
      setError('No pudimos cargar tu perfil completo, pero tu verificación quedó aprobada.');
      setPhase('card');
    }
  }, [onboardingToken]);

  const handleStatusChange = useCallback(
    (status: 'approved' | 'pending' | 'rejected', data: any) => {
      setVerificationId(data?.verificationId);
      notifyParent(status, data?.verificationId);
      if (status === 'approved') {
        startFinishFlow();
      } else if (status === 'pending') {
        setPhase('review');
      } else {
        setRejectionReason(data?.rejectionReason || null);
        setPhase('rejected');
      }
    },
    [notifyParent, startFinishFlow]
  );

  const handleSignature = async (signature: string) => {
    if (!pendingPhoto || !profile) return;
    await apiClient.post('/kyc/id-card-photo', { userId: profile.id, photo: pendingPhoto, signature });
    setProfile({ ...profile, idCardPhoto: pendingPhoto, signature });
    setPendingPhoto(null);
    setPhase('card');
  };

  if (!router.isReady) return null;

  if (!userId || !appName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8 text-center">
        <p>Missing required parameters: userId and appName.</p>
      </div>
    );
  }

  if (phase === 'kyc') {
    return (
      <>
        <Head>
          <title>GENESIS ID Verification</title>
        </Head>
        <KYCFlow userId={userId as string} embedded onStatusChange={handleStatusChange} />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>GENESIS ID</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
        <div className="max-w-md mx-auto">
          {phase === 'finishing' && (
            <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
              <FiLoader className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
              <p className="text-gray-600">Preparando tu GENESIS ID…</p>
            </div>
          )}

          {phase === 'photo' && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <FiCamera className="mx-auto text-indigo-500 mb-3" size={32} />
              <h2 className="text-xl font-bold text-gray-900 mb-1">Tu foto para el GENESIS ID</h2>
              <p className="text-gray-600 text-sm mb-6">
                Esta es la foto que aparecerá en tu identidad, como en un pasaporte.
              </p>
              <IdCardPhotoCapture onSubmit={async (photo) => { setPendingPhoto(photo); setPhase('signature'); }} />
            </div>
          )}

          {phase === 'signature' && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Firma tu GENESIS ID</h2>
              <p className="text-gray-600 text-sm mb-6">Último paso — añade tu firma para completar tu identidad.</p>
              <SignaturePad onSubmit={handleSignature} />
            </div>
          )}

          {phase === 'card' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">¡Tu GENESIS ID está listo!</h2>
                <p className="text-blue-200 text-sm">
                  Esta identidad te sirve en Veta Wallet, My Token Pay y todo el ecosistema Orden Global.
                </p>
              </div>

              {profile?.gid ? (
                <GenesisIDCard
                  fullName={profile.fullName || profile.email}
                  gid={profile.gid}
                  nationality={profile.nationality}
                  idCardPhoto={profile.idCardPhoto}
                  signature={profile.signature}
                  dateOfBirth={profile.dateOfBirth}
                  issuedAt={profile.gidIssuedAt}
                  expiresAt={profile.gidExpiresAt}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                  <p className="text-gray-700 font-semibold">Verificación aprobada ✓</p>
                </div>
              )}

              {error && <p className="text-amber-200 text-xs text-center mt-4">{error}</p>}

              {deepLink && (
                <EcosystemReturn
                  returnUrl={deepLink}
                  appLabel={appLabel}
                  status="approved"
                  verificationId={verificationId}
                />
              )}
            </div>
          )}

          {phase === 'review' && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="inline-block bg-yellow-100 p-4 rounded-full mb-4">
                <FiClock size={40} className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">En revisión</h2>
              <p className="text-gray-600 mb-2">
                Tu verificación necesita una revisión de nuestro equipo. Puede tardar hasta 24 horas.
              </p>
              <p className="text-gray-500 text-sm">Te avisaremos por correo en cuanto esté lista.</p>
              {deepLink && (
                <EcosystemReturn
                  returnUrl={deepLink}
                  appLabel={appLabel}
                  status="pending"
                  verificationId={verificationId}
                />
              )}
            </div>
          )}

          {phase === 'rejected' && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="inline-block bg-red-100 p-4 rounded-full mb-4">
                <FiXCircle size={40} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No pudimos verificarte</h2>
              <p className="text-gray-600 mb-4">
                {rejectionReason ||
                  'Tu verificación no pudo completarse. Intenta de nuevo con mejor iluminación y un documento válido.'}
              </p>
              <button
                onClick={() => { setRejectionReason(null); setPhase('kyc'); }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-2"
              >
                Intentar de nuevo
              </button>
              {deepLink && (
                <EcosystemReturn
                  returnUrl={deepLink}
                  appLabel={appLabel}
                  status="rejected"
                  verificationId={verificationId}
                />
              )}
            </div>
          )}

          {!deepLink && phase !== 'finishing' && (
            <p className="text-blue-200/70 text-xs text-center mt-6 flex items-center justify-center gap-1.5">
              <FiAlertCircle size={12} />
              Ya puedes cerrar esta ventana.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
