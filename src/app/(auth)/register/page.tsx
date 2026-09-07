'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function RegisterPage() {
  const [properties, setProperties] = useState<{ _id: string; name: string; type: string; city: string }[]>([]);
  const [requestedPropertyId, setRequestedPropertyId] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [requestedRoomNumber, setRequestedRoomNumber] = useState('');

  // Fetch active properties
  React.useEffect(() => {
    fetch('/api/properties?activeOnly=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProperties(data.data);
          if (data.data.length > 0) {
            setRequestedPropertyId(data.data[0]._id);
          }
        }
      })
      .catch((err) => console.error('Failed to load properties', err));
  }, []);

  // Upload URLs
  const [photoUrl, setPhotoUrl] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Credentials
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photo' | 'aadhaarFront' | 'aadhaarBack'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        if (field === 'photo') setPhotoUrl(json.data.url);
        if (field === 'aadhaarFront') setAadhaarFrontUrl(json.data.url);
        if (field === 'aadhaarBack') setAadhaarBackUrl(json.data.url);
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch {
      alert('Network error while uploading');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !fatherName || !mobile || !permanentAddress || !aadhaarNumber) {
      setError('Please fill in all mandatory personal and identity fields.');
      return;
    }

    if (aadhaarNumber.replace(/\s+/g, '').length < 12) {
      setError('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }

    if (!loginId || loginId.trim().length < 3) {
      setError('Login ID must be at least 3 characters.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName,
        fatherName,
        dob: dob || undefined,
        mobile,
        email: email || undefined,
        photoUrl,
        permanentAddress,
        currentAddress: currentAddress || permanentAddress,
        aadhaarNumber: aadhaarNumber.replace(/\s+/g, ''),
        aadhaarFrontUrl,
        aadhaarBackUrl,
        emergencyContactName,
        emergencyContactNumber,
        expectedJoiningDate,
        requestedPropertyId: requestedPropertyId || undefined,
        requestedRoomNumber,
        loginId: loginId.trim().toLowerCase(),
        password,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const selectedProp = properties.find((p) => p._id === requestedPropertyId);

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Your registration has been submitted successfully. Your account is waiting for admin
              verification.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Renter Name:</span>
              <span className="font-semibold text-slate-800">{fullName}</span>
            </div>
            {selectedProp && (
              <div className="flex justify-between">
                <span className="text-slate-400">Preferred Property:</span>
                <span className="font-semibold text-indigo-700">{selectedProp.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Login ID:</span>
              <span className="font-mono font-bold text-blue-600">{loginId.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                PENDING VERIFICATION
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Once property management verifies your details and assigns your room, you will be able to
            sign in to view bills and submit meter readings.
          </p>

          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 flex justify-center items-center relative overflow-hidden">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border border-slate-100 relative z-10 space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left border-b border-slate-100 pb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Renter Registration</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Submit your tenant details for KirayaPro
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Father&apos;s Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Father's Name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition text-slate-700"
                />
              </div>

              {/* Profile Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profile Photograph
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="cursor-pointer text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingField === 'photo' ? 'Uploading...' : 'Choose / Camera'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Complete permanent address"
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Address (if different)
              </label>
              <textarea
                rows={2}
                placeholder="Current local address"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Section 2: Identity Proofs */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 2. Aadhaar Identity Verification
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                12-digit Aadhaar Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={14}
                placeholder="XXXX XXXX XXXX"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aadhaar Front */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Aadhaar Card Front Photo
                </span>
                {aadhaarFrontUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aadhaarFrontUrl}
                    alt="Aadhaar Front"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No Front Photo
                  </div>
                )}
                <label className="cursor-pointer text-xs font-semibold w-full py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  {uploadingField === 'aadhaarFront' ? 'Uploading...' : 'Upload Front Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'aadhaarFront')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Aadhaar Back */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Aadhaar Card Back Photo
                </span>
                {aadhaarBackUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aadhaarBackUrl}
                    alt="Aadhaar Back"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200"
                  />
                ) : (
                  <div className="h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                    No Back Photo
                  </div>
                )}
                <label className="cursor-pointer text-xs font-semibold w-full py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  {uploadingField === 'aadhaarBack' ? 'Uploading...' : 'Upload Back Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'aadhaarBack')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact & Preferences */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Phone className="w-4 h-4" /> 3. Emergency Contact & Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  placeholder="Guardian / Family Name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="Emergency Phone"
                  value={emergencyContactNumber}
                  onChange={(e) => setEmergencyContactNumber(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Property / Building *
                </label>
                <select
                  value={requestedPropertyId}
                  onChange={(e) => setRequestedPropertyId(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:outline-none transition font-medium"
                >
                  <option value="">-- Any Property / Not Sure --</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.type} • {p.city})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Select which property or building you are applying to stay at.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Joining Date
                </label>
                <input
                  type="date"
                  value={expectedJoiningDate}
                  onChange={(e) => setExpectedJoiningDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Room Number (if any)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 102 or 201"
                  value={requestedRoomNumber}
                  onChange={(e) => setRequestedRoomNumber(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              ℹ️ <strong>Note:</strong> Monthly Rent, Electricity Rates, Security Deposit, and final room allocation are decided and configured by Admin upon verification.
            </div>
          </div>

          {/* Section 4: Login Account Setup */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Lock className="w-4 h-4" /> 4. Create Renter Portal Login
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desired Login ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul101"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition font-mono lowercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!uploadingField}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm active:scale-98"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Application...
              </>
            ) : (
              <>
                Submit Registration for Verification <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Already registered or have an account? </span>
            <Link href="/login" className="text-xs text-blue-600 font-bold hover:underline">
              Sign In Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
