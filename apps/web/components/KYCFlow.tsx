import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useVerification } from '@/hooks/useVerification';
import toast from 'react-hot-toast';
import VeriffSDK from './VeriffSDK';
import {
  FiCheckCircle,
  FiCircle,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';

interface KYCFlowProps {
  userId: string;
  onSuccess?: (verification: any) => void;
}

type Step = 'info' | 'verify' | 'review' | 'completed' | 'failed';

export default function KYCFlow({ userId, onSuccess }: KYCFlowProps) {
  const router = useRouter();
  const { initializeVerification, checkVerificationStatus, retryVerification } =
    useVerification();
  const [step, setStep] = useState<Step>('info');
  const [veriffUrl, setVeriffUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);

  const steps = ['Personal Info', 'Facial Verification', 'Document Scan', 'Review', 'Completed'];
  const currentStepIndex = ['info', 'verify', 'verify', 'review', 'completed'].indexOf(step);

  const handleStartVerification = async () => {
    try {
      setLoading(true);
      const { veriffUrl, sessionId } = await initializeVerification(userId);
      setVeriffUrl(veriffUrl);
      setSessionId(sessionId);
      setStep('verify');
      toast.success('Verification session initialized');
    } catch (error) {
      toast.error('Failed to start verification');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const result = await checkVerificationStatus(sessionId);
      setVerification(result);

      if (result.status === 'approved') {
        setStep('completed');
        toast.success('Verification approved!');
        onSuccess?.(result);
      } else if (result.status === 'pending') {
        setStep('review');
        toast.info('Your verification is under review');
      } else {
        setStep('failed');
        toast.error(`Verification ${result.status}`);
      }
    } catch (error) {
      toast.error('Failed to check status');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    try {
      setLoading(true);
      const { veriffUrl, sessionId } = await retryVerification(userId);
      setVeriffUrl(veriffUrl);
      setSessionId(sessionId);
      setStep('verify');
      toast.success('New verification session created');
    } catch (error) {
      toast.error('Failed to retry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Stepper */}
      <div className="mb-12">
        <div className="flex justify-between mb-8">
          {steps.map((label, index) => {
            let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
            if (index < currentStepIndex) status = 'completed';
            if (index === currentStepIndex) status = 'current';

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition ${
                    status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : status === 'current'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <FiCheckCircle size={24} />
                  ) : (
                    <FiCircle size={24} />
                  )}
                </div>
                <p
                  className={`text-sm text-center ${
                    status === 'current' ? 'font-bold text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {step === 'info' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Identity Verification
              </h2>
              <p className="text-gray-600">
                We need to verify your identity to continue. This process takes about 5 minutes.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ A valid government-issued ID or passport</li>
                <li>✓ A quiet place with good lighting</li>
                <li>✓ Your webcam or mobile device</li>
              </ul>
            </div>

            <button
              onClick={handleStartVerification}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                'Start Verification'
              )}
            </button>
          </div>
        )}

        {step === 'verify' && veriffUrl && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Facial Verification</h2>
            <p className="text-gray-600 mb-6">
              Follow the instructions to complete your verification.
            </p>
            <VeriffSDK
              verificationUrl={veriffUrl}
              onComplete={handleVerificationComplete}
              onError={(error) => {
                toast.error('Verification error occurred');
                setStep('failed');
              }}
            />
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6 text-center">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-center mb-2">
                <FiAlertCircle className="text-yellow-600 mr-2" />
                <h3 className="font-semibold text-yellow-900">Under Review</h3>
              </div>
              <p className="text-sm text-yellow-800">
                Your verification is currently under manual review. This usually takes 24-48 hours.
              </p>
            </div>

            <p className="text-gray-600">
              We'll send you an email as soon as the review is complete.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {step === 'completed' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <FiCheckCircle size={48} className="text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Complete!
              </h2>
              <p className="text-gray-600">
                Your identity has been verified successfully.
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {step === 'failed' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full">
                <FiAlertCircle size={48} className="text-red-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600">
                {verification?.rejectionReason || 'Your verification could not be completed.'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRetry}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="mr-2" />
                    Try Again
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
