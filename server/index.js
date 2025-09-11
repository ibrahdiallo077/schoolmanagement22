// server/index.js - Serveur École Moderne Complète - Version Corrigée avec Dashboard Intégré
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Import des configurations
const { testConnection, closePool } = require('./config/database');
const { initializeDatabase } = require('./config/database-init');

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Fonction simple pour stats auth
function getAuthStats() {
  return {
    cacheSize: 0,
    maxCacheSize: 1000,
    jwtSecretConfigured: !!process.env.JWT_SECRET,
    refreshSecretConfigured: !!process.env.JWT_REFRESH_SECRET
  };
}

// Fonction simple pour nettoyer le cache
function clearUserCache() {
  console.log('Cache utilisateur nettoyé (fonction simplifiée)');
}

// === MIDDLEWARES DE SÉCURITÉ ===
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "http:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CONFIGURATION CORS CORRIGÉE
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      console.log('Requête sans origin autorisée (fichier local ou Postman)');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL
    ].filter(Boolean);

    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('file://')) {
        console.log(`Origin développement autorisé: ${origin}`);
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`Origin autorisé: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`Origine non autorisée: ${origin}`);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Autorisé en développement malgré tout');
        return callback(null, true);
      }
      callback(new Error('Origine non autorisée par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Refresh-Token',
    'X-Connection-Quality',
    'Cache-Control',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'x-auth-token',
    'X-Auth-Token'
  ],
  exposedHeaders: [
    'X-New-Access-Token',
    'X-New-Refresh-Token',
    'X-Session-Expired',
    'X-Connection-Quality'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Middleware pour requêtes OPTIONS CORRIGÉ
app.options('*', (req, res) => {
  console.log(`Requête OPTIONS pour: ${req.path} depuis: ${req.get('Origin') || 'sans origin'}`);
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, X-Refresh-Token, X-Connection-Quality, x-auth-token, X-Auth-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// MIDDLEWARES JSON/URLENCODED - DOIVENT ÊTRE AVANT LES ROUTES !
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: 'application/json'
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// === MIDDLEWARE DE GESTION D'ERREURS JSON GLOBAL ===
app.use((error, req, res, next) => {
  if (error) {
    console.error('Erreur middleware détectée:', {
      error: error.message,
      type: error.type,
      status: error.status,
      url: req.url,
      method: req.method
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('JSON malformé détecté:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Format JSON invalide',
      details: 'Vérifiez que les données envoyées sont au format JSON valide',
      message: 'Le serveur n\'a pas pu analyser les données reçues'
    });
  }

  if (error.type === 'entity.verify.failed') {
    console.error('Échec de vérification des données:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Données de requête invalides',
      details: 'Format ou contenu des données incorrect',
      message: 'Veuillez vérifier les informations saisies'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Données trop volumineuses',
      details: 'La taille des données dépasse la limite autorisée'
    });
  }

  if (error) {
    next(error);
  } else {
    next();
  }
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    code: 'TOO_MANY_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.includes('/heartbeat') || req.path.includes('/refresh-token');
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: 'Trop de requêtes. Réessayez plus tard.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/refresh-token', authLimiter);
app.use('/api', generalLimiter);

// Middleware de sécurité et logging
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  
  if (isMobile) {
    res.set('X-Mobile-Optimized', 'true');
  }

  next();
});

// Middleware de logging amélioré
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  if (req.path.includes('/expenses') || req.path.includes('/unified-finance') || req.path.includes('/academic-progress')) {
    console.log(`${req.method} ${req.path} - Début`);
  }
  
  res.send = function(data) {
    const duration = Date.now() - start;
    const size = data ? Buffer.byteLength(data, 'utf8') : 0;
    
    if (req.path.includes('/expenses') || req.path.includes('/unified-finance') || req.path.includes('/academic-progress')) {
      console.log(
        `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${size}b`
      );
    } else if (req.path.includes('/auth/') || req.path.includes('/admin/') || duration > 1000) {
      console.log(
        `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${size}b`
      );
    }
    
    originalSend.call(this, data);
  };
  
  next();
});

// CRÉER LES DOSSIERS UPLOADS AU DÉMARRAGE
function ensureUploadDirectories() {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
    
    console.log('Vérification des dossiers uploads...');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Dossier uploads créé:', uploadsDir);
    }
    
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
      console.log('Dossier avatars créé:', avatarsDir);
    }
    
    const gitkeepPath = path.join(avatarsDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '# Dossier pour les photos des étudiants\n');
      console.log('Fichier .gitkeep créé');
    }
    
    console.log('Dossiers uploads configurés avec succès');
    return true;
  } catch (error) {
    console.error('Erreur création dossiers uploads:', error);
    return false;
  }
}

// Servir les fichiers uploads
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=3600');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  console.log(`Demande image: ${req.method} /uploads${req.path}`);
  console.log(`Chemin fichier: ${filePath}`);
  console.log(`Fichier existe: ${fs.existsSync(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('Fichier non trouvé:', filePath);
    return res.status(404).json({
      error: 'Fichier non trouvé',
      path: req.path,
      fullPath: filePath
    });
  }
  
  console.log('Fichier trouvé, envoi...');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === IMPORT DES ROUTES - AVEC FALLBACK SÉCURISÉ ===
console.log('=== CHARGEMENT DES ROUTES ===');

let authRoutes, adminRoutes, studentsRoutes, staffRoutes, classesRoutes, schoolYearsRoutes, 
    paymentsRoutes, staffSalariesRoutes, salaryPaymentsRoutes, staffReportsRoutes,
    expensesRoutes, financeRoutes, notificationsRoutes, academicProgressRoutes;

// === IMPORT DES ROUTES DASHBOARD ===
let dashboardOverviewRoutes, dashboardQuickStatsRoutes, dashboardLiveMetricsRoutes, 
    dashboardChartsRoutes, dashboardReportsRoutes, dashboardCoreRoutes;

console.log('=== CHARGEMENT ROUTES DASHBOARD ===');

try {
  dashboardOverviewRoutes = require('./routes/dashboard-overview');
  console.log('Routes dashboard-overview chargées');
} catch (error) {
  console.warn('Routes dashboard-overview non trouvées, création d\'un fallback');
  dashboardOverviewRoutes = express.Router();
  dashboardOverviewRoutes.get('/overview', (req, res) => {
    res.status(501).json({ 
      success: false, 
      error: 'Module dashboard-overview non disponible',
      details: 'Fichier routes/dashboard-overview.js manquant'
    });
  });
}

try {
  dashboardQuickStatsRoutes = require('./routes/dashboard-quick-stats');
  console.log('Routes dashboard-quick-stats chargées');
} catch (error) {
  console.warn('Routes dashboard-quick-stats non trouvées, création d\'un fallback');
  dashboardQuickStatsRoutes = express.Router();
  dashboardQuickStatsRoutes.get('/quick-stats', (req, res) => {
    res.status(501).json({ 
      success: false, 
      error: 'Module dashboard-quick-stats non disponible',
      details: 'Fichier routes/dashboard-quick-stats.js manquant'
    });
  });
}

try {
  dashboardLiveMetricsRoutes = require('./routes/dashboard-live-metrics');
  console.log('Routes dashboard-live-metrics chargées');
} catch (error) {
  console.warn('Routes dashboard-live-metrics non trouvées, création d\'un fallback');
  dashboardLiveMetricsRoutes = express.Router();
  dashboardLiveMetricsRoutes.get('/live-metrics', (req, res) => {
    res.status(501).json({ 
      success: false, 
      error: 'Module dashboard-live-metrics non disponible',
      details: 'Fichier routes/dashboard-live-metrics.js manquant'
    });
  });
}

try {
  dashboardChartsRoutes = require('./routes/dashboard-charts');
  console.log('Routes dashboard-charts chargées');
} catch (error) {
  console.warn('Routes dashboard-charts non trouvées, création d\'un fallback');
  dashboardChartsRoutes = express.Router();
  dashboardChartsRoutes.get('*', (req, res) => {
    res.status(501).json({ 
      success: false, 
      error: 'Module dashboard-charts non disponible',
      details: 'Fichier routes/dashboard-charts.js manquant'
    });
  });
}

try {
  dashboardReportsRoutes = require('./routes/dashboard-reports');
  console.log('Routes dashboard-reports chargées');
} catch (error) {
  console.warn('Routes dashboard-reports non trouvées, création d\'un fallback');
  dashboardReportsRoutes = express.Router();
  dashboardReportsRoutes.get('*', (req, res) => {
    res.status(501).json({ 
      success: false, 
      error: 'Module dashboard-reports non disponible',
      details: 'Fichier routes/dashboard-reports.js manquant'
    });
  });
}

// Import avec gestion d'erreurs - Routes existantes
try {
  authRoutes = require('./routes/auth');
  console.log('Routes auth chargées');
} catch (error) {
  console.warn('Routes auth non trouvées, création d\'un fallback');
  authRoutes = express.Router();
  authRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module auth non disponible' });
  });
}

try {
  adminRoutes = require('./routes/admin');
  console.log('Routes admin chargées');
} catch (error) {
  console.warn('Routes admin non trouvées, création d\'un fallback');
  adminRoutes = express.Router();
  adminRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module admin non disponible' });
  });
}

try {
  studentsRoutes = require('./routes/students');
  console.log('Routes students chargées');
} catch (error) {
  console.warn('Routes students non trouvées, création d\'un fallback');
  studentsRoutes = express.Router();
  studentsRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module students non disponible' });
  });
}

try {
  staffRoutes = require('./routes/staff');
  console.log('Routes staff chargées');
} catch (error) {
  console.warn('Routes staff non trouvées, création d\'un fallback');
  staffRoutes = express.Router();
  staffRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module staff non disponible' });
  });
}

try {
  classesRoutes = require('./routes/classes');
  console.log('Routes classes chargées');
} catch (error) {
  console.warn('Routes classes non trouvées, création d\'un fallback');
  classesRoutes = express.Router();
  classesRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module classes non disponible' });
  });
}

try {
  schoolYearsRoutes = require('./routes/school-years');
  console.log('Routes school-years chargées');
} catch (error) {
  console.warn('Routes school-years non trouvées, création d\'un fallback');
  schoolYearsRoutes = express.Router();
  schoolYearsRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module school-years non disponible' });
  });
}

try {
  paymentsRoutes = require('./routes/payments');
  console.log('Routes payments chargées');
} catch (error) {
  console.error('ERREUR CRITIQUE: Routes payments non trouvées:', error.message);
  console.error('Vérifiez que le fichier ./routes/payments.js existe');
  console.error('Chemin attendu:', path.join(__dirname, 'routes', 'payments.js'));
  
  paymentsRoutes = express.Router();
  paymentsRoutes.get('/status', (req, res) => {
    res.status(503).json({ 
      success: false, 
      error: 'Module payments temporairement indisponible',
      details: 'Fichier routes/payments.js manquant ou corrompu'
    });
  });
}

try {
  staffSalariesRoutes = require('./routes/staff-salaries');
  console.log('Routes staff-salaries chargées');
} catch (error) {
  console.warn('Routes staff-salaries non trouvées, création d\'un fallback');
  staffSalariesRoutes = express.Router();
  staffSalariesRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module staff-salaries non disponible' });
  });
}

try {
  salaryPaymentsRoutes = require('./routes/salary-payments');
  console.log('Routes salary-payments chargées');
} catch (error) {
  console.warn('Routes salary-payments non trouvées, création d\'un fallback');
  salaryPaymentsRoutes = express.Router();
  salaryPaymentsRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module salary-payments non disponible' });
  });
}

try {
  staffReportsRoutes = require('./routes/staff-reports');
  console.log('Routes staff-reports chargées');
} catch (error) {
  console.warn('Routes staff-reports non trouvées, création d\'un fallback');
  staffReportsRoutes = express.Router();
  staffReportsRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module staff-reports non disponible' });
  });
}

// === ROUTES EXPENSES - CHARGEMENT UNIFIÉ CORRIGÉ ===
console.log('=== CHARGEMENT ROUTES EXPENSES UNIFIÉES ===');

try {
  expensesRoutes = require('./routes/expenses');
  console.log('Routes expenses unifiées chargées avec succès depuis ./routes/expenses.js');
  
  if (expensesRoutes && expensesRoutes.stack && expensesRoutes.stack.length > 0) {
    console.log(`${expensesRoutes.stack.length} routes expenses détectées`);
  } else {
    console.warn('Routes expenses vides ou invalides');
  }
  
} catch (error) {
  console.error('ERREUR CRITIQUE: Routes expenses non trouvées:', error.message);
  console.error('Vérifiez que le fichier ./routes/expenses.js existe');
  console.error('Chemin attendu:', path.join(__dirname, 'routes', 'expenses.js'));
  console.error('Fichiers dans ./routes:', fs.readdirSync(path.join(__dirname, 'routes')));
  
  expensesRoutes = express.Router();
  
  expensesRoutes.get('/test/fallback', (req, res) => {
    res.status(503).json({ 
      success: false, 
      error: 'Module expenses temporairement indisponible',
      details: 'Fichier routes/expenses.js manquant ou corrompu',
      expected_path: path.join(__dirname, 'routes', 'expenses.js'),
      files_in_routes: fs.readdirSync(path.join(__dirname, 'routes')),
      timestamp: new Date().toISOString()
    });
  });
  
  expensesRoutes.all('*', (req, res) => {
    console.log(`[FALLBACK] Route expenses non trouvée: ${req.method} ${req.path}`);
    res.status(501).json({ 
      success: false, 
      error: 'Route expenses non implémentée',
      path: req.path,
      method: req.method,
      details: 'Le module expenses n\'est pas disponible - Vérifiez le fichier ./routes/expenses.js'
    });
  });
}

// === ROUTES FINANCE - CHARGEMENT SIMPLIFIÉ ===
console.log('=== CHARGEMENT ROUTES FINANCE ===');

try {
  financeRoutes = require('./routes/finance');
  console.log('Routes finance chargées');
} catch (error) {
  console.warn('Routes finance non trouvées, création d\'un fallback');
  financeRoutes = express.Router();
  financeRoutes.get('*', (req, res) => {
    res.status(501).json({ success: false, error: 'Module finance non disponible' });
  });
}

console.log('=== CHARGEMENT ROUTES NOTIFICATIONS ===');

try {
  notificationsRoutes = require('./routes/notifications');
  console.log('Routes notifications chargées avec succès');
  
  if (notificationsRoutes && notificationsRoutes.stack && notificationsRoutes.stack.length > 0) {
    console.log(`${notificationsRoutes.stack.length} routes notifications détectées`);
  } else {
    console.warn('Routes notifications vides ou invalides');
  }
  
} catch (error) {
  console.error('ERREUR: Routes notifications non trouvées:', error.message);
  console.error('Vérifiez que le fichier ./routes/notifications.js existe');
  console.error('Chemin attendu:', path.join(__dirname, 'routes', 'notifications.js'));
  
  notificationsRoutes = express.Router();
  
  notificationsRoutes.get('/test/fallback', (req, res) => {
    res.status(503).json({ 
      success: false, 
      error: 'Module notifications temporairement indisponible',
      details: 'Fichier routes/notifications.js manquant ou corrompu',
      expected_path: path.join(__dirname, 'routes', 'notifications.js'),
      timestamp: new Date().toISOString()
    });
  });
  
  notificationsRoutes.all('*', (req, res) => {
    console.log(`[FALLBACK] Route notifications non trouvée: ${req.method} ${req.path}`);
    res.status(501).json({ 
      success: false, 
      error: 'Route notifications non implémentée',
      path: req.path,
      method: req.method,
      details: 'Le module notifications n\'est pas disponible - Vérifiez le fichier ./routes/notifications.js'
    });
  });
}

// === NOUVEAU : ROUTES ACADEMIC PROGRESS ===
console.log('=== CHARGEMENT ROUTES ACADEMIC PROGRESS ===');

try {
  academicProgressRoutes = require('./routes/academic-progress');
  console.log('Routes academic-progress chargées avec succès depuis ./routes/academic-progress.js');
  
  if (academicProgressRoutes && academicProgressRoutes.stack && academicProgressRoutes.stack.length > 0) {
    console.log(`${academicProgressRoutes.stack.length} routes academic-progress détectées`);
  } else {
    console.warn('Routes academic-progress vides ou invalides');
  }
  
} catch (error) {
  console.error('ERREUR CRITIQUE: Routes academic-progress non trouvées:', error.message);
  console.error('Vérifiez que le fichier ./routes/academic-progress.js existe');
  console.error('Chemin attendu:', path.join(__dirname, 'routes', 'academic-progress.js'));
  console.error('Fichiers dans ./routes:', fs.readdirSync(path.join(__dirname, 'routes')));
  
  academicProgressRoutes = express.Router();
  
  academicProgressRoutes.get('/test/fallback', (req, res) => {
    res.status(503).json({ 
      success: false, 
      error: 'Module academic-progress temporairement indisponible',
      details: 'Fichier routes/academic-progress.js manquant ou corrompu',
      expected_path: path.join(__dirname, 'routes', 'academic-progress.js'),
      files_in_routes: fs.readdirSync(path.join(__dirname, 'routes')),
      timestamp: new Date().toISOString()
    });
  });
  
  academicProgressRoutes.all('*', (req, res) => {
    console.log(`[FALLBACK] Route academic-progress non trouvée: ${req.method} ${req.path}`);
    res.status(501).json({ 
      success: false, 
      error: 'Route academic-progress non implémentée',
      path: req.path,
      method: req.method,
      details: 'Le module academic-progress n\'est pas disponible - Vérifiez le fichier ./routes/academic-progress.js'
    });
  });
}

console.log('=== CHARGEMENT ROUTES TERMINÉ ===');

// ROUTES DE TEST ET DEBUG POUR LES UPLOADS
app.get('/api/test/uploads', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    
    console.log('Test uploads directory...');
    console.log('Uploads dir:', uploadsDir);
    console.log('Avatars dir:', avatarsDir);
    
    const uploadsExists = fs.existsSync(uploadsDir);
    const avatarsExists = fs.existsSync(avatarsDir);
    
    console.log('Uploads exists:', uploadsExists);
    console.log('Avatars exists:', avatarsExists);
    
    let avatarFiles = [];
    if (avatarsExists) {
      avatarFiles = fs.readdirSync(avatarsDir);
    }
    
    console.log('Avatar files:', avatarFiles.length);
    
    res.json({
      success: true,
      directories: {
        uploads: {
          path: uploadsDir,
          exists: uploadsExists
        },
        avatars: {
          path: avatarsDir,
          exists: avatarsExists,
          files_count: avatarFiles.length,
          files: avatarFiles.slice(0, 10)
        }
      },
      test_urls: avatarFiles.slice(0, 3).map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/uploads/avatars/${file}`,
        test_command: `curl -I http://localhost:${PORT}/uploads/avatars/${file}`
      }))
    });
    
  } catch (error) {
    console.error('Erreur test uploads:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test des uploads',
      details: error.message
    });
  }
});

// === ROUTES PRINCIPALES ===
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Markaz Ubayd Ibn Kab - École Moderne Complète avec Dashboard Intégré',
    version: '2.8.0', // Version mise à jour avec Dashboard Intégré
    timestamp: new Date().toISOString(),
    features: [
      'Gestion complète des étudiants',
      'Gestion du personnel',
      'Gestion des classes (Coranique & Française)',
      'Gestion des années scolaires',
      'Gestion des configurations de salaires',
      'Gestion des paiements de salaires',
      'Rapports RH et statistiques avancées',
      'Tableau de bord RH temps réel',
      'SYSTÈME UNIFIÉ DE GESTION DES DÉPENSES (CORRIGÉ !)',
      'SYSTÈME FINANCIER UNIFIÉ',
      'SYSTÈME DE NOTIFICATIONS COMPLET',
      'ÉVOLUTION ACADÉMIQUE DES ÉTUDIANTS',
      'DASHBOARD MODULAIRE INTÉGRÉ (NOUVEAU !)',
      'Sessions adaptatives et sécurisées',
      'Upload de photos',
      'Statistiques avancées',
      'Double scolarité',
      'Gestion des paiements étudiants',
      'Export CSV et rapports personnalisés'
    ],
    endpoints: {
      auth: '/api/auth/* - Authentification avec sessions robustes',
      admin: '/api/admin/* - Administration',
      staff: '/api/staff/* - Personnel',
      students: '/api/students/* - Étudiants',
      classes: '/api/classes/* - Classes',
      school_years: '/api/school-years/* - Années scolaires',
      payments: '/api/payments/* - Paiements étudiants',
      staff_salaries: '/api/staff-salaries/* - Configurations salaires',
      salary_payments: '/api/salary-payments/* - Paiements salaires',
      staff_reports: '/api/staff-reports/* - Rapports RH',
      expenses: '/api/expenses/* - Système unifié de gestion des dépenses',
      unified_finance: '/api/unified-finance/* - Système financier unifié',
      notifications: '/api/notifications/* - Système de notifications complet',
      academic_progress: '/api/academic-progress/* - Évolution académique des étudiants',
      dashboard_overview: '/api/dashboard-overview/* - Vue d\'ensemble dashboard (NOUVEAU !)',
      dashboard_quick_stats: '/api/dashboard-quick-stats/* - Statistiques rapides (NOUVEAU !)',
      dashboard_live_metrics: '/api/dashboard-live-metrics/* - Métriques temps réel (NOUVEAU !)',
      dashboard_charts: '/api/dashboard-charts/* - Graphiques et visualisations (NOUVEAU !)',
      dashboard_reports: '/api/dashboard-reports/* - Rapports dashboard (NOUVEAU !)',
      quick_access: '/api/quick/* - Accès rapide formulaires',
      health: '/api/health - Santé complète du système'
    },
    routes_status: {
      expenses_unified: !!expensesRoutes,
      finance_unified: !!financeRoutes,
      notifications: !!notificationsRoutes,
      academic_progress: !!academicProgressRoutes,
      dashboard_overview: !!dashboardOverviewRoutes,
      dashboard_quick_stats: !!dashboardQuickStatsRoutes,
      dashboard_live_metrics: !!dashboardLiveMetricsRoutes,
      dashboard_charts: !!dashboardChartsRoutes,
      dashboard_reports: !!dashboardReportsRoutes,
      expenses_file_path: path.join(__dirname, 'routes', 'expenses.js'),
      finance_file_path: path.join(__dirname, 'routes', 'finance.js'),
      notifications_file_path: path.join(__dirname, 'routes', 'notifications.js'),
      academic_progress_file_path: path.join(__dirname, 'routes', 'academic-progress.js'),
      dashboard_overview_file_path: path.join(__dirname, 'routes', 'dashboard-overview.js'),
      dashboard_quick_stats_file_path: path.join(__dirname, 'routes', 'dashboard-quick-stats.js'),
      dashboard_live_metrics_file_path: path.join(__dirname, 'routes', 'dashboard-live-metrics.js'),
      dashboard_charts_file_path: path.join(__dirname, 'routes', 'dashboard-charts.js'),
      dashboard_reports_file_path: path.join(__dirname, 'routes', 'dashboard-reports.js')
    }
  });
});

// === MONTAGE DES ROUTES ===
console.log('=== MONTAGE DES ROUTES ===');

// Routes existantes d'abord
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/students', studentsRoutes); 
app.use('/api/staff', staffRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/school-years', schoolYearsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/staff-salaries', staffSalariesRoutes);
app.use('/api/salary-payments', salaryPaymentsRoutes);
app.use('/api/staff-reports', staffReportsRoutes);

console.log('=== MONTAGE ROUTES NOTIFICATIONS ===');
app.use('/api/notifications', (req, res, next) => {
  console.log(`[NOTIFICATIONS] ${req.method} ${req.originalUrl}`);
  next();
}, notificationsRoutes);

console.log('Routes notifications montées avec succès');

// === ROUTES FINANCIÈRES ===
console.log('=== MONTAGE ROUTES EXPENSES ===');
app.use('/api/expenses', (req, res, next) => {
  console.log(`[EXPENSES-UNIFIED] ${req.method} ${req.originalUrl}`);
  next();
}, expensesRoutes);

console.log('=== MONTAGE ROUTES UNIFIED-FINANCE ===');
app.use('/api/unified-finance', (req, res, next) => {
  console.log(`[UNIFIED-FINANCE] ${req.method} ${req.originalUrl}`);
  next();
}, financeRoutes);

console.log('Routes financières montées avec succès');

// === NOUVEAU : MONTAGE ROUTES ACADEMIC PROGRESS ===
console.log('=== MONTAGE ROUTES ACADEMIC PROGRESS ===');
app.use('/api/academic-progress', (req, res, next) => {
  console.log(`[ACADEMIC-PROGRESS] ${req.method} ${req.originalUrl}`);
  next();
}, academicProgressRoutes);

console.log('Routes academic-progress montées avec succès');

// === MONTAGE ROUTES DASHBOARD ===
console.log('=== MONTAGE ROUTES DASHBOARD ===');

// Routes dashboard avec préfixes corrects
app.use('/api/dashboard-overview', (req, res, next) => {
  console.log(`[DASHBOARD-OVERVIEW] ${req.method} ${req.originalUrl}`);
  next();
}, dashboardOverviewRoutes);

app.use('/api/dashboard-quick-stats', (req, res, next) => {
  console.log(`[DASHBOARD-QUICK-STATS] ${req.method} ${req.originalUrl}`);
  next();
}, dashboardQuickStatsRoutes);

app.use('/api/dashboard-live-metrics', (req, res, next) => {
  console.log(`[DASHBOARD-LIVE-METRICS] ${req.method} ${req.originalUrl}`);
  next();
}, dashboardLiveMetricsRoutes);

app.use('/api/dashboard-charts', (req, res, next) => {
  console.log(`[DASHBOARD-CHARTS] ${req.method} ${req.originalUrl}`);
  next();
}, dashboardChartsRoutes);

app.use('/api/dashboard-reports', (req, res, next) => {
  console.log(`[DASHBOARD-REPORTS] ${req.method} ${req.originalUrl}`);
  next();
}, dashboardReportsRoutes);

console.log('Routes dashboard montées avec succès');

// Route de test pour vérifier le chargement dashboard
app.get('/api/test/dashboard-status', (req, res) => {
  res.json({
    success: true,
    message: 'Status des routes dashboard intégrées',
    routes_loaded: {
      dashboard_overview: !!dashboardOverviewRoutes,
      dashboard_quick_stats: !!dashboardQuickStatsRoutes,
      dashboard_live_metrics: !!dashboardLiveMetricsRoutes,
      dashboard_charts: !!dashboardChartsRoutes,
      dashboard_reports: !!dashboardReportsRoutes,
      expenses_unified: !!expensesRoutes,
      finance_unified: !!financeRoutes,
      academic_progress: !!academicProgressRoutes
    },
    file_info: {
      dashboard_overview_path: path.join(__dirname, 'routes', 'dashboard-overview.js'),
      dashboard_overview_exists: fs.existsSync(path.join(__dirname, 'routes', 'dashboard-overview.js')),
      dashboard_quick_stats_path: path.join(__dirname, 'routes', 'dashboard-quick-stats.js'),
      dashboard_quick_stats_exists: fs.existsSync(path.join(__dirname, 'routes', 'dashboard-quick-stats.js')),
      dashboard_live_metrics_path: path.join(__dirname, 'routes', 'dashboard-live-metrics.js'),
      dashboard_live_metrics_exists: fs.existsSync(path.join(__dirname, 'routes', 'dashboard-live-metrics.js')),
      dashboard_charts_path: path.join(__dirname, 'routes', 'dashboard-charts.js'),
      dashboard_charts_exists: fs.existsSync(path.join(__dirname, 'routes', 'dashboard-charts.js')),
      dashboard_reports_path: path.join(__dirname, 'routes', 'dashboard-reports.js'),
      dashboard_reports_exists: fs.existsSync(path.join(__dirname, 'routes', 'dashboard-reports.js')),
      files_in_routes_dir: fs.readdirSync(path.join(__dirname, 'routes'))
    },
    endpoints_available: [
      'GET /api/dashboard-overview/overview - Vue d\'ensemble complète du dashboard',
      'GET /api/dashboard-quick-stats/quick-stats - Statistiques rapides',
      'GET /api/dashboard-live-metrics/live-metrics - Métriques temps réel',
      'GET /api/dashboard-charts/* - Graphiques et visualisations',
      'GET /api/dashboard-reports/* - Rapports et exports',
      'GET /api/test/dashboard-status - Status des modules dashboard'
    ],
    integration_status: 'DASHBOARD FULLY INTEGRATED',
    timestamp: new Date().toISOString()
  });
});

// Route de test pour vérifier le chargement expenses
app.get('/api/test/expenses-status', (req, res) => {
  res.json({
    success: true,
    message: 'Status des routes expenses unifiées',
    routes_loaded: {
      expenses_unified: !!expensesRoutes,
      finance_unified: !!financeRoutes,
      academic_progress: !!academicProgressRoutes,
      dashboard_overview: !!dashboardOverviewRoutes,
      dashboard_quick_stats: !!dashboardQuickStatsRoutes,
      dashboard_live_metrics: !!dashboardLiveMetricsRoutes,
      dashboard_charts: !!dashboardChartsRoutes,
      dashboard_reports: !!dashboardReportsRoutes
    },
    file_info: {
      expenses_path: path.join(__dirname, 'routes', 'expenses.js'),
      expenses_exists: fs.existsSync(path.join(__dirname, 'routes', 'expenses.js')),
      finance_path: path.join(__dirname, 'routes', 'finance.js'),
      finance_exists: fs.existsSync(path.join(__dirname, 'routes', 'finance.js')),
      academic_progress_path: path.join(__dirname, 'routes', 'academic-progress.js'),
      academic_progress_exists: fs.existsSync(path.join(__dirname, 'routes', 'academic-progress.js')),
      files_in_routes_dir: fs.readdirSync(path.join(__dirname, 'routes'))
    },
    structure: 'Routes unifiées dans des fichiers séparés',
    endpoints_available: [
      'GET /api/expenses - Liste des dépenses (CRUD)',
      'POST /api/expenses - Créer une dépense',
      'GET /api/expenses/:id - Voir une dépense',
      'PUT /api/expenses/:id - Modifier une dépense', 
      'DELETE /api/expenses/:id - Supprimer une dépense',
      'PATCH /api/expenses/:id/status - Changer le statut',
      'GET /api/expenses/config/categories - Catégories',
      'GET /api/expenses/config/statuses - Statuts',
      'GET /api/expenses/config/responsibles - Responsables',
      'GET /api/expenses/dashboard - Dashboard principal',
      'GET /api/unified-finance/dashboard - Dashboard financier unifié',
      'GET /api/unified-finance/capital/current - Capital actuel',
      'GET /api/unified-finance/transactions/live - Transactions temps réel',
      'GET /api/unified-finance/cash-flow - Rapport cash flow',
      'GET /api/unified-finance/budget-analysis - Analyse budgétaire',
      'GET /api/academic-progress - Liste des évaluations académiques',
      'POST /api/academic-progress - Créer une évaluation',
      'GET /api/academic-progress/students/:studentId - Historique étudiant',
      'GET /api/academic-progress/students/:studentId/latest - Dernière évaluation',
      'GET /api/academic-progress/students/:studentId/progression - Progression détaillée',
      'GET /api/academic-progress/stats/overview - Statistiques générales',
      'GET /api/academic-progress/stats/class/:classId - Statistiques par classe',
      'GET /api/dashboard-overview/overview - Dashboard overview principal',
      'GET /api/dashboard-quick-stats/quick-stats - Stats rapides dashboard',
      'GET /api/dashboard-live-metrics/live-metrics - Métriques temps réel dashboard'
    ],
    timestamp: new Date().toISOString()
  });
});

// Route de test pour unified-finance
app.get('/api/test/finance-routes', (req, res) => {
  res.json({
    success: true,
    message: 'Routes financières configurées',
    routes: {
      expenses: '/api/expenses/* - Routes expenses unifiées',
      unified_finance: '/api/unified-finance/* - Système financier unifié',
      academic_progress: '/api/academic-progress/* - Évolution académique des étudiants',
      dashboard: '/api/dashboard-*/* - Modules dashboard intégrés'
    },
    status: {
      expenses_loaded: !!expensesRoutes,
      finance_loaded: !!financeRoutes,
      academic_progress_loaded: !!academicProgressRoutes,
      dashboard_overview_loaded: !!dashboardOverviewRoutes,
      dashboard_quick_stats_loaded: !!dashboardQuickStatsRoutes,
      dashboard_live_metrics_loaded: !!dashboardLiveMetricsRoutes,
      dashboard_charts_loaded: !!dashboardChartsRoutes,
      dashboard_reports_loaded: !!dashboardReportsRoutes
    },
    test_endpoints: [
      'GET /api/unified-finance/dashboard',
      'GET /api/unified-finance/capital/current', 
      'GET /api/unified-finance/transactions/live',
      'GET /api/unified-finance/manual-transactions',
      'GET /api/unified-finance/cash-flow',
      'GET /api/unified-finance/budget-analysis',
      'GET /api/unified-finance/export/json',
      'GET /api/academic-progress/test',
      'GET /api/academic-progress/data/students-select',
      'GET /api/academic-progress/data/classes-select',
      'GET /api/academic-progress/stats/overview',
      'GET /api/dashboard-overview/overview',
      'GET /api/dashboard-quick-stats/quick-stats',
      'GET /api/dashboard-live-metrics/live-metrics'
    ]
  });
});

// Route de test pour vérifier le chargement des notifications
app.get('/api/test/notifications-status', (req, res) => {
  res.json({
    success: true,
    message: 'Status des routes notifications',
    routes_loaded: {
      notifications: !!notificationsRoutes,
      expenses_unified: !!expensesRoutes,
      finance_unified: !!financeRoutes,
      academic_progress: !!academicProgressRoutes,
      dashboard_overview: !!dashboardOverviewRoutes,
      dashboard_quick_stats: !!dashboardQuickStatsRoutes,
      dashboard_live_metrics: !!dashboardLiveMetricsRoutes,
      dashboard_charts: !!dashboardChartsRoutes,
      dashboard_reports: !!dashboardReportsRoutes
    },
    file_info: {
      notifications_path: path.join(__dirname, 'routes', 'notifications.js'),
      notifications_exists: fs.existsSync(path.join(__dirname, 'routes', 'notifications.js')),
      academic_progress_path: path.join(__dirname, 'routes', 'academic-progress.js'),
      academic_progress_exists: fs.existsSync(path.join(__dirname, 'routes', 'academic-progress.js')),
      files_in_routes_dir: fs.readdirSync(path.join(__dirname, 'routes'))
    },
    endpoints_available: [
      'GET /api/notifications/test/cors - Test CORS',
      'GET /api/notifications/test/connection - Test connection',
      'GET /api/notifications/test/api - Test API avec auth',
      'GET /api/notifications/count - Compteur notifications',
      'GET /api/notifications - Liste avec filtres avancés',
      'POST /api/notifications - Créer notification',
      'PATCH /api/notifications/:id/read - Marquer comme lu',
      'PATCH /api/notifications/mark-all-read - Marquer toutes comme lues',
      'DELETE /api/notifications/:id - Supprimer notification',
      'DELETE /api/notifications/bulk/delete - Suppression multiple',
      'GET /api/notifications/calendar - Calendrier des notifications',
      'GET /api/notifications/alerts - Alertes par date et priorité',
      'GET /api/notifications/dashboard - Dashboard complet',
      'GET /api/notifications/stats - Statistiques avancées',
      'GET /api/notifications/types - Types disponibles',
      'GET /api/notifications/priorities - Priorités disponibles',
      'GET /api/notifications/categories - Catégories disponibles',
      'GET /api/notifications/users - Liste utilisateurs pour formulaire',
      'POST /api/notifications/cleanup - Nettoyage (Super Admin)',
      'GET /api/academic-progress/test - Test module évolution académique',
      'GET /api/academic-progress/data/* - Données pour formulaires',
      'GET /api/academic-progress/students/* - Historique et progression',
      'GET /api/academic-progress/stats/* - Statistiques académiques',
      'GET /api/dashboard-overview/overview - Vue d\'ensemble dashboard',
      'GET /api/dashboard-quick-stats/quick-stats - Statistiques rapides',
      'GET /api/dashboard-live-metrics/live-metrics - Métriques temps réel'
    ],
    timestamp: new Date().toISOString()
  });
});

// Route de test spécifique pour Academic Progress
app.get('/api/test/academic-progress-status', (req, res) => {
  res.json({
    success: true,
    message: 'Status du module Évolution Académique',
    module_loaded: !!academicProgressRoutes,
    file_info: {
      path: path.join(__dirname, 'routes', 'academic-progress.js'),
      exists: fs.existsSync(path.join(__dirname, 'routes', 'academic-progress.js')),
      table_required: 'student_academic_progress'
    },
    features: [
      'Gestion complète des évaluations académiques',
      'Suivi progression coranique (sourates, jouzou, hizb)',
      'Évolution des notes par matière',
      'Historique complet des étudiants',
      'Statistiques par classe et générales',
      'Recommandations personnalisées',
      'Analyse des tendances temporelles',
      'Classements et comparaisons'
    ],
    endpoints: [
      'GET /api/academic-progress/test - Test de fonctionnement',
      'GET /api/academic-progress/data/students-select - Étudiants pour formulaires',
      'GET /api/academic-progress/data/classes-select - Classes pour formulaires',
      'GET /api/academic-progress/data/school-years-select - Années scolaires',
      'POST /api/academic-progress - Créer une évaluation',
      'GET /api/academic-progress/:id - Détails d\'une évaluation',
      'PUT /api/academic-progress/:id - Modifier une évaluation',
      'DELETE /api/academic-progress/:id - Supprimer une évaluation',
      'GET /api/academic-progress/students/:studentId - Historique complet',
      'GET /api/academic-progress/students/:studentId/latest - Dernière évaluation',
      'GET /api/academic-progress/students/:studentId/progression - Progression détaillée',
      'GET /api/academic-progress/stats/overview - Statistiques générales',
      'GET /api/academic-progress/stats/class/:classId - Statistiques par classe'
    ],
    data_structure: {
      evaluation_fields: [
        'current_sourate (Sourate actuelle)',
        'sourate_number (1-114)',
        'current_jouzou (1-30)',
        'current_hizb (1-60)',
        'pages_memorized (Pages mémorisées)',
        'verses_memorized (Versets mémorisés)',
        'memorization_grade (Note mémorisation /20)',
        'recitation_grade (Note récitation /20)',
        'tajwid_grade (Note tajwid /20)',
        'behavior_grade (Note comportement /20)',
        'overall_grade (Note globale calculée)',
        'attendance_rate (Taux de présence)',
        'teacher_comment (Commentaire enseignant)',
        'difficulties (Difficultés)',
        'strengths (Forces)',
        'next_month_objective (Objectif mois suivant)'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Route de santé complète
app.get('/api/health', async (req, res) => {
  try {
    const { query } = require('./config/database');
    
    const dbResult = await query('SELECT NOW() as server_time, version() as db_version');
    
    const authStats = getAuthStats();

    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    };

    // Vérifier les nouvelles tables incluant student_academic_progress
    const tablesCheck = await query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'classes') as classes_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'school_years') as school_years_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'students') as students_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'staff') as staff_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'expenses') as expenses_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'expense_categories') as expense_categories_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'expense_statuses') as expense_statuses_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'expense_responsibles') as expense_responsibles_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'student_payments') as student_payments_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'salary_payments_v2') as salary_payments_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'notifications') as notifications_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'student_academic_progress') as academic_progress_table
    `);

    const tables = tablesCheck.rows[0];

    res.json({
      success: true,
      message: 'API et base de données opérationnelles - École Moderne Complète avec Dashboard Intégré',
      version: '2.8.0',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        server_time: dbResult.rows[0].server_time,
        version: dbResult.rows[0].db_version,
        tables: {
          classes: parseInt(tables.classes_table) > 0,
          school_years: parseInt(tables.school_years_table) > 0,
          students: parseInt(tables.students_table) > 0,
          staff: parseInt(tables.staff_table) > 0,
          expenses: parseInt(tables.expenses_table) > 0,
          expense_categories: parseInt(tables.expense_categories_table) > 0,
          expense_statuses: parseInt(tables.expense_statuses_table) > 0,
          expense_responsibles: parseInt(tables.expense_responsibles_table) > 0,
          student_payments: parseInt(tables.student_payments_table) > 0,
          salary_payments: parseInt(tables.salary_payments_table) > 0,
          notifications: parseInt(tables.notifications_table) > 0,
          student_academic_progress: parseInt(tables.academic_progress_table) > 0
        }
      },
      authentication: {
        system: 'operational',
        cache_size: authStats.cacheSize || 0,
        jwt_configured: authStats.jwtSecretConfigured || false,
        refresh_configured: authStats.refreshSecretConfigured || false
      },
      system: systemInfo,
      performance: {
        uptime_formatted: `${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m`,
        memory_used_mb: Math.round(systemInfo.memory.used / 1024 / 1024),
        memory_total_mb: Math.round(systemInfo.memory.rss / 1024 / 1024)
      },
      features: {
        classes_management: parseInt(tables.classes_table) > 0,
        school_years_management: parseInt(tables.school_years_table) > 0,
        teacher_assignment: true,
        monthly_fees: true,
        double_curriculum: true,
        expenses_management_unified: parseInt(tables.expenses_table) > 0,
        expenses_categories: parseInt(tables.expense_categories_table) > 0,
        expenses_tracking: parseInt(tables.expense_statuses_table) > 0,
        unified_finance_system: !!financeRoutes,
        student_payments_system: parseInt(tables.student_payments_table) > 0,
        salary_payments_system: parseInt(tables.salary_payments_table) > 0,
        notifications_system: !!notificationsRoutes && parseInt(tables.notifications_table) > 0,
        academic_progress_system: !!academicProgressRoutes && parseInt(tables.academic_progress_table) > 0,
        dashboard_overview_system: !!dashboardOverviewRoutes,
        dashboard_quick_stats_system: !!dashboardQuickStatsRoutes,
        dashboard_live_metrics_system: !!dashboardLiveMetricsRoutes,
        dashboard_charts_system: !!dashboardChartsRoutes,
        dashboard_reports_system: !!dashboardReportsRoutes
      }
    });
  } catch (error) {
    console.error('Erreur de santé:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur de connexion à la base de données',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route de monitoring
app.get('/api/monitoring', async (req, res) => {
  try {
    const { query } = require('./config/database');
    
    const authStats = getAuthStats();
    
    // Statistiques des nouvelles fonctionnalités incluant academic progress
    const newFeaturesStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM classes WHERE is_active = true) as active_classes,
        (SELECT COUNT(*) FROM school_years WHERE is_current = true) as current_school_years,
        (SELECT COUNT(*) FROM staff WHERE position IN ('teacher', 'enseignant', 'professeur') AND status = 'active') as active_teachers,
        (SELECT COUNT(*) FROM students WHERE deleted = false OR deleted IS NULL) as active_students,
        (SELECT COUNT(*) FROM expenses) as total_expenses,
        (SELECT COUNT(*) FROM expense_categories WHERE COALESCE(is_active, true) = true) as active_categories,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expenses_amount,
        (SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE is_cancelled = false) as total_student_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM salary_payments_v2 WHERE status = 'completed') as total_salary_payments,
        (SELECT COUNT(*) FROM student_academic_progress) as total_academic_evaluations,
        (SELECT COUNT(DISTINCT student_id) FROM student_academic_progress) as students_with_evaluations,
        (SELECT ROUND(AVG(overall_grade), 2) FROM student_academic_progress WHERE overall_grade IS NOT NULL) as average_grade
    `);
    
    const newStats = newFeaturesStats.rows[0];
    
    const metrics = {
      auth_cache_size: authStats.cacheSize || 0,
      auth_cache_max: authStats.maxCacheSize || 1000,
      system_uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      
      // Nouvelles métriques incluant academic progress
      active_classes: parseInt(newStats.active_classes || 0),
      current_school_years: parseInt(newStats.current_school_years || 0),
      active_teachers: parseInt(newStats.active_teachers || 0),
      active_students: parseInt(newStats.active_students || 0),
      total_expenses: parseInt(newStats.total_expenses || 0),
      active_categories: parseInt(newStats.active_categories || 0),
      total_expenses_amount: parseFloat(newStats.total_expenses_amount || 0),
      total_student_payments: parseFloat(newStats.total_student_payments || 0),
      total_salary_payments: parseFloat(newStats.total_salary_payments || 0),
      total_academic_evaluations: parseInt(newStats.total_academic_evaluations || 0),
      students_with_evaluations: parseInt(newStats.students_with_evaluations || 0),
      average_grade: parseFloat(newStats.average_grade || 0),
      
      // Calcul du capital unifié
      unified_capital: parseFloat(newStats.total_student_payments || 0) - 
                      parseFloat(newStats.total_expenses_amount || 0) - 
                      parseFloat(newStats.total_salary_payments || 0),
      
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      metrics,
      health: 'ok',
      features_status: {
        classes_system: metrics.active_classes >= 0,
        school_years_system: metrics.current_school_years >= 0,
        teachers_system: metrics.active_teachers >= 0,
        students_system: metrics.active_students >= 0,
        expenses_system_unified: metrics.total_expenses >= 0,
        categories_system: metrics.active_categories >= 0,
        unified_finance_system: !!financeRoutes,
        student_payments_system: metrics.total_student_payments >= 0,
        salary_payments_system: metrics.total_salary_payments >= 0,
        academic_progress_system: metrics.total_academic_evaluations >= 0,
        dashboard_overview_system: !!dashboardOverviewRoutes,
        dashboard_quick_stats_system: !!dashboardQuickStatsRoutes,
        dashboard_live_metrics_system: !!dashboardLiveMetricsRoutes,
        dashboard_charts_system: !!dashboardChartsRoutes,
        dashboard_reports_system: !!dashboardReportsRoutes
      },
      financial_summary: {
        total_income: metrics.total_student_payments,
        total_expenses: metrics.total_expenses_amount + metrics.total_salary_payments,
        net_capital: metrics.unified_capital,
        formatted_capital: `${metrics.unified_capital.toLocaleString('fr-FR')} FG`
      },
      academic_summary: {
        total_evaluations: metrics.total_academic_evaluations,
        students_evaluated: metrics.students_with_evaluations,
        average_grade: metrics.average_grade,
        evaluation_coverage: metrics.active_students > 0 ? 
          Math.round((metrics.students_with_evaluations / metrics.active_students) * 100) : 0
      },
      dashboard_summary: {
        modules_loaded: {
          overview: !!dashboardOverviewRoutes,
          quick_stats: !!dashboardQuickStatsRoutes,
          live_metrics: !!dashboardLiveMetricsRoutes,
          charts: !!dashboardChartsRoutes,
          reports: !!dashboardReportsRoutes
        },
        total_modules: 5,
        loaded_modules: [
          dashboardOverviewRoutes,
          dashboardQuickStatsRoutes,
          dashboardLiveMetricsRoutes,
          dashboardChartsRoutes,
          dashboardReportsRoutes
        ].filter(Boolean).length
      }
    });
  } catch (error) {
    console.error('Erreur monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur monitoring',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// === ROUTES RAPIDES POUR FORMULAIRES ===

// Classes actives pour sélection dans formulaires
app.get('/api/quick/classes', async (req, res) => {
  try {
    const { type } = req.query;
    const { query } = require('./config/database');
    
    let whereClause = 'WHERE is_active = true';
    let queryParams = [];
    
    if (type && ['coranic', 'french'].includes(type)) {
      whereClause += ' AND type = $1';
      queryParams.push(type);
    }
    
    const result = await query(`
      SELECT 
        id, 
        name, 
        level, 
        type,
        name || ' (' || level || ')' as display_name
      FROM classes 
      ${whereClause}
      ORDER BY type, level, name
    `, queryParams);
    
    res.json({
      success: true,
      classes: result.rows
    });
  } catch (error) {
    console.error('Erreur quick classes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur récupération classes'
    });
  }
});

// Années scolaires pour sélection dans formulaires
app.get('/api/quick/school-years', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(`
      SELECT 
        id, 
        name,
        start_date,
        end_date,
        is_current,
        name || CASE WHEN is_current THEN ' (Courante)' ELSE '' END as display_name
      FROM school_years 
      ORDER BY 
        CASE WHEN is_current THEN 0 ELSE 1 END,
        start_date DESC
    `);
    
    console.log('Années trouvées:', result.rows.length);
    
    res.json({
      success: true,
      school_years: result.rows
    });
  } catch (error) {
    console.error('Erreur années scolaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur récupération années scolaires'
    });
  }
});

// Enseignants pour sélection dans formulaires
app.get('/api/quick/teachers', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(`
      SELECT 
        id,
        staff_number,
        first_name,
        last_name,
        first_name || ' ' || last_name as full_name,
        first_name || ' ' || last_name || ' (' || staff_number || ')' as display_name
      FROM staff 
      WHERE position IN ('teacher', 'enseignant', 'professeur')
        AND status = 'active'
      ORDER BY first_name, last_name
    `);
    
    res.json({
      success: true,
      teachers: result.rows
    });
  } catch (error) {
    console.error('Erreur enseignants:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur récupération enseignants'
    });
  }
});

// === GESTION D'ERREURS ===
app.use((error, req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.error(`[${requestId}] Erreur non gérée:`, error);
  
  console.error(`[${requestId}] URL: ${req.method} ${req.originalUrl}`);
  console.error(`[${requestId}] IP: ${req.ip}`);
  console.error(`[${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Fichier trop volumineux (limite: 10MB)',
      code: 'PAYLOAD_TOO_LARGE',
      requestId
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: error.message,
      code: 'VALIDATION_ERROR',
      requestId
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN',
      requestId
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expiré',
      code: 'TOKEN_EXPIRED',
      canRefresh: true,
      requestId
    });
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
    ...(isDevelopment && { 
      details: error.message,
      stack: error.stack 
    })
  });
});

// Route 404 améliorée
app.use('*', (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.warn(`[${requestId}] Route non trouvée: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} non trouvée`,
    code: 'NOT_FOUND',
    requestId,
    available_endpoints: {
      auth: '/api/auth/*',
      admin: '/api/admin/*',
      staff: '/api/staff/*',
      students: '/api/students/*',
      classes: '/api/classes/*',
      school_years: '/api/school-years/*',
      payments: '/api/payments/*',
      expenses_unified: '/api/expenses/* (SYSTÈME UNIFIÉ !)',
      unified_finance: '/api/unified-finance/* (SYSTÈME FINANCIER UNIFIÉ !)',
      notifications: '/api/notifications/* (SYSTÈME NOTIFICATIONS !)',
      academic_progress: '/api/academic-progress/* (ÉVOLUTION ACADÉMIQUE !)',
      dashboard_overview: '/api/dashboard-overview/* (DASHBOARD OVERVIEW !)',
      dashboard_quick_stats: '/api/dashboard-quick-stats/* (STATS RAPIDES !)',
      dashboard_live_metrics: '/api/dashboard-live-metrics/* (MÉTRIQUES TEMPS RÉEL !)',
      dashboard_charts: '/api/dashboard-charts/* (GRAPHIQUES !)',
      dashboard_reports: '/api/dashboard-reports/* (RAPPORTS !)',
      quick_access: {
        classes: '/api/quick/classes',
        school_years: '/api/quick/school-years',
        teachers: '/api/quick/teachers'
      },
      health: '/api/health',
      info: '/api'
    },
    dashboard_endpoints: [
      'GET /api/dashboard-overview/overview - Vue d\'ensemble complète du dashboard',
      'GET /api/dashboard-quick-stats/quick-stats - Statistiques rapides',
      'GET /api/dashboard-live-metrics/live-metrics - Métriques temps réel',
      'GET /api/dashboard-charts/* - Graphiques et visualisations',
      'GET /api/dashboard-reports/* - Rapports et exports'
    ],
    financial_endpoints: [
      'GET /api/expenses - Liste des dépenses',
      'POST /api/expenses - Créer une dépense',
      'GET /api/expenses/:id - Voir une dépense',
      'PUT /api/expenses/:id - Modifier une dépense',
      'DELETE /api/expenses/:id - Supprimer une dépense',
      'PATCH /api/expenses/:id/status - Changer le statut',
      'GET /api/expenses/config/* - Configuration',
      'GET /api/expenses/dashboard/* - Dashboard et stats',
      'GET /api/unified-finance/dashboard - Dashboard financier unifié',
      'GET /api/unified-finance/capital/current - Capital actuel',
      'GET /api/unified-finance/transactions/live - Transactions temps réel',
      'GET /api/unified-finance/cash-flow - Rapport cash flow',
      'GET /api/unified-finance/budget-analysis - Analyse budgétaire'
    ],
    academic_endpoints: [
      'GET /api/academic-progress/test - Test module',
      'GET /api/academic-progress/data/students-select - Étudiants pour formulaires',
      'GET /api/academic-progress/data/classes-select - Classes pour formulaires',
      'GET /api/academic-progress/data/school-years-select - Années scolaires',
      'POST /api/academic-progress - Créer une évaluation',
      'GET /api/academic-progress/:id - Détails évaluation',
      'PUT /api/academic-progress/:id - Modifier évaluation',
      'DELETE /api/academic-progress/:id - Supprimer évaluation',
      'GET /api/academic-progress/students/:studentId - Historique étudiant',
      'GET /api/academic-progress/students/:studentId/latest - Dernière évaluation',
      'GET /api/academic-progress/students/:studentId/progression - Progression détaillée',
      'GET /api/academic-progress/stats/overview - Statistiques générales',
      'GET /api/academic-progress/stats/class/:classId - Statistiques par classe'
    ],
    debugging: {
      test_expenses: '/api/test/expenses-status',
      test_finance: '/api/test/finance-routes',
      test_notifications: '/api/test/notifications-status',
      test_academic_progress: '/api/test/academic-progress-status',
      test_dashboard: '/api/test/dashboard-status',
      test_uploads: '/api/test/uploads'
    }
  });
});

// === DÉMARRAGE DU SERVEUR ===
async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur École Moderne Complète avec Dashboard Intégré...');
    
    // Test de connexion à la base de données
    console.log('🔍 Test de connexion à la base de données...');
    await testConnection();
    console.log('✅ Base de données connectée');
    
    // Initialisation de la base de données
    console.log('🔍 Vérification de l\'état de la base de données...');
    const dbReady = await initializeDatabase();
    
    if (!dbReady) {
      console.error('💥 Base de données non prête - Vérifiez les tables requises');
      console.error('💡 Exécutez: psql -d ecole_moderne -f server/sql/progress.sql');
      process.exit(1);
    }
    
    console.log('✅ Base de données initialisée et prête');
    
    // Vérification et création des dossiers uploads
    console.log('🔍 Configuration des dossiers uploads...');
    const uploadsReady = ensureUploadDirectories();
    
    if (!uploadsReady) {
      console.warn('⚠️ Dossiers uploads non configurés - Les uploads peuvent ne pas fonctionner');
    } else {
      console.log('✅ Dossiers uploads prêts');
    }
    
    // Vérification des variables d'environnement
    const requiredEnvVars = ['JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Variables d\'environnement manquantes:', missingVars.join(', '));
      console.warn('⚠️ Le serveur démarrera mais certaines fonctionnalités peuvent être limitées');
    }
    
    // Vérification des fonctionnalités
    const optionalFeatures = {
      refreshTokens: !!process.env.JWT_REFRESH_SECRET,
      activityTracking: process.env.TRACK_USER_ACTIVITY === 'true',
      tokenStorage: process.env.STORE_REFRESH_TOKENS === 'true',
      classesManagement: true,
      schoolYearsManagement: true,
      teacherAssignment: true,
      monthlyFees: true,
      expensesManagementUnified: !!expensesRoutes,
      unifiedFinanceSystem: !!financeRoutes,
      notificationsSystem: !!notificationsRoutes,
      academicProgressSystem: !!academicProgressRoutes,
      dashboardOverviewSystem: !!dashboardOverviewRoutes,
      dashboardQuickStatsSystem: !!dashboardQuickStatsRoutes,
      dashboardLiveMetricsSystem: !!dashboardLiveMetricsRoutes,
      dashboardChartsSystem: !!dashboardChartsRoutes,
      dashboardReportsSystem: !!dashboardReportsRoutes
    };
    
    console.log('🔧 Fonctionnalités activées:', JSON.stringify(optionalFeatures, null, 2));
    
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      console.log('='.repeat(80));
      console.log('🚀 SERVEUR MARKAZ UBAYD IBN KAB - ÉCOLE MODERNE COMPLÈTE AVEC DASHBOARD');
      console.log('='.repeat(80));
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Base de données: ${process.env.DB_NAME || 'ecole_moderne'}`);
      console.log(`🔐 JWT configuré: ${!!process.env.JWT_SECRET}`);
      console.log(`🔄 Refresh tokens: ${optionalFeatures.refreshTokens}`);
      console.log(`💾 Stockage refresh tokens: ${optionalFeatures.tokenStorage}`);
      console.log(`🎓 Gestion classes: ${optionalFeatures.classesManagement}`);
      console.log(`📅 Gestion années scolaires: ${optionalFeatures.schoolYearsManagement}`);
      console.log(`👨‍🏫 Attribution enseignants: ${optionalFeatures.teacherAssignment}`);
      console.log(`💰 Paiements mensuels: ${optionalFeatures.monthlyFees}`);
      console.log(`💸 Gestion dépenses UNIFIÉE: ${optionalFeatures.expensesManagementUnified}`);
      console.log(`🏦 Système financier UNIFIÉ: ${optionalFeatures.unifiedFinanceSystem}`);
      console.log(`🔔 Système notifications: ${optionalFeatures.notificationsSystem}`);
      console.log(`📚 Évolution académique: ${optionalFeatures.academicProgressSystem}`);
      console.log(`📊 Dashboard Overview: ${optionalFeatures.dashboardOverviewSystem}`);
      console.log(`📈 Dashboard Quick Stats: ${optionalFeatures.dashboardQuickStatsSystem}`);
      console.log(`⚡ Dashboard Live Metrics: ${optionalFeatures.dashboardLiveMetricsSystem}`);
      console.log(`📊 Dashboard Charts: ${optionalFeatures.dashboardChartsSystem}`);
      console.log(`📋 Dashboard Reports: ${optionalFeatures.dashboardReportsSystem}`);
      console.log(`📸 Dossier uploads: ${uploadsReady ? '✅' : '❌'}`);
      console.log(`📂 Chemin uploads: ${path.join(__dirname, 'uploads')}`);
      console.log(`📱 Optimisé mobile: ✅`);
      console.log(`🛡️ Sécurité renforcée: ✅`);
      console.log(`⏰ Démarré le: ${new Date().toLocaleString('fr-FR')}`);
      console.log('='.repeat(80));
      console.log('🔗 Frontend autorisé:');
      console.log('  - http://localhost:8080');
      console.log('  - http://localhost:5173 (Vite)');
      console.log('  - http://localhost:3000 (React)');
      console.log('  - http://localhost:4173 (Vite preview)');
      if (process.env.FRONTEND_URL) {
        console.log(`  - ${process.env.FRONTEND_URL} (custom)`);
      }
      console.log('='.repeat(80));
      console.log('🔍 Routes disponibles:');
      console.log('  🏠 GET  /api - Informations API ✅');
      console.log('  🔐 /api/auth/* - Authentification avec sessions robustes ✅');
      console.log('  👑 /api/admin/* - Administration ✅');
      console.log('  👥 /api/staff/* - Personnel ✅');
      console.log('  🎓 /api/students/* - Étudiants ✅');
      console.log('  🏫 /api/classes/* - Classes ✅');
      console.log('  📅 /api/school-years/* - Années scolaires ✅');
      console.log('  💳 /api/payments/* - Paiements étudiants ✅');
      console.log('  💸 /api/salary-payments/* - Paiements salaires ✅');
      console.log('  🧾 /api/expenses/* - SYSTÈME UNIFIÉ GESTION DÉPENSES ✅');
      console.log('  🏦 /api/unified-finance/* - SYSTÈME FINANCIER UNIFIÉ ✅');
      console.log('  🔔 /api/notifications/* - SYSTÈME NOTIFICATIONS COMPLET ✅');
      console.log('  📚 /api/academic-progress/* - ÉVOLUTION ACADÉMIQUE ÉTUDIANTS ✅');
      console.log('  📊 /api/dashboard-overview/* - DASHBOARD OVERVIEW ✅');
      console.log('      └── /overview - Vue d\'ensemble complète');
      console.log('  📈 /api/dashboard-quick-stats/* - DASHBOARD STATS RAPIDES ✅');
      console.log('      └── /quick-stats - Statistiques rapides');
      console.log('  ⚡ /api/dashboard-live-metrics/* - DASHBOARD MÉTRIQUES TEMPS RÉEL ✅');
      console.log('      └── /live-metrics - Métriques temps réel');
      console.log('  📊 /api/dashboard-charts/* - DASHBOARD GRAPHIQUES ✅');
      console.log('  📋 /api/dashboard-reports/* - DASHBOARD RAPPORTS ✅');
      console.log('  ⚡ /api/quick/* - Accès rapide formulaires ✅');
      console.log('  ❤️  GET  /api/health - Santé complète du serveur ✅');
      console.log('  📊 GET  /api/monitoring - Métriques système ✅');
      console.log('  📸 GET  /api/test/* - Tests configuration ✅');
      console.log('='.repeat(80));
      console.log('🎯 Fonctionnalités principales:');
      console.log('  • Gestion complète des classes (Coranique & Française)');
      console.log('  • Gestion des années scolaires avec année courante');
      console.log('  • Attribution des enseignants aux classes');
      console.log('  • Gestion des paiements mensuels par classe');
      console.log('  • Double scolarité pour les étudiants');
      console.log('  • Statistiques avancées par classe et année');
      console.log('  • API rapide pour formulaires frontend');
      console.log('  • 💸 SYSTÈME UNIFIÉ DE GESTION DES DÉPENSES');
      console.log('    - ✅ CRUD complet des dépenses');
      console.log('    - ✅ Dashboard avec statistiques temps réel');
      console.log('    - ✅ Configuration des catégories et responsables');
      console.log('    - ✅ Validation et approbation des dépenses');
      console.log('  • 🏦 SYSTÈME FINANCIER UNIFIÉ');
      console.log('    - ✅ Dashboard financier unifié en temps réel');
      console.log('    - ✅ Gestion centralisée du cash flow');
      console.log('    - ✅ Analyse budgétaire avancée');
      console.log('    - ✅ Transactions en temps réel');
      console.log('    - ✅ Rapports et insights automatiques');
      console.log('    - ✅ Export multi-format');
      console.log('    - ✅ Alertes intelligentes');
      console.log('    - ✅ Accès Super Admin uniquement');
      console.log('  • 📚 SYSTÈME D\'ÉVOLUTION ACADÉMIQUE');
      console.log('    - ✅ Suivi progression coranique (sourates, jouzou, hizb)');
      console.log('    - ✅ Évaluations par matière (mémorisation, récitation, tajwid, comportement)');
      console.log('    - ✅ Historique complet des étudiants avec progression');
      console.log('    - ✅ Statistiques par classe et générales');
      console.log('    - ✅ Analyse des tendances et recommandations');
      console.log('    - ✅ Dashboard académique temps réel');
      console.log('    - ✅ Comparaisons et classements');
      console.log('    - ✅ Données pour formulaires frontend');
      console.log('  • 📊 DASHBOARD MODULAIRE INTÉGRÉ (NOUVEAU !)');
      console.log('    - ✅ Vue d\'ensemble complète du système');
      console.log('    - ✅ Statistiques rapides pour widgets');
      console.log('    - ✅ Métriques temps réel avec cache intelligent');
      console.log('    - ✅ Graphiques et visualisations avancées');
      console.log('    - ✅ Rapports et exports PDF-ready');
      console.log('    - ✅ Cache multi-niveaux optimisé');
      console.log('    - ✅ Authentification et permissions granulaires');
      console.log('    - ✅ Intégration avec tous les modules backend');
      console.log('='.repeat(80));
      console.log('🚀 Serveur prêt à recevoir les requêtes !');
      console.log('💸 Module expenses UNIFIÉ et CORRIGÉ - Prêt !');
      console.log('🏦 Module finance UNIFIÉ et OPÉRATIONNEL - Prêt !');
      console.log('🔔 Module notifications COMPLET et INTÉGRÉ - Prêt !');
      console.log('📚 Module évolution académique COMPLET et INTÉGRÉ - Prêt !');
      console.log('📊 Module dashboard MODULAIRE et INTÉGRÉ - Prêt !');
      console.log('🔧 Support technique disponible si nécessaire');
    });

    server.timeout = 30000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    return server;

  } catch (error) {
    console.error('💥 Erreur lors du démarrage du serveur:', error);
    console.error('🔍 Vérifiez:');
    console.error('  - La connexion à la base de données');
    console.error('  - Les variables d\'environnement (.env)');
    console.error('  - Les permissions des ports');
    console.error('  - Que les tables requises existent');
    console.error('  - Les nouvelles tables expenses, finance et student_academic_progress');
    console.error('  - Que les fichiers de routes existent dans ./routes/');
    console.error('  - Les fichiers dashboard-*.js dans ./routes/');
    console.error('  - Exécutez le script SQL: server/sql/progress.sql');
    process.exit(1);
  }
}

// === FERMETURE PROPRE ===
let server;
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('⚠️ Arrêt déjà en cours...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n📡 Signal ${signal} reçu - Arrêt du serveur en cours...`);
  
  const shutdownTimeout = setTimeout(() => {
    console.error('⌛ Timeout atteint - Arrêt forcé');
    process.exit(1);
  }, 10000);
  
  try {
    if (server) {
      console.log('🔒 Arrêt des nouvelles connexions...');
      server.close(() => {
        console.log('✅ Serveur HTTP fermé');
      });
    }
    
    try {
      clearUserCache();
      console.log('✅ Cache d\'authentification nettoyé');
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage cache auth:', error.message);
    }
    
    console.log('🗄️ Fermeture des connexions base de données...');
    await closePool();
    console.log('✅ Connexions à la base de données fermées');
    
    const uptime = process.uptime();
    console.log('📊 Statistiques de session:');
    console.log(`  ⏱️ Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`);
    console.log(`  💾 Mémoire max: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
    
    clearTimeout(shutdownTimeout);
    console.log('👋 Serveur École Moderne avec Dashboard arrêté proprement');
    process.exit(0);
    
  } catch (error) {
    console.error('⌛ Erreur lors de l\'arrêt:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Gestionnaires de signaux
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  console.error('💥 Exception non capturée:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  console.error('🔍 Promise:', promise);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Monitoring de la mémoire
if (process.env.MEMORY_MONITORING === 'true') {
  setInterval(() => {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.used / 1024 / 1024);
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    
    if (totalMB > 500) {
      console.warn(`⚠️ Utilisation mémoire élevée: ${totalMB}MB (utilisé: ${usedMB}MB)`);
    }
  }, 60000);
}

// Démarrer le serveur
startServer().then((serverInstance) => {
  server = serverInstance;
  console.log('🌟 Serveur École Moderne démarré avec succès !');
  console.log('🚀 Toutes les fonctionnalités sont disponibles');
  console.log('💸 Module expenses UNIFIÉ opérationnel et CORRIGÉ !');
  console.log('🏦 Module finance UNIFIÉ opérationnel et INTÉGRÉ !');
  console.log('🔔 Module notifications COMPLET opérationnel et INTÉGRÉ !');
  console.log('📚 Module évolution académique COMPLET opérationnel et INTÉGRÉ !');
  console.log('📊 Module dashboard MODULAIRE COMPLET opérationnel et INTÉGRÉ !');
  console.log('    - Dashboard Overview: Vue d\'ensemble complète ✅');
  console.log('    - Dashboard Quick Stats: Statistiques rapides ✅');
  console.log('    - Dashboard Live Metrics: Métriques temps réel ✅');
  console.log('    - Dashboard Charts: Graphiques et visualisations ✅');
  console.log('    - Dashboard Reports: Rapports et exports ✅');
  console.log('🔧 Support technique disponible si nécessaire');
}).catch((error) => {
  console.error('💥 Échec du démarrage:', error);
  process.exit(1);
});

// === FONCTIONS UTILITAIRES D'EXPORT ===
module.exports = {
  app,
  startServer,
  gracefulShutdown,
  getAuthStats,
  clearUserCache
};