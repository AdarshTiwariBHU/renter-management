'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  KeyRound,
  UserPlus,
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
  Camera,
  FileText,
  CreditCard,
  Phone,
  Menu,
  X,
  Lock,
  Mail,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Navigation menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);

  // Quick Renter Login state on Home Page
  const [quickLoginId, setQuickLoginId] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    setQuickLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: quickLoginId,
          password: quickPassword,
          rememberMe: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setQuickError(data.error || 'Login failed. Please check your credentials.');
        setQuickLoading(false);
        return;
      }

      const targetUrl = data.data?.redirectUrl || '/renter/dashboard';
      router.push(targetUrl);
    } catch {
      setQuickError('Failed to connect to the server. Please try again.');
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                KirayaPro
              </span>
              <span className="text-[11px] text-slate-400 block -mt-1 font-medium">
                Smart Tenancy & Property Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#services" className="hover:text-blue-400 transition">
              Portal Services
            </a>
            <a href="#how-it-works" className="hover:text-blue-400 transition">
              How to Join
            </a>
            <Link href="/register" className="hover:text-blue-400 transition">
              New Registration
            </Link>
          </nav>

          {/* Desktop Actions & Admin Menu Tab */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login?role=renter"
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              Renter Login
            </Link>

            <Link
              href="/register"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register User
            </Link>

            {/* Menu Tab with Admin Login */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center gap-1.5"
              >
                <Menu className="w-4 h-4" />
                <span>Menu Tab</span>
              </button>

              {menuDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setMenuDropdownOpen(false)}
                >
                  <div className="p-2 border-b border-slate-800/80 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Staff & Management
                    </p>
                  </div>

                  {/* ADMIN LOGIN INSIDE MENU TAB */}
                  <Link
                    href="/login?role=admin"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-600/15 border border-transparent hover:border-indigo-500/30 text-slate-200 transition group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                        Admin Login
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Staff & Property Owners
                      </div>
                    </div>
                  </Link>

                  <div className="p-2 border-t border-slate-800/80 mt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Links
                    </p>
                  </div>

                  <Link
                    href="/login?role=renter"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    Renter Portal
                  </Link>

                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    Renter Self-Registration
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
              <Link
                href="/login?role=renter"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-xs font-bold text-center text-white bg-blue-600 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <KeyRound className="w-3.5 h-3.5" /> Renter Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-xs font-bold text-center text-white bg-emerald-600 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" /> Register User
              </Link>
            </div>

            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Menu Tab (Management Access)
              </div>
              <Link
                href="/login?role=admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 hover:bg-indigo-900/40 transition"
              >
                <span className="flex items-center gap-2 text-xs font-bold">
                  <Shield className="w-4 h-4 text-indigo-400" /> Admin / Staff Login
                </span>
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1">
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header Tag */}
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Official Tenancy & Resident Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Modern Living & Effortless{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                  Renter Management
                </span>
              </h1>

              <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                A seamless portal for renters and applicants. Submit monthly meter readings with photo proof, track bills transparently, and register online for room allocation.
              </p>
            </div>

            {/* 3. PROMINENT HOME PAGE CARDS: RENTER LOGIN & REGISTER USER */}
            <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {/* CARD 1: RENTER LOGIN */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-950/40 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-950 text-blue-300 border border-blue-800/60">
                      Existing Residents
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white">Renter Portal Login</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
                    Sign in with your Login ID, registered mobile, or email to access your monthly bills and meter submissions.
                  </p>

                  {/* Inline Quick Renter Login Form */}
                  {quickError && (
                    <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{quickError}</span>
                    </div>
                  )}

                  <form onSubmit={handleQuickLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Renter Login ID / Mobile
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. rahul101 or 9876543210"
                          value={quickLoginId}
                          onChange={(e) => setQuickLoginId(e.target.value)}
                          className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={quickPassword}
                          onChange={(e) => setQuickPassword(e.target.value)}
                          className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={quickLoading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98 disabled:opacity-60 cursor-pointer"
                    >
                      {quickLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                        </>
                      ) : (
                        <>
                          Sign In to Renter Dashboard <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Need full screen login?</span>
                  <Link
                    href="/login?role=renter"
                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                  >
                    Open Renter Login Page →
                  </Link>
                </div>
              </div>

              {/* CARD 2: REGISTER USER / SELF-REGISTRATION */}
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/40 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      New Applicants
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <UserPlus className="w-5 h-5" />
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white">Renter Self-Registration</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
                    Applying for a room at KirayaPro? Register online in minutes with fast verification.
                  </p>

                  <div className="space-y-3.5 mb-8">
                    <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Fill Personal & Contact Details</div>
                        <div className="text-[11px] text-slate-400">Name, mobile, email, permanent address & emergency contact</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Upload Aadhaar & Profile Photo</div>
                        <div className="text-[11px] text-slate-400">Secure document uploads from your phone camera or gallery</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Room Allotment & Quick Activation</div>
                        <div className="text-[11px] text-slate-400">Admin approves your request and activates your room & meters</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Link
                    href="/register"
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98"
                  >
                    Register as New Renter <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="mt-4 text-center text-[11px] text-slate-400">
                    Takes only ~2 minutes • Fully digital & paperless
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PORTAL HIGHLIGHTS & SERVICES */}
        <section id="services" className="py-16 bg-slate-900/60 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Designed for Complete Transparency
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Everything tenants and management need to ensure clear billing, timely payments, and accurate readings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">Mandatory Meter Photos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Renters submit physical meter photographs to prevent disputes and guarantee accurate monthly electricity bills.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">Automated Calculations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Units consumed and total charges calculate automatically based on approved initial and current meter readings.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">Unified Digital Bills</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Combined invoices for monthly rent, electricity consumption, and security deposits visible anytime in your portal.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">Real-time Ledger & Dues</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant tracking of payments, deposits, outstanding balances, and overdue days with total peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Step-by-Step</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                How Tenancy Management Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 font-bold text-lg flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  1
                </div>
                <h3 className="text-base font-bold text-white mb-2">Self-Register Online</h3>
                <p className="text-xs text-slate-400">
                  Visit the registration page, provide your personal details, upload Aadhaar images, and pick your requested room.
                </p>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-lg flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                  2
                </div>
                <h3 className="text-base font-bold text-white mb-2">Admin Approval & Allotment</h3>
                <p className="text-xs text-slate-400">
                  The property administrator reviews your identity documents, assigns the room, sets up meters, and activates your account.
                </p>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-lg flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  3
                </div>
                <h3 className="text-base font-bold text-white mb-2">Access Renter Portal</h3>
                <p className="text-xs text-slate-400">
                  Log in directly from the homepage or renter login page to check monthly bills, upload meter photos, and monitor payments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-850 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-850">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm">KirayaPro Portal</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
              <Link href="/login?role=renter" className="hover:text-white transition">
                Renter Login
              </Link>
              <Link href="/register" className="hover:text-white transition">
                Renter Registration
              </Link>
              <a href="#services" className="hover:text-white transition">
                Services
              </a>
              {/* Discreet Admin Login inside Footer Menu */}
              <Link
                href="/login?role=admin"
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
              >
                <Shield className="w-3.5 h-3.5" /> Staff / Admin Login
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} KirayaPro. All rights reserved.</p>
            <p className="text-slate-400 flex items-center gap-1.5">
              <span>Caretaker Contact:</span>
              <a
                href="tel:8114252525"
                className="text-blue-400 hover:text-blue-300 font-mono font-bold transition flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                8114252525
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
