'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface PropertyItem {
  _id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  photo?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  email?: string;
  roomsCount?: number;
  occupiedRooms?: number;
  vacantRooms?: number;
  rentersCount?: number;
  pendingAmount?: number;
  paidThisMonth?: number;
}

interface PropertyContextType {
  properties: PropertyItem[];
  loading: boolean;
  selectedPropertyId: string; // 'ALL' or specific _id
  selectedProperty: PropertyItem | null;
  setSelectedPropertyId: (id: string) => void;
  refreshProperties: () => Promise<void>;
  isAddPropertyOpen: boolean;
  setIsAddPropertyOpen: (open: boolean) => void;
  editingProperty: PropertyItem | null;
  setEditingProperty: (prop: PropertyItem | null) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

const STORAGE_KEY = 'kirayapro_selected_property_id';

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string>('ALL');
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);

  // Initialize selectedPropertyId from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedPropertyIdState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setSelectedPropertyId = useCallback((id: string) => {
    setSelectedPropertyIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    // Dispatch custom DOM event so any listeners can react immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('property-changed', { detail: { propertyId: id } }));
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/properties');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProperties(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch properties in context:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const selectedProperty =
    selectedPropertyId === 'ALL'
      ? null
      : properties.find((p) => p._id === selectedPropertyId) || null;

  return (
    <PropertyContext.Provider
      value={{
        properties,
        loading,
        selectedPropertyId,
        selectedProperty,
        setSelectedPropertyId,
        refreshProperties: fetchProperties,
        isAddPropertyOpen,
        setIsAddPropertyOpen,
        editingProperty,
        setEditingProperty,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const usePropertyContext = () => {
  const ctx = useContext(PropertyContext);
  if (!ctx) {
    return {
      properties: [],
      loading: false,
      selectedPropertyId: 'ALL',
      selectedProperty: null,
      setSelectedPropertyId: () => {},
      refreshProperties: async () => {},
      isAddPropertyOpen: false,
      setIsAddPropertyOpen: () => {},
      editingProperty: null,
      setEditingProperty: () => {},
    };
  }
  return ctx;
};
