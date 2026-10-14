import React from 'react';
import { TrendingDown, TrendingUp, CreditCard, Briefcase, Plus } from 'lucide-react';
import { ActiveTab } from '../../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigate,
  onOpenNewTransaction
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {/* Gastos */}
        <button
          onClick={() => onNavigate('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'expenses'
              ? 'text-[#DC2626] font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'expenses' ? 'bg-rose-50' : ''}`}>
            <TrendingDown className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Gastos</span>
        </button>

        {/* Ingresos */}
        <button
          onClick={() => onNavigate('income')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'income'
              ? 'text-[#059669] font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'income' ? 'bg-emerald-50' : ''}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Ingresos</span>
        </button>

        {/* Central Action: Nuevo */}
        <button
          onClick={onOpenNewTransaction}
          className="flex flex-col items-center justify-center -mt-5 group"
          title="Nueva Operación"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0B1A2E] to-[#1A3A5C] text-[#D4A853] p-3 shadow-lg flex items-center justify-center border-2 border-white group-active:scale-95 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-slate-700 mt-0.5">Nuevo</span>
        </button>

        {/* Préstamos */}
        <button
          onClick={() => onNavigate('loans')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'loans'
              ? 'text-[#1A56DB] font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'loans' ? 'bg-blue-50' : ''}`}>
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Préstamos</span>
        </button>

        {/* Deudas */}
        <button
          onClick={() => onNavigate('debts')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'debts'
              ? 'text-amber-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'debts' ? 'bg-amber-50' : ''}`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Deudas</span>
        </button>
      </div>
    </nav>
  );
};
