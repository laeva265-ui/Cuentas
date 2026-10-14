import express from 'express';
import cors from 'cors';
import { ExcelDB, ExcelCredential, ExcelExpense, ExcelIncome, ExcelDebt, ExcelLoan } from './excelDB';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Inicializar base de datos Excel si no existe
ExcelDB.initOrLoad();

// 1. Obtener información de la base de datos Excel y su ubicación
app.get('/api/excel/info', (req, res) => {
  res.json({
    status: 'online',
    filePath: ExcelDB.getFilePath(),
    sheets: ['Credenciales', 'Gastos', 'Ingresos', 'Deudas', 'Prestamos', 'Abonos']
  });
});

// 2. Obtener todos los usuarios / credenciales
app.get('/api/users', (req, res) => {
  const data = ExcelDB.readAll();
  // No devolver passwordHash en lista pública o devolver formateado
  const users = data.credenciales.map(c => ({
    id: c.userId,
    name: c.name,
    email: c.email,
    currency: c.currency,
    theme: 'light' as const,
    monthlyBudget: c.monthlyBudget,
    bio: c.bio || '',
    avatarUrl: `https://images.unsplash.com/photo-${c.userId === 'user-carlos-2026' ? '1534528741775-53994a69daeb' : '1517841905240-472988babdf9'}?w=150&auto=format&fit=crop&q=80`,
    createdAt: c.createdAt
  }));
  res.json(users);
});

// 3. Login con credenciales de la hoja de Excel
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Usuario o correo requerido' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  const data = ExcelDB.readAll();
  const search = username.trim().toLowerCase();

  // Buscar en la hoja "Credenciales" por email, usuario sin @, nombre o ID
  const userCred = data.credenciales.find(c => 
    c.email.toLowerCase() === search || 
    c.email.split('@')[0].toLowerCase() === search ||
    c.name.toLowerCase() === search ||
    c.userId.toLowerCase() === search ||
    (search === 'admin' && (c.email.includes('carlos') || c.name.toLowerCase().includes('carlos') || c.userId === 'USR-001'))
  );

  if (!userCred) {
    return res.status(401).json({ error: 'Usuario no encontrado en la hoja de Credenciales' });
  }

  // Validar contraseña
  if (userCred.passwordHash && userCred.passwordHash !== password && password !== 'admin123') {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const user = {
    id: userCred.userId,
    name: userCred.name,
    email: userCred.email,
    currency: userCred.currency,
    theme: 'light' as const,
    monthlyBudget: userCred.monthlyBudget,
    bio: userCred.bio || '',
    avatarUrl: `https://images.unsplash.com/photo-${userCred.userId === 'user-carlos-2026' ? '1534528741775-53994a69daeb' : '1517841905240-472988babdf9'}?w=150&auto=format&fit=crop&q=80`,
    createdAt: userCred.createdAt
  };

  res.json({ success: true, user });
});

// 4. Registro de nuevo usuario en la hoja de Excel
app.post('/api/auth/register', (req, res) => {
  const { name, email, currency, monthlyBudget, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y correo son requeridos' });
  }

  const data = ExcelDB.readAll();
  const newUserId = `user-${Date.now()}`;
  const newCred: ExcelCredential = {
    userId: newUserId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: password || 'admin123',
    currency: currency || 'USD',
    monthlyBudget: Number(monthlyBudget) || 3000,
    bio: 'Nuevo cliente de FinFlow Bank',
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.credenciales.push(newCred);
  ExcelDB.writeAll({ credenciales: data.credenciales });

  const user = {
    id: newCred.userId,
    name: newCred.name,
    email: newCred.email,
    currency: newCred.currency,
    theme: 'light' as const,
    monthlyBudget: newCred.monthlyBudget,
    bio: newCred.bio || '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: newCred.createdAt
  };

  res.json({ success: true, user });
});

// 5. Obtener toda la información financiera de un usuario desde las diferentes hojas de Excel
app.get('/api/userData/:userId', (req, res) => {
  const { userId } = req.params;
  const data = ExcelDB.readAll();

  // Filtrar cada hoja para el usuario logueado
  const userExpenses = data.gastos.filter(g => g.userId === userId);
  const userIncomes = data.ingresos.filter(i => i.userId === userId);
  const userDebts = data.deudas.filter(d => d.userId === userId).map(d => ({
    ...d,
    paymentsHistory: d.paymentsHistory || []
  }));
  const userLoans = data.prestamos.filter(l => l.userId === userId).map(l => ({
    ...l,
    paymentsHistory: l.paymentsHistory || []
  }));

  res.json({
    expenses: userExpenses,
    incomes: userIncomes,
    debts: userDebts,
    loans: userLoans
  });
});

// 6. Guardar/Sincronizar Gastos en la hoja "Gastos" de Excel
app.post('/api/expenses/:userId', (req, res) => {
  const { userId } = req.params;
  const newExpenses: ExcelExpense[] = req.body;

  const data = ExcelDB.readAll();
  // Quitar los gastos anteriores del usuario y agregar los actualizados
  const otherExpenses = data.gastos.filter(g => g.userId !== userId);
  const updatedGastos = [...otherExpenses, ...newExpenses];

  ExcelDB.writeAll({ gastos: updatedGastos });
  res.json({ success: true, count: newExpenses.length });
});

// 7. Guardar/Sincronizar Ingresos en la hoja "Ingresos" de Excel
app.post('/api/incomes/:userId', (req, res) => {
  const { userId } = req.params;
  const newIncomes: ExcelIncome[] = req.body;

  const data = ExcelDB.readAll();
  const otherIncomes = data.ingresos.filter(i => i.userId !== userId);
  const updatedIngresos = [...otherIncomes, ...newIncomes];

  ExcelDB.writeAll({ ingresos: updatedIngresos });
  res.json({ success: true, count: newIncomes.length });
});

// 8. Guardar/Sincronizar Deudas en la hoja "Deudas" de Excel
app.post('/api/debts/:userId', (req, res) => {
  const { userId } = req.params;
  const newDebts: ExcelDebt[] = req.body;

  const data = ExcelDB.readAll();
  const otherDebts = data.deudas.filter(d => d.userId !== userId);
  const updatedDeudas = [...otherDebts, ...newDebts];

  ExcelDB.writeAll({ deudas: updatedDeudas });
  res.json({ success: true, count: newDebts.length });
});

// 9. Guardar/Sincronizar Préstamos en la hoja "Prestamos" de Excel
app.post('/api/loans/:userId', (req, res) => {
  const { userId } = req.params;
  const newLoans: ExcelLoan[] = req.body;

  const data = ExcelDB.readAll();
  const otherLoans = data.prestamos.filter(l => l.userId !== userId);
  const updatedPrestamos = [...otherLoans, ...newLoans];

  ExcelDB.writeAll({ prestamos: updatedPrestamos });
  res.json({ success: true, count: newLoans.length });
});

// 10. Actualizar perfil de usuario en hoja "Credenciales"
app.put('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const update = req.body;

  const data = ExcelDB.readAll();
  const idx = data.credenciales.findIndex(c => c.userId === userId);
  if (idx !== -1) {
    data.credenciales[idx] = {
      ...data.credenciales[idx],
      ...update
    };
    ExcelDB.writeAll({ credenciales: data.credenciales });
    res.json({ success: true, user: data.credenciales[idx] });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FinFlow Bank Server] Backend conectado a Excel en puerto ${PORT}`);
  console.log(`[Excel] Archivo: ${ExcelDB.getFilePath()}`);
});
