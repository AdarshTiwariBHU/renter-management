'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onToggleSidebar: () => void;
  onOpenQuickMeter?: () => void;
  onOpenRecordPayment?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onToggleSidebar,
}) => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/properties', label: 'Properties', icon: Building2 },
    { href: '/rooms', label: 'Rooms', icon: DoorOpen },
    { href: '/renters', label: 'Renters', icon: Users },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
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
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[44px] ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu / More button */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900 font-medium transition-all min-w-[56px] min-h-[44px]"
          aria-label="Open full menu"
        >
          <div className="p-1 rounded-lg text-slate-500">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};
