export interface ElectricityCalculation {
  unitsConsumed: number;
  electricityAmount: number;
}

export function calculateElectricity(
  previousReading: number,
  currentReading: number,
  ratePerUnit: number
): ElectricityCalculation {
  if (currentReading < previousReading) {
    throw new Error('Current meter reading cannot be lower than the previous reading.');
  }

  const unitsConsumed = Math.max(0, currentReading - previousReading);
  const electricityAmount = Math.round(unitsConsumed * ratePerUnit * 100) / 100;

  return {
    unitsConsumed,
    electricityAmount,
  };
}

export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE';

export function determinePaymentStatus(
  balance: number,
  totalPaid: number,
  dueDate: Date | string
): PaymentStatus {
  if (balance <= 0) {
    return 'PAID';
  }

  const due = new Date(dueDate);
  const today = new Date();
  // Strip time for clean day comparison
  due.setHours(23, 59, 59, 999);

  if (totalPaid > 0) {
    return 'PARTIALLY_PAID';
  }

  if (today > due) {
    return 'OVERDUE';
  }

  return 'PENDING';
}

export function calculateOverdueDays(dueDate: Date | string, balance: number): number {
  if (balance <= 0) return 0;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  if (diffTime <= 0) return 0;

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateBill(
  rentAmount: number,
  electricityAmount: number = 0,
  otherCharges: number = 0,
  previousOutstanding: number = 0,
  totalPaid: number = 0,
  dueDate: Date | string
) {
  const totalPayable = Math.round((rentAmount + electricityAmount + otherCharges + previousOutstanding) * 100) / 100;
  const balance = Math.max(0, Math.round((totalPayable - totalPaid) * 100) / 100);
  const status = determinePaymentStatus(balance, totalPaid, dueDate);

  return {
    totalPayable,
    balance,
    status,
    overdueDays: calculateOverdueDays(dueDate, balance),
  };
}

export function formatCurrency(amount: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskAadhaar(aadhaar?: string): string {
  if (!aadhaar) return '—';
  const clean = aadhaar.replace(/\s+/g, '');
  if (clean.length < 4) return clean;
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

export function formatMonthYear(monthStr: string): string {
  // Format "2026-09" to "September 2026"
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}
