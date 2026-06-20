import React from 'react';
import { X, Printer, Image, CheckCircle, Clock, AlertCircle, Sparkles, CreditCard, Calendar, User } from 'lucide-react';
import { Debtor } from '../types';
import { getPaidTotal, getRemainingTotal, isDebtorOverdue, applyHtml2CanvasSafeOklchClone, safeHtml2Canvas } from '../utils/finance';

interface DebtorPreviewModalProps {
  debtor: Debtor;
  onClose: () => void;
}

export default function DebtorPreviewModal({ debtor, onClose }: DebtorPreviewModalProps) {
  const paid = getPaidTotal(debtor);
  const remaining = getRemainingTotal(debtor);
  const isOverdue = isDebtorOverdue(debtor);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح للنوافذ المنبثقة لطباعة المعاينة');
      return;
    }

    const htmlContent = `
      <html dir="rtl" lang="ar">
        <head>
          <title>معاينة كشف مديونية - ${debtor.name}</title>
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
            }
            .header {
              border-bottom: 2px solid #10b981;
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
              background: #f0fdf4;
              border: 1.5px solid #bbf7d0;
              padding: 15px;
              border-radius: 12px;
            }
            .finance-box.remaining {
              background: #fef2f2;
              border-color: #fecaca;
            }
            .finance-box.total {
              background: #eff6ff;
              border-color: #bfdbfe;
            }
            .tbl {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .tbl th, .tbl td {
              border: 1px solid #e2e8f0;
              padding: 10px;
              text-align: right;
              font-size: 13px;
            }
            .tbl th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            .status-badge {
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: bold;
              display: inline-block;
            }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
            .footer-signature {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 13px;
            }
            .stamp {
              border: 2px dashed #059669;
              color: #059669;
              padding: 8px 15px;
              border-radius: 8px;
              font-weight: bold;
              transform: rotate(-3deg);
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <h1 class="title">سند كشف حساب مالي رسمي</h1>
                <div style="font-size:12px; color:#64748b; margin-top:4px;">مكتب إدارة التحصيل والجدولة الرقمي للأقساط</div>
              </div>
              <div class="stamp">معتمد الكترونياً</div>
            </div>

            <div class="grid-info">
              <div class="info-item">الاسم الكامل: <strong>${debtor.name}</strong></div>
              <div class="info-item">الرقم المدني: <strong>${debtor.civilId}</strong></div>
              <div class="info-item">بداية العقد وجدولة الدفعات: <strong>${debtor.startDate}</strong></div>
              <div class="info-item">كفيل معطي المال (الدائن): <strong>${debtor.creditorName}</strong></div>
              <div class="info-item">يوم القسط المتفق عليه: <strong>يوم ${debtor.dueDay || new Date(debtor.startDate).getDate()} من كل شهر</strong></div>
              <div class="info-item">الحالة العامة للمدين: <strong>${isOverdue ? 'متأخر ومطلوب السداد فوراً ⚠️' : 'منتظم أو مستحق الدفع'}</strong></div>
            </div>

            <main class="finance-strip">
              <div class="finance-box total">
                <div style="font-size:11px; color:#1e40af;">مبلغ الدين الأساسي</div>
                <div style="font-size:18px; font-weight:900; color:#1e3a8a; margin-top:5px;">${debtor.originalAmount.toFixed(2)} د.ك</div>
              </div>
              <div class="finance-box">
                <div style="font-size:11px; color:#166534;">المسدد الكلي حتى الآن</div>
                <div style="font-size:18px; font-weight:900; color:#14532d; margin-top:5px;">${paid.toFixed(2)} د.ك</div>
              </div>
              <div class="finance-box remaining">
                <div style="font-size:11px; color:#991b1b;">المتبقي غير المسترد</div>
                <div style="font-size:18px; font-weight:900; color:#7f1d1d; margin-top:5px;">${remaining.toFixed(2)} د.ك</div>
              </div>
            </main>

            <h3 style="font-size:15px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:10px;">جدول الأقساط الشهرية والتزام السداد:</h3>
            <table class="tbl">
              <thead>
                <tr>
                  <th>قسط شهر</th>
                  <th>تاريخ الاستحقاق الدقيق</th>
                  <th>قيمة القسط</th>
                  <th>المسدد الفعلي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${debtor.installments.map((inst, index) => {
                  let badgeClass = 'status-pending';
                  let statusLabel = 'معلق للدفع';
                  const todayStr = new Date().toISOString().split('T')[0];

                  if (inst.status === 'paid') {
                    badgeClass = 'status-paid';
                    statusLabel = 'مسدد بالكامل';
                  } else if (inst.dueDate < todayStr) {
                    badgeClass = 'status-overdue';
                    statusLabel = 'متأخر عن السداد ⚠️';
                  }

                  return `
                    <tr>
                      <td>قسط #${index + 1}</td>
                      <td style="font-family:'JetBrains Mono'; font-weight:bold;">${inst.dueDate}</td>
                      <td style="font-weight:bold;">${inst.amount.toFixed(2)} د.ك</td>
                      <td style="font-weight:bold; color:#166534;">${(inst.paidAmount || 0).toFixed(2)} د.ك</td>
                      <td><span class="status-badge ${badgeClass}">${statusLabel}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="footer-signature">
              <div>
                <p>توقيع المدين الملتزم بالدفع:</p>
                <div style="height:50px;">
                  ${debtor.signatureData ? `<img src="${debtor.signatureData}" style="max-height:45px; object-fit:contain;" />` : `<span style="color:#94a3b8; font-style:italic;">موقع الكترونياً بملف معتمد</span>`}
                </div>
              </div>
              <div>
                <p>توقيع واعتماد محصل الديون:</p>
                <div style="font-weight:bold; color:#047857; margin-top:15px;">مصادق ومراجع رقمياً</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSaveAsImage = async () => {
    const element = document.getElementById('printable-preview-card');
    if (!element) return;

    try {
      const canvas = await safeHtml2Canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        width: 800,
        height: element.scrollHeight,
        windowWidth: 800,
        windowHeight: element.scrollHeight + 200,
        onclone: (clonedDoc: Document) => {
          // Force light mode on the cloned document for clean white card rendering
          try {
            clonedDoc.documentElement.classList.remove('dark');
            clonedDoc.body.classList.remove('dark');
          } catch (e) {}

          const clonedEl = clonedDoc.getElementById('printable-preview-card');
          if (clonedEl) {
            // Isolate the print card at the top of the body of clonedDoc to prevent modal scroll-clipping
            clonedEl.style.position = 'absolute';
            clonedEl.style.top = '0';
            clonedEl.style.left = '0';
            clonedEl.style.width = '800px'; // pristine standard printable width
            clonedEl.style.height = 'auto';
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.overflow = 'visible';
            clonedEl.style.margin = '0';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.backgroundColor = '#ffffff';
            clonedEl.style.color = '#000000';
            
            clonedDoc.body.innerHTML = '';
            clonedDoc.body.appendChild(clonedEl);

            applyHtml2CanvasSafeOklchClone(element, clonedEl, clonedDoc);
          }
        }
      });

      const image = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", image);
      downloadAnchor.setAttribute("download", `معاينة_كشف_مديونية_${debtor.name}.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error saving preview as image:', err);
      alert('حدث خطأ أثناء حفظ الصورة.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col my-8 border border-slate-150 dark:border-slate-800">
        
        {/* Header toolbar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white p-1 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">معاينة وتدقيق سند كشف الحساب</h3>
              <p className="text-[10px] text-slate-450">مستند رسمي معتمد للحفظ والطباعة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة الآن
            </button>
            <button
              onClick={handleSaveAsImage}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-505 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
            >
              <Image className="w-3.5 h-3.5" />
              حفظ كصورة PNG
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Paper Canvas Area */}
        <div className="p-6 md:p-10 max-h-[75vh] overflow-y-auto bg-slate-200 dark:bg-slate-900 flex justify-center">
          
          {/* Printable Invoice Sheet Sheet */}
          <div
            id="printable-preview-card"
            className="bg-white text-slate-900 p-8 md:p-12 rounded-2xl w-full max-w-3xl border border-slate-350 shadow-xl relative text-right"
            style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
          >
            {/* Header ornament */}
            <div className="border-b-4 border-double pb-5 mb-6 flex justify-between items-center" style={{ borderBottomColor: '#059669' }}>
              <div>
                <h1 className="text-xl font-black" style={{ color: '#047857' }}>سند كشف حساب مالي معتمد</h1>
                <p className="text-[10.5px] mt-1" style={{ color: '#4b5563' }}>مكتب كشوفات وجدولة مبالغ الدائنين</p>
              </div>
              <div className="border-2 border-dashed text-xs px-3 py-1.5 rounded-lg font-black rotate-[-3deg] uppercase shrink-0" style={{ borderColor: '#059669', color: '#059669' }}>
                مصدق ومعتمد 🏛️
              </div>
            </div>

            {/* Debtor Meta Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-5 rounded-2xl mb-6 text-xs leading-relaxed" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}>
              <div>الاسم الكامل للمدين: <strong className="font-sans" style={{ color: '#0f172a' }}>{debtor.name}</strong></div>
              <div>الرقم المدني: <strong className="font-mono" style={{ color: '#0f172a' }}>{debtor.civilId}</strong></div>
              <div>تاريخ التعاقد والبدء: <strong className="font-mono" style={{ color: '#0f172a' }}>{debtor.startDate}</strong></div>
              <div>الكفيل معطي المال (الدائن): <strong className="font-sans" style={{ color: '#0f172a' }}>{debtor.creditorName}</strong></div>
              <div>يوم القسط الشهري: <strong className="font-mono" style={{ color: '#0f172a' }}>يوم {debtor.dueDay || new Date(debtor.startDate).getDate()} من كل شهر</strong></div>
              <div>الحساب الإجمالي للمدين: <strong className={isOverdue ? "text-rose-700" : ""} style={{ color: isOverdue ? '#b91c1c' : '#0f172a' }}>{isOverdue ? '⚠️ متأخر وعاجل السداد' : 'منتظم الدفع'}</strong></div>
            </div>

            {/* Financial Status Strips */}
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="border p-4 rounded-xl" style={{ backgroundColor: '#f5f7ff', borderColor: '#cbd5e1', color: '#1e1b4b' }}>
                <span className="text-[9.5px] font-bold block mb-1" style={{ color: '#4338ca' }}>إجمالي مبلغ الدين</span>
                <span className="font-mono text-base font-black" style={{ color: '#312e81' }}>{debtor.originalAmount.toFixed(2)} د.ك</span>
              </div>
              <div className="border p-4 rounded-xl" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#064e3b' }}>
                <span className="text-[9.5px] font-bold block mb-1" style={{ color: '#059669' }}>المبلغ المسدد بالفعل</span>
                <span className="font-mono text-base font-black" style={{ color: '#064e3b' }}>{paid.toFixed(2)} د.ك</span>
              </div>
              <div className="border p-4 rounded-xl" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#7f1d1d' }}>
                <span className="text-[9.5px] font-bold block mb-1" style={{ color: '#dc2626' }}>المتبقي المطلوب التزامه</span>
                <span className="font-mono text-base font-black" style={{ color: '#7f1d1d' }}>{remaining.toFixed(2)} د.ك</span>
              </div>
            </div>

            {/* Installments Breakdown Table */}
            <h3 className="text-xs font-black mb-3 border-r-2 pr-2 pb-0.5" style={{ color: '#1e293b', borderRightColor: '#059669' }}>جدول توزيع الأقساط الشهرية المسجلة:</h3>
            <div className="border rounded-xl overflow-hidden mb-6" style={{ borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}>
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: '#f1f5f9', borderBottomColor: '#cbd5e1', color: '#334155' }}>
                    <th className="p-2.5 font-bold">رقم القسط</th>
                    <th className="p-2.5 font-bold border-r" style={{ borderRightColor: '#cbd5e1' }}>تاريخ الاستحقاق</th>
                    <th className="p-2.5 font-bold border-r" style={{ borderRightColor: '#cbd5e1' }}>مبلغ القسط</th>
                    <th className="p-2.5 font-bold border-r" style={{ borderRightColor: '#cbd5e1' }}>المسدد الفعلي</th>
                    <th className="p-2.5 font-bold border-r" style={{ borderRightColor: '#cbd5e1' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800" style={{ color: '#1e293b', divideColor: '#cbd5e1' }}>
                  {debtor.installments.map((inst, index) => {
                    const isPaid = inst.status === 'paid';
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdueInstallment = !isPaid && (inst.dueDate < todayStr);
                    
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/50" style={{ borderBottomColor: '#e2e8f0' }}>
                        <td className="p-2.5">قسط #{index + 1}</td>
                        <td className="p-2.5 border-r font-mono font-bold" style={{ borderRightColor: '#cbd5e1' }}>{inst.dueDate}</td>
                        <td className="p-2.5 border-r font-mono" style={{ borderRightColor: '#cbd5e1' }}>{inst.amount.toFixed(2)} د.ك</td>
                        <td className="p-2.5 border-r font-mono text-emerald-700" style={{ borderRightColor: '#cbd5e1', color: '#047857' }}>{(inst.paidAmount || 0).toFixed(2)} د.ك</td>
                        <td className="p-2.5 border-r" style={{ borderRightColor: '#cbd5e1' }}>
                          {isPaid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>مسدد بالكامل</span>
                          ) : isOverdueInstallment ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-black" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>متأخر عن المطلوب ⚠️</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>غير مسترجع</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Extra documented payments if any */}
            {debtor.payments && debtor.payments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-black mb-2 border-r-2 pr-2 pb-0.5" style={{ color: '#1e293b', borderRightColor: '#6366f1' }}>سجل التعديلات والدفعات الاستثنائية:</h4>
                <div className="border rounded-xl divide-y p-2 text-[11px]" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc', divideColor: '#cbd5e1', color: '#1e293b' }}>
                  {debtor.payments.map((p) => (
                    <div key={p.id} className="py-1.5 px-2 flex justify-between font-mono" style={{ borderBottomColor: '#cbd5e1' }}>
                      <span>دفعة استثنائية: <strong style={{ color: '#0f172a' }}>+{p.amount.toFixed(2)} د.ك</strong></span>
                      <span style={{ color: '#64748b' }}>{p.date} - {p.note || 'حسبة وتقليل أقساط'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Footers */}
            <div className="mt-8 pt-6 border-t flex justify-between items-end text-xs leading-relaxed" style={{ borderTopColor: '#cbd5e1', color: '#4b5563' }}>
              <div>
                <p className="font-bold" style={{ color: '#1e293b' }}>مضى وموقع من المدين الملتزم:</p>
                <div className="mt-2 h-14 w-44 border rounded-lg flex items-center justify-center overflow-hidden" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
                  {debtor.signatureData ? (
                    <img src={debtor.signatureData} alt="توقيع المدين" className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] italic" style={{ color: '#94a3b8' }}>موقع الكترونياً ومعتمد بالعقد</span>
                  )}
                </div>
              </div>

              <div className="text-left font-sans">
                <p className="font-bold" style={{ color: '#1e293b' }}>الجهة الموثقة والمراجعة:</p>
                <p className="font-bold mt-4" style={{ color: '#047857' }}>مصادق رقمياً وموثق لضمان الحقوق الكترونياً</p>
                <p className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>{new Date().toISOString().split('T')[0]}</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
