const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Detrás de nginx (proxy /api): permite X-Forwarded-* y evita error de express-rate-limit
if (process.env.TRUST_PROXY !== '0') {
  app.set('trust proxy', 1);
}

// CORS primero (antes de helmet/rateLimit) para que el preflight OPTIONS siempre responda bien
const allowedOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Permitir cualquier localhost o 127.0.0.1 en cualquier puerto (desarrollo)
  try {
    const u = new URL(origin);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
  } catch (_) {}
  return false;
};
app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) {
      cb(null, origin || allowedOrigins[0] || 'http://localhost:8080');
    } else {
      cb(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
}));

// Middleware de seguridad - Helmet con CORP permisivo para API consumida por frontend
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());

// Rate limiting (después de CORS para no bloquear preflight)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Autenticación: todas las rutas bajo /api requieren JWT excepto /api/auth
const { authenticateJWT } = require('./middlewares/auth');
app.use('/api', (req, res, next) => {
  if (req.path === '/auth' || req.path.startsWith('/auth/')) {
    return next();
  }
  return authenticateJWT(req, res, next);
});

// Rutas principales
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/rbac', require('./routes/rbac.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
// Maestras / gestión (compat: alias /niveles y /topes usados por el frontend)
app.use('/api/resoluciones', require('./routes/resoluciones.routes'));
app.use('/api/vigencias', require('./routes/vigencias.routes'));
app.use('/api/abrir-vigencia', require('./routes/abrirVigencia.routes'));
app.use('/api/parametros', require('./routes/parametros.routes'));
app.use('/api/parentescos', require('./routes/parentescos.routes'));
app.use('/api/niveles-tope', require('./routes/nivelesTope.routes'));
app.use('/api/niveles', require('./routes/nivelesTope.routes'));
app.use('/api/grupos-tope', require('./routes/gruposTope.routes'));
app.use('/api/topes', require('./routes/gruposTope.routes'));
app.use('/api/sub-especialidades', require('./routes/subEspecialidades.routes'));
// Rutas - Sistema
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/stats', require('./routes/dashboard.routes')); // Alias para /api/stats



// Documentación Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'MediSENA Backend API',
      version: '1.0.0',
      description: 'API REST para el sistema de Medicina Asistencial del SENA',
    },
    servers: [
      {
        url: 'http://localhost:8081',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MediSENA Backend API',
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'MediSENA Backend API',
    version: '1.0.0',
    description: 'Sistema de Medicina Asistencial del SENA',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      rbac: '/api/rbac',
      usuarios: '/api/usuarios',
      resoluciones: '/api/resoluciones',
      vigencias: '/api/vigencias',
      parametros: '/api/parametros',
      parentescos: '/api/parentescos',
      nivelesTope: '/api/niveles-tope',
      gruposTope: '/api/grupos-tope',
      subEspecialidades: '/api/sub-especialidades',
      dashboard: '/api/dashboard',
      swagger: '/api-docs'
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🏥 MediSENA Backend API ejecutándose en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Documentación: http://localhost:${PORT}/`);
});

module.exports = app;

