import React, { useState } from 'react';
import { ArrowLeft, Bot, Lightbulb, PiggyBank, TrendingDown, ShieldAlert, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { User, Expense, Income, Debt, Loan, FinancialHealth } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface FinancialAIAssistantProps {
  currentUser: User;
  expenses: Expense[];
  incomes: Income[];
  debts: Debt[];
  loans: Loan[];
  financialHealth: FinancialHealth;
  onBackToDashboard: () => void;
}

export const FinancialAIAssistant: React.FC<FinancialAIAssistantProps> = ({
  currentUser,
  expenses,
  incomes,
  debts,
  loans,
  financialHealth,
  onBackToDashboard
}) => {
  const [payoffExtra, setPayoffExtra] = useState(1000);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Simplified logic for payoff simulator
  const totalDebt = debts.reduce((acc, d) => acc + d.currentBalance, 0);
  const baseMonthlyPayment = debts.reduce((acc, d) => {
    // Naive assumption: 5% of remaining amount as minimum payment
    return acc + (d.currentBalance * 0.05);
  }, 0);
  
  const currentMonthsToPayoff = baseMonthlyPayment > 0 ? Math.ceil(totalDebt / baseMonthlyPayment) : 0;
  const newMonthsToPayoff = (baseMonthlyPayment + payoffExtra) > 0 
    ? Math.ceil(totalDebt / (baseMonthlyPayment + payoffExtra)) 
    : 0;

  const faqs = [
    {
      q: '¿Qué es el fondo de emergencia ideal?',
      a: 'Recomendamos tener entre 3 y 6 meses de tus gastos fijos básicos ahorrados en una cuenta de alta liquidez.'
    },
    {
      q: '¿Cómo reducir mi nivel de endeudamiento?',
      a: 'Utiliza el método avalancha (pagar primero las deudas con mayor tasa de interés) o bola de nieve (pagar primero las deudas más pequeñas para ganar motivación).'
    },
    {
      q: '¿Cuánto debería ahorrar cada mes?',
      a: 'La regla 50/30/20 es un buen punto de partida: 50% para necesidades, 30% para deseos y 20% para ahorro e inversión.'
    }
  ];

  const renderHealthScore = () => {
    let color = 'text-green-600';
    let bgColor = 'bg-green-100';
    if (financialHealth.score < 50) {
      color = 'text-red-600';
      bgColor = 'bg-red-100';
    } else if (financialHealth.score < 75) {
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-100';
    }

    return (
      <div className={`flex items-center justify-center w-24 h-24 rounded-full ${bgColor} border-4 border-white shadow-sm`}>
        <span className={`text-3xl font-bold ${color}`}>{financialHealth.score}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-app-bg p-4 md:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-[#1A56DB] font-medium hover:underline bg-white px-4 py-2 rounded-full shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú Principal
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-4 bg-[#0B1A2E] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Bot className="w-48 h-48 -mr-8 -mt-8" />
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm z-10">
            <Bot className="w-10 h-10 text-[#E8C374]" />
          </div>
          <div className="z-10">
            <h1 className="text-3xl font-bold">Asesor Financiero IA</h1>
            <p className="text-blue-200 mt-1 text-lg flex items-center gap-2">
              <span className="trust-badge bg-[#1A56DB] text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Tu Banquero Digital</span>
              Análisis inteligente de tu perfil
            </p>
          </div>
          <div className="ml-auto z-10 hidden sm:block">
            {renderHealthScore()}
          </div>
        </div>

        {/* Diagnostic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 bank-card border-t-4 border-t-[#059669]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <PiggyBank className="w-6 h-6 text-[#059669]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Capacidad de Ahorro</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {financialHealth.savingsRate.toFixed(1)}%
            </p>
            <p className="text-sm text-slate-600">Ahorro mensual estimado basado en tus ingresos y gastos recientes.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 bank-card border-t-4 border-t-[#DC2626]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="w-6 h-6 text-[#DC2626]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Endeudamiento</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {financialHealth.debtToIncomeRatio.toFixed(1)}%
            </p>
            <p className="text-sm text-slate-600">Ratio de deuda sobre ingresos. Ideal mantenerlo por debajo del 30%.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 bank-card border-t-4 border-t-[#1A56DB]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-[#1A56DB]" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Colchón de Emergencia</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {financialHealth.runwayMonths.toFixed(1)} meses
            </p>
            <p className="text-sm text-slate-600">Meses de gastos cubiertos con tu ahorro actual.</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl p-6 bank-card shadow-sm">
          <h3 className="text-xl font-bold text-[#0B1A2E] mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-[#D4A853]" />
            Recomendaciones Personalizadas
          </h3>
          <div className="space-y-4">
            {financialHealth.insights.map((rec, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="mt-0.5">
                  {rec.type === 'positive' ? (
                    <CheckCircle className="w-5 h-5 text-[#059669]" />
                  ) : rec.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-[#D4A853]" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">{rec.title}</p>
                  <p className="text-slate-700 leading-relaxed">{rec.message}</p>
                </div>
              </div>
            ))}
            {financialHealth.insights.length === 0 && (
              <p className="text-slate-500 text-center py-4">Ingresa más datos para recibir recomendaciones.</p>
            )}
          </div>
        </div>

        {/* Payoff Simulator */}
        {totalDebt > 0 && (
          <div className="bg-white rounded-2xl p-6 bank-card shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-[#0B1A2E] mb-2">Simulador de Pagos Extra</h3>
            <p className="text-slate-500 mb-6 text-sm">Descubre cómo un aporte adicional reduce el tiempo de tu deuda total.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">
                  Aporte Extra Mensual: {formatCurrency(payoffExtra, currentUser.currency)}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={payoffExtra} 
                  onChange={(e) => setPayoffExtra(Number(e.target.value))}
                  className="w-full accent-[#1A56DB]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>$0</span>
                  <span>$10,000</span>
                </div>
              </div>
              
              <div className="bg-slate-50/90 p-5 rounded-xl flex items-center justify-between border border-slate-200">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Tiempo actual</p>
                  <p className="text-2xl font-bold text-slate-900">{currentMonthsToPayoff} meses</p>
                </div>
                <ArrowLeft className="w-6 h-6 text-slate-400 rotate-180" />
                <div className="text-right">
                  <p className="text-sm text-[#1A56DB] font-bold">Nuevo tiempo</p>
                  <p className="text-3xl font-black text-[#0B1A2E]">{newMonthsToPayoff} meses</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="bg-white rounded-2xl p-6 bank-card shadow-sm">
          <h3 className="text-xl font-bold text-[#0B1A2E] mb-6">Preguntas Frecuentes Financieras</h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <span className="font-semibold text-slate-800">{faq.q}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-white text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
