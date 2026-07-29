import React, { useState } from 'react';
import Link from 'next/link';
import { LanguageToggle } from '@/lib/i18n';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">GENESIS ID</div>
          </Link>

          {/* Language switch lives in the header so it's reachable from every
              page, including mid-verification. */}
          <div className="ml-auto mr-3">
            <LanguageToggle tone="dark" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                Admin
              </Link>
            )}
            {user && (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Status: <span className="capitalize">{user.status}</span>
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex space-x-4">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-200">
            <Link href="/" className="block px-4 py-2 text-gray-600">
              Home
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-600">
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block px-4 py-2 text-gray-600">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
