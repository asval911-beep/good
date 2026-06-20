import React, { useRef, useState } from 'react';
import { Download, Printer, Landmark, CheckSquare, Calendar, ChevronLeft, CreditCard, Award, PenTool } from 'lucide-react';
import { Debtor } from '../types';
import { getPaidTotal, getRemainingTotal, applyHtml2CanvasSafeOklchClone, safeHtml2Canvas } from '../utils/finance';
import { GoogleGenAI } from '@google/genai'; // Not directly needed here but we keep major imports high

interface BondReceiptProps {
  debtor: Debtor;
  onUpdateDebtorSignature: (debtorId: string, signatureBase64: string) => void;
}

export default function BondReceipt({ debtor, onUpdateDebtorSignature }: BondReceiptProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hudMessage, setHudMessage] = useState('');

  const paidAmount = getPaidTotal(debtor);
  const remainingAmount = getRemainingTotal(debtor);
  const futureInstallments = debtor.installments.filter(inst => inst.status !== 'paid');

  const todayStr = new Date().toLocaleDateString('ar-KW-u-nu-latn', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownloadImage = async () => {
    if (!printAreaRef.current) return;
    setIsCapturing(true);
    setHudMessage('جاري جلب السند وتحويله إلى صورة...');

    try {
      // Small timeout to allow state rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await safeHtml2Canvas(printAreaRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff', // Force clean white background for the printed contract image
        scrollX: 0,
        scrollY: 0,
        width: 794,
        height: printAreaRef.current.scrollHeight,
        windowWidth: 794,
        windowHeight: printAreaRef.current.scrollHeight + 200,
        onclone: (clonedDoc: Document) => {
          if (document.documentElement.classList.contains('dark')) {
            clonedDoc.documentElement.classList.add('dark');
          }
          if (document.body.classList.contains('dark')) {
            clonedDoc.body.classList.add('dark');
          }
          const clonedEl = clonedDoc.getElementById('formatted-bond-container');
          if (clonedEl && printAreaRef.current) {
            clonedEl.style.position = 'absolute';
            clonedEl.style.top = '0';
            clonedEl.style.left = '0';
            clonedEl.style.width = '794px'; // Standard A4 layout width in pixels approximately
            clonedEl.style.height = 'auto';
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.overflow = 'visible';
            clonedEl.style.margin = '0';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.padding = '40px';
            clonedEl.style.color = '#000000';
            
            clonedDoc.body.innerHTML = '';
            clonedDoc.body.appendChild(clonedEl);

            applyHtml2CanvasSafeOklchClone(printAreaRef.current, clonedEl, clonedDoc);
          }
        }
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `سند_دين_${debtor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      
      setHudMessage('تم حفظ الصورة بنجاح في جهازك!');
      setTimeout(() => setHudMessage(''), 3000);
    } catch (err) {
      console.error('Failed to export image', err);
      setHudMessage('حدث خطأ أثناء تصدير الصورة، يرجى المحاولة لاحقاً');
      setTimeout(() => setHudMessage(''), 3500);
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4" dir="rtl">
      
      {/* Control Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 font-sans">
        <div className="text-slate-650 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>توليد وتوثيق السند المالي الرسمي وجدول الأقساط القادمة كصورة أو طباعة ورقية</span>
        </div>
        
        <div className="flex gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/60 dark:text-indigo-405 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة السند / حفظ كـ PDF
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all transition-colors cursor-pointer disabled:bg-slate-300 shadow-sm"
          >
            <Download className="w-4 h-4" />
            {isCapturing ? 'جاري التوليد...' : 'حفظ سند الدين كصورة (معاينة المتسلف)'}
          </button>
        </div>
      </div>

      {hudMessage && (
        <div className="text-center p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl font-sans animate-pulse">
          {hudMessage}
        </div>
      )}

      {/* Printable / Snapshot Area */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white text-slate-900 p-1 md:p-8 rounded-3xl shadow-sm max-w-3xl mx-auto overflow-hidden">
        
        <div
          id="formatted-bond-container"
          ref={printAreaRef}
          className="bg-white text-slate-900 p-8 md:p-12 space-y-8 border-4 border-double border-slate-300 rounded-2xl relative"
          style={{ width: '100%', minHeight: '800px', fontFamily: '"Cairo", "Tajawal", sans-serif' }}
        >
          {/* Subtle elegant watermarks */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.015] flex items-center justify-center">
            <Landmark className="w-96 h-96 text-slate-900" />
          </div>

          <div className="absolute top-2 right-2 left-2 bottom-2 border border-slate-150 rounded-lg pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-200 pb-5 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-slate-900 text-white">
                  <Landmark className="w-5 h-5 text-amber-400" />
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  الكعبي <span className="text-emerald-600">money</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                AL-KAABI DEBT MANAGEMENT SYSTEM
              </p>
            </div>
            
            <div className="text-left font-sans">
              <span className="text-xs font-bold text-slate-400 block mb-0.5">سند مالي معتمد</span>
              <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md inline-block font-mono">
                DEBT-BOND #{debtor.id.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Central Title */}
          <div className="text-center relative z-10 my-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-wide border-b-2 border-emerald-600 inline-block pb-1.5 px-6">
              سند دين وجدولة أقساط مالية
            </h2>
          </div>

          {/* Statement Body Text */}
          <div className="space-y-4 text-justify font-sans text-sm text-slate-800 leading-relaxed relative z-10 border-r-4 border-emerald-600 pr-4 bg-emerald-50/20 py-4 pl-3 rounded-l-xl">
            <p>
              يوافق هذا السند ويشهد رسمياً في تاريخ اليوم: {todayStr} (الموافق للتقويم في البرنامج)، الخاضع للبيانات التالية:
            </p>
            
            <p className="indent-4 leading-loose">
              بأن الفاضل المقرض (الدائن): <span className="font-extrabold text-slate-950 underline">{debtor.creditorName}</span> قد سلّم بالفعل وسلّف يداً بيد الفاضل المستلم (المدين): <span className="font-extrabold text-slate-950 underline">{debtor.name}</span>، الحامل للرقم المدني الرسمي المعتمد: <span className="font-extrabold font-mono text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded-sm">{debtor.civilId}</span>،
              مبلغاً أساسياً إجمالياً وقدره وصرفـه: <span className="font-extrabold text-emerald-700 underline font-mono">{debtor.originalAmount.toFixed(2)} د.ك</span> (فقط دينار كويتي)، ليكون بذمته المشتركة كدين مستحق الأداء على شكل أقساط شهرية مجدولة.
            </p>

            <p className="indent-4 leading-loose">
              وقد استلم المقرض من العميل المدين إلى غاية اليوم تراكماً إجمالياً وقدره: <span className="font-extrabold text-indigo-700 underline font-mono">{paidAmount.toFixed(2)} د.ك</span>. وبذلك يكون المتبقي والمستحق واجب السداد بذمة المدين بالتفصيل إلى غاية هذا اليوم هو: <span className="font-extrabold text-rose-600 underline font-mono">{remainingAmount.toFixed(2)} د.ك</span>.
            </p>
          </div>

          {/* Summary Mini Cards */}
          <div className="grid grid-cols-3 gap-3 text-center my-6 relative z-10 leading-none">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
              <span className="text-[10px] text-slate-500 block mb-1">المبلغ الأساسي للحق</span>
              <span className="text-sm font-black text-slate-900 font-mono">{debtor.originalAmount.toFixed(2)} د.ك</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-150">
              <span className="text-[10px] text-emerald-700 block mb-1">المدفوع المستلم الكلي</span>
              <span className="text-sm font-black text-emerald-800 font-mono">{paidAmount.toFixed(2)} د.ك</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-150">
              <span className="text-[10px] text-rose-700 block mb-1">المتبقي المطلوب للوفاء</span>
              <span className="text-sm font-black text-rose-800 font-mono">{remainingAmount.toFixed(2)} د.ك</span>
            </div>
          </div>

          {/* Embedded Civil ID photo option inside the Bond voucher (ووضع صورة البطاقة المدنية بالوصل) */}
          {debtor.civilIdImage && (
            <div className="p-3 border border-slate-200 bg-slate-50/40 rounded-xl relative z-10 space-y-1.5 font-sans">
              <span className="text-[11px] font-black text-slate-700 block border-b pb-1 dark:text-slate-900">
                📎 مرفق البطاقة المدنية الرسمية للموثق بذمته الدين:
              </span>
              <div className="flex items-center gap-4 bg-white p-2 border border-slate-150 rounded-lg">
                <img
                  src={debtor.civilIdImage}
                  alt="البطاقة المدنية للمدين"
                  className="h-24 w-auto object-contain rounded-md border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="text-right text-[11px] space-y-1 text-slate-600 dark:text-slate-700">
                  <p>الاسم: <span className="font-bold text-slate-950">{debtor.name}</span></p>
                  <p>الرقم المدني: <span className="font-bold font-mono text-slate-950">{debtor.civilId}</span></p>
                  <p>الحالة: <span className="bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded text-[10px]">موثق رسمي بالبطاقة الشخصية</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Installments Breakdown Section */}
          <div className="space-y-3 relative z-10">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-1.5 font-sans">
              <Calendar className="w-4 h-4 text-emerald-600" />
              أقرب مواعيد الدفعات القادمة المستحقة مستقبلاً:
            </h3>

            {futureInstallments.length > 0 ? (
              <div className="overflow-hidden border border-slate-150 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-sans">
                      <th className="p-2.5 font-bold">رقم القسط</th>
                      <th className="p-2.5 font-bold">تاريخ الاستحقاق</th>
                      <th className="p-2.5 font-bold">المبلغ المطلوب</th>
                      <th className="p-2.5 font-bold">الحالة الحالية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureInstallments.slice(0, 8).map((inst) => (
                      <tr key={inst.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                        <td className="p-2.5 font-black text-slate-900 font-mono">القسط #{inst.index}</td>
                        <td className="p-2.5 text-slate-700 font-mono">{inst.dueDate}</td>
                        <td className="p-2.5 font-bold text-slate-900 font-mono">{inst.amount.toFixed(2)} د.ك</td>
                        <td className="p-2.5 text-[10px] font-sans">
                          {inst.status === 'partial' ? (
                            <span className="inline-block bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-sm font-bold border border-amber-100">مسدد جزئياً ({inst.paidAmount} د.ك)</span>
                          ) : (
                            <span className="inline-block bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-sm font-bold border border-rose-100">مطلوب الالتزام بدفعه</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {futureInstallments.length > 8 && (
                      <tr className="bg-slate-50/25">
                        <td colSpan={4} className="p-2 text-center text-[10px] text-slate-500 font-serif">
                          ويستمر المدين بدفع بقية الأقساط الـ ({futureInstallments.length - 8}) الباقية شهرياً كما هو مسجل في المنظومة المعتمدة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-bold font-sans">
                ✓ تم سداد الدين بالكامل وإبراء ذمة الطرف الآخر بشكل تام ونهائي!
              </div>
            )}
          </div>

          {/* Legal statement */}
          <div className="text-[10px] text-slate-400 font-sans text-center border-t border-slate-200 pt-3 flex justify-between">
            <span>تاريخ توليد السند: {new Date().toISOString().split('T')[0]}</span>
            <span>بموافقة ودراية الطرفين المشتركين - تطوير: سلطان دهراب</span>
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-10 relative z-10 font-sans">
            
            {/* Creditor Signature Box (Left) */}
            <div className="text-center space-y-4">
              <span className="text-xs font-bold text-slate-500 block">توقيع المقرض الدائن (معطي الأموال):</span>
              <div className="h-20 flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-2 bg-slate-50/60 select-none">
                <span className="text-xs font-bold font-serif text-slate-700 border-b-2 border-slate-400 border-teal-650 px-3 py-1">
                  {debtor.creditorName}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">صاحب رأس المال المسلم</span>
            </div>

            {/* Debtor Signature Box (Right) */}
            <div className="text-center space-y-4">
              <span className="text-xs font-bold text-slate-500 block">توقيع العميل المستلم (المرسل إليه المدين):</span>
              <div className="h-20 flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-1 bg-slate-50/60 overflow-hidden relative">
                {debtor.signatureData ? (
                  <img
                    src={debtor.signatureData}
                    alt="التوقيع الرقمي للمدين"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] text-rose-500 font-bold border border-dashed border-rose-200 px-3 py-1 rounded bg-rose-50 animate-pulse">
                    ⚠️ لم يوقع المدين بعد
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">المتعهد بالدفع والإرجاع التام</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
