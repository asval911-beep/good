import { Debtor, Installment, PaymentRecord } from '../types';
import html2canvas from 'html2canvas';

/**
 * Generates the initial standard scheduled installments
 */
export function generateInitialSchedule(
  originalAmount: number,
  installmentsCount: number,
  startDateStr: string,
  dueDay?: number
): Installment[] {
  const installments: Installment[] = [];
  const monthlyAmount = originalAmount / installmentsCount;
  const startDate = new Date(startDateStr);

  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(startDate);
    const targetMonth = startDate.getMonth() + i - 1;
    dueDate.setDate(1); // prevent month rollover
    dueDate.setMonth(targetMonth);

    if (dueDay && dueDay >= 1 && dueDay <= 31) {
      const maxDaysInMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
      dueDate.setDate(Math.min(dueDay, maxDaysInMonth));
    } else {
      dueDate.setDate(Math.min(new Date(startDateStr).getDate(), new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate()));
    }
    
    // Format YYYY-MM-DD
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');
    
    installments.push({
      id: `${i}-${Math.random().toString(36).substr(2, 9)}`,
      index: i,
      dueDate: `${yyyy}-${mm}-${dd}`,
      amount: Number(monthlyAmount.toFixed(2)),
      paidAmount: 0,
      status: 'pending',
    });
  }

  return installments;
}

/**
 * Aligns existing installments' due dates according to a preferred dueDay and startDate
 */
export function alignInstallmentDueDates(
  installments: Installment[],
  startDateStr: string,
  dueDay: number
): Installment[] {
  const startDate = new Date(startDateStr);
  return installments.map((inst) => {
    const dueDate = new Date(startDate);
    const targetMonth = startDate.getMonth() + inst.index - 1;
    dueDate.setDate(1); // prevent month rollover
    dueDate.setMonth(targetMonth);

    const maxDaysInMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
    dueDate.setDate(Math.min(dueDay, maxDaysInMonth));

    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');

    return {
      ...inst,
      dueDate: `${yyyy}-${mm}-${dd}`,
    };
  });
}

/**
 * Consolidates small leftovers (e.g., less than or equal to 3 د.ك) of the last pending installment
 * into the preceding active one, reducing the duration automatically.
 */
export function consolidateLeftovers(installments: Installment[]): Installment[] {
  const unpaid = installments.filter(inst => inst.status !== 'paid');
  if (unpaid.length >= 2) {
    const lastUnpaid = unpaid[unpaid.length - 1];
    const prevUnpaid = unpaid[unpaid.length - 2];
    
    const lastRemaining = lastUnpaid.amount - lastUnpaid.paidAmount;
    if (lastRemaining > 0 && lastRemaining <= 3.0) { // Consolidate 3 د.ك or less
      // Add leftover to prev unpaid
      prevUnpaid.amount = Number((prevUnpaid.amount + lastRemaining).toFixed(2));
      // Mark last unpaid as completed
      lastUnpaid.amount = lastUnpaid.paidAmount;
      lastUnpaid.status = 'paid';
      lastUnpaid.paidDate = new Date().toISOString().split('T')[0];
    }
  }
  return installments;
}

/**
 * Simulates a payment of a specific amount, returning what the schedule would look like
 * under both options: 'reduce_monthly' or 'reduce_duration'
 */
export function simulatePayment(
  debtor: Debtor,
  paymentAmount: number
): {
  reduceMonthlySchedule: Installment[];
  reduceDurationSchedule: Installment[];
} {
  let reduceMonthlySchedule = calculateReduceMonthly(debtor, paymentAmount);
  let reduceDurationSchedule = calculateReduceDuration(debtor, paymentAmount);

  // Apply smart consolidation to reduce installments automatically
  reduceMonthlySchedule = consolidateLeftovers(reduceMonthlySchedule);
  reduceDurationSchedule = consolidateLeftovers(reduceDurationSchedule);

  return {
    reduceMonthlySchedule,
    reduceDurationSchedule,
  };
}

/**
 * OPTION 1: Reduce monthly installments
 * Keeps the number of remaining installments same but reduces the scheduled monthly amount of all unpaid ones.
 * Algorithm:
 * 1. Find total remaining unpaid principal after applying this payment sequentially.
 * 2. Recalculate future payments.
 * Let's do it sequentially:
 * Apply the payment to current due/pending installments.
 * Any leftover is used to recalculate (reduce) the scheduled 'amount' of all remaining unpaid installments equally.
 */
function calculateReduceMonthly(debtor: Debtor, amountToPay: number): Installment[] {
  // Deep clone current installments
  const installments: Installment[] = JSON.parse(JSON.stringify(debtor.installments));
  let remainingPayment = amountToPay;

  // Step 1: Pay off current installments sequentially first
  for (const inst of installments) {
    if (remainingPayment <= 0) break;
    if (inst.status === 'paid') continue;

    const remainingForThis = inst.amount - inst.paidAmount;
    if (remainingForThis <= 0) continue;

    if (remainingPayment >= remainingForThis) {
      inst.paidAmount = inst.amount;
      inst.status = 'paid';
      inst.paidDate = new Date().toISOString().split('T')[0];
      remainingPayment -= remainingForThis;
    } else {
      inst.paidAmount = Number((inst.paidAmount + remainingPayment).toFixed(2));
      inst.status = 'partial';
      remainingPayment = 0;
    }
  }

  // Step 2: If there is still payment left over (the customer paid *more* than what's due today,
  // or they want to overpay), we use the leftover to reduce the FUTURE installment targets.
  // Actually, wait: even if they pay a normal layout, the calculation of "reduce monthly" means
  // the remaining unpaid total balance of the contract is divided equally among all remaining unpaid/partial installments.
  
  // Let's compute total remaining balance of the contract first
  const currentTotalPaidIncludingThis = getPaidTotal(debtor) + amountToPay;
  const remainingPrincipal = Math.max(0, debtor.originalAmount - currentTotalPaidIncludingThis);

  // Find remaining installments that are NOT fully paid
  const activeInstallments = installments.filter(inst => inst.status !== 'paid');

  if (activeInstallments.length > 0 && remainingPrincipal > 0) {
    const recalculatedMonthlyAmount = remainingPrincipal / activeInstallments.length;
    for (const inst of activeInstallments) {
      // Set the new scheduled target
      inst.amount = Number(recalculatedMonthlyAmount.toFixed(2));
      // Adjust stats based on what was already paid for it
      if (inst.paidAmount >= inst.amount) {
        inst.status = 'paid';
      } else if (inst.paidAmount > 0) {
        inst.status = 'partial';
      } else {
        inst.status = 'pending';
      }
    }
  } else if (remainingPrincipal <= 0) {
    // If fully paid
    for (const inst of installments) {
      if (inst.status !== 'paid') {
        inst.paidAmount = inst.amount;
        inst.status = 'paid';
      }
    }
  }

  return installments;
}

/**
 * OPTION 2: Keep the monthly installments target same, and reduce/eliminate from the LAST installments.
 * Algorithm:
 * 1. Pay off installments from the start sequentially.
 * 2. If they pay more than the currently due target, the overpayment rolls over to the *futuremost* months (reducing them from the end).
 * This keeps current installments targets unchanged, while completely canceling/reducing months at the end.
 */
function calculateReduceDuration(debtor: Debtor, amountToPay: number): Installment[] {
  const installments: Installment[] = JSON.parse(JSON.stringify(debtor.installments));
  let remainingPayment = amountToPay;

  // 1. Pay off upcoming installments sequentially
  for (const inst of installments) {
    if (remainingPayment <= 0) break;
    if (inst.status === 'paid') continue;

    const remainingForThis = inst.amount - inst.paidAmount;
    if (remainingForThis <= 0) continue;

    if (remainingPayment >= remainingForThis) {
      inst.paidAmount = inst.amount;
      inst.status = 'paid';
      inst.paidDate = new Date().toISOString().split('T')[0];
      remainingPayment -= remainingForThis;
    } else {
      inst.paidAmount = Number((inst.paidAmount + remainingPayment).toFixed(2));
      inst.status = 'partial';
      remainingPayment = 0;
    }
  }

  // 2. If there's still a leftover payment, we apply it to reduce the *last* pending installments first.
  if (remainingPayment > 0) {
    // Traverse backwards starting from the last installment to apply the overproduction reduction
    for (let i = installments.length - 1; i >= 0; i--) {
      const inst = installments[i];
      if (remainingPayment <= 0) break;
      if (inst.status === 'paid') continue;

      const remainingToComplete = inst.amount - inst.paidAmount;
      if (remainingToComplete <= 0) continue;

      if (remainingPayment >= remainingToComplete) {
        inst.paidAmount = inst.amount;
        inst.status = 'paid';
        remainingPayment -= remainingToComplete;
      } else {
        inst.paidAmount = Number((inst.paidAmount + remainingPayment).toFixed(2));
        inst.status = 'partial';
        remainingPayment = 0;
      }
    }
  }

  return installments;
}

/**
 * Calculates total paid historically so far (excluding any active new payment)
 */
export function getPaidTotal(debtor: Debtor): number {
  if (!debtor.installments) return 0;
  return debtor.installments.reduce((acc, inst) => acc + (inst.paidAmount || 0), 0);
}

/**
 * Remaining amount out of original total
 */
export function getRemainingTotal(debtor: Debtor): number {
  const totalPaid = getPaidTotal(debtor);
  return Math.max(0, debtor.originalAmount - totalPaid);
}

/**
 * Checks if a debtor has at least one unpaid or partially paid installment whose due date is in the past
 */
export function isDebtorOverdue(debtor: Debtor): boolean {
  if (!debtor.installments || debtor.installments.length === 0) return false;
  
  // Today's Date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  
  return debtor.installments.some((inst) => {
    const isUnsettled = inst.status === 'pending' || inst.status === 'partial';
    return isUnsettled && inst.dueDate < todayStr;
  });
}

let colorCanvas: HTMLCanvasElement | null = null;
let colorCtx: CanvasRenderingContext2D | null = null;

/**
 * Converts any CSS color representation (like CSS Color Module Level 4 "oklch")
 * to standard "rgba(r, g, b, a)" style using the browser's native canvas context.
 */
export function convertColorToRgba(colorStr: string): string {
  if (!colorStr) return colorStr;
  if (!colorStr.includes('oklch') && !colorStr.includes('lab') && !colorStr.includes('lch')) {
    return colorStr;
  }
  try {
    if (typeof document === 'undefined') return colorStr;
    if (!colorCanvas) {
      colorCanvas = document.createElement('canvas');
      colorCanvas.width = 1;
      colorCanvas.height = 1;
      colorCanvas.style.visibility = 'hidden';
      colorCanvas.style.position = 'absolute';
      colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (!colorCtx) return colorStr;
    
    colorCtx.clearRect(0, 0, 1, 1);
    colorCtx.fillStyle = colorStr;
    colorCtx.fillRect(0, 0, 1, 1);
    
    const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch (e) {
    console.error("Error converting color:", colorStr, e);
    return colorStr;
  }
}

/**
 * Traverses an element tree and its cloned counterpart, resolving all oklch, lab, lch
 * colors on the clone into standard RGBA styles, and cleans cloned stylesheet rules to
 * prevent html2canvas's css parser from throwing errors.
 */
export function applyHtml2CanvasSafeOklchClone(
  originalElement: HTMLElement,
  clonedElement: HTMLElement,
  clonedDoc: Document
) {
  try {
    if (!originalElement || !clonedElement || !clonedDoc) return;

    const originalElements = [originalElement, ...Array.from(originalElement.querySelectorAll('*'))] as HTMLElement[];
    const clonedElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];

    const properties = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderRightColor',
      'fill',
      'stroke',
      'outlineColor',
    ];

    const len = Math.min(originalElements.length, clonedElements.length);
    for (let i = 0; i < len; i++) {
      const orig = originalElements[i];
      const clone = clonedElements[i];
      if (!orig || !clone || !clone.style) continue;

      const computed = window.getComputedStyle(orig);
      properties.forEach((prop) => {
        const val = computed[prop as any];
        if (val && typeof val === 'string' && (val.includes('oklch') || val.includes('lab') || val.includes('lch'))) {
          const converted = convertColorToRgba(val);
          if (converted) {
            clone.style[prop as any] = converted;
          }
        }
      });
    }

    // Replace color statements in inline stylesheet <style> blocks in the cloned document
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      let cssText = styleTag.textContent || '';
      if (cssText.includes('oklch')) {
        styleTag.textContent = cssText.replace(/oklch\([^)]+\)/g, 'rgb(120, 120, 120)');
      }
    });
  } catch (e) {
    console.error("Error performing HTML2Canvas OKLCH pre-processing:", e);
  }
}

/**
 * Helper function to apply color filters and intercepts on any target Window context
 * (supporting the parent window and cloned iframe windows natively).
 */
export function patchTargetWindow(targetWin: any): { restore: () => void } {
  if (!targetWin) return { restore: () => {} };

  const originalGetPropertyValue = targetWin.CSSStyleDeclaration.prototype.getPropertyValue;
  const originalGetComputedStyle = targetWin.getComputedStyle;
  const cssRulesDescriptor = Object.getOwnPropertyDescriptor(targetWin.CSSStyleSheet.prototype, 'cssRules');
  const rulesDescriptor = Object.getOwnPropertyDescriptor(targetWin.CSSStyleSheet.prototype, 'rules');

  const replaceOklch = (val: any): any => {
    if (typeof val !== 'string') return val;
    if (!val.includes('oklch') && !val.includes('lab') && !val.includes('lch')) {
      return val;
    }
    
    let processed = val;
    
    if (processed.includes('oklch')) {
      processed = processed.replace(/oklch\([^)]+\)/g, (match) => {
        try {
          const converted = convertColorToRgba(match);
          if (converted && converted !== match && !converted.includes('oklch')) {
            return converted;
          }
        } catch (e) {}
        return 'rgb(120, 120, 120)';
      });
    }
    
    if (processed.includes('lab')) {
      processed = processed.replace(/lab\([^)]+\)/g, (match) => {
        try {
          const converted = convertColorToRgba(match);
          if (converted && converted !== match && !converted.includes('lab')) {
            return converted;
          }
        } catch (e) {}
        return 'rgb(120, 120, 120)';
      });
    }
    
    if (processed.includes('lch')) {
      processed = processed.replace(/lch\([^)]+\)/g, (match) => {
        try {
          const converted = convertColorToRgba(match);
          if (converted && converted !== match && !converted.includes('lch')) {
            return converted;
          }
        } catch (e) {}
        return 'rgb(120, 120, 120)';
      });
    }
    
    return processed;
  };

  // 1. Intercept CSSStyleDeclaration.prototype.getPropertyValue globally
  targetWin.CSSStyleDeclaration.prototype.getPropertyValue = function(this: any, property: string) {
    const origVal = originalGetPropertyValue.call(this, property);
    return replaceOklch(origVal);
  };

  // 2. Intercept window.getComputedStyle
  targetWin.getComputedStyle = function(this: any, el: Element, pseudo?: string) {
    const style = originalGetComputedStyle.call(this, el, pseudo);
    if (!style) return style;
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (p: string) => replaceOklch(target.getPropertyValue(p));
        }
        const val = (target as any)[prop];
        if (typeof val === 'string') {
          return replaceOklch(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    }) as any;
  };

  // 3. Dynamically wrap CSSStyleDeclaration.prototype getters for CSS properties (like color, backgroundColor, etc.)
  const styleDescriptors = Object.getOwnPropertyDescriptors(targetWin.CSSStyleDeclaration.prototype);
  const restoredDescriptors: { [key: string]: PropertyDescriptor } = {};
  for (const [key, descriptor] of Object.entries(styleDescriptors)) {
    if (descriptor.get && descriptor.configurable) {
      restoredDescriptors[key] = descriptor;
      const originalGet = descriptor.get;
      Object.defineProperty(targetWin.CSSStyleDeclaration.prototype, key, {
        get(this: any) {
          const val = originalGet.call(this);
          return replaceOklch(val);
        },
        set: descriptor.set,
        configurable: true,
        enumerable: descriptor.enumerable
      });
    }
  }

  // 4. Recursively proxy cssRules & rules (handles nested media queries, layer scopes, keyframes etc.)
  const proxyRule = (rule: any): any => {
    if (!rule) return rule;
    return new Proxy(rule, {
      get(ruleTarget, ruleProp) {
        if (ruleProp === 'cssText') {
          const txt = ruleTarget.cssText;
          return replaceOklch(txt);
        }
        if (ruleProp === 'cssRules') {
          const childRules = ruleTarget.cssRules;
          if (!childRules) return childRules;
          return proxyRulesList(childRules);
        }
        if (ruleProp === 'rules') {
          const childRules = ruleTarget.rules;
          if (!childRules) return childRules;
          return proxyRulesList(childRules);
        }
        if (ruleProp === 'style') {
          const style = ruleTarget.style;
          if (!style) return style;
          return new Proxy(style, {
            get(styleTarget, styleProp) {
              if (styleProp === 'getPropertyValue') {
                return (p: string) => replaceOklch(styleTarget.getPropertyValue(p));
              }
              const val = (styleTarget as any)[styleProp];
              if (typeof val === 'string') {
                return replaceOklch(val);
              }
              if (typeof val === 'function') {
                return val.bind(styleTarget);
              }
              return val;
            }
          });
        }
        return ruleTarget[ruleProp as any];
      }
    });
  };

  const proxyRulesList = (rulesList: any): any => {
    return new Proxy(rulesList, {
      get(target, prop) {
        if (prop === 'length') return target.length;
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          const index = Number(prop);
          const rule = target[index];
          return proxyRule(rule);
        }
        return (target as any)[prop];
      }
    });
  };

  if (cssRulesDescriptor && cssRulesDescriptor.get && cssRulesDescriptor.configurable) {
    const originalGetCssRules = cssRulesDescriptor.get;
    Object.defineProperty(targetWin.CSSStyleSheet.prototype, 'cssRules', {
      get(this: any) {
        try {
          const rules = originalGetCssRules.call(this);
          if (!rules) return rules;
          return proxyRulesList(rules);
        } catch (err) {
          return originalGetCssRules.call(this);
        }
      },
      configurable: true,
      enumerable: true
    });
  }

  if (rulesDescriptor && rulesDescriptor.get && rulesDescriptor.configurable) {
    const originalGetRules = rulesDescriptor.get;
    Object.defineProperty(targetWin.CSSStyleSheet.prototype, 'rules', {
      get(this: any) {
        try {
          const rls = originalGetRules.call(this);
          if (!rls) return rls;
          return proxyRulesList(rls);
        } catch (err) {
          return originalGetRules.call(this);
        }
      },
      configurable: true,
      enumerable: true
    });
  }

  const restore = () => {
    try {
      targetWin.CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
      targetWin.getComputedStyle = originalGetComputedStyle;
      
      for (const [key, descriptor] of Object.entries(restoredDescriptors)) {
        Object.defineProperty(targetWin.CSSStyleDeclaration.prototype, key, descriptor);
      }
      
      if (cssRulesDescriptor && cssRulesDescriptor.configurable) {
        Object.defineProperty(targetWin.CSSStyleSheet.prototype, 'cssRules', cssRulesDescriptor);
      }
      if (rulesDescriptor && rulesDescriptor.configurable) {
        Object.defineProperty(targetWin.CSSStyleSheet.prototype, 'rules', rulesDescriptor);
      }
    } catch (e) {
      console.warn("Restoration warning:", e);
    }
  };

  return { restore };
}

/**
 * A robust wrapper around html2canvas that temporarily patches styleSheets, cssRules,
 * getComputedStyle, and CSSStyleDeclaration getters to replace "oklch(...)" or alternative
 * modern color models across the entire browser styling surface with standard, safe colors
 * (such as rgb fallback values), completely shielding html2canvas's interior CSS parser from crashing.
 * It also dynamically intercepts and sanitizes the cloned document's frame window prototypes.
 */
export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const parentPatch = patchTargetWindow(window);
  let childPatch: { restore: () => void } | null = null;

  // Intercept the onclone option to capture and patch the cloned frame's window context
  const originalOnclone = options.onclone;
  options.onclone = (clonedDoc: Document) => {
    try {
      const clonedWin = clonedDoc.defaultView;
      if (clonedWin) {
        childPatch = patchTargetWindow(clonedWin);
      }
    } catch (e) {
      console.error("Failed to patch cloned document window context:", e);
    }

    // Run custom cloned DOM pre-processing
    try {
      // Direct text replacements on style elements as a multi-tier fallback
      const styles = clonedDoc.getElementsByTagName('style');
      for (let i = 0; i < styles.length; i++) {
        const styleTag = styles[i];
        let txt = styleTag.textContent || styleTag.innerText || '';
        if (txt && (txt.includes('oklch') || txt.includes('lab') || txt.includes('lch'))) {
          if (txt.includes('oklch')) {
            txt = txt.replace(/oklch\([^)]+\)/g, (match) => {
              try {
                const converted = convertColorToRgba(match);
                if (converted && converted !== match && !converted.includes('oklch')) {
                  return converted;
                }
              } catch (e) {}
              return 'rgb(120, 120, 120)';
            });
          }
          if (txt.includes('lab')) {
            txt = txt.replace(/lab\([^)]+\)/g, (match) => {
              try {
                const converted = convertColorToRgba(match);
                if (converted && converted !== match && !converted.includes('lab')) {
                  return converted;
                }
              } catch (e) {}
              return 'rgb(120, 120, 120)';
            });
          }
          if (txt.includes('lch')) {
            txt = txt.replace(/lch\([^)]+\)/g, (match) => {
              try {
                const converted = convertColorToRgba(match);
                if (converted && converted !== match && !converted.includes('lch')) {
                  return converted;
                }
              } catch (e) {}
              return 'rgb(120, 120, 120)';
            });
          }
          styleTag.textContent = txt;
        }
      }
    } catch (e) {
      console.error("Failed to sanitize style blocks in clonedDoc:", e);
    }

    if (originalOnclone) {
      originalOnclone(clonedDoc);
    }
  };

  try {
    const canvas = await html2canvas(element, options);
    return canvas;
  } finally {
    // Absolutely clean teardown of all overrides and descriptors
    parentPatch.restore();
    if (childPatch) {
      childPatch.restore();
    }
  }
}

