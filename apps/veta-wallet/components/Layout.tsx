import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiCreditCard, FiSend, FiClock, FiLogOut } from 'react-icons/fi';
import { useWalletAuth } from '@/hooks/useWalletAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useWalletAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FiCreditCard className="text-emerald-600" size={24} />
            <span className="text-xl font-bold text-gray-900">Veta Wallet</span>
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1">
                <FiCreditCard /> Dashboard
              </Link>
              <Link href="/send" className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1">
                <FiSend /> Send
              </Link>
              <Link href="/transactions" className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1">
                <FiClock /> History
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
