'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  LogOut,
  Laptop,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard steps: 'request' | 'verify' | 'reset' | 'success'
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');

  const [identifier, setIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoutFromAllDevices, setLogoutFromAllDevices] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const maskEmailAddress = (email: string) => {
    if (!email || !email.includes('@')) return 'your registered email';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }

      const receivedEmail = data.targetEmail || '';
      setTargetEmail(receivedEmail);
      const masked = maskEmailAddress(receivedEmail);
      setMaskedEmail(masked);
      setSuccessMsg(`Verification code sent to ${masked}`);
      setStep('verify');
    } catch {
      setError('Unable to contact server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail, otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid or expired OTP');
        setLoading(false);
        return;
      }

      setResetToken(data.resetToken);
      setSuccessMsg('OTP verified! Please set your new password.');
      setStep('reset');
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword, logoutFromAllDevices }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setStep('success');
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-10 relative z-10 border border-slate-100">
        {/* Header link */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            KirayaPro Security
          </span>
        </div>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25 text-white p-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 'request' && 'Forgot Password'}
            {step === 'verify' && 'Verify Email OTP'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Password Reset Complete!'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'request' && 'Verification OTP will be sent to your registered email address'}
            {step === 'verify' && `Check your inbox at ${maskedEmail || 'your registered email'}`}
            {step === 'reset' && 'Choose a secure new password for your account'}
            {step === 'success' && 'You can now log in with your updated credentials'}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}


        {/* STEP 1: REQUEST OTP */}
        {step === 'request' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Email, Username or Login ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter your email, username or login ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <span className="font-bold">Security Notice:</span> An OTP will be securely dispatched to your registered primary management email address.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Sending OTP...
                </>
              ) : (
                <>
                  Send Verification OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl font-mono tracking-widest font-extrabold py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Check inbox/spam of <span className="font-semibold text-slate-600">{maskedEmail || 'your registered email'}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify Code & Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
              >
                Change identifier or resend OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Session & Device Security Options */}
            <div className="pt-1 pb-1">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Active Devices & Session Security
              </label>
              <div className="space-y-2">
                {/* Option 1: Log out from all devices */}
                <div
                  onClick={() => setLogoutFromAllDevices(true)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 select-none ${
                    logoutFromAllDevices
                      ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    id="opt-logout-all"
                    name="deviceSession"
                    checked={logoutFromAllDevices}
                    onChange={() => setLogoutFromAllDevices(true)}
                    className="mt-1 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="opt-logout-all" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <LogOut className="w-3.5 h-3.5 text-blue-600" />
                      <span>Log out from all devices</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Instantly revokes access on all other phones, computers, and active browser sessions everywhere.
                    </p>
                  </label>
                </div>

                {/* Option 2: Stay logged in */}
                <div
                  onClick={() => setLogoutFromAllDevices(false)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 select-none ${
                    !logoutFromAllDevices
                      ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    id="opt-stay-in"
                    name="deviceSession"
                    checked={!logoutFromAllDevices}
                    onChange={() => setLogoutFromAllDevices(false)}
                    className="mt-1 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="opt-stay-in" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Laptop className="w-3.5 h-3.5 text-slate-500" />
                      <span>Stay logged in</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Keep other devices and active browser sessions logged in.
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Updating Password...
                </>
              ) : (
                <>
                  Save New Password <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold">
                Your password has been successfully reset!
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                {logoutFromAllDevices
                  ? 'All other devices and active sessions have been signed out. Please sign in with your new credentials.'
                  : 'You may now sign in to your KirayaPro account with your updated password.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
            >
              Proceed to Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
