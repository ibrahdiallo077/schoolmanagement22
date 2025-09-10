// middleware/auth.js - VERSION CORRIGÉE STRICTE POUR VRAIE AUTHENTIFICATION

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

console.log('🔑 Middleware auth.js chargé - VERSION STRICTE CORRIGÉE');

// === CONFIGURATION STRICTE ===

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'default_secret') {
    console.warn('⚠️ JWT_SECRET non configuré - Utilisation clé développement');
  }
  return secret || 'dev-secret-key-change-in-production-very-long-and-secure-key';
};

const getRefreshSecret = () => {
  return process.env.JWT_REFRESH_SECRET || getJWTSecret() + '_refresh';
};

// Cache utilisateur avec TTL strict
const userCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes seulement
const MAX_CACHE_SIZE = 100;

const cleanupCache = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
      cleaned++;
    }
  }
  
  if (userCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(userCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, userCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => userCache.delete(key));
    cleaned += toRemove.length;
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cache nettoyé: ${cleaned} entrées supprimées`);
  }
};

setInterval(cleanupCache, 30000); // Nettoyage toutes les 30 secondes

// === MIDDLEWARE PRINCIPAL STRICT ===

const authenticateToken = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    // Extraire le token avec toutes les méthodes possibles
    const authHeader = req.headers.authorization;
    const xAuthToken = req.headers['x-auth-token'] || req.headers['X-Auth-Token'];
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (xAuthToken) {
      token = xAuthToken;
    } else if (authHeader && !authHeader.startsWith('Bearer ')) {
      token = authHeader;
    }

    console.log(`🔑 [${requestId}] Auth request - Token: ${token ? 'Présent' : 'Absent'}, Path: ${req.path}`);

    // === TOKEN OBLIGATOIRE - PLUS DE FALLBACK ===
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      console.log(`❌ [${requestId}] Token manquant ou invalide`);
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis',
        code: 'NO_TOKEN',
        requestId
      });
    }

    // === VÉRIFICATION JWT STRICTE ===
    let decoded;
    try {
      decoded = jwt.verify(token, getJWTSecret());
      console.log(`✅ [${requestId}] Token décodé pour userId: ${decoded.userId}, email: ${decoded.email}`);
      
      // Vérifier le type de token
      if (decoded.type && decoded.type !== 'access') {
        throw new jwt.JsonWebTokenError('Type de token invalide');
      }
      
    } catch (jwtError) {
      console.log(`❌ [${requestId}] Erreur JWT: ${jwtError.name} - ${jwtError.message}`);
      
      let errorCode = 'INVALID_TOKEN';
      let errorMessage = 'Token invalide - Veuillez vous reconnecter';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorCode = 'EXPIRED_TOKEN';
        errorMessage = 'Session expirée - Veuillez vous reconnecter';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorCode = 'MALFORMED_TOKEN';
        errorMessage = 'Token malformé - Veuillez vous reconnecter';
      }
      
      return res.status(401).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        requestId
      });
    }

    const userId = decoded.userId;
    
    if (!userId) {
      console.log(`❌ [${requestId}] UserId manquant dans le token`);
      return res.status(401).json({
        success: false,
        error: 'Token invalide - UserId manquant',
        code: 'INVALID_USER_ID',
        requestId
      });
    }

    const cacheKey = `user_${userId}`;
    
    // Vérifier le cache mais avec validation stricte
    const cached = userCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      // Vérifier que l'utilisateur cached correspond au token
      if (cached.user.email === decoded.email) {
        req.user = cached.user;
        req.auth = {
          token: decoded,
          connectionQuality: 'stable',
          authenticatedAt: new Date(cached.timestamp),
          fromCache: true,
          requestId
        };
        
        console.log(`🔑 [${requestId}] Auth réussie (cache) pour ${cached.user.email} (${Date.now() - startTime}ms)`);
        return next();
      } else {
        // Cache corrompu, le supprimer
        userCache.delete(cacheKey);
        console.log(`🧹 [${requestId}] Cache corrompu supprimé pour userId ${userId}`);
      }
    }

    // === REQUÊTE BASE DE DONNÉES OBLIGATOIRE ===
    let userResult;
    try {
      userResult = await query(
        `SELECT id, username, email, first_name, last_name, role, is_active, 
                last_login, avatar_url, created_at, updated_at
         FROM admin_users 
         WHERE id = $1`,
        [userId]
      );
      
      console.log(`🔍 [${requestId}] DB query pour userId ${userId}: ${userResult.rows.length} résultat(s)`);
      
    } catch (dbError) {
      console.error(`💥 [${requestId}] Erreur DB critique:`, dbError.message);
      return res.status(500).json({
        success: false,
        error: 'Erreur de connexion à la base de données',
        code: 'DB_CONNECTION_ERROR',
        requestId
      });
    }

    // === UTILISATEUR DOIT EXISTER ===
    if (userResult.rows.length === 0) {
      console.log(`❌ [${requestId}] Utilisateur non trouvé pour ID: ${userId}`);
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé - Veuillez vous reconnecter',
        code: 'USER_NOT_FOUND',
        requestId
      });
    }

    const user = userResult.rows[0];
    
    // === VÉRIFICATIONS STRICTES ===
    
    // Vérifier que le compte est actif
    if (!user.is_active) {
      console.log(`❌ [${requestId}] Compte inactif pour: ${user.email}`);
      return res.status(401).json({
        success: false,
        error: 'Compte utilisateur désactivé',
        code: 'USER_INACTIVE',
        requestId
      });
    }
    
    // Vérifier que l'email correspond au token
    if (user.email !== decoded.email) {
      console.log(`❌ [${requestId}] Email token ne correspond pas: ${decoded.email} vs ${user.email}`);
      return res.status(401).json({
        success: false,
        error: 'Token invalide - Utilisateur incorrect',
        code: 'USER_MISMATCH',
        requestId
      });
    }
    
    // Vérifier que le rôle est valide
    if (!['admin', 'super_admin', 'teacher'].includes(user.role)) {
      console.log(`❌ [${requestId}] Rôle invalide: ${user.role} pour ${user.email}`);
      return res.status(403).json({
        success: false,
        error: 'Rôle utilisateur invalide',
        code: 'INVALID_ROLE',
        requestId
      });
    }

    // === SUCCÈS - METTRE EN CACHE ===
    userCache.set(cacheKey, {
      user: user,
      timestamp: Date.now(),
      tokenEmail: decoded.email
    });

    req.user = user;
    req.auth = {
      token: decoded,
      connectionQuality: 'stable',
      authenticatedAt: new Date(),
      fromCache: false,
      requestId
    };

    // Mise à jour activité en arrière-plan (non bloquante)
    setImmediate(async () => {
      try {
        await query(
          'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [userId]
        );
      } catch (err) {
        console.warn(`⚠️ [${requestId}] Erreur mise à jour activité (non critique):`, err.message);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Auth réussie pour ${user.email} (${user.role}, ${duration}ms)`);
    
    next();

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${requestId}] Erreur auth globale (${duration}ms):`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification',
      code: 'AUTH_ERROR',
      requestId
    });
  }
};

// === MIDDLEWARES DE RÔLES STRICTS ===

const requireSuperAdmin = (req, res, next) => {
  const requestId = req.auth?.requestId || 'no-req-id';
  
  console.log(`👑 [${requestId}] Vérification Super Admin pour: ${req.user?.email} (${req.user?.role})`);
  
  if (!req.user) {
    console.log(`❌ [${requestId}] Pas d'utilisateur authentifié`);
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  if (req.user.role !== 'super_admin') {
    console.log(`❌ [${requestId}] Accès Super Admin refusé pour: ${req.user.email} (${req.user.role})`);
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux Super Administrateurs',
      code: 'INSUFFICIENT_PRIVILEGES',
      user_role: req.user.role,
      required_role: 'super_admin'
    });
  }
  
  console.log(`✅ [${requestId}] Accès Super Admin accordé à: ${req.user.email}`);
  next();
};

const requireAdmin = (req, res, next) => {
  const requestId = req.auth?.requestId || 'no-req-id';
  
  console.log(`🛡️ [${requestId}] Vérification Admin pour: ${req.user?.email} (${req.user?.role})`);
  
  if (!req.user) {
    console.log(`❌ [${requestId}] Pas d'utilisateur authentifié`);
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    console.log(`❌ [${requestId}] Accès Admin refusé pour: ${req.user.email} (${req.user.role})`);
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux Administrateurs',
      code: 'INSUFFICIENT_PRIVILEGES',
      user_role: req.user.role,
      required_roles: ['admin', 'super_admin']
    });
  }
  
  console.log(`✅ [${requestId}] Accès Admin accordé à: ${req.user.email}`);
  next();
};

const requireTeacher = (req, res, next) => {
  const requestId = req.auth?.requestId || 'no-req-id';
  
  console.log(`👨‍🏫 [${requestId}] Vérification Teacher pour: ${req.user?.email} (${req.user?.role})`);
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  if (!['teacher', 'admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux Enseignants et Administrateurs',
      code: 'INSUFFICIENT_PRIVILEGES',
      user_role: req.user.role,
      required_roles: ['teacher', 'admin', 'super_admin']
    });
  }
  
  console.log(`✅ [${requestId}] Accès Teacher accordé à: ${req.user.email}`);
  next();
};

// === FONCTIONS DE TOKEN STRICTES ===

const generateTokenPair = (user, rememberMe = false, connectionQuality = 'stable') => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Payload strict
    const basePayload = {
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role,
      iat: now
    };
    
    // Durées selon rememberMe
    const accessTokenDuration = rememberMe ? '24h' : '30m';
    const refreshTokenDuration = rememberMe ? '30d' : '7d';
    
    // Token d'accès
    const accessToken = jwt.sign(
      {
        ...basePayload,
        type: 'access'
      },
      getJWTSecret(),
      {
        expiresIn: accessTokenDuration,
        issuer: 'markaz-ubayd-ibn-kab',
        audience: 'markaz-app'
      }
    );
    
    // Token de rafraîchissement
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'refresh',
        iat: now
      },
      getRefreshSecret(),
      {
        expiresIn: refreshTokenDuration,
        issuer: 'markaz-ubayd-ibn-kab',
        audience: 'markaz-app'
      }
    );
    
    console.log(`🎫 Tokens générés pour ${user.email} (${accessTokenDuration})`);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenDuration,
      connectionQuality
    };
    
  } catch (error) {
    console.error('💥 Erreur génération tokens:', error.message);
    throw error;
  }
};

// Fonction de compatibilité
const generateToken = (user, rememberMe = false) => {
  const tokens = generateTokenPair(user, rememberMe, 'stable');
  return tokens.accessToken;
};

// === RAFRAÎCHISSEMENT STRICT ===

const refreshTokens = async (refreshToken) => {
  try {
    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, getRefreshSecret());
    
    if (decoded.type !== 'refresh') {
      throw new Error('Type de token invalide');
    }

    // Récupérer l'utilisateur réel
    const userResult = await query(
      `SELECT id, username, email, first_name, last_name, role, is_active
       FROM admin_users 
       WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Utilisateur non trouvé ou inactif');
    }

    const user = userResult.rows[0];
    
    // Vérifier cohérence email
    if (user.email !== decoded.email) {
      throw new Error('Email token ne correspond pas');
    }

    // Générer nouveaux tokens
    const tokens = generateTokenPair(user, true, 'stable');

    // Invalider le cache
    clearUserCache(user.id);

    console.log(`🔄 Tokens rafraîchis pour ${user.email}`);

    return {
      success: true,
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    };

  } catch (error) {
    console.error('💥 Erreur rafraîchissement token:', error.message);
    return {
      success: false,
      error: error.message || 'Erreur rafraîchissement'
    };
  }
};

// === UTILITAIRES ===

const clearUserCache = (userId = null) => {
  if (userId) {
    const deleted = userCache.delete(`user_${userId}`);
    if (deleted) {
      console.log(`🧹 Cache nettoyé pour l'utilisateur ${userId}`);
    }
  } else {
    const size = userCache.size;
    userCache.clear();
    console.log(`🧹 Cache utilisateur entièrement nettoyé (${size} entrées)`);
  }
};

const getAuthStats = () => {
  return {
    mode: 'strict_authentication',
    cacheSize: userCache.size,
    maxCacheSize: MAX_CACHE_SIZE,
    cacheTTL: CACHE_TTL,
    jwtSecretConfigured: !!process.env.JWT_SECRET,
    refreshSecretConfigured: !!process.env.JWT_REFRESH_SECRET,
    strictMode: true,
    fallbackDisabled: true
  };
};

const healthCheck = (req, res) => {
  try {
    const stats = getAuthStats();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      auth: {
        mode: 'strict_authentication',
        cacheSize: stats.cacheSize,
        jwtConfigured: stats.jwtSecretConfigured,
        strictMode: true
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Détecter qualité connexion (simplifié)
const detectConnectionQuality = (req) => {
  return 'stable'; // Toujours stable en mode strict
};

module.exports = {
  // Middlewares principaux
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
  requireTeacher,
  
  // Fonctions de token
  generateToken,
  generateTokenPair,
  refreshTokens,
  
  // Utilitaires
  detectConnectionQuality,
  clearUserCache,
  getAuthStats,
  healthCheck
};

console.log('✅ === AUTH MIDDLEWARE STRICT ET CORRIGÉ ===');
console.log('🔒 Mode strict : Authentification OBLIGATOIRE');
console.log('❌ Plus de fallback automatique');
console.log('✅ Token JWT obligatoire et vérifié');
console.log('✅ Utilisateur DOIT exister en base de données');
console.log('✅ Vérifications strictes : email, rôle, statut actif');
console.log('✅ Cache intelligent avec validation');
console.log('⚠️  IMPORTANT : Résout le problème de token malformé');
console.log('🎯 Prêt pour authentification réelle sans confusion');