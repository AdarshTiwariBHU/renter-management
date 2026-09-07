'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  DoorOpen,
  Users,
  Receipt,
  CreditCard,
  Zap,
  BarChart3,
  Settings,
  ArrowLeft,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyContext } from '@/context/PropertyContext';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';

type TabType =
  | 'overview'
  | 'rooms'
  | 'renters'
  | 'bills'
  | 'payments'
  | 'electricity'
  | 'pending_readings'
  | 'reports'
  | 'settings';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { refreshProperties, setSelectedPropertyId } = usePropertyContext();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Tab data states
  const [rooms, setRooms] = useState<any[]>([]);
  const [renters, setRenters] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [pendingReadings, setPendingReadings] = useState<any[]>([]);
  const [loadingTabData, setLoadingTabData] = useState(false);

  // Settings form states
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Building');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPinCode, setEditPinCode] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editDescription, setEditDescription] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/properties/${propertyId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setProperty(data.data);
        setEditName(data.data.name || '');
        setEditType(data.data.type || 'Building');
        setEditAddress(data.data.address || '');
        setEditCity(data.data.city || '');
        setEditState(data.data.state || '');
        setEditPinCode(data.data.pinCode || '');
        setEditStatus(data.data.status || 'ACTIVE');
        setEditDescription(data.data.description || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (!propertyId) return;

    const fetchTabData = async () => {
      try {
        setLoadingTabData(true);
        if (activeTab === 'rooms') {
          const res = await fetch(`/api/rooms?propertyId=${propertyId}`);
          const d = await res.json();
          if (d.success) setRooms(d.data || []);
        } else if (activeTab === 'renters') {
          const res = await fetch(`/api/renters?propertyId=${propertyId}&status=ALL`);
          const d = await res.json();
          if (d.success) setRenters(d.data || []);
        } else if (activeTab === 'bills') {
          const res = await fetch(`/api/bills?propertyId=${propertyId}`);
          const d = await res.json();
          if (d.success) setBills(d.data || []);
        } else if (activeTab === 'payments') {
          const res = await fetch(`/api/payments?propertyId=${propertyId}`);
          const d = await res.json();
          if (d.success) setPayments(d.data || []);
        } else if (activeTab === 'electricity') {
          const res = await fetch(`/api/meter-readings?propertyId=${propertyId}`);
          const d = await res.json();
          if (d.success) setReadings(d.data || []);
        } else if (activeTab === 'pending_readings') {
          const res = await fetch(`/api/meter-readings?propertyId=${propertyId}`);
          const d = await res.json();
          if (d.success) {
            setPendingReadings((d.data || []).filter((r: any) => r.status === 'PENDING_REVIEW'));
          }
        }
      } catch (err) {
        console.error('Failed to fetch tab data:', err);
      } finally {
        setLoadingTabData(false);
      }
    };

    fetchTabData();
  }, [activeTab, propertyId]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(null);
    setSettingsError(null);
    setSavingSettings(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          type: editType,
          address: editAddress.trim(),
          city: editCity.trim(),
          state: editState.trim(),
          pinCode: editPinCode.trim(),
          status: editStatus,
          description: editDescription.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess('Property settings updated successfully');
        await fetchProperty();
        await refreshProperties();
      } else {
        setSettingsError(data.error || 'Failed to update settings');
      }
    } catch {
      setSettingsError('Network error while saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-slate-500 font-semibold">Loading property details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Property Not Found</h2>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            The property you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Properties
          </Link>
        </div>
      </AppLayout>
    );
  }

  const stats = property.stats || {};

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/admin/properties" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Properties
          </Link>
          <span>/</span>
          <span className="text-slate-900">{property.name}</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                {property.photo ? (
                  <img
                    src={property.photo}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {property.name}
                  </h1>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      property.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {property.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {property.type || 'Building'}
                  </span>
                  {(property.address || property.city) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {[property.address, property.city, property.pinCode].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedPropertyId(property._id);
                  router.push('/dashboard');
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Set as Active Context
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> Edit Settings
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Rooms
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 truncate block">
                {stats.occupiedRooms || 0} / {stats.totalRooms || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {stats.occupancyRate || 0}% Occupied
              </span>
            </div>

            <div className="bg-slate-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Renters
              </span>
              <span className="text-lg sm:text-xl font-black text-blue-600 truncate block">
                {stats.totalRenters || 0}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">Active tenants</span>
            </div>

            <div className="bg-slate-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Collected Month
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 truncate block">
                {formatCurrency(stats.paidThisMonth || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">Current month</span>
            </div>

            <div className="bg-slate-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Pending Balance
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-600 truncate block">
                {formatCurrency(stats.pendingAmount || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {stats.pendingBillsCount || 0} unpaid bills
              </span>
            </div>

            <div className="bg-slate-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Electricity
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-600 truncate block">
                {stats.electricityUnits || 0} <span className="text-xs font-normal">kWh</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {formatCurrency(stats.electricityCollection || 0)}
              </span>
            </div>

            <div className="bg-slate-50/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                Action Items
              </span>
              <span className="text-lg sm:text-xl font-black text-purple-600 truncate block">
                {(stats.pendingReadingsCount || 0) + (stats.pendingRequestsCount || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                {stats.pendingReadingsCount || 0} readings, {stats.pendingRequestsCount || 0} reqs
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Section 12.9) */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1 text-xs sm:text-sm font-semibold scrollbar-none touch-scroll -mx-2 px-2 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'rooms', label: `Rooms (${stats.totalRooms || 0})`, icon: DoorOpen },
            { id: 'renters', label: `Renters (${stats.totalRenters || 0})`, icon: Users },
            { id: 'bills', label: 'Monthly Bills', icon: Receipt },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'electricity', label: 'Electricity', icon: Zap },
            {
              id: 'pending_readings',
              label: `Pending Readings (${stats.pendingReadingsCount || 0})`,
              icon: Clock,
            },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'settings', label: 'Property Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition-colors whitespace-nowrap shrink-0 text-xs sm:text-sm ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Occupancy Progress */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-sm mb-3">
                    Occupancy & Capacity
                  </h3>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats.occupancyRate || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                    <span>
                      Occupied: <strong>{stats.occupiedRooms || 0}</strong>
                    </span>
                    <span>
                      Vacant: <strong>{stats.vacantRooms || 0}</strong>
                    </span>
                    <span>
                      Maintenance: <strong>{stats.maintenanceRooms || 0}</strong>
                    </span>
                    <span>
                      Total: <strong>{stats.totalRooms || 0} Rooms</strong>
                    </span>
                  </div>
                </div>

                {/* Description and Notes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-sm mb-2">
                    Property Description & Facilities
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {property.description ||
                      'No specific notes provided for this property. Click "Property Settings" tab to add building details, amenities, or caretaker contacts.'}
                  </p>
                </div>
              </div>

              {/* Sidebar Info Card */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Property Information</h3>

                  <div className="text-xs space-y-2.5">
                    <div>
                      <span className="text-slate-400 block font-medium">Property ID:</span>
                      <span className="font-mono text-slate-800 break-all">{property._id}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Full Address:</span>
                      <span className="text-slate-800">
                        {[property.address, property.city, property.state, property.pinCode]
                          .filter(Boolean)
                          .join(', ') || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Default Rent Due Date:</span>
                      <span className="text-slate-800 font-semibold">
                        Day {property.defaultRentDueDay || 5} of each month
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Default Electricity Rate:</span>
                      <span className="text-slate-800 font-semibold">
                        ₹{property.defaultElectricityRate || 10} / unit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Rooms in {property.name}
                </h3>
                <Link
                  href={`/rooms?propertyId=${property._id}`}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Manage / Add Room
                </Link>
              </div>

              {loadingTabData ? (
                <div className="py-12 text-center text-slate-400">Loading rooms...</div>
              ) : rooms.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <DoorOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No rooms in this property yet</p>
                  <Link
                    href={`/rooms?propertyId=${property._id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    + Add your first room
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {rooms.map((r) => (
                    <div
                      key={r._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-slate-900 text-base">
                          Room {r.roomNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            r.status === 'OCCUPIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'VACANT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <div>Floor: {r.floor} • Type: {r.roomType}</div>
                        <div>Rent: {formatCurrency(r.monthlyRentDefault)}/mo</div>
                        {r.currentRenterId && (
                          <div className="text-blue-600 font-medium truncate pt-1">
                            Tenant: {r.currentRenterId.fullName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. RENTERS TAB */}
          {activeTab === 'renters' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Renters in {property.name}
                </h3>
                <Link
                  href="/renters/new"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Renter
                </Link>
              </div>

              {loadingTabData ? (
                <div className="py-12 text-center text-slate-400">Loading renters...</div>
              ) : renters.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No renters assigned to this property</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {renters.map((r) => (
                    <div key={r._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm overflow-hidden">
                          {r.photoUrl ? (
                            <img src={r.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            r.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">
                            {r.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            Room {r.roomNumber || '—'} • Mobile: {r.mobile}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm block">
                          {formatCurrency(r.monthlyRent)}/mo
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.paymentStatus === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. BILLS TAB */}
          {activeTab === 'bills' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Monthly Bills for {property.name}
                </h3>
                <Link
                  href={`/bills?propertyId=${property._id}`}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  View in Bills Section &rarr;
                </Link>
              </div>

              {loadingTabData ? (
                <div className="py-12 text-center text-slate-400">Loading bills...</div>
              ) : bills.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No bills generated for this property</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                        <th className="py-2.5 px-3">Renter</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3 text-right">Total Payable</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bills.map((b) => (
                        <tr key={b._id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {b.renterId?.fullName || 'Unknown'}
                          </td>
                          <td className="py-2.5 px-3">{b.roomNumber}</td>
                          <td className="py-2.5 px-3">{b.billingMonth}</td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {formatCurrency(b.totalPayable)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">
                            {formatCurrency(b.paidAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600 font-bold">
                            {formatCurrency(b.balance)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Payment History for {property.name}
                </h3>
                <Link
                  href={`/payments?propertyId=${property._id}`}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  View in Payments Section &rarr;
                </Link>
              </div>

              {loadingTabData ? (
                <div className="py-12 text-center text-slate-400">Loading payments...</div>
              ) : payments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No payments recorded for this property</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                        <th className="py-2.5 px-3">Receipt</th>
                        <th className="py-2.5 px-3">Renter</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                            {p.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {p.renterId?.fullName || 'Unknown'}
                          </td>
                          <td className="py-2.5 px-3">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. ELECTRICITY TAB */}
          {activeTab === 'electricity' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Electricity Readings for {property.name}
                </h3>
                <Link
                  href={`/electricity?propertyId=${property._id}`}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Manage Electricity &rarr;
                </Link>
              </div>

              {loadingTabData ? (
                <div className="py-12 text-center text-slate-400">Loading readings...</div>
              ) : readings.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Zap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No electricity readings recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                        <th className="py-2.5 px-3">Renter</th>
                        <th className="py-2.5 px-3">Meter</th>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3 text-right">Units (kWh)</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {readings.map((r) => (
                        <tr key={r._id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {r.renterId?.fullName || 'Unknown'}
                          </td>
                          <td className="py-2.5 px-3">{r.meterName}</td>
                          <td className="py-2.5 px-3">{r.billingMonth}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {r.unitsConsumed}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                            {formatCurrency(r.electricityAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 7. PENDING READINGS TAB */}
          {activeTab === 'pending_readings' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-base">
                Pending Meter Reading Approvals for {property.name}
              </h3>
              {loadingTabData ? (
                <div className="py-12 text-center text-slate-400">Loading pending readings...</div>
              ) : pendingReadings.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                  <p className="font-semibold text-slate-700">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No meter readings are pending approval for this property.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReadings.map((pr) => (
                    <div
                      key={pr._id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {pr.renterId?.fullName || 'Renter'} • Room {pr.renterId?.roomNumber || '—'}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Meter: {pr.meterName} • Reading: {pr.currentReading} (
                          {pr.unitsConsumed} units) • Month: {pr.billingMonth}
                        </div>
                      </div>
                      <Link
                        href="/electricity"
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        Review in Electricity
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Financial & Occupancy Reports for {property.name}
                </h3>
                <Link
                  href={`/reports?propertyId=${property._id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Open Dedicated Reports Screen &rarr;
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                View collection trends, arrears breakdown, electricity consumption rankings, and occupancy reports filtered exclusively for {property.name}.
              </p>
            </div>
          )}

          {/* 9. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 max-w-2xl">
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Property Settings
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Update name, address, property type, and operational status.
              </p>

              {settingsError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Property Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Property Type
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Building">Building</option>
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Hostel">Hostel</option>
                      <option value="PG">PG</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={editPinCode}
                      onChange={(e) => setEditPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-60"
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
