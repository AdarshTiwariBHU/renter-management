'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  UserPlus,
  Zap,
  CreditCard,
  Edit,
  Eye,
  LogOut,
  RefreshCw,
  MoreVertical,
  SlidersHorizontal,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QuickMeterModal } from '@/components/modals/QuickMeterModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { VacateModal } from '@/components/modals/VacateModal';
import { formatCurrency } from '@/lib/calculations';
import { usePropertyContext } from '@/context/PropertyContext';
import { Building2 } from 'lucide-react';

interface RenterItem {
  _id: string;
  fullName: string;
  photoUrl?: string;
  roomNumber: string;
  roomId: string;
  mobile: string;
  monthlyRent: number;
  currentElectricity: number;
  totalDue: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
  daysOverdue: number;
  lastMeterReading: number;
  status: 'ACTIVE' | 'VACATED';
  metersCount: number;
  joiningDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyId?: any;
}

function RentersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { selectedPropertyId, selectedProperty, setSelectedPropertyId } = usePropertyContext();

  const [renters, setRenters] = useState<RenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'VACATED'>('ACTIVE');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Modals state
  const [quickMeterRenterId, setQuickMeterRenterId] = useState<string | null>(null);
  const [recordPaymentRenterId, setRecordPaymentRenterId] = useState<string | null>(null);
  const [vacateRenter, setVacateRenter] = useState<RenterItem | null>(null);

  const fetchRenters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (paymentFilter !== 'ALL') params.set('paymentStatus', paymentFilter);
      if (searchTerm) params.set('search', searchTerm);
      if (selectedPropertyId && selectedPropertyId !== 'ALL') {
        params.set('propertyId', selectedPropertyId);
      }

      const res = await fetch(`/api/renters?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRenters(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenters();
  }, [statusFilter, paymentFilter, selectedPropertyId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRenters();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" /> Renters & Tenants Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage tenant profiles, monthly bills, multi-meter readings, and occupancy.
            </p>
          </div>
          <Link
            href="/renters/new"
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add New Renter
          </Link>
        </div>

        {/* Selected Property Banner */}
        {selectedProperty && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-2.5 text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Filtered by Property: <strong>{selectedProperty.name}</strong> ({selectedProperty.type}, {selectedProperty.city})
              </span>
            </div>
            <button
              onClick={() => setSelectedPropertyId('ALL')}
              className="font-semibold text-indigo-600 hover:text-indigo-800 underline ml-3 shrink-0"
            >
              Show All Properties
            </button>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          {/* Top row: Search input & Status Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, room number, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-20 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                Search
              </button>
            </form>

            {/* Renter Status Toggle: Active vs Vacated vs All */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Renters
              </button>
              <button
                onClick={() => setStatusFilter('VACATED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'VACATED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vacated Renters
              </button>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Bottom row: Payment Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none touch-scroll">
            <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Payment Status:
            </span>
            {[
              { key: 'ALL', label: 'All Statuses' },
              { key: 'PAID', label: 'Paid' },
              { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'OVERDUE', label: 'Overdue' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setPaymentFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg font-medium border transition whitespace-nowrap ${
                  paymentFilter === f.key
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Renters Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              Loading renters...
            </div>
          ) : renters.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-base">No renters found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout (Visible on phones & small tablets) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {renters.map((renter) => (
                  <div key={renter._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
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
                          <Link
                            href={`/renters/${renter._id}`}
                            className="font-bold text-slate-900 text-sm hover:text-blue-600 block"
                          >
                            {renter.fullName}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              Rm #{renter.roomNumber}
                            </span>
                            {renter.propertyId?.name && (
                              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[120px]">
                                {renter.propertyId.name}
                              </span>
                            )}
                            <a
                              href={`tel:${renter.mobile}`}
                              className="text-[11px] text-slate-500 hover:text-blue-600 font-medium"
                            >
                              {renter.mobile}
                            </a>
                          </div>
                        </div>
                      </div>
                      <StatusBadge
                        status={renter.paymentStatus}
                        daysOverdue={renter.daysOverdue}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Rent
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(renter.monthlyRent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Electricity
                        </span>
                        <span className="font-bold text-amber-700">
                          {formatCurrency(renter.currentElectricity)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Total Due
                        </span>
                        <span
                          className={`font-bold ${
                            renter.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatCurrency(renter.totalDue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Last Meter:{' '}
                        <strong className="text-slate-800 font-mono">
                          {renter.lastMeterReading}
                        </strong>{' '}
                        units
                      </span>
                      {renter.daysOverdue > 0 && (
                        <span className="text-rose-600 font-bold">
                          {renter.daysOverdue} Days Overdue
                        </span>
                      )}
                    </div>

                    {/* Mobile Quick Actions */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      {renter.status === 'ACTIVE' ? (
                        <>
                          <button
                            onClick={() => setQuickMeterRenterId(renter._id)}
                            className="py-2 px-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 fill-amber-950" />
                            <span>⚡ Meter</span>
                          </button>
                          <button
                            onClick={() => setRecordPaymentRenterId(renter._id)}
                            className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-white" />
                            <span>Pay</span>
                          </button>
                        </>
                      ) : (
                        <div className="col-span-2 text-xs text-slate-400 italic flex items-center">
                          Vacated Tenant
                        </div>
                      )}
                      <Link
                        href={`/renters/${renter._id}`}
                        className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout (Visible on desktop & laptops) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Renter & Room</th>
                    <th className="py-3.5 px-4">Mobile</th>
                    <th className="py-3.5 px-4">Monthly Rent</th>
                    <th className="py-3.5 px-4">Current Electricity</th>
                    <th className="py-3.5 px-4">Total Due</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Overdue Days</th>
                    <th className="py-3.5 px-4">Last Meter</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {renters.map((renter) => (
                    <tr key={renter._id} className="hover:bg-slate-50/70 transition">
                      {/* Photo, Name & Room */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
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
                            <Link
                              href={`/renters/${renter._id}`}
                              className="font-bold text-slate-900 text-sm hover:text-blue-600 transition block"
                            >
                              {renter.fullName}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                Rm #{renter.roomNumber}
                              </span>
                              {renter.propertyId?.name && (
                                <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[140px]">
                                  {renter.propertyId.name}
                                </span>
                              )}
                              {renter.status === 'VACATED' && (
                                <StatusBadge status="VACATED" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {renter.mobile}
                      </td>

                      {/* Monthly Rent */}
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {formatCurrency(renter.monthlyRent)}
                      </td>

                      {/* Electricity Amount */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-amber-700">
                          {formatCurrency(renter.currentElectricity)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {renter.metersCount} meter{renter.metersCount > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Total Due */}
                      <td className="py-3 px-4 font-bold text-sm">
                        {renter.totalDue > 0 ? (
                          <span className="text-rose-600">{formatCurrency(renter.totalDue)}</span>
                        ) : (
                          <span className="text-emerald-600">₹0</span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={renter.paymentStatus}
                          daysOverdue={renter.daysOverdue}
                        />
                      </td>

                      {/* Days Overdue */}
                      <td className="py-3 px-4">
                        {renter.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {renter.daysOverdue} Days
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Last Meter Reading */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {renter.lastMeterReading.toLocaleString('en-IN')} units
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick ⚡ Update Meter */}
                          {renter.status === 'ACTIVE' && (
                            <button
                              onClick={() => setQuickMeterRenterId(renter._id)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                              title="⚡ Quick Update Meter"
                            >
                              <Zap className="w-3.5 h-3.5 fill-amber-700" />
                            </button>
                          )}

                          {/* 💳 Record Payment */}
                          {renter.status === 'ACTIVE' && (
                            <button
                              onClick={() => setRecordPaymentRenterId(renter._id)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                              title="💳 Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                          )}

                          {/* View Profile */}
                          <Link
                            href={`/renters/${renter._id}`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit Renter */}
                          <Link
                            href={`/renters/${renter._id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                            title="Edit Renter"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* Mark as Vacated */}
                          {renter.status === 'ACTIVE' && (
                            <button
                              onClick={() => setVacateRenter(renter)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                              title="Mark as Vacated"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Global Modals for Quick Action Triggers from table */}
      {quickMeterRenterId && (
        <QuickMeterModal
          isOpen={true}
          onClose={() => setQuickMeterRenterId(null)}
          onSuccess={fetchRenters}
          preselectedRenterId={quickMeterRenterId}
        />
      )}

      {recordPaymentRenterId && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setRecordPaymentRenterId(null)}
          onSuccess={fetchRenters}
          preselectedRenterId={recordPaymentRenterId}
        />
      )}

      {vacateRenter && (
        <VacateModal
          isOpen={true}
          onClose={() => setVacateRenter(null)}
          onSuccess={fetchRenters}
          renter={{
            _id: vacateRenter._id,
            fullName: vacateRenter.fullName,
            roomNumber: vacateRenter.roomNumber,
            monthlyRent: vacateRenter.monthlyRent,
            securityDeposit: 0,
          }}
        />
      )}
    </AppLayout>
  );
}

export default function RentersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400 text-xs">
          Loading renters directory...
        </div>
      }
    >
      <RentersContent />
    </Suspense>
  );
}
