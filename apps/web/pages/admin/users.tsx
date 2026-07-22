import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { apiClient } from '@/lib/apiClient';
import { User } from '@/types';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiLoader,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const STATUS_STYLES: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700'
};

export default function AdminUsersPage() {
  const { checking } = useRequireAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users', {
        params: { page, limit, search: search || undefined, status: statusFilter || undefined }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (!checking) fetchUsers();
  }, [checking, fetchUsers]);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Deactivate user ${email}? This can be reversed by a database admin.`)) return;

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout withSidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">{total} registered users</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FiLoader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Registered</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{user.fullName || '—'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.status === 'verified' && <FiCheckCircle className="mr-1" size={12} />}
                          {user.status === 'pending' && <FiClock className="mr-1" size={12} />}
                          {user.status === 'rejected' && <FiXCircle className="mr-1" size={12} />}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="text-red-600 hover:text-red-800"
                          title="Deactivate user"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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
    </Layout>
  );
}
