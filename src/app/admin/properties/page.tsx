'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Edit,
  Eye,
  DoorOpen,
  Users,
  Receipt,
  CreditCard,
  Zap,
  Power,
  PowerOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Search,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyContext, PropertyItem } from '@/context/PropertyContext';
import { formatCurrency } from '@/lib/calculations';

export default function PropertiesPage() {
  const router = useRouter();
  const {
    properties,
    loading,
    refreshProperties,
    setIsAddPropertyOpen,
    setEditingProperty,
    setSelectedPropertyId,
  } = usePropertyContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggleStatus = async (prop: PropertyItem) => {
    try {
      setActionLoadingId(prop._id);
      const res = await fetch(`/api/properties/${prop._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Property "${prop.name}" is now ${data.data.status}`,
        });
        await refreshProperties();
      } else {
        setNotification({ type: 'error', text: data.error || 'Failed to toggle status' });
      }
    } catch {
      setNotification({ type: 'error', text: 'Network error while updating status' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEdit = (prop: PropertyItem) => {
    setEditingProperty(prop);
    setIsAddPropertyOpen(true);
  };

  const handleSelectAndGo = (propId: string, path: string) => {
    setSelectedPropertyId(propId);
    router.push(path);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.status === 'ACTIVE').length;
  const totalPortfolioRooms = properties.reduce((s, p) => s + (p.roomsCount || 0), 0);
  const totalPortfolioRenters = properties.reduce((s, p) => s + (p.rentersCount || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-blue-600" />
              Multi-Property Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage buildings, apartments, hostels, and PGs across your portfolio from one account.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProperty(null);
              setIsAddPropertyOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Property</span>
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Portfolio Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Total Properties
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1 truncate">{totalProperties}</div>
            <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-0.5 truncate">
              {activeProperties} Active, {totalProperties - activeProperties} Inactive
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Total Rooms
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1 truncate">{totalPortfolioRooms}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              Across portfolio
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Active Renters
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1 truncate">{totalPortfolioRenters}</div>
            <div className="text-[10px] sm:text-[11px] text-blue-600 font-medium mt-0.5 truncate">
              Managed tenants
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
              Portfolio Status
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-1 truncate">Operational</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              Multi-property active
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property name, city, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({properties.length})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeProperties})
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inactive ({properties.length - activeProperties})
              </button>
            </div>

            <button
              onClick={() => refreshProperties()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="Refresh property list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Property Cards Layout (Visible on mobile) */}
        <div className="block md:hidden space-y-3">
          {loading && properties.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              Loading properties...
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No properties found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing search filters or click "+ Add Property" to create one.
              </p>
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const isInactive = prop.status === 'INACTIVE';
              const occupancyPct =
                (prop.roomsCount || 0) > 0
                  ? Math.round(((prop.occupiedRooms || 0) / (prop.roomsCount || 1)) * 100)
                  : 0;

              return (
                <div
                  key={prop._id}
                  className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 ${
                    isInactive ? 'opacity-70 bg-slate-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {prop.photo ? (
                          <img src={prop.photo} alt={prop.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/properties/${prop._id}`}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 block truncate"
                        >
                          {prop.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
                            {prop.type || 'Building'}
                          </span>
                          {prop.city && <span className="truncate">• {prop.city}</span>}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prop.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  {/* 3 Metrics in a grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Rooms</span>
                      <span className="font-bold text-slate-800">
                        {prop.occupiedRooms || 0} / {prop.roomsCount || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Occupancy</span>
                      <span className="font-bold text-indigo-600">{occupancyPct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Dues</span>
                      <span className="font-bold text-rose-600">
                        {formatCurrency(prop.pendingAmount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/admin/properties/${prop._id}`}
                      className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl text-center transition"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => handleEdit(prop)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                      title="Edit Property"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(prop)}
                      disabled={actionLoadingId === prop._id}
                      className={`p-2 rounded-xl transition ${
                        prop.status === 'ACTIVE'
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={prop.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {actionLoadingId === prop._id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : prop.status === 'ACTIVE' ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Property List Table */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4 text-center">Rooms</th>
                  <th className="py-3.5 px-4 text-center">Renters</th>
                  <th className="py-3.5 px-4 text-center">Occupied</th>
                  <th className="py-3.5 px-4 text-right">Pending Dues</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {loading && properties.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading properties...
                    </td>
                  </tr>
                ) : filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No properties found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try clearing search filters or click "+ Add Property" to create one.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((prop) => {
                    const isInactive = prop.status === 'INACTIVE';
                    const occupancyPct =
                      (prop.roomsCount || 0) > 0
                        ? Math.round(((prop.occupiedRooms || 0) / (prop.roomsCount || 1)) * 100)
                        : 0;

                    return (
                      <tr
                        key={prop._id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isInactive ? 'bg-slate-50/40 text-slate-500' : ''
                        }`}
                      >
                        {/* Property Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {prop.photo ? (
                                <img
                                  src={prop.photo}
                                  alt={prop.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/admin/properties/${prop._id}`}
                                className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                              >
                                {prop.name}
                              </Link>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {prop.type || 'Building'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-start gap-1 max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate text-xs">
                              {[prop.address, prop.city, prop.pinCode].filter(Boolean).join(', ') || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Rooms */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {prop.roomsCount || 0}
                        </td>

                        {/* Renters */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {prop.rentersCount || 0}
                        </td>

                        {/* Occupied */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                            {prop.occupiedRooms || 0} / {prop.roomsCount || 0}
                            <span className="text-[10px] text-slate-400">({occupancyPct}%)</span>
                          </span>
                        </td>

                        {/* Pending Dues */}
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                          {formatCurrency(prop.pendingAmount || 0)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              prop.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {prop.status}
                          </span>
                        </td>

                        {/* Actions (Section 12.8) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Property Details */}
                            <Link
                              href={`/admin/properties/${prop._id}`}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Property Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Edit Property */}
                            <button
                              onClick={() => handleEdit(prop)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Property Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Manage Rooms */}
                            <button
                              onClick={() => handleSelectAndGo(prop._id, `/rooms?propertyId=${prop._id}`)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Manage Rooms"
                            >
                              <DoorOpen className="w-4 h-4" />
                            </button>

                            {/* View Renters */}
                            <button
                              onClick={() => handleSelectAndGo(prop._id, `/renters?propertyId=${prop._id}`)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="View Renters"
                            >
                              <Users className="w-4 h-4" />
                            </button>

                            {/* View Bills */}
                            <button
                              onClick={() => handleSelectAndGo(prop._id, `/bills?propertyId=${prop._id}`)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                              title="View Bills"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>

                            {/* View Electricity */}
                            <button
                              onClick={() => handleSelectAndGo(prop._id, `/electricity?propertyId=${prop._id}`)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="View Electricity"
                            >
                              <Zap className="w-4 h-4" />
                            </button>

                            {/* Activate / Deactivate Toggle */}
                            <button
                              onClick={() => handleToggleStatus(prop)}
                              disabled={actionLoadingId === prop._id}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                prop.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={prop.status === 'ACTIVE' ? 'Deactivate Property' : 'Activate Property'}
                            >
                              {actionLoadingId === prop._id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : prop.status === 'ACTIVE' ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
