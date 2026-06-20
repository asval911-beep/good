import React, { useState, useEffect } from 'react';
import { Calculator, Percent, Coins, ArrowLeftRight, Sparkles, Plus, Minus, FileText, CheckCircle2, History, Delete, Trash2, ArrowUpRight } from 'lucide-react';

export default function InterestCalculator() {
  const [principal, setPrincipal] = useState<number>(() => {
    const saved = localStorage.getItem('kaabi_calc_principal');
    return saved ? parseFloat(saved) : 100;
  });
  const [interestRate, setInterestRate] = useState<number>(() => {
    const saved = localStorage.getItem('kaabi_calc_interestRate');
    return saved ? parseFloat(saved) : 2;
  });
  const [months, setMonths] = useState<number>(() => {
    const saved = localStorage.getItem('kaabi_calc_months');
    return saved ? parseInt(saved) : 6;
  });
  const [calcType, setCalcType] = useState<'simple' | 'flat_monthly'>(() => {
    const saved = localStorage.getItem('kaabi_calc_type');
    return (saved === 'flat_monthly' || saved === 'simple') ? saved : 'simple';
  });
  const [copied, setCopied] = useState(false);

  // Normal Calculator State
  const [standardInput, setStandardInput] = useState('');
  const [standardResult, setStandardResult] = useState('');
  const [calculatorHistory, setCalculatorHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('kaabi_calc_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Persist calculator selections and history
  useEffect(() => {
    localStorage.setItem('kaabi_calc_principal', principal.toString());
  }, [principal]);

  useEffect(() => {
    localStorage.setItem('kaabi_calc_interestRate', interestRate.toString());
  }, [interestRate]);

  useEffect(() => {
    localStorage.setItem('kaabi_calc_months', months.toString());
  }, [months]);

  useEffect(() => {
    localStorage.setItem('kaabi_calc_type', calcType);
  }, [calcType]);

  useEffect(() => {
    localStorage.setItem('kaabi_calc_history', JSON.stringify(calculatorHistory));
  }, [calculatorHistory]);

  // Quick select presets
  const ratePresets = [1, 2, 2.5, 3, 5, 10, 15, 20, 25, 30, 50];
  const principalPresets = [50, 100, 250, 500, 1000, 2500, 5000];

  // Mathematical outputs
  const [interestAmount, setInterestAmount] = useState<number>(2);
  const [totalWithInterest, setTotalWithInterest] = useState<number>(102);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(17);

  useEffect(() => {
    // Basic standard simple interest
    const calculatedInterest = (principal * interestRate) / 100;
    const total = principal + calculatedInterest;
    const installment = months > 0 ? total / months : total;

    setInterestAmount(calculatedInterest);
    setTotalWithInterest(total);
    setMonthlyInstallment(installment);
  }, [principal, interestRate, months]);

  // Standard Calculator Helpers
  const handleStandardPress = (val: string) => {
    if (val === 'C') {
      setStandardInput('');
      setStandardResult('');
    } else if (val === 'DEL') {
      const updated = standardInput.slice(0, -1);
      setStandardInput(updated);
      evaluateLive(updated);
    } else if (val === '=') {
      if (!standardInput) return;
      const computed = evaluateExp(standardInput);
      if (computed !== null) {
        const entry = `${standardInput} = ${computed}`;
        setCalculatorHistory(prev => [entry, ...prev].slice(0, 50));
        setStandardInput(computed.toString());
        setStandardResult('');
      }
    } else {
      const operators = ['+', '-', '×', '÷', '*', '/'];
      const lastChar = standardInput.slice(-1);
      if (operators.includes(val) && (operators.includes(lastChar) || standardInput === '')) {
        if (standardInput === '') return;
        const updated = standardInput.slice(0, -1) + val;
        setStandardInput(updated);
        return;
      }
      const updated = standardInput + val;
      setStandardInput(updated);
      evaluateLive(updated);
    }
  };

  const evaluateExp = (expr: string): string | null => {
    try {
      let clean = expr.replace(/×/g, '*').replace(/÷/g, '/');
      clean = clean.replace(/[^0-9+\-*/().\s]/g, '');
      if (!clean) return null;
      const fn = new Function(`return (${clean})`);
      const res = fn();
      if (typeof res === 'number' && isFinite(res)) {
        return parseFloat(res.toFixed(4)).toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const evaluateLive = (expr: string) => {
    if (!expr) {
      setStandardResult('');
      return;
    }
    const lastChar = expr.slice(-1);
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      const computed = evaluateExp(expr.slice(0, -1));
      if (computed !== null) setStandardResult(computed);
    } else {
      const computed = evaluateExp(expr);
      if (computed !== null) {
        if (computed !== expr) {
          setStandardResult(computed);
        } else {
          setStandardResult('');
        }
      }
    }
  };

  const handleCopyText = () => {
    const textToCopy = `📋 تفاصيل حسبة الفائدة المقترحة:
---------------------------
💵 المبلغ الأساسي: ${principal.toFixed(2)} د.ك
📈 نسبة الفائدة: ${interestRate}% 
💰 قيمة الفائدة المستخرجة: ${interestAmount.toFixed(2)} د.ك
⚖️ المبلغ الإجمالي المطلوب: ${totalWithInterest.toFixed(2)} د.ك
🗓️ مدة السداد المقترحة: ${months} أشهر
💸 الأقساط الشهرية المتوقعة: ${monthlyInstallment.toFixed(2)} د.ك شهرياً
---------------------------
من باب المعرفة والجدولة السريعة`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Existing Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-xs overflow-hidden animate-in fade-in duration-300 font-sans text-right" dir="rtl">
        
        {/* HEADER SECTION */}
        <div className="p-6 bg-linear-to-r from-emerald-600/5 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/10 border-b border-slate-100 dark:border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/10">
              <Calculator className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                حاسبة استخراج الفوائد والجدولة الاسترشادية
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                احسب الفوائد المضافة ووزّع القيمة الإجمالية على دفعات شهرية متساوية للمستفيدين من باب المعرفة.
              </p>
            </div>
          </div>
          
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <button
              onClick={() => setCalcType('simple')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                calcType === 'simple'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              فائدة كروكية بسيطة
            </button>
          </div>
        </div>

        {/* CORE WORKSPACE SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100 dark:divide-slate-850">
          
          {/* LEFT COLUMN: CONTROL INTERFACES */}
          <div className="p-6 lg:col-span-7 space-y-6">
            
            {/* PRINCIPAL AMOUNT INPUT */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  المبلغ الأساسي للحق المالي (رأس المال)
                </label>
                <span className="text-[11px] font-black font-mono text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 px-2 py-0.5 rounded-md">
                  د.ك (دينار كويتي)
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={principal || ''}
                  onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pr-4 pl-24 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 font-sans font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="أدخل مبلغ الاستحقاق الأساسي..."
                />
                <div className="absolute inset-y-1.5 left-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPrincipal(prev => Math.max(1, prev - 10))}
                    className="px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-50 hover:dark:bg-slate-850 transition-colors text-xs font-black cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrincipal(prev => prev + 10)}
                    className="px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-50 hover:dark:bg-slate-850 transition-colors text-xs font-black cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Quick selection chips for principal */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {principalPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPrincipal(preset)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                      principal === preset
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-955/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    {preset} د.ك
                  </button>
                ))}
              </div>
            </div>

            {/* INTEREST RATE INPUT */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-500" />
                  معدل الفائدة المضافة المطلوب (%)
                </label>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  أدخل الرقم مباشرة أو اختر من القائمة
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={interestRate || ''}
                  onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pr-4 pl-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 font-sans font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="2"
                />
                <span className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 font-bold font-sans text-sm">%</span>
              </div>

              {/* Quick index selectors as chips */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {ratePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInterestRate(preset)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                      interestRate === preset
                        ? 'bg-rose-600 text-white border-rose-605'
                        : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* DURATION (MONTHS) SLIDER & CONTAINER */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600" />
                  مدة التقسيط والجدولة المقترحة شهرياً
                </label>
                <span className="text-xs font-black font-sans text-teal-600 dark:text-teal-400">
                  {months} أشهر
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-hidden"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>شهر واحد</span>
                  <span>سنة (12)</span>
                  <span>سنتان (24)</span>
                  <span>3 سنوات (36)</span>
                  <span>5 سنوات (60)</span>
                </div>
              </div>

              {/* Fast month pickers */}
              <div className="flex flex-wrap gap-1.5">
                {[3, 6, 12, 18, 24, 36, 48, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonths(m)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border cursor-pointer ${
                      months === m
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {m >= 12 ? `${m / 12} سنة` : `${m} أشهر`}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: CALCULATION RESULTS CARD VISUALS */}
          <div className="p-6 lg:col-span-5 bg-slate-50 dark:bg-slate-950/40 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>مخرجات الحسبة الاستباقية الفورية</span>
              </div>

              {/* RESULTS bento grid UI */}
              <div className="space-y-3">
                
                {/* Box 1: Principal representation */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">رأس المال الأصلي:</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white font-mono">
                    {principal.toFixed(2)} د.ك
                  </span>
                </div>

                {/* Box 2: Interest Amount extracted */}
                <div className="p-4 bg-rose-50/45 dark:bg-rose-955/10 rounded-xl border border-rose-100/40 dark:border-rose-950/30 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="block text-xs text-rose-800 dark:text-rose-400 font-black">قيمة الفائدة الإضافية ({interestRate}%):</span>
                    <p className="text-[10px] text-rose-505 dark:text-rose-450 leading-none">تضاف تلقائياً للمستفيد من باب المعرفة</p>
                  </div>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-450 font-mono">
                    +{interestAmount.toFixed(2)} د.ك
                  </span>
                </div>

                {/* Box 3: Total new Amount */}
                <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl border border-emerald-500/10 dark:border-emerald-500/5 flex justify-between items-center">
                  <div>
                    <span className="block text-xs text-emerald-800 dark:text-emerald-400 font-black">المبلغ الإجمالي الجديد:</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">(شاملاً الفوائد لتسجيل السند المالي)</span>
                  </div>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {totalWithInterest.toFixed(2)} د.ك
                  </span>
                </div>

                {/* Box 4: Expected monthly installment */}
                <div className="p-4 bg-sky-50 dark:bg-sky-950/10 rounded-xl border border-sky-100 dark:border-sky-950/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block text-xs text-sky-800 dark:text-sky-400 font-black">القسط الشهري المتوقع:</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">على مدار {months} أقساط شهرية</span>
                    </div>
                    <span className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
                      {monthlyInstallment.toFixed(2)} د.ك
                    </span>
                  </div>
                </div>

              </div>

              {/* Explanatory text formula */}
              <div className="p-3.5 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-905/30 rounded-xl text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed font-sans">
                <strong>💡 طريقة احتساب المعادلة:</strong><br />
                مضافاً مبلغ رأس المال <span className="font-mono">({principal} د.ك)</span> مع الفوائد المضافة المستخرجة <span className="font-mono">({principal} × {interestRate}% = {interestAmount} د.ك)</span>، ليصبح المجموع الكلي <span className="font-mono">({totalWithInterest} د.ك)</span> ويُجزّء على دفعات شهرية قيمتها لراحة العميل <span className="font-mono">({monthlyInstallment.toFixed(2)} د.ك)</span> شهرياً.
              </div>
            </div>

            {/* EXCEL/TEXT EXPORT OPTION */}
            <button
              type="button"
              onClick={handleCopyText}
              className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                copied 
                  ? 'bg-emerald-600 text-white animate-bounce' 
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-slate-100'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم نسخ التقرير الحسابي بنجاح!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>نسخ كشف الحسبة والتقرير للمقاصة</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

      {/* NEW: Premium Normal Advanced Calculator Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-850 p-6 shadow-sm space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-550/10">
              <Calculator className="w-6 h-6 text-yellow-350" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                الآلة الحاسبة السريعة المتطورة
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                أداة فورية مدمجة لإتمام عمليات الطرح والجمع والضرب والقسمة بمسار حساب دقيق.
              </p>
            </div>
          </div>
          
          {calculatorHistory.length > 0 && (
            <button
              onClick={() => setCalculatorHistory([])}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              مسح سجل العمليات
            </button>
          )}
        </div>

        {/* WORKSPACE BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: DIGITAL CALCULATION HISTORY TAPE */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 h-[360px] flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <History className="w-3.5 h-3.5 text-indigo-550" />
                <span>شريط حساب العمليات السابقة (مسودة)</span>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">شاشتك الحفظية لمراجعة العمليات السابقة ومقاصة السندات في خطوة واحدة.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1 divide-y divide-slate-100 dark:divide-slate-850">
              {calculatorHistory.length > 0 ? (
                calculatorHistory.map((item, idx) => (
                  <div key={idx} className="pt-2 text-right font-mono text-xs flex justify-between items-center group">
                    <span className="text-slate-500 dark:text-slate-400 block truncate max-w-[180px] text-right" dir="ltr">{item.split('=')[0]}</span>
                    <button
                      onClick={() => {
                        const resVal = item.split('=')[1]?.trim();
                        if (resVal) {
                          setStandardInput(resVal);
                          setStandardResult('');
                        }
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                      title="استعد القيمة كمدخل"
                    >
                      <span className="text-sm font-black text-slate-950 dark:text-white"> = {item.split('=')[1]}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 py-12 space-y-2">
                  <Calculator className="w-8 h-8 opacity-25" />
                  <span className="text-[10px] font-medium block">لا توجد عمليات مسجلة حالياً</span>
                </div>
              )}
            </div>

            <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center border-t border-slate-200 dark:border-slate-800 pt-2 font-mono">
              اضغط على النتيجة لإعادة استحضارها بالآلة
            </div>
          </div>

          {/* RIGHT PANEL: INTERACTIVE PHYSICAL KEYS AND GLASS DISPLAY */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* CALCULATOR DISPLAY: RETINA TAPE STYLE */}
            <div className="bg-slate-950 dark:bg-black border-2 border-slate-850 dark:border-slate-900 rounded-2xl p-4 text-right flex flex-col justify-between h-28 shadow-inner overflow-hidden font-mono relative">
              <span className="absolute top-2 left-3 text-[9.5px] font-bold text-indigo-400 uppercase tracking-widest font-sans">Retina Calc</span>
              
              <div className="text-slate-500 text-xs truncate pt-2 overflow-x-auto overflow-y-hidden select-all text-left font-bold" dir="ltr">
                {standardInput || '0'}
              </div>
              
              <div className="text-white text-3xl font-black truncate text-left flex justify-between items-center" dir="ltr">
                <span className="text-slate-600 text-sm font-sans font-black mr-2 bg-slate-900/60 px-2 py-0.5 rounded-md self-end mb-1">
                  {standardResult ? 'نتيجة فورية...' : 'الحصيلة'}
                </span>
                <span>
                  {standardResult || evaluateExp(standardInput) || '0'}
                </span>
              </div>
            </div>

            {/* INTEGRATED TOUCH NUMPAD */}
            <div className="grid grid-cols-4 gap-2 text-center" dir="ltr">
              {/* Row 1 */}
              <button
                onClick={() => handleStandardPress('C')}
                className="py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 font-black text-sm rounded-xl cursor-pointer transition-all active:scale-95"
              >
                C
              </button>
              <button
                onClick={() => handleStandardPress('(')}
                className="py-3 bg-slate-105 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-black text-sm rounded-xl cursor-pointer transition-all active:scale-95"
              >
                (
              </button>
              <button
                onClick={() => handleStandardPress(')')}
                className="py-3 bg-slate-105 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-black text-sm rounded-xl cursor-pointer transition-all active:scale-95"
              >
                )
              </button>
              <button
                onClick={() => handleStandardPress('÷')}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl cursor-pointer transition-all active:scale-95"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                onClick={() => handleStandardPress('7')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                7
              </button>
              <button
                onClick={() => handleStandardPress('8')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                8
              </button>
              <button
                onClick={() => handleStandardPress('9')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                9
              </button>
              <button
                onClick={() => handleStandardPress('×')}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl cursor-pointer transition-all active:scale-95"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                onClick={() => handleStandardPress('4')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                4
              </button>
              <button
                onClick={() => handleStandardPress('5')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                5
              </button>
              <button
                onClick={() => handleStandardPress('6')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                6
              </button>
              <button
                onClick={() => handleStandardPress('-')}
                className="py-3 bg-emerald-600 hover:bg-emerald-505 text-white font-black text-2xl rounded-xl cursor-pointer transition-all active:scale-95"
              >
                -
              </button>

              {/* Row 4 */}
              <button
                onClick={() => handleStandardPress('1')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                1
              </button>
              <button
                onClick={() => handleStandardPress('2')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                2
              </button>
              <button
                onClick={() => handleStandardPress('3')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                3
              </button>
              <button
                onClick={() => handleStandardPress('+')}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-xl cursor-pointer transition-all active:scale-95"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                onClick={() => handleStandardPress('0')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                0
              </button>
              <button
                onClick={() => handleStandardPress('.')}
                className="py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-150 dark:border-slate-800"
              >
                .
              </button>
              <button
                onClick={() => handleStandardPress('DEL')}
                className="py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-95"
              >
                <Delete className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => handleStandardPress('=')}
                className="py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xl rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-500/10 active:scale-95"
              >
                =
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
