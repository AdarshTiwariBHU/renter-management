'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { usePropertyContext } from '@/context/PropertyContext';

export const PropertySwitcher: React.FC = () => {
  const {
    properties,
    selectedPropertyId,
    selectedProperty,
    setSelectedPropertyId,
    setIsAddPropertyOpen,
    setEditingProperty,
  } = usePropertyContext();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedPropertyId(id);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setEditingProperty(null);
    setIsAddPropertyOpen(true);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-800 transition-all text-xs sm:text-sm font-semibold shadow-xs shrink-0"
        title="Switch active property or view all"
      >
        <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          {selectedPropertyId === 'ALL' ? (
            <Layers className="w-3 h-3" />
          ) : (
            <Building2 className="w-3 h-3" />
          )}
        </div>
        <div className="flex flex-col text-left max-w-[100px] xs:max-w-[125px] sm:max-w-[190px]">
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none mb-0.5 truncate">
            Property
          </span>
          <span className="truncate font-bold text-slate-900 leading-tight text-[11px] sm:text-xs">
            {selectedPropertyId === 'ALL'
              ? 'All Properties'
              : selectedProperty?.name || 'Select Property'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-xs sm:max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Manage Properties
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {/* All Properties Combined Option */}
            <button
              onClick={() => handleSelect('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                selectedPropertyId === 'ALL'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedPropertyId === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">All Properties</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Combined portfolio overview
                  </div>
                </div>
              </div>
              {selectedPropertyId === 'ALL' && (
                <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
              )}
            </button>

            {properties.length > 0 && <div className="h-px bg-slate-100 my-1" />}

            {/* List of Individual Properties */}
            {properties.map((prop) => {
              const isSelected = selectedPropertyId === prop._id;
              const isInactive = prop.status === 'INACTIVE';

              return (
                <button
                  key={prop._id}
                  onClick={() => handleSelect(prop._id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prop.photo ? (
                        <img
                          src={prop.photo}
                          alt={prop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span className="truncate">{prop.name}</span>
                        {isInactive && (
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <span>{prop.type || 'Building'}</span>
                        {prop.city && <span>• {prop.city}</span>}
                        {prop.roomsCount !== undefined && (
                          <span>• {prop.roomsCount} rooms</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Action: + Add Property */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleAddNew}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Property</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
