'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Receipt,
  Zap,
  Clock,
  DoorOpen,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';
import { usePropertyContext } from '@/context/PropertyContext';
import { Building2 } from 'lucide-react';

export default function ReportsPage() {
  const { properties, selectedPropertyId, selectedProperty, setSelectedPropertyId } = usePropertyContext();
  const [reportType, setReportType] = useState<
    'collection' | 'electricity' | 'pending' | 'occupancy'
  >('collection');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('2026-09');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('type', reportType);
      if (month && month !== 'ALL') params.set('month', month);
      if (selectedPropertyId && selectedPropertyId !== 'ALL') {
        params.set('propertyId', selectedPropertyId);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, month, selectedPropertyId]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'collection' && Array.isArray(data)) {
      csvContent += 'Month,Total Rent,Total Electricity,Other Charges,Total Billed,Total Collected,Total Pending\n';
      data.forEach((row: any) => {
        csvContent += `${row.month},${row.totalRent},${row.totalElectricity},${row.totalOther},${row.totalBilled},${row.totalCollected},${row.totalPending}\n`;
      });
    } else if (reportType === 'electricity' && Array.isArray(data)) {
      csvContent += 'Renter,Room,Meter,Month,Previous,Current,Units,Rate,Amount\n';
      data.forEach((row: any) => {
        csvContent += `"${row.renterName}",${row.roomNumber},"${row.meterName}",${row.month},${row.previousReading},${row.currentReading},${row.unitsConsumed},${row.ratePerUnit},${row.electricityAmount}\n`;
      });
    } else if (reportType === 'pending' && Array.isArray(data)) {
      csvContent += 'Renter,Room,Mobile,Month,Total Payable,Paid,Balance Due,Due Date,Days Overdue\n';
      data.forEach((row: any) => {
        csvContent += `"${row.renterName}",${row.roomNumber},${row.mobile},${row.billingMonth},${row.totalPayable},${row.paidAmount},${row.balance},${row.dueDate},${row.daysOverdue}\n`;
      });
    } else if (reportType === 'occupancy') {
      csvContent += 'Metric,Value\n';
      csvContent += `Active Renters,${data.activeRenters}\n`;
      csvContent += `Vacated Renters,${data.vacatedRenters}\n`;
      csvContent += `Total Rooms,${data.totalRooms}\n`;
      csvContent += `Occupied Rooms,${data.occupiedRooms}\n`;
      csvContent += `Vacant Rooms,${data.vacantRooms}\n`;
      csvContent += `Occupancy Rate,${data.occupancyRate}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" /> Financial & Occupancy Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Comprehensive analytics on rent collections, electricity consumption, arrears, and occupancy.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition active:scale-95"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'collection', label: 'Monthly Collection', icon: Receipt, desc: 'Billed vs Collected revenue' },
            { key: 'electricity', label: 'Electricity Consumption', icon: Zap, desc: 'Meter units & costs' },
            { key: 'pending', label: 'Pending & Overdue', icon: Clock, desc: 'Outstanding rent arrears' },
            { key: 'occupancy', label: 'Room Occupancy', icon: DoorOpen, desc: 'Unit utilization rate' },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = reportType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setReportType(t.key as any)}
                className={`p-4 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{t.label}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Report Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Controls Bar: Property & Month selector */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Property Selector (Section 12.14) */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-slate-500 font-semibold">Property:</span>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Properties</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month selector for applicable reports */}
              {reportType !== 'occupancy' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-semibold">Period:</span>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
                  />
                  <button
                    onClick={() => setMonth('ALL')}
                    className={`px-2.5 py-1.5 rounded-lg border transition ${
                      month === 'ALL'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All Months
                  </button>
                </div>
              )}
            </div>

            {selectedProperty && (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 self-start sm:self-auto">
                Scope: {selectedProperty.name} ({selectedProperty.city})
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> Generating report...
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400 text-xs">No data available.</div>
          ) : (
            <div>
              {/* 1. Monthly Collection Report */}
              {reportType === 'collection' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Billing Month</th>
                        <th className="py-3 px-4">Total Rent</th>
                        <th className="py-3 px-4">Total Electricity</th>
                        <th className="py-3 px-4">Other Charges</th>
                        <th className="py-3 px-4">Total Invoiced</th>
                        <th className="py-3 px-4">Total Collected</th>
                        <th className="py-3 px-4">Total Pending</th>
                        <th className="py-3 px-4 text-right">Bills Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row: any) => (
                        <tr key={row.month} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {formatMonthYear(row.month)}
                          </td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(row.totalRent)}</td>
                          <td className="py-3 px-4 font-semibold text-amber-700">
                            {formatCurrency(row.totalElectricity)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatCurrency(row.totalOther)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {formatCurrency(row.totalBilled)}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            {formatCurrency(row.totalCollected)}
                          </td>
                          <td className="py-3 px-4 font-bold text-rose-600">
                            {formatCurrency(row.totalPending)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-600">
                            {row.billCount} bills
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. Electricity Usage Report */}
              {reportType === 'electricity' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Renter</th>
                        <th className="py-3 px-4">Room</th>
                        <th className="py-3 px-4">Meter Name</th>
                        <th className="py-3 px-4">Month</th>
                        <th className="py-3 px-4 font-mono">Previous</th>
                        <th className="py-3 px-4 font-mono">Current</th>
                        <th className="py-3 px-4">Units Consumed</th>
                        <th className="py-3 px-4">Rate</th>
                        <th className="py-3 px-4 text-right">Electricity Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((r: any) => (
                        <tr key={r._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{r.renterName}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">Room #{r.roomNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{r.meterName}</td>
                          <td className="py-3 px-4 font-medium">{formatMonthYear(r.month)}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{r.previousReading}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.currentReading}</td>
                          <td className="py-3 px-4 font-bold text-blue-700">{r.unitsConsumed} Units</td>
                          <td className="py-3 px-4 text-slate-600">₹{r.ratePerUnit}/unit</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700 text-sm">
                            {formatCurrency(r.electricityAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Pending Payment Report */}
              {reportType === 'pending' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Renter</th>
                        <th className="py-3 px-4">Room</th>
                        <th className="py-3 px-4">Mobile</th>
                        <th className="py-3 px-4">Billing Month</th>
                        <th className="py-3 px-4">Total Payable</th>
                        <th className="py-3 px-4">Amount Paid</th>
                        <th className="py-3 px-4">Balance Due</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-right">Overdue Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((p: any) => (
                        <tr key={p._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.renterName}</td>
                          <td className="py-3 px-4 font-medium">Room #{p.roomNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{p.mobile}</td>
                          <td className="py-3 px-4 font-semibold">{formatMonthYear(p.billingMonth)}</td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(p.totalPayable)}</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(p.paidAmount)}</td>
                          <td className="py-3 px-4 font-bold text-rose-600 text-sm">
                            {formatCurrency(p.balance)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(p.dueDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.daysOverdue > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                {p.daysOverdue} Days Overdue
                              </span>
                            ) : (
                              <span className="text-slate-400">Due Today</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. Occupancy Report */}
              {reportType === 'occupancy' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                        Occupancy Rate
                      </span>
                      <span className="text-3xl font-bold text-indigo-700 mt-1 block">
                        {data.occupancyRate}%
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {data.occupiedRooms} of {data.totalRooms} rooms occupied
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                        Active Renters
                      </span>
                      <span className="text-3xl font-bold text-slate-900 mt-1 block">
                        {data.activeRenters}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium">Currently residing</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                        Vacant Rooms
                      </span>
                      <span className="text-3xl font-bold text-teal-700 mt-1 block">
                        {data.vacantRooms}
                      </span>
                      <span className="text-[11px] text-teal-600 font-medium">Ready for allotment</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
