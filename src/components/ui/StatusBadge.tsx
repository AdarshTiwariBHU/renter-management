import React from 'react';

interface StatusBadgeProps {
  status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'ACTIVE' | 'VACATED' | 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | string;
  daysOverdue?: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, daysOverdue, className = '' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    case 'PAID':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Paid';
      break;
    case 'PARTIALLY_PAID':
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Partially Paid';
      break;
    case 'PENDING':
      colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Pending';
      break;
    case 'OVERDUE':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
      label = daysOverdue ? `${daysOverdue}d Overdue` : 'Overdue';
      break;
    case 'ACTIVE':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Active';
      break;
    case 'VACATED':
      colorStyles = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Vacated';
      break;
    case 'VACANT':
      colorStyles = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'Vacant';
      break;
    case 'OCCUPIED':
      colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Occupied';
      break;
    case 'MAINTENANCE':
      colorStyles = 'bg-orange-50 text-orange-700 border-orange-200';
      label = 'Maintenance';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'PAID' || status === 'ACTIVE'
            ? 'bg-emerald-500'
            : status === 'PARTIALLY_PAID'
            ? 'bg-amber-500'
            : status === 'OVERDUE'
            ? 'bg-rose-500'
            : status === 'OCCUPIED'
            ? 'bg-indigo-500'
            : 'bg-slate-400'
        }`}
      />
      {label}
    </span>
  );
};
