'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Upload,
  Plus,
  Trash2,
  Zap,
  Building,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Lock,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyContext } from '@/context/PropertyContext';

interface RoomOption {
  _id: string;
  roomNumber: string;
  floor: number;
  building: string;
  roomType: string;
  monthlyRentDefault: number;
  status: string;
}

interface MeterInput {
  meterName: string;
  startingReading: string;
  ratePerUnit: string;
}

export default function AddRenterPage() {
  const router = useRouter();
  const { properties, selectedPropertyId } = usePropertyContext();

  // Property Selection
  const [targetPropertyId, setTargetPropertyId] = useState<string>('');

  // Rooms list
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Form Fields: Personal
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');

  // Upload URLs
  const [photoUrl, setPhotoUrl] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Form Fields: Rental
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthlyRent, setMonthlyRent] = useState('5000');
  const [securityDeposit, setSecurityDeposit] = useState('10000');
  const [rentDueDay, setRentDueDay] = useState('5');

  // Form Fields: Multiple Electricity Meters
  const [meters, setMeters] = useState<MeterInput[]>([
    { meterName: 'Room Meter', startingReading: '0', ratePerUnit: '10' },
  ]);

  // Credentials
  const [loginId, setLoginId] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('Pass@1234');
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginId: string;
    temporaryPassword: string;
    renterId: string;
    renterName: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize targetPropertyId when properties load or property switcher changes
  useEffect(() => {
    if (!targetPropertyId && properties.length > 0) {
      const initial = (selectedPropertyId && selectedPropertyId !== 'ALL')
        ? selectedPropertyId
        : (properties.find((p) => p.status === 'ACTIVE')?._id || properties[0]?._id || '');
      setTargetPropertyId(initial);
    }
  }, [properties, selectedPropertyId, targetPropertyId]);

  // Load Vacant Rooms for the chosen Property
  useEffect(() => {
    if (!targetPropertyId) return;

    setLoadingRooms(true);
    fetch(`/api/rooms?status=VACANT&propertyId=${targetPropertyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRooms(data.data);
          if (data.data.length > 0) {
            const first = data.data[0];
            setSelectedRoomId(first._id);
            setMonthlyRent(first.monthlyRentDefault.toString());
            setSecurityDeposit((first.monthlyRentDefault * 2).toString());
          } else {
            setSelectedRoomId('');
            setMonthlyRent('0');
            setSecurityDeposit('0');
          }
        }
      })
      .finally(() => setLoadingRooms(false));
  }, [targetPropertyId]);

  const currentProperty = properties.find((p) => p._id === targetPropertyId);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    const r = rooms.find((item) => item._id === roomId);
    if (r) {
      setMonthlyRent(r.monthlyRentDefault.toString());
      setSecurityDeposit((r.monthlyRentDefault * 2).toString());
    }
  };

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

  const handleMeterChange = (idx: number, field: keyof MeterInput, value: string) => {
    const updated = [...meters];
    updated[idx][field] = value;
    setMeters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !fatherName || !mobile || !permanentAddress || !aadhaarNumber || !selectedRoomId) {
      setError('Please fill in all mandatory fields (Name, Father Name, Mobile, Address, Aadhaar, Room).');
      return;
    }

    if (aadhaarNumber.length < 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        propertyId: targetPropertyId,
        fullName,
        photoUrl,
        fatherName,
        motherName,
        mobile,
        alternateMobile,
        email,
        permanentAddress,
        currentAddress: currentAddress || permanentAddress,
        aadhaarNumber,
        aadhaarFrontUrl,
        aadhaarBackUrl,
        roomId: selectedRoomId,
        joiningDate,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        rentDueDay: Number(rentDueDay),
        meters: meters.map((m) => ({
          meterName: m.meterName.trim(),
          startingReading: Number(m.startingReading) || 0,
          ratePerUnit: Number(m.ratePerUnit) || 10,
        })),
        loginId: loginId ? loginId.trim().toLowerCase() : undefined,
        temporaryPassword: temporaryPassword ? temporaryPassword.trim() : undefined,
      };

      const res = await fetch('/api/renters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to add renter');
        setSubmitting(false);
        return;
      }

      if (data.credentials) {
        setCreatedCredentials({
          loginId: data.credentials.loginId,
          temporaryPassword: data.credentials.temporaryPassword,
          renterId: data.data._id,
          renterName: fullName,
        });
        setSubmitting(false);
        return;
      }

      router.push('/renters');
    } catch {
      setError('Network error. Failed to save renter.');
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/renters"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Renter</h1>
            <p className="text-xs text-slate-500">
              Register a new tenant, assign a room, upload verification documents, and configure electricity meters.
            </p>
          </div>
        </div>

        {/* Property Context Banner (Section 12.13) */}
        {currentProperty && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 text-xs text-indigo-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-indigo-950">
                  Target Property: {currentProperty.name}
                </p>
                <p className="text-[11px] text-indigo-700">
                  {currentProperty.type} • {currentProperty.address}, {currentProperty.city}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto bg-indigo-100/90 text-indigo-800 font-semibold px-3 py-1 rounded-xl">
              {loadingRooms ? 'Checking vacancy...' : `${rooms.length} vacant rooms available`}
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Submission Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Personal Information */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base">1. Personal Information</h2>
            </div>

            {/* Photo Upload & Name */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
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
                    {uploadingField === 'photo' ? 'Uploading...' : 'Upload Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                  />
                </label>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father&apos;s Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Sharma"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Mother's Name & Mobiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mother&apos;s Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunita Sharma"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Mobile (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. Emergency contact"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Permanent Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permanent Address *
                </label>
                <input
                  type="text"
                  placeholder="Village/City, District, State, PIN"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Aadhaar Details & Image Uploads */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Identity Verification (Aadhaar)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Aadhaar Number * (12 digits)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="XXXX XXXX XXXX"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 font-mono focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Masked in general displays for privacy.</p>
                </div>

                {/* Aadhaar Front */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Aadhaar Front Image
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{aadhaarFrontUrl ? 'Front Uploaded ✓' : 'Upload Front'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'aadhaarFront')}
                      />
                    </label>
                  </div>
                </div>

                {/* Aadhaar Back */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Aadhaar Back Image
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{aadhaarBackUrl ? 'Back Uploaded ✓' : 'Upload Back'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'aadhaarBack')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Rental Information */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">2. Rental Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Property Selection */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Property *
                </label>
                <select
                  value={targetPropertyId}
                  onChange={(e) => setTargetPropertyId(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {properties.map((p) => (
                    <option key={p._id} value={p._id} disabled={p.status === 'INACTIVE'}>
                      {p.name} {p.status === 'INACTIVE' ? '(Inactive - Cannot assign)' : ''} — {p.city || p.type}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rooms below will automatically update to show vacant rooms in this property.
                </p>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Room *
                </label>
                {loadingRooms ? (
                  <div className="text-xs text-slate-400 py-2">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    No vacant rooms available! Please add or free a room first.
                  </p>
                ) : (
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        Room #{r.roomNumber} ({r.roomType} - Floor {r.floor}) — ₹{r.monthlyRentDefault}/mo
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start / Joining Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Joining / Start Date *
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Monthly Rent */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Rent (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Security Deposit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Recorded in double-entry security deposit ledger.</p>
              </div>

              {/* Rent Due Day */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rent Due Day of Month (Default: 5th)
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={rentDueDay}
                  onChange={(e) => setRentDueDay(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Multiple Electricity Meters Configuration */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <h2 className="font-bold text-slate-900 text-base">3. Electricity Meters</h2>
                  <p className="text-xs text-slate-500">
                    A renter may have multiple independent meters (e.g. Room, AC, Kitchen).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMeter}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Meter
              </button>
            </div>

            <div className="space-y-3">
              {meters.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Meter Name
                    </label>
                    <input
                      type="text"
                      value={m.meterName}
                      onChange={(e) => handleMeterChange(idx, 'meterName', e.target.value)}
                      placeholder="e.g. Room Meter"
                      className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Starting Reading
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={m.startingReading}
                      onChange={(e) => handleMeterChange(idx, 'startingReading', e.target.value)}
                      placeholder="0"
                      className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Rate Per Unit (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={m.ratePerUnit}
                      onChange={(e) => handleMeterChange(idx, 'ratePerUnit', e.target.value)}
                      placeholder="10"
                      className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none font-semibold text-blue-700"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    {meters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMeter(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        title="Remove meter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Renter Portal Login Account */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">4. Renter Portal Login Credentials</h2>
                <p className="text-xs text-slate-500">
                  Directly activate this tenant&apos;s self-service login account (Requirement 20 &amp; 21).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Renter Login ID / Username
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder={
                    fullName
                      ? `${fullName.split(' ')[0].toLowerCase()}101`
                      : 'e.g. rahul101'
                  }
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus:bg-white focus:outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank to auto-generate from name &amp; room.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    placeholder="Pass@1234"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTemporaryPassword(`Pass@${Math.floor(1000 + Math.random() * 9000)}`)
                    }
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs whitespace-nowrap transition"
                  >
                    Regenerate
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tenant will be prompted to update this password upon login.
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/renters"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || rooms.length === 0}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Renter...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Complete Enrollment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Created Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Renter Enrolled &amp; Activated!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Account created for <strong>{createdCredentials.renterName}</strong>. Login access is enabled immediately.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Login ID:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {createdCredentials.loginId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Temporary Password:</span>
                <span className="font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-[11px] text-amber-800">
              ⚠️ <strong>Admin Note:</strong> Please securely copy and share these credentials with the tenant. For security, passwords are never stored in plain text.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Renter Portal Login:\nLogin ID: ${createdCredentials.loginId}\nPassword: ${createdCredentials.temporaryPassword}`
                  );
                  alert('Credentials copied to clipboard!');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Details
              </button>
              <button
                type="button"
                onClick={() => router.push(`/renters/${createdCredentials.renterId}`)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
