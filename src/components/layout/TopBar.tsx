'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Zap,
  CreditCard,
  UserPlus,
  LogOut,
  User,
  Shield,
  X,
} from 'lucide-react';
import { PropertySwitcher } from '@/components/properties/PropertySwitcher';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenQuickMeter: () => void;
  onOpenRecordPayment: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenQuickMeter,
  onOpenRecordPayment,
}) => {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null);

  React.useEffect(() => {
    const fetchAdminProfile = () => {
      fetch('/api/admin/profile')
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.data) {
            setAdminUser(d.data);
          }
        })
        .catch(() => {});
    };

    fetchAdminProfile();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleProfileUpdate = (e: any) => {
      if (e?.detail) {
        setAdminUser((prev) => ({
          name: e.detail.name || prev?.name || 'Administrator',
          email: e.detail.email || prev?.email || 'adarshcsbhu@gmail.com',
          avatarUrl: e.detail.avatarUrl !== undefined ? e.detail.avatarUrl : prev?.avatarUrl,
        }));
      } else {
        fetchAdminProfile();
      }
    };

    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/renters?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Left side: Hamburger Toggle & Mobile Property Switcher / Desktop Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-full max-w-xs lg:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search renter, room, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none transition text-slate-800"
            />
          </form>

          {/* Mobile Property Switcher on left */}
          <div className="md:hidden min-w-0">
            <PropertySwitcher />
          </div>
        </div>

        {/* Center/Property Selector (Desktop) */}
        <div className="hidden md:flex items-center">
          <PropertySwitcher />
        </div>

        {/* Right side: Quick Action Buttons & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            aria-label="Search"
            title="Search"
          >
            {mobileSearchOpen ? <X className="w-4 h-4 text-slate-700" /> : <Search className="w-4 h-4" />}
          </button>

          {/* ⚡ Update Meter Reading Quick Action (Most prominent!) */}
          <button
            onClick={onOpenQuickMeter}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-xs transition active:scale-95 shrink-0"
            title="Fast electricity meter reading update"
          >
            <Zap className="w-4 h-4 fill-amber-950 shrink-0" />
            <span className="hidden sm:inline">Update Meter</span>
          </button>

          {/* 💳 Record Payment (Desktop) */}
          <button
            onClick={onOpenRecordPayment}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition active:scale-95 shrink-0"
            title="Record full or partial payment"
          >
            <CreditCard className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>Record Payment</span>
          </button>

          {/* + Add Renter (Desktop) */}
          <button
            onClick={() => router.push('/renters/new')}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Add Renter</span>
          </button>

          {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            {adminUser?.avatarUrl ? (
              <img
                src={adminUser.avatarUrl}
                alt="Admin Avatar"
                className="w-8 h-8 rounded-lg object-cover shadow-xs border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {adminUser?.name
                  ? adminUser.name.slice(0, 2).toUpperCase()
                  : 'AD'}
              </div>
            )}
            <span className="hidden lg:block text-xs font-semibold text-slate-700">
              {adminUser?.name?.split(' ')[0] || 'Admin'}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-800 text-sm truncate">{adminUser?.name || 'Administrator'}</p>
                <p className="text-slate-400 text-[11px] truncate">{adminUser?.email || 'adarshcsbhu@gmail.com'}</p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/settings#profile');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-600" /> Edit Admin Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/settings');
                }}
                className="w-full text-left px-3.5 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
              >
                <Shield className="w-4 h-4 text-slate-400" /> Property Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 font-medium transition cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Expandable Mobile Search Row */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 pt-1 border-t border-slate-100 bg-white animate-in slide-in-from-top-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search renter, room, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none transition text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </header>
  );
};
