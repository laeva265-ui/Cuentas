import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

export interface ExcelCredential {
  userId: string;
  name: string;
  email: string;
  passwordHash?: string;
  currency: string;
  monthlyBudget: number;
  bio?: string;
  createdAt: string;
}

export interface ExcelExpense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface ExcelIncome {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  frequency: string;
  date: string;
  notes?: string;
}

export interface ExcelDebt {
  id: string;
  userId: string;
  title: string;
  lender: string;
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  date?: string;
  category: string;
  status: string;
  notes?: string;
  paymentsHistory?: Array<{
    id: string;
    amount: number;
    date: string;
    note?: string;
    source?: string;
  }>;
}

export interface ExcelAbono {
  id: string;
  date: string;
  referenceId: string;
  type: 'Préstamo' | 'Deuda';
  concept: string;
  amount: number;
  remainingAmount: number;
  note?: string;
  source?: string;
  userId: string;
}

export interface ExcelLoan {
  id: string;
  userId: string;
  type: 'borrowed' | 'lent';
  personName: string;
  contactPhone?: string;
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  startDate: string;
  dueDate: string;
  status: string;
  notes?: string;
  paymentsHistory?: Array<{
    id: string;
    amount: number;
    date: string;
    note?: string;
    source?: string;
  }>;
}

// Ubicación principal del archivo Excel FinFlow Bank
export const EXCEL_FILE_PATH = path.resolve(process.cwd(), 'FinFlow Bank.xlsx');

export const ExcelDB = {
  getFilePath: () => EXCEL_FILE_PATH,

  initOrLoad: () => {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      console.log(`[ExcelDB] Creando base de datos inicial en: ${EXCEL_FILE_PATH}`);
      const wb = XLSX.utils.book_new();

      const defaultUsers = [
        { 'ID Usuario': 'USR-001', 'Usuario': 'Jorge00', 'Nombre Completo': 'Jorge Luis Perez Acosta', 'Contraseña': '9876**', 'Rol': 'Administrador', 'Estado': 'Activo', 'Fecha de Registro': '2026-09-20' },
        { 'ID Usuario': 'USR-002', 'Usuario': 'Sara01', 'Nombre Completo': 'Sara Morales Buitrago', 'Contraseña': '12345', 'Rol': 'Cliente', 'Estado': 'Activo', 'Fecha de Registro': '2026-09-20' },
        { 'ID Usuario': 'USR-003', 'Usuario': 'Karen02', 'Nombre Completo': 'Karen Lorena Perez Acosta', 'Contraseña': '12345', 'Rol': 'Cliente', 'Estado': 'Activo', 'Fecha de Registro': '2026-09-20' },
        { 'ID Usuario': 'USR-004', 'Usuario': 'Jose03', 'Nombre Completo': 'Joselin Alverto Perez Ochoa', 'Contraseña': '12345', 'Rol': 'Cliente', 'Estado': 'Activo', 'Fecha de Registro': '2026-09-20' }
      ];

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defaultUsers), 'Usuarios');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Gastos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Ingresos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Deudas');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Prestamos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'Abonos');

      XLSX.writeFile(wb, EXCEL_FILE_PATH);
    }
  },

  readAll: () => {
    ExcelDB.initOrLoad();
    const wb = XLSX.readFile(EXCEL_FILE_PATH);

    const getSheetData = <T>(sheetName: string): T[] => {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) return [];
      return XLSX.utils.sheet_to_json<T>(sheet);
    };

    const rawAbonos = getSheetData<any>('Abonos').map((row: any) => ({
      id: String(row['ID Abono'] || row['id'] || `abn-${Date.now()}`),
      date: String(row['Fecha'] || row['date'] || new Date().toISOString().split('T')[0]),
      referenceId: String(row['ID Referencia'] || row['ID Préstamo'] || row['ID Deuda'] || row['referenceId'] || row['loanId'] || row['debtId'] || ''),
      type: (row['Tipo'] || (row['ID Deuda'] ? 'Deuda' : 'Préstamo')) as 'Préstamo' | 'Deuda',
      concept: String(row['Acreedor / Prestatario'] || row['Prestatario'] || row['Concepto'] || row['Acreedor'] || row['personName'] || ''),
      amount: Number(row['Monto Abonado'] || row['amount'] || 0),
      remainingAmount: Number(row['Saldo Restante'] !== undefined ? row['Saldo Restante'] : row['remainingAmount'] || 0),
      note: String(row['Notas'] || row['note'] || 'Abono registrado'),
      userId: String(row['ID Usuario'] || row['userId'] || 'USR-001')
    }));

    const rawPrestamos = getSheetData<any>('Prestamos').map((row: any) => {
      const loanId = String(row['ID Préstamo'] || row['id'] || '');
      const originalAmount = Number(row['Monto Prestado'] || row['originalAmount'] || 0);
      const remainingAmount = Number(row['Saldo Pendiente'] !== undefined ? row['Saldo Pendiente'] : row['remainingAmount'] || 0);
      const amortized = Math.max(0, originalAmount - remainingAmount);

      // Buscar abonos de este préstamo en la hoja Abonos
      let loanPayments = rawAbonos
        .filter(a => a.referenceId === loanId || (a.type === 'Préstamo' && a.concept === row['Prestatario']))
        .map(a => ({
          id: a.id,
          amount: a.amount,
          date: a.date,
          note: a.note || 'Cobro recibido',
          source: 'available_balance' as const
        }));

      // Si no hay en la hoja Abonos pero la fila del préstamo tiene columnas Abono 1, Abono 2, etc.
      if (loanPayments.length === 0) {
        for (let idx = 1; idx <= 15; idx++) {
          const abonoVal = row[`Abono ${idx}`];
          const fechaVal = row[`Fecha ${idx}`] || row[`Fecha Abono ${idx}`] || row['Fecha Inicio'] || '2026-10-03';
          if (abonoVal !== undefined && abonoVal !== null && abonoVal !== '' && Number(abonoVal) > 0) {
            loanPayments.push({
              id: `lpay-${loanId}-${idx}`,
              amount: Number(abonoVal),
              date: String(fechaVal),
              note: `Abono #${idx}`,
              source: 'available_balance' as const
            });
          }
        }
      }

      // Si aún no hay abonos pero ya se ha cobrado/amortizado parte del préstamo, crear registro inicial
      if (loanPayments.length === 0 && amortized > 0) {
        loanPayments.push({
          id: `lpay-${loanId}-init`,
          amount: amortized,
          date: String(row['Fecha Inicio'] || '2026-10-03'),
          note: 'Abono inicial registrado',
          source: 'available_balance' as const
        });
      }

      return {
        id: loanId,
        startDate: String(row['Fecha Inicio'] || row['startDate'] || ''),
        dueDate: String(row['Fecha Final'] || row['dueDate'] || ''),
        userId: String(row['ID Usuario'] || row['userId'] || ''),
        personName: String(row['Prestatario'] || row['personName'] || 'Prestatario'),
        originalAmount,
        interestRate: Number(row['Tasa de Interés'] || row['interestRate'] || 0),
        remainingAmount,
        status: String(row['Estado'] || row['status'] || 'Al día'),
        type: 'lent' as const,
        paymentsHistory: loanPayments
      };
    });

    const rawDeudas = getSheetData<any>('Deudas').map((row: any) => {
      const debtId = String(row['ID Deuda'] || row['id'] || '');
      const totalAmount = Number(row['Monto Total'] || row['totalAmount'] || 0);
      const currentBalance = Number(row['Saldo Restante'] !== undefined ? row['Saldo Restante'] : row['currentBalance'] || 0);
      const amortized = Math.max(0, totalAmount - currentBalance);
      const lenderName = String(row['Acreedor / Entidad'] || row['lender'] || 'Entidad');

      // Buscar abonos de esta deuda en la hoja Abonos
      let debtPayments = rawAbonos
        .filter(a => a.referenceId === debtId || (a.type === 'Deuda' && a.concept === lenderName))
        .map(a => ({
          id: a.id,
          amount: a.amount,
          date: a.date,
          note: a.note || 'Abono a deuda',
          source: 'available_balance' as const
        }));

      // Si no hay en la hoja Abonos pero la fila de la deuda tiene columnas Abono 1, Abono 2, etc.
      if (debtPayments.length === 0) {
        for (let idx = 1; idx <= 15; idx++) {
          const abonoVal = row[`Abono ${idx}`];
          const fechaVal = row[`Fecha ${idx}`] || row[`Fecha Abono ${idx}`] || row['Fecha'] || '2026-10-03';
          if (abonoVal !== undefined && abonoVal !== null && abonoVal !== '' && Number(abonoVal) > 0) {
            debtPayments.push({
              id: `dpay-${debtId}-${idx}`,
              amount: Number(abonoVal),
              date: String(fechaVal),
              note: `Abono #${idx}`,
              source: 'available_balance' as const
            });
          }
        }
      }

      // Si aún no hay abonos pero ya se ha amortizado parte de la deuda, crear registro inicial
      if (debtPayments.length === 0 && amortized > 0) {
        debtPayments.push({
          id: `dpay-${debtId}-init`,
          amount: amortized,
          date: String(row['Fecha'] || '2026-10-03'),
          note: 'Abono amortizado registrado',
          source: 'available_balance' as const
        });
      }

      return {
        id: debtId,
        date: String(row['Fecha'] || row['date'] || ''),
        userId: String(row['ID Usuario'] || row['userId'] || ''),
        lender: lenderName,
        title: lenderName,
        totalAmount,
        minimumPayment: Number(row['Cuota Mensual'] || row['minimumPayment'] || 0),
        dueDate: String(row['Fecha de Vencimiento'] || row['dueDate'] || ''),
        interestRate: Number(row['Tasa de Interés'] || 8.5),
        currentBalance,
        status: String(row['Estado'] || row['status'] || 'Activa'),
        paymentsHistory: debtPayments
      };
    });

    return {
      credenciales: getSheetData<any>('Usuarios').map((row: any) => ({
        userId: String(row['ID Usuario'] || row['userId'] || '').trim(),
        name: String(row['Nombre Completo'] || row['name'] || '').trim(),
        email: String(row['Usuario'] || row['email'] || '').trim() + '@finflow.io',
        passwordHash: String(row['Contraseña'] || row['passwordHash'] || '12345').trim(),
        currency: 'USD',
        monthlyBudget: 3500,
        createdAt: String(row['Fecha de Registro'] || row['createdAt'] || '2026-09-20').trim()
      })),
      gastos: getSheetData<any>('Gastos').map((row: any) => ({
        id: String(row['ID Gasto'] || row['id'] || ''),
        date: String(row['Fecha'] || row['date'] || ''),
        userId: String(row['ID Usuario'] || row['userId'] || ''),
        category: String(row['Categoria'] || row['category'] || 'Otros'),
        title: String(row['Descripción'] || row['title'] || 'Gasto'),
        amount: Number(row['Monto'] || row['amount'] || 0),
        paymentMethod: String(row['Método de Pago'] || row['paymentMethod'] || 'Tarjeta de Débito')
      })),
      ingresos: getSheetData<any>('Ingresos').map((row: any) => ({
        id: String(row['ID Ingreso'] || row['id'] || ''),
        date: String(row['Fecha'] || row['date'] || ''),
        userId: String(row['ID Usuario'] || row['userId'] || ''),
        category: String(row['Categoría'] || row['category'] || 'Salario'),
        title: String(row['Descripción'] || row['title'] || 'Ingreso'),
        amount: Number(row['Monto'] || row['amount'] || 0),
        frequency: 'Mensual',
        paymentMethod: String(row['Método de Pago'] || row['paymentMethod'] || 'Transferencia')
      })),
      deudas: rawDeudas,
      prestamos: rawPrestamos,
      abonos: rawAbonos
    };
  },

  writeAll: (data: {
    credenciales?: any[];
    gastos?: any[];
    ingresos?: any[];
    deudas?: any[];
    prestamos?: any[];
    abonos?: any[];
  }) => {
    ExcelDB.initOrLoad();
    const current = ExcelDB.readAll();

    const usersToSave = (data.credenciales || current.credenciales).map(u => ({
      'ID Usuario': u.userId || u.id,
      'Usuario': u.email ? u.email.split('@')[0] : u.username || u.name,
      'Nombre Completo': u.name,
      'Contraseña': u.passwordHash || '12345',
      'Rol': 'Cliente',
      'Estado': 'Activo',
      'Fecha de Registro': u.createdAt || '2026-09-20'
    }));

    const gastosToSave = (data.gastos || current.gastos).map(g => ({
      'ID Gasto': g.id,
      'Fecha': g.date || new Date().toISOString().split('T')[0],
      'ID Usuario': g.userId,
      'Categoria': g.category || 'Otros',
      'Descripción': g.title || '',
      'Monto': g.amount || 0,
      'Método de Pago': g.paymentMethod || 'Tarjeta de Débito'
    }));

    const ingresosToSave = (data.ingresos || current.ingresos).map(i => ({
      'ID Ingreso': i.id,
      'Fecha': i.date || new Date().toISOString().split('T')[0],
      'ID Usuario': i.userId,
      'Categoría': i.category || 'Salario',
      'Descripción': i.title || '',
      'Monto': i.amount || 0,
      'Método de Pago': i.paymentMethod || 'Transferencia'
    }));

    const calculateMonthsBetween = (startStr?: string, endStr?: string): number => {
      if (!startStr || !endStr) return 1;
      const p1 = startStr.split('T')[0].split('-').map(Number);
      const p2 = endStr.split('T')[0].split('-').map(Number);
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

    // Mapeo acumulado de todos los abonos (tanto de préstamos como de deudas)
    const abonosMap = new Map<string, any>();
    (current.abonos || []).forEach(a => abonosMap.set(a.id, a));
    if (data.abonos) {
      data.abonos.forEach(a => abonosMap.set(a.id, a));
    }

    const deudasSource = data.deudas || current.deudas;
    const prestamosSource = data.prestamos || current.prestamos;

    // 1. Extraer abonos embebidos en las deudas
    deudasSource.forEach(d => {
      if (d.paymentsHistory && Array.isArray(d.paymentsHistory)) {
        d.paymentsHistory.forEach((p: any, idx: number) => {
          const abonoId = p.id || `dpay-${d.id}-${idx + 1}`;
          abonosMap.set(abonoId, {
            id: abonoId,
            date: p.date || new Date().toISOString().split('T')[0],
            referenceId: d.id,
            type: 'Deuda',
            concept: d.lender || d.title,
            amount: p.amount,
            remainingAmount: d.currentBalance,
            note: p.note || `Abono a deuda #${idx + 1}`,
            userId: d.userId || 'USR-001'
          });
        });
      }
    });

    // 2. Extraer abonos embebidos en los préstamos
    prestamosSource.forEach(l => {
      if (l.paymentsHistory && Array.isArray(l.paymentsHistory)) {
        l.paymentsHistory.forEach((p: any, idx: number) => {
          const abonoId = p.id || `lpay-${l.id}-${idx + 1}`;
          abonosMap.set(abonoId, {
            id: abonoId,
            date: p.date || new Date().toISOString().split('T')[0],
            referenceId: l.id,
            type: 'Préstamo',
            concept: l.personName,
            amount: p.amount,
            remainingAmount: l.remainingAmount,
            note: p.note || `Abono a préstamo #${idx + 1}`,
            userId: l.userId || 'USR-001'
          });
        });
      }
    });

    // Construir hoja general "Abonos"
    const abonosToSave = Array.from(abonosMap.values()).map(a => ({
      'ID Abono': a.id,
      'Fecha': a.date,
      'Tipo': a.type || 'Préstamo',
      'ID Referencia': a.referenceId || a.loanId || a.debtId || '',
      'Acreedor / Prestatario': a.concept || a.personName || 'Concepto',
      'Monto Abonado': a.amount,
      'Saldo Restante': a.remainingAmount,
      'Notas': a.note || 'Abono registrado',
      'ID Usuario': a.userId
    }));

    // Construir filas de Deudas con celdas individuales para cada abono (Abono 1, Fecha 1, Abono 2, Fecha 2, ...)
    const deudasToSave = deudasSource.map(d => {
      const start = d.date || new Date().toISOString().split('T')[0];
      const end = d.dueDate || start;
      const plazo = calculateMonthsBetween(start, end);
      const cuota = Math.round((d.totalAmount || 0) / plazo);

      const history = (d.paymentsHistory && Array.isArray(d.paymentsHistory) && d.paymentsHistory.length > 0)
        ? d.paymentsHistory
        : Array.from(abonosMap.values()).filter(a => a.referenceId === d.id);

      const rowObj: any = {
        'ID Deuda': d.id,
        'Fecha': start,
        'ID Usuario': d.userId,
        'Acreedor / Entidad': d.lender || d.title || 'Entidad',
        'Monto Total': d.totalAmount || 0,
        'Cuota Mensual': cuota,
        'Fecha de Vencimiento': end,
        'Monto Amortizado': (d.totalAmount || 0) - (d.currentBalance || 0),
        'Saldo Restante': d.currentBalance || 0,
        'Estado': d.status || 'Activa',
        'Total Abonos': history.length,
        'Último Abono': history.length > 0 ? history[history.length - 1].amount : 0,
        'Fecha Último Abono': history.length > 0 ? history[history.length - 1].date : ''
      };

      // Celdas dinámicas para cada abono: Abono 1, Fecha 1, Abono 2, Fecha 2...
      history.forEach((pay: any, idx: number) => {
        const num = idx + 1;
        rowObj[`Abono ${num}`] = pay.amount;
        rowObj[`Fecha ${num}`] = pay.date;
      });

      return rowObj;
    });

    // Construir filas de préstamos con celdas individuales para cada abono
    const prestamosToSave = prestamosSource.map(l => {
      const start = l.startDate || new Date().toISOString().split('T')[0];
      const end = l.dueDate || '';
      const plazo = calculateMonthsBetween(start, end);
      const cuota = Math.round((l.originalAmount || 0) / plazo);

      const history = (l.paymentsHistory && Array.isArray(l.paymentsHistory) && l.paymentsHistory.length > 0)
        ? l.paymentsHistory
        : Array.from(abonosMap.values()).filter(a => a.referenceId === l.id);

      const rowObj: any = {
        'ID Préstamo': l.id,
        'Fecha Inicio': start,
        'Fecha Final': end,
        'ID Usuario': l.userId,
        'Prestatario': l.personName || 'Prestatario',
        'Monto Prestado': l.originalAmount || 0,
        'Tasa de Interés': l.interestRate || 0,
        'Plazo en Meses': plazo,
        'Cuota Mensual': cuota,
        'Monto Cobrado': (l.originalAmount || 0) - (l.remainingAmount || 0),
        'Saldo Pendiente': l.remainingAmount || 0,
        'Estado': l.status || 'Al día',
        'Total Abonos': history.length,
        'Último Abono': history.length > 0 ? history[history.length - 1].amount : 0,
        'Fecha Último Abono': history.length > 0 ? history[history.length - 1].date : ''
      };

      history.forEach((pay: any, idx: number) => {
        const num = idx + 1;
        rowObj[`Abono ${num}`] = pay.amount;
        rowObj[`Fecha ${num}`] = pay.date;
      });

      return rowObj;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersToSave), 'Usuarios');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gastosToSave), 'Gastos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingresosToSave), 'Ingresos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(deudasToSave), 'Deudas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prestamosToSave), 'Prestamos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abonosToSave), 'Abonos');

    XLSX.writeFile(wb, EXCEL_FILE_PATH);
    return true;
  }
};
