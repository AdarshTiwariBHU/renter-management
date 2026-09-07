'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, RefreshCw, Filter, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatCurrency } from '@/lib/calculations';

interface TransactionItem {
  _id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renterId: any;
  date: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  paymentMethod?: string;
  receiptNumber?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState({ totalDebits: 0, totalCredits: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url =
        typeFilter !== 'ALL'
          ? `/api/transactions?type=${typeFilter}`
          : '/api/transactions';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
        setSummary(json.summary || { totalDebits: 0, totalCredits: 0, count: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" /> Double-Entry Transaction Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Complete, immutable accounting journal of all debits (bills), credits (payments), and running balances.
            </p>
          </div>
        </div>

        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Debited (Bills Issued)
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {formatCurrency(summary.totalDebits)}
            </span>
            <span className="text-[11px] text-slate-400">Total rent & electricity charges</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Credited (Collections)
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {formatCurrency(summary.totalCredits)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Verified payments received</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Ledger Entries
            </span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {summary.count}
            </span>
            <span className="text-[11px] text-slate-400">Chronological transaction logs</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 text-xs font-semibold overflow-x-auto">
          <span className="text-slate-400 font-medium mr-2">Filter by Type:</span>
          {[
            { key: 'ALL', label: 'All Transactions' },
            { key: 'DEBIT_BILL', label: 'Bills (Debits)' },
            { key: 'CREDIT_PAYMENT', label: 'Payments (Credits)' },
            { key: 'SECURITY_DEPOSIT', label: 'Security Deposits' },
            { key: 'DEPOSIT_REFUND', label: 'Refunds' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                typeFilter === f.key
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> Loading transaction ledger...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">No transactions recorded.</div>
          ) : (
            <>
              {/* Mobile Card Layout (Visible on small screens) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx._id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{tx.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tx.renterId ? (
                            <Link
                              href={`/renters/${tx.renterId._id}`}
                              className="font-medium text-blue-600 text-xs hover:underline"
                            >
                              {tx.renterId.fullName}
                            </Link>
                          ) : (
                            <span className="text-slate-500 text-xs">Tenant</span>
                          )}
                          {tx.renterId?.roomNumber && (
                            <span className="font-semibold text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              Rm #{tx.renterId.roomNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {tx.credit > 0 && (
                          <span className="font-bold text-emerald-600 text-base block font-mono">
                            +{formatCurrency(tx.credit)}
                          </span>
                        )}
                        {tx.debit > 0 && (
                          <span className="font-bold text-slate-900 text-base block font-mono">
                            {formatCurrency(tx.debit)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl p-2 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Running Balance
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatCurrency(tx.balanceAfter)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Method / Ref
                        </span>
                        <span className="font-medium text-slate-700">
                          {tx.paymentMethod || 'System'}
                          {tx.receiptNumber ? ` (${tx.receiptNumber})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Renter & Room</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Debit (Charge)</th>
                      <th className="py-3 px-4 text-right">Credit (Payment)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                      <th className="py-3 px-4">Method / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4">
                          {tx.renterId ? (
                            <div>
                              <Link
                                href={`/renters/${tx.renterId._id}`}
                                className="font-bold text-slate-900 hover:text-blue-600 transition"
                              >
                                {tx.renterId.fullName}
                              </Link>
                              <span className="text-[11px] text-slate-500 block">
                                Room #{tx.renterId.roomNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Renter</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">
                          {tx.description}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                          {tx.credit > 0 ? `+${formatCurrency(tx.credit)}` : '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(tx.balanceAfter)}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {tx.paymentMethod || '—'}
                          {tx.receiptNumber ? ` (${tx.receiptNumber})` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
