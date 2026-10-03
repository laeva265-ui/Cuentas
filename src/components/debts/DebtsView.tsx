import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, CreditCard, Plus, TrendingUp, AlertCircle, 
  CheckCircle, ArrowRight, Wallet, Percent, Target
} from 'lucide-react';
import { User, Debt } from '../../types';
import { formatCurrency, formatDate, calculateMonthsBetween } from '../../utils/formatters';

interface DebtsViewProps {
  currentUser: User;
  debts: Debt[];
  onAddDebt: () => void;
  onOpenPaymentModal: (debt: Debt) => void;
  onLiquidateDebt: (debtId: string) => void;
  onDeleteDebt: (debtId: string) => void;
  onBackToDashboard: () => void;
}

export function DebtsView({
  currentUser,
  debts,
  onAddDebt,
  onOpenPaymentModal,
  onLiquidateDebt,
  onDeleteDebt,
  onBackToDashboard
}: DebtsViewProps) {
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');

  const handleLiquidate = (debtId: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#D4A853', '#1A56DB']
    });
    onLiquidateDebt(debtId);
  };

  const getDebtMonthlyPayment = (d: Debt): number => {
    const start = d.date || new Date().toISOString().split('T')[0];
    const end = d.dueDate || start;
    const plazo = calculateMonthsBetween(start, end);
    return Math.max(1, Math.round((d.totalAmount || d.currentBalance) / plazo));
  };

  const totalDebt = debts.filter(d => d.status !== 'Liquidada').reduce((sum, d) => sum + d.currentBalance, 0);
  const totalMinPayment = debts.filter(d => d.status !== 'Liquidada').reduce((sum, d) => sum + getDebtMonthlyPayment(d), 0);
  
  // Calculate weighted APR
  const weightedApr = totalDebt > 0 
    ? debts.filter(d => d.status !== 'Liquidada').reduce((sum, d) => sum + (d.interestRate * d.currentBalance), 0) / totalDebt
    : 0;
    
  const liquidatedCount = debts.filter(d => d.status === 'Liquidada').length;

  // Sort debts based on strategy
  const activeDebts = debts.filter(d => d.status !== 'Liquidada').sort((a, b) => {
    if (strategy === 'snowball') {
      return a.currentBalance - b.currentBalance; // Smallest balance first
    } else {
      return b.interestRate - a.interestRate; // Highest interest first
    }
  });
  
  const liquidatedDebts = debts.filter(d => d.status === 'Liquidada');
  const displayDebts = [...activeDebts, ...liquidatedDebts];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Navigation */}
      <button 
        onClick={onBackToDashboard}
        className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Menú Principal
      </button>

      {/* Page Header */}
      <div className="bank-card p-6 border-l-4 border-l-[#D4A853] bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-[#D4A853]">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1A2E]">Mis Deudas · Centro de Crédito</h1>
              <p className="text-slate-500">Gestión estratégica de pasivos financieros</p>
            </div>
          </div>
          <button 
            onClick={onAddDebt}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0B1A2E] text-white rounded-xl hover:bg-[#122B4A] transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Registrar Pasivo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bank-card p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <span className="bank-section-title text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Saldo Total</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalDebt, currentUser.currency)}</span>
          </div>
        </div>
        
        <div className="bank-card p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <span className="bank-section-title text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pago Mínimo Mensual</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalMinPayment, currentUser.currency)}</span>
          </div>
        </div>

        <div className="bank-card p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <span className="bank-section-title text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tasa Ponderada (APR)</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{weightedApr.toFixed(2)}%</span>
          </div>
        </div>

        <div className="bank-card p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <span className="bank-section-title text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deudas Liquidadas</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">{liquidatedCount}</span>
          </div>
        </div>
      </div>

      {/* Strategy Panel */}
      <div className="bank-card p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-[#0B1A2E]">Estrategia de Pago</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStrategy('snowball')}
            className={`flex-1 py-3 px-4 rounded-lg flex flex-col items-center justify-center transition-all ${strategy === 'snowball' ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className={`font-semibold ${strategy === 'snowball' ? 'text-[#0B1A2E]' : ''}`}>Bola de Nieve</span>
            <span className="text-xs mt-1 text-center text-slate-500">Pagar saldos menores primero para motivación</span>
          </button>
          <button
            onClick={() => setStrategy('avalanche')}
            className={`flex-1 py-3 px-4 rounded-lg flex flex-col items-center justify-center transition-all ${strategy === 'avalanche' ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className={`font-semibold ${strategy === 'avalanche' ? 'text-[#0B1A2E]' : ''}`}>Avalancha</span>
            <span className="text-xs mt-1 text-center text-slate-500">Pagar tasas más altas primero para ahorrar</span>
          </button>
        </div>
      </div>

      {/* Debt Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayDebts.map((debt, index) => {
          const progress = ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100;
          const isLiquidated = debt.status === 'Liquidada';
          
          return (
            <div key={debt.id} className={`bank-card p-6 bg-white rounded-2xl border shadow-sm flex flex-col transition-all hover:shadow-md ${isLiquidated ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {!isLiquidated && (
                    <span className="trust-badge text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                      PRIORIDAD #{index + 1}
                    </span>
                  )}
                  {isLiquidated && (
                    <span className="trust-badge text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> LIQUIDADA
                    </span>
                  )}
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">{debt.category}</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                  {debt.interestRate}% APR
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0B1A2E] truncate">{debt.title}</h3>
                <p className="text-sm text-slate-500">{debt.lender || 'Institución Financiera'}</p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Saldo Actual</p>
                    <p className={`text-3xl font-bold ${isLiquidated ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {formatCurrency(debt.currentBalance, currentUser.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Original</p>
                    <p className="text-sm font-medium text-slate-400 line-through">{formatCurrency(debt.totalAmount, currentUser.currency)}</p>
                  </div>
                </div>
                
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isLiquidated ? 'bg-emerald-500' : 'bg-[#D4A853]'}`}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                  <span>{progress.toFixed(1)}% pagado</span>
                  {isLiquidated ? <span>Completado</span> : <span>Restante: {formatCurrency(debt.currentBalance, currentUser.currency)}</span>}
                </div>
              </div>

              {!isLiquidated && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6 flex justify-between items-center border border-slate-100">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Pago Mínimo</p>
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(getDebtMonthlyPayment(debt), currentUser.currency)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Vencimiento</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(debt.dueDate)}</p>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-3 border-t border-slate-100">
                {!isLiquidated ? (
                  <>
                    <button
                      onClick={() => onOpenPaymentModal(debt)}
                      className="flex-1 py-2.5 bg-[#0B1A2E] text-white rounded-xl hover:bg-[#122B4A] transition-colors font-medium text-sm flex justify-center items-center gap-2"
                    >
                      Abonar <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleLiquidate(debt.id)}
                      className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm flex justify-center items-center"
                    >
                      Liquidar Total
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onDeleteDebt(debt.id)}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-red-600 transition-colors font-medium text-sm"
                  >
                    Eliminar Registro
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {displayDebts.length === 0 && (
          <div className="col-span-1 lg:col-span-2 py-12 text-center bank-card bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-500 font-medium">No se han registrado pasivos en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
