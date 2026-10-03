import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter,
  Plus,
  Trash2,
  ArrowUpRight,
  Landmark,
  Briefcase,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { User, Income, IncomeCategory } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface IncomeViewProps {
  currentUser: User;
  incomes: Income[];
  onAddIncome: () => void;
  onDeleteIncome: (id: string) => void;
  onBackToDashboard: () => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  currentUser,
  incomes,
  onAddIncome,
  onDeleteIncome,
  onBackToDashboard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IncomeCategory | 'ALL'>('ALL');

  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (income.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || income.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const totalIngresos = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  
  const categories: IncomeCategory[] = [
    'Salario', 'Freelance', 'Negocio Propio', 'Inversiones', 'Alquiler', 'Dividendos', 'Regalos', 'Otros'
  ];

  // Calcular métricas
  const fijosRecurrentes = filteredIncomes.filter(inc => inc.frequency !== 'Única vez').reduce((sum, inc) => sum + inc.amount, 0);
  const fuentesActivas = new Set(filteredIncomes.map(inc => inc.category)).size;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={onBackToDashboard}
          className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Menú Principal
        </button>
      </div>

      {/* Page Header */}
      <div className="bank-card border-l-4 border-l-[#059669] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full text-[#059669]">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0B1A2E]">Mis Ingresos · Flujos de Entrada</h1>
            <p className="text-slate-500 text-lg">Historial de depósitos y abonos</p>
          </div>
        </div>
        <button 
          onClick={onAddIncome}
          className="bg-[#0B1A2E] hover:bg-[#1A3A5C] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Registrar Ingreso
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bank-card p-5">
          <p className="bank-section-title mb-1 text-slate-500">Total Ingresos</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-[#059669]">{formatCurrency(totalIngresos, currentUser.currency || 'USD')}</h2>
          </div>
        </div>
        
        <div className="bank-card p-5">
          <p className="bank-section-title mb-1 text-slate-500">Fijos Recurrentes</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(fijosRecurrentes, currentUser.currency || 'USD')}</h2>
          </div>
        </div>
        
        <div className="bank-card p-5">
          <p className="bank-section-title mb-1 text-slate-500">Fuentes Activas</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-slate-800">{fuentesActivas}</h2>
          </div>
        </div>
        
        <div className="bank-card p-5">
          <p className="bank-section-title mb-1 text-slate-500">Ticket Promedio</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-slate-800">
              {formatCurrency(filteredIncomes.length > 0 ? totalIngresos / filteredIncomes.length : 0, currentUser.currency || 'USD')}
            </h2>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bank-card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por concepto o notas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent text-lg"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB] appearance-none text-lg"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Income List */}
      <div className="bank-card overflow-hidden">
        {filteredIncomes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Concepto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4 pr-6 text-right">Monto</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 text-[#059669] p-2 rounded-full flex-shrink-0">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 text-lg">{income.title}</p>
                            {income.frequency !== 'Única vez' && (
                              <span className="trust-badge text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                RECURRENTE
                              </span>
                            )}
                          </div>
                          {income.notes && <p className="text-sm text-slate-500 truncate max-w-xs">{income.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {income.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {formatDate(income.date)}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className="font-bold text-[#059669] text-xl">
                        +{formatCurrency(income.amount, currentUser.currency || 'USD')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onDeleteIncome(income.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Eliminar ingreso"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No se encontraron depósitos</h3>
            <p className="text-slate-500 max-w-md">
              No hay ingresos que coincidan con los filtros actuales o no has registrado ninguno aún.
            </p>
            <button 
              onClick={onAddIncome}
              className="mt-6 text-[#1A56DB] font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Registrar mi primer ingreso
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
