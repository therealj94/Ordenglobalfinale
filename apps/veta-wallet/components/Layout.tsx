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
    <div className="min-h-screen bg-[#0b0b12]">
      <nav className="bg-[#131320] border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <FiCreditCard className="text-white" size={16} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Veta Wallet</span>
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-violet-400 transition flex items-center gap-1.5">
                <FiCreditCard /> Dashboard
              </Link>
              <Link href="/send" className="text-sm text-gray-400 hover:text-violet-400 transition flex items-center gap-1.5">
                <FiSend /> Send
              </Link>
              <Link href="/transactions" className="text-sm text-gray-400 hover:text-violet-400 transition flex items-center gap-1.5">
                <FiClock /> History
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-400 transition flex items-center gap-1.5">
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
