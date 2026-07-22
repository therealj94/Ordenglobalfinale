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
          <FiLoader className="animate-spin text-violet-500" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome, {user.fullName || user.email}</h1>
          <p className="text-gray-500">Your Veta Wallet overview</p>
        </div>

        {/* Balance card */}
        <div className="relative rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden bg-[#15151f] border border-white/10">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-fuchsia-600/10 blur-[80px] pointer-events-none" />

          <div className="relative">
            <p className="text-gray-400 text-sm mb-1">Available Balance</p>
            <p className="text-4xl font-bold tracking-wide mb-4 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              {formatBalance(user.balance)} VC
            </p>
            <div className="flex items-center text-gray-400 text-sm">
              <FiHash className="mr-1" />
              <span className="font-mono">{user.gid}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.gid);
                  toast.success('GENESIS ID copied');
                }}
                className="ml-2 hover:text-violet-400 transition"
                title="Copy GENESIS ID"
              >
                <FiCopy size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/send"
            className="bg-[#15151f] border border-white/10 rounded-xl shadow p-6 flex items-center gap-4 hover:border-violet-500/40 hover:bg-[#181822] transition"
          >
            <div className="w-12 h-12 rounded-full bg-violet-500/15 flex items-center justify-center">
              <FiSend className="text-violet-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white">Send Credits</p>
              <p className="text-sm text-gray-500">To any GENESIS ID</p>
            </div>
          </Link>

          <Link
            href="/transactions"
            className="bg-[#15151f] border border-white/10 rounded-xl shadow p-6 flex items-center gap-4 hover:border-violet-500/40 hover:bg-[#181822] transition"
          >
            <div className="w-12 h-12 rounded-full bg-violet-500/15 flex items-center justify-center">
              <FiClock className="text-violet-400" size={20} />
            </div>
            <div>
              <p className="font-semibold text-white">Transaction History</p>
              <p className="text-sm text-gray-500">See all activity</p>
            </div>
          </Link>
        </div>

        <div className="bg-[#15151f] border border-white/10 rounded-xl shadow p-6 text-sm text-gray-500">
          VC = Veta Credits, an internal balance shared across the Orden Global ecosystem. Not real currency.
        </div>
      </div>
    </Layout>
  );
}
