import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();

// 🔹 CORS: permitir el frontend de Vite (dev) y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS bloqueado para: ${origin}`);
      callback(new Error(`CORS bloqueado para: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ──────────────────────────────────────────────
// 🛡️ Middleware de autenticación
// ──────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// ──────────────────────────────────────────────
// 🔐 Login
// ──────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { user, password } = req.body;
  if (user === 'admin' && password === '1234') {
    const token = jwt.sign({ user }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Credenciales inválidas' });
});

// ──────────────────────────────────────────────
// 🏥 Test de conexión
// ──────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

// ──────────────────────────────────────────────
// 📊 Dashboard Data
// ──────────────────────────────────────────────

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    beneficiarios: 120,
    citas: 35,
    ordenes: 18,
    profesionales: 12
  });
});

app.get('/api/dashboard/citas', authenticateToken, (req, res) => {
  const citas = [
    { id: 1, medico: "Dr. Juan Pérez", beneficiario: "Carlos Valencia", hora: "11:20 a.m", estado: "Activo" },
    { id: 2, medico: "Dra. Maria López", beneficiario: "Ana Garcia", hora: "02:00 p.m", estado: "Activo" },
    { id: 3, medico: "Dr. Roberto Diaz", beneficiario: "Lucas Gomez", hora: "08:30 a.m", estado: "Completado" },
    { id: 4, medico: "Dra. Elena Ruiz", beneficiario: "Sofia Martinez", hora: "10:15 a.m", estado: "Cancelado" },
    { id: 5, medico: "Dr. Juan Pérez", beneficiario: "Samuel Rodriguez", hora: "03:45 p.m", estado: "Pendiente" }
  ];
  res.json(citas);
});

// ──────────────────────────────────────────────
// 👥 Usuarios Data
// ──────────────────────────────────────────────

app.get('/api/usuarios', authenticateToken, (req, res) => {
  const usuarios = [
    { id: 1, nombre: "Admin", rol: "Administrador", email: "admin@medisena.com" },
    { id: 2, nombre: "Paula Chaparro", rol: "Enfermera", email: "paula@medisena.com" },
    { id: 3, nombre: "Carlos Sanchez", rol: "Médico", email: "carlos@medisena.com" }
  ];
  res.json(usuarios);
});

// ──────────────────────────────────────────────
// 🚀 Servidor
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));

