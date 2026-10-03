import { User, Expense, Income, Debt, Loan } from '../types';

const USERS_KEY = 'finflow_users_v1';
const ACTIVE_USER_KEY = 'finflow_active_user_id';

export const INITIAL_DEMO_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Jorge Luis Perez Acosta',
    email: 'jorge00@finflow.io',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    currency: 'USD',
    theme: 'light',
    monthlyBudget: 5000,
    bio: 'Administrador FinFlow Bank',
    createdAt: '2026-09-20',
  },
  {
    id: 'USR-002',
    name: 'Sara Morales Buitrago',
    email: 'sara01@finflow.io',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    currency: 'USD',
    theme: 'light',
    monthlyBudget: 3500,
    bio: 'Cliente Premium FinFlow Bank',
    createdAt: '2026-09-20',
  },
  {
    id: 'USR-003',
    name: 'Karen Lorena Perez Acosta',
    email: 'karen02@finflow.io',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    currency: 'USD',
    theme: 'light',
    monthlyBudget: 3800,
    bio: 'Cliente FinFlow Bank',
    createdAt: '2026-09-20',
  },
  {
    id: 'USR-004',
    name: 'Joselin Alverto Perez Ochoa',
    email: 'jose03@finflow.io',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    currency: 'USD',
    theme: 'light',
    monthlyBudget: 3200,
    bio: 'Cliente FinFlow Bank',
    createdAt: '2026-09-20',
  },
];

export const INITIAL_DEMO_EXPENSES: Record<string, Expense[]> = {
  'user-carlos-2026': [
    {
      id: 'exp-1',
      userId: 'user-carlos-2026',
      title: 'Renta Apartamento Smart',
      amount: 1400,
      category: 'Vivienda',
      paymentMethod: 'Transferencia',
      date: '2026-09-01',
      isRecurring: true,
      notes: 'Incluye mantenimiento y domótica',
    },
    {
      id: 'exp-2',
      userId: 'user-carlos-2026',
      title: 'Supermercado y Orgánicos',
      amount: 480,
      category: 'Alimentación',
      paymentMethod: 'Tarjeta de Débito',
      date: '2026-09-04',
      isRecurring: false,
    },
    {
      id: 'exp-3',
      userId: 'user-carlos-2026',
      title: 'Membresía Coworking & Fibra Óptica',
      amount: 190,
      category: 'Servicios',
      paymentMethod: 'Tarjeta de Crédito',
      date: '2026-09-05',
      isRecurring: true,
    },
    {
      id: 'exp-4',
      userId: 'user-carlos-2026',
      title: 'Suscripciones AI (Claude, GPT, Cursor)',
      amount: 80,
      category: 'Suscripciones',
      paymentMethod: 'Tarjeta de Crédito',
      date: '2026-09-06',
      isRecurring: true,
    },
    {
      id: 'exp-5',
      userId: 'user-carlos-2026',
      title: 'Gimnasio & Entrenador Personal',
      amount: 120,
      category: 'Salud',
      paymentMethod: 'Tarjeta de Débito',
      date: '2026-09-03',
      isRecurring: true,
    },
    {
      id: 'exp-6',
      userId: 'user-carlos-2026',
      title: 'Cena Bistro con Amigos',
      amount: 145,
      category: 'Ocio',
      paymentMethod: 'Tarjeta de Crédito',
      date: '2026-09-07',
      isRecurring: false,
    },
  ],
  'user-sofia-2026': [
    {
      id: 'exp-s1',
      userId: 'user-sofia-2026',
      title: 'Alquiler Loft Condesa',
      amount: 18000,
      category: 'Vivienda',
      paymentMethod: 'Transferencia',
      date: '2026-09-01',
      isRecurring: true,
    },
    {
      id: 'exp-s2',
      userId: 'user-sofia-2026',
      title: 'Despensa Mercado Roma',
      amount: 4500,
      category: 'Alimentación',
      paymentMethod: 'Tarjeta de Débito',
      date: '2026-09-03',
    },
    {
      id: 'exp-s3',
      userId: 'user-sofia-2026',
      title: 'Adobe Creative Cloud 2026',
      amount: 1250,
      category: 'Suscripciones',
      paymentMethod: 'Tarjeta de Crédito',
      date: '2026-09-05',
      isRecurring: true,
    },
  ],
};

export const INITIAL_DEMO_INCOMES: Record<string, Income[]> = {
  'user-carlos-2026': [
    {
      id: 'inc-1',
      userId: 'user-carlos-2026',
      title: 'Salario Senior Tech Lead',
      amount: 5200,
      category: 'Salario',
      frequency: 'Mensual',
      date: '2026-09-01',
      notes: 'Depósito directo de nómina',
    },
    {
      id: 'inc-2',
      userId: 'user-carlos-2026',
      title: 'Consultoría Arquitectura Cloud',
      amount: 950,
      category: 'Freelance',
      frequency: 'Única vez',
      date: '2026-09-05',
      notes: 'Proyecto cliente extranjero',
    },
    {
      id: 'inc-3',
      userId: 'user-carlos-2026',
      title: 'Rendimientos Fondo Indexado S&P 500',
      amount: 320,
      category: 'Dividendos',
      frequency: 'Mensual',
      date: '2026-09-02',
    },
  ],
  'user-sofia-2026': [
    {
      id: 'inc-s1',
      userId: 'user-sofia-2026',
      title: 'Sueldo Directora de Arte',
      amount: 45000,
      category: 'Salario',
      frequency: 'Mensual',
      date: '2026-09-01',
    },
    {
      id: 'inc-s2',
      userId: 'user-sofia-2026',
      title: 'Taller de Branding Online',
      amount: 12000,
      category: 'Negocio Propio',
      frequency: 'Única vez',
      date: '2026-09-06',
    },
  ],
};

export const INITIAL_DEMO_DEBTS: Record<string, Debt[]> = {
  'user-carlos-2026': [
    {
      id: 'debt-1',
      userId: 'user-carlos-2026',
      title: 'Tarjeta Visa Black Signature',
      lender: 'Chase Bank',
      totalAmount: 3500,
      currentBalance: 1850,
      interestRate: 21.5,
      minimumPayment: 140,
      dueDate: '2026-09-22',
      category: 'Tarjeta de Crédito',
      status: 'Activa',
      paymentsHistory: [
        { id: 'dp-1', amount: 300, date: '2026-08-20', note: 'Abono extraordinario' },
        { id: 'dp-2', amount: 200, date: '2026-07-20', note: 'Pago mínimo + capital' },
      ],
      notes: 'Prioridad 1 para saldar con método Avalancha',
    },
    {
      id: 'debt-2',
      userId: 'user-carlos-2026',
      title: 'Crédito Vehicular EV 2024',
      lender: 'Tesla Financial Services',
      totalAmount: 24000,
      currentBalance: 8200,
      interestRate: 5.9,
      minimumPayment: 380,
      dueDate: '2026-09-28',
      category: 'Vehicular',
      status: 'Activa',
      paymentsHistory: [
        { id: 'dp-3', amount: 380, date: '2026-08-28', note: 'Cuota mensual 20/36' },
      ],
      notes: 'Tasa fija preferencial',
    },
  ],
  'user-sofia-2026': [
    {
      id: 'debt-s1',
      userId: 'user-sofia-2026',
      title: 'Tarjeta Oro Santander',
      lender: 'Banco Santander',
      totalAmount: 35000,
      currentBalance: 14200,
      interestRate: 26.0,
      minimumPayment: 1500,
      dueDate: '2026-09-18',
      category: 'Tarjeta de Crédito',
      status: 'Activa',
      paymentsHistory: [],
    },
  ],
};

export const INITIAL_DEMO_LOANS: Record<string, Loan[]> = {
  'user-carlos-2026': [
    {
      id: 'loan-1',
      userId: 'user-carlos-2026',
      type: 'lent', // Dinero prestado a un amigo (por cobrar)
      personName: 'Mateo Silva (Amigo)',
      contactPhone: '+1 555-234-8901',
      originalAmount: 800,
      remainingAmount: 350,
      startDate: '2026-07-10',
      dueDate: '2026-10-15',
      status: 'Al día',
      paymentsHistory: [
        { id: 'lp-1', amount: 250, date: '2026-08-01', note: 'Transferencia bancaria' },
        { id: 'lp-2', amount: 200, date: '2026-09-01', note: 'Abono pactado' },
      ],
      notes: 'Préstamo para reparación de laptop',
    },
    {
      id: 'loan-2',
      userId: 'user-carlos-2026',
      type: 'borrowed', // Dinero que Carlos le debe a su hermano
      personName: 'Daniel Mendoza (Hermano)',
      contactPhone: '+1 555-987-1234',
      originalAmount: 1200,
      remainingAmount: 400,
      startDate: '2026-06-01',
      dueDate: '2026-11-30',
      status: 'Al día',
      paymentsHistory: [
        { id: 'lp-3', amount: 400, date: '2026-07-15', note: 'Primer abono' },
        { id: 'lp-4', amount: 400, date: '2026-08-15', note: 'Segundo abono' },
      ],
      notes: 'Préstamo familiar para gastos de mudanza',
    },
  ],
  'user-sofia-2026': [
    {
      id: 'loan-s1',
      userId: 'user-sofia-2026',
      type: 'lent',
      personName: 'Camila Torres (Socia)',
      contactPhone: '+52 55 1234 5678',
      originalAmount: 8000,
      remainingAmount: 3000,
      startDate: '2026-07-01',
      dueDate: '2026-09-30',
      status: 'Al día',
      paymentsHistory: [
        { id: 'lp-s1', amount: 5000, date: '2026-08-10', note: 'Anticipo proyecto' },
      ],
      notes: 'Inversión conjunta para estudio fotográfico',
    },
  ],
};

export const StorageService = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_DEMO_USERS));
        return INITIAL_DEMO_USERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_USERS;
    }
  },

  saveUsers: (users: User[]): void => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getActiveUserId: (): string => {
    const active = localStorage.getItem(ACTIVE_USER_KEY);
    if (active) return active;
    const users = StorageService.getUsers();
    const defaultId = users[0]?.id || 'user-carlos-2026';
    localStorage.setItem(ACTIVE_USER_KEY, defaultId);
    return defaultId;
  },

  setActiveUserId: (id: string): void => {
    localStorage.setItem(ACTIVE_USER_KEY, id);
  },

  // EXPENSES
  getExpenses: (userId: string): Expense[] => {
    try {
      const data = localStorage.getItem(`finflow_exp_${userId}`);
      if (!data) {
        const initial = INITIAL_DEMO_EXPENSES[userId] || [];
        localStorage.setItem(`finflow_exp_${userId}`, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveExpenses: (userId: string, expenses: Expense[]): void => {
    localStorage.setItem(`finflow_exp_${userId}`, JSON.stringify(expenses));
  },

  // INCOMES
  getIncomes: (userId: string): Income[] => {
    try {
      const data = localStorage.getItem(`finflow_inc_${userId}`);
      if (!data) {
        const initial = INITIAL_DEMO_INCOMES[userId] || [];
        localStorage.setItem(`finflow_inc_${userId}`, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveIncomes: (userId: string, incomes: Income[]): void => {
    localStorage.setItem(`finflow_inc_${userId}`, JSON.stringify(incomes));
  },

  // DEBTS
  getDebts: (userId: string): Debt[] => {
    try {
      const data = localStorage.getItem(`finflow_debts_${userId}`);
      if (!data) {
        const initial = INITIAL_DEMO_DEBTS[userId] || [];
        localStorage.setItem(`finflow_debts_${userId}`, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveDebts: (userId: string, debts: Debt[]): void => {
    localStorage.setItem(`finflow_debts_${userId}`, JSON.stringify(debts));
  },

  // LOANS
  getLoans: (userId: string): Loan[] => {
    try {
      const data = localStorage.getItem(`finflow_loans_${userId}`);
      if (!data) {
        const initial = INITIAL_DEMO_LOANS[userId] || [];
        localStorage.setItem(`finflow_loans_${userId}`, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveLoans: (userId: string, loans: Loan[]): void => {
    localStorage.setItem(`finflow_loans_${userId}`, JSON.stringify(loans));
  },

  // Export full user data to JSON
  exportUserData: (userId: string): string => {
    const user = StorageService.getUsers().find((u) => u.id === userId);
    const data = {
      user,
      expenses: StorageService.getExpenses(userId),
      incomes: StorageService.getIncomes(userId),
      debts: StorageService.getDebts(userId),
      loans: StorageService.getLoans(userId),
      exportedAt: new Date().toISOString(),
      version: '2026.1',
    };
    return JSON.stringify(data, null, 2);
  },

  // Import user data
  importUserData: (userId: string, jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.expenses) StorageService.saveExpenses(userId, parsed.expenses);
      if (parsed.incomes) StorageService.saveIncomes(userId, parsed.incomes);
      if (parsed.debts) StorageService.saveDebts(userId, parsed.debts);
      if (parsed.loans) StorageService.saveLoans(userId, parsed.loans);
      return true;
    } catch {
      return false;
    }
  },
};
