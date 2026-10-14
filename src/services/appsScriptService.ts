import { User, Expense, Income, Debt, Loan } from '../types';

const APPS_SCRIPT_STORAGE_KEY = 'finflow_apps_script_url';
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLOd-J4pAQywJMKGnzzpjW7z_hMppLHSBhtPsn16tzi0pXtb2ibWz73f5pasQl1pDQ/exec';

export const GoogleAppsScriptService = {
  // Obtener URL configurada actualmente
  getScriptUrl: (): string => {
    return localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || DEFAULT_APPS_SCRIPT_URL;
  },

  // Guardar URL de la Web App de Apps Script
  setScriptUrl: (url: string): void => {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
  },

  // Verificar si hay conexión activa
  isConfigured: (): boolean => {
    return Boolean(GoogleAppsScriptService.getScriptUrl());
  },

  // Probar conexión con Apps Script
  testConnection: async (): Promise<{ success: boolean; sheets?: string[]; message?: string }> => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return { success: false, message: 'URL de Apps Script no configurada' };

    try {
      const res = await fetch(`${url}?action=ping`);
      const data = await res.json();
      return {
        success: Boolean(data.success),
        sheets: data.sheets || [],
        message: data.message || 'Conexión exitosa'
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al conectar con Google Apps Script' };
    }
  },

  // 1. Obtener usuarios desde la hoja "Usuarios"
  getUsers: async (): Promise<User[]> => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return [];

    try {
      const res = await fetch(`${url}?action=getUsers`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        return data.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: `${u.username.toLowerCase()}@finflow.io`,
          avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          currency: 'USD' as const,
          theme: 'light' as const,
          monthlyBudget: 3500,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt
        }));
      }
      return [];
    } catch (err) {
      console.warn('[AppsScript] Error al obtener usuarios:', err);
      return [];
    }
  },

  // 2. Login validando contra la hoja "Usuarios"
  login: async (username: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return { success: false, error: 'Apps Script no configurado' };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain evita issues de preflight CORS en Apps Script
        body: JSON.stringify({
          action: 'login',
          username: username.trim(),
          password: password ? password.trim() : ''
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        return {
          success: true,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            currency: 'USD',
            theme: 'light',
            monthlyBudget: 3500,
            createdAt: data.user.createdAt
          }
        };
      }
      return { success: false, error: data.error || 'Credenciales inválidas en la hoja Usuarios' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con Google Sheets' };
    }
  },

  // 3. Registrar nuevo usuario en la hoja "Usuarios" de Google Sheets
  registerUser: async (userData: {
    name: string;
    email: string;
    currency: string;
    monthlyBudget: number;
    password?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return { success: false, error: 'Apps Script no configurado' };

    try {
      const email = userData.email.trim().toLowerCase();
      const username = email.includes('@') ? email.split('@')[0] : email;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'registerUser',
          name: userData.name.trim(),
          email: email,
          username: username.trim(),
          password: userData.password || '12345',
          currency: userData.currency || 'USD',
          monthlyBudget: userData.monthlyBudget || 3000,
          role: 'Cliente',
          status: 'Activo',
          createdAt: new Date().toISOString().split('T')[0]
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        return {
          success: true,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            currency: (userData.currency as any) || 'USD',
            theme: 'light',
            monthlyBudget: Number(userData.monthlyBudget) || 3000,
            createdAt: data.user.createdAt
          }
        };
      }
      return { success: false, error: data.error || 'No se pudo registrar en Google Sheets' };
    } catch (err: any) {
      console.warn('[AppsScript] Error al registrar usuario:', err);
      return { success: false, error: err.message || 'Error de conexión con Google Sheets' };
    }
  },

  // 4. Obtener datos financieros (Gastos, Ingresos, Deudas, Préstamos) del usuario logueado
  getUserFinancialData: async (userId: string): Promise<{
    expenses: Expense[];
    incomes: Income[];
    debts: Debt[];
    loans: Loan[];
  } | null> => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return null;

    try {
      const res = await fetch(`${url}?action=getUserData&userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success) {
        return {
          expenses: data.expenses || [],
          incomes: data.incomes || [],
          debts: data.debts || [],
          loans: data.loans || []
        };
      }
      return null;
    } catch (err) {
      console.warn('[AppsScript] Error al obtener datos del usuario:', err);
      return null;
    }
  },

  // 4. Sincronizar Gastos en la hoja "Gastos"
  syncExpenses: async (userId: string, expenses: Expense[]) => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncExpenses',
          userId,
          data: expenses
        })
      });
    } catch (err) {
      console.warn('[AppsScript] Error al sincronizar gastos:', err);
    }
  },

  // 5. Sincronizar Ingresos en la hoja "Ingresos"
  syncIncomes: async (userId: string, incomes: Income[]) => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncIncomes',
          userId,
          data: incomes
        })
      });
    } catch (err) {
      console.warn('[AppsScript] Error al sincronizar ingresos:', err);
    }
  },

  // 6. Sincronizar Deudas en la hoja "Deudas"
  syncDebts: async (userId: string, debts: Debt[]) => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncDebts',
          userId,
          data: debts
        })
      });
    } catch (err) {
      console.warn('[AppsScript] Error al sincronizar deudas:', err);
    }
  },

  // 7. Sincronizar Préstamos en la hoja "Prestamos"
  syncLoans: async (userId: string, loans: Loan[]) => {
    const url = GoogleAppsScriptService.getScriptUrl();
    if (!url) return;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncLoans',
          userId,
          data: loans
        })
      });
    } catch (err) {
      console.warn('[AppsScript] Error al sincronizar préstamos:', err);
    }
  }
};
