export type CurrencyCode = 'USD' | 'EUR' | 'MXN' | 'COP' | 'ARS' | 'CLP' | 'PEN';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  currency: CurrencyCode;
  theme: 'dark' | 'light';
  monthlyBudget: number;
  pinCode?: string;
  bio?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Vivienda' 
  | 'Alimentación' 
  | 'Transporte' 
  | 'Servicios' 
  | 'Salud' 
  | 'Ocio' 
  | 'Educación' 
  | 'Suscripciones' 
  | 'Ropa y Cuidado'
  | 'Otros';

export type PaymentMethod = 
  | 'Tarjeta de Débito' 
  | 'Tarjeta de Crédito' 
  | 'Efectivo' 
  | 'Transferencia'
  | 'Crypto / Digital';

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  notes?: string;
  isRecurring?: boolean;
  source?: PaymentSource; // 'available_balance' | 'external'
}

export type IncomeCategory = 
  | 'Salario' 
  | 'Freelance' 
  | 'Negocio Propio' 
  | 'Inversiones' 
  | 'Alquiler' 
  | 'Dividendos' 
  | 'Regalos'
  | 'Otros';

export type FrequencyType = 'Mensual' | 'Quincenal' | 'Semanal' | 'Única vez';

export interface Income {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: IncomeCategory;
  frequency: FrequencyType;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export type DebtCategory = 
  | 'Tarjeta de Crédito' 
  | 'Hipoteca' 
  | 'Vehicular' 
  | 'Personal' 
  | 'Estudiantil' 
  | 'Comercial' 
  | 'Otros';

export type PaymentSource = 'available_balance' | 'external';

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  source?: PaymentSource;
}

export interface Debt {
  id: string;
  userId: string;
  title: string;
  lender: string;
  totalAmount: number;
  currentBalance: number;
  interestRate: number; // % anual (APR)
  minimumPayment: number;
  dueDate: string; // Fecha de corte o vencimiento
  category: DebtCategory;
  paymentsHistory: DebtPayment[];
  status: 'Activa' | 'En Riesgo' | 'Liquidada';
  notes?: string;
}

export type LoanType = 'borrowed' | 'lent'; // borrowed = dinero que me prestaron; lent = dinero que yo presté

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  source?: PaymentSource;
}

export interface Loan {
  id: string;
  userId: string;
  type: LoanType;
  personName: string;
  contactPhone?: string;
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number; // % pactado o 0
  startDate: string;
  dueDate: string;
  paymentsHistory: LoanPayment[];
  status: 'Al día' | 'Vencido' | 'Saldado';
  notes?: string;
}

export interface FinancialHealth {
  score: number;
  level: 'Excelente' | 'Bueno' | 'Regular' | 'Crítico';
  debtToIncomeRatio: number;
  savingsRate: number;
  monthlyNetCashflow: number;
  runwayMonths: number;
  insights: {
    type: 'positive' | 'warning' | 'tip';
    title: string;
    message: string;
  }[];
}

export type ActiveTab = 'dashboard' | 'expenses' | 'income' | 'debts' | 'loans' | 'advisor' | 'settings';
