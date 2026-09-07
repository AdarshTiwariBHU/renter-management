import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'KirayaPro - Smart Renter & Tenancy Management System',
  description: 'KirayaPro: Complete full-stack system for managing renters, rooms, meters, electricity bills, payments, and ledger.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
