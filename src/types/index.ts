export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardSummary {
  totalRenters: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  paidThisMonth: number;
  pendingAmount: number;
  overdueRenters: number;
  electricityCollection: number;
}

export interface RenterListItem {
  _id: string;
  fullName: string;
  photoUrl?: string;
  roomNumber: string;
  mobile: string;
  monthlyRent: number;
  currentElectricity: number;
  totalDue: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';
  daysOverdue: number;
  lastMeterReading: number;
  status: 'ACTIVE' | 'VACATED';
  metersCount: number;
}

export interface MeterOption {
  _id: string;
  renterId: string;
  renterName: string;
  roomNumber: string;
  meterName: string;
  startingReading: number;
  currentReading: number;
  ratePerUnit: number;
}

export interface QuickReadingPayload {
  renterId: string;
  meterId: string;
  billingMonth: string;
  previousReading: number;
  currentReading: number;
  ratePerUnit: number;
  notes?: string;
}

export interface RecordPaymentPayload {
  renterId: string;
  billId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  transactionReference?: string;
  notes?: string;
}
