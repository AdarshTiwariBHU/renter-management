'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Printer,
  RefreshCw,
  Search,
  Filter,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { ReceiptModal, ReceiptData } from '@/components/modals/ReceiptModal';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';

interface PaymentItem {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renterId: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billId?: any;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  receiptNumber: string;
  receivedBy: string;
  notes?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState({ totalCollected: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState('ALL');
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = method !== 'ALL' ? `/api/payments?method=${method}` : '/api/payments';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
        setSummary(json.summary || { totalCollected: 0, count: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [method]);

  const handleOpenReceipt = (p: PaymentItem) => {
    setReceiptData({
      receiptNumber: p.receiptNumber,
      renterName: p.renterId?.fullName || 'Tenant',
      roomNumber: p.renterId?.roomNumber || '—',
      mobile: p.renterId?.mobile,
      billingMonth: p.billId?.billingMonth || new Date(p.paymentDate).toISOString().slice(0, 7),
      rentAmount: p.amount,
      electricityAmount: 0,
      totalPayable: p.amount,
      paidAmount: p.amount,
      remainingBalance: p.billId?.balance || 0,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference,
      notes: p.notes,
      receivedBy: p.receivedBy,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600" /> Payments & Collection Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verified payment transactions, receipts, and partial collection tracking.
            </p>
          </div>

          <button
            onClick={() => setRecordPaymentOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" /> Record Payment
          </button>
        </div>

        {/* Top KPI Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Total Payments Collected
            </span>
            <span className="text-3xl font-bold text-emerald-950 mt-1 block">
              {formatCurrency(summary.totalCollected)}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {summary.count} total payment receipts issued
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/80 p-1.5 rounded-xl border border-emerald-200 text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none touch-scroll max-w-full">
            {['ALL', 'UPI', 'CASH', 'BANK_TRANSFER'].map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  method === m
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'ALL' ? 'All Methods' : m === 'BANK_TRANSFER' ? 'Bank Transfer' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" /> Loading payment records...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No payment transactions found.
            </div>
          ) : (
            <>
              {/* Mobile Card Layout (Visible on small screens) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        {p.renterId ? (
                          <Link
                            href={`/renters/${p.renterId._id}`}
                            className="font-bold text-slate-900 text-sm hover:text-blue-600 block"
                          >
                            {p.renterId.fullName}
                          </Link>
                        ) : (
                          <span className="font-bold text-slate-900 text-sm">Tenant</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.renterId?.roomNumber && (
                            <span className="font-semibold text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              Rm #{p.renterId.roomNumber}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-500 font-medium">
                            #{p.receiptNumber}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-700 text-base block">
                          +{formatCurrency(p.amount)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold inline-block mt-0.5">
                          {p.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Payment Date
                        </span>
                        <span className="font-medium text-slate-800">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Bill Month
                        </span>
                        <span className="font-medium text-slate-800">
                          {p.billId?.billingMonth ? formatMonthYear(p.billId.billingMonth) : 'Direct Advance'}
                        </span>
                      </div>
                    </div>

                    {p.transactionReference && (
                      <div className="text-xs text-slate-500 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Ref ID:</span>
                        <span className="font-mono font-medium text-slate-700">{p.transactionReference}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Received by: <strong className="text-slate-600 font-medium">{p.receivedBy || 'Admin'}</strong>
                      </span>
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Renter & Room</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Bill Month</th>
                      <th className="py-3 px-4">Reference ID</th>
                      <th className="py-3 px-4">Received By</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {p.receiptNumber}
                        </td>

                        <td className="py-3 px-4">
                          {p.renterId ? (
                            <div>
                              <Link
                                href={`/renters/${p.renterId._id}`}
                                className="font-bold text-slate-900 hover:text-blue-600 transition"
                              >
                                {p.renterId.fullName}
                              </Link>
                              <span className="text-[11px] text-slate-500 block">
                                Room #{p.renterId.roomNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Renter</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold text-emerald-700 text-sm">
                          +{formatCurrency(p.amount)}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {p.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {p.billId?.billingMonth ? formatMonthYear(p.billId.billingMonth) : 'Direct'}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {p.transactionReference || '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {p.receivedBy || 'Admin'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenReceipt(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="View / Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSuccess={fetchPayments}
      />

      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </AppLayout>
  );
}
