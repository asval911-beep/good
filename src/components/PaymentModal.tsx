import React, { useState, useEffect } from 'react';
import { X, Coins, Check, HelpCircle, Sliders, CalendarClock, History } from 'lucide-react';
import { Debtor, PaymentRecord, Installment } from '../types';
import { getRemainingTotal, simulatePayment, getPaidTotal } from '../utils/finance';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtor: Debtor;
  onApplyPayment: (
    debtorId: string,
    amount: number,
    reductionType: 'reduce_monthly' | 'reduce_duration',
    recalculatedSchedule: Installment[]
  ) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  debtor,
  onApplyPayment,
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<'reduce_monthly' | 'reduce_duration'>('reduce_duration');
  const [error, setError] = useState('');
  
  // Simulations state
  const [simulation, setSimulation] = useState<{
    reduceMonthlySchedule: Installment[];
    reduceDurationSchedule: Installment[];
  } | null>(null);

  const remainingDebt = getRemainingTotal(debtor);

  // Auto pre-fill the next unpaid installment amount or remaining
  useEffect(() => {
    if (isOpen && debtor) {
      const nextUnpaid = debtor.installments.find(inst => inst.status !== 'paid');
      if (nextUnpaid) {
        // Pre-fill next unpaid amount
        setPaymentAmount(nextUnpaid.amount.toString());
      } else {
        setPaymentAmount('');
      }
      setSelectedOption('reduce_duration');
      setError('');
    }
  }, [isOpen, debtor]);

  // Run live simulation on paymentAmount change
  useEffect(() => {
    const amountNum = parseFloat(paymentAmount);
    if (!isNaN(amountNum) && amountNum > 0 && amountNum <= remainingDebt) {
      try {
        const sims = simulatePayment(debtor, amountNum);
        setSimulation(sims);
      } catch (e) {
        setSimulation(null);
      }
    } else {
      setSimulation(null);
    }
  }, [paymentAmount, debtor, remainingDebt]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('يرجى إدخال مبلغ دفع صحيح أكبر من الصفر');
      return;
    }

    if (amountNum > remainingDebt) {
      setError(`المبلغ المدخل (${amountNum.toFixed(2)} د.ك) أكبر من إجمالي الدين المتبقي (${remainingDebt.toFixed(2)} د.ك)`);
      return;
    }

    // Get the correct simulated schedule based on selection
    if (!simulation) {
      setError('خطأ في حساب محاكاة السداد');
      return;
    }

    const correctedSchedule =
      selectedOption === 'reduce_monthly'
        ? simulation.reduceMonthlySchedule
        : simulation.reduceDurationSchedule;

    onApplyPayment(debtor.id, amountNum, selectedOption, correctedSchedule);
    setPaymentAmount('');
    onClose();
  };

  // Safe variables for simulation outcomes
  const currentAmountNum = parseFloat(paymentAmount) || 0;
  
  // Find parameters for option 1
  const getSimulatedMonthlyAmount = () => {
    if (!simulation) return 0;
    const pending = simulation.reduceMonthlySchedule.filter(i => i.status !== 'paid');
    if (pending.length === 0) return 0;
    return pending[0].amount;
  };

  const getSimulatedRemainingInstallmentsCount = (type: 'reduce_monthly' | 'reduce_duration') => {
    if (!simulation) return 0;
    const targetSchedule = type === 'reduce_monthly' ? simulation.reduceMonthlySchedule : simulation.reduceDurationSchedule;
    return targetSchedule.filter(i => i.status !== 'paid').length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-850">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600 animate-bounce" />
              تسجيل عملية سداد للمدينة
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 font-sans">
              العميل: <span className="font-bold text-slate-800 dark:text-slate-200">{debtor.name}</span> | المتبقي الإجمالي: <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{remainingDebt.toFixed(2)} د.ك</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 dark:text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-955 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-450 text-xs font-semibold text-right font-sans">
              {error}
            </div>
          )}

          {/* Amount to pay input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans">
              اكتب المبلغ المراد سداده حالياً (د.ك) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                max={remainingDebt}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="200"
                className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-base font-black text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                dir="ltr"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs font-bold select-none font-sans">
                دينار كويتي
              </div>
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <button
                type="button"
                onClick={() => setPaymentAmount(remainingDebt.toFixed(2))}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold font-sans cursor-pointer"
              >
                سداد كامل المديونية ({remainingDebt.toFixed(2)} د.ك)
              </button>
              
              {/* Show original normal payment as suggestion */}
              {debtor.installments.find(i => i.status !== 'paid') && (
                <button
                  type="button"
                  onClick={() => {
                    const originalNext = debtor.installments.find(i => i.status !== 'paid')?.amount || 0;
                    setPaymentAmount(originalNext.toFixed(2));
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold font-sans cursor-pointer"
                >
                  سداد قسط هذا الشهر الزمني الطبيعي
                </button>
              )}
            </div>
          </div>

          {/* Option Restructuring Cards (Active if amount entered is valid) */}
          {currentAmountNum > 0 && simulation && (
            <div className="space-y-3.5 pt-2">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-350 font-sans flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                كيف تود جدولة المبلغ المتبقي بعد الخصم؟
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* OPTION A: Reduce future monthly amount */}
                <div
                  onClick={() => setSelectedOption('reduce_monthly')}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedOption === 'reduce_monthly'
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/[0.02]'
                      : 'border-slate-150 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-1 rounded-full ${
                      selectedOption === 'reduce_monthly' ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        تخفيض القسط الشهري
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans leading-relaxed">
                        اخفض القسط الشهري القادم مع الإبقاء على نفس عدد الأشهر وجدولة الدفعات الحالية.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-550 dark:text-slate-400">القسط الشهري الجديد:</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {getSimulatedMonthlyAmount().toFixed(2)} د.ك
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-550 dark:text-slate-400">عدد الأقساط المتبقية للوفاء:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-350 font-mono">
                        {getSimulatedRemainingInstallmentsCount('reduce_monthly')} دفعات
                      </span>
                    </div>
                  </div>
                </div>

                {/* OPTION B: Reduce total duration (keep constant monthly payment) */}
                <div
                  onClick={() => setSelectedOption('reduce_duration')}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedOption === 'reduce_duration'
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/[0.02]'
                      : 'border-slate-150 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-1 rounded-full ${
                      selectedOption === 'reduce_duration' ? 'bg-emerald-500 text-white' : 'border border-slate-350 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4 text-indigo-600" />
                        الاستمرار بالقسط الطبيعي
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans leading-relaxed">
                        استمر بسداد المفع والخصم بقيمتها الطبيعية الحالية، وخصم فائض المدفوعات من الدفعات الأخيرة لإنهائها باكراً.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-550 dark:text-slate-400">القسط الشهري كالمعتاد:</span>
                      <span className="font-extrabold text-teal-650 dark:text-teal-400 font-mono">
                        {(debtor.installments.find(i => i.status !== 'paid')?.amount || 0).toFixed(2)} د.ك
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-550 dark:text-slate-400">عدد الدفعات المتبقية:</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                        {getSimulatedRemainingInstallmentsCount('reduce_duration')} دفعات
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-3 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 rounded-xl text-[11px] text-slate-650 dark:text-slate-450 leading-relaxed font-sans">
            * عند تسجيل هذا السداد الاستثنائي، سيقوم النظام تلقائيًا بوضع علامة "مسدد" على الدفعات المغطاة اليوم، وتحديث مواعيد وجداول الأقساط القادمة على الفور وبدقة تامة. يمكنك طباعة وتوثيق التغيير عبر توليد صورة السند الجديد.
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-550 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={currentAmountNum <= 0 || !simulation}
              className={`px-6 py-2.5 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs leading-none ${
                currentAmountNum > 0 && simulation
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 pointer-events-none'
              }`}
            >
              اعتماد السداد وإعادة الجدولة الآلية
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
