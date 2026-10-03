import { CurrencyCode, CurrencyConfig, FinancialHealth, Expense, Income, Debt, Loan } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD - Dólar Estadounidense', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR - Euro', locale: 'de-DE' },
  MXN: { code: 'MXN', symbol: '$', label: 'MXN - Peso Mexicano', locale: 'es-MX' },
  COP: { code: 'COP', symbol: '$', label: 'COP - Peso Colombiano', locale: 'es-CO' },
  ARS: { code: 'ARS', symbol: '$', label: 'ARS - Peso Argentino', locale: 'es-AR' },
  CLP: { code: 'CLP', symbol: '$', label: 'CLP - Peso Chileno', locale: 'es-CL' },
  PEN: { code: 'PEN', symbol: 'S/', label: 'PEN - Sol Peruano', locale: 'es-PE' },
};

export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.8888,
  MXN: 18.21,
  COP: 3311.93,
  ARS: 1523.09,
  CLP: 982.01,
  PEN: 3.44,
};

export const fetchLiveRates = async (): Promise<Record<CurrencyCode, number>> => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        if (data.rates.COP) EXCHANGE_RATES.COP = data.rates.COP;
        if (data.rates.EUR) EXCHANGE_RATES.EUR = data.rates.EUR;
        if (data.rates.MXN) EXCHANGE_RATES.MXN = data.rates.MXN;
        if (data.rates.ARS) EXCHANGE_RATES.ARS = data.rates.ARS;
        if (data.rates.CLP) EXCHANGE_RATES.CLP = data.rates.CLP;
        if (data.rates.PEN) EXCHANGE_RATES.PEN = data.rates.PEN;
        EXCHANGE_RATES.USD = 1;
      }
    }
  } catch (err) {
    console.warn('Usando tasas de cambio fallback del día:', err);
  }
  return EXCHANGE_RATES;
};

// Autocall on load
fetchLiveRates();

export const convertCurrency = (
  amount: number,
  from: CurrencyCode = 'COP',
  to: CurrencyCode = 'USD'
): number => {
  if (!amount || isNaN(amount)) return 0;
  const fromRate = EXCHANGE_RATES[from] || 1;
  const toRate = EXCHANGE_RATES[to] || 1;
  return (amount / fromRate) * toRate;
};

export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  fromCurrency: CurrencyCode = 'COP'
): string => {
  const converted = convertCurrency(amount, fromCurrency, currencyCode);
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const isSmall = Math.abs(converted) > 0 && Math.abs(converted) < 1000 && (converted % 1 !== 0 || currencyCode === 'USD' || currencyCode === 'EUR' || currencyCode === 'PEN');
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: isSmall ? 2 : 0,
      maximumFractionDigits: isSmall ? 2 : 0,
    }).format(converted);
  } catch {
    const formattedNum = isSmall ? converted.toFixed(2) : Math.round(converted).toLocaleString();
    return `${config.symbol}${formattedNum}`;
  }
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const calculateFinancialHealth = (
  expenses: Expense[],
  incomes: Income[],
  debts: Debt[],
  loans: Loan[],
  monthlyBudget: number = 3000
): FinancialHealth => {
  const totalMonthlyIncome = incomes.reduce((acc, curr) => {
    if (curr.frequency === 'Quincenal') return acc + curr.amount * 2;
    if (curr.frequency === 'Semanal') return acc + curr.amount * 4;
    return acc + curr.amount;
  }, 0);

  const totalMonthlyExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebtBalance = debts.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const totalMinDebtPayments = debts.reduce((acc, curr) => acc + curr.minimumPayment, 0);

  // Préstamos que yo presté (activos a cobrar)
  const lentToOthers = loans
    .filter((l) => l.type === 'lent' && l.status !== 'Saldado')
    .reduce((acc, l) => acc + l.remainingAmount, 0);

  // Préstamos que me prestaron (pasivo a pagar)
  const borrowedFromOthers = loans
    .filter((l) => l.type === 'borrowed' && l.status !== 'Saldado')
    .reduce((acc, l) => acc + l.remainingAmount, 0);

  const netCashflow = totalMonthlyIncome - totalMonthlyExpenses - totalMinDebtPayments;
  
  // Tasa de ahorro: (Ingresos - Gastos) / Ingresos
  const savingsRate = totalMonthlyIncome > 0 ? Math.max(0, (netCashflow / totalMonthlyIncome) * 100) : 0;

  // Ratio Deuda/Ingreso: pagos de deuda / ingreso mensual
  const debtToIncomeRatio = totalMonthlyIncome > 0 ? (totalMinDebtPayments / totalMonthlyIncome) * 100 : 0;

  // Cálculo de Score (0 a 100)
  let score = 50;

  // Bonificaciones / penalizaciones
  if (totalMonthlyIncome > 0) {
    if (savingsRate >= 20) score += 20;
    else if (savingsRate >= 10) score += 10;
    else if (savingsRate < 0) score -= 25;

    if (debtToIncomeRatio === 0) score += 20;
    else if (debtToIncomeRatio < 15) score += 15;
    else if (debtToIncomeRatio < 30) score += 5;
    else if (debtToIncomeRatio > 40) score -= 20;

    if (totalMonthlyExpenses <= monthlyBudget) score += 10;
    else score -= 10;
  }

  // Si tiene deudas en riesgo
  const atRiskDebts = debts.filter((d) => d.status === 'En Riesgo').length;
  if (atRiskDebts > 0) score -= 15 * atRiskDebts;

  score = Math.min(100, Math.max(10, Math.round(score)));

  let level: FinancialHealth['level'] = 'Bueno';
  if (score >= 80) level = 'Excelente';
  else if (score >= 65) level = 'Bueno';
  else if (score >= 45) level = 'Regular';
  else level = 'Crítico';

  const insights: FinancialHealth['insights'] = [];

  if (savingsRate >= 20) {
    insights.push({
      type: 'positive',
      title: 'Excelente Tasa de Ahorro',
      message: `Estás reservando el ${savingsRate.toFixed(1)}% de tus ingresos netos este mes. Muy por encima del promedio recomendado de 2026.`,
    });
  } else if (savingsRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Flujo de Caja Negativo',
      message: `Tus gastos y cuotas superan tus ingresos por ${formatCurrency(Math.abs(netCashflow))}. Revisa tus gastos en suscripciones y ocio inmediatamente.`,
    });
  }

  if (debtToIncomeRatio > 35) {
    insights.push({
      type: 'warning',
      title: 'Endeudamiento Elevado',
      message: `El ${debtToIncomeRatio.toFixed(1)}% de tus ingresos mensuales está atado al pago de cuotas de deuda. Se sugiere utilizar el método Bola de Nieve.`,
    });
  } else {
    insights.push({
      type: 'positive',
      title: 'Deuda Controlada',
      message: 'Tus pagos mínimos representan menos del 35% de tu flujo mensual, lo que mantiene tu perfil crediticio saludable.',
    });
  }

  if (lentToOthers > 0) {
    insights.push({
      type: 'tip',
      title: 'Cuentas por Cobrar Pendientes',
      message: `Tienes ${formatCurrency(lentToOthers)} prestados a terceros por cobrar. Activa los recordatorios automáticos para recuperar ese capital.`,
    });
  }

  return {
    score,
    level,
    debtToIncomeRatio,
    savingsRate,
    monthlyNetCashflow: netCashflow,
    runwayMonths: totalMonthlyExpenses > 0 ? (totalMonthlyIncome * 3) / totalMonthlyExpenses : 3,
    insights,
  };
};

/**
 * Formatea un número o texto con separadores de miles (ej. "1000000" -> "1.000.000", "10000000" -> "10.000.000")
 */
export const formatThousandsInput = (raw: string | number): string => {
  if (raw === undefined || raw === null || raw === '') return '';
  const str = String(raw);

  // Si incluye una coma (usada para decimales), dividimos por la primera coma
  const hasComma = str.includes(',');
  const parts = str.split(',');

  // Parte entera: eliminar todos los puntos previos y caracteres no numéricos
  const cleanInteger = parts[0].replace(/[^0-9]/g, '');
  if (!cleanInteger) return hasComma ? '0,' : '';

  // Quitar ceros a la izquierda excepto si es solo "0"
  let integerPart = cleanInteger;
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '') || '0';
  }

  // Insertar puntos como separadores de miles cada 3 dígitos
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Si tiene decimales después de la coma
  if (hasComma) {
    const cleanDecimal = (parts[1] || '').replace(/[^0-9]/g, '').slice(0, 2);
    return `${formattedInteger},${cleanDecimal}`;
  }

  return formattedInteger;
};

/**
 * Parsea un string formateado con miles ("10.000.000" o "10.000.000,50") a un número flotante
 */
export const parseThousandsInput = (formatted: string | number): number => {
  if (!formatted) return 0;
  const str = String(formatted);
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Calcula el Saldo Disponible:
 * (+) Total de Ingresos
 * (+) Cobros recibidos de préstamos otorgados (dinero recuperado)
 * (-) Abonos a deudas pagados desde Saldo Disponible
 * (-) Pagos de préstamos que me prestaron desde Saldo Disponible
 * (-) Gastos pagados desde Saldo Disponible
 */
export const calculateAvailableBalance = (
  incomes: Income[],
  loans: Loan[],
  debts: Debt[],
  expenses: Expense[] = []
): number => {
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Cobros recibidos de préstamos que el usuario prestó a otros (type === 'lent')
  const loanPaymentsReceived = loans
    .filter((l) => l.type === 'lent')
    .reduce((sum, l) => {
      if (l.paymentsHistory && l.paymentsHistory.length > 0) {
        return sum + l.paymentsHistory.reduce((pSum, p) => pSum + p.amount, 0);
      }
      return sum + Math.max(0, l.originalAmount - l.remainingAmount);
    }, 0);

  // Pagos/abonos a deudas descontados de Saldo Disponible
  const debtPaymentsFromBalance = debts.reduce((sum, d) => {
    if (!d.paymentsHistory) return sum;
    const paid = d.paymentsHistory
      .filter((p) => p.source === 'available_balance')
      .reduce((pSum, p) => pSum + p.amount, 0);
    return sum + paid;
  }, 0);

  // Pagos a préstamos que le prestaron al usuario descontados de Saldo Disponible
  const borrowedLoanPaymentsFromBalance = loans
    .filter((l) => l.type === 'borrowed')
    .reduce((sum, l) => {
      if (!l.paymentsHistory) return sum;
      const paid = l.paymentsHistory
        .filter((p) => p.source === 'available_balance')
        .reduce((pSum, p) => pSum + p.amount, 0);
      return sum + paid;
    }, 0);

  // Gastos descontados de Saldo Disponible
  const expensesFromBalance = expenses
    .filter((exp) => exp.source === 'available_balance' || (!exp.source && exp.paymentMethod !== 'Tarjeta de Crédito' && exp.paymentMethod !== 'Efectivo'))
    .reduce((sum, exp) => sum + exp.amount, 0);

  return Math.max(0, totalIncome + loanPaymentsReceived - debtPaymentsFromBalance - borrowedLoanPaymentsFromBalance - expensesFromBalance);
};

/**
 * Calcula el plazo exacto en meses entre Fecha de Inicio y Fecha de Vencimiento / Fin
 */
export const calculateMonthsBetween = (d1Str?: string, d2Str?: string): number => {
  if (!d1Str || !d2Str) return 1;
  const p1 = d1Str.split('T')[0].split('-').map(Number);
  const p2 = d2Str.split('T')[0].split('-').map(Number);
  if (p1.length < 3 || p2.length < 3 || isNaN(p1[0]) || isNaN(p2[0])) return 1;

  const y1 = p1[0], m1 = p1[1], day1 = p1[2];
  const y2 = p2[0], m2 = p2[1], day2 = p2[2];

  let months = (y2 - y1) * 12 + (m2 - m1);
  if (day2 - day1 >= 15) {
    months += 1;
  } else if (day1 - day2 >= 15) {
    months -= 1;
  }
  return Math.max(1, months);
};
