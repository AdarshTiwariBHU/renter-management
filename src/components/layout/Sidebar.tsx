'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Zap,
  Receipt,
  CreditCard,
  History,
  BarChart3,
  Settings,
  Building2,
  UserCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/renters', label: 'Renters', icon: Users },
  { href: '/admin/renter-requests', label: 'Renter Requests', icon: UserCheck },
  { href: '/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/electricity', label: 'Electricity', icon: Zap },
  { href: '/bills', label: 'Bills', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                KirayaPro
              </span>
              <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase">
                Tenancy Platform
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* System status pill */}
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-white font-medium text-[11px]">System Online</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">MongoDB Connected & Synced</p>
          </div>
        </div>
      </aside>
    </>
  );
};
