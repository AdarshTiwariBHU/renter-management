'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  Shield,
  ShieldAlert,
  Home,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');

  const [activeTab, setActiveTab] = useState<'renter' | 'admin'>(
    initialRoleParam === 'admin' ? 'admin' : 'renter'
  );

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if (initialRoleParam === 'admin') {
      setActiveTab('admin');
      setIdentifier('admin@renters.com');
      setPassword('admin123');
    } else {
      setActiveTab('renter');
      setIdentifier('');
      setPassword('');
    }
  }, [initialRoleParam]);

  const handleTabChange = (tab: 'renter' | 'admin') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'admin') {
      setIdentifier('admin@renters.com');
      setPassword('admin123');
    } else {
      setIdentifier('');
      setPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      const targetUrl = data.data?.redirectUrl || (activeTab === 'renter' ? '/renter/dashboard' : '/dashboard');
      router.push(targetUrl);
      router.refresh();
    } catch {
      setError('Failed to connect to server. Please try again.');
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIdentifier('admin@renters.com');
    setPassword('admin123');
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-10 relative z-10 border border-slate-100">
      {/* Back to Home Link */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {activeTab === 'renter' ? 'Tenant Access' : 'Management Access'}
        </span>
      </div>

      {/* Brand header */}
      <div className="text-center mb-6">
        <div className="w-13 h-13 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25 text-white p-3">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KirayaPro</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {activeTab === 'renter'
            ? 'Sign in to access your tenant dashboard & bills'
            : 'Authorized property managers and admin login'}
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('renter')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'renter'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Renter Login
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('admin')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin Login
        </button>
      </div>

      {searchParams.get('revoked') === 'true' && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Security Notice:</span> You have been signed out from all devices following a password reset. Please sign in with your updated credentials.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {activeTab === 'renter'
              ? 'Renter Login ID, Mobile or Email'
              : 'Admin Username or Email'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'renter' ? 'e.g. rahul101 or 9876543210' : 'admin@renters.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 font-semibold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm mt-2 active:scale-98 text-white ${
            activeTab === 'renter'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Signing In...
            </>
          ) : (
            <>
              {activeTab === 'renter' ? 'Sign In to Renter Portal' : 'Sign In as Admin'}{' '}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {activeTab === 'renter' ? (
          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Looking for a room? </span>
            <Link href="/register" className="text-xs text-blue-600 font-bold hover:underline">
              Self-Register Online Here
            </Link>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 mb-1.5">Staff Demo Credentials</p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Fill Demo Admin (admin123)
            </button>
          </div>
        )}
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <h3 className="font-bold text-slate-800 text-base">Password Recovery</h3>
            <p className="text-xs text-slate-600">
              For security, administrator passwords can be updated via the Settings page or directly in MongoDB using the seed script.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-700 text-left">
              Default: admin@renters.com / admin123
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center text-slate-400">
            Loading login...
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
