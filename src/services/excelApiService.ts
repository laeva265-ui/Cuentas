import { User, Expense, Income, Debt, Loan } from '../types';

export const ExcelApiService = {
  // 1. Obtener información de conexión con el Excel
  getExcelInfo: async () => {
    try {
      const res = await fetch('/api/excel/info');
      if (!res.ok) throw new Error('Error al conectar con API Excel');
      return await res.json();
    } catch (err) {
      console.warn('[ExcelApi] No se pudo obtener info de Excel:', err);
      return null;
    }
  },

  // 2. Obtener lista de usuarios desde la hoja "Credenciales"
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error al leer usuarios de Excel');
      return await res.json();
    } catch (err) {
      console.warn('[ExcelApi] Falló lectura de usuarios desde Excel, usando fallback local', err);
      return [];
    }
  },

  // 3. Login contra la hoja "Credenciales" de Excel
  login: async (username: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Credenciales inválidas' };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor Excel' };
    }
  },

  // 4. Registro de nuevo usuario en la hoja "Credenciales"
  register: async (userData: { name: string; email: string; currency: string; monthlyBudget: number; password?: string }): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Error al registrar en Excel' };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor Excel' };
    }
  },

  // 5. Cargar todos los datos financieros del usuario logueado desde sus respectivas hojas (Gastos, Ingresos, Deudas, Prestamos)
  getUserFinancialData: async (userId: string): Promise<{
    expenses: Expense[];
    incomes: Income[];
    debts: Debt[];
    loans: Loan[];
  } | null> => {
    try {
      const res = await fetch(`/api/userData/${userId}`);
      if (!res.ok) throw new Error('Error al cargar datos financieros de Excel');
      return await res.json();
    } catch (err) {
      console.warn('[ExcelApi] Falló carga de datos desde Excel:', err);
      return null;
    }
  },

  // 6. Guardar / Sincronizar Gastos en la hoja "Gastos"
  syncExpenses: async (userId: string, expenses: Expense[]) => {
    try {
      await fetch(`/api/expenses/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenses)
      });
    } catch (err) {
      console.warn('[ExcelApi] Error al guardar gastos en Excel:', err);
    }
  },

  // 7. Guardar / Sincronizar Ingresos en la hoja "Ingresos"
  syncIncomes: async (userId: string, incomes: Income[]) => {
    try {
      await fetch(`/api/incomes/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomes)
      });
    } catch (err) {
      console.warn('[ExcelApi] Error al guardar ingresos en Excel:', err);
    }
  },

  // 8. Guardar / Sincronizar Deudas en la hoja "Deudas"
  syncDebts: async (userId: string, debts: Debt[]) => {
    try {
      await fetch(`/api/debts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debts)
      });
    } catch (err) {
      console.warn('[ExcelApi] Error al guardar deudas en Excel:', err);
    }
  },

  // 9. Guardar / Sincronizar Préstamos en la hoja "Prestamos"
  syncLoans: async (userId: string, loans: Loan[]) => {
    try {
      await fetch(`/api/loans/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loans)
      });
    } catch (err) {
      console.warn('[ExcelApi] Error al guardar préstamos en Excel:', err);
    }
  }
};
