import React, { useState, useRef, useEffect } from 'react';
import { Landmark, Plus, User as UserIcon, LogOut, ChevronDown, Repeat, Download, Smartphone } from 'lucide-react';
import { User, CurrencyCode, ActiveTab, CurrencyConfig } from '../../types';
import { CURRENCIES } from '../../utils/formatters';
import { usePwa } from '../../hooks/usePwa';

interface NavbarProps {
  currentUser: User;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  onOpenNewTransaction: () => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
}

export function Navbar({
  currentUser,
  activeTab,
  onNavigate,
  onOpenAuth,
  onLogout,
  onOpenNewTransaction,
  onCurrencyChange
}: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { isInstallable, isStandalone, isIOS, install } = usePwa();

  // Cerrar automáticamente al hacer clic o tocar fuera del menú en cualquier parte de la pantalla
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <div className="flex flex-col safe-area-top">
      <header className="h-16 sm:h-20 bank-header-gradient text-white flex items-center justify-between px-3 sm:px-6 shadow-md relative z-20">
        {/* Left: Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer shrink-0"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg gold-accent">
            <Landmark className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base sm:text-xl tracking-tight">FinFlow Bank</span>
            <span className="gold-bg text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase hidden md:inline-block">
              Digital
            </span>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {/* Desktop/Tablet Currency Selector */}
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

          {/* PWA Install Button (if available and not installed) */}
          {isInstallable && !isStandalone && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-[#D4A853]/20 hover:bg-[#D4A853]/30 text-[#E8C374] border border-[#D4A853]/40 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm"
              title="Instalar FinFlow Bank como App"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* New Transaction Button (Hidden on small mobile because MobileBottomNav has it) */}
          <button
            onClick={onOpenNewTransaction}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#D4A853] to-[#E8C374] text-[#0B1A2E] px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Operación</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 hover:bg-white/10 rounded-full sm:rounded-lg p-1 sm:px-2.5 sm:py-1.5 transition-colors border border-transparent hover:border-white/20"
            >
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4 text-white" />}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs sm:text-sm font-semibold leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[11px] text-white/70">ID: {currentUser.id.substring(0,6)}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-white/70 hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <>
                {/* Transparent Backdrop to detect touches anywhere on the screen */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsUserMenuOpen(false)}
                  onTouchStart={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-[#0B1A2E] text-sm truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Cuenta FinFlow Digital
                      </span>
                    </div>
                  </div>

                  {/* Mobile Full Currency Selector inside menu */}
                  <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Moneda Principal</p>
                    <select
                      value={currentUser.currency || 'USD'}
                      onChange={(e) => {
                        onCurrencyChange(e.target.value as CurrencyCode);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none font-semibold text-slate-800 cursor-pointer"
                    >
                      {(Object.entries(CURRENCIES) as [CurrencyCode, CurrencyConfig][]).map(([code, config]) => (
                        <option key={code} value={code}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                {isInstallable && !isStandalone && (
                  <div className="px-2 py-1 border-b border-gray-100">
                    <button
                      onClick={() => {
                        install();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-amber-600" />
                      Instalar FinFlow Bank (PWA)
                    </button>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700 font-medium"
                  >
                    <Repeat className="w-4 h-4 text-gray-400" />
                    Cambiar Cuenta
                  </button>
                  <button
                    onClick={() => {
                      if (onLogout) {
                        onLogout();
                      } else {
                        onOpenAuth();
                      }
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2.5 hover:bg-gray-50 text-red-600 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </header>

      {/* Breadcrumb / Sub-header */}
      {activeTab !== 'dashboard' && (
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 flex items-center text-xs sm:text-sm shadow-sm z-10 overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="text-gray-500 hover:text-[#1A56DB] font-medium"
          >
            Inicio
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-[#0B1A2E] font-bold capitalize">
            {activeTab === 'expenses' ? 'Mis Gastos' :
             activeTab === 'income' ? 'Mis Ingresos' :
             activeTab === 'debts' ? 'Mis Deudas' :
             activeTab === 'loans' ? 'Mis Préstamos' :
             activeTab === 'advisor' ? 'Asesor Financiero' :
             activeTab === 'settings' ? 'Configuración' : activeTab}
          </span>
        </div>
      )}
    </div>
  );
}
