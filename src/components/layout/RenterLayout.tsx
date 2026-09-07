'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Zap,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  CreditCard,
  FileText,
} from 'lucide-react';

interface RenterLayoutProps {
  children: React.ReactNode;
}

export const RenterLayout: React.FC<RenterLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

  // Validate session and check if deactivated or revoked in real-time
  useEffect(() => {
    let isMounted = true;
    const checkSession = () => {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((json) => {
          if (!isMounted) return;
          if (json.isRevoked) {
            router.push('/login?revoked=true');
            return;
          }
          if (!json.success || json.isDeactivated) {
            router.push('/login');
            return;
          }
          setUserProfile(json.data);
        })
        .catch(() => {
          // network error ignored
        });
    };

    checkSession();
    window.addEventListener('focus', checkSession);
    const interval = setInterval(checkSession, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', checkSession);
      clearInterval(interval);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const navItems = [
    { href: '/renter/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { href: '/renter/profile', label: 'My Profile & Proofs', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/renter/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                  KirayaPro
                </span>
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">
                  Tenant Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userProfile && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {userProfile.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {userProfile.loginId || userProfile.username}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200 flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Sticky Bottom Nav for Renters */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 py-1.5 flex items-center justify-around safe-area-pb">
        <Link
          href="/renter/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] ${
            pathname === '/renter/dashboard'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname === '/renter/dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Dashboard</span>
        </Link>

        <Link
          href="/renter/profile"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] min-h-[44px] ${
            pathname === '/renter/profile'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg ${pathname === '/renter/profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">My Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-rose-600 font-medium transition-all min-w-[64px] min-h-[44px]"
        >
          <div className="p-1 rounded-lg text-slate-500">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Sign Out</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>KirayaPro Tenant Portal • Support: +91 98765 43210</p>
      </footer>
    </div>
  );
};
