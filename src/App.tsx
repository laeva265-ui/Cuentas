import React, { useState, useEffect } from 'react';
import {
  User,
  Expense,
  Income,
  Debt,
  Loan,
  ActiveTab,
  CurrencyCode,
  PaymentSource,
} from './types';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { ExcelApiService } from './services/excelApiService';
import { GoogleAppsScriptService } from './services/appsScriptService';
import { calculateFinancialHealth, calculateAvailableBalance, fetchLiveRates } from './utils/formatters';

// Components
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ExpensesView } from './components/expenses/ExpensesView';
import { IncomeView } from './components/income/IncomeView';
import { DebtsView } from './components/debts/DebtsView';
import { LoansView } from './components/loans/LoansView';
import { FinancialAIAssistant } from './components/ai/FinancialAIAssistant';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/modals/TransactionModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';

export const App: React.FC = () => {
  // Current active user
  const [currentUser, setCurrentUser] = useState<User>(() => AuthService.getCurrentUser());

  // User-isolated financial data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionInitialType, setTransactionInitialType] = useState<
    'expense' | 'income' | 'debt' | 'loan'
  >('expense');

  // Session & Inactivity State (1 minute auto-logout)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isAuth = sessionStorage.getItem('finflow_authenticated') === 'true';
    const lastAct = Number(sessionStorage.getItem('finflow_last_activity') || 0);
    const isRecent = Date.now() - lastAct < 60000;
    return isAuth && isRecent;
  });
  const [authReason, setAuthReason] = useState<string>('');

  const lastActivityRef = React.useRef<number>(Date.now());

  const recordActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    sessionStorage.setItem('finflow_last_activity', Date.now().toString());
  }, []);

  // Monitor user events across the application
  useEffect(() => {
    if (!isAuthenticated) return;

    recordActivity();

    let throttleTimer: any = null;
    const handleUserActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          recordActivity();
          throttleTimer = null;
        }, 500);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(eventName => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    const interval = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityRef.current;
      if (inactiveDuration >= 60000) {
        // Auto-logout after 1 min of inactivity
        setIsAuthenticated(false);
        sessionStorage.removeItem('finflow_authenticated');
        setAuthReason('Tu sesión se ha cerrado automáticamente por inactividad (1 minuto). Por seguridad bancaria, ingresa nuevamente tu usuario y contraseña.');
        setIsAuthModalOpen(true);
      }
    }, 1000);

    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      clearInterval(interval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isAuthenticated, recordActivity]);

  const [paymentModalData, setPaymentModalData] = useState<{
    item: Debt | Loan | null;
    type: 'debt' | 'loan';
  }>({ item: null, type: 'debt' });

  // Load user data whenever currentUser changes (Google Sheets Apps Script > Excel API > LocalStorage)
  const loadUserData = async (userId: string) => {
    // 1. Carga inmediata desde almacenamiento local
    const localExp = StorageService.getExpenses(userId);
    const localInc = StorageService.getIncomes(userId);
    const localDebts = StorageService.getDebts(userId);
    const localLoans = StorageService.getLoans(userId);

    setExpenses(localExp);
    setIncomes(localInc);
    setDebts(localDebts);
    setLoans(localLoans);

    const mergeDebts = (remoteDebts: Debt[]) => {
      return remoteDebts.map(remoteD => {
        const localD = localDebts.find(d => d.id === remoteD.id);
        const remoteHist = remoteD.paymentsHistory || [];
        const localHist = localD?.paymentsHistory || [];

        const histMap = new Map<string, any>();
        remoteHist.forEach(h => histMap.set(h.id, h));
        localHist.forEach(h => histMap.set(h.id, h));

        const amortized = Math.max(0, (remoteD.totalAmount || 0) - (remoteD.currentBalance || 0));
        let finalHistory = Array.from(histMap.values());

        if (finalHistory.length === 0 && amortized > 0) {
          finalHistory = [{
            id: `dpay-${remoteD.id}-init`,
            amount: amortized,
            date: remoteD.date || '2026-10-03',
            note: 'Abono inicial registrado',
            source: 'available_balance' as const
          }];
        }

        return {
          ...remoteD,
          paymentsHistory: finalHistory
        };
      });
    };

    const mergeLoans = (remoteLoans: Loan[]) => {
      return remoteLoans.map(remoteL => {
        const localL = localLoans.find(l => l.id === remoteL.id);
        const remoteHist = remoteL.paymentsHistory || [];
        const localHist = localL?.paymentsHistory || [];

        const histMap = new Map<string, any>();
        remoteHist.forEach(h => histMap.set(h.id, h));
        localHist.forEach(h => histMap.set(h.id, h));

        const amortized = Math.max(0, (remoteL.originalAmount || 0) - (remoteL.remainingAmount || 0));
        let finalHistory = Array.from(histMap.values());

        if (finalHistory.length === 0 && amortized > 0) {
          finalHistory = [{
            id: `lpay-${remoteL.id}-init`,
            amount: amortized,
            date: remoteL.startDate || '2026-10-03',
            note: 'Abono inicial registrado',
            source: 'available_balance' as const
          }];
        }

        return {
          ...remoteL,
          paymentsHistory: finalHistory
        };
      });
    };

    const mergeExpenses = (remoteExpenses: Expense[]) => {
      return remoteExpenses.map(remoteE => {
        const localE = localExp.find(e => e.id === remoteE.id);
        return {
          ...remoteE,
          source: localE?.source || remoteE.source || (remoteE.paymentMethod === 'Tarjeta de Débito' || remoteE.paymentMethod === 'Transferencia' ? 'available_balance' : 'external')
        };
      });
    };

    // 2. Consulta a Google Sheets via Apps Script si está configurado
    if (GoogleAppsScriptService.isConfigured()) {
      // Sincronizar automáticamente el usuario si no existe en la hoja Usuarios
      GoogleAppsScriptService.getUsers().then((gsUsers) => {
        const exists = gsUsers.some(u => 
          u.id.toLowerCase() === userId.toLowerCase() ||
          u.name.toLowerCase() === currentUser.name.toLowerCase() ||
          u.email.toLowerCase() === currentUser.email.toLowerCase()
        );
        if (!exists && currentUser.name && currentUser.email) {
          GoogleAppsScriptService.registerUser({
            name: currentUser.name,
            email: currentUser.email,
            currency: currentUser.currency,
            monthlyBudget: currentUser.monthlyBudget || 3000,
            password: '12345'
          });
        }
      }).catch(() => {});

      const gsData = await GoogleAppsScriptService.getUserFinancialData(userId);
      if (gsData) {
        if (gsData.expenses) {
          const merged = mergeExpenses(gsData.expenses);
          setExpenses(merged);
          StorageService.saveExpenses(userId, merged);
        }
        if (gsData.incomes) {
          setIncomes(gsData.incomes);
          StorageService.saveIncomes(userId, gsData.incomes);
        }
        if (gsData.debts) {
          const merged = mergeDebts(gsData.debts);
          setDebts(merged);
          StorageService.saveDebts(userId, merged);
        }
        if (gsData.loans) {
          const merged = mergeLoans(gsData.loans);
          setLoans(merged);
          StorageService.saveLoans(userId, merged);
        }
        return;
      }
    }

    // 3. Consulta a la base de datos Excel local
    const excelData = await ExcelApiService.getUserFinancialData(userId);
    if (excelData) {
      if (excelData.expenses && excelData.expenses.length > 0) {
        const merged = mergeExpenses(excelData.expenses);
        setExpenses(merged);
        StorageService.saveExpenses(userId, merged);
      }
      if (excelData.incomes && excelData.incomes.length > 0) {
        setIncomes(excelData.incomes);
        StorageService.saveIncomes(userId, excelData.incomes);
      }
      if (excelData.debts && excelData.debts.length > 0) {
        const merged = mergeDebts(excelData.debts);
        setDebts(merged);
        StorageService.saveDebts(userId, merged);
      }
      if (excelData.loans && excelData.loans.length > 0) {
        const merged = mergeLoans(excelData.loans);
        setLoans(merged);
        StorageService.saveLoans(userId, merged);
      }
    }
  };

  useEffect(() => {
    loadUserData(currentUser.id);
  }, [currentUser.id]);

  // Ensure light / white theme is always applied & update live currency exchange rates
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    fetchLiveRates().then(() => {
      // Force re-render with fresh rates
      setCurrentUser(prev => ({ ...prev }));
    });
  }, []);

  // Financial Health calculation
  const financialHealth = calculateFinancialHealth(
    expenses,
    incomes,
    debts,
    loans,
    currentUser.monthlyBudget
  );

  // User changed handler
  const handleUserChanged = (newUser: User) => {
    setCurrentUser(newUser);
    loadUserData(newUser.id);
    setIsAuthenticated(true);
    sessionStorage.setItem('finflow_authenticated', 'true');
    recordActivity();
    setAuthReason('');
    setIsAuthModalOpen(false);
  };

  // Manual logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('finflow_authenticated');
    sessionStorage.removeItem('finflow_last_activity');
    setAuthReason('Has cerrado tu sesión de forma segura. Ingresa tu usuario y contraseña para acceder.');
    setIsAuthModalOpen(true);
  };

  // Currency changed
  const handleCurrencyChange = (currency: CurrencyCode) => {
    const updated = AuthService.updateProfile({ currency });
    setCurrentUser(updated);
  };

  // ADD & DELETE Handlers con persistencia inmediata en Google Sheets y Excel local
  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      userId: currentUser.id,
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    StorageService.saveExpenses(currentUser.id, updated);
    ExcelApiService.syncExpenses(currentUser.id, updated);
    GoogleAppsScriptService.syncExpenses(currentUser.id, updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    StorageService.saveExpenses(currentUser.id, updated);
    ExcelApiService.syncExpenses(currentUser.id, updated);
    GoogleAppsScriptService.syncExpenses(currentUser.id, updated);
  };

  const handleAddIncome = (incomeData: Omit<Income, 'id' | 'userId'>) => {
    const newIncome: Income = {
      ...incomeData,
      id: `inc-${Date.now()}`,
      userId: currentUser.id,
    };
    const updated = [newIncome, ...incomes];
    setIncomes(updated);
    StorageService.saveIncomes(currentUser.id, updated);
    ExcelApiService.syncIncomes(currentUser.id, updated);
    GoogleAppsScriptService.syncIncomes(currentUser.id, updated);
  };

  const handleDeleteIncome = (id: string) => {
    const updated = incomes.filter((i) => i.id !== id);
    setIncomes(updated);
    StorageService.saveIncomes(currentUser.id, updated);
    ExcelApiService.syncIncomes(currentUser.id, updated);
    GoogleAppsScriptService.syncIncomes(currentUser.id, updated);
  };

  const handleAddDebt = (debtData: Omit<Debt, 'id' | 'userId' | 'paymentsHistory'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: `debt-${Date.now()}`,
      userId: currentUser.id,
      paymentsHistory: [],
    };
    const updated = [newDebt, ...debts];
    setDebts(updated);
    StorageService.saveDebts(currentUser.id, updated);
    ExcelApiService.syncDebts(currentUser.id, updated);
    GoogleAppsScriptService.syncDebts(currentUser.id, updated);
  };

  const handleDeleteDebt = (id: string) => {
    const target = debts.find((d) => d.id === id);
    if (target && (target.status === 'Liquidada' || (target.currentBalance || 0) <= 0)) {
      console.warn('Operación denegada: Las deudas liquidadas quedan archivadas como registro histórico permanente y no se pueden eliminar.');
      return;
    }
    const updated = debts.filter((d) => d.id !== id);
    setDebts(updated);
    StorageService.saveDebts(currentUser.id, updated);
    ExcelApiService.syncDebts(currentUser.id, updated);
    GoogleAppsScriptService.syncDebts(currentUser.id, updated);
  };

  const handleLiquidateDebt = (debtId: string) => {
    const updated = debts.map((d) => {
      if (d.id === debtId) {
        return {
          ...d,
          currentBalance: 0,
          status: 'Liquidada' as const,
          paymentsHistory: [
            ...(d.paymentsHistory || []),
            {
              id: `pay-${Date.now()}`,
              amount: d.currentBalance,
              date: new Date().toISOString().split('T')[0],
              note: 'Liquidación Total desde Saldo Disponible',
              source: 'available_balance' as const,
            },
          ],
        };
      }
      return d;
    });
    setDebts(updated);
    StorageService.saveDebts(currentUser.id, updated);
    ExcelApiService.syncDebts(currentUser.id, updated);
    GoogleAppsScriptService.syncDebts(currentUser.id, updated);
  };

  const handleAddLoan = (loanData: Omit<Loan, 'id' | 'userId' | 'paymentsHistory'>) => {
    const newLoan: Loan = {
      ...loanData,
      id: `loan-${Date.now()}`,
      userId: currentUser.id,
      paymentsHistory: [],
    };
    const updated = [newLoan, ...loans];
    setLoans(updated);
    StorageService.saveLoans(currentUser.id, updated);
    ExcelApiService.syncLoans(currentUser.id, updated);
    GoogleAppsScriptService.syncLoans(currentUser.id, updated);
  };

  const handleDeleteLoan = (id: string) => {
    const target = loans.find((l) => l.id === id);
    if (target && (target.status === 'Saldado' || (target.remainingAmount || 0) <= 0)) {
      console.warn('Operación denegada: Los préstamos saldados quedan archivados como registro histórico permanente y no se pueden eliminar.');
      return;
    }
    const updated = loans.filter((l) => l.id !== id);
    setLoans(updated);
    StorageService.saveLoans(currentUser.id, updated);
    ExcelApiService.syncLoans(currentUser.id, updated);
    GoogleAppsScriptService.syncLoans(currentUser.id, updated);
  };

  const handleLiquidateLoan = (loanId: string) => {
    const targetLoan = loans.find(l => l.id === loanId);
    const isBorrowed = targetLoan?.type === 'borrowed';
    const updated = loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          remainingAmount: 0,
          status: 'Saldado' as const,
          paymentsHistory: [
            ...(l.paymentsHistory || []),
            {
              id: `lpay-${Date.now()}`,
              amount: l.remainingAmount,
              date: new Date().toISOString().split('T')[0],
              note: isBorrowed ? 'Saldado Totalmente desde Saldo Disponible' : 'Cobro Totalmente Recuperado',
              source: isBorrowed ? ('available_balance' as const) : undefined,
            },
          ],
        };
      }
      return l;
    });
    setLoans(updated);
    StorageService.saveLoans(currentUser.id, updated);
    ExcelApiService.syncLoans(currentUser.id, updated);
    GoogleAppsScriptService.syncLoans(currentUser.id, updated);
  };

  // Payment modal submission
  const handlePaymentSubmit = (itemId: string, amount: number, note?: string, source: PaymentSource = 'available_balance') => {
    const today = new Date().toISOString().split('T')[0];

    if (paymentModalData.type === 'debt') {
      const updated = debts.map((d) => {
        if (d.id === itemId) {
          const newBal = Math.max(0, d.currentBalance - amount);
          return {
            ...d,
            currentBalance: newBal,
            status: newBal === 0 ? ('Liquidada' as const) : d.status,
            paymentsHistory: [
              ...(d.paymentsHistory || []),
              {
                id: `pay-${Date.now()}`,
                amount,
                date: today,
                note: note || (source === 'available_balance' ? 'Abono desde Saldo Disponible' : 'Abono externo / efectivo'),
                source,
              },
            ],
          };
        }
        return d;
      });
      setDebts(updated);
      StorageService.saveDebts(currentUser.id, updated);
      ExcelApiService.syncDebts(currentUser.id, updated);
      GoogleAppsScriptService.syncDebts(currentUser.id, updated);
    } else {
      const updated = loans.map((l) => {
        if (l.id === itemId) {
          const newBal = Math.max(0, l.remainingAmount - amount);
          return {
            ...l,
            remainingAmount: newBal,
            status: newBal === 0 ? ('Saldado' as const) : l.status,
            paymentsHistory: [
              ...(l.paymentsHistory || []),
              {
                id: `lpay-${Date.now()}`,
                amount,
                date: today,
                note: note || (l.type === 'lent' ? 'Cobro recibido' : (source === 'available_balance' ? 'Pago desde Saldo Disponible' : 'Pago externo / efectivo')),
                source: l.type === 'borrowed' ? source : undefined,
              },
            ],
          };
        }
        return l;
      });
      setLoans(updated);
      StorageService.saveLoans(currentUser.id, updated);
      ExcelApiService.syncLoans(currentUser.id, updated);
      GoogleAppsScriptService.syncLoans(currentUser.id, updated);
    }
  };

  const openTransactionModalWithType = (type: 'expense' | 'income' | 'debt' | 'loan') => {
    setTransactionInitialType(type);
    setIsTransactionModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 bg-[#F0F4F8] selection:bg-blue-100 selection:text-blue-900">
      {/* Banking subtle background pattern */}
      <div className="bank-bg-pattern" />

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenAuth={() => {
          setAuthReason('');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenNewTransaction={() => openTransactionModalWithType('expense')}
        onCurrencyChange={handleCurrencyChange}
      />

      {/* PWA Installation Prompt Banner (smart detection) */}
      <PwaInstallPrompt />

      {/* Main Full-Window Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8 relative z-10">
        <main className="w-full">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              currentUser={currentUser}
              expenses={expenses}
              incomes={incomes}
              debts={debts}
              loans={loans}
              financialHealth={financialHealth}
              onNavigate={setActiveTab}
              onOpenNewTransaction={() => openTransactionModalWithType('expense')}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              currentUser={currentUser}
              expenses={expenses}
              onAddExpense={() => openTransactionModalWithType('expense')}
              onDeleteExpense={handleDeleteExpense}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'income' && (
            <IncomeView
              currentUser={currentUser}
              incomes={incomes}
              onAddIncome={() => openTransactionModalWithType('income')}
              onDeleteIncome={handleDeleteIncome}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'debts' && (
            <DebtsView
              currentUser={currentUser}
              debts={debts}
              onAddDebt={() => openTransactionModalWithType('debt')}
              onOpenPaymentModal={(debt) => setPaymentModalData({ item: debt, type: 'debt' })}
              onLiquidateDebt={handleLiquidateDebt}
              onDeleteDebt={handleDeleteDebt}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'loans' && (
            <LoansView
              currentUser={currentUser}
              loans={loans}
              onAddLoan={() => openTransactionModalWithType('loan')}
              onOpenPaymentModal={(loan) => setPaymentModalData({ item: loan, type: 'loan' })}
              onLiquidateLoan={handleLiquidateLoan}
              onDeleteLoan={handleDeleteLoan}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'advisor' && (
            <FinancialAIAssistant
              currentUser={currentUser}
              expenses={expenses}
              incomes={incomes}
              debts={debts}
              loans={loans}
              financialHealth={financialHealth}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUserUpdated={setCurrentUser}
              onReloadData={() => loadUserData(currentUser.id)}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        currentUser={currentUser}
        isOpen={!isAuthenticated || isAuthModalOpen}
        isLocked={!isAuthenticated}
        lockReason={authReason}
        onClose={isAuthenticated ? () => setIsAuthModalOpen(false) : undefined}
        onUserChanged={handleUserChanged}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        currentUser={currentUser}
        initialType={transactionInitialType}
        availableBalance={calculateAvailableBalance(incomes, loans, debts, expenses)}
        onClose={() => setIsTransactionModalOpen(false)}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
        onAddDebt={handleAddDebt}
        onAddLoan={handleAddLoan}
      />

      <PaymentModal
        isOpen={!!paymentModalData.item}
        currentUser={currentUser}
        item={paymentModalData.item}
        itemType={paymentModalData.type}
        availableBalance={calculateAvailableBalance(incomes, loans, debts, expenses)}
        onClose={() => setPaymentModalData({ item: null, type: 'debt' })}
        onSubmitPayment={handlePaymentSubmit}
      />

      {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet) */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenNewTransaction={() => openTransactionModalWithType('expense')}
      />
    </div>
  );
};

export default App;
