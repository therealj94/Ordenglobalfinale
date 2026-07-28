import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useVerification, AMLInfo } from '@/hooks/useVerification';
import toast from 'react-hot-toast';
import AMLForm from './AMLForm';
import FacialCapture from './FacialCapture';
import DocumentCapture, { DocumentCaptureResult } from './DocumentCapture';
import {
  FiCheckCircle,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiCamera
} from 'react-icons/fi';

interface KYCFlowProps {
  userId: string;
  onSuccess?: (verification: any) => void;
  onStatusChange?: (status: 'approved' | 'pending' | 'rejected', data: any) => void;
  /**
   * Rendered inside an ecosystem app's flow rather than on genesisid.online.
   * Embedded callers own every terminal screen (and the way back to their own
   * app), so this component must never offer its own "go to dashboard" exits —
   * a native-app user has no dashboard to go to and would be stranded there.
   */
  embedded?: boolean;
}

type Step = 'info' | 'aml' | 'facial' | 'document' | 'submitting' | 'processing' | 'review' | 'completed' | 'failed';

// How long to keep polling for a decision before giving up and sending the
// user to the "under review" screen anyway (the backend keeps working on
// it in the background regardless — this just bounds the wait on-screen).
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MS = 5 * 60 * 1000;

export default function KYCFlow({ userId, onSuccess, onStatusChange, embedded = false }: KYCFlowProps) {
  const router = useRouter();
  const { submitKYC, getKYCStatus, loading } = useVerification();
  const [step, setStep] = useState<Step>('info');
  const [amlInfo, setAmlInfo] = useState<AMLInfo | null>(null);
  const [selfieImages, setSelfieImages] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [gid, setGid] = useState<string | null>(null);

  const steps = ['Start', 'Compliance Info', 'Facial Verification', 'Document Scan', 'Review', 'Completed'];
  const currentStepIndex = ['info', 'aml', 'facial', 'document', 'submitting', 'completed'].indexOf(
    step === 'review' || step === 'failed' || step === 'processing' ? 'submitting' : step
  );

  const handleStartVerification = () => {
    setStep('aml');
  };

  const handleAMLComplete = (data: AMLInfo) => {
    setAmlInfo(data);
    setStep('facial');
  };

  const handleFacialComplete = (photos: string[]) => {
    setSelfieImages(photos);
    toast.success('Facial verification captured!');
    setStep('document');
  };

  const pollUntilResolved = async (uid: string) => {
    const start = Date.now();
    while (Date.now() - start < MAX_POLL_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      try {
        const status = await getKYCStatus(uid);

        if (status.status === 'approved') {
          setGid((status as any).gid || null);
          setStep('completed');
          onSuccess?.(status);
          onStatusChange?.('approved', status);
          return;
        }
        if (status.status === 'rejected') {
          setRejectionReason(status.rejectionReason || null);
          setStep('failed');
          onStatusChange?.('rejected', status);
          return;
        }
        if (status.status === 'pending') {
          setStep('review');
          onStatusChange?.('pending', status);
          return;
        }
        // still 'processing' — keep polling
      } catch {
        // transient error while polling — keep trying
      }
    }
    // Gave up waiting on-screen; the backend keeps working on it and will
    // email the user once it resolves either way. The caller still has to be
    // told — without this an embedded app never hears back at all and just
    // sits on this screen forever.
    setStep('review');
    onStatusChange?.('pending', { verificationId: undefined });
  };

  const handleDocumentComplete = async (result: DocumentCaptureResult) => {
    if (!amlInfo) {
      toast.error('Missing compliance information — please restart');
      setStep('aml');
      return;
    }

    setStep('submitting');
    try {
      await submitKYC({
        userId,
        documentType: result.documentType,
        documentFrontImage: result.frontImage,
        documentBackImage: result.backImage,
        selfieImages,
        livenessResult: { anglesCaptured: selfieImages.length, method: 'guided-rotation' },
        amlInfo
      });

      setStep('processing');
      await pollUntilResolved(userId);
    } catch (error: any) {
      const details = error?.response?.data?.details;
      const attemptsRemaining = error?.response?.data?.attemptsRemaining;

      if (Array.isArray(details) && details.length > 0) {
        toast.error(
          attemptsRemaining > 0
            ? `Some photos didn't pass quality check: ${details[0]}. ${attemptsRemaining} attempt(s) left before manual review.`
            : `Some photos didn't pass quality check: ${details[0]}`
        );
        setSelfieImages([]);
        setStep('facial');
        return;
      }

      const message = error?.response?.data?.error || 'Failed to submit verification';
      toast.error(message);
      setStep('failed');
      onStatusChange?.('rejected', { rejectionReason: message });
    }
  };

  const handleRetry = () => {
    setSelfieImages([]);
    setRejectionReason(null);
    setStep('facial');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 text-white">
          <div className="flex items-center justify-center mb-4">
            <FiCamera className="text-blue-400 mr-2" size={32} />
            <h1 className="text-4xl font-bold">GENESIS ID</h1>
          </div>
          <p className="text-blue-200 text-lg">Secure Identity Verification</p>
        </div>

        {/* Stepper */}
        <div className="mb-12 bg-white bg-opacity-10 backdrop-blur rounded-lg p-8">
          <div className="flex justify-between mb-8">
            {steps.map((label, index) => {
              let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
              if (index < currentStepIndex) status = 'completed';
              if (index === currentStepIndex) status = 'current';

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition transform ${
                      status === 'completed'
                        ? 'bg-green-500 text-white scale-110'
                        : status === 'current'
                        ? 'bg-blue-500 text-white scale-110 animate-pulse'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {status === 'completed' ? (
                      <FiCheckCircle size={24} />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>
                  <p
                    className={`text-xs sm:text-sm text-center font-medium ${
                      status === 'current' ? 'text-blue-400 font-bold' : 'text-gray-300'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {step === 'info' && (
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 md:p-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Identity</h2>
                <p className="text-gray-600 text-lg mb-8">
                  Complete your identity verification in a few steps. This secure process takes about 5 minutes.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="text-2xl mr-4">📋</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Compliance Information</h3>
                      <p className="text-gray-600 text-sm">A few required questions (AML/KYC) before we can verify you</p>
                    </div>
                  </div>

                  <div className="flex items-start bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl mr-4">📸</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Facial Verification</h3>
                      <p className="text-gray-600 text-sm">Hold each position — 5 angles capture automatically to verify liveness</p>
                    </div>
                  </div>

                  <div className="flex items-start bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl mr-4">📄</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Document Scan</h3>
                      <p className="text-gray-600 text-sm">Scan your ID (front + back), driver's license, or passport</p>
                    </div>
                  </div>

                  <div className="flex items-start bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl mr-4">✅</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Review</h3>
                      <p className="text-gray-600 text-sm">Approved instantly or reviewed by our team</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-8">
                  <h4 className="font-semibold text-yellow-900 mb-2">✓ Requirements:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Good lighting (natural light recommended)</li>
                    <li>• Valid government-issued ID or passport</li>
                    <li>• Webcam or mobile device camera</li>
                    <li>• Internet connection</li>
                  </ul>
                </div>

                <button
                  onClick={handleStartVerification}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105 flex items-center justify-center"
                >
                  <FiCamera className="mr-2" />
                  Start Verification
                </button>
              </div>
            </div>
          )}

          {step === 'aml' && <AMLForm onSubmit={handleAMLComplete} />}

          {step === 'facial' && (
            <FacialCapture
              onCapture={handleFacialComplete}
              onError={(error) => {
                toast.error(error);
                setStep('failed');
              }}
            />
          )}

          {step === 'document' && (
            <DocumentCapture
              onCapture={handleDocumentComplete}
              onError={(error) => toast.error(error)}
            />
          )}

          {step === 'submitting' && (
            <div className="p-16 text-center">
              <FiLoader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
              <p className="text-gray-600 text-lg">Uploading your verification...</p>
            </div>
          )}

          {step === 'processing' && (
            <div className="p-8 md:p-16 text-center">
              <FiLoader className="animate-spin mx-auto mb-6 text-blue-600" size={56} />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Verifying your identity...</h2>
              <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                This first automatic check usually takes just a few minutes.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-gray-700 text-sm">
                  If we need to review anything further, it can take up to 24 hours — we'll email you either way, so you don't need to keep this page open.
                </p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="p-8 md:p-12 text-center">
              <div className="mb-8">
                <div className="inline-block bg-yellow-100 p-4 rounded-full mb-4">
                  <FiAlertCircle size={48} className="text-yellow-600" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">Under Review</h2>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Your verification needs a closer look from our team. This can take up to 24 hours.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
                <p className="text-gray-700">
                  📧 We'll send you an email notification as soon as the review is complete.
                </p>
              </div>

              {!embedded && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          )}

          {step === 'completed' && (
            <div className="p-8 md:p-12 text-center bg-gradient-to-br from-green-50 to-white">
              <div className="mb-8">
                <div className="inline-block bg-green-100 p-4 rounded-full mb-4 animate-bounce">
                  <FiCheckCircle size={48} className="text-green-600" />
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-3">Verification Approved! 🎉</h2>
              <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                Your identity has been verified successfully. You now have access to all Orden Global apps.
              </p>

              {gid && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
                  <p className="text-sm text-indigo-600 mb-1">Your GENESIS ID</p>
                  <p className="text-2xl font-mono font-bold text-indigo-900">{gid}</p>
                </div>
              )}

              {!embedded && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition transform hover:scale-105"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          )}

          {step === 'failed' && (
            <div className="p-8 md:p-12 text-center">
              <div className="mb-8">
                <div className="inline-block bg-red-100 p-4 rounded-full mb-4">
                  <FiAlertCircle size={48} className="text-red-600" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">Verification Failed</h2>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                {rejectionReason || 'Your verification could not be completed. Please try again with better lighting and a clearer document.'}
              </p>

              <div className="space-y-3 max-w-md mx-auto">
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition flex items-center justify-center"
                >
                  <FiRefreshCw className="mr-2" />
                  Try Again
                </button>

                {!embedded && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                  >
                    Go Back
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
