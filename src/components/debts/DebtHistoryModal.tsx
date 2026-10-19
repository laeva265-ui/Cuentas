import React, { useState } from 'react';
import { 
  X, Calendar, CreditCard, CheckCircle, ArrowDownLeft, 
  Clock, Plus, TrendingUp, ShieldCheck, FileSpreadsheet, 
  Layers, ArrowUpRight 
} from 'lucide-react';
import { User, Debt, DebtPayment } from '../../types';
import { formatCurrency, formatDate, calculateMonthsBetween } from '../../utils/formatters';

interface DebtHistoryModalProps {
  isOpen: boolean;
  debt: Debt | null;
  currentUser: User;
  onClose: () => void;
  onOpenPaymentModal: (debt: Debt) => void;
  onOpenIncreaseModal?: (debt: Debt) => void;
}

export const DebtHistoryModal: React.FC<DebtHistoryModalProps> = ({
  isOpen,
  debt,
  currentUser,
  onClose,
  onOpenPaymentModal,
  onOpenIncreaseModal
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'abonos' | 'aumentos'>('all');

  if (!isOpen || !debt) return null;

  const history = debt.paymentsHistory || [];

  const isIncrease = (item: DebtPayment) => {
    if (item.type === 'monto_deuda') return true;
    if (item.type === 'abono') return false;
    const note = (item.note || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    return id.startsWith('inc-') || note.includes('adicional') || note.includes('aumento') || note.includes('monto');
  };

  const abonosList = history.filter(item => !isIncrease(item));
  const aumentosList = history.filter(item => isIncrease(item));

  const totalAbonado = abonosList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalAumentos = aumentosList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const progress = debt.totalAmount > 0 ? (totalAbonado / debt.totalAmount) * 100 : 0;
  const isLiquidated = debt.status === 'Liquidada' || debt.currentBalance <= 0;

  const filteredHistory = history.filter(item => {
    if (activeFilter === 'abonos') return !isIncrease(item);
    if (activeFilter === 'aumentos') return isIncrease(item);
    return true;
  });

  const getMonthlyPayment = () => {
    const start = debt.date || new Date().toISOString().split('T')[0];
    const end = debt.dueDate || start;
    const plazo = calculateMonthsBetween(start, end);
    return Math.max(1, Math.round((debt.totalAmount || debt.currentBalance) / plazo));
  };

  // Helper to determine index within its specific category
  const getItemIndex = (item: DebtPayment) => {
    if (isIncrease(item)) {
      const idx = aumentosList.findIndex(x => x.id === item.id);
      return idx >= 0 ? idx + 1 : 1;
    } else {
      const idx = abonosList.findIndex(x => x.id === item.id);
      return idx >= 0 ? idx + 1 : 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bank-header-gradient px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl gold-accent">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Detalle y Movimientos de la Deuda</h2>
              <p className="text-xs text-white/70">Registro individual permanente de abonos y más monto a deuda</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Info Card */}
          <div className="bg-white rounded-2xl p-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-[#D4A853] flex items-center justify-center font-bold text-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{debt.title || debt.lender}</h3>
                  <p className="text-xs text-slate-500">{debt.lender || 'Institución Financiera'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                  {debt.interestRate}% APR
                </span>
                {isLiquidated ? (
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Liquidada
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    {debt.status}
                  </span>
                )}
              </div>
            </div>

            {/* Metrics 3 Columns */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center">
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Deuda</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                  {formatCurrency(debt.totalAmount, currentUser.currency)}
                </p>
                {totalAumentos > 0 && (
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    +{formatCurrency(totalAumentos, currentUser.currency)} agregados
                  </span>
                )}
              </div>
              <div className="border-x border-slate-200 px-1">
                <p className="text-[11px] text-emerald-600 uppercase font-semibold">Total Abonado</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(totalAbonado, currentUser.currency)}
                </p>
                <span className="text-[10px] text-emerald-600/80 font-medium block mt-0.5">
                  {abonosList.length} abono{abonosList.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-amber-600 uppercase font-semibold">Saldo Pendiente</p>
                <p className="text-sm sm:text-base font-bold text-amber-600 mt-0.5">
                  {formatCurrency(debt.currentBalance, currentUser.currency)}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Por pagar
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Progreso de amortización</span>
                <span>{progress.toFixed(1)}% pagado</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isLiquidated ? 'bg-emerald-500' : 'bg-[#D4A853]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            {/* Dates & Payment */}
            <div className="flex justify-between items-center mt-3 pt-2 text-xs text-slate-500 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Cuota: {formatCurrency(getMonthlyPayment(), currentUser.currency)}/mes</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Vence: {formatDate(debt.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Movements Section (Abonos vs Más Monto a Deuda) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-[#0B1A2E] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1A56DB]" />
                  Historial de Movimientos ({history.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cada abono e ingreso de monto se guarda individual y permanente
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    activeFilter === 'all' 
                      ? 'bg-white text-slate-900 shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('abonos')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    activeFilter === 'abonos' 
                      ? 'bg-white text-emerald-700 shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Abonos ({abonosList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('aumentos')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    activeFilter === 'aumentos' 
                      ? 'bg-white text-amber-800 shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-amber-800'
                  }`}
                >
                  + Monto Deuda ({aumentosList.length})
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-medium">
                  {activeFilter === 'aumentos' 
                    ? 'No hay registros de más monto ingresado a la deuda.'
                    : activeFilter === 'abonos' 
                    ? 'Aún no se han registrado abonos para esta deuda.' 
                    : 'Aún no se han registrado movimientos para esta deuda.'}
                </p>
                {!isLiquidated && (
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPaymentModal(debt);
                      }}
                      className="text-xs font-bold text-[#1A56DB] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Registrar Abono
                    </button>
                    {onOpenIncreaseModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenIncreaseModal(debt);
                        }}
                        className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ingresar Más Monto
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredHistory.map((item, index) => {
                  const isInc = isIncrease(item);
                  const itemIndex = getItemIndex(item);

                  return (
                    <div 
                      key={item.id || `mov-${index}`}
                      className={`p-3.5 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
                        isInc 
                          ? 'bg-amber-50/40 border-l-4 border-l-amber-500 border-amber-200 hover:border-amber-400' 
                          : 'bg-white border-l-4 border-l-emerald-500 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {/* Left Side: Icon & Details */}
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          isInc 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {isInc ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className={`text-xs font-bold ${
                              isInc ? 'text-amber-950' : 'text-slate-800'
                            }`}>
                              {isInc ? `Aumento de Deuda #${itemIndex}` : `Abono #${itemIndex}`}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                              isInc 
                                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {isInc ? '+ Más Monto a Deuda' : 'Abono a Capital'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              • {formatDate(item.date)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-medium">
                            {item.note || (isInc ? 'Monto adicional ingresado a la deuda' : 'Abono registrado')}
                          </p>
                          <span className={`text-[10px] font-semibold mt-0.5 block ${
                            isInc ? 'text-amber-700/80' : 'text-emerald-700/80'
                          }`}>
                            {isInc 
                              ? 'Incrementa la deuda total y el saldo pendiente (No es abono)' 
                              : (item.source === 'available_balance' ? 'Disminuye deuda desde Saldo Disponible' : 'Disminuye deuda con pago externo')}
                          </span>
                        </div>
                      </div>

                      {/* Right Side: Amount */}
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className={`text-sm sm:text-base font-extrabold block ${
                          isInc ? 'text-amber-800' : 'text-emerald-600'
                        }`}>
                          {isInc ? '+' : '-'}{formatCurrency(item.amount, currentUser.currency)}
                        </span>
                        {item.balanceAfter !== undefined && (
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Saldo: {formatCurrency(item.balanceAfter, currentUser.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Permanent Ledger Notice */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500">
              <FileSpreadsheet className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                <strong>Registro Permanente en Excel:</strong> Cada abono e incremento queda archivado como movimiento individual. Nunca se unifican ni se sobrescriben.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cerrar
          </button>
          {isLiquidated ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Registro Histórico Protegido (No eliminable)</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {onOpenIncreaseModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenIncreaseModal(debt);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-colors shadow-sm"
                  title="Ingresar más monto a esta deuda (no es abono)"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  Ingresar Más Monto
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(debt);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1A2E] hover:bg-[#122B4A] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 gold-accent" />
                Registrar Nuevo Abono
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
