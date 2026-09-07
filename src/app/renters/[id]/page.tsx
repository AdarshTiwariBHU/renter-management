'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  CreditCard,
  Zap,
  Receipt,
  History,
  FileText,
  ShieldCheck,
  Edit,
  LogOut,
  RefreshCw,
  Clock,
  Printer,
  ChevronRight,
  Key,
  Lock,
  Copy,
  Check,
  Shield,
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
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QuickMeterModal } from '@/components/modals/QuickMeterModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { ReceiptModal, ReceiptData } from '@/components/modals/ReceiptModal';
import { VacateModal } from '@/components/modals/VacateModal';
import { formatCurrency, formatMonthYear, maskAadhaar } from '@/lib/calculations';

export default function RenterProfilePage() {
  const params = useParams();
  const router = useRouter();
  const renterId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'bills' | 'transactions' | 'electricity' | 'documents' | 'history'
  >('overview');

  // Modals state
  const [quickMeterOpen, setQuickMeterOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | undefined>(undefined);
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Account Information & Password Management State (Requirements 22, 23, 24, 25, 26)
  const [accountInfo, setAccountInfo] = useState<{
    loginId: string;
    status: string;
    verificationStatus: string;
    loginEnabled: boolean;
    lastLoginAt?: string | null;
  } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [tempPasswordResult, setTempPasswordResult] = useState<string | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [copiedLoginId, setCopiedLoginId] = useState(false);

  // Add meter state
  const [addMeterOpen, setAddMeterOpen] = useState(false);
  const [newMeterName, setNewMeterName] = useState('');
  const [newStartingReading, setNewStartingReading] = useState('0');
  const [newRatePerUnit, setNewRatePerUnit] = useState('10');
  const [addingMeter, setAddingMeter] = useState(false);

  const handleAddMeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeterName.trim()) return;
    setAddingMeter(true);
    try {
      const res = await fetch('/api/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renterId: renter._id,
          meterName: newMeterName.trim(),
          startingReading: Number(newStartingReading) || 0,
          ratePerUnit: Number(newRatePerUnit) || 10,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setAddMeterOpen(false);
        setNewMeterName('');
        setNewStartingReading('0');
        fetchProfile();
      } else {
        alert(resJson.error || 'Failed to add meter');
      }
    } catch {
      alert('Error adding meter');
    } finally {
      setAddingMeter(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [res, accRes] = await Promise.all([
        fetch(`/api/renters/${renterId}`),
        fetch(`/api/admin/renters/${renterId}/account`),
      ]);

      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }

      const accJson = await accRes.json();
      if (accJson.success) {
        setAccountInfo(accJson.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLoginId = () => {
    if (accountInfo?.loginId) {
      navigator.clipboard.writeText(accountInfo.loginId);
      setCopiedLoginId(true);
      setTimeout(() => setCopiedLoginId(false), 2000);
    }
  };

  const handleToggleLogin = async () => {
    if (!accountInfo) return;
    setAccountActionLoading(true);
    try {
      const res = await fetch(`/api/admin/renters/${renterId}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-login' }),
      });
      const json = await res.json();
      if (json.success) {
        setAccountInfo({ ...accountInfo, loginEnabled: json.data.loginEnabled });
        alert(json.message);
      } else {
        alert(json.error || 'Failed to toggle login');
      }
    } catch {
      alert('Error updating login access');
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountActionLoading(true);
    try {
      const res = await fetch(`/api/admin/renters/${renterId}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          newPassword: customPassword.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTempPasswordResult(json.data.temporaryPassword);
        setCustomPassword('');
      } else {
        alert(json.error || 'Failed to reset password');
      }
    } catch {
      alert('Error resetting password');
    } finally {
      setAccountActionLoading(false);
    }
  };

  useEffect(() => {
    if (renterId) fetchProfile();
  }, [renterId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading renter profile...
        </div>
      </AppLayout>
    );
  }

  if (!data || !data.renter) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-3">
          <p className="text-base font-bold text-slate-800">Renter profile not found.</p>
          <Link href="/renters" className="text-xs text-blue-600 font-semibold hover:underline">
            ← Return to Renters Directory
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { renter, meters = [], readings = [], bills = [], payments = [], transactions = [], summary = {}, auditLogs = [] } = data;

  // Chart data for monthly consumption & costs
  const chartData = [...readings]
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
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/renters" className="hover:text-slate-900 transition">
            Renters
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-800">{renter.fullName}</span>
        </div>

        {/* Profile Hero Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
              {renter.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={renter.photoUrl}
                  alt={renter.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                renter.fullName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {renter.fullName}
                </h1>
                <StatusBadge status={renter.status} />
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                <span className="font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  Room #{renter.roomNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {renter.mobile}
                </span>
                {renter.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {renter.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined:{' '}
                  {new Date(renter.joiningDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Profile Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {renter.status === 'ACTIVE' && (
              <>
                <button
                  onClick={() => setQuickMeterOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-amber-950" /> ⚡ Update Meter
                </button>

                <button
                  onClick={() => {
                    setSelectedBillId(undefined);
                    setRecordPaymentOpen(true);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
                >
                  <CreditCard className="w-4 h-4 text-emerald-800" /> Record Payment
                </button>
              </>
            )}

            <Link
              href={`/renters/${renter._id}/edit`}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </Link>

            {renter.status === 'ACTIVE' && (
              <button
                onClick={() => setVacateModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Vacate Renter
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-600">
          {[
            { key: 'overview', label: 'Overview', icon: User },
            { key: 'bills', label: 'Monthly Bills', icon: Receipt },
            { key: 'transactions', label: 'Ledger & Transactions', icon: History },
            { key: 'electricity', label: 'Electricity Usage', icon: Zap },
            { key: 'documents', label: 'Documents', icon: FileText },
            { key: 'history', label: 'Audit Trail', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Monthly Rent Rate
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {formatCurrency(renter.monthlyRent)}
                </span>
                <span className="text-[11px] text-slate-400">Due on {renter.rentDueDay}th of each month</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Security Deposit
                </span>
                <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                  {formatCurrency(renter.securityDeposit)}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Recorded in deposit ledger</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Outstanding Balance
                </span>
                <span className="text-2xl font-bold text-rose-600 mt-1 block">
                  {formatCurrency(summary.totalOutstanding || 0)}
                </span>
                <span className="text-[11px] text-slate-400">Across all unfinalized bills</span>
              </div>
            </div>

            {/* If Vacated: Final Settlement Card */}
            {renter.status === 'VACATED' && renter.vacatedDetails && (
              <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                  <LogOut className="w-5 h-5 text-rose-600" />
                  <span>Final Vacation Settlement Record</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Leaving Date:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(renter.vacatedDetails.leavingDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Final Rent Due:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(renter.vacatedDetails.finalRentDue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Deductions:</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(renter.vacatedDetails.deductions)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Security Refunded:</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(renter.vacatedDetails.refundAmount)}
                    </span>
                  </div>
                </div>
                {renter.vacatedDetails.settlementNotes && (
                  <p className="text-xs text-slate-600 pt-2 border-t border-slate-200 italic">
                    Notes: {renter.vacatedDetails.settlementNotes}
                  </p>
                )}
              </div>
            )}

            {/* Account Information Card (Requirements 22, 23, 24, 25, 26) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Account Information</h2>
                    <p className="text-xs text-slate-500">
                      Renter self-service login and portal security credentials
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempPasswordResult(null);
                      setResetModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-blue-600" /> Reset Password
                  </button>

                  {accountInfo && (
                    <button
                      type="button"
                      disabled={accountActionLoading || renter.status === 'VACATED'}
                      onClick={handleToggleLogin}
                      className={`px-3 py-1.5 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 ${
                        accountInfo.loginEnabled
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {accountInfo.loginEnabled ? 'Disable Login' : 'Enable Login'}
                    </button>
                  )}

                  {renter.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setVacateModalOpen(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Mark Vacated
                    </button>
                  )}
                </div>
              </div>

              {accountInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-medium block uppercase text-[10px]">
                      Login ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {accountInfo.loginId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyLoginId}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-200/60 transition"
                        title="Copy Login ID"
                      >
                        {copiedLoginId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-medium block uppercase text-[10px]">
                      Account Status
                    </span>
                    <span className="font-bold text-slate-800 text-sm block">
                      {accountInfo.status}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-medium block uppercase text-[10px]">
                      Verification Status
                    </span>
                    <span className="font-bold text-blue-700 text-sm block">
                      {accountInfo.verificationStatus}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-medium block uppercase text-[10px]">
                      Login Access
                    </span>
                    <span
                      className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full border ${
                        accountInfo.loginEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {accountInfo.loginEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-2">Loading account info...</div>
              )}
            </div>

            {/* Profile Information Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
                Personal &amp; Rental Particulars
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                    Father&apos;s Name
                  </span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{renter.fatherName}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                    Mother&apos;s Name
                  </span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{renter.motherName || '—'}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                    Aadhaar Number (Masked)
                  </span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 font-mono">
                    {maskAadhaar(renter.aadhaarNumber)}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                    Permanent Address
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5">{renter.permanentAddress}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                    Current Address
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {renter.currentAddress || `Room ${renter.roomNumber}, KirayaPro`}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                    Alternate Contact
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {renter.alternateMobile || 'None specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Electricity Meters Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Assigned Electricity Meters ({meters.length})
                </h2>
                {renter.status === 'ACTIVE' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddMeterOpen(true)}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1"
                    >
                      + Add Meter
                    </button>
                    <button
                      onClick={() => setQuickMeterOpen(true)}
                      className="text-xs font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition flex items-center gap-1"
                    >
                      ⚡ Record Reading
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {meters.map((m: any) => (
                  <div
                    key={m._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                      <span>{m.meterName}</span>
                      <span className="text-blue-600">₹{m.ratePerUnit}/unit</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Starting Units</span>
                        <span className="font-mono font-semibold">{m.startingReading}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Units</span>
                        <span className="font-mono font-bold text-slate-900">
                          {m.currentReading}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Bills */}
        {activeTab === 'bills' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">Monthly Billing Invoices</h2>
              <span className="text-xs text-slate-500">{bills.length} billing records</span>
            </div>

            {bills.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No monthly bills generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Room Rent</th>
                      <th className="py-3 px-4">Electricity</th>
                      <th className="py-3 px-4">Total Payable</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Remaining Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((bill: any) => (
                      <tr key={bill._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatMonthYear(bill.billingMonth)}
                        </td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(bill.rentAmount)}</td>
                        <td className="py-3 px-4 font-semibold text-amber-700">
                          {formatCurrency(bill.electricityAmount)}
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
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {bill.balance > 0 && renter.status === 'ACTIVE' && (
                              <button
                                onClick={() => {
                                  setSelectedBillId(bill._id);
                                  setRecordPaymentOpen(true);
                                }}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenReceipt(bill)}
                              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
            )}
          </div>
        )}

        {/* Tab 3: Transactions Ledger */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Renter Transaction Ledger</h2>
                <p className="text-xs text-slate-500">
                  Double-entry accounting record: Debits, Credits, and Running Balance.
                </p>
              </div>
              <span className="text-xs text-slate-500">{transactions.length} entries</span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No ledger transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Debit (₹)</th>
                      <th className="py-3 px-4 text-right">Credit (₹)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                      <th className="py-3 px-4">Mode / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {transactions.map((tx: any) => (
                      <tr key={tx._id} className="hover:bg-slate-50/70 transition font-sans">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(tx.balanceAfter)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {tx.paymentMethod || '—'}
                          {tx.receiptNumber ? ` (${tx.receiptNumber})` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Electricity Usage & Charts */}
        {activeTab === 'electricity' && (
          <div className="space-y-6">
            {/* Visual Charts: Units Consumed & Electricity Cost */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Units Bar Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4">
                  Monthly Electricity Consumption (Units)
                </h3>
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

              {/* Cost Line Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-4">
                  Monthly Electricity Cost (₹)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Amount (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Electricity Readings Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Month-wise Reading History</h2>
                  <p className="text-xs text-slate-500">
                    Total Units: {summary.totalUnits || 0} Units • Total Cost:{' '}
                    {formatCurrency(summary.totalElectricityCost || 0)}
                  </p>
                </div>
                {renter.status === 'ACTIVE' && (
                  <button
                    onClick={() => setQuickMeterOpen(true)}
                    className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    ⚡ Update Reading
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Meter Name</th>
                      <th className="py-3 px-4">Previous Reading</th>
                      <th className="py-3 px-4">Current Reading</th>
                      <th className="py-3 px-4">Units Used</th>
                      <th className="py-3 px-4">Rate</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readings.map((r: any) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatMonthYear(r.billingMonth)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{r.meterName}</td>
                        <td className="py-3 px-4 font-mono">{r.previousReading}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {r.currentReading}
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-700">{r.unitsConsumed} Units</td>
                        <td className="py-3 px-4 text-slate-600">₹{r.ratePerUnit}/unit</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-700">
                          {formatCurrency(r.electricityAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Documents */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Identity & Document Proofs
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Aadhaar Front */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <span className="font-bold text-xs text-slate-800 block">Aadhaar Front Image</span>
                {renter.aadhaarFrontUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={renter.aadhaarFrontUrl}
                    alt="Aadhaar Front"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="h-48 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No Aadhaar Front Image Uploaded
                  </div>
                )}
              </div>

              {/* Aadhaar Back */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <span className="font-bold text-xs text-slate-800 block">Aadhaar Back Image</span>
                {renter.aadhaarBackUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={renter.aadhaarBackUrl}
                    alt="Aadhaar Back"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="h-48 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No Aadhaar Back Image Uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Audit History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-base">Audit Trail & Activity Log</h2>
              <p className="text-xs text-slate-500">Records of meter adjustments, rent edits, and settlements</p>
            </div>
            {auditLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No audit logs recorded.</div>
            ) : (
              <div className="divide-y divide-slate-100 p-4 space-y-2 text-xs">
                {auditLogs.map((log: any) => (
                  <div key={log._id} className="py-2.5 flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{log.action}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Performed by: {log.performedBy}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Meter Modal */}
      {addMeterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Meter</h3>
                  <p className="text-xs text-slate-500">Assign an electricity meter to {renter.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setAddMeterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMeterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meter Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AC Meter, Personal Meter, Kitchen"
                  value={newMeterName}
                  onChange={(e) => setNewMeterName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Units</label>
                  <input
                    type="number"
                    step="any"
                    value={newStartingReading}
                    onChange={(e) => setNewStartingReading(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={newRatePerUnit}
                    onChange={(e) => setNewRatePerUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddMeterOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMeter || !newMeterName.trim()}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
                >
                  {addingMeter ? 'Adding...' : 'Add Meter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <QuickMeterModal
        isOpen={quickMeterOpen}
        onClose={() => setQuickMeterOpen(false)}
        onSuccess={fetchProfile}
        preselectedRenterId={renter._id}
      />

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSuccess={fetchProfile}
        preselectedRenterId={renter._id}
        preselectedBillId={selectedBillId}
      />

      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />

      <VacateModal
        isOpen={vacateModalOpen}
        onClose={() => setVacateModalOpen(false)}
        onSuccess={fetchProfile}
        renter={{
          _id: renter._id,
          fullName: renter.fullName,
          roomNumber: renter.roomNumber,
          monthlyRent: renter.monthlyRent,
          securityDeposit: renter.securityDeposit || 0,
        }}
      />

      {/* Password Reset Modal (Requirements 23 & 24) */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Renter Password</h3>
                  <p className="text-xs text-slate-500">For {renter.fullName} ({accountInfo?.loginId})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setTempPasswordResult(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {tempPasswordResult ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">New Temporary Password Generated</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Copy and share this password with the renter now. For security, it will not be displayed again.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between font-mono text-sm font-bold text-slate-900">
                  <span>{tempPasswordResult}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPasswordResult);
                      alert('Temporary password copied!');
                    }}
                    className="p-1.5 bg-white text-slate-700 hover:text-blue-600 rounded-xl border border-slate-200 transition"
                    title="Copy Password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResetModalOpen(false);
                    setTempPasswordResult(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Set Specific Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    If left blank, a secure random password will be created automatically.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={accountActionLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    {accountActionLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resetting...
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" /> Generate &amp; Set Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
