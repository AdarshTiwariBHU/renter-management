'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Building2,
  UserCheck,
  Layers,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickMeterModal } from '@/components/modals/QuickMeterModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';
import { usePropertyContext } from '@/context/PropertyContext';

interface SummaryData {
  totalRenters: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  paidThisMonth: number;
  pendingAmount: number;
  overdueRenters: number;
  electricityCollection: number;
  electricityUnits: number;
  currentMonth: string;
  pendingMeterReadings?: number;
  pendingRenterRegistrations?: number;
  selectedProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentTransactions: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overdueList: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedPropertyId, selectedProperty, setSelectedPropertyId } = usePropertyContext();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState<string>('Administrator');

  const [quickMeterOpen, setQuickMeterOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedRenterForPayment, setSelectedRenterForPayment] = useState<string | undefined>(undefined);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const url =
        selectedPropertyId && selectedPropertyId !== 'ALL'
          ? `/api/dashboard/summary?propertyId=${selectedPropertyId}`
          : '/api/dashboard/summary';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedPropertyId]);

  useEffect(() => {

    // Fetch dynamic admin profile name
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.name) {
          setAdminName(data.data.name);
        }
      })
      .catch(() => {});

    // Listen to real-time profile updates across tabs/components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleProfileUpdate = (e: any) => {
      if (e?.detail?.name) {
        setAdminName(e.detail.name);
      } else {
        fetch('/api/admin/profile')
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data?.name) setAdminName(data.data.name);
          })
          .catch(() => {});
      }
    };

    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
  }, []);

  const openPaymentForRenter = (renterId: string) => {
    setSelectedRenterForPayment(renterId);
    setRecordPaymentOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Welcome & Quick Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                Property Overview
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {summary ? formatMonthYear(summary.currentMonth) : 'Loading...'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Welcome back, {adminName}. Here is your property performance summary.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setQuickMeterOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-xs transition active:scale-95"
            >
              <Zap className="w-4 h-4 fill-amber-950" />
              <span>⚡ Update Meter</span>
            </button>

            <button
              onClick={() => {
                setSelectedRenterForPayment(undefined);
                setRecordPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-emerald-800" />
              <span>Record Payment</span>
            </button>

            <Link
              href="/renters/new"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Renter</span>
            </Link>

            <Link
              href="/rooms"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl shadow-xs transition"
            >
              <DoorOpen className="w-4 h-4 text-slate-600" />
              <span>Add Room</span>
            </Link>

            <Link
              href="/bills?status=PENDING"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition"
            >
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Pending Payments</span>
            </Link>
          </div>
        </div>

        {/* Multi-Property Active Scope Banner (Section 12.3 & 12.13) */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
            selectedProperty
              ? 'bg-blue-50/70 border-blue-200/80 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                selectedProperty ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
              }`}
            >
              {selectedProperty ? <Building2 className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Property Context
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 flex flex-wrap items-center gap-2">
                <span>{selectedProperty ? selectedProperty.name : 'All Properties (Portfolio Combined)'}</span>
                {selectedProperty && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    {selectedProperty.type || 'Building'}
                    {selectedProperty.city ? ` • ${selectedProperty.city}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto justify-end">
            {selectedProperty ? (
              <>
                <Link
                  href={`/admin/properties/${selectedProperty._id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 transition shadow-2xs"
                >
                  View Property Details &rarr;
                </Link>
                <button
                  onClick={() => setSelectedPropertyId('ALL')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
                >
                  Switch to All
                </button>
              </>
            ) : (
              <Link
                href="/admin/properties"
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-2xs"
              >
                Manage Properties &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* 10 Primary KPI Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Active Renters */}
            <Link
              href="/renters"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Total Renters
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 truncate">
                {summary.totalRenters}
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1 truncate">
                Active tenants
              </p>
            </Link>

            {/* 2. Total Rooms & Occupancy */}
            <Link
              href="/rooms"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Rooms Inventory
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <DoorOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 truncate">
                {summary.totalRooms}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1.5 truncate">
                <span className="text-indigo-600 font-semibold">{summary.occupiedRooms} Occ</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{summary.vacantRooms} Vac</span>
              </div>
            </Link>

            {/* 3. Paid This Month */}
            <Link
              href="/payments"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Paid This Month
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-emerald-700 truncate">
                {formatCurrency(summary.paidThisMonth)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 truncate">
                Collections in {formatMonthYear(summary.currentMonth)}
              </p>
            </Link>

            {/* 4. Pending Amount */}
            <Link
              href="/bills?status=PENDING"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Pending Amount
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-amber-700 truncate">
                {formatCurrency(summary.pendingAmount)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-1 truncate">
                Total outstanding
              </p>
            </Link>

            {/* 5. Overdue Renters */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Overdue Renters
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-rose-600 truncate">
                {summary.overdueRenters}
              </div>
              <p className="text-[10px] sm:text-[11px] text-rose-500 font-medium mt-1 truncate">
                Payment past due date
              </p>
            </div>

            {/* 6. Electricity Collection */}
            <Link
              href="/electricity"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Electricity Billed
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 truncate">
                {formatCurrency(summary.electricityCollection)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 truncate">
                {summary.electricityUnits} total units billed
              </p>
            </Link>

            {/* 7. Occupied Rooms Percentage */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Occupancy Rate
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 truncate">
                {summary.totalRooms > 0
                  ? `${Math.round((summary.occupiedRooms / summary.totalRooms) * 100)}%`
                  : '0%'}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 truncate">
                {summary.occupiedRooms} of {summary.totalRooms} rooms leased
              </p>
            </div>

            {/* 8. Vacant Rooms Available */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Vacant Rooms
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <DoorOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-teal-700 truncate">
                {summary.vacantRooms}
              </div>
              <p className="text-[10px] sm:text-[11px] text-teal-600 font-medium mt-1 truncate">
                Ready for move-in
              </p>
            </div>

            {/* 9. Pending Meter Reading Approvals (Section 12.3) */}
            <Link
              href="/electricity"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Pending Meters
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-amber-600 truncate">
                {summary.pendingMeterReadings || 0}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 truncate">
                Awaiting review
              </p>
            </Link>

            {/* 10. Pending Renter Registrations (Section 12.3) */}
            <Link
              href="/admin/renter-requests"
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Pending Requests
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold text-purple-600 truncate">
                {summary.pendingRenterRegistrations || 0}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 truncate">
                Self-registrations
              </p>
            </Link>
          </div>
        ) : null}

        {/* Dashboard Grid: Overdue Attention & Recent Ledger Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Renters List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <h2 className="font-bold text-slate-900 text-base">
                    Overdue Renters Attention
                  </h2>
                </div>
                <Link
                  href="/bills?status=OVERDUE"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!summary || summary.overdueList.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">All dues are up to date!</p>
                  <p className="text-xs text-slate-400">No renters are currently overdue.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.overdueList.map((item) => (
                    <div
                      key={item._id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between sm:block">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.renterName}</p>
                          <p className="text-slate-500 text-[11px]">
                            Room #{item.roomNumber} • Mob: {item.mobile}
                          </p>
                        </div>
                        <div className="text-right sm:hidden">
                          <span className="font-bold text-rose-600 text-sm block">
                            {formatCurrency(item.balance)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t border-slate-50 sm:border-t-0">
                        <div className="hidden sm:block text-right">
                          <span className="font-bold text-rose-600 text-sm block">
                            {formatCurrency(item.balance)}
                          </span>
                          <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold mt-0.5">
                            {item.daysOverdue} Days Overdue
                          </span>
                        </div>
                        <span className="sm:hidden inline-block px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold">
                          {item.daysOverdue} Days Overdue
                        </span>
                        <button
                          onClick={() => openPaymentForRenter(item._id)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-lg text-xs transition active:scale-95 shrink-0"
                        >
                          Record Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
              Overdue days calculate automatically against renter rent due day
            </div>
          </div>

          {/* Recent Financial Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h2 className="font-bold text-slate-900 text-base">
                    Recent Financial Transactions
                  </h2>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!summary || summary.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.recentTransactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-medium text-slate-800 truncate max-w-xs">
                          {tx.description}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                          {tx.paymentMethod ? ` • ${tx.paymentMethod}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        {tx.credit > 0 && (
                          <span className="font-bold text-emerald-600 text-sm">
                            +{formatCurrency(tx.credit)}
                          </span>
                        )}
                        {tx.debit > 0 && (
                          <span className="font-bold text-slate-800 text-sm">
                            {formatCurrency(tx.debit)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
              Double-entry immutable ledger accounting
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals for Fast Dashboard Actions */}
      <QuickMeterModal
        isOpen={quickMeterOpen}
        onClose={() => setQuickMeterOpen(false)}
        onSuccess={fetchSummary}
      />

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSuccess={fetchSummary}
        preselectedRenterId={selectedRenterForPayment}
      />
    </AppLayout>
  );
}
