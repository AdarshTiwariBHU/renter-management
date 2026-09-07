'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, X, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (receiptData?: any) => void;
  preselectedRenterId?: string;
  preselectedBillId?: string;
}

interface RenterOption {
  _id: string;
  fullName: string;
  roomNumber: string;
  mobile: string;
}

interface BillOption {
  _id: string;
  billingMonth: string;
  totalPayable: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedRenterId,
  preselectedBillId,
}) => {
  const [renters, setRenters] = useState<RenterOption[]>([]);
  const [selectedRenterId, setSelectedRenterId] = useState<string>(preselectedRenterId || '');
  const [bills, setBills] = useState<BillOption[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>(preselectedBillId || '');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loadingRenters, setLoadingRenters] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch Renters
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

  // Fetch Bills for selected renter
  useEffect(() => {
    if (!selectedRenterId) {
      setBills([]);
      setSelectedBillId('');
      return;
    }
    setLoadingBills(true);
    fetch(`/api/bills?renterId=${selectedRenterId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBills(data.data);
          // Auto select bill
          if (preselectedBillId && data.data.some((b: BillOption) => b._id === preselectedBillId)) {
            setSelectedBillId(preselectedBillId);
            const b = data.data.find((item: BillOption) => item._id === preselectedBillId);
            if (b) setAmount(b.balance.toString());
          } else {
            // Pick oldest unpaid bill
            const unpaid = data.data.find((b: BillOption) => b.balance > 0);
            if (unpaid) {
              setSelectedBillId(unpaid._id);
              setAmount(unpaid.balance.toString());
            } else if (data.data.length > 0) {
              setSelectedBillId(data.data[0]._id);
              setAmount(data.data[0].balance.toString());
            }
          }
        }
      })
      .finally(() => setLoadingBills(false));
  }, [selectedRenterId, preselectedBillId]);

  const activeBill = bills.find((b) => b._id === selectedBillId);

  const handleBillSelect = (billId: string) => {
    setSelectedBillId(billId);
    const b = bills.find((item) => item._id === billId);
    if (b) {
      setAmount(b.balance.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const numAmount = parseFloat(amount);
    if (!selectedRenterId) {
      setError('Please select a renter.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renterId: selectedRenterId,
          billId: selectedBillId || undefined,
          amount: numAmount,
          paymentDate,
          paymentMethod,
          transactionReference,
          notes,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || 'Failed to record payment');
        return;
      }

      setSuccessMessage(`Payment of ${formatCurrency(numAmount)} recorded! Receipt: ${result.data.receiptNumber}`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess(result.data);
        setAmount('');
        setTransactionReference('');
        setNotes('');
        setError(null);
        setSuccessMessage(null);
      }, 1300);
    } catch {
      setError('Network error. Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden my-4 sm:my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Record Payment</h3>
              <p className="text-xs text-emerald-100">Supports full and partial collections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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
              <p className="font-medium text-xs sm:text-sm">{successMessage}</p>
            </div>
          )}

          {/* Renter Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Renter *
            </label>
            <select
              value={selectedRenterId}
              onChange={(e) => setSelectedRenterId(e.target.value)}
              disabled={loadingRenters}
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:border-emerald-500 focus:outline-none transition font-medium text-slate-800"
            >
              {renters.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fullName} — Room {r.roomNumber} ({r.mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Bill Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Apply to Bill
            </label>
            {loadingBills ? (
              <div className="text-xs text-slate-500 py-2 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading bills...
              </div>
            ) : bills.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                No unpaid bills found. Payment will be credited to renter&apos;s account.
              </p>
            ) : (
              <select
                value={selectedBillId}
                onChange={(e) => handleBillSelect(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:border-emerald-500 focus:outline-none transition font-medium text-slate-800"
              >
                {bills.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.billingMonth} — Total: ₹{b.totalPayable} (Paid: ₹{b.paidAmount}, Due: ₹{b.balance})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Amount to Record (₹) *
              </label>
              <input
                type="number"
                step="any"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-base font-bold rounded-xl border border-emerald-300 bg-emerald-50/40 text-emerald-900 px-3 py-2 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                required
              />
              {activeBill && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Due: {formatCurrency(activeBill.balance)}</span>
                  <button
                    type="button"
                    onClick={() => setAmount(activeBill.balance.toString())}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    Pay Full
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:bg-white focus:border-emerald-500 focus:outline-none transition font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['UPI', 'CASH', 'BANK_TRANSFER', 'OTHER'] as const).map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {method === 'BANK_TRANSFER' ? 'Bank Transfer' : method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference ID & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transaction / Ref ID
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / Cheque #"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Partial advance, cash received"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
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
              disabled={submitting || !amount}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
