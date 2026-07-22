import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { FiSend, FiClock, FiCopy, FiLoader, FiHash } from 'react-icons/fi';
import toast from 'react-hot-toast';

function formatBalance(balance: string | number) {
  return Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, refreshProfile, initializing } = useWalletAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (initializing) return;
    const token = localStorage.getItem('vetaWalletToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    refreshProfile()
      .catch(() => router.replace('/login'))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing]);

  if (checking || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <FiLoader className="animate-spin text-emerald-600" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.fullName || user.email}</h1>
          <p className="text-gray-600">Your Veta Wallet overview</p>
        </div>

        {/* Balance card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl shadow p-8 mb-8 text-white">
          <p className="text-emerald-100 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold tracking-wide mb-4">{formatBalance(user.balance)} VC</p>
          <div className="flex items-center text-emerald-100 text-sm">
            <FiHash className="mr-1" />
            <span className="font-mono">{user.gid}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.gid);
                toast.success('GENESIS ID copied');
              }}
              className="ml-2 hover:text-white"
              title="Copy GENESIS ID"
            >
              <FiCopy size={14} />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/send"
            className="bg-white rounded-xl shadow p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <FiSend className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Send Credits</p>
              <p className="text-sm text-gray-500">To any GENESIS ID</p>
            </div>
          </Link>

          <Link
            href="/transactions"
            className="bg-white rounded-xl shadow p-6 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <FiClock className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Transaction History</p>
              <p className="text-sm text-gray-500">See all activity</p>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">
          VC = Veta Credits, an internal balance shared across the Orden Global ecosystem. Not real currency.
        </div>
      </div>
    </Layout>
  );
}
