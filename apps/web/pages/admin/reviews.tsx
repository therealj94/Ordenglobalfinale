import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { apiClient } from '@/lib/apiClient';
import DocumentViewer from '@/components/DocumentViewer';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiFileText,
  FiLoader,
  FiImage
} from 'react-icons/fi';

interface ReviewCase {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
    createdAt: string;
  };
  verification: {
    id: string;
    documentType?: string;
    status: string;
    documentFrontImage?: string;
    documentBackImage?: string;
    selfieImages?: string[];
    rawData?: any;
  };
}

export default function AdminReviewsPage() {
  const { checking } = useRequireAdmin();
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<ReviewCase | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const fetchReviewCases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/manual-reviews', {
        params: { status: 'pending' }
      });
      setCases(response.data.cases);
    } catch (error) {
      toast.error('Failed to load review cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checking) fetchReviewCases();
  }, [checking, fetchReviewCases]);

  const handleApprove = async (caseId: string) => {
    try {
      setReviewingId(caseId);
      await apiClient.post(`/admin/reviews/${caseId}/approve`, { notes: reviewNotes });
      toast.success('Verification approved');
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      setSelectedCase(null);
      setReviewNotes('');
    } catch (error) {
      toast.error('Failed to approve verification');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (caseId: string) => {
    if (!reviewNotes.trim()) {
      toast.error('Please add a reason before rejecting');
      return;
    }
    try {
      setReviewingId(caseId);
      await apiClient.post(`/admin/reviews/${caseId}/reject`, { notes: reviewNotes });
      toast.success('Verification rejected');
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      setSelectedCase(null);
      setReviewNotes('');
    } catch (error) {
      toast.error('Failed to reject verification');
    } finally {
      setReviewingId(null);
    }
  };

  if (checking) return null;

  return (
    <Layout withSidebar>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual Review Queue</h1>
          <p className="text-gray-600">{cases.length} verification(s) pending manual review</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FiLoader className="animate-spin text-blue-600" size={32} />
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FiCheckCircle size={48} className="text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">No pending reviews. All verifications processed!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Pending Cases</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-[32rem] overflow-y-auto">
                  {cases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => setSelectedCase(caseItem)}
                      className={`w-full text-left p-4 hover:bg-blue-50 transition ${
                        selectedCase?.id === caseItem.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <FiUser className="mr-2 text-gray-400" />
                        <p className="font-medium text-gray-900 truncate">
                          {caseItem.user.fullName || caseItem.user.email}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">{caseItem.user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{caseItem.verification.documentType}</p>
                      <div className="mt-2 flex items-center text-xs text-orange-600">
                        <FiClock size={12} className="mr-1" />
                        Pending
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Case Details */}
            <div className="lg:col-span-2">
              {selectedCase ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {selectedCase.user.fullName || 'User'}
                    </h2>
                    <p className="text-gray-600 text-sm">{selectedCase.user.email}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                      <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">Phone:</span>{' '}
                          <span className="font-medium">{selectedCase.user.phone || 'N/A'}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Registered:</span>{' '}
                          <span className="font-medium">
                            {new Date(selectedCase.user.createdAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Reason for Review:</span>{' '}
                          <span className="font-medium">{selectedCase.reason}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Verification Details</h3>
                        <button
                          onClick={() => setShowDocs(true)}
                          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          <FiImage className="mr-1" /> View Documents & Selfies
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">Document Type:</span>{' '}
                          <span className="font-medium">{selectedCase.verification.documentType || 'N/A'}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Selfie angles captured:</span>{' '}
                          <span className="font-medium">
                            {selectedCase.verification.selfieImages?.length || 0}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-900 mb-2">Review Notes</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add your review notes here (required if rejecting)..."
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedCase.id)}
                        disabled={reviewingId === selectedCase.id}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center"
                      >
                        {reviewingId === selectedCase.id ? (
                          <FiLoader className="animate-spin mr-2" />
                        ) : (
                          <FiCheckCircle className="mr-2" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedCase.id)}
                        disabled={reviewingId === selectedCase.id}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center"
                      >
                        {reviewingId === selectedCase.id ? (
                          <FiLoader className="animate-spin mr-2" />
                        ) : (
                          <FiXCircle className="mr-2" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <FiFileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a case to review</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showDocs && selectedCase && (
        <DocumentViewer verification={selectedCase.verification} onClose={() => setShowDocs(false)} />
      )}
    </Layout>
  );
}
