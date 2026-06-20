import React, { useState } from 'react';
import { X, User, CreditCard, DollarSign, Calendar, Sliders, PenTool, Upload, Paperclip, FileText } from 'lucide-react';
import { Debtor } from '../types';
import { generateInitialSchedule } from '../utils/finance';
import SignaturePad from './SignaturePad';

interface AddDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (debtor: Debtor) => void;
  defaultCreditorName: string;
}

export default function AddDebtorModal({
  isOpen,
  onClose,
  onAdd,
  defaultCreditorName,
}: AddDebtorModalProps) {
  const [name, setName] = useState('');
  const [civilId, setCivilId] = useState('');
  const [creditorName, setCreditorName] = useState(defaultCreditorName || 'الكعبي');
  const [originalAmount, setOriginalAmount] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('12');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState<number>(new Date().getDate());
  const [signatureData, setSignatureData] = useState('');
  const [civilIdImage, setCivilIdImage] = useState('');
  const [writtenContractImage, setWrittenContractImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Sourced from localStorage or seeded default names for simple user experience
  const [savedDebtorNames, setSavedDebtorNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('kaabi_money_saved_debtors_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const defaults = ["محمد بن عبد الله الكعبي", "أحمد المطيري", "عبد الرحمن العتيبي"];
    localStorage.setItem('kaabi_money_saved_debtors_list', JSON.stringify(defaults));
    return defaults;
  });

  const [savedCreditorNames, setSavedCreditorNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('kaabi_money_saved_creditors_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const defaults = ["الكعبي للتمويل الأهلي", "شركة الكعبي للالتحاق المالي", "مؤسسة الكعبي المعتمدة"];
    localStorage.setItem('kaabi_money_saved_creditors_list', JSON.stringify(defaults));
    return defaults;
  });

  const handleSaveCurrentDebtorName = () => {
    const cleaned = name.trim();
    if (!cleaned) return;
    if (!savedDebtorNames.includes(cleaned)) {
      const updated = [...savedDebtorNames, cleaned];
      setSavedDebtorNames(updated);
      localStorage.setItem('kaabi_money_saved_debtors_list', JSON.stringify(updated));
    }
  };

  const handleDeleteSavedDebtorName = (nameToRemove: string) => {
    const updated = savedDebtorNames.filter(n => n !== nameToRemove);
    setSavedDebtorNames(updated);
    localStorage.setItem('kaabi_money_saved_debtors_list', JSON.stringify(updated));
    if (name === nameToRemove) {
      setName('');
    }
  };

  const handleSaveCurrentCreditorName = () => {
    const cleaned = creditorName.trim();
    if (!cleaned) return;
    if (!savedCreditorNames.includes(cleaned)) {
      const updated = [...savedCreditorNames, cleaned];
      setSavedCreditorNames(updated);
      localStorage.setItem('kaabi_money_saved_creditors_list', JSON.stringify(updated));
    }
  };

  const handleDeleteSavedCreditorName = (creditorToRemove: string) => {
    const updated = savedCreditorNames.filter(n => n !== creditorToRemove);
    setSavedCreditorNames(updated);
    localStorage.setItem('kaabi_money_saved_creditors_list', JSON.stringify(updated));
    if (creditorName === creditorToRemove) {
      setCreditorName('');
    }
  };

  if (!isOpen) return null;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'civil' | 'contract' | 'extra'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً. يرجى اختيار صوره أقل من ٢ ميجابايت للحفاظ على كفاءة تخزين المتصفح.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'civil') {
        setCivilIdImage(base64);
      } else if (type === 'contract') {
        setWrittenContractImage(base64);
      } else if (type === 'extra') {
        setAdditionalImages((prev) => [...prev, base64]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name.trim()) {
      setError('يرجى إدخال اسم المدين');
      return;
    }
    if (!civilId.trim()) {
      setError('يرجى إدخال الرقم المدني للمدين');
      return;
    }
    if (civilId.trim().length < 8) {
      setError('الرقم المدني يجب أن يكون ٨ أرقام على الأقل');
      return;
    }
    if (!creditorName.trim()) {
      setError('يرجى إدخال اسم الدائن (معطي الأموال)');
      return;
    }
    
    const amountNum = parseFloat(originalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('يرجى إدخال مبلغ دين أساسي صحيح أكبر من الصفر');
      return;
    }

    const monthsNum = parseInt(installmentsCount);
    if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 120) {
      setError('يرجى تحديد عدد دفعات (أشهر) صحيح بين ١ و١٢٠ شهراً');
      return;
    }

    // Generate scheduled installments with custom monthly due day
    const installments = generateInitialSchedule(amountNum, monthsNum, startDate, dueDay);

    const newDebtor: Debtor = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      civilId: civilId.trim(),
      creditorName: creditorName.trim(),
      originalAmount: amountNum,
      installmentsCount: monthsNum,
      startDate,
      dueDay,
      installments,
      payments: [],
      signatureData: signatureData || undefined,
      civilIdImage: civilIdImage || undefined,
      writtenContractImage: writtenContractImage || undefined,
      additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Auto save to locally saved suggestion list
    const cleanName = name.trim();
    if (!savedDebtorNames.includes(cleanName)) {
      const updatedD = [...savedDebtorNames, cleanName];
      setSavedDebtorNames(updatedD);
      localStorage.setItem('kaabi_money_saved_debtors_list', JSON.stringify(updatedD));
    }

    const cleanCreditor = creditorName.trim();
    if (!savedCreditorNames.includes(cleanCreditor)) {
      const updatedC = [...savedCreditorNames, cleanCreditor];
      setSavedCreditorNames(updatedC);
      localStorage.setItem('kaabi_money_saved_creditors_list', JSON.stringify(updatedC));
    }

    onAdd(newDebtor);
    
    // Reset form
    setName('');
    setCivilId('');
    setOriginalAmount('');
    setInstallmentsCount('12');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDay(new Date().getDate());
    setSignatureData('');
    setCivilIdImage('');
    setWrittenContractImage('');
    setAdditionalImages([]);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-850">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
              إضافة مدين جديد وتوثيق مديونية
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 font-sans">
              قم بإدخال بيانات المستلم وتفاصيل جدول الدفعات والضمانات
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 dark:text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(100vh-10rem)] space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold text-right font-sans">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Debtor Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans flex justify-between items-center">
                <span>اسم الشخص المدين (المستلم للحق) *</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-md">أسماء مسجلة مسبقاً</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد بن عبد الله الكعبي"
                  className="w-full pl-22 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentDebtorName}
                  disabled={!name.trim() || savedDebtorNames.includes(name.trim())}
                  className="absolute inset-y-1.5 left-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 text-white rounded-lg text-[9px] font-black transition-all cursor-pointer"
                  title="حفظ هذا الاسم في القائمة للاختيار سريعاً لاحقاً"
                >
                  حفظ بالقائمة
                </button>
              </div>

              {/* Saved debtor list rendering */}
              {savedDebtorNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-150/40 dark:border-slate-850/40">
                  {savedDebtorNames.map((savedName) => (
                    <span
                      key={savedName}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        name === savedName
                          ? 'bg-emerald-600 text-white font-extrabold shadow-xs shadow-emerald-500/10'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="cursor-pointer" onClick={() => setName(savedName)}>{savedName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedDebtorName(savedName);
                        }}
                        className="p-0.5 hover:bg-rose-100 hover:text-rose-600 rounded-md text-slate-400 dark:text-slate-500 hover:dark:bg-rose-950/30 transition-all font-black cursor-pointer"
                        title="حذف الاسم من القائمة"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Civil ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans">
                الرقم المدني *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value.replace(/\D/g, ''))}
                  placeholder="10234567"
                  maxLength={12}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Creditor Name (معطي الأموال) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans flex justify-between items-center">
                <span>اسم معطي الأموال (الدائن) *</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-md">مصادر جهات دائنة</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-emerald-500/70" />
                </div>
                <input
                  type="text"
                  required
                  value={creditorName}
                  onChange={(e) => setCreditorName(e.target.value)}
                  placeholder="الكعبي للتمويل"
                  className="w-full pl-22 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentCreditorName}
                  disabled={!creditorName.trim() || savedCreditorNames.includes(creditorName.trim())}
                  className="absolute inset-y-1.5 left-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 text-white rounded-lg text-[9px] font-black transition-all cursor-pointer"
                  title="حفظ هذه الجهة في القائمة للاختيار سريعاً لاحقاً"
                >
                  حفظ بالقائمة
                </button>
              </div>

              {/* Saved creditors list rendering */}
              {savedCreditorNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-150/40 dark:border-slate-850/40">
                  {savedCreditorNames.map((savedCred) => (
                    <span
                      key={savedCred}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        creditorName === savedCred
                          ? 'bg-emerald-600 text-white font-extrabold shadow-xs shadow-emerald-500/10'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="cursor-pointer" onClick={() => setCreditorName(savedCred)}>{savedCred}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedCreditorName(savedCred);
                        }}
                        className="p-0.5 hover:bg-rose-100 hover:text-rose-600 rounded-md text-slate-400 dark:text-slate-500 hover:dark:bg-rose-950/30 transition-all font-black cursor-pointer"
                        title="حذف الجهة من القائمة"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Original Debt Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans">
                مبلغ الدين الأساسي *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.1"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  placeholder="1200.00"
                  className="w-full pl-12 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                  dir="ltr"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs font-bold select-none font-sans">
                  د.ك
                </div>
              </div>
            </div>

            {/* Installments count / Number of months */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans">
                جدولة الدفعات (كم شهر سيسدد؟) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <select
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                >
                  <option value="1">شهر واحد (دفعة واحدة)</option>
                  <option value="3">٣ أشهر (٣ دفعات)</option>
                  <option value="6">٦ أشهر (٦ دفعات)</option>
                  <option value="12">١٢ شهراً (سنة واحدة)</option>
                  <option value="18">١٨ شهراً (سنة ونصف)</option>
                  <option value="24">٢٤ شهراً (سنتين)</option>
                  <option value="36">٣٦ شهراً (٣ سنوات)</option>
                  <option value="48">٤٨ شهراً (٤ سنوات)</option>
                  <option value="60">٦٠ شهراً (٥ سنوات)</option>
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans">
                تاريخ أول دفعة استحقاق *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (val) {
                      setDueDay(new Date(val).getDate());
                    }
                  }}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                />
              </div>
            </div>

            {/* Preferred Monthly Due Day */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans flex justify-between items-center">
                <span>يوم الاستحقاق الشهري المفضل *</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-md font-mono">اليوم: {dueDay}</span>
              </label>
              <div>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      يوم {day} من كل شهر
                    </option>
                  ))}
                </select>

                {/* Quick selection chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[1, 5, 10, 15, 20, 25, 30].map((dayValue) => (
                    <button
                      key={dayValue}
                      type="button"
                      onClick={() => setDueDay(dayValue)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        dueDay === dayValue
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {dayValue}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Quick Schedule Preview Box */}
          {parseFloat(originalAmount) > 0 && parseInt(installmentsCount) > 0 && (
            <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl text-slate-700 dark:text-slate-300 space-y-1 font-sans">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block pb-1">معاينة الجدولة الآلية:</span>
              <p className="text-[11px] leading-relaxed">
                سيقوم النظام بتقسيم مبلغ <span className="font-bold underline text-emerald-600">{(parseFloat(originalAmount)).toFixed(2)} د.ك</span> على <span className="font-bold">{installmentsCount} دفعات شهرياً</span>.
              </p>
              <p className="text-[11px] font-medium">
                متوسط القسط الشهري الثابت: <span className="font-black text-rose-600 dark:text-rose-400 font-mono">{(parseFloat(originalAmount) / parseInt(installmentsCount)).toFixed(2)} د.ك</span> ابتداءً من تاريخ <span className="font-mono">{startDate}</span>.
              </p>
            </div>
          )}

          {/* Document Upload section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans flex items-center gap-1.5 mb-2">
              <Paperclip className="w-4 h-4 text-emerald-600" />
              المستندات والصور المرفقة للدين
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Civil ID Attachment */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">
                  نسخة البطاقة المدنية للمدين
                </label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-3 text-center transition-colors bg-slate-50 dark:bg-slate-950">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'civil')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {civilIdImage ? (
                    <div className="relative group/img">
                      <img
                        src={civilIdImage}
                        alt="البطاقة المدنية"
                        className="h-20 w-auto mx-auto object-cover rounded-md border border-slate-250 dark:border-slate-850"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCivilIdImage('');
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow-xs z-10 text-[10px]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1">
                      <Upload className="w-5 h-5 text-slate-450 dark:text-slate-600 mb-1" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">أرفق صورة البطاقة المدنية</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Written Debt Paper Attachment */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">
                  صورة ورقة الدين المكتوبة (سند الأمانة أو الإقرار)
                </label>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-3 text-center transition-colors bg-slate-50 dark:bg-slate-950">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'contract')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {writtenContractImage ? (
                    <div className="relative group/img">
                      <img
                        src={writtenContractImage}
                        alt="ورقة الدين"
                        className="h-20 w-auto mx-auto object-cover rounded-md border border-slate-250 dark:border-slate-850"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setWrittenContractImage('');
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow-xs z-10 text-[10px]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1">
                      <Upload className="w-5 h-5 text-slate-450 dark:text-slate-600 mb-1" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">أرفق صورة وصل/عقد الدين</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom/Extra Photos */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans">
                صور ومستندات إضافية (وصولات، مستندات داعمة أخرى)
              </label>
              <div className="flex flex-wrap gap-2.5 items-center">
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl px-4 py-3 text-center transition-colors bg-slate-50 dark:bg-slate-950 cursor-pointer flex items-center gap-2 h-12">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'extra')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 font-sans">إضافة صورة أخرى</span>
                </div>

                {additionalImages.map((img, idx) => (
                  <div key={idx} className="relative group/extra w-12 h-12 border border-slate-200 dark:border-slate-850 rounded-lg overflow-hidden">
                    <img src={img} alt="مرفق إضافي" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover/extra:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Debtor Profile Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1.5 font-sans flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                ملاحظات وحالة العميل (الملف الخاص بالمتدين)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اكتب هنا أي تفاصيل خاصة بالمدين، كحالة السداد، تواصل مسبق معه، أو شروط ثنائية متفق عليها..."
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* Signature Field */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-2 font-sans flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-emerald-600" />
              توقيع العميل المدين على السند (اختياري، يمكن توقيعه لاحقاً)
            </label>
            <SignaturePad
              onSave={(b64) => setSignatureData(b64)}
              onClear={() => setSignatureData('')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-550 dark:text-slate-450 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              أضف المدين واحسب الأقساط
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
