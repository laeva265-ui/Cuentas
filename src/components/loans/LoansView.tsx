import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, HandCoins, Plus, ArrowUpRight, ArrowDownRight, 
  CheckCircle, MessageCircle, AlertCircle, Quote, Eye, History
} from 'lucide-react';
import { User, Loan, LoanType } from '../../types';
import { formatCurrency, formatDate, calculateMonthsBetween } from '../../utils/formatters';
import { LoanHistoryModal } from './LoanHistoryModal';

interface LoansViewProps {
  currentUser: User;
  loans: Loan[];
  onAddLoan: () => void;
  onOpenPaymentModal: (loan: Loan) => void;
  onLiquidateLoan: (loanId: string) => void;
  onDeleteLoan: (loanId: string) => void;
  onBackToDashboard: () => void;
}

export function LoansView({
  currentUser,
  loans,
  onAddLoan,
  onOpenPaymentModal,
  onLiquidateLoan,
  onDeleteLoan,
  onBackToDashboard
}: LoansViewProps) {
  const [activeTab, setActiveTab] = useState<'lent' | 'borrowed'>('lent');
  const [selectedLoanForHistory, setSelectedLoanForHistory] = useState<Loan | null>(null);

  const handleSettle = (loanId: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#1A56DB', '#FFFFFF']
    });
    onLiquidateLoan(loanId);
  };

  const lentLoans = loans.filter(l => l.type === 'lent');
  const borrowedLoans = loans.filter(l => l.type === 'borrowed');

  // Suma total original prestada
  const totalOriginal = loans.reduce((sum, l) => sum + (l.originalAmount || 0), 0);

  // Suma del restante que falta para completar los préstamos
  // (Gráfica: 920.000 + PC: 1.100.000 = 2.020.000)
  const totalPorPagar = loans
    .filter(l => l.status !== 'Saldado' && (l.remainingAmount || 0) > 0)
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  // Total cobrado / recuperado
  const totalCobrado = loans.reduce((sum, l) => sum + Math.max(0, (l.originalAmount || 0) - (l.remainingAmount || 0)), 0);
  const settledCount = loans.filter(l => l.status === 'Saldado' || (l.remainingAmount || 0) <= 0).length;

  const displayLoans = activeTab === 'lent' ? lentLoans : borrowedLoans;

  // Mantener actualizado el préstamo seleccionado para el modal si loans cambia
  const activeModalLoan = selectedLoanForHistory
    ? loans.find(l => l.id === selectedLoanForHistory.id) || selectedLoanForHistory
    : null;

  const handleWhatsApp = (phone: string, name: string, amount: number) => {
    const text = encodeURIComponent(`Hola ${name}, te escribo para recordarte sobre el préstamo pendiente por ${formatCurrency(amount)}. Saludos.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

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
      <div className="bank-card p-6 border-l-4 border-l-[#1A56DB] bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-[#1A56DB]">
              <HandCoins className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B1A2E]">Mis Préstamos · Gestión P2P</h1>
              <p className="text-slate-500">Administración de créditos personales, cobros y abonos</p>
            </div>
          </div>
          <button 
            onClick={onAddLoan}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0B1A2E] text-white rounded-xl hover:bg-[#122B4A] transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bank-card p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="bank-section-title text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Total Prestado</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalOriginal, currentUser.currency)}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Monto total en acuerdos</p>
        </div>
        
        {/* Campo POR PAGAR: Suma del restante que falta para completar los préstamos */}
        <div className="bank-card p-5 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between bg-amber-50/20">
          <div>
            <span className="bank-section-title text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 block">Por Pagar</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalPorPagar, currentUser.currency)}</span>
            </div>
          </div>
          <p className="text-[11px] text-amber-700/80 font-medium mt-2">Restante para completar préstamos</p>
        </div>

        <div className="bank-card p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="bank-section-title text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Total Cobrado</span>
            <div className="flex items-center gap-3 mt-1">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCobrado, currentUser.currency)}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{settledCount} acuerdo(s) saldado(s)</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('lent')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'lent' 
              ? 'bg-white text-[#1A56DB] shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Presté (Por Cobrar)
        </button>
        <button
          onClick={() => setActiveTab('borrowed')}
          className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'borrowed' 
              ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Me Prestaron (Por Pagar)
        </button>
      </div>

      {/* Loan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayLoans.map((loan) => {
          const isSaldado = loan.status === 'Saldado' || (loan.remainingAmount || 0) <= 0;
          const isOverdue = loan.status === 'Vencido' || (!isSaldado && new Date(loan.dueDate) < new Date());
          const totalAbonado = Math.max(0, loan.originalAmount - loan.remainingAmount);
          const progress = loan.originalAmount > 0 ? (totalAbonado / loan.originalAmount) * 100 : 0;
          const numAbonos = loan.paymentsHistory?.length || 0;
          
          return (
            <div 
              key={loan.id} 
              onClick={() => setSelectedLoanForHistory(loan)}
              className={`bank-card p-6 bg-white rounded-2xl border shadow-sm flex flex-col transition-all hover:shadow-lg cursor-pointer group relative overflow-hidden ${
                isSaldado ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-[#1A56DB]/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1A56DB] group-hover:bg-[#1A56DB] group-hover:text-white transition-colors flex items-center justify-center font-bold text-lg">
                    {loan.personName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0B1A2E] group-hover:text-[#1A56DB] transition-colors flex items-center gap-2">
                      {loan.personName}
                    </h3>
                    <p className="text-xs text-slate-500">{loan.contactPhone || 'Sin teléfono'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLoanForHistory(loan);
                    }}
                    className="text-xs font-semibold text-[#1A56DB] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors border border-blue-200/50"
                    title="Ver historial de abonos"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{numAbonos} Abono{numAbonos !== 1 ? 's' : ''}</span>
                  </button>

                  {isSaldado ? (
                    <span className="trust-badge text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> SALDADO
                    </span>
                  ) : isOverdue ? (
                    <span className="trust-badge text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> VENCIDO
                    </span>
                  ) : (
                    <span className="trust-badge text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      AL DÍA
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-6 mt-2">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                      {activeTab === 'lent' ? 'Por Cobrar (Faltante)' : 'Por Pagar'}
                    </p>
                    <p className={`text-3xl font-bold ${isSaldado ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {formatCurrency(loan.remainingAmount, currentUser.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Monto Original</p>
                    <p className="text-sm font-medium text-slate-400 line-through">{formatCurrency(loan.originalAmount, currentUser.currency)}</p>
                  </div>
                </div>
                
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isSaldado ? 'bg-emerald-500' : activeTab === 'lent' ? 'bg-[#1A56DB]' : 'bg-[#D4A853]'}`}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2.5 text-xs gap-1 text-slate-500 font-medium border-t border-slate-100 pt-2">
                  <span>{progress.toFixed(1)}% {activeTab === 'lent' ? 'recuperado' : 'pagado'} ({formatCurrency(totalAbonado, currentUser.currency)} abonados)</span>
                  <div className="flex gap-2">
                    {loan.startDate && <span>Inicio: {formatDate(loan.startDate)}</span>}
                    {loan.dueDate && <span>Vence: {formatDate(loan.dueDate)}</span>}
                  </div>
                </div>
              </div>

              {loan.notes && (
                <div className="bg-slate-50 rounded-xl p-3 mb-5 text-sm text-slate-600 flex gap-2 border border-slate-100">
                  <Quote className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                  <p className="italic text-xs">{loan.notes}</p>
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                {!isSaldado ? (
                  <>
                    <button
                      onClick={() => onOpenPaymentModal(loan)}
                      className="flex-1 py-2.5 bg-[#0B1A2E] text-white rounded-xl hover:bg-[#122B4A] transition-colors font-medium text-sm flex justify-center items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-[#D4A853]" />
                      Registrar Abono
                    </button>
                    {activeTab === 'lent' ? (
                      loan.contactPhone ? (
                        <button
                          onClick={() => handleWhatsApp(loan.contactPhone!, loan.personName, loan.remainingAmount)}
                          className="px-4 py-2.5 bg-[#25D366]/10 text-[#128C7E] rounded-xl hover:bg-[#25D366]/20 transition-colors font-medium text-sm flex items-center justify-center"
                          title="Recordatorio por WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      ) : null
                    ) : (
                      <button
                        onClick={() => handleSettle(loan.id)}
                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm flex justify-center items-center"
                      >
                        Saldar Total
                      </button>
                    )}
                    {activeTab === 'lent' && (
                      <button
                        onClick={() => handleSettle(loan.id)}
                        className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium text-sm flex items-center justify-center"
                        title="Saldar Total"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => onDeleteLoan(loan.id)}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-red-600 transition-colors font-medium text-sm"
                  >
                    Eliminar Registro
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {displayLoans.length === 0 && (
          <div className="col-span-1 lg:col-span-2 py-12 text-center bank-card bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-500 font-medium">No hay registros en esta categoría.</p>
          </div>
        )}
      </div>

      {/* Ventana de emergencia (Modal emergente) con el detalle y abonos del préstamo */}
      <LoanHistoryModal
        isOpen={!!activeModalLoan}
        loan={activeModalLoan}
        currentUser={currentUser}
        onClose={() => setSelectedLoanForHistory(null)}
        onOpenPaymentModal={(loan) => {
          setSelectedLoanForHistory(null);
          onOpenPaymentModal(loan);
        }}
      />
    </div>
  );
}
