import React from 'react';
import { Landmark, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Debtor } from '../types';
import { getPaidTotal, getRemainingTotal } from '../utils/finance';

interface DashboardStatsProps {
  debtors: Debtor[];
}

export default function DashboardStats({ debtors }: DashboardStatsProps) {
  const totalLent = debtors.reduce((acc, d) => acc + d.originalAmount, 0);
  const totalPaid = debtors.reduce((acc, d) => acc + getPaidTotal(d), 0);
  const totalRemaining = debtors.reduce((acc, d) => acc + getRemainingTotal(d), 0);
  const activeDebtorsCount = debtors.filter(d => getRemainingTotal(d) > 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
      {/* Total Lent */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-transform hover:-translate-y-0.5">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center translate-x-2 -translate-y-2 opacity-60">
          <Landmark className="w-12 h-12 text-emerald-500/20" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
            إجمالي الديون الصادرة
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalLent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">د.ك</span>
        </div>
      </div>

      {/* Recovered */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-transform hover:-translate-y-0.5">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-50 dark:bg-teal-950/20 rounded-full flex items-center justify-center translate-x-2 -translate-y-2 opacity-60">
          <ArrowUpRight className="w-12 h-12 text-teal-500/20" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
            إجمالي المبالغ المستردة
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">د.ك</span>
        </div>
      </div>

      {/* Remaining */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-transform hover:-translate-y-0.5">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center translate-x-2 -translate-y-2 opacity-60">
          <AlertCircle className="w-12 h-12 text-amber-500/20" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
            إجمالي المبلغ المتبقي
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">د.ك</span>
        </div>
      </div>

      {/* Active Debtors */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-xs transition-transform hover:-translate-y-0.5">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/20 rounded-full flex items-center justify-center translate-x-2 -translate-y-2 opacity-60">
          <CheckCircle2 className="w-12 h-12 text-indigo-500/20" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
            المدينين النشطين
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {activeDebtorsCount}
          </span>
          <span className="text-xs text-slate-550 dark:text-slate-400 font-medium mr-1 font-sans">أشخاص</span>
        </div>
      </div>
    </div>
  );
}
