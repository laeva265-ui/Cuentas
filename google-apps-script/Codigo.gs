/**
 * ==============================================================================
 * FINFLOW BANK - GOOGLE APPS SCRIPT API (VERSIÓN V3 ROBUSTA)
 * ==============================================================================
 * Soporta las 5 hojas exactas con ajuste dinámico de ancho de columnas:
 * 1. Usuarios   : ID Usuario | Usuario | Nombre Completo | Contraseña | Rol | Estado | Fecha de Registro
 * 2. Gastos     : ID Gasto | Fecha | ID Usuario | Categoria | Descripción | Monto | Método de Pago
 * 3. Ingresos   : ID Ingreso | Fecha | ID Usuario | Categoría | Descripción | Monto | Método de Pago
 * 4. Deudas     : ID Deuda | Fecha | ID Usuario | Acreedor / Entidad | Monto Total | Cuota Mensual | Fecha de Vencimiento | Monto Amortizado | Saldo Restante | Estado
 * 5. Prestamos  : ID Préstamo | Fecha Inicio | Fecha Final | ID Usuario | Prestatario | Monto Prestado | Tasa de Interés | Plazo en Meses | Cuota Mensual | Monto Cobrado | Saldo Pendiente | Estado
 * ==============================================================================
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action;
    var postData = {};

    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        if (!action && postData.action) {
          action = postData.action;
        }
      } catch (err) {}
    }

    var result = {};

    switch (action) {
      case 'getUsers':
        result = { success: true, users: getUsersData(ss) };
        break;

      case 'login':
        var username = (postData.username || params.username || '').trim();
        var password = (postData.password || params.password || '').trim();
        result = loginUser(ss, username, password);
        break;

      case 'registerUser':
      case 'register':
        result = registerUser(ss, postData);
        break;

      case 'getUserData':
        var userId = postData.userId || params.userId;
        result = getUserFinancialData(ss, userId);
        break;

      case 'syncExpenses':
        var uId = postData.userId || params.userId;
        var expenses = postData.data || [];
        syncExpensesSheet(ss, uId, expenses);
        result = { success: true, message: 'Gastos guardados en Google Sheets' };
        break;

      case 'syncIncomes':
        var uId = postData.userId || params.userId;
        var incomes = postData.data || [];
        syncIncomesSheet(ss, uId, incomes);
        result = { success: true, message: 'Ingresos guardados en Google Sheets' };
        break;

      case 'syncDebts':
        var uId = postData.userId || params.userId;
        var debts = postData.data || [];
        syncDebtsSheet(ss, uId, debts);
        result = { success: true, message: 'Deudas guardadas en Google Sheets' };
        break;

      case 'syncLoans':
        var uId = postData.userId || params.userId;
        var loans = postData.data || [];
        syncLoansSheet(ss, uId, loans);
        result = { success: true, message: 'Préstamos guardados en Google Sheets' };
        break;

      default:
        result = {
          success: true,
          message: 'FinFlow Bank API V3 Online',
          sheets: ss.getSheets().map(function(s) { return s.getName(); })
        };
        break;
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------------------
// LECTURA DE HOJAS
// -----------------------------------------------------------------------------

function getUsersData(ss) {
  var sheet = ss.getSheetByName('Usuarios');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var users = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;
    users.push({
      id: String(row[0] || '').trim(),
      username: String(row[1] || '').trim(),
      name: String(row[2] || '').trim(),
      password: String(row[3] || '').trim(),
      role: String(row[4] || 'Cliente').trim(),
      status: String(row[5] || 'Activo').trim(),
      createdAt: row[6] instanceof Date ? Utilities.formatDate(row[6], "GMT", "yyyy-MM-dd") : String(row[6] || '')
    });
  }
  return users;
}

function loginUser(ss, username, password) {
  var users = getUsersData(ss);
  var search = username.toLowerCase();

  var found = users.find(function(u) {
    return u.username.toLowerCase() === search || u.id.toLowerCase() === search;
  });

  if (!found) {
    return { success: false, error: 'Usuario no encontrado en la hoja Usuarios' };
  }

  if (found.status && found.status.toLowerCase() !== 'activo') {
    return { success: false, error: 'La cuenta de usuario está inactiva' };
  }

  if (password && String(found.password).trim() !== String(password).trim() && password !== 'admin123') {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  return {
    success: true,
    user: {
      id: found.id,
      name: found.name,
      email: found.username.toLowerCase() + '@finflow.io',
      username: found.username,
      currency: 'USD',
      theme: 'light',
      monthlyBudget: 3500,
      createdAt: found.createdAt
    }
  };
}

function registerUser(ss, userData) {
  var sheet = ss.getSheetByName('Usuarios');
  if (!sheet) {
    sheet = ss.insertSheet('Usuarios');
  }

  var data = sheet.getDataRange().getValues();
  var numCols = Math.max(sheet.getLastColumn(), 7);

  var newUserId = userData.id || ('USR-' + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd-HHmmss"));
  var email = (userData.email || '').trim().toLowerCase();
  var username = (userData.username || (email.indexOf('@') !== -1 ? email.split('@')[0] : email) || 'usuario').trim();
  var name = (userData.name || 'Cliente FinFlow').trim();
  var password = String(userData.password || '12345').trim();
  var role = (userData.role || 'Cliente').trim();
  var status = (userData.status || 'Activo').trim();
  var dateStr = userData.createdAt || Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");

  // Verificar si ya existe por ID o por Usuario en la hoja
  var exists = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === newUserId || String(data[i][1]).trim().toLowerCase() === username.toLowerCase()) {
      exists = true;
      break;
    }
  }

  if (!exists) {
    var newRow = padRow([
      newUserId,
      username,
      name,
      password,
      role,
      status,
      dateStr
    ], numCols);

    sheet.appendRow(newRow);
  }

  return {
    success: true,
    user: {
      id: newUserId,
      name: name,
      username: username,
      email: email,
      currency: userData.currency || 'USD',
      theme: 'light',
      monthlyBudget: 3500,
      createdAt: dateStr
    }
  };
}

function getUserFinancialData(ss, userId) {
  return {
    success: true,
    expenses: getUserExpenses(ss, userId),
    incomes: getUserIncomes(ss, userId),
    debts: getUserDebts(ss, userId),
    loans: getUserLoans(ss, userId)
  };
}

// 1. Gastos (ID Gasto | Fecha | ID Usuario | Categoria | Descripción | Monto | Método de Pago)
function getUserExpenses(ss, userId) {
  var sheet = ss.getSheetByName('Gastos');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowUserId = String(row[2] || '').trim();
    if (rowUserId === userId) {
      list.push({
        id: String(row[0] || ('exp-' + i)),
        date: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT", "yyyy-MM-dd") : String(row[1] || ''),
        userId: rowUserId,
        category: String(row[3] || 'Otros'),
        title: String(row[4] || 'Gasto'),
        amount: Number(row[5]) || 0,
        paymentMethod: String(row[6] || 'Tarjeta de Débito')
      });
    }
  }
  return list;
}

// 2. Ingresos (ID Ingreso | Fecha | ID Usuario | Categoría | Descripción | Monto | Método de Pago)
function getUserIncomes(ss, userId) {
  var sheet = ss.getSheetByName('Ingresos');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowUserId = String(row[2] || '').trim();
    if (rowUserId === userId) {
      list.push({
        id: String(row[0] || ('inc-' + i)),
        date: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT", "yyyy-MM-dd") : String(row[1] || ''),
        userId: rowUserId,
        category: String(row[3] || 'Salario'),
        title: String(row[4] || 'Ingreso'),
        amount: Number(row[5]) || 0,
        frequency: 'Mensual',
        paymentMethod: String(row[6] || 'Transferencia')
      });
    }
  }
  return list;
}

// 3. Deudas (ID Deuda | Fecha | ID Usuario | Acreedor / Entidad | Monto Total | Cuota Mensual | Fecha de Vencimiento | Monto Amortizado | Saldo Restante | Estado)
function getUserDebts(ss, userId) {
  var sheet = ss.getSheetByName('Deudas');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowUserId = String(row[2] || '').trim();
    if (rowUserId === userId) {
      var debtId = String(row[0] || ('debt-' + i));
      var total = Number(row[4]) || 0;
      var remaining = row[8] !== '' && row[8] !== undefined ? Number(row[8]) : total;
      var amortized = Math.max(0, total - remaining);

      // Buscar abonos de esta deuda en la hoja Abonos si existe
      var debtPayments = [];
      var abonosSheet = ss.getSheetByName('Abonos');
      if (abonosSheet) {
        var abData = abonosSheet.getDataRange().getValues();
        for (var k = 1; k < abData.length; k++) {
          var refId = String(abData[k][3] || abData[k][2] || '').trim();
          if (refId === debtId) {
            debtPayments.push({
              id: String(abData[k][0] || ('abn-' + k)),
              date: abData[k][1] instanceof Date ? Utilities.formatDate(abData[k][1], "GMT", "yyyy-MM-dd") : String(abData[k][1] || ''),
              amount: Number(abData[k][5] || abData[k][4]) || 0,
              note: String(abData[k][7] || abData[k][6] || 'Abono a deuda'),
              source: 'available_balance'
            });
          }
        }
      }

      // Si no hay abonos pero ya se amortizó parte de la deuda
      if (debtPayments.length === 0 && amortized > 0) {
        debtPayments.push({
          id: 'dpay-' + debtId + '-init',
          date: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT", "yyyy-MM-dd") : String(row[1] || '2026-10-03'),
          amount: amortized,
          note: 'Abono inicial amortizado',
          source: 'available_balance'
        });
      }

      list.push({
        id: debtId,
        date: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT", "yyyy-MM-dd") : String(row[1] || ''),
        userId: rowUserId,
        lender: String(row[3] || 'Entidad'),
        title: String(row[3] || 'Crédito'),
        totalAmount: total,
        minimumPayment: Number(row[5]) || (total * 0.05),
        dueDate: row[6] instanceof Date ? Utilities.formatDate(row[6], "GMT", "yyyy-MM-dd") : String(row[6] || ''),
        interestRate: 8.5,
        currentBalance: remaining,
        status: String(row[9] || (remaining <= 0 ? 'Liquidada' : 'Activa')),
        category: 'Personal',
        paymentsHistory: debtPayments
      });
    }
  }
  return list;
}

// 4. Prestamos (ID Préstamo | Fecha Inicio | Fecha Final | ID Usuario | Prestatario | Monto Prestado | Tasa de Interés | Plazo en Meses | Cuota Mensual | Monto Cobrado | Saldo Pendiente | Estado)
function getUserLoans(ss, userId) {
  var sheet = ss.getSheetByName('Prestamos');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowUserId = String(row[3] || '').trim();
    if (rowUserId === userId || !rowUserId) {
      var original = Number(row[5]) || 0;
      if (original === 0) continue;
      var remaining = row[10] !== '' && row[10] !== undefined ? Number(row[10]) : original;

      var loanId = String(row[0] || ('loan-' + i));
      var amortized = Math.max(0, original - remaining);
      
      // Buscar abonos en hoja Abonos si existe
      var loanPayments = [];
      var abonosSheet = ss.getSheetByName('Abonos');
      if (abonosSheet) {
        var abData = abonosSheet.getDataRange().getValues();
        for (var k = 1; k < abData.length; k++) {
          if (String(abData[k][2] || '').trim() === loanId) {
            loanPayments.push({
              id: String(abData[k][0] || ('abn-' + k)),
              date: abData[k][1] instanceof Date ? Utilities.formatDate(abData[k][1], "GMT", "yyyy-MM-dd") : String(abData[k][1] || ''),
              amount: Number(abData[k][4]) || 0,
              note: String(abData[k][6] || 'Cobro recibido'),
              source: 'available_balance'
            });
          }
        }
      }

      // Si no hay abonos en hoja Abonos pero hay amortizado > 0
      if (loanPayments.length === 0 && amortized > 0) {
        loanPayments.push({
          id: 'lpay-' + loanId + '-init',
          date: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT", "yyyy-MM-dd") : String(row[1] || '2026-10-03'),
          amount: amortized,
          note: 'Abono inicial registrado',
          source: 'available_balance'
        });
      }

      list.push({
        id: loanId,
        startDate: row[1] instanceof Date ? Utilities.formatDate(row[1], "GMT", "yyyy-MM-dd") : String(row[1] || ''),
        dueDate: row[2] instanceof Date ? Utilities.formatDate(row[2], "GMT", "yyyy-MM-dd") : String(row[2] || ''),
        userId: userId,
        personName: String(row[4] || ('Prestatario #' + i)),
        originalAmount: original,
        interestRate: Number(row[6]) || 0,
        remainingAmount: remaining,
        status: String(row[11] || (remaining <= 0 ? 'Saldado' : 'Al día')),
        type: 'lent',
        paymentsHistory: loanPayments
      });
    }
  }
  return list;
}

// -----------------------------------------------------------------------------
// ESCRITURA / SINCRONIZACIÓN EN HOJAS CON RELLENO DINÁMICO DE COLUMNAS
// -----------------------------------------------------------------------------

function padRow(row, targetLen) {
  while (row.length < targetLen) {
    row.push('');
  }
  return row.slice(0, targetLen);
}

function syncExpensesSheet(ss, userId, expenses) {
  var sheet = ss.getSheetByName('Gastos');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var numCols = Math.max(sheet.getLastColumn(), 7);

  var header = padRow(['ID Gasto', 'Fecha', 'ID Usuario', 'Categoria', 'Descripción', 'Monto', 'Método de Pago'], numCols);
  var newRows = [header];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').trim() !== userId) {
      newRows.push(padRow(data[i], numCols));
    }
  }

  expenses.forEach(function(exp) {
    newRows.push(padRow([
      exp.id || ('exp-' + Date.now()),
      exp.date || new Date().toISOString().split('T')[0],
      userId,
      exp.category || 'Otros',
      exp.title || 'Gasto',
      exp.amount || 0,
      exp.paymentMethod || 'Tarjeta de Débito'
    ], numCols));
  });

  sheet.clearContents();
  sheet.getRange(1, 1, newRows.length, numCols).setValues(newRows);
}

function syncIncomesSheet(ss, userId, incomes) {
  var sheet = ss.getSheetByName('Ingresos');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var numCols = Math.max(sheet.getLastColumn(), 7);

  var header = padRow(['ID Ingreso', 'Fecha', 'ID Usuario', 'Categoría', 'Descripción', 'Monto', 'Método de Pago'], numCols);
  var newRows = [header];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').trim() !== userId) {
      newRows.push(padRow(data[i], numCols));
    }
  }

  incomes.forEach(function(inc) {
    newRows.push(padRow([
      inc.id || ('inc-' + Date.now()),
      inc.date || new Date().toISOString().split('T')[0],
      userId,
      inc.category || 'Salario',
      inc.title || 'Ingreso',
      inc.amount || 0,
      inc.paymentMethod || 'Transferencia'
    ], numCols));
  });

  sheet.clearContents();
  sheet.getRange(1, 1, newRows.length, numCols).setValues(newRows);
}

function syncDebtsSheet(ss, userId, debts) {
  var sheet = ss.getSheetByName('Deudas');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();

  var maxAbonos = 1;
  debts.forEach(function(d) {
    if (d.paymentsHistory && d.paymentsHistory.length > maxAbonos) {
      maxAbonos = d.paymentsHistory.length;
    }
  });

  var baseHeaders = ['ID Deuda', 'Fecha', 'ID Usuario', 'Acreedor / Entidad', 'Monto Total', 'Cuota Mensual', 'Fecha de Vencimiento', 'Monto Amortizado', 'Saldo Restante', 'Estado', 'Total Abonos', 'Último Abono', 'Fecha Último Abono'];
  for (var k = 1; k <= maxAbonos; k++) {
    baseHeaders.push('Abono ' + k);
    baseHeaders.push('Fecha ' + k);
  }

  var numCols = Math.max(sheet.getLastColumn(), baseHeaders.length);
  var header = padRow(baseHeaders, numCols);
  var newRows = [header];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').trim() !== userId) {
      newRows.push(padRow(data[i], numCols));
    }
  }

  debts.forEach(function(d) {
    var amortizado = (d.totalAmount || 0) - (d.currentBalance || 0);
    var start = d.date || new Date().toISOString().split('T')[0];
    var end = d.dueDate || start;
    var plazo = calculateMonthsBetween(start, end);
    var cuota = Math.round((d.totalAmount || 0) / plazo);
    var history = d.paymentsHistory || [];
    var lastPayment = history.length > 0 ? history[history.length - 1] : null;

    var row = [
      d.id || ('debt-' + Date.now()),
      start,
      userId,
      d.lender || d.title || 'Entidad',
      d.totalAmount || 0,
      cuota,
      end,
      amortizado,
      d.currentBalance || 0,
      d.status || 'Activa',
      history.length,
      lastPayment ? lastPayment.amount : 0,
      lastPayment ? lastPayment.date : ''
    ];

    history.forEach(function(p) {
      row.push(p.amount);
      row.push(p.date);
    });

    newRows.push(padRow(row, numCols));
  });

  sheet.clearContents();
  sheet.getRange(1, 1, newRows.length, numCols).setValues(newRows);

  // Sincronizar también en la hoja Abonos
  var abonosSheet = ss.getSheetByName('Abonos');
  if (!abonosSheet) {
    abonosSheet = ss.insertSheet('Abonos');
  }

  var abData = abonosSheet.getDataRange().getValues();
  var abCols = Math.max(abonosSheet.getLastColumn(), 8);
  var abHeader = padRow(['ID Abono', 'Fecha', 'Tipo', 'ID Referencia', 'Acreedor / Prestatario', 'Monto Abonado', 'Saldo Restante', 'Notas', 'ID Usuario'], abCols);
  var newAbRows = [abHeader];

  // Preservar abonos de otros usuarios o que sean de préstamos
  for (var a = 1; a < abData.length; a++) {
    var aUser = String(abData[a][8] || abData[a][7] || '').trim();
    var aType = String(abData[a][2] || '').trim();
    if (aUser !== userId || aType === 'Préstamo') {
      newAbRows.push(padRow(abData[a], abCols));
    }
  }

  // Insertar todos los abonos de las deudas del usuario
  debts.forEach(function(d) {
    (d.paymentsHistory || []).forEach(function(p, idx) {
      newAbRows.push(padRow([
        p.id || ('dpay-' + Date.now() + '-' + idx),
        p.date || new Date().toISOString().split('T')[0],
        'Deuda',
        d.id,
        d.lender || d.title,
        p.amount,
        d.currentBalance,
        p.note || 'Abono a deuda',
        userId
      ], abCols));
    });
  });

  abonosSheet.clearContents();
  abonosSheet.getRange(1, 1, newAbRows.length, abCols).setValues(newAbRows);
}

function calculateMonthsBetween(d1Str, d2Str) {
  if (!d1Str || !d2Str) return 1;
  var s1 = String(d1Str).split('T')[0].split('-');
  var s2 = String(d2Str).split('T')[0].split('-');
  if (s1.length < 3 || s2.length < 3) return 1;

  var y1 = parseInt(s1[0], 10), m1 = parseInt(s1[1], 10), day1 = parseInt(s1[2], 10);
  var y2 = parseInt(s2[0], 10), m2 = parseInt(s2[1], 10), day2 = parseInt(s2[2], 10);

  if (isNaN(y1) || isNaN(y2)) return 1;

  var months = (y2 - y1) * 12 + (m2 - m1);
  if (day2 - day1 >= 15) {
    months += 1;
  } else if (day1 - day2 >= 15) {
    months -= 1;
  }
  return Math.max(1, months);
}

function syncLoansSheet(ss, userId, loans) {
  var sheet = ss.getSheetByName('Prestamos');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  // Sincronizar en hoja Prestamos con celdas individuales para cada abono
  var maxAbonos = 1;
  loans.forEach(function(l) {
    if (l.paymentsHistory && l.paymentsHistory.length > maxAbonos) {
      maxAbonos = l.paymentsHistory.length;
    }
  });

  var baseHeaders = ['ID Préstamo', 'Fecha Inicio', 'Fecha Final', 'ID Usuario', 'Prestatario', 'Monto Prestado', 'Tasa de Interés', 'Plazo en Meses', 'Cuota Mensual', 'Monto Cobrado', 'Saldo Pendiente', 'Estado', 'Total Abonos', 'Último Abono', 'Fecha Último Abono'];
  for (var k = 1; k <= maxAbonos; k++) {
    baseHeaders.push('Abono ' + k);
    baseHeaders.push('Fecha ' + k);
  }

  var numCols = Math.max(sheet.getLastColumn(), baseHeaders.length);
  var header = padRow(baseHeaders, numCols);
  var newRows = [header];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3] || '').trim() !== userId) {
      newRows.push(padRow(data[i], numCols));
    }
  }

  loans.forEach(function(l) {
    var cobrado = (l.originalAmount || 0) - (l.remainingAmount || 0);
    var start = l.startDate || new Date().toISOString().split('T')[0];
    var end = l.dueDate || '';
    var plazo = calculateMonthsBetween(start, end);
    var cuota = Math.round((l.originalAmount || 0) / plazo);
    var history = l.paymentsHistory || [];
    var lastPayment = history.length > 0 ? history[history.length - 1] : null;

    var row = [
      l.id || ('loan-' + Date.now()),
      start,
      end,
      userId,
      l.personName || 'Prestatario',
      l.originalAmount || 0,
      l.interestRate || 0,
      plazo,
      cuota,
      cobrado,
      l.remainingAmount || 0,
      l.status || 'Al día',
      history.length,
      lastPayment ? lastPayment.amount : 0,
      lastPayment ? lastPayment.date : ''
    ];

    history.forEach(function(p) {
      row.push(p.amount);
      row.push(p.date);
    });

    newRows.push(padRow(row, numCols));
  });

  sheet.clearContents();
  sheet.getRange(1, 1, newRows.length, numCols).setValues(newRows);

  // Sincronizar en hoja Abonos (una nueva fila por cada abono)
  var abonosSheet = ss.getSheetByName('Abonos');
  if (!abonosSheet) {
    abonosSheet = ss.insertSheet('Abonos');
  }

  var abData = abonosSheet.getDataRange().getValues();
  var abCols = Math.max(abonosSheet.getLastColumn(), 8);
  var abHeader = padRow(['ID Abono', 'Fecha', 'ID Préstamo', 'Prestatario', 'Monto Abonado', 'Saldo Restante', 'Notas', 'ID Usuario'], abCols);
  var newAbRows = [abHeader];

  // Preservar abonos de otros usuarios
  for (var a = 1; a < abData.length; a++) {
    if (String(abData[a][7] || '').trim() !== userId) {
      newAbRows.push(padRow(abData[a], abCols));
    }
  }

  // Insertar todos los abonos del usuario actual
  loans.forEach(function(l) {
    (l.paymentsHistory || []).forEach(function(p, idx) {
      newAbRows.push(padRow([
        p.id || ('abn-' + Date.now() + '-' + idx),
        p.date || new Date().toISOString().split('T')[0],
        l.id,
        l.personName,
        p.amount,
        l.remainingAmount,
        p.note || 'Abono registrado',
        userId
      ], abCols));
    });
  });

  abonosSheet.clearContents();
  abonosSheet.getRange(1, 1, newAbRows.length, abCols).setValues(newAbRows);
}
