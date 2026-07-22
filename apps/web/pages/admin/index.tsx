import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { apiClient } from '@/lib/apiClient';
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiLink,
  FiLoader
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ReportsData {
  today: { newUsers: number; verifications: number; appLinked: number };
  overall: {
    totalUsers: number;
    verifiedUsers: number;
    pendingUsers: number;
    verificationRate: string;
  };
  trend: { date: string; count: string; status: string }[];
}

const COLORS: Record<string, string> = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  expired: '#6b7280',
  abandoned: '#9ca3af'
};

export default function AdminDashboardPage() {
  const { checking } = useRequireAdmin();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checking) return;

    const fetchReports = async () => {
      try {
        const response = await apiClient.get<ReportsData>('/admin/reports');
        setData(response.data);
      } catch (error) {
        console.error('Failed to load reports', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [checking]);

  if (checking || loading) {
    return (
      <Layout withSidebar>
        <div className="flex items-center justify-center h-96">
          <FiLoader className="animate-spin text-blue-600" size={32} />
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: data?.overall.totalUsers ?? 0,
      icon: FiUsers,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Verified Users',
      value: data?.overall.verifiedUsers ?? 0,
      icon: FiCheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      label: 'Pending Review',
      value: data?.overall.pendingUsers ?? 0,
      icon: FiClock,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      label: 'Apps Linked Today',
      value: data?.today.appLinked ?? 0,
      icon: FiLink,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  // Aggregate trend data by date for the line chart
  const trendByDate: Record<string, any> = {};
  (data?.trend || []).forEach((row) => {
    const date = new Date(row.date).toLocaleDateString();
    if (!trendByDate[date]) trendByDate[date] = { date };
    trendByDate[date][row.status] = Number(row.count);
  });
  const trendChartData = Object.values(trendByDate).reverse();

  const statusPieData = [
    { name: 'Verified', value: data?.overall.verifiedUsers ?? 0, key: 'approved' },
    { name: 'Pending', value: data?.overall.pendingUsers ?? 0, key: 'pending' }
  ];

  return (
    <Layout withSidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of GENESIS ID verification activity</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="text-gray-500 text-sm mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Verification Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Verification Trend (30 days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="approved" stroke={COLORS.approved} strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="pending" stroke={COLORS.pending} strokeWidth={2} name="Pending" />
                <Line type="monotone" dataKey="rejected" stroke={COLORS.rejected} strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">User Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Rate Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow p-8 text-white flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-1">Overall Verification Success Rate</p>
            <p className="text-4xl font-bold">{data?.overall.verificationRate ?? '0%'}</p>
          </div>
          <FiCheckCircle size={64} className="opacity-30" />
        </div>
      </div>
    </Layout>
  );
}
