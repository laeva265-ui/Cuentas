import React, { useState, useEffect } from 'react';
import { X, Plus, ArrowDownCircle, ArrowUpCircle, CreditCard, Briefcase, Wallet, Banknote, AlertTriangle } from 'lucide-react';
import { User, Expense, Income, Debt, Loan, PaymentSource } from '../../types';
import { formatCurrency, formatThousandsInput, parseThousandsInput, calculateMonthsBetween, convertCurrency } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  currentUser: User;
  initialType?: 'expense' | 'income' | 'debt' | 'loan';
  availableBalance?: number;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'userId'>) => void;
  onAddIncome: (income: Omit<Income, 'id' | 'userId'>) => void;
  onAddDebt: (debt: Omit<Debt, 'id' | 'userId' | 'paymentsHistory'>) => void;
  onAddLoan: (loan: Omit<Loan, 'id' | 'userId' | 'paymentsHistory'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  currentUser,
  initialType = 'expense',
  availableBalance = 0,
  onClose,
  onAddExpense,
  onAddIncome,
  onAddDebt,
  onAddLoan
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'debt' | 'loan'>(initialType);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [expenseSource, setExpenseSource] = useState<PaymentSource>('available_balance');

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setActiveTab(initialType);
      setAmount('');
      setConcept('');
      setStartDate(today);
      setDate(today);
      setCategory('');
      setInterestRate('');
      setExpenseSource('available_balance');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawNumAmount = parseThousandsInput(amount);
    if (isNaN(rawNumAmount) || rawNumAmount <= 0) return;
    const numAmount = convertCurrency(rawNumAmount, currentUser.currency, 'COP');

    if (activeTab === 'expense') {
      onAddExpense({
        amount: numAmount,
        title: concept || 'Nuevo Gasto',
        date,
        category: (category as any) || 'Otros',
        paymentMethod: expenseSource === 'available_balance' ? 'Tarjeta de Débito' : 'Efectivo',
        source: expenseSource,
        notes: ''
      });
    } else if (activeTab === 'income') {
      onAddIncome({
        amount: numAmount,
        title: concept || 'Nuevo Ingreso',
        date,
        category: (category as any) || 'Otros',
        frequency: 'Única vez',
        notes: ''
      });
    } else if (activeTab === 'debt') {
      const plazo = calculateMonthsBetween(startDate, date);
      const calculatedMinPayment = Math.round(numAmount / plazo);
      onAddDebt({
        title: concept || 'Nueva Deuda',
        lender: concept || 'Institución/Persona',
        totalAmount: numAmount,
        currentBalance: numAmount,
        interestRate: parseFloat(interestRate) || 0,
        minimumPayment: calculatedMinPayment,
        dueDate: date,
        date: startDate,
        category: 'Otros',
        status: 'Activa',
        notes: category
      });
    } else if (activeTab === 'loan') {
      onAddLoan({
        type: 'lent',
        personName: concept || 'Persona',
        originalAmount: numAmount,
        remainingAmount: numAmount,
        interestRate: parseFloat(interestRate) || 0,
        startDate: startDate,
        dueDate: date,
        status: 'Al día',
        notes: category
      });
    }

    onClose();
  };

  const tabs = [
    { id: 'expense', label: 'Gasto', icon: <ArrowDownCircle size={18} /> },
    { id: 'income', label: 'Ingreso', icon: <ArrowUpCircle size={18} /> },
    { id: 'debt', label: 'Deuda', icon: <CreditCard size={18} /> },
    { id: 'loan', label: 'Préstamo', icon: <Briefcase size={18} /> }
  ] as const;

  const currentPlazo = calculateMonthsBetween(startDate, date);
  const currentNumAmount = parseThousandsInput(amount);
  const currentCalculatedPayment = currentPlazo > 0 && currentNumAmount > 0 ? Math.round(currentNumAmount / currentPlazo) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0B1A2E] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Plus className="w-5 h-5 text-blue-300" />
            </div>
            <h2 className="text-xl font-semibold">Nueva Operación Bancaria</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1A56DB] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Monto ({currentUser.currency})
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => setAmount(formatThousandsInput(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {activeTab === 'debt' ? 'Acreedor / Entidad' : activeTab === 'loan' ? 'Deudor / Prestatario' : 'Concepto'}
              </label>
              <input
                type="text"
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow"
                placeholder={activeTab === 'debt' ? 'Ej. Banco Santander, Tarjeta Visa' : activeTab === 'loan' ? 'Ej. Juan Pérez' : 'Ej. Nómina, Compra'}
              />
            </div>

            {/* SECCIÓN ESPECÍFICA PARA GASTOS */}
            {activeTab === 'expense' && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    ¿De dónde salió el dinero para este gasto?
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setExpenseSource('available_balance')}
                      className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        expenseSource === 'available_balance'
                          ? 'border-[#1A56DB] bg-blue-50/60 shadow-sm ring-1 ring-[#1A56DB]/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`p-1.5 rounded-lg ${expenseSource === 'available_balance' ? 'bg-[#1A56DB] text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-[#0B1A2E]">Saldo Disponible</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Descuenta de tu saldo</p>
                        <p className="text-xs font-bold text-emerald-700 mt-0.5">
                          Disponible: {formatCurrency(availableBalance, currentUser.currency)}
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setExpenseSource('external')}
                      className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        expenseSource === 'external'
                          ? 'border-[#1A56DB] bg-blue-50/60 shadow-sm ring-1 ring-[#1A56DB]/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`p-1.5 rounded-lg ${expenseSource === 'external' ? 'bg-[#1A56DB] text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Banknote className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-[#0B1A2E]">Efectivo / Externo</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Origen fuera de la app</p>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          No afecta Saldo Disp.
                        </p>
                      </div>
                    </div>
                  </div>

                  {expenseSource === 'available_balance' && currentNumAmount > availableBalance && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mt-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Atención: Saldo Disponible insuficiente</p>
                        <p className="text-amber-700">
                          El gasto ({formatCurrency(currentNumAmount, currentUser.currency)}) supera tu saldo actual ({formatCurrency(availableBalance, currentUser.currency)}).
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN ESPECÍFICA PARA INGRESOS */}
            {activeTab === 'income' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN ESPECÍFICA PARA DEUDAS Y PRÉSTAMOS */}
            {(activeTab === 'loan' || activeTab === 'debt') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasa de Interés (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900">
                      <span className="font-semibold block">
                        Plazo: {currentPlazo} mes(es)
                      </span>
                      {currentCalculatedPayment > 0 && (
                        <span className="text-amber-800 font-bold block mt-0.5">
                          Cuota/Pago Mín.: {formatCurrency(currentCalculatedPayment, currentUser.currency)}/mes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-[#0B1A2E] hover:bg-[#122B4A] transition-colors"
              >
                Confirmar Operación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
