import React, { useState, useEffect } from 'react';
import { X, Coins, CheckCircle, HelpCircle, Calendar, Ban } from 'lucide-react';
import { Installment } from '../types';

interface CustomInstallmentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorName: string;
  installment: Installment;
  onSave: (
    installmentId: string,
    paidAmount: number,
    status: 'paid' | 'partial' | 'pending',
    paidDate?: string
  ) => void;
}

export default function CustomInstallmentPaymentModal({
  isOpen,
  onClose,
  debtorName,
  installment,
  onSave,
}: CustomInstallmentPaymentModalProps) {
  const [payType, setPayType] = useState<'paid' | 'partial' | 'pending'>('paid');
  const [customAmount, setCustomAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && installment) {
      setPayType(installment.status);
      setCustomAmount(installment.paidAmount > 0 ? installment.paidAmount.toString() : installment.amount.toString());
      setPayDate(installment.paidDate || new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, installment]);

  if (!isOpen || !installment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (payType === 'pending') {
      onSave(installment.id, 0, 'pending', undefined);
      onClose();
      return;
    }

    const amountNum = parseFloat(customAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من أو يساوي الصفر');
      return;
    }

    if (payType === 'paid') {
      onSave(installment.id, installment.amount, 'paid', payDate);
    } else {
      // Partial payment
      if (amountNum >= installment.amount) {
        onSave(installment.id, installment.amount, 'paid', payDate);
      } else if (amountNum === 0) {
        onSave(installment.id, 0, 'pending', undefined);
      } else {
        onSave(installment.id, amountNum, 'partial', payDate);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity" dir="rtl">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-850 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              تخصيص سداد القسط #{installment.index}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
              العميل: <span className="font-bold text-slate-800 dark:text-slate-200">{debtorName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold text-right font-sans">
              {error}
            </div>
          )}

          {/* Installment Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">قيمة القسط المطلوبة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{installment.amount.toFixed(2)} د.ك</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">تاريخ استحقاق القسط:</span>
              <span className="font-bold text-slate-600 dark:text-slate-400 font-mono">{installment.dueDate}</span>
            </div>
          </div>

          {/* Action types selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-slate-700 dark:text-slate-350 font-sans">
              حالة السداد التي ترغب في تطبيقها:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Option A: Paid full */}
              <button
                type="button"
                onClick={() => {
                  setPayType('paid');
                  setCustomAmount(installment.amount.toString());
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  payType === 'paid'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-black'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] font-sans">سداد بالكامل</span>
              </button>

              {/* Option B: Partial */}
              <button
                type="button"
                onClick={() => {
                  setPayType('partial');
                  setCustomAmount(
                    installment.paidAmount > 0
                      ? installment.paidAmount.toString()
                      : (installment.amount / 2).toString()
                  );
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  payType === 'partial'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-black'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <HelpCircle className="w-5 h-5 text-amber-550" />
                <span className="text-[10px] font-sans">سداد جزئي</span>
              </button>

              {/* Option C: Reset / Pending */}
              <button
                type="button"
                onClick={() => setPayType('pending')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  payType === 'pending'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 font-black'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Ban className="w-5 h-5 text-rose-600" />
                <span className="text-[10px] font-sans">غير مسدد</span>
              </button>
            </div>
          </div>

          {/* Conditional inputs based on type */}
          {payType === 'partial' && (
            <div className="space-y-1.5 pt-1 animate-in slide-in-from-top-1 duration-100">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 font-sans">
                أدخل المبلغ المسدد مخصصاً (د.ك):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={installment.amount}
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-left font-mono"
                  placeholder="0.00"
                  dir="ltr"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-[10px] text-slate-400 font-sans">
                  دينار كويتي
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-normal">
                * يجب أن يكون المبلغ المدفوع كقسط جزئي أقل من قيمة القسط الأصلي بالكامل ({installment.amount.toFixed(2)} د.ك).
              </p>
            </div>
          )}

          {payType !== 'pending' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-100">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-350 font-sans">
                تاريخ الاستلام السداد:
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden text-right"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              إلغاء وتجاهل
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs"
            >
              حفظ وتطبيق الخصم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
