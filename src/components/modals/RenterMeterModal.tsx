'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Eye,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface MeterData {
  _id: string;
  meterName: string;
  ratePerUnit: number;
  previousReading: number;
  hasPendingSubmission?: boolean;
}

interface RenterMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meters: MeterData[];
  currentMonth: string; // "YYYY-MM"
}

export const RenterMeterModal: React.FC<RenterMeterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  meters,
  currentMonth,
}) => {
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [currentReading, setCurrentReading] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meters.length > 0) {
      // Pick first meter without pending submission if available
      const firstAvailable = meters.find((m) => !m.hasPendingSubmission) || meters[0];
      setSelectedMeterId(firstAvailable._id);
    }
    setCurrentReading('');
    setPhotoUrl('');
    setError(null);
  }, [isOpen, meters]);

  if (!isOpen) return null;

  const activeMeter = meters.find((m) => m._id === selectedMeterId) || meters[0];
  const previousReading = activeMeter ? activeMeter.previousReading : 0;
  const ratePerUnit = activeMeter ? activeMeter.ratePerUnit : 10;
  const numCurrentReading = Number(currentReading);
  const isValidNumber = !isNaN(numCurrentReading) && currentReading.trim() !== '';
  const unitsConsumed = isValidNumber && numCurrentReading >= previousReading ? numCurrentReading - previousReading : 0;
  const estimatedAmount = unitsConsumed * ratePerUnit;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPhotoUrl(data.data.url);
      } else {
        setError(data.error || 'Failed to upload photo');
      }
    } catch {
      setError('Network error during photo upload');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMeterId) {
      setError('Please select an electricity meter.');
      return;
    }

    if (!isValidNumber) {
      setError('Please enter a valid numeric current reading.');
      return;
    }

    if (numCurrentReading < previousReading) {
      setError(`Current reading (${numCurrentReading}) cannot be lower than previous reading (${previousReading}).`);
      return;
    }

    // STRICT REQUIREMENT 10: Mandatory photo proof
    if (!photoUrl || !photoUrl.trim()) {
      setError('Meter photograph is required to submit the reading.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        meterId: selectedMeterId,
        billingMonth: currentMonth,
        currentReading: numCurrentReading,
        photoUrl: photoUrl.trim(),
      };

      const res = await fetch('/api/renter/meter-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to submit meter reading');
        setSubmitting(false);
        return;
      }

      alert('Meter reading submitted successfully! Waiting for admin approval.');
      onSuccess();
      onClose();
    } catch {
      setError('Connection error. Failed to submit reading.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-amber-950 rounded-xl">
              <Zap className="w-5 h-5 fill-amber-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Submit Monthly Meter Reading</h2>
              <p className="text-xs text-slate-500">Billing Period: {currentMonth}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meter Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Meter <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedMeterId}
              onChange={(e) => {
                setSelectedMeterId(e.target.value);
                setCurrentReading('');
                setError(null);
              }}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 font-semibold"
              required
            >
              {meters.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.meterName} (Rate: ₹{m.ratePerUnit}/unit) {m.hasPendingSubmission ? '• [Pending Review]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Previous Reading (Read-Only) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Previous Reading
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl font-mono font-bold text-slate-700 text-sm border border-slate-200">
                {previousReading}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-fetched from ledger</span>
            </div>

            {/* Current Reading Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Reading <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder={`> ${previousReading}`}
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono text-sm font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Mandatory Meter Photo Proof (Requirement 10 & 11) */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-500" />
                Physical Meter Photograph <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-rose-600 font-semibold">Strictly Mandatory</span>
            </div>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-44">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Meter Proof" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/70 p-1 rounded-lg">
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 px-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                  </span>
                  <label className="cursor-pointer text-[10px] bg-white text-slate-800 px-2 py-0.5 rounded font-semibold hover:bg-slate-100">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition text-center group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 block">
                    {uploadingPhoto ? 'Uploading Photo...' : 'Take Camera Photo or Upload Image'}
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Supports JPG, JPEG, PNG, WEBP from mobile camera or gallery
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Real-time Calculation Preview Card (Requirement 12) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Calculation Preview (Server-Validated)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Units Used</span>
                <span className="font-bold text-blue-700 text-sm font-mono">
                  {unitsConsumed} Units
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Rate</span>
                <span className="font-bold text-slate-700 text-sm">₹{ratePerUnit}/u</span>
              </div>
              <div className="col-span-2 bg-amber-100/70 rounded-xl p-1.5 flex flex-col justify-center border border-amber-200">
                <span className="text-[10px] text-amber-800 font-semibold">Estimated Amount</span>
                <span className="font-bold text-amber-950 text-base font-mono">
                  {formatCurrency(estimatedAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Submission notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Submitted readings enter <strong>Pending Review</strong> status. Once Admin approves the meter photo, the units will automatically update in your monthly bill.
            </span>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto || !photoUrl || !isValidNumber}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" /> Submit For Admin Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
