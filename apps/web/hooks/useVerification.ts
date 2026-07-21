import { useState, useCallback } from 'react';
import { Verification, VerificationSession } from '@/types';
import { apiClient } from '@/lib/apiClient';

export const useVerification = () => {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [session, setSession] = useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<'idle' | 'initializing' | 'verifying' | 'completed' | 'failed'>('idle');

  const initializeVerification = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      setProgress('initializing');

      const response = await apiClient.post<{
        veriffUrl: string;
        sessionId: string;
      }>('/auth/verify-init', { userId });

      const { veriffUrl, sessionId } = response.data;
      setProgress('verifying');

      return { veriffUrl, sessionId };
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to initialize verification';
      setError(message);
      setProgress('failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkVerificationStatus = useCallback(async (sessionId: string) => {
    try {
      const response = await apiClient.get<Verification>(
        `/auth/verify-status/${sessionId}`
      );
      setVerification(response.data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to check status';
      setError(message);
      throw err;
    }
  }, []);

  const submitKYCData = useCallback(async (userId: string, kycData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/kyc/submit', {
        userId,
        kycData
      });

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to submit KYC data';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const retryVerification = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      setProgress('idle');

      return await initializeVerification(userId);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initializeVerification]);

  return {
    verification,
    session,
    loading,
    error,
    progress,
    initializeVerification,
    checkVerificationStatus,
    submitKYCData,
    retryVerification
  };
};
