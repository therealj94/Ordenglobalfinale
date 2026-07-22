import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { apiClient } from '@/lib/apiClient';
import DocumentViewer from '@/components/DocumentViewer';
import toast from 'react-hot-toast';
import { FiLoader, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700',
  abandoned: 'bg-gray-100 text-gray-700'
};

interface VerificationRow {
  id: string;
  status: string;
  documentType?: string;
  reviewMode: string;
  createdAt: string;
  verifiedAt?: string;
  User: { email: string; fullName?: string };
}

export default function AdminVerificationsPage() {
  const { checking } = useRequireAdmin();
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const limit = 20;

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/verifications', {
        params: { page, limit, status: statusFilter || undefined }
      });
      setVerifications(response.data.verifications);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!checking) fetchVerifications();
  }, [checking, fetchVerifications]);

  const viewDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const response = await apiClient.get(`/admin/verifications/${id}`);
      setSelected(response.data);
    } catch (error) {
      toast.error('Failed to load verification detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout withSidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verifications</h1>
          <p className="text-gray-600">{total} total verification attempts</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FiLoader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : verifications.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No verifications found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Document</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Mode</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{v.User?.fullName || '—'}</p>
                        <p className="text-sm text-gray-500">{v.User?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{v.documentType || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            STATUS_STYLES[v.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{v.reviewMode}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewDetail(v.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                        >
                          <FiEye className="mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  <FiChevronLeft />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <FiLoader className="animate-spin text-white" size={40} />
        </div>
      )}

      {selected && <DocumentViewer verification={selected} onClose={() => setSelected(null)} />}
    </Layout>
  );
}
