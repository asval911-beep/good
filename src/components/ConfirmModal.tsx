import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: 'confirm' | 'alert';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'تأكيد العمل',
  cancelText = 'تراجع',
  isDestructive = false,
  type = 'confirm',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity" dir="rtl">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-850 p-6 space-y-4">
        
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${
            isDestructive 
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450'
          }`}>
            {isDestructive ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          
          <div className="space-y-1.5 flex-1 text-right">
            <h3 className="text-base font-black text-slate-950 dark:text-white font-sans">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              {description}
            </p>
          </div>
        </div>

        {/* Action button rows */}
        <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 dark:border-slate-800 font-sans">
          {type === 'confirm' && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-550 dark:text-slate-450 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-white text-xs font-black rounded-xl transition-colors cursor-pointer shadow-xs ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
