'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  X,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Home,
} from 'lucide-react';
import { usePropertyContext } from '@/context/PropertyContext';

export const AddPropertyModal: React.FC = () => {
  const {
    isAddPropertyOpen,
    setIsAddPropertyOpen,
    editingProperty,
    setEditingProperty,
    refreshProperties,
    setSelectedPropertyId,
  } = usePropertyContext();

  const [name, setName] = useState('');
  const [type, setType] = useState('Building');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Varanasi');
  const [state, setState] = useState('Uttar Pradesh');
  const [pinCode, setPinCode] = useState('');
  const [photo, setPhoto] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('admin@renters.com');
  const [defaultRentDueDay, setDefaultRentDueDay] = useState('5');
  const [defaultElectricityRate, setDefaultElectricityRate] = useState('10');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingProperty) {
      setName(editingProperty.name || '');
      setType(editingProperty.type || 'Building');
      setAddress(editingProperty.address || '');
      setCity(editingProperty.city || 'Varanasi');
      setState(editingProperty.state || 'Uttar Pradesh');
      setPinCode(editingProperty.pinCode || '');
      setPhoto(editingProperty.photo || '');
      setDescription(editingProperty.description || '');
      setStatus(editingProperty.status || 'ACTIVE');
      setPhone(editingProperty.phone || '+91 98765 43210');
      setEmail(editingProperty.email || 'admin@renters.com');
    } else {
      setName('');
      setType('Building');
      setAddress('');
      setCity('Varanasi');
      setState('Uttar Pradesh');
      setPinCode('');
      setPhoto('');
      setDescription('');
      setStatus('ACTIVE');
      setPhone('+91 98765 43210');
      setEmail('admin@renters.com');
      setDefaultRentDueDay('5');
      setDefaultElectricityRate('10');
    }
    setError(null);
    setSuccess(null);
  }, [editingProperty, isAddPropertyOpen]);

  if (!isAddPropertyOpen) return null;

  const handleClose = () => {
    setIsAddPropertyOpen(false);
    setEditingProperty(null);
    setError(null);
    setSuccess(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const photoUrl = data.url || data.data?.url;
        setPhoto(photoUrl);
      } else {
        setError(data.error || 'Failed to upload photo');
      }
    } catch {
      setError('Network error while uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Property/Building name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        type,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        photo,
        description: description.trim(),
        status,
        phone: phone.trim(),
        email: email.trim(),
        defaultRentDueDay: Number(defaultRentDueDay) || 5,
        defaultElectricityRate: Number(defaultElectricityRate) || 10,
      };

      const url = editingProperty
        ? `/api/properties/${editingProperty._id}`
        : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(editingProperty ? 'Property updated successfully!' : 'Property created successfully!');
        await refreshProperties();
        if (!editingProperty && data.data?._id) {
          setSelectedPropertyId(data.data._id);
        }
        setTimeout(() => {
          handleClose();
        }, 800);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch {
      setError('Failed to save property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingProperty
                  ? 'Update details, address, and status for this property'
                  : 'Add a new building, apartment, hostel, or PG to manage'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Photo & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Property Photo */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all relative"
              >
                {photo ? (
                  <img src={photo} alt="Property" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-600">
                    <Camera className="w-7 h-7 mb-1" />
                    <span className="text-[11px] font-medium">Add Photo</span>
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <span className="text-[11px] text-slate-400">Optional photo</span>
            </div>

            {/* Name and Type */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Property / Building Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shivdaspur Building, Lanka Apartment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Property Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Address
            </label>
            <input
              type="text"
              placeholder="e.g. Plot No 42, Shivdaspur Road, Near BHU Gate"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* City, State, PIN */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                placeholder="Varanasi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                placeholder="Uttar Pradesh"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                placeholder="221005"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Defaults for this property */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Rent Due Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={defaultRentDueDay}
                onChange={(e) => setDefaultRentDueDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Electricity Rate (₹/Unit)
              </label>
              <input
                type="number"
                min="1"
                value={defaultElectricityRate}
                onChange={(e) => setDefaultElectricityRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 3-floor building with 12 single rooms and 4 double sharing rooms. Solar water heater installed."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : editingProperty ? (
                'Save Changes'
              ) : (
                'Create Property'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
