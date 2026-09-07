'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickMeterModal } from '@/components/modals/QuickMeterModal';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';

interface ReadingItem {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renterId: any;
  meterName: string;
  billingMonth: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  electricityAmount: number;
  readingDate: string;
  isRevised?: boolean;
}

export default function ElectricityPage() {
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [summary, setSummary] = useState({ totalUnits: 0, totalAmount: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [month, setMonth] = useState('2026-09');
  const [sort, setSort] = useState('newest');

  // Quick meter modal
  const [quickMeterOpen, setQuickMeterOpen] = useState(false);
  const [selectedRenterForModal, setSelectedRenterForModal] = useState<string | undefined>(undefined);

  // Pending Renter Submissions (Requirement 13 & 14)
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month && month !== 'ALL') params.set('month', month);
      if (sort) params.set('sort', sort);

      const [res, pendingRes] = await Promise.all([
        fetch(`/api/meter-readings?${params.toString()}`),
        fetch('/api/admin/meter-readings/review'),
      ]);

      const json = await res.json();
      if (json.success) {
        setReadings(json.data);
        setSummary(json.summary || { totalUnits: 0, totalAmount: 0, count: 0 });
      }

      const pendingJson = await pendingRes.json();
      if (pendingJson.success) {
        setPendingSubmissions(pendingJson.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReading = async (readingId: string) => {
    if (!confirm('Approve this meter reading and update the monthly electricity bill?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/meter-readings/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingId, action: 'approve' }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchReadings();
      } else {
        alert(json.error || 'Failed to approve reading');
      }
    } catch {
      alert('Error approving meter reading');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/meter-readings/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId: rejectTarget._id,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setRejectTarget(null);
        setRejectionReason('');
        fetchReadings();
      } else {
        alert(json.error || 'Failed to reject reading');
      }
    } catch {
      alert('Error rejecting meter reading');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [month, sort]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500 fill-amber-500" /> Electricity Consumption & Billing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track monthly meter readings, unit usage, and electricity revenue across all renters.
            </p>
          </div>

          <button
            onClick={() => setQuickMeterOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition active:scale-95"
          >
            <Zap className="w-4 h-4 fill-amber-950" /> ⚡ Update Meter Reading
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Units Consumed ({month === 'ALL' ? 'All Time' : formatMonthYear(month)})
            </span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {summary.totalUnits.toLocaleString('en-IN')}{' '}
              <span className="text-sm font-medium text-slate-500">Units</span>
            </span>
            <span className="text-[11px] text-slate-400">{summary.count} meter records logged</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Electricity Amount
            </span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {formatCurrency(summary.totalAmount)}
            </span>
            <span className="text-[11px] text-slate-400">Calculated with assigned meter rates</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Average Rate
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              ₹10.5 <span className="text-sm font-medium text-slate-500">/ Unit</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Standard ₹10 / AC ₹12</span>
          </div>
        </div>

        {/* Pending Renter Submissions Section (Requirement 13 & 14) */}
        {pendingSubmissions.length > 0 && (
          <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-amber-950 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-950" />
                </div>
                <div>
                  <h2 className="font-bold text-amber-950 text-base flex items-center gap-2">
                    Pending Renter Meter Submissions
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      {pendingSubmissions.length} To Review
                    </span>
                  </h2>
                  <p className="text-xs text-amber-800">
                    Tenant-submitted readings requiring physical meter photo verification
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {sub.renterId?.fullName || 'Tenant'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Room #{sub.renterId?.roomNumber || '—'} • {sub.meterName}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                        {sub.billingMonth}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 bg-slate-50 rounded-xl p-2.5 text-center text-xs border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Previous</span>
                        <span className="font-mono font-bold text-slate-700">{sub.previousReading}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Current</span>
                        <span className="font-mono font-bold text-blue-700">{sub.currentReading}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Units</span>
                        <span className="font-bold text-amber-700">{sub.unitsConsumed}</span>
                      </div>
                    </div>

                    {/* Meter Photo Preview */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 block">
                        Mandatory Meter Photo Proof:
                      </span>
                      {sub.photoUrl ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sub.photoUrl}
                            alt="Meter"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setViewPhotoUrl(sub.photoUrl)}
                            className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition text-xs font-semibold"
                          >
                            <Eye className="w-4 h-4" /> View Full Photo
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs flex items-center gap-1.5 border border-rose-200">
                          <AlertCircle className="w-4 h-4" /> No Photo Attached
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setRejectTarget(sub)}
                      className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition border border-rose-200 flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApproveReading(sub._id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Sort Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Select Month:</span>
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
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
            >
              <option value="newest">Latest Reading</option>
              <option value="consumption_desc">Highest Units Consumed</option>
              <option value="consumption_asc">Lowest Units Consumed</option>
              <option value="amount_desc">Highest Electricity Bill</option>
              <option value="amount_asc">Lowest Electricity Bill</option>
            </select>
          </div>
        </div>

        {/* Meter Readings Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-500" /> Loading meter records...
            </div>
          ) : readings.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No readings recorded for the selected period. Click &quot;Update Meter Reading&quot; to add one.
            </div>
          ) : (
            <>
              {/* Mobile Card Layout (Visible on small screens) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {readings.map((r) => (
                  <div key={r._id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        {r.renterId ? (
                          <Link
                            href={`/renters/${r.renterId._id}`}
                            className="font-bold text-slate-900 text-sm hover:text-blue-600 block"
                          >
                            {r.renterId.fullName}
                          </Link>
                        ) : (
                          <span className="font-bold text-slate-900 text-sm">Tenant</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {r.renterId?.roomNumber && (
                            <span className="font-semibold text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              Rm #{r.renterId.roomNumber}
                            </span>
                          )}
                          <span className="font-semibold text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {r.meterName}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-700 text-base block">
                          {formatCurrency(r.electricityAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatMonthYear(r.billingMonth)}
                        </span>
                      </div>
                    </div>

                    {/* Reading Comparison Box */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Previous
                        </span>
                        <span className="font-mono font-medium text-slate-600">
                          {r.previousReading.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Current
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {r.currentReading.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Consumed
                        </span>
                        <span className="font-bold text-blue-700">
                          {r.unitsConsumed} Units
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Rate: ₹{r.ratePerUnit}/unit</span>
                      <span className="text-[11px] text-slate-400">
                        Date:{' '}
                        {new Date(r.readingDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (r.renterId?._id) {
                            setSelectedRenterForModal(r.renterId._id);
                          }
                          setQuickMeterOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-amber-950" />
                        <span>⚡ Update Reading</span>
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
                      <th className="py-3 px-4">Meter Name</th>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4 font-mono">Previous Reading</th>
                      <th className="py-3 px-4 font-mono">Current Reading</th>
                      <th className="py-3 px-4">Units Consumed</th>
                      <th className="py-3 px-4">Rate</th>
                      <th className="py-3 px-4">Electricity Amount</th>
                      <th className="py-3 px-4 text-right">Reading Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {readings.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          {r.renterId ? (
                            <div>
                              <Link
                                href={`/renters/${r.renterId._id}`}
                                className="font-bold text-slate-900 hover:text-blue-600 transition"
                              >
                                {r.renterId.fullName}
                              </Link>
                              <span className="text-[11px] text-slate-500 block">
                                Room #{r.renterId.roomNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Renter</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">
                            {r.meterName}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {formatMonthYear(r.billingMonth)}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          {r.previousReading.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {r.currentReading.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            {r.unitsConsumed} Units
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          ₹{r.ratePerUnit}/unit
                        </td>

                        <td className="py-3 px-4 font-bold text-amber-700 text-sm">
                          {formatCurrency(r.electricityAmount)}
                        </td>

                        <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                          {new Date(r.readingDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
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

      <QuickMeterModal
        isOpen={quickMeterOpen}
        onClose={() => {
          setQuickMeterOpen(false);
          setSelectedRenterForModal(undefined);
        }}
        preselectedRenterId={selectedRenterForModal}
        onSuccess={fetchReadings}
      />

      {/* Full Photo Modal */}
      {viewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-4 max-w-xl w-full space-y-3 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-500" /> Physical Meter Photograph Proof
              </span>
              <button
                type="button"
                onClick={() => setViewPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-100 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewPhotoUrl} alt="Meter Proof" className="w-full h-auto object-contain" />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setViewPhotoUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Meter Reading Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Reject Meter Submission
            </h3>
            <p className="text-xs text-slate-500">
              Rejecting reading for <strong>{rejectTarget.renterId?.fullName}</strong> ({rejectTarget.meterName}).
              Please enter the reason (e.g. &quot;Meter photo is unclear / Reading digits do not match photo&quot;).
            </p>

            <form onSubmit={handleRejectReadingSubmit} className="space-y-4">
              <textarea
                rows={3}
                placeholder="e.g. Meter photo is unclear. Please take a clear photo showing the complete counter numbers."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
