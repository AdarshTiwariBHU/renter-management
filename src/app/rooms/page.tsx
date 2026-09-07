'use client';

import React, { useEffect, useState } from 'react';
import {
  DoorOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/calculations';
import { usePropertyContext } from '@/context/PropertyContext';
import { Building2 } from 'lucide-react';

interface RoomItem {
  _id: string;
  roomNumber: string;
  floor: number;
  building: string;
  roomType: string;
  monthlyRentDefault: number;
  status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyId?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentRenterId?: any;
}

export default function RoomsPage() {
  const { properties, selectedPropertyId, selectedProperty, setSelectedPropertyId } = usePropertyContext();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);

  const [roomPropertyId, setRoomPropertyId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [building, setBuilding] = useState('');
  const [roomType, setRoomType] = useState('1BHK');
  const [monthlyRentDefault, setMonthlyRentDefault] = useState('5000');
  const [roomStatus, setRoomStatus] = useState<'VACANT' | 'OCCUPIED' | 'MAINTENANCE'>('VACANT');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (selectedPropertyId && selectedPropertyId !== 'ALL') params.set('propertyId', selectedPropertyId);

      const res = await fetch(`/api/rooms?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [statusFilter, selectedPropertyId]);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    const defaultProp = (selectedPropertyId && selectedPropertyId !== 'ALL')
      ? selectedPropertyId
      : (properties.find(p => p.status === 'ACTIVE')?._id || properties[0]?._id || '');
    setRoomPropertyId(defaultProp);
    setRoomNumber('');
    setFloor('1');
    const chosenProp = properties.find(p => p._id === defaultProp);
    setBuilding(chosenProp?.name || 'Main Wing');
    setRoomType('1BHK');
    setMonthlyRentDefault('5000');
    setRoomStatus('VACANT');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (room: RoomItem) => {
    setEditingRoom(room);
    const currentPropId = typeof room.propertyId === 'object' && room.propertyId?._id 
      ? room.propertyId._id 
      : (room.propertyId || '');
    setRoomPropertyId(currentPropId);
    setRoomNumber(room.roomNumber);
    setFloor(room.floor.toString());
    setBuilding(room.building || '');
    setRoomType(room.roomType);
    setMonthlyRentDefault(room.monthlyRentDefault.toString());
    setRoomStatus(room.status);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        propertyId: roomPropertyId,
        roomNumber,
        floor: Number(floor),
        building: building || undefined,
        roomType,
        monthlyRentDefault: Number(monthlyRentDefault),
        status: roomStatus,
      };

      const url = editingRoom ? `/api/rooms/${editingRoom._id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save room');
        setSaving(false);
        return;
      }

      setModalOpen(false);
      fetchRooms();
    } catch {
      setError('Network error. Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: RoomItem) => {
    if (room.status === 'OCCUPIED' || room.currentRenterId) {
      alert('Cannot delete an occupied room. Vacate the renter first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete Room #${room.roomNumber}?`)) return;

    try {
      const res = await fetch(`/api/rooms/${room._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete room');
        return;
      }
      fetchRooms();
    } catch {
      alert('Failed to delete room');
    }
  };

  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const vacantCount = rooms.filter((r) => r.status === 'VACANT').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DoorOpen className="w-6 h-6 text-indigo-600" /> Rooms & Units Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {selectedProperty ? `Viewing: ${selectedProperty.name} • ` : 'All Properties • '}
              Total {rooms.length} rooms • {occupiedCount} Occupied • {vacantCount} Vacant
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>

        {/* Selected Property Banner if filtered */}
        {selectedProperty && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-2.5 text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Filtered by Property: <strong>{selectedProperty.name}</strong> ({selectedProperty.type}, {selectedProperty.city})
              </span>
            </div>
            <button
              onClick={() => setSelectedPropertyId('ALL')}
              className="font-semibold text-indigo-600 hover:text-indigo-800 underline ml-3 shrink-0"
            >
              Show All Properties
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-xs overflow-x-auto whitespace-nowrap scrollbar-none touch-scroll">
          <span className="text-slate-400 font-semibold px-2 shrink-0">Filter by Status:</span>
          {['ALL', 'VACANT', 'OCCUPIED', 'MAINTENANCE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === s
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL' ? 'All Rooms' : s}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" /> Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No rooms found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const propName = typeof room.propertyId === 'object' && room.propertyId?.name 
                ? room.propertyId.name 
                : room.building;

              return (
                <div
                  key={room._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Floor {room.floor} • {room.roomType}
                      </span>
                      <StatusBadge status={room.status} />
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{propName || 'KirayaPro Central'}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Room #{room.roomNumber}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 mt-1">
                        {formatCurrency(room.monthlyRentDefault)} / month
                      </p>
                    </div>

                    {/* Tenant Assignment Info */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                      {room.currentRenterId ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                            Current Tenant
                          </span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {room.currentRenterId.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {room.currentRenterId.mobile}
                          </p>
                        </div>
                      ) : (
                        <div className="text-emerald-700 font-medium flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ready to rent
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => handleOpenEdit(room)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      title="Edit Room"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {room.status !== 'OCCUPIED' && (
                      <button
                        onClick={() => handleDelete(room)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Room Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Property *</label>
                  <select
                    value={roomPropertyId}
                    onChange={(e) => {
                      setRoomPropertyId(e.target.value);
                      const chosen = properties.find(p => p._id === e.target.value);
                      if (chosen && !building) {
                        setBuilding(chosen.name);
                      }
                    }}
                    className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Choose Property --</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id} disabled={p.status === 'INACTIVE'}>
                        {p.name} {p.status === 'INACTIVE' ? '(Inactive)' : ''} - {p.city || p.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Room numbers must be unique within the selected property.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Floor *</label>
                    <input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none"
                    >
                      {['Single', 'Double', '1BHK', '2BHK', 'Studio', 'Shared'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Default Rent (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={monthlyRentDefault}
                    onChange={(e) => setMonthlyRentDefault(e.target.value)}
                    className="w-full text-sm font-bold rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value as any)}
                    className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none"
                  >
                    <option value="VACANT">Vacant</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                  >
                    {saving ? 'Saving...' : 'Save Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
