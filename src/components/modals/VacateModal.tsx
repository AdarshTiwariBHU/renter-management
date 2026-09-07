'use client';

import React, { useState } from 'react';
import { LogOut, X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface MeterSummary {
  _id: string;
  meterName: string;
  currentReading: number;
}

interface VacateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  renter: {
    _id: string;
    fullName: string;
    roomNumber: string;
    securityDeposit: number;
    monthlyRent: number;
    meters?: MeterSummary[];
  };
}

export const VacateModal: React.FC<VacateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  renter,
}) => {
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().slice(0, 10));
  const [finalRentDue, setFinalRentDue] = useState('0');
  const [finalElectricityDue, setFinalElectricityDue] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [settlementNotes, setSettlementNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const deposit = renter.securityDeposit || 0;
  const numRentDue = parseFloat(finalRentDue) || 0;
  const numElecDue = parseFloat(finalElectricityDue) || 0;
  const numOther = parseFloat(otherCharges) || 0;
  const numDeductions = parseFloat(deductions) || 0;

  const totalDeductions = numRentDue + numElecDue + numOther + numDeductions;
  const refundAmount = Math.max(0, deposit - totalDeductions);
  const additionalDue = Math.max(0, totalDeductions - deposit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/renters/${renter._id}/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leavingDate,
          finalRentDue: numRentDue,
          finalElectricityDue: numElecDue,
          otherCharges: numOther,
          securityDeposit: deposit,
          deductions: numDeductions,
          refundAmount,
          settlementNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to vacate renter');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Network error. Failed to process vacate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-rose-700 px-4 sm:px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <LogOut className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-white">Vacate Renter Settlement</h3>
              <p className="text-xs text-amber-100">
                {renter.fullName} — Room #{renter.roomNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-slate-800 overflow-y-auto flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              Vacating will free up Room #{renter.roomNumber} and move the renter to the Vacated section.
              All past financial ledgers, bills, and meter readings will remain safely preserved.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Vacating / Leaving Date *
            </label>
            <input
              type="date"
              value={leavingDate}
              onChange={(e) => setLeavingDate(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:outline-none transition font-medium"
              required
            />
          </div>

          {/* Settlement Calculations Grid */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50">
            <div className="flex justify-between items-center text-xs font-semibold pb-2 border-b border-slate-200">
              <span className="text-slate-600">Original Security Deposit</span>
              <span className="text-emerald-700 font-bold text-sm">
                {formatCurrency(deposit)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Final Rent Due (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={finalRentDue}
                  onChange={(e) => setFinalRentDue(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Final Electricity Due (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={finalElectricityDue}
                  onChange={(e) => setFinalElectricityDue(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Deductions (Damages/Cleaning) (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Other Charges (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Refund / Due summary */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Refund to Renter
                </span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(refundAmount)}
                </span>
              </div>
              {additionalDue > 0 && (
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider block">
                    Additional Due from Renter
                  </span>
                  <span className="text-lg font-bold text-rose-700">
                    {formatCurrency(additionalDue)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Final Settlement Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Keys handed over, room inspected, electricity final units cleared"
              value={settlementNotes}
              onChange={(e) => setSettlementNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* Action buttons */}
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
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Vacate & Release Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
