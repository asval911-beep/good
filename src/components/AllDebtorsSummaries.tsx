import React, { useState, useRef } from 'react';
import {
  Search,
  User,
  CreditCard,
  Calendar,
  Layers,
  Coins,
  CheckCircle,
  FileCheck,
  Printer,
  Download,
  AlertCircle,
  TrendingDown,
  Clock,
  Sparkles,
  Eye,
  Image,
  X,
  Trash2
} from 'lucide-react';
import { Debtor } from '../types';
import { getPaidTotal, getRemainingTotal, isDebtorOverdue, applyHtml2CanvasSafeOklchClone, safeHtml2Canvas } from '../utils/finance';
import DebtorPreviewModal from './DebtorPreviewModal';

interface AllDebtorsSummariesProps {
  debtors: Debtor[];
  onDeleteDebtor?: (id: string, name: string) => void;
}

export default function AllDebtorsSummaries({ debtors, onDeleteDebtor }: AllDebtorsSummariesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'paid'>('all');
  
  // Keep track of which card is currently being captured/downloaded (optional spinner)
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewDebtor, setPreviewDebtor] = useState<Debtor | null>(null);

  const filtered = debtors.filter((d) => {
    const matches = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.civilId.includes(searchQuery);
    const rem = getRemainingTotal(d);
    if (filterType === 'active') return matches && rem > 0;
    if (filterType === 'paid') return matches && rem <= 0;
    return matches;
  });

  // Handle capture and download of the card as a high-quality PNG image
  const handleSaveAsImage = async (debtorId: string, debtorName: string) => {
    const element = document.getElementById(`debtor-summary-card-${debtorId}`);
    if (!element) return;

    setIsExporting(debtorId);
    try {
      // Small delay to ensure any layout shifts or styling loads completely
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const canvas = await safeHtml2Canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        scale: 2, // enhances output quality for printing and storage
        scrollX: 0,
        scrollY: 0,
        width: 640,
        height: element.scrollHeight,
        windowWidth: 640,
        windowHeight: element.scrollHeight + 200,
        ignoreElements: (el: Element) => {
          // Ignore the actions row with buttons so it doesn't clutter the image
          return el.getAttribute('data-html2canvas-ignore') === 'true' || el.classList.contains('no-capture');
        },
        onclone: (clonedDoc: Document) => {
          if (document.documentElement.classList.contains('dark')) {
            clonedDoc.documentElement.classList.add('dark');
          }
          if (document.body.classList.contains('dark')) {
            clonedDoc.body.classList.add('dark');
          }
          const clonedEl = clonedDoc.getElementById(`debtor-summary-card-${debtorId}`);
          if (clonedEl) {
            clonedEl.style.position = 'absolute';
            clonedEl.style.top = '0';
            clonedEl.style.left = '0';
            clonedEl.style.width = '640px';
            clonedEl.style.height = 'auto';
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.overflow = 'visible';
            clonedEl.style.margin = '0';
            clonedEl.style.boxShadow = 'none';
            
            clonedDoc.body.innerHTML = '';
            clonedDoc.body.appendChild(clonedEl);

            applyHtml2CanvasSafeOklchClone(element, clonedEl, clonedDoc);
          }
        },
      });

      const image = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", image);
      downloadAnchor.setAttribute("download", `كشف_حساب_مديونية_${debtorName}.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error rendering element to canvas image:', err);
      alert('عذراً، لم نتمكن من حفظ كشف الحساب كصورة. يرجى محاولة استخدام خيار الطباعة.');
    } finally {
      setIsExporting(null);
    }
  };

  // Handle local print of only that specific DOM element!
  const handlePrintCard = (debtorId: string, debtorName: string) => {
    const element = document.getElementById(`debtor-summary-card-${debtorId}`);
    if (!element) return;

    // Create a temporary hidden iframe or new window to print the specific card elegantly
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح للنوافذ المنبثقة لطباعة الملخص');
      return;
    }

    const htmlContent = `
      <html dir="rtl" lang="ar">
        <head>
          <title>ملخص مديونية - ${debtorName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
            body { 
              font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #1e293b;
              background-color: #ffffff;
            }
            .card {
              border: 3px double #cbd5e1;
              padding: 30px;
              border-radius: 20px;
              max-width: 800px;
              margin: 0 auto;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header {
              border-b: 2px solid #10b981;
              padding-bottom: 20px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 24px;
              font-weight: 900;
              color: #047857;
              margin: 0;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin-top: 5px;
            }
            .grid-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 14px;
              border: 1px solid #f1f5f9;
            }
            .info-item {
              font-size: 14px;
            }
            .info-item strong {
              color: #0f172a;
            }
            .finance-strip {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
              text-align: center;
              margin-bottom: 30px;
            }
            .finance-box {
              background: #0f172a;
              color: white;
              padding: 15px;
              border-radius: 12px;
            }
            .finance-box.green {
              background: #065f46;
            }
            .finance-box.red {
              background: #9f1239;
            }
            .finance-box span {
              display: block;
              font-size: 11px;
              opacity: 0.8;
              margin-bottom: 5px;
            }
            .finance-box strong {
              font-size: 18px;
              font-family: 'JetBrains Mono', monospace;
            }
            .section-title {
              font-size: 15px;
              font-weight: 700;
              margin-bottom: 15px;
              color: #334155;
              border-right: 3px solid #10b981;
              padding-right: 8px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 12px;
            }
            .table th, .table td {
              border: 1px solid #e2e8f0;
              padding: 12px;
              text-align: right;
            }
            .table th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: bold;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-paid { background: #d1fae5; color: #065f46; }
            .badge-pending { background: #fee2e2; color: #9f1239; }
            .badge-partial { background: #fef3c7; color: #92400e; }
            .signature-area {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-t: 1px dashed #cbd5e1;
              padding-top: 30px;
            }
            .sig-box {
              width: 250px;
              text-align: center;
            }
            .sig-line {
              border-top: 1.5px solid #94a3b8;
              margin-top: 15px;
              padding-top: 5px;
              font-size: 12px;
              color: #475569;
            }
            .signature-img {
              max-height: 80px;
              max-width: 100%;
              object-fit: contain;
              margin-bottom: 5px;
            }
            .footer-note {
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              margin-top: 40px;
            }
            @media print {
              body { padding: 0; }
              .card { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <h1 class="title">سند وكشف حساب مديونية معتمد</h1>
                <div class="subtitle">صادر عن برنامج الكعبي لإدارة الالتزامات المالية</div>
              </div>
              <div style="font-size: 12px; font-weight: bold; color: #475569; text-align: left;">
                تاريخ الطباعة:<br/>
                ${new Date().toLocaleDateString('ar-KW-u-nu-latn')}
              </div>
            </div>

            <div class="grid-info">
              <div class="info-item">اسم المستلف (المدين): <strong>${debtorName}</strong></div>
              <div class="info-item">الرقم المدني: <strong>${element.getAttribute('data-civil-id') || ''}</strong></div>
              <div class="info-item">كفيل معطي المال (الدائن): <strong>${element.getAttribute('data-creditor-name') || ''}</strong></div>
              <div class="info-item">تاريخ تنظيم الدين: <strong>${element.getAttribute('data-start-date') || ''}</strong></div>
            </div>

            <div class="finance-strip">
              <div class="finance-box">
                <span>إجمالي أصل الدين</span>
                <strong>${element.getAttribute('data-original-amount')} د.ك</strong>
              </div>
              <div class="finance-box green">
                <span>إجمالي ما تم سداده</span>
                <strong>${element.getAttribute('data-paid-amount')} د.ك</strong>
              </div>
              <div class="finance-box red">
                <span>المتبقي المطلوب سداده</span>
                <strong>${element.getAttribute('data-remaining-amount')} د.ك</strong>
              </div>
            </div>

            <h3 class="section-title">تفاصيل الأقساط الشهرية وجدول السداد</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>رقم الدفعة</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ المقرر</th>
                  <th>المبلغ المدفوع فعلياً</th>
                  <th>الوضع المالي</th>
                  <th>تاريخ وتوقيت الدفع</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from(element.querySelectorAll('.print-installment-row')).map(row => `
                  <tr>
                    <td>${row.getAttribute('data-index') || ''}</td>
                    <td>${row.getAttribute('data-due-date') || ''}</td>
                    <td>${row.getAttribute('data-amount') || ''} د.ك</td>
                    <td>${row.getAttribute('data-paid-amount') || ''} د.ك</td>
                    <td><span class="badge badge-${row.getAttribute('data-status')}">${row.getAttribute('data-status-text')}</span></td>
                    <td>${row.getAttribute('data-paid-date') || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${element.querySelector('.print-has-payments') ? `
              <h3 class="section-title">سجل العمليات والدفعات الاستثنائية</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>تاريخ الدفعة</th>
                    <th>مبلغ السداد</th>
                    <th>نوع الإجراء وتخفيض الدين</th>
                    <th>ملاحظات الدائن والبيان</th>
                  </tr>
                </thead>
                <tbody>
                  ${Array.from(element.querySelectorAll('.print-payment-row')).map(row => `
                    <tr>
                      <td>${row.getAttribute('data-date') || ''}</td>
                      <td>${row.getAttribute('data-amount') || ''} د.ك</td>
                      <td>${row.getAttribute('data-type') || ''}</td>
                      <td>${row.getAttribute('data-note') || '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            <div class="signature-area">
              <div class="sig-box">
                <div class="sig-line">توقيع المستفيد (المدين)</div>
                ${element.querySelector('.print-sig-img') ? `
                  <img class="signature-img" src="${element.querySelector('.print-sig-img')?.getAttribute('src')}" />
                ` : '<div style="height: 40px; color: #94a3b8; font-size: 11px; margin-top:10px;">بانتظار التوقيع الإلكتروني...</div>'}
              </div>
              <div class="sig-box">
                <div class="sig-line">توقيع معطي المال (المدقق والدائن)</div>
                <div style="height: 40px; display: flex; items-center; justify-content: center; font-size: 12px; font-weight: bold; color: #047857; margin-top:10px;">
                  مؤسسة الكعبي المعتمدة
                </div>
              </div>
            </div>

            <div class="footer-note">
              تم توليد هذا الكشف إلكترونياً ويعد سنداً رسمياً متفقاً عليه بين الطرفين لاستيفاء الحقوق المالية.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Safe as Image / Export logic (fallback download since HTML-to-image usually requires complex library dependencies)
  // Let's create a beautiful data URI representation that serves as an offline export for high-end feel!
  const handleExportJSON = (debtor: Debtor) => {
    setIsExporting(debtor.id);
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(debtor, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `تقرير_مديونية_${debtor.name}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setIsExporting(null);
    }, 400);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top filter and title strip */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 dark:text-slate-200 font-sans flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            أرشيف المعاينة والملخصات الشاملة (جاهزة للطباعة والتصدير)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            هنا يمكنك تصفح ملخصات مفصلة مستطيلة لكل عميل على حدة، ومتابعة كافة الدفعات والمستندات وحفظها في ثوانٍ.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search bar inside the Tab */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم بالكامل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full sm:w-auto shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer font-sans ${
                filterType === 'all' ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer font-sans ${
                filterType === 'active' ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              النشطين
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer font-sans ${
                filterType === 'paid' ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              المسددين
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid for rectangular summary cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {filtered.map((d) => {
            const paid = getPaidTotal(d);
            const remaining = getRemainingTotal(d);
            const progress = d.originalAmount > 0 ? (paid / d.originalAmount) * 100 : 0;
            const hasPayments = d.payments && d.payments.length > 0;

            return (
              <div
                key={d.id}
                id={`debtor-summary-card-${d.id}`}
                data-civil-id={d.civilId}
                data-creditor-name={d.creditorName}
                data-start-date={d.startDate}
                data-original-amount={d.originalAmount.toFixed(2)}
                data-paid-amount={paid.toFixed(2)}
                data-remaining-amount={remaining.toFixed(2)}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
              >
                {/* Visual Status Indicator Badge */}
                <div className="absolute top-6 left-6 font-sans flex items-center gap-1.5">
                  {remaining <= 0 ? (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      خالص الدفع بالكامل
                    </span>
                  ) : isDebtorOverdue(d) ? (
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-200 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      متأخر عن السداد
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/40 px-3 py-1 rounded-full font-black flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      جارِ استخلاص المبالغ
                    </span>
                  )}

                  {onDeleteDebtor && (
                    <button
                      type="button"
                      data-html2canvas-ignore="true"
                      onClick={() => onDeleteDebtor(d.id, d.name)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer"
                      title="حذف المدين النهائي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Card Header Section with Icons */}
                <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-amber-505 shrink-0" />
                    <span>ملف مالي معتمد</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-mono text-[10px]">كود: #{d.id}</span>
                  </div>
                  
                  <h3 className={`text-lg font-black font-sans flex items-center gap-2 ${
                    isDebtorOverdue(d)
                      ? 'text-rose-600 dark:text-rose-450 font-extrabold'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    <User className="w-5 h-5 text-emerald-600 shrink-0" />
                    {d.name}
                    {isDebtorOverdue(d) && (
                      <span className="text-[10.5px] bg-rose-105 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 px-2 py-0.5 rounded-md font-bold">
                        متأخر ⚠️
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-550 dark:text-slate-400 pt-2 font-sans">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" /> الرقم المدني: <strong className="font-mono text-slate-800 dark:text-slate-100">{d.civilId}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> بداية جدولة الدين: <strong className="font-mono text-slate-800 dark:text-slate-100">{d.startDate}</strong>
                    </span>
                    <span className="flex items-center gap-1 sm:col-span-2 mt-1">
                      <FileCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" /> كفيل وممول العقد (الدائن): <strong className="text-indigo-700 dark:text-white font-black bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded-md">{d.creditorName}</strong>
                    </span>
                  </div>
                </div>

                {/* Financial Summary Meter */}
                <div className="grid grid-cols-3 gap-2 text-center py-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl my-4 text-xs font-sans">
                  <div>
                    <span className="text-[10px] text-slate-455 block mb-0.5">أصل الدين</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{d.originalAmount.toFixed(1)} د.ك</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-455 block mb-0.5">إجمالي المسدد</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{paid.toFixed(1)} د.ك</strong>
                  </div>
                  <div className="border-r border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-455 block mb-0.5">المتبقي المطلوب</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-mono">{remaining.toFixed(1)} د.ك</strong>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-1 mb-6 font-sans">
                  <div className="flex justify-between items-center text-[10px] text-slate-505 dark:text-slate-400">
                    <span>نسبة استيفاء المبالغ</span>
                    <span className="font-bold font-mono">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-l from-emerald-600 to-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Installments Accordion / List */}
                <div className="space-y-2 text-right">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 font-sans border-r-2 border-emerald-500 pr-2">
                    تفاصيل الأقساط الشهرية المجدولة:
                  </h4>
                  <div className="max-h-32 overflow-y-auto border border-slate-100 dark:border-slate-850 rounded-xl divide-y divide-slate-50 dark:divide-slate-850 bg-slate-50/20 dark:bg-slate-900/40">
                    {d.installments.map((inst) => {
                      const statusText = inst.status === 'paid' ? 'مسدد بالكامل' : inst.status === 'partial' ? 'مسدد جزئياً' : 'مستحق';
                      return (
                        <div
                          key={inst.id}
                          className="print-installment-row flex items-center justify-between p-2 text-[11px] font-sans"
                          data-index={`قسط #${inst.index}`}
                          data-due-date={inst.dueDate}
                          data-amount={inst.amount.toFixed(1)}
                          data-paid-amount={inst.paidAmount.toFixed(1)}
                          data-status={inst.status}
                          data-status-text={statusText}
                          data-paid-date={inst.paidDate || ''}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              inst.status === 'paid' ? 'bg-emerald-500' : inst.status === 'partial' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`} />
                            <span className="font-bold text-slate-800 dark:text-slate-200">الدعمة #{inst.index}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({inst.dueDate})</span>
                          </div>
                          
                          <div className="flex items-center gap-3 font-mono text-[10.5px]">
                            <span>القيمة: <strong className="text-slate-800 dark:text-slate-100">{inst.amount.toFixed(1)} د.ك</strong></span>
                            {inst.paidAmount > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                المدفوع: <strong>{inst.paidAmount.toFixed(1)} د.ك</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed recorded transactions if any */}
                {hasPayments && (
                  <div className="space-y-2 mt-4 text-right print-has-payments">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 font-sans border-r-2 border-indigo-500 pr-2">
                      سجل الدفعات الاستثنائية وتعديلات الحسبة:
                    </h4>
                    <div className="max-h-24 overflow-y-auto border border-slate-100 dark:border-slate-850 rounded-xl divide-y divide-slate-50 dark:divide-slate-850 bg-slate-50/20 dark:bg-slate-900/40">
                      {d.payments.map((p) => {
                        const styleText = p.reductionType === 'reduce_monthly' ? 'تقليل الأقساط بالتساوي' : 'تقليص عدد الشهور';
                        return (
                          <div
                            key={p.id}
                            className="print-payment-row p-2 text-[10px] font-sans flex flex-col gap-0.5"
                            data-date={p.date}
                            data-amount={p.amount.toFixed(1)}
                            data-type={styleText}
                            data-note={p.note || ''}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">دفعة: +{p.amount.toFixed(1)} د.ك</span>
                              <span className="text-slate-400 text-[9px] font-mono">{p.date}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 flex justify-between">
                              <span>نوع الإجراء: {styleText}</span>
                              {p.note && <span className="italic text-slate-455">"{p.note}"</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* signature data thumbnail if active */}
                {d.signatureData && (
                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-50 dark:border-slate-850/40">
                    <span className="text-[10px] text-slate-400 font-sans">توقيع المدين المعتمد في السند:</span>
                    <img
                      src={d.signatureData}
                      alt="توقيع المدين"
                      className="print-sig-img h-8 object-contain rounded-md border border-slate-200 bg-slate-50 p-1 dark:invert dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                )}

                {/* Card Action footer (Print, Preview, Export JSON) */}
                <div data-html2canvas-ignore="true" className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <button
                    onClick={() => handlePrintCard(d.id, d.name)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة الكشف
                  </button>

                  <button
                    onClick={() => setPreviewDebtor(d)}
                    className="py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    معاينة الكشف
                  </button>

                  <button
                    onClick={() => handleExportJSON(d)}
                    disabled={isExporting !== null}
                    className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                    تصدير مالي
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-12 rounded-3xl text-center text-slate-400 font-sans space-y-2">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
          <p className="text-sm font-bold">عذراً، لم نجد أي ملفات للمدينين تطابق البحث.</p>
        </div>
      )}

      {previewDebtor && (
        <DebtorPreviewModal debtor={previewDebtor} onClose={() => setPreviewDebtor(null)} />
      )}

    </div>
  );
}
