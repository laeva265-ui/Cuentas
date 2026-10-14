import React from 'react';
import { X, Calendar, DollarSign, User as UserIcon, CheckCircle, ArrowDownLeft, Clock, Plus } from 'lucide-react';
import { User, Loan } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface LoanHistoryModalProps {
  isOpen: boolean;
  loan: Loan | null;
  currentUser: User;
  onClose: () => void;
  onOpenPaymentModal: (loan: Loan) => void;
}

export const LoanHistoryModal: React.FC<LoanHistoryModalProps> = ({
  isOpen,
  loan,
  currentUser,
  onClose,
  onOpenPaymentModal
}) => {
  if (!isOpen || !loan) return null;

  const totalAbonado = Math.max(0, loan.originalAmount - loan.remainingAmount);
  const progress = loan.originalAmount > 0 ? (totalAbonado / loan.originalAmount) * 100 : 0;
  const isSaldado = loan.status === 'Saldado' || loan.remainingAmount <= 0;
  const history = loan.paymentsHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B1A2E] px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl text-[#D4A853]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Detalle y Abonos del Préstamo</h2>
              <p className="text-xs text-white/70">Historial completo de pagos registrados</p>
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
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1A56DB] flex items-center justify-center font-bold text-lg">
                  {loan.personName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{loan.personName}</h3>
                  <p className="text-xs text-slate-500">{loan.contactPhone || 'Sin teléfono'}</p>
                </div>
              </div>
              {isSaldado ? (
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Saldado
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  {loan.status}
                </span>
              )}
            </div>

            {/* Metrics 3 Columns */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center">
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Préstamo</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                  {formatCurrency(loan.originalAmount, currentUser.currency)}
                </p>
              </div>
              <div className="border-x border-slate-200 px-1">
                <p className="text-[11px] text-emerald-600 uppercase font-semibold">Total Abonado</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(totalAbonado, currentUser.currency)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-amber-600 uppercase font-semibold">Por Pagar</p>
                <p className="text-sm sm:text-base font-bold text-amber-600 mt-0.5">
                  {formatCurrency(loan.remainingAmount, currentUser.currency)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Progreso de recuperación</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isSaldado ? 'bg-emerald-500' : 'bg-[#1A56DB]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="flex justify-between items-center mt-3 pt-2 text-xs text-slate-500 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Inicio: {formatDate(loan.startDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Vence: {formatDate(loan.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Abonos Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#0B1A2E] flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                Historial de Abonos Realizados ({history.length})
              </h4>
              <span className="text-xs text-slate-400">Registrados en Excel</span>
            </div>

            {history.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-medium">Aún no se han registrado abonos para este préstamo.</p>
                {!isSaldado && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPaymentModal(loan);
                    }}
                    className="mt-3 text-xs font-bold text-[#1A56DB] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar el primer abono ahora
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {history.map((abono, index) => (
                  <div 
                    key={abono.id || `abono-${index}`}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Abono #{index + 1}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {formatDate(abono.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {abono.note || 'Cobro registrado'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        +{formatCurrency(abono.amount, currentUser.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          {!isSaldado && (
            <button
              onClick={() => {
                onClose();
                onOpenPaymentModal(loan);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B1A2E] hover:bg-[#122B4A] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-[#D4A853]" />
              Registrar Nuevo Abono
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
