'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Building,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface RoomOption {
  _id: string;
  roomNumber: string;
  floor: number;
  monthlyRentDefault: number;
  status: string;
}

export default function EditRenterPage() {
  const router = useRouter();
  const params = useParams();
  const renterId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rooms, setRooms] = useState<RoomOption[]>([]);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [rentDueDay, setRentDueDay] = useState('5');

  useEffect(() => {
    // Fetch renter and available rooms
    Promise.all([
      fetch(`/api/renters/${renterId}`).then((r) => r.json()),
      fetch('/api/rooms').then((r) => r.json()),
    ])
      .then(([renterRes, roomsRes]) => {
        if (renterRes.success) {
          const r = renterRes.data.renter;
          setFullName(r.fullName || '');
          setPhotoUrl(r.photoUrl || '');
          setFatherName(r.fatherName || '');
          setMotherName(r.motherName || '');
          setMobile(r.mobile || '');
          setAlternateMobile(r.alternateMobile || '');
          setEmail(r.email || '');
          setPermanentAddress(r.permanentAddress || '');
          setCurrentAddress(r.currentAddress || '');
          setAadhaarNumber(r.aadhaarNumber || '');
          setAadhaarFrontUrl(r.aadhaarFrontUrl || '');
          setAadhaarBackUrl(r.aadhaarBackUrl || '');
          setSelectedRoomId(r.roomId?._id || r.roomId || '');
          setMonthlyRent(r.monthlyRent?.toString() || '');
          setSecurityDeposit(r.securityDeposit?.toString() || '');
          setRentDueDay(r.rentDueDay?.toString() || '5');
        }
        if (roomsRes.success) {
          setRooms(roomsRes.data);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load renter details');
      })
      .finally(() => setLoading(false));
  }, [renterId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        if (fieldName === 'photo') setPhotoUrl(data.data.url);
        else if (fieldName === 'aadhaarFront') setAadhaarFrontUrl(data.data.url);
        else if (fieldName === 'aadhaarBack') setAadhaarBackUrl(data.data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('File upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/renters/${renterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          photoUrl,
          fatherName,
          motherName,
          mobile,
          alternateMobile,
          email,
          permanentAddress,
          currentAddress,
          aadhaarNumber,
          aadhaarFrontUrl,
          aadhaarBackUrl,
          roomId: selectedRoomId,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          rentDueDay: Number(rentDueDay),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update renter');
        setSubmitting(false);
        return;
      }

      router.push(`/renters/${renterId}`);
    } catch {
      setError('Network error. Failed to save changes.');
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/renters/${renterId}`}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Renter Profile</h1>
            <p className="text-xs text-slate-500">
              Update personal and rental information. Historical bills remain preserved.
            </p>
          </div>
        </div>

        {/* Historical integrity reminder notice */}
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Data Integrity Guarantee:</span> Changing monthly rent or room
            settings here applies strictly to future bills. Previous bills and past meter readings will not be altered.
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" /> Personal Details
            </h2>

            {/* Photo Upload & Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Renter" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                      <span className="text-[10px] text-slate-400 mt-1 block">Renter Photo</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer block mt-1 text-center">
                  <span className="text-[11px] font-semibold text-blue-600 hover:underline">
                    {uploadingField === 'photo' ? 'Uploading...' : 'Change Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                  />
                </label>
              </div>

              <div className="flex-1 w-full text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Renter Profile Picture</p>
                <p className="text-[11px] mt-0.5">Upload a clear passport-size or selfie photo for identification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Father&apos;s Name</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mother&apos;s Name</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Mobile</label>
                <input
                  type="tel"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Address</label>
                <input
                  type="text"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Address</label>
                <input
                  type="text"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Identity & Aadhaar Proofs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Identity Documents (Aadhaar)
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aadhaar Number (12 digits)
              </label>
              <input
                type="text"
                maxLength={14}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                placeholder="XXXX XXXX XXXX"
                className="w-full text-xs sm:text-sm font-mono rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Aadhaar Front */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Aadhaar Front</span>
                  <label className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline">
                    {uploadingField === 'aadhaarFront' ? 'Uploading...' : 'Upload / Replace'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'aadhaarFront')}
                    />
                  </label>
                </div>
                {aadhaarFrontUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-36 object-cover rounded-lg border border-slate-200" />
                ) : (
                  <div className="h-36 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No Front Image
                  </div>
                )}
              </div>

              {/* Aadhaar Back */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Aadhaar Back</span>
                  <label className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline">
                    {uploadingField === 'aadhaarBack' ? 'Uploading...' : 'Upload / Replace'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'aadhaarBack')}
                    />
                  </label>
                </div>
                {aadhaarBackUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-36 object-cover rounded-lg border border-slate-200" />
                ) : (
                  <div className="h-36 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No Back Image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rental */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-indigo-600" /> Rental Agreement Terms
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Assignment</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold focus:outline-none focus:border-indigo-500"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      Room #{r.roomNumber} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rent Due Day</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/renters/${renterId}`}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-2 active:scale-95"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
