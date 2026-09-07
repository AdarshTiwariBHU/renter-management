'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Receipt,
  CreditCard,
  History,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  FileText,
  ChevronRight,
  TrendingUp,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { RenterLayout } from '@/components/layout/RenterLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RenterMeterModal } from '@/components/modals/RenterMeterModal';
import { ReceiptModal, ReceiptData } from '@/components/modals/ReceiptModal';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';

export default function RenterDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'bills' | 'electricity' | 'payments' | 'ledger'
  >('overview');

  // Modals
  const [meterModalOpen, setMeterModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedBillDetail, setSelectedBillDetail] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/renter/portal');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load dashboard data');
      }
    } catch {
      setError('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <RenterLayout>
        <div className="py-24 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading your tenant dashboard...
        </div>
      </RenterLayout>
    );
  }

  if (error || !data) {
    return (
      <RenterLayout>
        <div className="p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Unable to load dashboard</h2>
          <p className="text-xs text-slate-500">{error || 'Please try signing in again.'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </RenterLayout>
    );
  }

  const {
    currentMonth,
    renter,
    currentMonthBill,
    meters = [],
    readings = [],
    approvedReadings = [],
    pendingReading,
    latestApprovedReading,
    bills = [],
    payments = [],
    transactions = [],
    summary = {},
  } = data;

  // Chart data for electricity usage
  const chartData = [...approvedReadings]
    .reverse()
    .map((r: any) => ({
      month: r.billingMonth,
      units: r.unitsConsumed,
      amount: r.electricityAmount,
    }));

  const handleOpenReceipt = (bill: any) => {
    const pay = payments.find((p: any) => p.billId === bill._id) || payments[0];
    setReceiptData({
      receiptNumber: pay?.receiptNumber || `REC-${bill.billingMonth}`,
      renterName: renter.fullName,
      roomNumber: renter.roomNumber,
      mobile: renter.mobile,
      billingMonth: bill.billingMonth,
      rentAmount: bill.rentAmount,
      electricityAmount: bill.electricityAmount,
      otherCharges: bill.otherCharges,
      previousDue: bill.previousDue,
      totalPayable: bill.totalPayable,
      paidAmount: bill.paidAmount,
      remainingBalance: bill.balance,
      paymentDate: pay?.paymentDate || bill.dueDate,
      paymentMethod: pay?.paymentMethod || 'UPI',
      transactionReference: pay?.transactionReference,
      notes: pay?.notes,
    });
  };

  return (
    <RenterLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
              {renter.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={renter.photoUrl} alt={renter.fullName} className="w-full h-full object-cover" />
              ) : (
                renter.fullName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome, {renter.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Room #{renter.roomNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Joined: {new Date(renter.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} • Rent Due Date: {renter.rentDueDay}th of month
              </p>
            </div>
          </div>

          {/* Action: ⚡ Submit Meter Reading (Requirement 9) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMeterModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-bold rounded-2xl shadow-xs text-xs sm:text-sm flex items-center gap-2 transition active:scale-95"
            >
              <Zap className="w-4 h-4 fill-amber-950" /> ⚡ Submit Meter Reading
            </button>
          </div>
        </div>

        {/* Pending Reading Notification Banner if any */}
        {pendingReading && (
          <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              <span>
                Your reading of <strong>{pendingReading.currentReading} units</strong> ({pendingReading.meterName}) for{' '}
                <strong>{pendingReading.billingMonth}</strong> has been submitted with photo proof and is waiting for admin verification.
              </span>
            </div>
            <span className="font-bold text-amber-800 bg-amber-200/70 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
              PENDING REVIEW
            </span>
          </div>
        )}

        {/* Section 7: Current Month Bill Overview (Requirement 7) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Current Billing Period
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {formatMonthYear(currentMonthBill?.billingMonth || currentMonth)}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={currentMonthBill?.status || 'PENDING'}
                daysOverdue={currentMonthBill?.overdueDays || 0}
              />
              {currentMonthBill?.overdueDays > 0 && (
                <span className="text-rose-600 font-bold text-xs">
                  {currentMonthBill.overdueDays} Days Overdue
                </span>
              )}
            </div>
          </div>

          {/* Current Month Cards Grid (Requirement 7 Example values) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block truncate">
                Monthly Rent
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-800 mt-1 block font-mono truncate">
                {formatCurrency(currentMonthBill?.rentAmount || renter.monthlyRent)}
              </span>
            </div>

            <div className="p-3 sm:p-4 bg-amber-50/60 rounded-2xl border border-amber-100 text-center">
              <span className="text-[10px] font-semibold text-amber-700 uppercase block truncate">
                Electricity
              </span>
              <span className="text-lg sm:text-xl font-bold text-amber-800 mt-1 block font-mono truncate">
                {formatCurrency(currentMonthBill?.electricityAmount || 0)}
              </span>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block truncate">
                Total Bill
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-900 mt-1 block font-mono truncate">
                {formatCurrency(currentMonthBill?.totalPayable || renter.monthlyRent)}
              </span>
            </div>

            <div className="p-3 sm:p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase block truncate">
                Amount Paid
              </span>
              <span className="text-lg sm:text-xl font-bold text-emerald-700 mt-1 block font-mono truncate">
                {formatCurrency(currentMonthBill?.paidAmount || 0)}
              </span>
            </div>

            <div className="p-3 sm:p-4 bg-rose-50/60 rounded-2xl border border-rose-100 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-rose-700 uppercase block truncate">
                Amount Due
              </span>
              <span className="text-lg sm:text-xl font-bold text-rose-600 mt-1 block font-mono truncate">
                {formatCurrency(currentMonthBill?.balance || 0)}
              </span>
            </div>
          </div>

          {/* Electricity Meter Quick Stats in Current Month (Requirement 7) */}
          <div className="p-3.5 sm:p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              Units Billed: <strong>{currentMonthBill?.unitsConsumed || 0} kWh</strong> (Meter Rate: ₹10/unit)
            </span>
            <span className="text-slate-400 text-[11px]">
              Rent Due Date: {renter.rentDueDay}th of every month
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-600 scrollbar-none touch-scroll -mx-2 px-2 sm:mx-0 sm:px-0">
          {[
            { key: 'overview', label: 'Overview & Meters', icon: Zap },
            { key: 'bills', label: 'Monthly Bills', icon: Receipt },
            { key: 'electricity', label: 'Electricity Usage', icon: TrendingUp },
            { key: 'payments', label: 'Payment History', icon: CreditCard },
            { key: 'ledger', label: 'Transactions Ledger', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 transition whitespace-nowrap shrink-0 text-xs sm:text-sm ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & ACTIVE METERS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Active Electricity Meters List */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Your Active Electricity Meters ({meters.length})
                </h3>
                <button
                  onClick={() => setMeterModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl hover:bg-amber-100 transition"
                >
                  Submit Reading
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {meters.map((m: any) => (
                  <div
                    key={m._id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{m.meterName}</span>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        ₹{m.ratePerUnit}/unit
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Current Reading</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {m.currentReading ?? m.startingReading} Units
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Starting Reading</span>
                        <span className="font-mono text-slate-600 text-xs">
                          {m.startingReading} Units
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Overview Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">
                  Total Electricity Consumed
                </span>
                <span className="text-2xl font-bold text-blue-600 block">
                  {summary.totalUnitsUsed || 0} Units
                </span>
                <p className="text-slate-500">
                  Total energy charges logged across your tenancy: {formatCurrency(summary.totalElectricityCost || 0)}
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">
                  Total Payments Made
                </span>
                <span className="text-2xl font-bold text-emerald-600 block">
                  {formatCurrency(summary.totalPaidAcrossBills || 0)}
                </span>
                <p className="text-slate-500">
                  {payments.length} successful payment receipts generated by property management
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY BILLS (Requirement 8) */}
        {activeTab === 'bills' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Monthly Billing Statements</h3>
                <p className="text-xs text-slate-500">
                  Bills generated by admin appear automatically here.
                </p>
              </div>
            </div>

            {bills.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No bills generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Billing Month</th>
                      <th className="py-3.5 px-4 text-right">Rent (₹)</th>
                      <th className="py-3.5 px-4 text-right">Electricity (₹)</th>
                      <th className="py-3.5 px-4 text-right">Total Payable</th>
                      <th className="py-3.5 px-4 text-right">Paid Amount</th>
                      <th className="py-3.5 px-4 text-right">Remaining Due</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((b: any) => (
                      <tr key={b._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatMonthYear(b.billingMonth)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium">
                          {formatCurrency(b.rentAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-amber-800">
                          {formatCurrency(b.electricityAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(b.totalPayable)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(b.paidAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(b.balance)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {b.paidAmount > 0 ? (
                            <button
                              onClick={() => handleOpenReceipt(b)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition"
                            >
                              Receipt
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ELECTRICITY USAGE HISTORY (Requirement 15) */}
        {activeTab === 'electricity' && (
          <div className="space-y-6">
            {/* Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Month-wise Consumption Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Units" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table (Requirement 15) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">⚡ Electricity Usage History</h3>
                  <p className="text-xs text-slate-500">
                    Total Units Used: {summary.totalUnitsUsed || 0} Units • Total Cost: {formatCurrency(summary.totalElectricityCost || 0)}
                  </p>
                </div>
                <button
                  onClick={() => setMeterModalOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl transition"
                >
                  ⚡ Submit Reading
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Meter Name</th>
                      <th className="py-3 px-4">Previous</th>
                      <th className="py-3 px-4">Current</th>
                      <th className="py-3 px-4">Units Used</th>
                      <th className="py-3 px-4">Rate</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readings.map((r: any) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{formatMonthYear(r.billingMonth)}</td>
                        <td className="py-3 px-4 text-slate-700">{r.meterName}</td>
                        <td className="py-3 px-4 font-mono">{r.previousReading}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.currentReading}</td>
                        <td className="py-3 px-4 font-bold text-blue-700">{r.unitsConsumed} Units</td>
                        <td className="py-3 px-4 text-slate-600">₹{r.ratePerUnit}/unit</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">
                          {formatCurrency(r.electricityAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.status === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT HISTORY (Requirement 16) */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Payment Receipts &amp; History</h3>
              <p className="text-xs text-slate-500">
                Official records of all payments recorded by management. Read-only.
              </p>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No payment records logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4 text-right">View Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {payments.map((p: any) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition font-sans">
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {p.receiptNumber || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{p.paymentMethod || 'UPI'}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {p.transactionReference || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              const bill = bills.find((b: any) => b._id === p.billId) || {
                                billingMonth: currentMonth,
                                rentAmount: renter.monthlyRent,
                                electricityAmount: 0,
                                otherCharges: 0,
                                previousDue: 0,
                                totalPayable: p.amount,
                                balance: 0,
                              };
                              handleOpenReceipt(bill);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TRANSACTION LEDGER (Requirement 17) */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Complete Account Ledger</h3>
              <p className="text-xs text-slate-500">
                Detailed history of all monthly bill debits and payment credits.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {transactions.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition font-sans">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{tx.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Renter Meter Submission Modal with Mandatory Photo */}
      <RenterMeterModal
        isOpen={meterModalOpen}
        onClose={() => setMeterModalOpen(false)}
        onSuccess={fetchDashboardData}
        meters={meters}
        currentMonth={currentMonth}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </RenterLayout>
  );
}
