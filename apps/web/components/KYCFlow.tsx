import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useVerification } from '@/hooks/useVerification';
import toast from 'react-hot-toast';
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
}

type Step = 'info' | 'facial' | 'document' | 'submitting' | 'review' | 'completed' | 'failed';

export default function KYCFlow({ userId, onSuccess, onStatusChange }: KYCFlowProps) {
  const router = useRouter();
  const { submitKYC, getKYCStatus, loading } = useVerification();
  const [step, setStep] = useState<Step>('info');
  const [selfieImages, setSelfieImages] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const steps = ['Start', 'Facial Verification', 'Document Scan', 'Review', 'Completed'];
  const currentStepIndex = ['info', 'facial', 'document', 'submitting', 'completed'].indexOf(
    step === 'review' || step === 'failed' ? 'submitting' : step
  );

  const handleStartVerification = () => {
    setStep('facial');
  };

  const handleFacialComplete = (photos: string[]) => {
    setSelfieImages(photos);
    toast.success('Facial verification captured!');
    setStep('document');
  };

  const handleDocumentComplete = async (result: DocumentCaptureResult) => {
    setStep('submitting');
    try {
      await submitKYC({
        userId,
        documentType: result.documentType,
        documentFrontImage: result.frontImage,
        documentBackImage: result.backImage,
        selfieImages,
        livenessResult: { anglesCaptured: selfieImages.length, method: 'guided-rotation' }
      });

      toast.success('Submitted! Your verification is being reviewed.');

      // Poll briefly in case a fast automatic decision comes back
      const status = await getKYCStatus(userId);
      if (status.status === 'approved') {
        setStep('completed');
        onSuccess?.(status);
        onStatusChange?.('approved', status);
      } else if (status.status === 'rejected') {
        setRejectionReason(status.rejectionReason || null);
        setStep('failed');
        onStatusChange?.('rejected', status);
      } else {
        setStep('review');
        onStatusChange?.('pending', status);
      }
    } catch (error) {
      toast.error('Failed to submit verification');
      setStep('failed');
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
                  Complete your identity verification in just 3 steps. This secure process takes about 5 minutes.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl mr-4">📸</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Facial Verification</h3>
                      <p className="text-gray-600 text-sm">We'll capture your face from 5 angles to verify liveness</p>
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
              <p className="text-gray-600 text-lg">Uploading and processing your verification...</p>
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
                Your verification is being manually reviewed by our team. This usually takes 24-48 hours.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
                <p className="text-gray-700">
                  📧 We'll send you an email notification as soon as the review is complete.
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
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
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Your identity has been verified successfully. You now have access to all Orden Global apps.
              </p>

              <button
                onClick={() => router.push('/dashboard')}
                className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition transform hover:scale-105"
              >
                Go to Dashboard
              </button>
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
    </div>
  );
}
