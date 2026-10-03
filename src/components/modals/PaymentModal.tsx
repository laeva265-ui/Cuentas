import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Banknote, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { User, Debt, Loan, PaymentSource } from '../../types';
import { formatCurrency, formatThousandsInput, parseThousandsInput, convertCurrency } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  currentUser: User;
  item: Debt | Loan | null;
  itemType: 'debt' | 'loan';
  availableBalance?: number;
  onClose: () => void;
  onSubmitPayment: (itemId: string, amount: number, note?: string, source?: PaymentSource) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  currentUser,
  item,
  itemType,
  availableBalance = 0,
  onClose,
  onSubmitPayment
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('available_balance');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNote('');
      setPaymentSource('available_balance');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const isDebt = itemType === 'debt';
  const isLoan = itemType === 'loan';
  const loanType = isLoan ? (item as Loan).type : null;
  
  // Es un pago saliente si es una deuda O si es un préstamo que me hicieron (borrowed)
  const isOutgoingPayment = isDebt || loanType === 'borrowed';

  const currentBalance = isDebt ? (item as Debt).currentBalance : (item as Loan).remainingAmount;
  const rawNumAmount = parseThousandsInput(amount);
  const baseNumAmount = convertCurrency(rawNumAmount, currentUser.currency, 'COP');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(rawNumAmount) || rawNumAmount <= 0) return;
    
    // Check if full payment for confetti
    if (baseNumAmount >= currentBalance) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1A56DB', '#059669', '#D4A853']
      });
    }

    onSubmitPayment(item.id, baseNumAmount, note, isOutgoingPayment ? paymentSource : undefined);
    onClose();
  };

  const handleQuickAmount = (type: 'half' | 'full') => {
    const balanceInUserCurrency = convertCurrency(currentBalance, 'COP', currentUser.currency);
    if (type === 'half') {
      setAmount(formatThousandsInput(Math.round(balanceInUserCurrency / 2)));
    } else {
      setAmount(formatThousandsInput(Math.round(balanceInUserCurrency)));
    }
  };

  const title = isDebt 
    ? 'Abono a Deuda' 
    : loanType === 'borrowed' 
      ? 'Pagar Préstamo Pendiente' 
      : 'Cobro de Préstamo Otorgado';

  const name = isDebt ? (item as Debt).lender : (item as Loan).personName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0B1A2E] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#E8C374]" />
            </div>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Summary Card */}
          <div className="bg-[#F0F4F8] rounded-xl p-4 mb-5 border border-slate-200 flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Wallet className="w-6 h-6 text-[#1A56DB]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{name}</p>
              <p className="text-2xl font-bold text-[#0B1A2E]">
                {formatCurrency(currentBalance, currentUser.currency)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Saldo pendiente</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Monto del Abono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monto del Abono
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  {currentUser.currency}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => setAmount(formatThousandsInput(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-14 pr-4 py-3 text-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Botones de selección rápida */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleQuickAmount('half')}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200"
              >
                50% del Saldo
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount('full')}
                className="flex-1 py-2 bg-[#E8C374]/20 hover:bg-[#E8C374]/30 text-[#D4A853] text-sm font-semibold rounded-lg transition-colors border border-[#E8C374]/30"
              >
                Liquidar Total
              </button>
            </div>

            {/* Selección de Origen de Fondos (si es pago saliente) */}
            {isOutgoingPayment ? (
              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-800 mb-2.5">
                  ¿De dónde deseas sacar el dinero para este abono?
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción: Saldo Disponible */}
                  <div
                    onClick={() => setPaymentSource('available_balance')}
                    className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      paymentSource === 'available_balance'
                        ? 'border-[#1A56DB] bg-blue-50/60 shadow-sm ring-1 ring-[#1A56DB]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${paymentSource === 'available_balance' ? 'bg-[#1A56DB] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-[#0B1A2E]">Saldo Disponible</span>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Descuenta de tu cuenta</p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        Disponible: {formatCurrency(availableBalance, currentUser.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Opción: Efectivo / Fuente Externa */}
                  <div
                    onClick={() => setPaymentSource('external')}
                    className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      paymentSource === 'external'
                        ? 'border-[#1A56DB] bg-blue-50/60 shadow-sm ring-1 ring-[#1A56DB]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${paymentSource === 'external' ? 'bg-[#1A56DB] text-white' : 'bg-slate-200 text-slate-600'}`}>
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

                {/* Advertencia si no alcanza el saldo disponible */}
                {paymentSource === 'available_balance' && numAmount > availableBalance && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mt-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Saldo Disponible insuficiente</p>
                      <p className="text-amber-700">
                        El monto ({formatCurrency(numAmount, currentUser.currency)}) supera tu saldo actual ({formatCurrency(availableBalance, currentUser.currency)}). Si continúas, tu saldo quedará en $0.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Indicador para cobro de préstamo entrante */
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Ingreso a Saldo Disponible</p>
                  <p className="text-emerald-700">Este cobro recuperado se sumará automáticamente a tu Saldo Disponible.</p>
                </div>
              </div>
            )}

            {/* Nota u Observación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nota u Observación (Opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow text-sm"
                placeholder={isOutgoingPayment && paymentSource === 'available_balance' ? 'Abono descontado de Saldo Disponible' : 'Ej. Transferencia, Efectivo...'}
              />
            </div>

            {/* Acciones */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-[#0B1A2E] hover:bg-[#122B4A] shadow-md hover:shadow-lg transition-all"
              >
                Confirmar Abono
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
