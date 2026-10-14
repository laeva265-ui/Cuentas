import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, CreditCard, Plus, TrendingUp, AlertCircle, 
  CheckCircle, ArrowRight, Wallet, Percent, Target, History, ShieldCheck
} from 'lucide-react';
import { User, Debt } from '../../types';
import { formatCurrency, formatDate, calculateMonthsBetween } from '../../utils/formatters';
import { DebtHistoryModal } from './DebtHistoryModal';

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
  const [selectedDebtForHistory, setSelectedDebtForHistory] = useState<Debt | null>(null);

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
    
  const liquidatedCount = debts.filter(d => d.status === 'Liquidada' || (d.currentBalance || 0) <= 0).length;

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

  // Mantener actualizado el pasivo seleccionado para el modal
  const activeModalDebt = selectedDebtForHistory
    ? debts.find(d => d.id === selectedDebtForHistory.id) || selectedDebtForHistory
    : null;

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
      <div className="bank-card p-4 sm:p-6 border-l-4 border-l-[#D4A853] bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-amber-50 rounded-xl text-[#D4A853] shrink-0">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0B1A2E]">Mis Deudas · Centro de Crédito</h1>
              <p className="text-slate-500 text-xs sm:text-sm md:text-base">Gestión estratégica de pasivos financieros y control de amortización</p>
            </div>
          </div>
          <button 
            onClick={onAddDebt}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 sm:py-3 bg-[#0B1A2E] text-white rounded-xl hover:bg-[#122B4A] transition-colors shadow-sm font-semibold text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Registrar Pasivo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bank-card p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="bank-section-title text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Saldo Pendiente</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900 truncate block">{formatCurrency(totalDebt, currentUser.currency)}</span>
          </div>
          <p className="text-[11px] text-amber-600/80 font-medium mt-2">Pasivos activos</p>
        </div>
        
        <div className="bank-card p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="bank-section-title text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Pago Mínimo</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900 truncate block">{formatCurrency(totalMinPayment, currentUser.currency)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Compromiso mensual</p>
        </div>

        <div className="bank-card p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="bank-section-title text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Tasa APR</span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900 truncate block">{weightedApr.toFixed(1)}%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Costo promedio</p>
        </div>

        <div className="bank-card p-3.5 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="bank-section-title text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Liquidadas</span>
            <span className="text-lg sm:text-2xl font-bold text-emerald-600 truncate block">{liquidatedCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Acuerdos saldados</p>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="bank-card p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-[#1A56DB]" />
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
          const totalAmortizado = Math.max(0, debt.totalAmount - debt.currentBalance);
          const progress = debt.totalAmount > 0 ? (totalAmortizado / debt.totalAmount) * 100 : 0;
          const isLiquidated = debt.status === 'Liquidada' || debt.currentBalance <= 0;
          const numAbonos = debt.paymentsHistory?.length || 0;
          
          return (
            <div 
              key={debt.id} 
              onClick={() => setSelectedDebtForHistory(debt)}
              className={`bank-card p-6 bg-white rounded-2xl border shadow-sm flex flex-col transition-all hover:shadow-lg cursor-pointer group relative overflow-hidden ${
                isLiquidated ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-amber-300'
              }`}
            >
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDebtForHistory(debt);
                    }}
                    className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border border-amber-200/60"
                    title="Ver historial de abonos"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{numAbonos} Abono{numAbonos !== 1 ? 's' : ''}</span>
                  </button>

                  <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                    {debt.interestRate}% APR
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0B1A2E] group-hover:text-amber-700 transition-colors truncate">
                  {debt.title}
                </h3>
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
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                  <span>{progress.toFixed(1)}% amortizado ({formatCurrency(totalAmortizado, currentUser.currency)} abonados)</span>
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

              <div className="mt-auto pt-4 flex gap-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                {!isLiquidated ? (
                  <>
                    <button
                      onClick={() => onOpenPaymentModal(debt)}
                      className="flex-1 py-2.5 bg-[#0B1A2E] text-white rounded-xl hover:bg-[#122B4A] transition-colors font-medium text-sm flex justify-center items-center gap-2 shadow-sm"
                    >
                      Abonar <ArrowRight className="w-4 h-4 text-[#D4A853]" />
                    </button>
                    <button
                      onClick={() => handleLiquidate(debt.id)}
                      className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm flex justify-center items-center"
                    >
                      Liquidar Total
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Registro Histórico Protegido</span>
                    </div>
                    <button
                      onClick={() => setSelectedDebtForHistory(debt)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Ver Historial
                    </button>
                  </div>
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

      {/* Ventana de emergencia (Modal emergente) con el detalle y abonos de la deuda */}
      <DebtHistoryModal
        isOpen={!!activeModalDebt}
        debt={activeModalDebt}
        currentUser={currentUser}
        onClose={() => setSelectedDebtForHistory(null)}
        onOpenPaymentModal={(debt) => {
          setSelectedDebtForHistory(null);
          onOpenPaymentModal(debt);
        }}
      />
    </div>
  );
}
