import React from 'react';
import { 
  ArrowRight, ShieldCheck, CreditCard, 
  TrendingDown, TrendingUp, AlertCircle, Briefcase, 
  Wallet, PieChart, Landmark
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { User, Expense, Income, Debt, Loan, FinancialHealth, ActiveTab } from '../../types';
import { formatCurrency, calculateAvailableBalance } from '../../utils/formatters';

interface DashboardOverviewProps {
  currentUser: User;
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
  loans: Loan[];
  financialHealth: FinancialHealth;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
}

export function DashboardOverview({
  currentUser,
  expenses,
  incomes,
  debts,
  loans,
  financialHealth,
  onNavigate,
  onOpenNewTransaction
}: DashboardOverviewProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currency = currentUser.currency || 'USD';

  // Calculate totals
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Saldo Disponible calculado dinámicamente con ingresos, cobros, abonos y gastos
  const availableBalance = calculateAvailableBalance(incomes, loans, debts, expenses);
  const totalDebt = debts.filter(d => d.status !== 'Liquidada').reduce((sum, d) => sum + d.currentBalance, 0);
  const totalLoans = loans.filter(l => l.status !== 'Saldado').reduce((sum, l) => sum + l.remainingAmount, 0);

  const lentReceivable = loans.filter(l => l.type === 'lent' && l.status !== 'Saldado').reduce((sum, l) => sum + l.remainingAmount, 0);
  const borrowedPayable = loans.filter(l => l.type === 'borrowed' && l.status !== 'Saldado').reduce((sum, l) => sum + l.remainingAmount, 0);
  const netWorth = totalIncome - totalExpense + lentReceivable - borrowedPayable - totalDebt;

  // Generate chart data (mocked based on actual data if available, or static for demo)
  const chartData = [
    { name: 'Ene', ingresos: totalIncome * 0.4, gastos: totalExpense * 0.5 },
    { name: 'Feb', ingresos: totalIncome * 0.5, gastos: totalExpense * 0.4 },
    { name: 'Mar', ingresos: totalIncome * 0.6, gastos: totalExpense * 0.6 },
    { name: 'Abr', ingresos: totalIncome * 0.8, gastos: totalExpense * 0.7 },
    { name: 'May', ingresos: totalIncome * 0.7, gastos: totalExpense * 0.5 },
    { name: 'Jun', ingresos: totalIncome * 0.9, gastos: totalExpense * 0.8 },
    { name: 'Jul', ingresos: totalIncome, gastos: totalExpense },
  ];

  const formatYAxisTick = (val: number) => {
    if (val === 0) return '$0';

    if (val >= 1000000) {
      const mill = val / 1000000;
      if (Number.isInteger(mill)) {
        return `$${mill}.M`;
      }
      return `$${mill.toFixed(1)}M`;
    }

    if (val >= 1000) {
      const k = val / 1000;
      if (Number.isInteger(k)) {
        return `$${k}k`;
      }
      return `$${k.toFixed(1)}k`;
    }

    return `$${Math.round(val)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Welcome Section */}
      <div className="virtual-card bg-gradient-to-br from-[#0B1A2E] via-[#122B4A] to-[#1A3A5C] rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4A853] opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
        
        <div className="z-10 w-full md:w-1/2 mb-6 md:mb-0">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Bienvenido, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-white/80 text-lg">Septiembre 2026</p>
        </div>
        
        <div className="z-10 w-full md:w-[340px]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4A853] to-[#E8C374]"></div>
            <div className="flex justify-between items-start mb-6">
              <Landmark className="h-8 w-8 text-white/90" />
              <div className="text-right">
                <p className="text-[10px] text-white/70 uppercase tracking-widest">Tarjeta Virtual</p>
                <p className="font-bold text-[#E8C374]">{currency}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xl font-mono tracking-widest text-white/90">•••• •••• •••• 4826</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-white/70 uppercase">Titular</p>
                <p className="font-medium text-sm tracking-wide">{currentUser.name.toUpperCase()}</p>
              </div>
              <div className="w-10 h-6 bg-white/20 rounded-sm flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-red-500/80 -mr-2 mix-blend-multiply"></div>
                <div className="w-4 h-4 rounded-full bg-yellow-500/80 mix-blend-multiply"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Account Balance Section & 3. Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bank-card rounded-2xl p-6 bg-white shadow-sm border border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <h2 className="bank-section-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 sm:mb-0">Saldo Disponible</h2>
            <div className="trust-badge flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              BD FinFlow Bank · Google Sheets / Excel Activo
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-4xl sm:text-5xl font-bold text-[#0B1A2E] tracking-tight">
              {formatCurrency(availableBalance, currency)}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-[#059669] bg-green-50 px-2 py-1 rounded-md text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>Ingresos este mes</span>
              </div>
              <div className="flex items-center gap-1 text-[#DC2626] bg-red-50 px-2 py-1 rounded-md text-sm font-medium">
                <TrendingDown className="h-4 w-4" />
                <span>Gastos este mes</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-[#0B1A2E] mb-4">Operaciones Rápidas</h3>
            <div className="grid grid-cols-4 gap-4">
              <button 
                onClick={() => onNavigate('expenses')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="h-12 w-12 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-gray-700">Gastos</span>
              </button>
              
              <button 
                onClick={() => onNavigate('income')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-gray-700">Ingresos</span>
              </button>
              
              <button 
                onClick={() => onNavigate('debts')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-gray-700">Deudas</span>
              </button>
              
              <button 
                onClick={() => onNavigate('loans')}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="h-12 w-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Briefcase className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-gray-700">Préstamos</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bank-card p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 border-l-4 border-l-[#059669]">
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#059669]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Ingresos del Mes</p>
              <p className="text-lg font-bold text-[#0B1A2E]">{formatCurrency(totalIncome, currency)}</p>
            </div>
          </div>
          
          <div className="bank-card p-4 rounded-xl border border-[#E2E8F0] shadow-sm border-l-4 border-l-[#DC2626]">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Gastos del Mes</p>
                <p className="text-lg font-bold text-[#0B1A2E]">{formatCurrency(totalExpense, currency)}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-[#DC2626] h-1.5 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-right">60% del presupuesto</p>
          </div>
          
          <div className="bank-card p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Deudas Pendientes</p>
              <p className="text-lg font-bold text-[#0B1A2E]">{formatCurrency(totalDebt, currency)}</p>
            </div>
          </div>
          
          <div className="bank-card p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 border-l-4 border-l-[#1A56DB]">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-[#1A56DB]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Préstamos por Cobrar</p>
              <p className="text-lg font-bold text-[#0B1A2E]">{formatCurrency(totalLoans, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Cashflow Area Chart */}
      <div className="bank-card bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[#0B1A2E]">Flujo de Caja</h2>
          <select className="bg-[#F0F4F8] border-none text-sm font-medium text-[#0B1A2E] rounded-md px-3 py-1 outline-none">
            <option>Últimos 6 meses</option>
            <option>Este año</option>
          </select>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1A56DB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} tickFormatter={formatYAxisTick} />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), '']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#1A56DB" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
              <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#94A3B8" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Service Windows Section */}
      <div>
        <h2 className="bank-section-title text-sm font-bold text-[#0B1A2E] uppercase tracking-wider mb-4">Servicios Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <button onClick={() => onNavigate('expenses')} className="bank-card-hover bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm text-left flex items-start justify-between group hover:border-[#1A56DB]/30 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1A2E] mb-1">Mis Gastos</h3>
                <p className="text-xs text-gray-500 line-clamp-2">Visualiza y categoriza todos tus egresos mensuales.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1A56DB] transition-colors shrink-0" />
          </button>
          
          <button onClick={() => onNavigate('income')} className="bank-card-hover bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm text-left flex items-start justify-between group hover:border-[#1A56DB]/30 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1A2E] mb-1">Mis Ingresos</h3>
                <p className="text-xs text-gray-500 line-clamp-2">Control de nómina, ventas y otros ingresos recibidos.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1A56DB] transition-colors shrink-0" />
          </button>
          
          <button onClick={() => onNavigate('debts')} className="bank-card-hover bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm text-left flex items-start justify-between group hover:border-[#1A56DB]/30 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1A2E] mb-1">Mis Deudas</h3>
                <p className="text-xs text-gray-500 line-clamp-2">Gestión de cuentas por pagar a terceros.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1A56DB] transition-colors shrink-0" />
          </button>
          
          <button onClick={() => onNavigate('loans')} className="bank-card-hover bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm text-left flex items-start justify-between group hover:border-[#1A56DB]/30 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1A2E] mb-1">Mis Préstamos</h3>
                <p className="text-xs text-gray-500 line-clamp-2">Seguimiento de dinero prestado y cuotas por cobrar.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1A56DB] transition-colors shrink-0" />
          </button>
          
          <button onClick={() => onNavigate('advisor')} className="bank-card-hover bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm text-left flex items-start justify-between group hover:border-[#D4A853]/30 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#F0F4F8] text-[#1A3A5C] flex items-center justify-center shrink-0">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#0B1A2E]">Asesor Financiero</h3>
                  <span className="bg-[#D4A853] text-[#0B1A2E] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">PRO</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">Análisis inteligente y recomendaciones para tus finanzas.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#D4A853] transition-colors shrink-0" />
          </button>
          
          <button onClick={() => onNavigate('settings')} className="bank-card-hover bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm text-left flex items-start justify-between group hover:border-[#1A56DB]/30 hover:shadow-md transition-all">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1A2E] mb-1">Configuración</h3>
                <p className="text-xs text-gray-500 line-clamp-2">Preferencias de cuenta, moneda y perfil.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1A56DB] transition-colors shrink-0" />
          </button>

        </div>
      </div>

    </div>
  );
}
