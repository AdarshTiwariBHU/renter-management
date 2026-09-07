'use client';

import React, { useState, useEffect } from 'react';
import { Zap, X, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface QuickMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedRenterId?: string;
  preselectedMeterId?: string;
}

interface MeterItem {
  _id: string;
  meterName: string;
  startingReading: number;
  currentReading: number;
  ratePerUnit: number;
}

interface RenterOption {
  _id: string;
  fullName: string;
  roomNumber: string;
  mobile: string;
}

export const QuickMeterModal: React.FC<QuickMeterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedRenterId,
  preselectedMeterId,
}) => {
  const [renters, setRenters] = useState<RenterOption[]>([]);
  const [selectedRenterId, setSelectedRenterId] = useState<string>(preselectedRenterId || '');
  const [meters, setMeters] = useState<MeterItem[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>(preselectedMeterId || '');
  const [billingMonth, setBillingMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // "2026-09"
  );
  const [currentReading, setCurrentReading] = useState<string>('');
  const [isRevision, setIsRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingRenters, setLoadingRenters] = useState(false);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load active renters
  useEffect(() => {
    if (!isOpen) return;
    setLoadingRenters(true);
    fetch('/api/renters?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRenters(data.data);
          if (!selectedRenterId && data.data.length > 0) {
            setSelectedRenterId(preselectedRenterId || data.data[0]._id);
          }
        }
      })
      .finally(() => setLoadingRenters(false));
  }, [isOpen, preselectedRenterId, selectedRenterId]);

  // Load meters when renter changes
  useEffect(() => {
    if (!selectedRenterId) {
      setMeters([]);
      setSelectedMeterId('');
      return;
    }
    setLoadingMeters(true);
    fetch(`/api/meters?renterId=${selectedRenterId}&activeOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMeters(data.data);
          if (preselectedMeterId && data.data.some((m: MeterItem) => m._id === preselectedMeterId)) {
            setSelectedMeterId(preselectedMeterId);
          } else if (data.data.length > 0) {
            setSelectedMeterId(data.data[0]._id);
          } else {
            setSelectedMeterId('');
          }
        }
      })
      .finally(() => setLoadingMeters(false));
  }, [selectedRenterId, preselectedMeterId]);

  const activeMeter = meters.find((m) => m._id === selectedMeterId);
  const selectedRenter = renters.find((r) => r._id === selectedRenterId);

  const previousReading = activeMeter
    ? activeMeter.currentReading ?? activeMeter.startingReading ?? 0
    : 0;
  const ratePerUnit = activeMeter?.ratePerUnit || 10;

  const numCurrent = parseFloat(currentReading);
  const hasEnteredReading = !isNaN(numCurrent);
  const isLowerThanPrevious = hasEnteredReading && numCurrent < previousReading;

  const unitsConsumed = hasEnteredReading && !isLowerThanPrevious
    ? Math.max(0, numCurrent - previousReading)
    : 0;
  const electricityAmount = unitsConsumed * ratePerUnit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedRenterId) {
      setError('Please select a renter.');
      return;
    }
    if (!selectedMeterId) {
      setError('Please select a meter.');
      return;
    }
    if (!hasEnteredReading) {
      setError('Please enter the current meter reading.');
      return;
    }
    if (isLowerThanPrevious) {
      setError('Current meter reading cannot be lower than the previous reading.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/meter-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renterId: selectedRenterId,
          meterId: selectedMeterId,
          billingMonth,
          currentReading: numCurrent,
          isRevision,
          revisionReason,
          notes,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (result.isDuplicate) {
          setIsRevision(true);
        }
        setError(result.error || 'Failed to save meter reading');
        return;
      }

      setSuccessMessage('Meter reading updated successfully and synced with monthly bill!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        setCurrentReading('');
        setError(null);
        setSuccessMessage(null);
        setIsRevision(false);
      }, 1200);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden my-4 sm:my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Quick Meter Reading</h3>
              <p className="text-xs text-blue-100">Update electricity units in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Renter & Month Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Renter
              </label>
              <select
                value={selectedRenterId}
                onChange={(e) => setSelectedRenterId(e.target.value)}
                disabled={loadingRenters}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:border-blue-500 focus:outline-none transition font-medium text-slate-800"
              >
                {renters.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName} (Rm {r.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Billing Month
              </label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:border-blue-500 focus:outline-none transition font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Meter Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Meter
            </label>
            {loadingMeters ? (
              <div className="text-xs text-slate-500 flex items-center gap-2 py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading meters...
              </div>
            ) : meters.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                No active meters found for this renter. Please add a meter in Renter Profile.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {meters.map((m) => {
                  const isSelected = m._id === selectedMeterId;
                  return (
                    <button
                      type="button"
                      key={m._id}
                      onClick={() => setSelectedMeterId(m._id)}
                      className={`px-3 py-2 text-xs rounded-xl border font-medium text-left transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold truncate">{m.meterName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">₹{m.ratePerUnit}/unit</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reading Display & Input Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Previous Reading */}
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Previous Reading
                </span>
                <div className="text-xl font-bold text-slate-700 mt-1">
                  {previousReading.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400">Last recorded meter units</span>
              </div>

              {/* Current Reading Input */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                  Current Reading *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={`Min ${previousReading}`}
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value)}
                  className={`w-full text-lg font-bold px-3 py-1.5 rounded-lg border focus:outline-none transition mt-1 ${
                    isLowerThanPrevious
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-blue-300 bg-white text-blue-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-500'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {isLowerThanPrevious && (
              <p className="text-xs text-rose-600 font-medium">
                ⚠️ Current reading cannot be lower than previous reading ({previousReading}).
              </p>
            )}

            {/* Real-time Calculation Panel */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-xs">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Consumed</span>
                <span className="text-sm font-bold text-slate-800">
                  {unitsConsumed} <span className="text-xs font-normal text-slate-500">Units</span>
                </span>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-xs">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Rate</span>
                <span className="text-sm font-bold text-slate-800">₹{ratePerUnit}/unit</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 shadow-xs">
                <span className="text-[10px] uppercase font-semibold text-blue-600 block">Electricity</span>
                <span className="text-sm font-bold text-blue-700">
                  {formatCurrency(electricityAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Revision Mode Checkbox (if revising existing month) */}
          {isRevision && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <span>Revising Existing Reading</span>
              </div>
              <input
                type="text"
                placeholder="Reason for revision (e.g. meter typo correction)"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                className="w-full text-xs rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 focus:outline-none"
              />
            </div>
          )}

          {/* Optional notes */}
          <div>
            <input
              type="text"
              placeholder="Optional notes (e.g. checked by electrician)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !hasEnteredReading || isLowerThanPrevious || meters.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" /> Save Reading
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
