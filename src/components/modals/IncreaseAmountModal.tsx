import React, { useState } from 'react';
import { X, Plus, AlertCircle, Calendar, FileText, ArrowUpCircle } from 'lucide-react';
import { User, Debt, Loan } from '../../types';
import { formatCurrency, formatThousandsInput, parseThousandsInput } from '../../utils/formatters';

interface IncreaseAmountModalProps {
  isOpen: boolean;
  currentUser: User;
  item: Debt | Loan | null;
  itemType: 'debt' | 'loan';
  onClose: () => void;
  onSubmitIncrease: (itemId: string, amount: number, note?: string) => void;
}

export const IncreaseAmountModal: React.FC<IncreaseAmountModalProps> = ({
  isOpen,
  currentUser,
  item,
  itemType,
  onClose,
  onSubmitIncrease
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const isDebt = itemType === 'debt';
  const name = isDebt ? (item as Debt).title : (item as Loan).personName;
  const currentBalance = isDebt
    ? (item as Debt).currentBalance
    : (item as Loan).remainingAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatThousandsInput(e.target.value);
    setAmountStr(formatted);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseThousandsInput(amountStr);

    if (numAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    onSubmitIncrease(item.id, numAmount, note.trim() || undefined);
    setAmountStr('');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bank-header-gradient px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl gold-accent">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isDebt ? 'Ingresar Más Monto a la Deuda' : 'Ingresar Más Monto al Préstamo'}
              </h2>
              <p className="text-xs text-white/70">
                Incrementa el saldo pendiente (no es un abono, adiciona deuda)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Summary Banner */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                {isDebt ? 'Pasivo Seleccionado' : 'Préstamo Seleccionado'}
              </p>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">{name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Saldo pendiente actual</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900">
                {formatCurrency(currentBalance, currentUser.currency)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Este monto se <strong>sumará al saldo adeudado</strong>. Úsalo cuando realices un nuevo consumo con la tarjeta, un reenganche o recibas un desembolso adicional.
            </p>
          </div>

          {/* Amount input */}
          <div>
            <label className="bank-section-title block mb-1 text-slate-500 font-bold">
              Monto a Ingresar / Adicionar
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                {currentUser.currency}
              </span>
              <input
                type="text"
                required
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-16 pr-4 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white"
                autoFocus
              />
            </div>
          </div>

          {/* Date input */}
          <div>
            <label className="bank-section-title block mb-1 text-slate-500 font-bold">
              Fecha de la Operación
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white"
              />
            </div>
          </div>

          {/* Note input */}
          <div>
            <label className="bank-section-title block mb-1 text-slate-500 font-bold">
              Concepto / Motivo (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Nueva compra con tarjeta, Ampliación de préstamo..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bank-header-gradient text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4 gold-accent" />
              <span>Ingresar Monto a la Deuda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
