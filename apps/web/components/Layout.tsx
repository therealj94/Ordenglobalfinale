import React from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Sidebar from './Sidebar';
import BuildStamp from './BuildStamp';

interface LayoutProps {
  children: React.ReactNode;
  withSidebar?: boolean;
}

export default function Layout({ children, withSidebar = false }: LayoutProps) {
  const router = useRouter();
  const isAuthPage = router.pathname.includes('/auth');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {!isAuthPage && <Header />}

      <div className="flex">
        {withSidebar && !isAuthPage && <Sidebar />}

        <main
          className={`flex-1 ${
            isAuthPage ? '' : 'p-6'
          }`}
        >
          {children}
        </main>
      </div>

      {/* On every page, so "which build am I looking at?" is never a guess. */}
      <footer className="py-4 px-4">
        <BuildStamp className="text-white" />
      </footer>
    </div>
  );
}
