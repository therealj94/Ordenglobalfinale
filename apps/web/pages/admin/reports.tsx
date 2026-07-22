import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiLoader, FiActivity } from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface LogEntry {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

interface ReportsData {
  today: { newUsers: number; verifications: number; appLinked: number };
  overall: { totalUsers: number; verifiedUsers: number; pendingUsers: number; verificationRate: string };
  trend: { date: string; count: string; status: string }[];
}

export default function AdminReportsPage() {
  const { checking } = useRequireAdmin();
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsRes, logsRes] = await Promise.all([
        apiClient.get('/admin/reports'),
        apiClient.get('/admin/logs', { params: { limit: 15 } })
      ]);
      setReports(reportsRes.data);
      setLogs(logsRes.data.logs);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checking) fetchData();
  }, [checking, fetchData]);

  if (checking || loading) {
    return (
      <Layout withSidebar>
        <div className="flex items-center justify-center h-96">
          <FiLoader className="animate-spin text-blue-600" size={32} />
        </div>
      </Layout>
    );
  }

  const byDateStatus: Record<string, any> = {};
  (reports?.trend || []).forEach((row) => {
    const date = new Date(row.date).toLocaleDateString();
    if (!byDateStatus[date]) byDateStatus[date] = { date };
    byDateStatus[date][row.status] = Number(row.count);
  });
  const chartData = Object.values(byDateStatus).reverse();

  return (
    <Layout withSidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and audit trail</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{reports?.today.newUsers ?? 0}</p>
            <p className="text-gray-500 text-sm mt-1">New Users Today</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{reports?.today.verifications ?? 0}</p>
            <p className="text-gray-500 text-sm mt-1">Verifications Today</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{reports?.today.appLinked ?? 0}</p>
            <p className="text-gray-500 text-sm mt-1">Apps Linked Today</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Verifications by Day & Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#10b981" name="Approved" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center">
            <FiActivity className="mr-2 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Recent Admin Activity</h3>
          </div>
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No admin activity yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-gray-500 text-sm">{log.description}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
