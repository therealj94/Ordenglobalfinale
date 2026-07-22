import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { FiSend, FiLoader, FiHash, FiCheckCircle } from 'react-icons/fi';

export default function SendPage() {
  const router = useRouter();
  const { user, refreshProfile, initializing } = useWalletAuth();
  const [checking, setChecking] = useState(true);
  const [toGid, setToGid] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ amount: string; toGid: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toGid || !amount) {
      toast.error('GENESIS ID and amount are required');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/wallet/transfer', { toGid: toGid.trim(), amount: Number(amount), description: description || undefined });
      setSuccess({ amount, toGid: toGid.trim() });
      setToGid('');
      setAmount('');
      setDescription('');
      await refreshProfile();
      toast.success('Transfer completed!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="max-w-lg mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Send Credits</h1>
        <p className="text-gray-500 mb-8">
          Send Veta Credits to anyone by their GENESIS ID. Your balance:{' '}
          <span className="font-semibold text-violet-400">{Number(user.balance).toFixed(2)} VC</span>
        </p>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg p-4 mb-6 flex items-start gap-3">
            <FiCheckCircle className="mt-0.5 shrink-0" />
            <p>
              Sent <span className="font-semibold">{Number(success.amount).toFixed(2)} VC</span> to{' '}
              <span className="font-mono">{success.toGid}</span>.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#15151f] border border-white/10 rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Recipient&apos;s GENESIS ID</label>
            <div className="relative">
              <FiHash className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                value={toGid}
                onChange={(e) => setToGid(e.target.value)}
                placeholder="GID-85m856-HND"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e16] border border-white/10 rounded-lg text-white placeholder-gray-600 font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (VC)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 bg-[#0e0e16] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Note (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
              className="w-full px-4 py-2.5 bg-[#0e0e16] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-lg font-semibold hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 transition flex items-center justify-center shadow-lg shadow-violet-900/40"
          >
            {submitting ? <FiLoader className="animate-spin mr-2" /> : <FiSend className="mr-2" />}
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
