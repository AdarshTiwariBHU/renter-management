'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Settings,
  Building,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Shield,
  User,
  Camera,
  Upload,
  Mail,
  Phone,
  UserCheck,
  Send,
  Key,
  ExternalLink,
  HelpCircle,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function SettingsPage() {
  // Admin Profile Settings
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('adarshcsbhu@gmail.com');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState('');

  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Property settings
  const [propertyName, setPropertyName] = useState('KirayaPro');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [defaultRentDueDay, setDefaultRentDueDay] = useState('5');
  const [defaultElectricityRate, setDefaultElectricityRate] = useState('10');

  const [savingProperty, setSavingProperty] = useState(false);
  const [propSuccess, setPropSuccess] = useState<string | null>(null);

  // Email & SMTP Settings
  const [smtpUser, setSmtpUser] = useState('adarshcsbhu@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpSuccess, setSmtpSuccess] = useState<string | null>(null);
  const [smtpError, setSmtpError] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch Property Details
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          setPropertyName(p.name && p.name !== 'Greenwood Residency' ? p.name : 'KirayaPro');
          setAddress(p.address || '');
          setPhone(p.phone || '');
          setEmail(p.email || '');
          setDefaultRentDueDay(p.defaultRentDueDay?.toString() || '5');
          setDefaultElectricityRate(p.defaultElectricityRate?.toString() || '10');
          if (p.smtpUser) setSmtpUser(p.smtpUser);
          if (p.smtpHost) setSmtpHost(p.smtpHost);
          if (p.smtpPort) setSmtpPort(p.smtpPort.toString());
        }
      })
      .catch(() => {});

    // 2. Fetch Admin Profile
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const u = data.data;
          setAdminName(u.name || '');
          setAdminEmail(u.email || 'adarshcsbhu@gmail.com');
          setAdminUsername(u.username || '');
          setAdminMobile(u.mobile || '');
          setAdminAvatarUrl(u.avatarUrl || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAdminError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'photo');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminError(data.error || 'Failed to upload photo');
        return;
      }
      const uploadedUrl = data.url || data.data?.url;
      if (!uploadedUrl) {
        setAdminError('Did not receive file URL from server');
        return;
      }
      setAdminAvatarUrl(uploadedUrl);

      // Instantly persist new avatar to the database
      const saveRes = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          username: adminUsername,
          mobile: adminMobile,
          avatarUrl: uploadedUrl,
        }),
      });

      if (saveRes.ok) {
        setAdminSuccess('Profile photo uploaded and saved successfully!');
        window.dispatchEvent(
          new CustomEvent('admin-profile-updated', {
            detail: { avatarUrl: uploadedUrl, name: adminName, email: adminEmail },
          })
        );
        setTimeout(() => setAdminSuccess(null), 3500);
      }
    } catch {
      setAdminError('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAdminAvatarUrl('');
    try {
      await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          username: adminUsername,
          mobile: adminMobile,
          avatarUrl: '',
        }),
      });
      window.dispatchEvent(
        new CustomEvent('admin-profile-updated', {
          detail: { avatarUrl: '', name: adminName, email: adminEmail },
        })
      );
      setAdminSuccess('Profile photo removed.');
      setTimeout(() => setAdminSuccess(null), 3000);
    } catch {
      // Ignore
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdmin(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          username: adminUsername,
          mobile: adminMobile,
          avatarUrl: adminAvatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminError(data.error || 'Failed to update admin profile');
        return;
      }

      setAdminSuccess('Admin profile updated successfully!');
      window.dispatchEvent(
        new CustomEvent('admin-profile-updated', {
          detail: { avatarUrl: adminAvatarUrl, name: adminName, email: adminEmail },
        })
      );
      setTimeout(() => setAdminSuccess(null), 3500);
    } catch {
      setAdminError('Network error. Failed to save profile.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProperty(true);
    setPropSuccess(null);
    try {
      const res = await fetch('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: propertyName,
          address,
          phone,
          email,
          defaultRentDueDay: Number(defaultRentDueDay),
          defaultElectricityRate: Number(defaultElectricityRate),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPropSuccess('Property settings updated successfully');
        setTimeout(() => setPropSuccess(null), 3000);
      }
    } catch {
      alert('Failed to save settings');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpError(null);
    setSmtpSuccess(null);

    try {
      const res = await fetch('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser,
          smtpPass,
          smtpHost,
          smtpPort: Number(smtpPort) || 465,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSmtpError(data.error || 'Failed to save email settings');
        return;
      }

      setSmtpSuccess('Email & SMTP settings saved successfully!');
      setSmtpPass(''); // clear field for security
      setTimeout(() => setSmtpSuccess(null), 3500);
    } catch {
      setSmtpError('Failed to save email settings');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpError(null);
    setSmtpSuccess(null);

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: smtpUser || 'adarshcsbhu@gmail.com' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSmtpError(data.error || 'Test email failed to send');
        return;
      }

      setSmtpSuccess(data.message || 'Test email sent successfully! Please check your inbox.');
      setTimeout(() => setSmtpSuccess(null), 6000);
    } catch {
      setSmtpError('Network error while testing email dispatch.');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPassError(data.error || 'Failed to change password');
        return;
      }
      setPassSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 3000);
    } catch {
      setPassError('Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" /> Settings & Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your administrator profile, security credentials, property parameters, and system defaults.
          </p>
        </div>

        {/* 1. ADMINISTRATOR PROFILE EDIT CARD */}
        <div id="profile" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base">Administrator Profile</h2>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              Main Admin Account
            </span>
          </div>

          {adminSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adminSuccess}</span>
            </div>
          )}

          {adminError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{adminError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAdminProfile} className="space-y-4 text-xs">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="relative">
                {adminAvatarUrl ? (
                  <img
                    src={adminAvatarUrl}
                    alt="Admin Avatar"
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center border-2 border-white shadow-md">
                    {adminName ? adminName.slice(0, 2).toUpperCase() : 'AD'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition"
                  title="Upload profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="font-bold text-slate-800 text-sm">{adminName || 'Administrator'}</div>
                <div className="text-slate-500 text-xs mt-0.5">{adminEmail || 'adarshcsbhu@gmail.com'}</div>
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    {uploadingAvatar ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-slate-500" /> Change Avatar
                      </>
                    )}
                  </button>
                  {adminAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-2.5 py-1 text-slate-500 hover:text-rose-600 font-medium text-xs transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrator Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adarsh Sharma"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Admin Email <span className="text-blue-600">(Used for OTPs & Recovery)</span>
                </label>
                <input
                  type="email"
                  placeholder="adarshcsbhu@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Username / Login ID</label>
                <input
                  type="text"
                  placeholder="admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingAdmin}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                {savingAdmin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Profile...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 2. PROPERTY PROFILE & DEFAULTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Property Profile & Brand</h2>
          </div>

          {propSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{propSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProperty} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand / Property Name</label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Support Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Premises Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Rent Due Day of Month
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={defaultRentDueDay}
                  onChange={(e) => setDefaultRentDueDay(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Applied to newly created tenants.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Electricity Rate (₹ / Unit)
                </label>
                <input
                  type="number"
                  step="any"
                  value={defaultElectricityRate}
                  onChange={(e) => setDefaultElectricityRate(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 font-bold text-amber-700"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Standard default is ₹10 / unit.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProperty}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95"
              >
                {savingProperty ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Property Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 3. EMAIL & SMTP DISPATCH CONFIGURATION (FOR GMAIL OTPs) */}
        <div id="email-smtp" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base">Email & OTP Dispatch (Gmail SMTP)</h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" /> Secure Mailer
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Configure your Gmail account credentials to send automated password reset OTPs and notifications directly to <strong>{smtpUser || 'adarshcsbhu@gmail.com'}</strong>.
          </p>

          {smtpSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{smtpSuccess}</span>
            </div>
          )}

          {smtpError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{smtpError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSmtp} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sender Gmail / Email ID <span className="text-blue-600">*</span>
                </label>
                <input
                  type="email"
                  placeholder="adarshcsbhu@gmail.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-medium focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Used as the sender address and primary recipient.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google App Password (16 characters) <span className="text-blue-600">*</span>
                </label>
                <input
                  type="password"
                  placeholder="•••••••••••••••• (Leave blank to keep existing)"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Generate at myaccount.google.com/apppasswords</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-slate-600"
                />
              </div>
            </div>

            {/* Quick Gmail Instructions Box */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 text-[11px] text-blue-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <HelpCircle className="w-3.5 h-3.5" /> How to get your Google App Password for free (1 minute):
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                <li>Make sure <strong>2-Step Verification</strong> is ON in your Google Account.</li>
                <li>
                  Open{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    myaccount.google.com/apppasswords <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>Enter app name <strong>&quot;KirayaPro&quot;</strong> and click <strong>Create</strong>.</li>
                <li>Copy the 16-character code and paste it in the box above, then click <strong>Save Email Settings</strong>.</li>
              </ol>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingSmtp}
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {testingSmtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending Test Email...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-blue-600" /> Send Test Email to {smtpUser || 'adarshcsbhu@gmail.com'}
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={savingSmtp}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                {savingSmtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Email Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 4. SECURITY & PASSWORD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">Change Admin Password</h2>
          </div>

          {passSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* 4. DATABASE & ARCHITECTURE SUMMARY */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Database className="w-4 h-4 text-blue-600" /> System Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium block text-[11px]">System Platform</span>
              <span className="font-bold text-slate-900 mt-0.5 block">KirayaPro Tenancy Engine</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Active & Healthy</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium block text-[11px]">Recovery & Primary Dispatch</span>
              <span className="font-bold text-slate-900 mt-0.5 block">adarshcsbhu@gmail.com</span>
              <span className="text-[10px] text-blue-600 font-semibold">OTP Verification Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
