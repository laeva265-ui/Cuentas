import React from 'react';
import { ActiveTab, FinancialHealth } from '../../types';
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  HandCoins,
  Bot,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  financialHealth: FinancialHealth;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  financialHealth,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard General',
      icon: LayoutDashboard,
      badge: '2026',
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Mis Gastos',
      icon: TrendingDown,
      color: 'text-rose-400',
    },
    {
      id: 'income' as ActiveTab,
      label: 'Mis Ingresos',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      id: 'debts' as ActiveTab,
      label: 'Mis Deudas',
      icon: CreditCard,
      color: 'text-amber-400',
      badge: 'Snowball',
    },
    {
      id: 'loans' as ActiveTab,
      label: 'Mis Préstamos',
      icon: HandCoins,
      color: 'text-cyan-400',
    },
    {
      id: 'advisor' as ActiveTab,
      label: 'AI Copilot Financiero',
      icon: Bot,
      color: 'text-purple-400',
      badge: 'Smart',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Ajustes & Backups',
      icon: Settings,
    },
  ];

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400 text-emerald-300';
    if (score >= 65) return 'from-teal-500 to-cyan-400 text-cyan-300';
    if (score >= 45) return 'from-amber-500 to-orange-400 text-amber-300';
    return 'from-rose-500 to-red-400 text-rose-300';
  };

  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col justify-between p-4 border-r border-white/10 bg-[#0A0E18]/60 backdrop-blur-xl">
      {/* Navigation Links */}
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos Financieros
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent text-white border-l-4 border-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : item.color || 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-white/5'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Health Gauge in footer */}
      <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Salud Financiera
          </span>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {financialHealth.score}/100
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getScoreBadgeColor(financialHealth.score)} transition-all duration-700`}
            style={{ width: `${financialHealth.score}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Estado:</span>
          <span className="font-semibold text-slate-200">{financialHealth.level}</span>
        </div>

        <button
          onClick={() => onSelectTab('advisor')}
          className="mt-3 w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 transition-all flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Ver Diagnóstico 2026
        </button>
      </div>
    </aside>
  );
};
