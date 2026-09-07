'use client';

import React from 'react';
import { PropertyProvider } from '@/context/PropertyContext';
import { AddPropertyModal } from '@/components/properties/AddPropertyModal';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PropertyProvider>
      {children}
      <AddPropertyModal />
    </PropertyProvider>
  );
}
