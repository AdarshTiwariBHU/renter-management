'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Building,
  Phone,
  Calendar,
  FileText,
  ShieldCheck,
  ArrowRight,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatCurrency, maskAadhaar } from '@/lib/calculations';
import { usePropertyContext } from '@/context/PropertyContext';

interface PendingRenter {
  _id: string;
  fullName: string;
  photoUrl?: string;
  fatherName: string;
  dob?: string;
  mobile: string;
  email?: string;
  permanentAddress: string;
  currentAddress?: string;
  aadhaarNumber: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  expectedJoiningDate?: string;
  requestedRoomNumber?: string;
  requestedPropertyId?: {
    _id: string;
    name: string;
    type: string;
    city: string;
  };
  propertyId?: {
    _id: string;
    name: string;
    type: string;
    city: string;
  };
  createdAt: string;
  userId?: {
    _id: string;
    loginId?: string;
    username: string;
  };
}

interface RoomOption {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyRentDefault: number;
  status: string;
}

interface MeterConfig {
  meterName: string;
  startingReading: string;
  ratePerUnit: string;
}

export default function RenterRequestsPage() {
  const { properties, selectedPropertyId } = usePropertyContext();
  const [requests, setRequests] = useState<PendingRenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modal
  const [selectedRenter, setSelectedRenter] = useState<PendingRenter | null>(null);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Approve Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvePropertyId, setApprovePropertyId] = useState('');
  const [vacantRooms, setVacantRooms] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [rentDueDay, setRentDueDay] = useState('5');
  const [meters, setMeters] = useState<MeterConfig[]>([
    { meterName: 'Room Meter', startingReading: '0', ratePerUnit: '10' },
  ]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = selectedPropertyId && selectedPropertyId !== 'ALL'
        ? `/api/admin/renter-requests?propertyId=${selectedPropertyId}`
        : '/api/admin/renter-requests';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setRequests(json.data);
      } else {
        setError(json.error || 'Failed to load requests');
      }
    } catch {
      setError('Network error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsForProperty = async (propId: string, preferredRoomNumber?: string) => {
    if (!propId) {
      setVacantRooms([]);
      setSelectedRoomId('');
      return;
    }
    try {
      const res = await fetch(`/api/rooms?status=VACANT&propertyId=${propId}`);
      const json = await res.json();
      if (json.success) {
        setVacantRooms(json.data);
        if (json.data.length > 0) {
          let matched = json.data[0];
          if (preferredRoomNumber) {
            const m = json.data.find(
              (r: RoomOption) => r.roomNumber.toLowerCase() === preferredRoomNumber.toLowerCase()
            );
            if (m) matched = m;
          }
          setSelectedRoomId(matched._id);
          setMonthlyRent(matched.monthlyRentDefault.toString());
          setSecurityDeposit((matched.monthlyRentDefault * 2).toString());
        } else {
          setSelectedRoomId('');
          setMonthlyRent('0');
          setSecurityDeposit('0');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedPropertyId]);

  const handleOpenReview = (renter: PendingRenter) => {
    setSelectedRenter(renter);
  };

  const handleStartApprove = (renter: PendingRenter) => {
    setSelectedRenter(renter);
    const targetPropId =
      renter.requestedPropertyId?._id ||
      renter.propertyId?._id ||
      (selectedPropertyId && selectedPropertyId !== 'ALL' ? selectedPropertyId : '') ||
      (properties.find((p) => p.status === 'ACTIVE')?._id || properties[0]?._id || '');

    setApprovePropertyId(targetPropId);
    fetchRoomsForProperty(targetPropId, renter.requestedRoomNumber);
    setApproveModalOpen(true);
  };

  const handlePropertyChangeInModal = (newPropId: string) => {
    setApprovePropertyId(newPropId);
    fetchRoomsForProperty(newPropId);
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const r = vacantRooms.find((item) => item._id === roomId);
    if (r) {
      setMonthlyRent(r.monthlyRentDefault.toString());
      setSecurityDeposit((r.monthlyRentDefault * 2).toString());
    }
  };

  const handleAddMeter = () => {
    setMeters([
      ...meters,
      {
        meterName: meters.length === 1 ? 'AC Meter' : `Meter ${meters.length + 1}`,
        startingReading: '0',
        ratePerUnit: '10',
      },
    ]);
  };

  const handleRemoveMeter = (idx: number) => {
    if (meters.length === 1) return;
    setMeters(meters.filter((_, i) => i !== idx));
  };

  const handleMeterFieldChange = (idx: number, field: keyof MeterConfig, val: string) => {
    const updated = [...meters];
    updated[idx][field] = val;
    setMeters(updated);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenter || !selectedRoomId) {
      alert('Please select a room to approve.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        roomId: selectedRoomId,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        rentDueDay: Number(rentDueDay),
        meters: meters.map((m) => ({
          meterName: m.meterName.trim(),
          startingReading: Number(m.startingReading) || 0,
          ratePerUnit: Number(m.ratePerUnit) || 10,
        })),
      };

      const res = await fetch(`/api/admin/renter-requests/${selectedRenter._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(`Success: ${json.message}`);
        setApproveModalOpen(false);
        setSelectedRenter(null);
        fetchRequests();
        if (approvePropertyId) fetchRoomsForProperty(approvePropertyId);
      } else {
        alert(json.error || 'Approval failed');
      }
    } catch {
      alert('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRenter) return;
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/renter-requests/${selectedRenter._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setRejectModalOpen(false);
        setRejectionReason('');
        setSelectedRenter(null);
        fetchRequests();
      } else {
        alert(json.error || 'Rejection failed');
      }
    } catch {
      alert('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Renter Registration Requests
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {requests.length} Pending
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review and approve prospective tenants who registered online
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-2xs"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <Link
              href="/renters/new"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Renter Directly
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Requests List */}
        {loading && requests.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            Loading pending verification requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">All Caught Up!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no pending tenant registration requests waiting for verification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                      {r.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoUrl} alt={r.fullName} className="w-full h-full object-cover" />
                      ) : (
                        r.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{r.fullName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {r.mobile}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Father:</span>
                      <span className="font-medium text-slate-800">{r.fatherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aadhaar:</span>
                      <span className="font-mono text-slate-800">{maskAadhaar(r.aadhaarNumber)}</span>
                    </div>
                    {r.requestedPropertyId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Preferred Property:</span>
                        <span className="font-semibold text-indigo-700">{r.requestedPropertyId.name}</span>
                      </div>
                    )}
                    {r.requestedRoomNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Requested Room:</span>
                        <span className="font-semibold text-blue-700">Room #{r.requestedRoomNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Login ID:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {r.userId?.loginId || r.userId?.username || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Applied On:</span>
                      <span>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenReview(r)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  <button
                    onClick={() => handleStartApprove(r)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRenter && !approveModalOpen && !rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 sm:space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden border border-slate-200">
                  {selectedRenter.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedRenter.photoUrl}
                      alt={selectedRenter.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedRenter.fullName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedRenter.fullName}</h2>
                  <p className="text-xs text-slate-500">
                    Online Registration • Login ID:{' '}
                    <strong className="text-blue-600 font-mono">
                      {selectedRenter.userId?.loginId || selectedRenter.userId?.username}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRenter(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Father&apos;s Name</span>
                <span className="font-semibold text-slate-800">{selectedRenter.fatherName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Mobile Number</span>
                <span className="font-semibold text-slate-800">{selectedRenter.mobile}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Email</span>
                <span className="font-semibold text-slate-800">{selectedRenter.email || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800">
                  {selectedRenter.dob ? new Date(selectedRenter.dob).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
                <span className="text-slate-400 block font-medium">Permanent Address</span>
                <span className="font-medium text-slate-800">{selectedRenter.permanentAddress}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
                <span className="text-slate-400 block font-medium">Current Address</span>
                <span className="font-medium text-slate-800">{selectedRenter.currentAddress || 'Same as permanent'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Emergency Contact</span>
                <span className="font-semibold text-slate-800">
                  {selectedRenter.emergencyContactName || '—'}{' '}
                  {selectedRenter.emergencyContactNumber ? `(${selectedRenter.emergencyContactNumber})` : ''}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Requested Room</span>
                <span className="font-semibold text-blue-700">
                  {selectedRenter.requestedRoomNumber ? `Room #${selectedRenter.requestedRoomNumber}` : 'No preference'}
                </span>
              </div>
              {selectedRenter.requestedPropertyId && (
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-1 sm:col-span-2">
                  <span className="text-indigo-500 block font-medium text-[11px]">Preferred Property</span>
                  <span className="font-bold text-indigo-950 text-sm">
                    {selectedRenter.requestedPropertyId.name} ({selectedRenter.requestedPropertyId.type} • {selectedRenter.requestedPropertyId.city})
                  </span>
                </div>
              )}
            </div>

            {/* Document Proofs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Aadhaar Verification ({selectedRenter.aadhaarNumber})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Aadhaar Front</span>
                  {selectedRenter.aadhaarFrontUrl ? (
                    <a href={selectedRenter.aadhaarFrontUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedRenter.aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                      />
                    </a>
                  ) : (
                    <div className="h-40 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                      Not uploaded
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Aadhaar Back</span>
                  {selectedRenter.aadhaarBackUrl ? (
                    <a href={selectedRenter.aadhaarBackUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedRenter.aadhaarBackUrl}
                        alt="Aadhaar Back"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                      />
                    </a>
                  ) : (
                    <div className="h-40 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                      Not uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(true)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition border border-rose-200 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Request
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRenter(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStartApprove(selectedRenter);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Approve &amp; Allocate Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" /> Reject Application: {selectedRenter.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              Please provide the reason for rejection. The applicant will see this reason when attempting to log in.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Incomplete address proof / Aadhaar photo unclear / No vacant rooms of requested type"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:outline-none transition"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve & Configure Room Modal */}
      {approveModalOpen && selectedRenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-5 sm:space-y-6 shadow-2xl border border-slate-100">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Approve &amp; Activate Renter: {selectedRenter.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign room, rental terms, and electricity meters to activate tenant portal access
                </p>
              </div>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-5">
              {/* Property Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assign Property <span className="text-rose-500">*</span>
                </label>
                <select
                  value={approvePropertyId}
                  onChange={(e) => handlePropertyChangeInModal(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition bg-white font-medium"
                  required
                >
                  {properties.map((p) => (
                    <option key={p._id} value={p._id} disabled={p.status === 'INACTIVE'}>
                      {p.name} {p.status === 'INACTIVE' ? '(Inactive)' : ''} — {p.city || p.type}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Change property to reassign the applicant to a different building.
                </p>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Allocate Vacant Room <span className="text-rose-500">*</span>
                </label>
                {vacantRooms.length === 0 ? (
                  <p className="text-xs text-rose-600 font-semibold p-3 bg-rose-50 rounded-xl border border-rose-200">
                    ⚠️ No vacant rooms available! Please add or vacate a room first.
                  </p>
                ) : (
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition bg-white"
                    required
                  >
                    {vacantRooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        Room #{room.roomNumber} ({room.roomType}, Floor {room.floor}) — ₹
                        {room.monthlyRentDefault}/mo
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Financial Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Rent (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rent Due Day (of month)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={rentDueDay}
                    onChange={(e) => setRentDueDay(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Electricity Meters Configuration */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Electricity Meters
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMeter}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Meter
                  </button>
                </div>

                {meters.map((meter, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Meter Name
                      </label>
                      <input
                        type="text"
                        value={meter.meterName}
                        onChange={(e) => handleMeterFieldChange(idx, 'meterName', e.target.value)}
                        className="w-full text-xs px-2.5 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Starting Reading
                      </label>
                      <input
                        type="number"
                        value={meter.startingReading}
                        onChange={(e) =>
                          handleMeterFieldChange(idx, 'startingReading', e.target.value)
                        }
                        className="w-full text-xs px-2.5 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Rate (₹/Unit)
                        </label>
                        <input
                          type="number"
                          value={meter.ratePerUnit}
                          onChange={(e) =>
                            handleMeterFieldChange(idx, 'ratePerUnit', e.target.value)
                          }
                          className="w-full text-xs px-2.5 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none font-mono"
                        />
                      </div>
                      {meters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMeter(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || vacantRooms.length === 0}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm Approval &amp; Activate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
