import React, { useState } from 'react';
import { Landmark, Plus, User as UserIcon, LogOut, ChevronDown, Repeat } from 'lucide-react';
import { User, CurrencyCode, ActiveTab, CurrencyConfig } from '../../types';
import { CURRENCIES } from '../../utils/formatters';

interface NavbarProps {
  currentUser: User;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onOpenNewTransaction: () => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

export function Navbar({
  currentUser,
  activeTab,
  onNavigate,
  onOpenAuth,
  onOpenNewTransaction,
  onCurrencyChange
}: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <header className="h-16 sm:h-20 bg-gradient-to-r from-[#0B1A2E] to-[#1A3A5C] text-white flex items-center justify-between px-4 sm:px-6 shadow-md relative z-20">
        {/* Left: Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="bg-white/10 p-2 rounded-lg">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">FinFlow Bank</span>
            <span className="bg-[#D4A853] text-[#0B1A2E] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase hidden sm:block">
              Digital
            </span>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Currency Selector */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
            <select
              value={currentUser.currency || 'USD'}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
            >
              {(Object.entries(CURRENCIES) as [CurrencyCode, CurrencyConfig][]).map(([code, config]) => (
                <option key={code} value={code} className="text-[#0B1A2E]">
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* New Transaction Button */}
          <button
            onClick={onOpenNewTransaction}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#D4A853] to-[#E8C374] text-[#0B1A2E] px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nueva Operación
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 hover:bg-white/10 rounded-full sm:rounded-lg p-1 sm:px-3 sm:py-1.5 transition-colors border border-transparent hover:border-white/20"
            >
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-tight">{currentUser.name}</p>
                <p className="text-xs text-white/70">ID: {currentUser.id.substring(0,6)}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/70 hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-gray-800">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-[#0B1A2E]">{currentUser.name}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
                
                <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Moneda</p>
                  <select
                    value={currentUser.currency || 'USD'}
                    onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded px-2 py-1 outline-none"
                  >
                    {(Object.entries(CURRENCIES) as [CurrencyCode, CurrencyConfig][]).map(([code, config]) => (
                      <option key={code} value={code}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                  <button
                    onClick={() => {
                      onOpenNewTransaction();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 text-left text-sm text-[#0B1A2E] font-medium"
                  >
                    <Plus className="h-4 w-4 text-[#D4A853]" />
                    Nueva Operación
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                  >
                    <Repeat className="h-4 w-4 text-gray-400" />
                    Cambiar Cuenta
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-red-600"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb / Sub-header */}
      {activeTab !== 'dashboard' && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2 flex items-center text-sm shadow-sm z-10">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="text-gray-500 hover:text-[#1A56DB] font-medium"
          >
            Inicio
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-[#0B1A2E] font-semibold capitalize">
            {activeTab.replace('-', ' ')}
          </span>
        </div>
      )}
    </div>
  );
}
