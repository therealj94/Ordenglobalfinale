import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

export type DocumentType = 'PASSPORT' | 'ID_CARD' | 'DRIVERS_LICENSE';

export interface AMLInfo {
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  occupation: string;
  sourceOfFunds: string;
  isPEP: boolean;
  pepDetails?: string;
}

export interface KYCSubmission {
  userId: string;
  documentType: DocumentType;
  documentCountry?: string;
  documentFrontImage: string;
  documentBackImage?: string;
  selfieImages: string[];
  livenessResult?: Record<string, any>;
  amlInfo: AMLInfo;
}

export interface KYCStatus {
  verificationId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'abandoned';
  reviewMode: 'automatic' | 'manual';
  verifiedAt?: string;
  rejectionReason?: string;
}

export const useVerification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitKYC = useCallback(async (data: KYCSubmission) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<{ verificationId: string; status: string }>(
        '/kyc/submit',
        data
      );

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to submit KYC data';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getKYCStatus = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.get<KYCStatus>(`/kyc/status/${userId}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to get KYC status';
      setError(message);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    submitKYC,
    getKYCStatus
  };
};
