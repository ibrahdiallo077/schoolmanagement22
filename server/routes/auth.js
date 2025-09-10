// routes/auth.js - Version complète avec sessions robustes et "Se souvenir de moi"
const express = require('express');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');

// ✨ IMPORTS MISE À JOUR - Nouvelles fonctions du middleware
const { 
  authenticateToken, 
  generateToken,           // Fonction existante (compatibilité)
  generateTokenPair,       // ← NOUVEAU : Génère access + refresh tokens
  refreshTokens,           // ← NOUVEAU : Rafraîchit les tokens
  detectConnectionQuality, // ← NOUVEAU : Détecte qualité connexion
  requireSuperAdmin, 
  requireAdmin,
  clearUserCache,          // ← NOUVEAU : Nettoie le cache utilisateur
  getAuthStats,            // ← NOUVEAU : Statistiques auth
  healthCheck             // ← NOUVEAU : Santé du système
} = require('../middleware/auth');

const { isValidEmail, isStrongPassword, sanitizeText, createValidationError } = require('../utils/validation');
const crypto = require('crypto');

const router = express.Router();

console.log('🔐 Module auth.js chargé avec sessions robustes et "Se souvenir de moi"');

// === UTILITAIRES CONSERVÉS ===

// Générer un token de réinitialisation sécurisé
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hasher un mot de passe
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Créer un nom d'utilisateur unique
const generateUsername = async (firstName, lastName) => {
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z.]/g, '');
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const result = await query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

// === ROUTE DE TEST COMPLÈTE ===
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Routes auth fonctionnelles avec sessions robustes et "Se souvenir de moi"',
    timestamp: new Date().toISOString(),
    routes: [
      // NOUVELLES ROUTES
      'POST /signin - Connexion avec sessions adaptatives ✨',
      'POST /refresh-token - Rafraîchir le token ✨',
      'POST /heartbeat - Maintenir la session ✨',
      'POST /logout - Déconnexion avec nettoyage ✨',
      'GET /connection-status - Statut connexion ✨',
      'GET /health - Santé du système auth ✨',
      
      // ROUTES EXISTANTES CONSERVÉES
      'GET /me - Profil utilisateur',
      'POST /change-password - Changer mot de passe',
      'POST /verify-email - Vérifier email',
      'POST /direct-reset-password - Reset direct mot de passe',
      'POST /create-admin - Créer admin (Super Admin)',
      'GET /admins - Lister admins actifs (Admin+)',
      'PUT /admins/:id - Modifier admin (Admin+)',
      'DELETE /admins/:id - Supprimer admin DÉFINITIVEMENT (Super Admin)',
      'POST /verify-first-login-token - Vérifier token première connexion',
      'POST /setup-first-password - Configurer premier mot de passe',
      'POST /generate-first-login-token - Générer token première connexion',
      
      // ROUTES DE DEBUG
      'GET /debug/auth-stats - Statistiques auth ✨'
    ],
    features: [
      '✨ Sessions adaptatives selon qualité connexion',
      '✨ "Se souvenir de moi" fonctionnel',
      '✨ Refresh tokens automatiques', 
      '✨ Heartbeat intelligent',
      '✨ Gestion d\'erreurs robuste',
      '✨ Cache optimisé'
    ]
  });
});

// === CONNEXION AVEC SESSIONS ADAPTATIVES ET "SE SOUVENIR DE MOI" ===
router.post('/signin', async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const { email, password, rememberMe = false } = req.body;

    console.log(`🔐 [${requestId}] Tentative de connexion pour:`, email, rememberMe ? '(Se souvenir activé)' : '');

    // Validation des données d'entrée
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email et mot de passe requis',
        code: 'MISSING_CREDENTIALS',
        requestId
      });
    }

    // ✨ NOUVEAU : Détecter la qualité de connexion pour adapter la session
    const connectionQuality = detectConnectionQuality(req);
    console.log(`📡 [${requestId}] Qualité de connexion détectée:`, connectionQuality);

    // Rechercher l'utilisateur (uniquement les actifs)
    const userResult = await query(
      `SELECT id, username, email, first_name, last_name, role, password_hash, 
              is_first_login, is_active, last_login, created_at
       FROM admin_users 
       WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ [${requestId}] Utilisateur non trouvé ou inactif:`, email);
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS',
        requestId
      });
    }

    const user = userResult.rows[0];

    // Vérifier si c'est une première connexion
    if (user.is_first_login) {
      console.log(`⚠️ [${requestId}] Première connexion requise pour:`, email);
      return res.status(403).json({ 
        success: false, 
        error: 'FIRST_LOGIN_REQUIRED',
        message: 'Vous devez configurer votre mot de passe. Redirection vers la page de configuration...',
        requestId
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log(`❌ [${requestId}] Mot de passe incorrect pour:`, email);
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS',
        requestId
      });
    }

    // ✨ NOUVEAU : Générer les tokens adaptés à la connexion et "Se souvenir de moi"
    const tokens = generateTokenPair(user, rememberMe, connectionQuality);

    // Mettre à jour la dernière connexion avec transaction
    await transaction(async (client) => {
      // Mise à jour de la dernière connexion
      await client.query(
        'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // ✨ OPTIONNEL : Stocker le refresh token en base pour révocation (si activé)
      if (process.env.STORE_REFRESH_TOKENS === 'true') {
        // Nettoyer les anciens refresh tokens pour cet utilisateur (garde seulement le plus récent)
        await client.query(
          'DELETE FROM refresh_tokens WHERE user_id = $1',
          [user.id]
        );

        // Stocker le nouveau refresh token hashé
        const expiresAt = new Date();
        if (rememberMe) {
          // Durées selon qualité connexion quand "Se souvenir" activé
          const days = connectionQuality === 'stable' ? 7 : 
                      connectionQuality === 'unstable' ? 30 : 90;
          expiresAt.setDate(expiresAt.getDate() + days);
        } else {
          // Durées courtes sans "Se souvenir"
          const days = connectionQuality === 'stable' ? 1 : 
                      connectionQuality === 'unstable' ? 7 : 30;
          expiresAt.setDate(expiresAt.getDate() + days);
        }

        await client.query(`
          INSERT INTO refresh_tokens (user_id, token_hash, expires_at, connection_quality, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [
          user.id, 
          crypto.createHash('sha256').update(tokens.refreshToken).digest('hex'),
          expiresAt,
          connectionQuality
        ]);

        console.log(`💾 [${requestId}] Refresh token stocké (expire: ${expiresAt.toISOString()})`);
      }
    });

    // Nettoyer le cache utilisateur pour forcer une réactualisation
    clearUserCache(user.id);

    // Retourner la réponse sans le hash du mot de passe
    const { password_hash, ...userWithoutPassword } = user;

    // ✨ NOUVEAU : Calculer la durée de session selon le contexte
    const getDurationText = (quality, remember) => {
      if (remember) {
        return quality === 'stable' ? '24 heures' :
               quality === 'unstable' ? '7 jours' : '30 jours';
      } else {
        return quality === 'stable' ? '30 minutes' :
               quality === 'unstable' ? '4 heures' : '24 heures';
      }
    };

    const sessionDuration = getDurationText(connectionQuality, rememberMe);

    console.log(`✅ [${requestId}] Connexion réussie pour:`, user.email, 
                `(${connectionQuality}, ${sessionDuration}, rememberMe: ${rememberMe})`);

    res.json({
      success: true,
      message: 'Connexion réussie',
      
      // ✨ NOUVEAU : Retourner les deux tokens
      token: tokens.accessToken,        // ← Compatibilité avec ancien code
      accessToken: tokens.accessToken,  // ← Nouveau format
      refreshToken: tokens.refreshToken, // ← Token de rafraîchissement
      
      user: userWithoutPassword,
      
      // ✨ NOUVEAU : Métadonnées de session détaillées
      session: {
        connectionQuality,
        duration: sessionDuration,
        rememberMe,
        expiresIn: tokens.expiresIn,
        canRefresh: true,
        adaptiveSession: true
      },
      
      requestId
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Erreur lors de la connexion:`, error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR',
      requestId
    });
  }
});

// === ✨ NOUVELLES ROUTES POUR SESSIONS ROBUSTES ===

// Route de rafraîchissement de token
router.post('/refresh-token', async (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const { refreshToken } = req.body;

    console.log(`🔄 [${requestId}] Demande de rafraîchissement de token`);

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requis',
        code: 'MISSING_REFRESH_TOKEN',
        requestId
      });
    }

    // Utiliser la fonction du middleware pour rafraîchir
    const result = await refreshTokens(refreshToken);

    if (!result.success) {
      console.log(`❌ [${requestId}] Rafraîchissement échoué:`, result.error);
      return res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement invalide ou expiré',
        code: result.error,
        canRetry: false,
        requestId
      });
    }

    console.log(`✅ [${requestId}] Token rafraîchi avec succès pour:`, result.user.email);

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      
      // Nouveaux tokens
      token: result.accessToken,        // ← Compatibilité
      accessToken: result.accessToken,  
      refreshToken: result.refreshToken,
      
      user: result.user,
      
      session: {
        connectionQuality: result.connectionQuality,
        expiresIn: result.expiresIn,
        refreshedAt: new Date().toISOString(),
        adaptiveSession: true
      },
      
      requestId
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Erreur rafraîchissement token:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du rafraîchissement du token',
      code: 'REFRESH_ERROR',
      requestId
    });
  }
});

// Route heartbeat pour maintenir la session
router.post('/heartbeat', authenticateToken, async (req, res) => {
  const requestId = req.auth?.requestId || Math.random().toString(36).substr(2, 9);
  
  try {
    const user = req.user;
    const connectionQuality = req.auth.connectionQuality;

    // Mettre à jour la dernière activité (non bloquant)
    setImmediate(async () => {
      try {
        await query(
          'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );
      } catch (error) {
        console.warn(`⚠️ [${requestId}] Erreur mise à jour activité:`, error.message);
      }
    });

    // Calculer le temps restant pour le token
    const tokenInfo = req.auth.token;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, (tokenInfo.exp - currentTime) * 1000);

    console.log(`💓 [${requestId}] Heartbeat pour:`, user.email, `(${connectionQuality})`);

    res.json({
      success: true,
      message: 'Session maintenue',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      session: {
        connectionQuality,
        timeRemaining,
        isFromCache: req.auth.fromCache,
        serverTime: new Date().toISOString(),
        healthy: true
      },
      requestId
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Erreur heartbeat:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du heartbeat',
      code: 'HEARTBEAT_ERROR',
      requestId
    });
  }
});

// Route de déconnexion avec nettoyage
router.post('/logout', authenticateToken, async (req, res) => {
  const requestId = req.auth?.requestId || Math.random().toString(36).substr(2, 9);
  
  try {
    const userId = req.user.id;
    const { allDevices = false } = req.body;

    console.log(`🚪 [${requestId}] Déconnexion pour:`, req.user.email, 
                allDevices ? '(tous appareils)' : '(appareil actuel)');

    // Nettoyer le cache utilisateur
    clearUserCache(userId);

    // Si stockage des refresh tokens activé, les supprimer
    if (process.env.STORE_REFRESH_TOKENS === 'true') {
      if (allDevices) {
        // Supprimer tous les refresh tokens de l'utilisateur
        const result = await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
        console.log(`🧹 [${requestId}] ${result.rowCount} refresh tokens supprimés pour tous les appareils`);
      } else {
        // Supprimer seulement le refresh token actuel si fourni
        const refreshToken = req.headers['x-refresh-token'] || req.body.refreshToken;
        if (refreshToken) {
          const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          const result = await query(
            'DELETE FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2', 
            [userId, tokenHash]
          );
          console.log(`🧹 [${requestId}] ${result.rowCount} refresh token supprimé pour cet appareil`);
        }
      }
    }

    res.json({
      success: true,
      message: allDevices ? 'Déconnecté de tous les appareils avec succès' : 'Déconnexion réussie',
      loggedOut: true,
      allDevices,
      requestId
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Erreur déconnexion:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la déconnexion',
      code: 'LOGOUT_ERROR',
      requestId
    });
  }
});

// Route pour détecter la qualité de connexion
router.get('/connection-status', (req, res) => {
  try {
    const connectionQuality = detectConnectionQuality(req);
    
    // Durées recommandées selon la qualité
    const durations = {
      stable: { 
        short: '30 minutes', 
        long: '24 heures', 
        refresh: '7 jours',
        description: 'Connexion stable détectée'
      },
      unstable: { 
        short: '4 heures', 
        long: '7 jours', 
        refresh: '30 jours',
        description: 'Connexion instable détectée (mobile/proxy)'
      },
      offline: { 
        short: '24 heures', 
        long: '30 jours', 
        refresh: '90 jours',
        description: 'Mode hors ligne optimisé'
      }
    };

    res.json({
      success: true,
      connectionQuality,
      recommendations: durations[connectionQuality],
      detectedFactors: {
        userAgent: req.get('User-Agent'),
        isMobile: /Mobile|Android|iPhone|iPad/i.test(req.get('User-Agent') || ''),
        hasProxy: !!req.get('Via') || !!req.get('X-Forwarded-For'),
        connection: req.get('Connection'),
        acceptEncoding: req.get('Accept-Encoding')
      },
      clientIP: req.ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la détection de connexion',
      timestamp: new Date().toISOString()
    });
  }
});

// Route de santé du système d'authentification
router.get('/health', healthCheck);

// Route de statistiques pour debug (Super Admin seulement)
router.get('/debug/auth-stats', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const stats = getAuthStats();
    res.json({
      success: true,
      message: 'Statistiques du système d\'authentification',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      timestamp: new Date().toISOString()
    });
  }
});

// === VÉRIFICATION DU TOKEN - ROUTE /ME AMÉLIORÉE ===
router.get('/me', authenticateToken, async (req, res) => {
  const requestId = req.auth?.requestId || Math.random().toString(36).substr(2, 9);
  
  try {
    // Récupérer les informations complètes de l'utilisateur depuis la base
    const userResult = await query(
      `SELECT id, username, email, first_name, last_name, role, avatar_url, 
              phone, date_of_birth, last_login, created_at, is_active, updated_at
       FROM admin_users 
       WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      console.warn(`🚫 [${requestId}] Utilisateur non trouvé lors de /me:`, req.user.id);
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé ou compte supprimé',
        code: 'USER_NOT_FOUND',
        requestId
      });
    }

    const user = userResult.rows[0];

    console.log(`👤 [${requestId}] Profil récupéré pour:`, user.email, 
                req.auth.fromCache ? '(depuis cache)' : '(depuis BDD)');

    res.json({
      success: true,
      user: user,
      
      // ✨ NOUVEAU : Métadonnées de session enrichies
      session: {
        connectionQuality: req.auth.connectionQuality,
        authenticatedAt: req.auth.authenticatedAt,
        fromCache: req.auth.fromCache,
        tokenType: req.auth.token.type || 'access',
        rememberMe: req.auth.token.rememberMe || false,
        canRefresh: true
      },
      
      requestId
    });
    
  } catch (error) {
    console.error(`💥 [${requestId}] Erreur /me:`, error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du profil',
      code: 'PROFILE_ERROR',
      requestId
    });
  }
});

// === ROUTES EXISTANTES CONSERVÉES (INCHANGÉES) ===

// === CHANGEMENT DE MOT DE PASSE ===
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    console.log('🔐 Changement de mot de passe pour l\'utilisateur ID:', userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial'
      });
    }

    // Récupérer l'utilisateur actuel (uniquement les actifs)
    const userResult = await query(
      'SELECT * FROM admin_users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé ou compte supprimé'
      });
    }

    const user = userResult.rows[0];

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const newPasswordHash = await hashPassword(newPassword);

    await query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    console.log('✅ Mot de passe modifié avec succès pour:', user.email);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du changement de mot de passe'
    });
  }
});

// === VÉRIFICATION EMAIL (pour reset password) ===
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 Vérification de l\'email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide'
      });
    }

    // Rechercher l'utilisateur (uniquement les actifs)
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role FROM admin_users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun compte actif trouvé avec cette adresse email'
      });
    }

    const user = userResult.rows[0];
    console.log('✅ Utilisateur trouvé:', user.email);

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Erreur vérification email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification'
    });
  }
});

// === RÉINITIALISATION DIRECTE MOT DE PASSE ===
router.post('/direct-reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log('🔐 Réinitialisation directe pour:', email);

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email et nouveau mot de passe requis'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial'
      });
    }

    // Vérifier que l'utilisateur existe et est actif
    const userResult = await query(
      'SELECT id, email, first_name FROM admin_users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé ou compte supprimé'
      });
    }

    const user = userResult.rows[0];

    // Hasher le nouveau mot de passe
    const newPasswordHash = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, user.id]
    );

    console.log('✅ Mot de passe réinitialisé pour:', user.email);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur réinitialisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification du mot de passe'
    });
  }
});

// === CRÉER UN ADMINISTRATEUR (Super Admin uniquement) ===
router.post('/create-admin', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, role = 'admin', activationUrl } = req.body;

    console.log('➕ Création admin par:', req.user.email);
    console.log('📋 Données reçues:', { email, firstName, lastName, role });

    // Validation des données
    if (!email || !firstName || !lastName) {
      console.log('❌ Validation échouée - données manquantes');
      return res.status(400).json({
        success: false,
        error: 'Email, prénom et nom requis'
      });
    }

    if (!isValidEmail(email)) {
      console.log('❌ Email invalide:', email);
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide'
      });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      console.log('❌ Rôle invalide:', role);
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
      });
    }

    // Utiliser une transaction pour s'assurer de la cohérence
    const result = await transaction(async (client) => {
      // Vérifier si l'email existe déjà
      const existingUser = await client.query(
        'SELECT id, email, is_active FROM admin_users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        console.log('❌ Email déjà utilisé:', email, existingUser.rows[0]);
        if (existingUser.rows[0].is_active) {
          throw new Error('Un compte actif avec cet email existe déjà');
        } else {
          throw new Error('Un compte avec cet email a été supprimé. Contactez le support pour le restaurer.');
        }
      }

      // Générer un username unique
      const username = await generateUsername(firstName, lastName);
      console.log('📝 Username généré:', username);

      // Créer l'utilisateur avec un mot de passe temporaire
      const tempPassword = crypto.randomUUID();
      const hashedTempPassword = await hashPassword(tempPassword);

      console.log('💾 Insertion en base...');
      const userResult = await client.query(`
        INSERT INTO admin_users (
          username, email, first_name, last_name, role, 
          password_hash, is_first_login, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, true, CURRENT_TIMESTAMP)
        RETURNING id, username, email, first_name, last_name, role, created_at
      `, [username, email.toLowerCase(), sanitizeText(firstName), sanitizeText(lastName), role, hashedTempPassword]);

      const newUser = userResult.rows[0];
      console.log('✅ Utilisateur créé:', newUser);

      // Générer un token de réinitialisation
      const resetToken = generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

      await client.query(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
        VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
      `, [newUser.id, resetToken, expiresAt]);

      console.log('🔑 Token généré:', resetToken.substring(0, 10) + '...');

      return { user: newUser, resetToken };
    });

    // TODO: Envoyer l'email de bienvenue
    console.log('📧 Email à envoyer à:', email);
    console.log('🔗 Lien d\'activation:', `${activationUrl || 'http://localhost:3001'}?token=${result.resetToken}&email=${encodeURIComponent(email)}`);

    console.log('✅ Admin créé avec succès:', result.user.email);

    res.json({
      success: true,
      message: 'Administrateur créé avec succès',
      user: result.user,
      activationToken: result.resetToken // À supprimer en production
    });

  } catch (error) {
    console.error('💥 Erreur création admin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création de l\'administrateur',
      details: error.stack
    });
  }
});

// === LISTER LES ADMINISTRATEURS ACTIFS UNIQUEMENT (Super Admin uniquement) ===
router.get('/admins', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    console.log('🛡️ Accès Admin autorisé pour', req.user.email);
    console.log('📋 Chargement de la liste des administrateurs actifs uniquement');

    const adminsResult = await query(`
      SELECT id, username, email, first_name, last_name, role, 
             is_first_login, is_active, last_login, created_at, updated_at
      FROM admin_users 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    console.log(`✅ ${adminsResult.rows.length} administrateurs actifs trouvés`);

    res.json({
      success: true,
      admins: adminsResult.rows
    });

  } catch (error) {
    console.error('💥 Erreur chargement admins:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des administrateurs'
    });
  }
});

// === MODIFIER UN ADMINISTRATEUR ===
router.put('/admins/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;
    const { first_name, last_name, role, email } = req.body;

    console.log(`✏️ Modification admin ID: ${adminId} par ${req.user.email}`);
    console.log('📝 Données reçues:', { first_name, last_name, role, email });

    // Validation
    if (!first_name || !last_name || !role) {
      console.log('❌ Validation échouée - données manquantes');
      return res.status(400).json({
        success: false,
        error: 'Prénom, nom et rôle sont requis'
      });
    }

    // Vérifier que l'admin existe et est actif
    const existingAdmin = await query(
      'SELECT id, email FROM admin_users WHERE id = $1 AND is_active = true',
      [adminId]
    );

    if (existingAdmin.rows.length === 0) {
      console.log('❌ Admin non trouvé:', adminId);
      return res.status(404).json({
        success: false,
        error: 'Administrateur non trouvé'
      });
    }

    console.log('✅ Admin trouvé:', existingAdmin.rows[0]);

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email !== existingAdmin.rows[0].email) {
      console.log('🔍 Vérification unicité email:', email);
      const emailExists = await query(
        'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
        [email, adminId]
      );

      if (emailExists.rows.length > 0) {
        console.log('❌ Email déjà utilisé:', email);
        return res.status(409).json({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà'
        });
      }
    }

    // Mettre à jour l'administrateur
    console.log('📝 Mise à jour admin...');
    const updatedAdmin = await query(`
      UPDATE admin_users 
      SET first_name = $1, last_name = $2, role = $3, 
          email = COALESCE($4, email), updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND is_active = true
      RETURNING id, email, username, first_name, last_name, role, updated_at
    `, [first_name, last_name, role, email, adminId]);

    if (updatedAdmin.rows.length === 0) {
      console.log('❌ Échec mise à jour - admin peut-être supprimé');
      return res.status(404).json({
        success: false,
        error: 'Impossible de modifier cet administrateur'
      });
    }

    // ✨ NOUVEAU : Nettoyer le cache pour cet utilisateur
    clearUserCache(adminId);

    console.log('✅ Administrateur modifié avec succès:', updatedAdmin.rows[0]);

    res.json({
      success: true,
      message: 'Administrateur modifié avec succès',
      admin: updatedAdmin.rows[0]
    });

  } catch (error) {
    console.error('💥 Erreur modification admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l\'administrateur',
      details: error.message
    });
  }
});

// === SUPPRIMER UN ADMINISTRATEUR (SUPPRESSION DÉFINITIVE) ===
router.delete('/admins/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;
    const currentUserId = req.user.id;

    console.log(`🗑️ Suppression DÉFINITIVE admin ID: ${adminId} par ${req.user.email}`);

    // Empêcher l'auto-suppression
    if (parseInt(adminId) === parseInt(currentUserId)) {
      console.log('❌ Tentative auto-suppression bloquée');
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Vérifier que l'admin existe (actif ou inactif)
    const existingAdmin = await query(
      'SELECT id, email, first_name, last_name, is_active FROM admin_users WHERE id = $1',
      [adminId]
    );

    if (existingAdmin.rows.length === 0) {
      console.log('❌ Admin non trouvé pour suppression:', adminId);
      return res.status(404).json({
        success: false,
        error: 'Administrateur non trouvé'
      });
    }

    const admin = existingAdmin.rows[0];
    console.log('✅ Admin trouvé pour suppression définitive:', admin);

    // Utiliser une transaction pour supprimer proprement
    const result = await transaction(async (client) => {
      // Supprimer les tokens de réinitialisation liés
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [adminId]
      );

      // ✨ NOUVEAU : Supprimer les refresh tokens si stockés
      if (process.env.STORE_REFRESH_TOKENS === 'true') {
        await client.query(
          'DELETE FROM refresh_tokens WHERE user_id = $1',
          [adminId]
        );
      }

      // Supprimer l'administrateur définitivement
      const deleteResult = await client.query(
        'DELETE FROM admin_users WHERE id = $1 RETURNING id, email, first_name, last_name',
        [adminId]
      );

      return deleteResult.rows[0];
    });

    // ✨ NOUVEAU : Nettoyer le cache pour cet utilisateur
    clearUserCache(adminId);

    console.log('✅ Administrateur supprimé DÉFINITIVEMENT avec succès');

    res.json({
      success: true,
      message: 'Administrateur supprimé définitivement avec succès',
      deleted_admin: result
    });

  } catch (error) {
    console.error('💥 Erreur suppression définitive admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression définitive de l\'administrateur',
      details: error.message
    });
  }
});

// === GÉNÉRER UN TOKEN DE PREMIÈRE CONNEXION ===
router.post('/generate-first-login-token', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔗 Génération token première connexion pour:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    // Vérifier que l'utilisateur existe et est en première connexion
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, is_first_login, is_active FROM admin_users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé ou compte supprimé'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_first_login) {
      return res.status(400).json({
        success: false,
        error: 'Cet utilisateur a déjà configuré son mot de passe'
      });
    }

    // Utiliser une transaction
    const result = await transaction(async (client) => {
      // Invalider tous les anciens tokens pour cet utilisateur
      await client.query(
        'UPDATE password_reset_tokens SET used = true, used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used = false',
        [user.id]
      );

      // Générer un nouveau token
      const resetToken = generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

      await client.query(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
        VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
      `, [user.id, resetToken, expiresAt]);

      return { resetToken };
    });

    console.log('✅ Token de première connexion généré avec succès pour:', user.email);

    res.json({
      success: true,
      token: result.resetToken,
      message: 'Token de première connexion généré avec succès',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Erreur génération token première connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du token de première connexion'
    });
  }
});

// === VERSION TEMPORAIRE - BYPASS is_first_login ===
router.post('/verify-first-login-token', async (req, res) => {
  try {
    const { token, email } = req.body;
    console.log('🔍 Vérification token pour:', email);
    console.log('🔍 Token reçu:', token?.substring(0, 10) + '...');
   
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: 'Token et email requis'
      });
    }

    // ✅ ÉTAPE 1: Vérifier si l'utilisateur existe
    const userCheck = await query(`
      SELECT id, email, first_name, last_name, role, is_first_login, is_active, created_at
      FROM admin_users
      WHERE email = $1
    `, [email.toLowerCase()]);

    console.log('👤 Utilisateur trouvé:', userCheck.rows[0]?.email || 'AUCUN');

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun compte trouvé avec cet email. Contactez l\'administration.'
      });
    }

    const user = userCheck.rows[0];

    // ✅ ÉTAPE 2: Vérifier le statut du compte
    if (!user.is_active) {
      console.log('❌ Compte inactif pour:', email);
      return res.status(400).json({
        success: false,
        error: 'Votre compte a été désactivé. Contactez l\'administration.'
      });
    }

    // ✅ ÉTAPE 3: Vérifier le token spécifiquement
    const tokenResult = await query(`
      SELECT token, user_id, created_at, expires_at, used, used_at
      FROM password_reset_tokens
      WHERE token = $1 AND user_id = $2
    `, [token, user.id]);

    console.log('🔑 Token trouvé:', tokenResult.rows.length > 0 ? 'OUI' : 'NON');

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Ce lien ne correspond pas à votre compte. Vérifiez l\'URL ou demandez un nouveau lien.'
      });
    }

    const tokenData = tokenResult.rows[0];

    // ✅ ÉTAPE 4: Vérifier si le token a été utilisé
    if (tokenData.used) {
      console.log('⚠️ Token déjà utilisé le:', tokenData.used_at);
      // CHANGEMENT: Au lieu d'une erreur, on renvoie un succès avec message de bienvenue
      return res.json({
        success: true,
        message: `Bienvenue ${user.first_name} ${user.last_name} ! Votre compte est déjà configuré.`,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          fullName: `${user.first_name} ${user.last_name}`
        },
        alreadyActivated: true
      });
    }

    // ✅ ÉTAPE 5: Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
   
    if (expiresAt < now) {
      console.log('❌ Token expiré. Expiration:', expiresAt);
      
      const hoursExpired = Math.floor((now - expiresAt) / (1000 * 60 * 60));
      
      return res.status(400).json({
        success: false,
        error: hoursExpired < 24 
          ? `Ce lien a expiré il y a ${hoursExpired}h. Demandez un nouveau lien à l'administration.`
          : 'Ce lien a expiré. Demandez un nouveau lien à l\'administration.'
      });
    }

    // ✅ ÉTAPE 6: Vérifier is_first_login et adapter la réponse
    if (!user.is_first_login) {
      console.log('✅ Compte déjà configuré, message de bienvenue pour:', user.email);
      // CHANGEMENT: Au lieu d'une erreur, on renvoie un succès avec message de bienvenue
      return res.json({
        success: true,
        message: `Bienvenue ${user.first_name} ${user.last_name} ! Votre compte est déjà configuré.`,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          fullName: `${user.first_name} ${user.last_name}`
        },
        alreadyActivated: true
      });
    }

    // ✅ PREMIÈRE CONNEXION - Message de bienvenue pour configuration
    console.log('✅ Première connexion valide pour:', user.email);
   
    res.json({
      success: true,
      message: `Bienvenue ${user.first_name} ${user.last_name} ! Vous pouvez maintenant configurer votre mot de passe.`,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        fullName: `${user.first_name} ${user.last_name}`
      },
      isFirstLogin: true
    });

  } catch (error) {
    console.error('💥 Erreur vérification token:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur technique lors de la vérification. Réessayez dans quelques instants.'
    });
  }
});


// === CONFIGURATION DU MOT DE PASSE POUR PREMIÈRE CONNEXION ===
router.post('/setup-first-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔐 Configuration du mot de passe pour première connexion');

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token et nouveau mot de passe requis'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial'
      });
    }

    // Utiliser une transaction pour s'assurer de la cohérence
    const result = await transaction(async (client) => {
      // Vérifier le token (uniquement pour les comptes actifs)
      const tokenResult = await client.query(`
        SELECT prt.*, au.id as user_id, au.email, au.first_name, au.last_name, au.is_first_login
        FROM password_reset_tokens prt
        JOIN admin_users au ON prt.user_id = au.id
        WHERE prt.token = $1 
          AND prt.used = false 
          AND prt.expires_at > CURRENT_TIMESTAMP
          AND au.is_active = true
      `, [token]);

      if (tokenResult.rows.length === 0) {
        throw new Error('Token invalide, expiré ou compte supprimé');
      }

      const tokenData = tokenResult.rows[0];

      // Vérifier que c'est bien une première connexion
      if (!tokenData.is_first_login) {
        throw new Error('Ce compte est déjà activé');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await hashPassword(newPassword);

      // Mettre à jour le mot de passe et marquer comme activé
      await client.query(`
        UPDATE admin_users 
        SET password_hash = $1, 
            is_first_login = false, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
      `, [hashedPassword, tokenData.user_id]);

      // Marquer le token comme utilisé
      await client.query(`
        UPDATE password_reset_tokens 
        SET used = true, 
            used_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tokenData.id]);

      return tokenData;
    });

    // ✨ NOUVEAU : Nettoyer le cache pour cet utilisateur
    clearUserCache(result.user_id);

    console.log('✅ Mot de passe configuré avec succès pour:', result.email);

    res.json({
      success: true,
      message: 'Mot de passe configuré avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur configuration mot de passe:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la configuration du mot de passe'
    });
  }
});

// === FIN DU FICHIER ET LOGS ===

console.log('✅ Routes auth complètes chargées avec succès');
console.log('🚀 Fonctionnalités activées:');
console.log('   - Sessions adaptatives selon qualité connexion');
console.log('   - "Se souvenir de moi" fonctionnel');
console.log('   - Refresh tokens automatiques');
console.log('   - Heartbeat intelligent');
console.log('   - Gestion d\'erreurs robuste');
console.log('   - Cache utilisateur optimisé');
console.log('   - Toutes les routes existantes conservées');

module.exports = router;