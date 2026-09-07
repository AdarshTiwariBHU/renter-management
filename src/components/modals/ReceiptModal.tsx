'use client';

import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatMonthYear } from '@/lib/calculations';

export interface ReceiptData {
  receiptNumber: string;
  propertyName?: string;
  propertyAddress?: string;
  propertyPhone?: string;
  renterName: string;
  roomNumber: string;
  mobile?: string;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number;
  otherCharges?: number;
  previousDue?: number;
  totalPayable: number;
  paidAmount: number;
  remainingBalance: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
  receivedBy?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col receipt-container">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Receipt Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 text-slate-800 bg-white overflow-y-auto flex-1" id="printable-receipt">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.propertyName || 'KirayaPro'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {data.propertyAddress || 'Plot 42, Silicon Enclave, Tech Zone 4'}
              </p>
              <p className="text-xs text-slate-500">Contact: {data.propertyPhone || '+91 98765 43210'}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                Official Receipt
              </span>
              <p className="text-xs font-mono font-semibold text-slate-700 mt-2">
                #{data.receiptNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: {new Date(data.paymentDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Renter & Room Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Issued To
              </span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{data.renterName}</p>
              <p className="text-slate-600 mt-0.5">Mobile: {data.mobile || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Premises & Period
              </span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">Room #{data.roomNumber}</p>
              <p className="text-slate-600 mt-0.5">
                Month: <span className="font-semibold">{formatMonthYear(data.billingMonth)}</span>
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-700">Monthly Room Rent</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(data.rentAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-700">Electricity Charges</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(data.electricityAmount)}
                  </td>
                </tr>
                {data.otherCharges ? (
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">Maintenance & Other Charges</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(data.otherCharges)}
                    </td>
                  </tr>
                ) : null}
                {data.previousDue ? (
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">Previous Arrears / Due</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(data.previousDue)}
                    </td>
                  </tr>
                ) : null}
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <td className="py-2.5 px-4">Total Payable</td>
                  <td className="py-2.5 px-4 text-right">{formatCurrency(data.totalPayable)}</td>
                </tr>
                <tr className="bg-emerald-50/70 text-emerald-900 font-bold">
                  <td className="py-2.5 px-4 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Amount Received
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-700">
                    {formatCurrency(data.paidAmount)}
                  </td>
                </tr>
                <tr className="bg-white font-semibold text-slate-700">
                  <td className="py-2 px-4">Remaining Balance</td>
                  <td className="py-2 px-4 text-right text-rose-600">
                    {formatCurrency(data.remainingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-1">
              <p className="text-slate-500">
                <span className="font-semibold text-slate-700">Payment Mode:</span> {data.paymentMethod}
              </p>
              {data.transactionReference && (
                <p className="text-slate-500 font-mono text-[11px]">
                  <span className="font-semibold text-slate-700 font-sans">Txn Ref:</span> {data.transactionReference}
                </p>
              )}
              {data.notes && (
                <p className="text-slate-500 italic">
                  <span className="font-semibold text-slate-700 not-italic">Notes:</span> {data.notes}
                </p>
              )}
            </div>

            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Authorized Signature
              </p>
              <p className="text-xs font-medium text-slate-800">{data.receivedBy || 'Property Manager'}</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-200 pt-3 text-center">
            <p className="text-[10px] text-slate-400">
              This is a computer-generated receipt issued by KirayaPro Tenancy Management System.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
