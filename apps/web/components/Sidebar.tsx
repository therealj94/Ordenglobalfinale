import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome,
  FiUsers,
  FiCheckCircle,
  FiBarChart2,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (path: string) => router.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const menuItems = [
    { href: '/admin', icon: FiHome, label: 'Dashboard' },
    { href: '/admin/users', icon: FiUsers, label: 'Users' },
    { href: '/admin/verifications', icon: FiCheckCircle, label: 'Verifications' },
    { href: '/admin/reviews', icon: FiUsers, label: 'Manual Reviews' },
    { href: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
    { href: '/admin/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <FiLogOut className="mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
