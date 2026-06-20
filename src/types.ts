export interface Installment {
  id: string;
  index: number; // 1-based index representing month number
  dueDate: string; // YYYY-MM-DD
  amount: number; // Scheduled amount for this month
  paidAmount: number; // Amount paid so far for this individual installment
  status: 'paid' | 'partial' | 'pending';
  paidDate?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  reductionType: 'reduce_monthly' | 'reduce_duration';
  note?: string;
}

export interface Debtor {
  id: string;
  name: string;
  civilId: string;
  creditorName: string; // Person who lent the money (الدائن)
  originalAmount: number; // Original principal (المبلغ الأساسي)
  installmentsCount: number; // Total months/installments
  startDate: string;
  dueDay?: number; // Chosen monthly installment day (e.g., 5th of each month)
  installments: Installment[];
  payments: PaymentRecord[];
  signatureData?: string; // Debtor drawn signature Base64 (canvas data url)
  civilIdImage?: string; // Base64 of the Civil ID photo (صور البطاقة المدنية)
  writtenContractImage?: string; // Base64 of the paper debt contract (صورة الدين المكتوب)
  additionalImages?: string[]; // Extra photo attachment collection
  notes?: string; // Extra notes
  createdAt: string;
}
