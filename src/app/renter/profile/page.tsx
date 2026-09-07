'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  CreditCard,
  Zap,
  Lock,
  Edit2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { RenterLayout } from '@/components/layout/RenterLayout';
import { formatCurrency, maskAadhaar } from '@/lib/calculations';

export default function RenterProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/renter/portal');
      const json = await res.json();
      if (json.success && json.data?.renter) {
        const r = json.data.renter;
        setProfile(r);
        setMobile(r.mobile || '');
        setEmail(r.email || '');
        setCurrentAddress(r.currentAddress || '');
        setEmergencyContactName(r.emergencyContactName || '');
        setEmergencyContactNumber(r.emergencyContactNumber || '');
      } else {
        setError(json.error || 'Failed to load profile');
      }
    } catch {
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/renter/portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          email,
          currentAddress,
          emergencyContactName,
          emergencyContactNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Personal contact information updated successfully!');
        setIsEditing(false);
        fetchProfile();
      } else {
        alert(json.error || 'Failed to update details');
      }
    } catch {
      alert('Error updating contact information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RenterLayout>
        <div className="py-24 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading your tenant profile...
        </div>
      </RenterLayout>
    );
  }

  if (error || !profile) {
    return (
      <RenterLayout>
        <div className="p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Profile Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'Please sign in again.'}</p>
        </div>
      </RenterLayout>
    );
  }

  return (
    <RenterLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 shadow-xs">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                profile.fullName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Room #{profile.roomNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Father&apos;s Name: <strong>{profile.fatherName}</strong> • Tenancy Started:{' '}
                {new Date(profile.joiningDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Contact Details
            </button>
          )}
        </div>

        {/* Edit Contact Form */}
        {isEditing && (
          <form
            onSubmit={handleSavePersonal}
            className="bg-blue-50/70 border border-blue-200 rounded-3xl p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-blue-200 pb-3">
              <h3 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Update Allowed Personal Information
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Current Address</label>
                <input
                  type="text"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  value={emergencyContactNumber}
                  onChange={(e) => setEmergencyContactNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Section 19: Admin-Controlled Parameters (Strictly Read-Only) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Lease &amp; Financial Terms</h2>
                <p className="text-xs text-slate-500">
                  Fixed parameters set and managed exclusively by Property Admin (Requirement 19)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-semibold border border-slate-200">
              Admin-Controlled
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Room Allocation
              </span>
              <span className="text-base font-bold text-slate-900 block font-mono">
                Room #{profile.roomNumber}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Monthly Rent
              </span>
              <span className="text-base font-bold text-slate-900 block font-mono">
                {formatCurrency(profile.monthlyRent)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Security Deposit
              </span>
              <span className="text-base font-bold text-emerald-700 block font-mono">
                {formatCurrency(profile.securityDeposit)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Rent Due Day
              </span>
              <span className="text-base font-bold text-blue-700 block font-mono">
                {profile.rentDueDay}th of month
              </span>
            </div>
          </div>
        </div>

        {/* Personal Details View */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Personal &amp; Contact Particulars
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Full Legal Name
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.fullName}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Father&apos;s Name
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{profile.fatherName}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Date of Birth
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Registered Mobile
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{profile.mobile}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Email Address
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{profile.email || '—'}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Emergency Contact
              </span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {profile.emergencyContactName || '—'}{' '}
                {profile.emergencyContactNumber ? `(${profile.emergencyContactNumber})` : ''}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Permanent Home Address
              </span>
              <p className="font-medium text-slate-700 mt-0.5">{profile.permanentAddress}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">
                Current Address
              </span>
              <p className="font-medium text-slate-700 mt-0.5">
                {profile.currentAddress || `Room #${profile.roomNumber}, KirayaPro`}
              </p>
            </div>
          </div>
        </div>

        {/* Section 18: Aadhaar Documents & Masking */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Aadhaar Verification Documents
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Masked Number:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {maskAadhaar(profile.aadhaarNumber)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Front */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
              <span className="font-bold text-xs text-slate-800 block">Aadhaar Card Front</span>
              {profile.aadhaarFrontUrl ? (
                <a href={profile.aadhaarFrontUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.aadhaarFrontUrl}
                    alt="Aadhaar Front"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                  />
                </a>
              ) : (
                <div className="h-44 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  No Aadhaar Front Image Uploaded
                </div>
              )}
            </div>

            {/* Back */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
              <span className="font-bold text-xs text-slate-800 block">Aadhaar Card Back</span>
              {profile.aadhaarBackUrl ? (
                <a href={profile.aadhaarBackUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.aadhaarBackUrl}
                    alt="Aadhaar Back"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                  />
                </a>
              ) : (
                <div className="h-44 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  No Aadhaar Back Image Uploaded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RenterLayout>
  );
}
