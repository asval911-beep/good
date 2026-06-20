import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Trash2,
  FileText,
  DollarSign,
  User,
  CreditCard,
  Percent,
  Calendar,
  Layers,
  History,
  PenTool,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Download,
  Settings,
  X,
  Sparkles,
  RefreshCw,
  Upload,
  Calculator,
  Clock
} from 'lucide-react';
import { Debtor, Installment, PaymentRecord } from './types';
import { getPaidTotal, getRemainingTotal, generateInitialSchedule, simulatePayment, alignInstallmentDueDates, isDebtorOverdue } from './utils/finance';
import DashboardStats from './components/DashboardStats';
import AddDebtorModal from './components/AddDebtorModal';
import PaymentModal from './components/PaymentModal';
import BondReceipt from './components/BondReceipt';
import SignaturePad from './components/SignaturePad';
import AllDebtorsSummaries from './components/AllDebtorsSummaries';
import ConfirmModal from './components/ConfirmModal';
import InterestCalculator from './components/InterestCalculator';
import CustomInstallmentPaymentModal from './components/CustomInstallmentPaymentModal';

// Mock Seed Data for direct luxury showcase
const SEED_DEBTORS: Debtor[] = [
  {
    id: 'k-901',
    name: 'سلطان بن حميد الكعبي',
    civilId: '10984758',
    creditorName: 'شركة الكعبي للتمويل',
    originalAmount: 1200,
    installmentsCount: 12,
    startDate: '2026-01-01',
    createdAt: new Date().toISOString(),
    installments: [
      { id: 'inst1', index: 1, dueDate: '2026-01-01', amount: 100, paidAmount: 100, status: 'paid', paidDate: '2026-01-01' },
      { id: 'inst2', index: 2, dueDate: '2026-02-01', amount: 100, paidAmount: 100, status: 'paid', paidDate: '2026-02-01' },
      { id: 'inst3', index: 3, dueDate: '2026-03-01', amount: 100, paidAmount: 100, status: 'paid', paidDate: '2026-03-01' },
      { id: 'inst4', index: 4, dueDate: '2026-04-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst5', index: 5, dueDate: '2026-05-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst6', index: 6, dueDate: '2026-06-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst7', index: 7, dueDate: '2026-07-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst8', index: 8, dueDate: '2026-08-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst9', index: 9, dueDate: '2026-09-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst10', index: 10, dueDate: '2026-10-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst11', index: 11, dueDate: '2026-11-01', amount: 100, paidAmount: 0, status: 'pending' },
      { id: 'inst12', index: 12, dueDate: '2026-12-01', amount: 100, paidAmount: 0, status: 'pending' },
    ],
    payments: [
      { id: 'pay1', amount: 200, date: '2026-01-05', reductionType: 'reduce_duration', note: 'مقدم دفعة يناير وفبراير' },
      { id: 'pay2', amount: 100, date: '2026-03-01', reductionType: 'reduce_monthly', note: 'قسط مارس الملتزم به' },
    ],
  },
  {
    id: 'k-902',
    name: 'سالم بن ناصر الوهيبي',
    civilId: '12435490',
    creditorName: 'سليمان بن علي الكعبي',
    originalAmount: 850,
    installmentsCount: 5,
    startDate: '2026-03-15',
    createdAt: new Date().toISOString(),
    installments: [
      { id: 'winst1', index: 1, dueDate: '2026-03-15', amount: 170, paidAmount: 170, status: 'paid', paidDate: '2026-03-15' },
      { id: 'winst2', index: 2, dueDate: '2026-04-15', amount: 170, paidAmount: 170, status: 'paid', paidDate: '2026-04-15' },
      { id: 'winst3', index: 3, dueDate: '2026-05-15', amount: 170, paidAmount: 50, status: 'partial' },
      { id: 'winst4', index: 4, dueDate: '2026-06-15', amount: 170, paidAmount: 0, status: 'pending' },
      { id: 'winst5', index: 5, dueDate: '2026-07-15', amount: 170, paidAmount: 0, status: 'pending' },
    ],
    payments: [
      { id: 'wpay1', amount: 390, date: '2026-03-20', reductionType: 'reduce_duration', note: 'سداد دفعة أولى جزئية ثنائية' }
    ],
  }
];

// Custom Al-Kaabi Money visual brand logo icon
const KaabiLogoIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldJSX" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#c5a059" />
        <stop offset="100%" stopColor="#8a6f27" />
      </linearGradient>
      <linearGradient id="greenJSX" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#064e3b" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="24" fill="url(#greenJSX)" />
    <circle cx="50" cy="50" r="38" fill="none" stroke="url(#goldJSX)" strokeWidth="3" />
    <circle cx="50" cy="50" r="32" fill="none" stroke="url(#goldJSX)" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M35,60 L45,45 L55,45 L65,60 M50,30 L50,45 M40,50 L60,50 M50,45 C44,45 42,49 42,54 C42,60 46,62 50,62 C54,62 58,60 58,54 C58,49 56,45 50,45" fill="none" stroke="url(#goldJSX)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <text x="50" y="76" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="9" fill="#ffd700" textAnchor="middle" letterSpacing="0.5">KAABI</text>
  </svg>
);

export default function App() {
  const [debtors, setDebtors] = useState<Debtor[]>(() => {
    const saved = localStorage.getItem('kaabi_money_debtors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SEED_DEBTORS;
      }
    }
    return SEED_DEBTORS;
  });
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(() => {
    return localStorage.getItem('kaabi_money_selected_debtor_id');
  });
  const [defaultCreditor, setDefaultCreditor] = useState<string>(() => {
    return localStorage.getItem('kaabi_money_default_creditor') || 'الكعبي للتمويل الأهلي';
  });
  
  // Real-time dynamic date & clock state
  const [currentDateState, setCurrentDateState] = useState(new Date());

  useEffect(() => {
    if (selectedDebtorId) {
      localStorage.setItem('kaabi_money_selected_debtor_id', selectedDebtorId);
    } else {
      localStorage.removeItem('kaabi_money_selected_debtor_id');
    }
  }, [selectedDebtorId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateState(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeArabic = (date: Date) => {
    return date.toLocaleTimeString('ar-KW-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };
  
  const formatDateArabic = (date: Date) => {
    return date.toLocaleDateString('ar-KW-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Search and filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'paid'>('all');

  // Modals visibility
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInstallmentForPay, setSelectedInstallmentForPay] = useState<Installment | null>(null);
  
  // Signature capture overlay for active debtor
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [signingBase64, setSigningBase64] = useState('');

  // Active sub-tab inside Debtor details view
  const [activeTab, setActiveTab] = useState<'schedule' | 'logs' | 'attachments' | 'receipt'>('schedule');

  // Top level tab switcher
  const [topTab, setTopTab] = useState<'dashboard' | 'summaries' | 'calculator'>('dashboard');

  // Custom Allocation states
  const [customAllocAmount, setCustomAllocAmount] = useState('');
  const [customAllocStrategy, setCustomAllocStrategy] = useState<'reduce_monthly' | 'reduce_duration'>('reduce_duration');

  // State for beautiful safe dialogs on iframe
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    type?: 'confirm' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showConfirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    type?: 'confirm' | 'alert';
    onConfirm: () => void;
  }) => {
    setConfirmState({
      isOpen: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      isDestructive: options.isDestructive,
      type: options.type || 'confirm',
      onConfirm: () => {
        options.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const saveToLocalStorage = (newDebtors: Debtor[]) => {
    setDebtors(newDebtors);
    localStorage.setItem('kaabi_money_debtors', JSON.stringify(newDebtors));
  };

  const handleUpdateDefaultCreditor = (name: string) => {
    setDefaultCreditor(name);
    localStorage.setItem('kaabi_money_default_creditor', name);
  };

  const handleExportData = () => {
    try {
      const exportObj = {
        debtors,
        defaultCreditor,
        calcPrincipal: localStorage.getItem('kaabi_calc_principal'),
        calcInterestRate: localStorage.getItem('kaabi_calc_interestRate'),
        calcMonths: localStorage.getItem('kaabi_calc_months'),
        calcType: localStorage.getItem('kaabi_calc_type'),
        calcHistory: localStorage.getItem('kaabi_calc_history'),
        savedDebtorNames: localStorage.getItem('kaabi_money_saved_debtors_list'),
        savedCreditorNames: localStorage.getItem('kaabi_money_saved_creditors_list'),
        version: "1.0",
        exportedAt: new Date().toISOString()
      };
      const dataStr = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `الكعبي_money_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      showConfirm({
        title: 'خطأ في التصدير',
        description: 'فشلت عملية حفظ النسخة الاحتياطية المجمعة، يرجى إعادة المحاولة.',
        type: 'alert',
        confirmText: 'موافق',
        onConfirm: () => {}
      });
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && Array.isArray(data.debtors)) {
          showConfirm({
            title: 'تأكيد استعادة النسخة الاحتياطية',
            description: 'تنبيه: استعادة هذه النسخة الاحتياطية سيؤدي إلى استبدال كافة البيانات الحالية ببيانات الملف المرفوع. هل تريد الاستمرار وإتمام الاستعادة؟',
            confirmText: 'نعم، استورد واستبدل',
            cancelText: 'إلغاء وتراجع',
            onConfirm: () => {
              // Update debtors
              saveToLocalStorage(data.debtors);
              if (data.debtors.length > 0) {
                // Try selecting first debtor
                setSelectedDebtorId(data.debtors[0].id);
              } else {
                setSelectedDebtorId(null);
              }
              
              // Restore default creditor
              if (data.defaultCreditor) {
                setDefaultCreditor(data.defaultCreditor);
                localStorage.setItem('kaabi_money_default_creditor', data.defaultCreditor);
              }

              // Restore calculator config
              if (data.calcPrincipal) localStorage.setItem('kaabi_calc_principal', data.calcPrincipal);
              if (data.calcInterestRate) localStorage.setItem('kaabi_calc_interestRate', data.calcInterestRate);
              if (data.calcMonths) localStorage.setItem('kaabi_calc_months', data.calcMonths);
              if (data.calcType) localStorage.setItem('kaabi_calc_type', data.calcType);
              if (data.calcHistory) localStorage.setItem('kaabi_calc_history', data.calcHistory);

              // Restore autocomplete lists
              if (data.savedDebtorNames) localStorage.setItem('kaabi_money_saved_debtors_list', data.savedDebtorNames);
              if (data.savedCreditorNames) localStorage.setItem('kaabi_money_saved_creditors_list', data.savedCreditorNames);

              showConfirm({
                title: 'تمت الاستعادة بنجاح',
                description: 'تمت قراءة ملف النسخة الاحتياطية بنجاح واستعادة كافة حسابات المدينين، السجلات، الشروط والتوقيعات بالكامل وجرى الحفظ التلقائي لها.',
                type: 'alert',
                confirmText: 'حسنًا، ممتاز',
                onConfirm: () => {
                  window.location.reload();
                }
              });
            }
          });
        } else {
          showConfirm({
            title: 'خطأ في قراءة الملف',
            description: 'عذراً، الملف المرفوع غير صالح أو لا يحتوي على بنية بيانات مدينين صحيحة لنظام الكعبي للتمويل.',
            type: 'alert',
            confirmText: 'موافق',
            onConfirm: () => {}
          });
        }
      } catch (error) {
        showConfirm({
          title: 'فشل فك تشفير الملف',
          description: 'تأكد من أن الملف هو صياغة JSON صحيحة المستخرجة مسبقاً من هذا البرنامج.',
          type: 'alert',
          confirmText: 'موافق',
          onConfirm: () => {}
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    showConfirm({
      title: 'تأكيد إعادة ضبط النظام ومسح البيانات',
      description: 'تحذير شديد: هل أنت متأكد تماماً من رغبتك في تصفير جميع البيانات ومسح كافة المدينين والعودة للبيانات الافتراضية؟ سيتم مسح التواقيع والمرفقات بالكامل ولا يمكن التراجع!',
      confirmText: 'نعم، قم بالتصفير والمسح الكامل',
      cancelText: 'إلغاء وتراجع عن التصفير',
      isDestructive: true,
      onConfirm: () => {
        // Clear all local storage data from the device
        localStorage.removeItem('kaabi_money_debtors');
        localStorage.removeItem('kaabi_money_selected_debtor_id');
        localStorage.removeItem('kaabi_money_default_creditor');
        localStorage.removeItem('kaabi_calc_principal');
        localStorage.removeItem('kaabi_calc_interestRate');
        localStorage.removeItem('kaabi_calc_months');
        localStorage.removeItem('kaabi_calc_type');
        localStorage.removeItem('kaabi_calc_history');
        localStorage.removeItem('kaabi_money_saved_debtors_list');
        localStorage.removeItem('kaabi_money_saved_creditors_list');

        // Reset state directly so it reflects instantly on all platforms without requiring a reload
        setDebtors(SEED_DEBTORS);
        setSelectedDebtorId(null);
        setDefaultCreditor('الكعبي للتمويل الأهلي');

        // Reload window after a tiny timeout to ensure storage state is re-synced if needed
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    });
  };

  // Add a brand new debtor to the directory list
  const handleAddDebtor = (newDebtor: Debtor) => {
    const updated = [newDebtor, ...debtors];
    saveToLocalStorage(updated);
    setSelectedDebtorId(newDebtor.id);
  };

  // Delete a debtor
  const handleDeleteDebtor = (id: string, name: string) => {
    showConfirm({
      title: 'تأكيد الحذف النهائي للمدين',
      description: `هل أنت متأكد تماماً من رغبتك في حذف المدين (${name})؟ سيتم مسح كافة البيانات بشكل كامل ولا يمكن استرجاعها.`,
      confirmText: 'نعم، احذف نهائياً',
      cancelText: 'تراجع وإبقاء',
      isDestructive: true,
      onConfirm: () => {
        const updated = debtors.filter(d => d.id !== id);
        saveToLocalStorage(updated);
        if (selectedDebtorId === id) {
          setSelectedDebtorId(null);
        }
      }
    });
  };

  // Apply a payment and reconstruct amortizations
  const handleApplyPayment = (
    debtorId: string,
    amount: number,
    reductionType: 'reduce_monthly' | 'reduce_duration',
    recalculatedSchedule: Installment[]
  ) => {
    const updatedDebtors = debtors.map((d) => {
      if (d.id !== debtorId) return d;

      const newPayment: PaymentRecord = {
        id: Math.random().toString(36).substr(2, 9),
        amount,
        date: new Date().toISOString().split('T')[0],
        reductionType,
        note: `سداد اختياري جديد (${reductionType === 'reduce_monthly' ? 'تقليل الأقساط' : 'تقليل المدة'})`,
      };

      return {
        ...d,
        payments: [...d.payments, newPayment],
        installments: recalculatedSchedule,
      };
    });

    saveToLocalStorage(updatedDebtors);
  };

  // Save a custom edited installment payment (full, partial, or pending)
  const handleSaveCustomInstallmentPayment = (
    installmentId: string,
    paidAmount: number,
    status: 'paid' | 'partial' | 'pending',
    paidDate?: string
  ) => {
    if (!activeDebtor) return;

    const updatedDebtors = debtors.map((d) => {
      if (d.id !== activeDebtor.id) return d;

      // Find target installment
      const targetInst = d.installments.find(i => i.id === installmentId);
      if (!targetInst) return d;

      const difference = paidAmount - (targetInst.paidAmount || 0);

      const updatedInsts = d.installments.map((inst) => {
        if (inst.id !== installmentId) return inst;
        return {
          ...inst,
          paidAmount,
          status,
          paidDate,
        };
      });

      let updatedPayments = [...d.payments];
      if (difference !== 0) {
        updatedPayments.push({
          id: Math.random().toString(36).substr(2, 9),
          amount: Math.abs(difference),
          date: paidDate || new Date().toISOString().split('T')[0],
          reductionType: 'reduce_duration',
          note: difference > 0
            ? `خصم سداد مخصص للقسط #${targetInst.index} (مبلغ: ${paidAmount.toFixed(2)} د.ك)`
            : `تراجع وتغيير قيمة سداد القسط #${targetInst.index} (قيمة جديدة: ${paidAmount.toFixed(2)} د.ك)`,
        });
      }

      return {
        ...d,
        installments: updatedInsts,
        payments: updatedPayments,
      };
    });

    saveToLocalStorage(updatedDebtors);
  };

  // Directly adjust status of single installment from schedule table manually
  const toggleInstallmentStatus = (debtorId: string, installmentId: string) => {
    const targetDebtor = debtors.find(d => d.id === debtorId);
    if (!targetDebtor) return;
    const targetInst = targetDebtor.installments.find(i => i.id === installmentId);
    if (!targetInst) return;

    const performToggle = () => {
      const updatedDebtors = debtors.map((d) => {
        if (d.id !== debtorId) return d;

        const updatedInsts = d.installments.map((inst) => {
          if (inst.id !== installmentId) return inst;

          if (inst.status === 'paid' || inst.status === 'partial') {
            // Revert to pending
            return { ...inst, status: 'pending' as const, paidAmount: 0, paidDate: undefined };
          } else {
            // Set to paid
            return {
              ...inst,
              status: 'paid' as const,
              paidAmount: inst.amount,
              paidDate: new Date().toISOString().split('T')[0],
            };
          }
        });

        return { ...d, installments: updatedInsts };
      });

      saveToLocalStorage(updatedDebtors);
    };

    if (targetInst.status === 'paid' || targetInst.status === 'partial') {
      showConfirm({
        title: 'تراجع عن سداد القسط',
        description: `هل أنت متأكد من رغبتك في إلغاء سداد هذا القسط (قسط #${targetInst.index})؟ سيعود القسط لحالة مطلوب الالتزام بدفعه وقدره ${targetInst.amount.toFixed(2)} د.ك.`,
        confirmText: 'نعم، تراجع عن السداد',
        cancelText: 'تراجع وإلغاء الخيار',
        isDestructive: true,
        onConfirm: performToggle
      });
    } else {
      performToggle();
    }
  };

  // Update signing
  const handleUpdateDebtorSignature = (debtorId: string, signatureBase64: string) => {
    const updatedDebtors = debtors.map((d) => {
      if (d.id === debtorId) {
        return { ...d, signatureData: signatureBase64 };
      }
      return d;
    });
    saveToLocalStorage(updatedDebtors);
  };

  // Update attachments and notes for debtor (ملف المتدين الخاص بالداخل)
  const handleUpdateDebtorAttachments = (
    debtorId: string,
    updates: {
      civilIdImage?: string;
      writtenContractImage?: string;
      additionalImages?: string[];
      notes?: string;
    }
  ) => {
    const updatedDebtors = debtors.map((d) => {
      if (d.id === debtorId) {
        return {
          ...d,
          civilIdImage: updates.civilIdImage,
          writtenContractImage: updates.writtenContractImage,
          additionalImages: updates.additionalImages,
          notes: updates.notes,
        };
      }
      return d;
    });
    saveToLocalStorage(updatedDebtors);
  };

  const handleUpdateDebtorDueDay = (debtorId: string, newDueDay: number) => {
    const updatedDebtors = debtors.map((d) => {
      if (d.id === debtorId) {
        const realignedInstallments = alignInstallmentDueDates(d.installments, d.startDate, newDueDay);
        return {
          ...d,
          dueDay: newDueDay,
          installments: realignedInstallments,
        };
      }
      return d;
    });
    saveToLocalStorage(updatedDebtors);
  };

  // Filter and Search calculations
  const filteredDebtors = debtors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.civilId.includes(searchQuery);

    const remaining = getRemainingTotal(d);
    
    if (filterType === 'active') {
      return matchesSearch && remaining > 0;
    }
    if (filterType === 'paid') {
      return matchesSearch && remaining <= 0;
    }
    return matchesSearch;
  });

  const activeDebtor = debtors.find(d => d.id === selectedDebtorId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-16" dir="rtl">
      
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-850 px-4 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <KaabiLogoIcon className="h-11 w-11 hover:scale-105 transition-transform shrink-0" />
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                الكعبي <span className="text-emerald-600 font-mono text-sm font-black">money</span>
              </h1>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 block font-sans font-medium">
                نظام إدارة وجدولة مستحقات الديون والالتزامات المالية والتمويل الفردي
              </span>
            </div>
          </div>

          {/* Quick inline config for Lender default name */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl font-sans max-w-sm w-full md:w-auto">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 whitespace-nowrap">الدائن الافتراضي:</span>
            <input
              type="text"
              value={defaultCreditor}
              onChange={(e) => handleUpdateDefaultCreditor(e.target.value)}
              className="bg-transparent border-0 focus:ring-0 text-xs font-bold text-slate-800 dark:text-slate-200 w-full focus:outline-hidden py-0 pr-1 pl-0"
              placeholder="اسم معطي المال"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full md:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            مستفيد مدين جديد
          </button>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        
        {/* LIVE DATE AND TIME PREMIUM BAR */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white rounded-3xl p-5 md:p-6 shadow-lg border border-emerald-800/30 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 font-sans select-none animate-in fade-in slide-in-from-top-4 duration-500">
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-right flex-1">
            <div className="p-3 bg-emerald-850/60 rounded-2xl border border-emerald-700/30 text-amber-400 shrink-0">
              <Calendar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 font-extrabold block tracking-wider uppercase">اليوم والتوقيت والموافق الزمني المباشر</span>
              <h2 className="text-sm md:text-base font-black text-white mt-0.5">
                {formatDateArabic(currentDateState)}
              </h2>
              {/* Dynamic Auto-save alert/indicator */}
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-250 font-medium">
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>نظام الحفظ التلقائي والآمن نشط بشكل فوري وتراكمي (يُحفظ تلقائياً عند الإغلاق)</span>
              </div>
            </div>
          </div>
          
          {/* Backup & System Operations Center */}
          <div className="flex flex-wrap items-center gap-3 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/40 justify-center md:justify-end">
            
            {/* Live Clock clock */}
            <div className="flex items-center gap-2.5 bg-emerald-950/70 px-4 py-2 rounded-xl border border-emerald-900/60 font-mono text-emerald-300 shrink-0">
              <Clock className="w-4 h-4 text-[#ffd700] animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-xs md:text-sm font-black tracking-widest text-[#ffd700]">
                {formatTimeArabic(currentDateState)}
              </span>
              <span className="text-[9px] bg-emerald-900 px-1.5 py-0.5 rounded-md font-sans font-extrabold text-emerald-300">مباشر</span>
            </div>

            <div className="h-4 w-px bg-emerald-800/80 hidden md:block" />

            {/* Red set default */}
            <button
              onClick={handleResetData}
              title="مسح وتصفير كافة بيانات المدينين والعودة لبيانات المصنع الافتراضية للبرنامج"
              className="px-4 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/70 border border-rose-800/40 text-rose-200 hover:text-white text-[11px] font-black flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تصفير النظام</span>
            </button>

          </div>
          
        </div>

        {/* Top-level Navigation Switcher */}
        <div className="flex flex-col sm:flex-row bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-850 max-w-2xl mx-auto font-sans shadow-xs gap-1.5">
          <button
            onClick={() => setTopTab('dashboard')}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              topTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Landmark className="w-4 h-4" />
            لوحة قياس الالتزامات والأقساط شهرياً
          </button>
          <button
            onClick={() => setTopTab('summaries')}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              topTab === 'summaries'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Layers className="w-4 h-4" />
            أرشيف كشوف الحساب والملخصات الشاملة
          </button>
          <button
            onClick={() => setTopTab('calculator')}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              topTab === 'calculator'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Calculator className="w-4 h-4" />
            آلة حاسبة لاستخراج الفائدة والجدولة
          </button>
        </div>

        {/* Statistics Widgets */}
        <DashboardStats debtors={debtors} />

        {/* Dashboard Actions and List Workspace Split */}
        {topTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Right Column: Directory List (takes 5 cols on desktop) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-xs overflow-hidden">
            
            {/* Header Directory */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 font-sans flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                دفتر أسماء وقائمة المدينين الحاليين
              </h2>
              
              {/* Search input */}
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرقم المدني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Filtering switchers */}
              <div className="flex gap-1 bg-slate-150 dark:bg-slate-950 p-1 rounded-lg">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer font-sans text-center ${
                    filterType === 'all'
                      ? 'bg-white text-slate-900 dark:bg-slate-905 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  الكل ({debtors.length})
                </button>
                <button
                  onClick={() => setFilterType('active')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer font-sans text-center ${
                    filterType === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  الغير مسددين ({debtors.filter(d => getRemainingTotal(d) > 0).length})
                </button>
                <button
                  onClick={() => setFilterType('paid')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer font-sans text-center ${
                    filterType === 'paid'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  المكتملين ({debtors.filter(d => getRemainingTotal(d) <= 0).length})
                </button>
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-[600px] overflow-y-auto">
              {filteredDebtors.length > 0 ? (
                filteredDebtors.map((debtor) => {
                  const paid = getPaidTotal(debtor);
                  const remaining = getRemainingTotal(debtor);
                  const progressPct = debtor.originalAmount > 0 ? Math.min(100, (paid / debtor.originalAmount) * 100) : 0;
                  const isSelected = selectedDebtorId === debtor.id;

                  return (
                    <div
                      key={debtor.id}
                      onClick={() => {
                        setSelectedDebtorId(debtor.id);
                        // Reset subtab
                        setActiveTab('schedule');
                      }}
                      className={`p-4 transition-all block cursor-pointer border-r-4 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02]'
                          : 'border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="space-y-0.5">
                          <h3 className={`font-extrabold text-sm font-sans block leading-none ${
                            isDebtorOverdue(debtor)
                              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {debtor.name}
                            {isDebtorOverdue(debtor) && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-450 mr-1.5 font-bold">
                                (متأخر ⚠️)
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <CreditCard className="w-3 h-3" /> الرقم المدني: {debtor.civilId}
                          </span>
                        </div>
                        
                        <div className="text-left font-sans">
                          {remaining <= 0 ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              مسدد بالكامل
                            </span>
                          ) : isDebtorOverdue(debtor) ? (
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 px-2 py-0.5 rounded-full font-black animate-pulse">
                              متأخر عن السداد
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold">
                              متبقي أقساط
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar Custom */}
                      <div className="space-y-1.5 font-sans">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-medium font-sans">جدولة استرجاع المبلغ</span>
                          <span className="font-bold text-slate-700 font-mono">{progressPct.toFixed(0)}% ({paid.toFixed(1)} / {debtor.originalAmount.toFixed(0)} د.ك)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 text-[11px] text-slate-550 dark:text-slate-400 font-sans pt-2 border-t border-slate-50 dark:border-slate-850/40">
                        <span>المقرض: <strong className="text-slate-750 dark:text-slate-350">{debtor.creditorName}</strong></span>
                        <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-450">متبقي: {remaining.toFixed(2)} د.ك</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-sans space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-750 mx-auto animate-pulse" />
                  <p className="text-xs">لم نجد أي مدينين يطابقون خيارات البحث.</p>
                </div>
              )}
            </div>

          </div>

          {/* Left Column: Extensive Profile Detail Workspace (takes 7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            {activeDebtor ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-xs overflow-hidden">
                
                {/* Active Debtor Profile Card Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/40 relative">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1">
                      {/* Interactive Civil ID Thumbnail Section */}
                      <div className="relative group shrink-0">
                        {activeDebtor.civilIdImage ? (
                          <div className="relative">
                            <img
                              src={activeDebtor.civilIdImage}
                              alt="البطاقة المدنية"
                              className="w-24 h-16 object-cover rounded-xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md hover:scale-105 active:scale-95 hover:border-emerald-600 transition-all cursor-pointer"
                              onClick={() => {
                                // Jump directly to attachments tab to see full documents
                                setActiveTab('attachments');
                              }}
                              title="البطاقة المدنية للمدين - اضغط لعرض المستندات بالكامل"
                            />
                            <label className="absolute -bottom-1 -left-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-1.5 shadow-md cursor-pointer border border-white dark:border-slate-900 text-[10px] font-black leading-none block">
                              <Upload className="w-3 h-3" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      handleUpdateDebtorAttachments(activeDebtor.id, {
                                        civilIdImage: reader.result as string,
                                        writtenContractImage: activeDebtor.writtenContractImage,
                                        additionalImages: activeDebtor.additionalImages,
                                        notes: activeDebtor.notes
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="w-24 h-16 bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.02] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
                            <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-bold">رفع البطاقة المدنية</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleUpdateDebtorAttachments(activeDebtor.id, {
                                      civilIdImage: reader.result as string,
                                      writtenContractImage: activeDebtor.writtenContractImage,
                                      additionalImages: activeDebtor.additionalImages,
                                      notes: activeDebtor.notes
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      <div className="space-y-1 text-center sm:text-right">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="text-[10px] bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md font-sans">
                            ملف مدين معتمد
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">تاريخ التسجيل: {activeDebtor.startDate}</span>
                        </div>
                        
                        <h2 className={`text-xl font-black font-sans ${
                          isDebtorOverdue(activeDebtor)
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {activeDebtor.name}
                          {isDebtorOverdue(activeDebtor) && (
                            <span className="text-xs bg-rose-100 dark:bg-rose-955/80 text-rose-800 dark:text-rose-300 border border-rose-300/50 px-2 py-0.5 rounded-lg mr-2 font-black animate-pulse inline-block align-middle">
                              ⚠️ متأخر عن السداد
                            </span>
                          )}
                        </h2>
                        
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-slate-505 dark:text-slate-450 text-xs font-sans">
                          <span className="flex items-center gap-1 font-mono">
                            <CreditCard className="w-3.5 h-3.5 text-slate-405" /> الرقم المدني: <strong>{activeDebtor.civilId}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-emerald-650" /> كفيل معطي المال (الدائن): <strong>{activeDebtor.creditorName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Leftside actions (Make payment & Write signatures) */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button
                        onClick={() => setIsPaymentOpen(true)}
                        disabled={getRemainingTotal(activeDebtor) <= 0}
                        className="px-4 py-2 bg-emerald-650 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:dark:bg-slate-800 disabled:dark:text-slate-500 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        ثبت أو سدد دفعة
                      </button>

                      <button
                        onClick={() => setIsSigningOpen(true)}
                        className="px-3.5 py-2 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <PenTool className="w-4 h-4 text-indigo-600" />
                        {activeDebtor.signatureData ? 'تعديل التوقيع' : 'توقيع السند'}
                      </button>

                      <button
                        onClick={() => handleDeleteDebtor(activeDebtor.id, activeDebtor.name)}
                        className="p-2 border border-rose-100 text-rose-600 dark:border-rose-950/60 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
                        title="مسح من القائمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Summary progress bar inside headers */}
                  <div className="mt-5 p-4 bg-slate-900 text-white rounded-2xl grid grid-cols-3 gap-2 text-center font-sans">
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">الدين الأصلي</span>
                      <strong className="text-sm tracking-tight font-black font-mono">{activeDebtor.originalAmount.toFixed(2)} د.ك</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">إجمالي المسدد</span>
                      <strong className="text-sm tracking-tight font-black font-mono text-emerald-400">{getPaidTotal(activeDebtor).toFixed(2)} د.ك</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">المتبقي المطلوب</span>
                      <strong className="text-sm tracking-tight font-black font-mono text-rose-450">{getRemainingTotal(activeDebtor).toFixed(2)} د.ك</strong>
                    </div>
                  </div>

                  {/* Smart Custom Amount Allocation Widget */}
                  {getRemainingTotal(activeDebtor) > 0 && (
                    <div className="mt-3 p-4 bg-emerald-50 text-emerald-955 dark:bg-emerald-950/20 dark:text-emerald-100 rounded-2xl border border-emerald-100/60 dark:border-emerald-900/40">
                      <h3 className="text-xs font-black mb-1.5 font-sans flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        تخصيص مبلغ مالي (ذكي وتلقائي) لحفظ التغييرات
                      </h3>
                      
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="اكتب المبلغ لتسوية الخطة... (مثال: الدينار)"
                          value={customAllocAmount}
                          step="0.01"
                          min="0.01"
                          max={getRemainingTotal(activeDebtor)}
                          onChange={(e) => setCustomAllocAmount(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-850 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                        <span className="text-xs font-black shrink-0">د.ك</span>
                      </div>

                      {/* If amount is typed, show the dynamic simulation options! */}
                      {parseFloat(customAllocAmount) > 0 && parseFloat(customAllocAmount) <= getRemainingTotal(activeDebtor) && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/40 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150 text-right">
                          <p className="text-[10.5px] font-semibold leading-relaxed">
                            الرجاء تحديد غايتك من التخصيص لتحديث خطة سداد <strong className="font-sans text-xs">{activeDebtor.name}</strong>:
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Option 1: Reduce monthly */}
                            <button
                              type="button"
                              onClick={() => setCustomAllocStrategy('reduce_monthly')}
                              className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                                customAllocStrategy === 'reduce_monthly'
                                  ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/15'
                                  : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-transparent hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  customAllocStrategy === 'reduce_monthly' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                }`}>
                                  {customAllocStrategy === 'reduce_monthly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-[10.5px] font-black">تغيير الحسبة الشهرية</span>
                              </div>
                              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal">
                                سيتم خصم هذا المبلغ فوراً من الدين وإعادة تقسيم الباقي بالتساوي على كافة الفترات القادمة (تخفيض قيمة القسط الشهري) مع دمج الكسور تلقائياً.
                              </span>
                            </button>

                            {/* Option 2: Deduct from principal / reduce duration */}
                            <button
                              type="button"
                              onClick={() => setCustomAllocStrategy('reduce_duration')}
                              className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                                customAllocStrategy === 'reduce_duration'
                                  ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/15'
                                  : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-transparent hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  customAllocStrategy === 'reduce_duration' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                }`}>
                                  {customAllocStrategy === 'reduce_duration' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-[10.5px] font-black text-indigo-700 dark:text-indigo-400 font-sans">خصم من أصل المبلغ</span>
                              </div>
                              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal">
                                قفل الدفعات القادمة مباشرة وخصمها مع تقليل المدة وحذف الأشهر الإضافية (تظل الدفعات السابقة كما هي مع تقليص المدة الإجمالية وتسوية الكسور).
                              </span>
                            </button>
                          </div>

                          {/* Live simulated calculation results */}
                          {(() => {
                            const val = parseFloat(customAllocAmount) || 0;
                            const sims = simulatePayment(activeDebtor, val);
                            const chosenSchedule = customAllocStrategy === 'reduce_monthly' ? sims.reduceMonthlySchedule : sims.reduceDurationSchedule;
                            const preCount = activeDebtor.installments.filter(i => i.status !== 'paid').length;
                            const postCount = chosenSchedule.filter(i => i.status !== 'paid').length;
                            const nextInst = chosenSchedule.find(i => i.status !== 'paid');
                            const nextVal = nextInst ? nextInst.amount : 0;

                            return (
                              <div className="bg-white/90 dark:bg-slate-900/80 p-3 rounded-xl text-xs border border-emerald-100/40 dark:border-emerald-900/20 space-y-1.5 text-slate-600 dark:text-slate-300 font-sans">
                                <div className="flex justify-between">
                                  <span>عدد الشهور المتبقية للاستحقاق:</span>
                                  <span className="font-extrabold text-slate-900 dark:text-white font-mono">{postCount} أشهر (سابقاً: {preCount})</span>
                                </div>
                                {nextVal > 0 && (
                                  <div className="flex justify-between">
                                    <span>قيمة القسط القادم المتوقع:</span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{nextVal.toFixed(2)} د.ك</span>
                                  </div>
                                )}
                                <div className="text-[9.5px] text-slate-400 italic font-sans text-right">
                                  * يطبق البرنامج ذكاء دمج الكسر تلقائياً (في حال بقي دينار أو مبلغ تافه يتم حشوه في الدفعة الأخيرة وتقليص الأشهر المبعثرة).
                                </div>
                              </div>
                            );
                          })()}

                          {/* Submit button */}
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseFloat(customAllocAmount);
                              if (isNaN(val) || val <= 0) return;
                              
                              const sims = simulatePayment(activeDebtor, val);
                              const selectedSchedule = customAllocStrategy === 'reduce_monthly' ? sims.reduceMonthlySchedule : sims.reduceDurationSchedule;
                              handleApplyPayment(activeDebtor.id, val, customAllocStrategy, selectedSchedule);
                              setCustomAllocAmount('');
                              showConfirm({
                                title: 'تم تسجيل دفعة التخصيص',
                                description: 'تمت العملية بنجاح! تم توزيع وتخصيص الدفعة الحالية وإعادة جدولة الشهور المتبقية تلقائياً للعميل.',
                                confirmText: 'رائع، استمر',
                                type: 'confirm',
                                onConfirm: () => {}
                              });
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            اعتماد وتحديث الجدول للعميل فوراً
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub Tab Switchers (Schedule vs Logs vs Certificate) */}
                <div className="flex border-b border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 font-sans">
                  
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 py-3 text-xs font-black border-b-2 transition-all cursor-pointer text-center ${
                      activeTab === 'schedule'
                        ? 'border-emerald-600 text-emerald-600 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    جدول الدفعات شهرياً ({activeDebtor.installments.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 py-3 text-xs font-black border-b-2 transition-all cursor-pointer text-center ${
                      activeTab === 'logs'
                        ? 'border-emerald-600 text-emerald-600 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    سجل الدفعات والتعديلات ({activeDebtor.payments.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('attachments')}
                    className={`flex-1 py-3 text-xs font-black border-b-2 transition-all cursor-pointer text-center ${
                      activeTab === 'attachments'
                        ? 'border-emerald-600 text-emerald-600 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    الملف والمستندات للعميل ({ (activeDebtor.civilIdImage ? 1 : 0) + (activeDebtor.writtenContractImage ? 1 : 0) + (activeDebtor.additionalImages?.length || 0) })
                  </button>

                  <button
                    onClick={() => setActiveTab('receipt')}
                    className={`flex-1 py-3 text-xs font-black border-b-2 transition-all cursor-pointer text-center ${
                      activeTab === 'receipt'
                        ? 'border-emerald-600 text-emerald-600 bg-white dark:bg-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    معاينة السند وحفظ صورة للمتسلف
                  </button>

                </div>

                {/* Tab content wrapper */}
                <div className="p-6">
                  
                  {/* TAB 1: INSTALLMENTS SCHEDULE LIST */}
                  {activeTab === 'schedule' && (
                    <div className="space-y-4">
                      
                      {/* Interactive Edit Due Day Panel */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans mb-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تعديل أو تحديد موعد الدفعات الشهري</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            يصادف قسط هذا العميل يوم <strong className="text-emerald-600 font-mono">{activeDebtor.dueDay || new Date(activeDebtor.startDate).getDate()}</strong> من كل شهر. تغيير الموعد سيعيد تعيين جميع تواريخ استحقاق الأقساط تلقائياً.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <select
                            value={activeDebtor.dueDay || new Date(activeDebtor.startDate).getDate()}
                            onChange={(e) => {
                              const day = parseInt(e.target.value);
                              if (day) {
                                handleUpdateDebtorDueDay(activeDebtor.id, day);
                              }
                            }}
                            className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-slate-200 cursor-pointer"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((dDay) => (
                              <option key={dDay} value={dDay}>
                                يوم {dDay} من الشهر
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md font-bold shrink-0">
                            مُحاذى آلياً
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 font-sans">
                          الأقساط الموزعة شهرياً وتواريخ استحقاقها:
                        </h3>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold font-sans">
                          * يمكنك النقر لتسجيل سداد مخصص ومبلغ مالي جزئي أو كامل للخصم
                        </p>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden">
                        {activeDebtor.installments.map((inst) => {
                          const isPaid = inst.status === 'paid';
                          const isPartial = inst.status === 'partial';

                          return (
                            <div
                              key={inst.id}
                              onClick={() => setSelectedInstallmentForPay(inst)}
                              className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3">
                                {/* Checkbox simulation */}
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  isPaid
                                    ? 'bg-emerald-600 text-white'
                                    : isPartial
                                    ? 'bg-amber-500 text-white'
                                    : 'border-2 border-slate-300 dark:border-slate-700'
                                }`}>
                                  {isPaid && <span className="text-[10px] font-bold">✓</span>}
                                  {isPartial && <span className="text-[10px] font-bold">~</span>}
                                </div>
                                
                                <div>
                                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                                    القسط #{inst.index}
                                  </span>
                                  <span className="text-[10.5px] text-slate-455 dark:text-slate-400 block font-mono flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3 text-slate-400" /> تاريخ الاستحقاق: {inst.dueDate}
                                  </span>
                                </div>
                              </div>

                              <div className="text-left font-sans flex items-center gap-3.5">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono block">
                                    {inst.amount.toFixed(2)} د.ك
                                  </span>
                                  {isPartial && (
                                    <span className="text-[9.5px] text-amber-600 font-bold font-sans block">
                                      المسدد منه: {inst.paidAmount.toFixed(1)} د.ك
                                    </span>
                                  )}
                                  {isPaid && inst.paidDate && (
                                    <span className="text-[9.5px] text-emerald-600 font-bold font-sans block">
                                      تم بالكامل في: {inst.paidDate}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {isPaid ? (
                                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 px-2 py-1 rounded-sm border border-emerald-100 dark:border-emerald-900">
                                      مسدد
                                    </span>
                                  ) : isPartial ? (
                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 px-2 py-1 rounded-sm border border-amber-100 dark:border-amber-900">
                                      مسدد جزئي
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-sm border border-slate-150 dark:border-slate-700">
                                      متبقي مستحَق
                                    </span>
                                  )}
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PAYMENTS HISTORY LOG */}
                  {activeTab === 'logs' && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-300 font-sans">
                        التسجيل التاريخي لكافة عمليات السداد وإعادة الجدولة:
                      </h3>

                      {activeDebtor.payments.length > 0 ? (
                        <div className="space-y-3 font-sans">
                          {activeDebtor.payments.map((log) => (
                            <div
                              key={log.id}
                              className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-start justify-between gap-4"
                            >
                              <div className="flex gap-3">
                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 mt-0.5">
                                  <History className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-850 dark:text-slate-200">
                                    مدفوع استثنائي وارد بمبلغ <strong className="font-extrabold text-sm ml-1 font-mono text-emerald-600">{log.amount.toFixed(2)} د.ك</strong>
                                  </p>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    تاريخ المعاملة: {log.date}
                                  </span>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                                    نمط الخصم المعتمد في الجدول: {log.reductionType === 'reduce_monthly' ? (
                                      <span className="text-indigo-650 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">خفض القسط الشهري للأشهر القادمة</span>
                                    ) : (
                                      <span className="text-teal-650 font-bold bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">تقليص المدة الزمنية وخصم آخر الأقساط</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 font-bold text-[9px] px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900 font-sans">
                                نجاح المعاملة
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400 font-sans">
                          لا يوجد سجلات معاملات في هذا الملف حتى الآن. ابدأ بتسجيل أول سداد من شريط الأدوات بالسليد العلوي.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: ATTACHMENTS & INTERNAL FILE ARCHIVE */}
                  {activeTab === 'attachments' && (
                    <div className="space-y-6 animate-in fade-in duration-150 font-sans" dir="rtl">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            📁 الملف الشخصي الداخلي والأرشيف والمستندات للمدين
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            هنا يتم استعراض وإضافة صور وملفات الإثبات الخاصة بالمدين {activeDebtor.name}
                          </p>
                        </div>
                      </div>

                      {/* Internal Notes Textarea Card */}
                      <div className="bg-slate-50/50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                        <label className="block text-xs font-bold text-slate-805 dark:text-slate-205">
                          📝 حالة المدين والملاحظات الخاصة (الملف الشخصي الداخلي)
                        </label>
                        <textarea
                          placeholder="اكتب هنا حالة العميل، تاريخ آخر اتصال، تفاصيل الجدولة الشفهية أو شروط الائتمان..."
                          rows={4}
                          value={activeDebtor.notes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateDebtorAttachments(activeDebtor.id, {
                              civilIdImage: activeDebtor.civilIdImage,
                              writtenContractImage: activeDebtor.writtenContractImage,
                              additionalImages: activeDebtor.additionalImages,
                              notes: val
                            });
                          }}
                          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans leading-relaxed"
                        />
                        <div className="text-[10px] text-slate-500 text-left font-sans">
                          ✓ يتم تخزين الملاحظات تلقائياً وبالكامل في ملف المدين فور الكتابة.
                        </div>
                      </div>

                      {/* Document Images grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Civil ID Attachment card */}
                        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4 text-emerald-600" />
                              نسخة البطاقة المدنية للمدين
                            </h4>
                            <p className="text-[11px] text-slate-450 mb-3 leading-relaxed">
                              تظهر هذه الصورة مباشرة داخل السند المالي المولد للطباعة والحفظ والتحميل.
                            </p>
                          </div>
                          
                          <div className="relative border-2 border-dashed border-slate-150 dark:border-slate-805 hover:border-emerald-505 dark:hover:border-emerald-505 rounded-xl p-4 text-center transition-colors bg-slate-50 dark:bg-slate-900/50 min-h-[160px] flex flex-col justify-center items-center">
                            {activeDebtor.civilIdImage ? (
                              <div className="relative group/doc w-full">
                                <img
                                  src={activeDebtor.civilIdImage}
                                  alt="البطاقة المدنية"
                                  className="max-h-32 max-w-full mx-auto object-cover rounded-lg border border-slate-200"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateDebtorAttachments(activeDebtor.id, {
                                      civilIdImage: undefined,
                                      writtenContractImage: activeDebtor.writtenContractImage,
                                      additionalImages: activeDebtor.additionalImages,
                                      notes: activeDebtor.notes
                                    });
                                  }}
                                  className="absolute top-1 right-1/2 translate-x-1/2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-xs transition-opacity cursor-pointer"
                                >
                                  حذف الصورة
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        handleUpdateDebtorAttachments(activeDebtor.id, {
                                          civilIdImage: reader.result as string,
                                          writtenContractImage: activeDebtor.writtenContractImage,
                                          additionalImages: activeDebtor.additionalImages,
                                          notes: activeDebtor.notes
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <span className="text-[11px] font-bold text-slate-600 block">اضغط أو اسحب لرفع البطاقة</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Written Contract Attachment card */}
                        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              صورة ورقة الدين المكتوبة مصورة
                            </h4>
                            <p className="text-[10px] text-slate-455 mb-3 leading-relaxed">
                              الصورة المأخوذة كعقد أمانة، وصل ثنائي، أو شيك الالتزام.
                            </p>
                          </div>
                          
                          <div className="relative border-2 border-dashed border-slate-150 dark:border-slate-805 hover:border-emerald-505 dark:hover:border-emerald-505 rounded-xl p-4 text-center transition-colors bg-slate-50 dark:bg-slate-900/50 min-h-[160px] flex flex-col justify-center items-center">
                            {activeDebtor.writtenContractImage ? (
                              <div className="relative group/doc w-full">
                                <img
                                  src={activeDebtor.writtenContractImage}
                                  alt="وثيقة الدين"
                                  className="max-h-32 max-w-full mx-auto object-cover rounded-lg border border-slate-200"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateDebtorAttachments(activeDebtor.id, {
                                      civilIdImage: activeDebtor.civilIdImage,
                                      writtenContractImage: undefined,
                                      additionalImages: activeDebtor.additionalImages,
                                      notes: activeDebtor.notes
                                    });
                                  }}
                                  className="absolute top-1 right-1/2 translate-x-1/2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-xs transition-opacity cursor-pointer"
                                >
                                  حذف الصورة
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        handleUpdateDebtorAttachments(activeDebtor.id, {
                                          civilIdImage: activeDebtor.civilIdImage,
                                          writtenContractImage: reader.result as string,
                                          additionalImages: activeDebtor.additionalImages,
                                          notes: activeDebtor.notes
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <span className="text-[11px] font-bold text-slate-600 block">اضغط أو اسحب لرفع وصل الدين</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Generic additional attachments gallery */}
                      <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                            📂 أرشيف صور ومستندات إضافية متفرقة للعميل
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          
                          {/* File input button */}
                          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-855 hover:border-emerald-500 hover:text-emerald-600 rounded-xl p-3 text-center transition-colors bg-slate-50 dark:bg-slate-900/40 cursor-pointer flex flex-col justify-center items-center min-h-[96px]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const expanded = [...(activeDebtor.additionalImages || []), reader.result as string];
                                    handleUpdateDebtorAttachments(activeDebtor.id, {
                                      civilIdImage: activeDebtor.civilIdImage,
                                      writtenContractImage: activeDebtor.writtenContractImage,
                                      additionalImages: expanded,
                                      notes: activeDebtor.notes
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="w-4 h-4 text-emerald-650 mb-1" />
                            <span className="text-[10px] text-slate-605 block font-bold">رفع صورة جديدة</span>
                          </div>

                          {/* Existing extra photos */}
                          {activeDebtor.additionalImages?.map((img, idx) => (
                            <div key={idx} className="relative group/extra w-full h-24 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden shadow-xs hover:shadow-sm">
                              <img src={img} alt="مرفق إضافي" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = activeDebtor.additionalImages?.filter((_, i) => i !== idx);
                                  handleUpdateDebtorAttachments(activeDebtor.id, {
                                    civilIdImage: activeDebtor.civilIdImage,
                                    writtenContractImage: activeDebtor.writtenContractImage,
                                    additionalImages: filtered,
                                    notes: activeDebtor.notes
                                  });
                                }}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/extra:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold cursor-pointer"
                              >
                                مسح الصورة
                              </button>
                            </div>
                          ))}

                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DEBT BOND & EXPORTING */}
                  {activeTab === 'receipt' && (
                    <BondReceipt
                      debtor={activeDebtor}
                      onUpdateDebtorSignature={handleUpdateDebtorSignature}
                    />
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-xs p-12 text-center space-y-3 font-sans">
                <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-300">
                  مرحباً بك في الكعبي money لتنظيم المديونيات
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  الرجاء اختيار أحد المدينين من القائمة الجانبية لقراءة تفاصيل جدولته، وتعديل الدفعات، وتوقيع السندات المالية أو إصدار السند كصورة مباشرة.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="outline-dashed outline-2 outline-offset-4 outline-emerald-600 text-emerald-600 font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors"
                  >
                    أو اضغط لإضافة ملف مدين وتوثيقه فوراً
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
        ) : topTab === 'summaries' ? (
          <AllDebtorsSummaries debtors={debtors} onDeleteDebtor={handleDeleteDebtor} />
        ) : (
          <InterestCalculator />
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-12 mb-8 text-center font-sans">
        <div className="max-w-2xl mx-auto px-4 py-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} الكعبي money لتنظيم المديونيات. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">
            <span>برمجة وتطوير المبرمج:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-450 text-xs bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">سلطان دهراب</span>
          </p>
        </div>
      </footer>

      {/* MODAL 1: ADD NEW DEBTOR */}
      <AddDebtorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddDebtor}
        defaultCreditorName={defaultCreditor}
      />

      {/* MODAL 2: APPLY PAYMENT */}
      {activeDebtor && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          debtor={activeDebtor}
          onApplyPayment={handleApplyPayment}
        />
      )}

      {/* MODEL 3: STANDALONE DIGITAL SIGNATURE CAPTURE MODAL */}
      {isSigningOpen && activeDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity" dir="rtl">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-850">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-emerald-600" />
                  تسجيل توقيع العميل الرقمي
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                  وقع بالأسفل يدوياً لربطه مع سند المديونية #{(activeDebtor.id).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setIsSigningOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-805 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <SignaturePad
                initialData={activeDebtor.signatureData}
                onSave={(b64) => setSigningBase64(b64)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 font-sans">
                <button
                  onClick={() => setIsSigningOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    handleUpdateDebtorSignature(activeDebtor.id, signingBase64);
                    setIsSigningOpen(false);
                  }}
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  تأكيد وربط التوقيع
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: CUSTOM INDIVIDUAL INSTALLMENT PAYMENT MODAL */}
      {selectedInstallmentForPay && activeDebtor && (
        <CustomInstallmentPaymentModal
          isOpen={!!selectedInstallmentForPay}
          onClose={() => setSelectedInstallmentForPay(null)}
          debtorName={activeDebtor.name}
          installment={selectedInstallmentForPay}
          onSave={handleSaveCustomInstallmentPayment}
        />
      )}

      {/* CUSTOM CONFIRMATION OVERLAY FOR IFRAME COMPATIBILITY */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isDestructive={confirmState.isDestructive}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
