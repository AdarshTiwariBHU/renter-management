'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickMeterModal } from '../modals/QuickMeterModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { ReceiptModal, ReceiptData } from '../modals/ReceiptModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickMeterOpen, setQuickMeterOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Active session revocation monitoring (Logout from all devices)
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401 || res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (data.isRevoked || !data.success) {
            if (isMounted) {
              window.location.href = '/login?revoked=true';
            }
          }
        }
      } catch {
        // Silently ignore transient network blips
      }
    };

    checkSession();

    const handleFocus = () => {
      checkSession();
    };
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(checkSession, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handlePaymentSuccess = (data?: any) => {
    if (data && data.receiptNumber) {
      setReceiptData({
        receiptNumber: data.receiptNumber,
        renterName: data.payment?.renterId?.fullName || 'Renter',
        roomNumber: data.bill?.roomNumber || '—',
        billingMonth: data.bill?.billingMonth || new Date().toISOString().slice(0, 7),
        rentAmount: data.bill?.rentAmount || 0,
        electricityAmount: data.bill?.electricityAmount || 0,
        otherCharges: data.bill?.otherCharges || 0,
        previousDue: data.bill?.previousDue || 0,
        totalPayable: data.bill?.totalPayable || data.payment?.amount || 0,
        paidAmount: data.payment?.amount || 0,
        remainingBalance: data.bill?.balance || 0,
        paymentDate: data.payment?.paymentDate || new Date().toISOString(),
        paymentMethod: data.payment?.paymentMethod || 'UPI',
        transactionReference: data.payment?.transactionReference,
        notes: data.payment?.notes,
        receivedBy: data.payment?.receivedBy || 'Admin',
      });
      setReceiptModalOpen(true);
    }
    // Refresh page data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <TopBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenQuickMeter={() => setQuickMeterOpen(true)}
          onOpenRecordPayment={() => setRecordPaymentOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenQuickMeter={() => setQuickMeterOpen(true)}
        onOpenRecordPayment={() => setRecordPaymentOpen(true)}
      />

      {/* Global Modals */}
      <QuickMeterModal
        isOpen={quickMeterOpen}
        onClose={() => setQuickMeterOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        data={receiptData}
      />
    </div>
  );
};
