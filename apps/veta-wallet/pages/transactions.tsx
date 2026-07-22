import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { apiClient } from '@/lib/apiClient';
import { WalletTransaction } from '@/types';
import { FiLoader, FiArrowDownLeft, FiArrowUpRight, FiGift } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const router = useRouter();
  const { user, refreshProfile, initializing } = useWalletAuth();
  const [checking, setChecking] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/wallet/transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initializing) return;
    const token = localStorage.getItem('vetaWalletToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    refreshProfile()
      .then(() => fetchTransactions())
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
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Transaction History</h1>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <FiLoader className="animate-spin text-emerald-600" size={28} />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No transactions yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'welcome_bonus'
                          ? 'bg-amber-100 text-amber-600'
                          : tx.direction === 'in'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {tx.type === 'welcome_bonus' ? (
                        <FiGift />
                      ) : tx.direction === 'in' ? (
                        <FiArrowDownLeft />
                      ) : (
                        <FiArrowUpRight />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.type === 'welcome_bonus'
                          ? 'Welcome bonus'
                          : tx.direction === 'in'
                          ? `From ${tx.fromGid}`
                          : `To ${tx.toGid}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                        {tx.description ? ` · ${tx.description}` : ''}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.direction === 'in' || tx.type === 'welcome_bonus' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.direction === 'in' || tx.type === 'welcome_bonus' ? '+' : '-'}
                    {Number(tx.amount).toFixed(2)} VC
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
