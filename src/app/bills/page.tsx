'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Receipt,
  Plus,
  Printer,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { ReceiptModal, ReceiptData } from '@/components/modals/ReceiptModal';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';

interface BillItem {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renterId: any;
  roomNumber: string;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number;
  otherCharges: number;
  previousDue: number;
  totalPayable: number;
  paidAmount: number;
  balance: number;
  status: string;
  daysOverdue?: number;
  dueDate: string;
}

function BillsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [bills, setBills] = useState<BillItem[]>([]);
  const [summary, setSummary] = useState({ totalBilled: 0, totalCollected: 0, totalPending: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [month, setMonth] = useState('2026-09');
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  // Modals
  const [recordPaymentBill, setRecordPaymentBill] = useState<BillItem | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month && month !== 'ALL') params.set('month', month);
      if (status && status !== 'ALL') params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`/api/bills?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBills(json.data);
        setSummary(json.summary || { totalBilled: 0, totalCollected: 0, totalPending: 0, count: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [month, status]);

  const handleGenerateBills = async () => {
    if (!confirm(`Generate monthly bills for all active renters for ${formatMonthYear(month)}?`)) return;
    setGenerating(true);
    setGenMessage(null);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMonth: month }),
      });
      const data = await res.json();
      if (data.success) {
        setGenMessage(data.message);
        fetchBills();
      } else {
        alert(data.error || 'Failed to generate bills');
      }
    } catch {
      alert('Error generating bills');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReceipt = (bill: BillItem) => {
    setReceiptData({
      receiptNumber: `REC-${bill.billingMonth}-${bill.roomNumber}`,
      renterName: bill.renterId?.fullName || 'Tenant',
      roomNumber: bill.roomNumber,
      mobile: bill.renterId?.mobile,
      billingMonth: bill.billingMonth,
      rentAmount: bill.rentAmount,
      electricityAmount: bill.electricityAmount,
      otherCharges: bill.otherCharges,
      previousDue: bill.previousDue,
      totalPayable: bill.totalPayable,
      paidAmount: bill.paidAmount,
      remainingBalance: bill.balance,
      paymentDate: bill.dueDate,
      paymentMethod: 'UPI',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" /> Monthly Rent & Utility Billing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review monthly invoices, auto-generate billing cycles, track dues, and issue receipts.
            </p>
          </div>

          <button
            onClick={handleGenerateBills}
            disabled={generating}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Generate Monthly Bills
              </>
            )}
          </button>
        </div>

        {genMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{genMessage}</span>
          </div>
        )}

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Invoiced
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {formatCurrency(summary.totalBilled)}
            </span>
            <span className="text-[11px] text-slate-400">{summary.count} bills in view</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Collected
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {formatCurrency(summary.totalCollected)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Cleared payments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Outstanding
            </span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {formatCurrency(summary.totalPending)}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">Pending collection</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
              />
              <button
                onClick={() => setMonth('ALL')}
                className={`px-2.5 py-1.5 rounded-lg border font-medium transition ${
                  month === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                All Months
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold overflow-x-auto whitespace-nowrap scrollbar-none touch-scroll max-w-full">
              {['ALL', 'PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    status === s ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> Loading monthly bills...
            </div>
          ) : bills.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No bills found for the selected criteria. Click &quot;Generate Monthly Bills&quot; to create them.
            </div>
          ) : (
            <>
              {/* Mobile Bills Card Layout */}
              <div className="block md:hidden divide-y divide-slate-100">
                {bills.map((bill) => (
                  <div key={bill._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={bill.renterId ? `/renters/${bill.renterId._id}` : '#'}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 block"
                        >
                          {bill.renterId?.fullName || 'Tenant'}
                        </Link>
                        <span className="font-semibold text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 mt-0.5 inline-block">
                          Room #{bill.roomNumber}
                        </span>
                      </div>
                      <StatusBadge status={bill.status} daysOverdue={bill.daysOverdue} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Total Bill
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(bill.totalPayable)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Paid
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(bill.paidAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Balance Due
                        </span>
                        <span
                          className={`font-bold ${
                            bill.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatCurrency(bill.balance)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Rent: {formatCurrency(bill.rentAmount)} • Elec: {formatCurrency(bill.electricityAmount)}</span>
                      <span>{formatMonthYear(bill.billingMonth)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {bill.balance > 0 && (
                        <button
                          onClick={() => setRecordPaymentBill(bill)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-white" />
                          <span>Record Payment</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenReceipt(bill)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
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
                    <th className="py-3 px-4">Renter & Room</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Room Rent</th>
                    <th className="py-3 px-4">Electricity</th>
                    <th className="py-3 px-4">Arrears/Other</th>
                    <th className="py-3 px-4">Total Payable</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        {bill.renterId ? (
                          <div>
                            <Link
                              href={`/renters/${bill.renterId._id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition"
                            >
                              {bill.renterId.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-500 block">
                              Room #{bill.roomNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold">Room #{bill.roomNumber}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {formatMonthYear(bill.billingMonth)}
                      </td>

                      <td className="py-3 px-4 font-medium">{formatCurrency(bill.rentAmount)}</td>

                      <td className="py-3 px-4 font-semibold text-amber-700">
                        {formatCurrency(bill.electricityAmount)}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {formatCurrency(bill.previousDue + bill.otherCharges)}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(bill.totalPayable)}
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {formatCurrency(bill.paidAmount)}
                      </td>

                      <td className="py-3 px-4 font-bold text-rose-600">
                        {formatCurrency(bill.balance)}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={bill.status} daysOverdue={bill.daysOverdue} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {bill.balance > 0 && (
                            <button
                              onClick={() => setRecordPaymentBill(bill)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1 transition"
                            >
                              <CreditCard className="w-3 h-3" /> Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenReceipt(bill)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {recordPaymentBill && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setRecordPaymentBill(null)}
          onSuccess={fetchBills}
          preselectedRenterId={recordPaymentBill.renterId?._id || recordPaymentBill.renterId}
          preselectedBillId={recordPaymentBill._id}
        />
      )}

      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </AppLayout>
  );
}

export default function BillsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400 text-xs">
          Loading monthly bills...
        </div>
      }
    >
      <BillsContent />
    </Suspense>
  );
}
