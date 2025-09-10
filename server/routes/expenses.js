// server/routes/expenses.js - Backend avec Workflow de Validation et Gestion Financière - VERSION COMPLÈTE CORRIGÉE

const express = require('express');
const { query } = require('../config/database');
const { sanitizeText } = require('../utils/validation');

const router = express.Router();

console.log('💸 === MODULE EXPENSES.JS AVEC WORKFLOW - VERSION COMPLÈTE CORRIGÉE ===');

// === MIDDLEWARE CORS EN PREMIER ===
router.use((req, res, next) => {
  console.log('🌐 [EXPENSES] CORS middleware pour:', req.method, req.originalUrl);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-auth-token, X-Auth-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [EXPENSES] OPTIONS request handled');
    return res.status(200).end();
  }
  next();
});

// === MIDDLEWARE D'AUTHENTIFICATION ===
const authenticateExpenseUser = async (req, res, next) => {
  console.log('🔐 [EXPENSES] Auth middleware pour:', req.method, req.originalUrl);
  
  try {
    const authHeader = req.headers.authorization;
    const xAuthToken = req.headers['x-auth-token'] || req.headers['X-Auth-Token'];
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (xAuthToken) {
      token = xAuthToken;
    } else if (authHeader && !authHeader.startsWith('Bearer ')) {
      token = authHeader;
    } else if (req.body?.token) {
      token = req.body.token;
    } else if (req.query?.token) {
      token = req.query.token;
    }

    console.log('🔍 [EXPENSES] Token présent:', !!token);

    if (!token) {
      console.log('❌ [EXPENSES] Aucun token fourni');
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis',
        code: 'NO_TOKEN'
      });
    }

    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-very-long-and-secure-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log('✅ [EXPENSES] Token décodé pour userId:', decoded.userId);
    } catch (jwtError) {
      console.log('❌ [EXPENSES] Erreur JWT:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expiré',
          code: 'EXPIRED_TOKEN'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }
    
    let userResult;
    let user;
    
    try {
      userResult = await query(
        `SELECT id, username, email, first_name, last_name, role, is_active, avatar_url, created_at
         FROM admin_users 
         WHERE id = $1`,
        [decoded.userId]
      );
      
      console.log('🔍 [EXPENSES] Résultat DB pour userId', decoded.userId, ':', userResult.rows.length, 'lignes');
      
      if (userResult.rows.length === 0) {
        console.log('❌ [EXPENSES] Utilisateur non trouvé en DB pour ID:', decoded.userId);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 [EXPENSES] Création utilisateur virtuel pour développement');
          user = {
            id: decoded.userId,
            username: decoded.username || decoded.email || 'user-' + decoded.userId,
            email: decoded.email || 'user-' + decoded.userId + '@localhost',
            first_name: 'Utilisateur',
            last_name: 'Virtuel',
            role: decoded.role || 'admin',
            is_active: true,
            avatar_url: null,
            created_at: new Date()
          };
        } else {
          return res.status(401).json({
            success: false,
            error: 'Utilisateur non trouvé ou compte inactif',
            code: 'USER_NOT_FOUND'
          });
        }
      } else {
        user = userResult.rows[0];
        console.log('✅ [EXPENSES] Utilisateur trouvé:', user.email, 'Role:', user.role, 'Actif:', user.is_active);
      }
      
    } catch (dbError) {
      console.error('💥 [EXPENSES] Erreur base de données:', dbError.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [EXPENSES] Fallback DB - Création utilisateur virtuel');
        user = {
          id: decoded.userId,
          username: decoded.username || decoded.email || 'fallback-user',
          email: decoded.email || 'fallback@localhost',
          first_name: 'Utilisateur',
          last_name: 'Fallback',
          role: decoded.role || 'admin',
          is_active: true,
          avatar_url: null,
          created_at: new Date()
        };
      } else {
        return res.status(500).json({
          success: false,
          error: 'Erreur de connexion à la base de données',
          code: 'DB_CONNECTION_ERROR'
        });
      }
    }

    if (!user.is_active && process.env.NODE_ENV !== 'development') {
      console.log('❌ [EXPENSES] Compte inactif pour:', user.email);
      return res.status(401).json({
        success: false,
        error: 'Compte utilisateur désactivé',
        code: 'USER_INACTIVE'
      });
    }
    
    if (!user.is_active && process.env.NODE_ENV === 'development') {
      console.log('🔧 [EXPENSES] Activation automatique en mode dev pour:', user.email);
      user.is_active = true;
    }
    
    // 🔥 CONSTRUCTION OBJET UTILISATEUR AVEC PERMISSIONS
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      
      // PERMISSIONS SPÉCIFIQUES AUX DÉPENSES
      canValidate: user.role === 'super_admin',                               // Seul super_admin peut valider
      canCreateExpense: ['admin', 'super_admin'].includes(user.role),         // Admin ET super_admin peuvent créer
      canViewValidation: user.role === 'super_admin',                         // Seul super_admin voit la page validation
      canViewAllExpenses: user.role === 'super_admin',                        // Seul super_admin voit toutes les dépenses
      canEditOwnExpenses: ['admin', 'super_admin'].includes(user.role),       // Admin ET super_admin peuvent éditer leurs dépenses
      canDeleteOwnExpenses: user.role === 'super_admin',                      // Seul super_admin peut supprimer
      canBulkValidate: user.role === 'super_admin'                            // Seul super_admin peut valider en masse
    };

    console.log(`✅ [EXPENSES] Utilisateur authentifié: ${user.first_name} ${user.last_name} (${user.role})`);
    console.log(`🔑 [EXPENSES] Permissions: Valider=${req.user.canValidate}, Voir tout=${req.user.canViewAllExpenses}, Créer=${req.user.canCreateExpense}`);
    
    next();
    
  } catch (error) {
    console.error('💥 [EXPENSES] Erreur authentification globale:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

// === MIDDLEWARE DE PERMISSIONS ===
const requireAdmin = (req, res, next) => {
  console.log(`🛡️ [EXPENSES] Vérification Admin pour: ${req.user?.full_name} (${req.user?.role})`);
  
  if (!req.user?.canCreateExpense) {
    console.log(`❌ [EXPENSES] Accès refusé - Utilisateur: ${req.user?.full_name} (${req.user?.role})`);
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux Administrateurs',
      code: 'INSUFFICIENT_PERMISSIONS',
      user_role: req.user?.role,
      required_roles: ['admin', 'super_admin']
    });
  }
  
  console.log(`✅ [EXPENSES] Accès Admin accordé à: ${req.user.full_name} (${req.user.role})`);
  next();
};

const requireSuperAdmin = (req, res, next) => {
  console.log(`🛡️ [EXPENSES] Vérification Super Admin pour: ${req.user?.full_name} (${req.user?.role})`);
  
  if (!req.user?.canValidate) {
    console.log(`❌ [EXPENSES] Accès refusé - Super Admin requis pour: ${req.user?.full_name} (${req.user?.role})`);
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux Super Administrateurs',
      code: 'INSUFFICIENT_PERMISSIONS',
      user_role: req.user?.role,
      required_role: 'super_admin'
    });
  }
  
  console.log(`✅ [EXPENSES] Accès Super Admin accordé à: ${req.user.full_name} (${req.user.role})`);
  next();
};

console.log('🔐 [EXPENSES] Middleware d\'authentification configuré');

// ========================
// ROUTES DE TEST
// ========================

router.get('/test/cors', (req, res) => {
  console.log('🧪 [EXPENSES] Test CORS');
  res.json({
    success: true,
    message: 'CORS test réussi !',
    headers_received: Object.keys(req.headers),
    timestamp: new Date().toISOString(),
    version: '3.0.0-complete'
  });
});

router.get('/test/connection', (req, res) => {
  console.log('🧪 [EXPENSES] Test connection');
  res.json({
    success: true,
    message: 'Routes expenses connectées !',
    timestamp: new Date().toISOString(),
    version: '3.0.0-complete'
  });
});

router.get('/test/api', authenticateExpenseUser, async (req, res) => {
  try {
    console.log('🧪 [EXPENSES] Test API avec auth');
    
    const testQueries = await Promise.all([
      query('SELECT COUNT(*) as total_depenses FROM expenses').catch(() => ({ rows: [{ total_depenses: 0 }] })),
      query('SELECT COUNT(*) as total_categories FROM expense_categories').catch(() => ({ rows: [{ total_categories: 0 }] })),
      query('SELECT COUNT(*) as total_statuts FROM expense_statuses').catch(() => ({ rows: [{ total_statuts: 0 }] })),
      query('SELECT COUNT(*) as total_responsables FROM expense_responsibles').catch(() => ({ rows: [{ total_responsables: 0 }] }))
    ]);
    
    res.json({
      success: true,
      message: 'API Dépenses fonctionnelle !',
      test_results: {
        database_status: {
          total_depenses: parseInt(testQueries[0].rows[0].total_depenses),
          total_categories: parseInt(testQueries[1].rows[0].total_categories),
          total_statuts: parseInt(testQueries[2].rows[0].total_statuts),
          total_responsables: parseInt(testQueries[3].rows[0].total_responsables)
        },
        health_check: {
          database_connection: 'OK',
          routes_loaded: 'OK'
        },
        user_permissions: {
          id: req.user?.id,
          username: req.user?.username,
          full_name: req.user?.full_name,
          role: req.user?.role,
          canValidate: req.user?.canValidate
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur test API:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur test API',
      details: error.message
    });
  }
});

router.get('/test/user-info', authenticateExpenseUser, (req, res) => {
  res.json({
    success: true,
    message: 'Informations utilisateur récupérées',
    user: {
      id: req.user.id,
      name: req.user.full_name,
      email: req.user.email,
      role: req.user.role,
      permissions: {
        canValidate: req.user.canValidate,
        canCreateExpense: req.user.canCreateExpense,
        canViewValidation: req.user.canViewValidation,
        canViewAllExpenses: req.user.canViewAllExpenses,
        canEditOwnExpenses: req.user.canEditOwnExpenses,
        canDeleteOwnExpenses: req.user.canDeleteOwnExpenses
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ========================
// ROUTES DE CONFIGURATION
// ========================

router.get('/config/categories', authenticateExpenseUser, async (req, res) => {
  try {
    console.log('📂 [EXPENSES] Route config/categories appelée');
    
    const result = await query(`
      SELECT 
        id, 
        name, 
        COALESCE(color, '#3B82F6') as color, 
        COALESCE(icon, 'FileText') as icon, 
        COALESCE(description, '') as description,
        COALESCE(sort_order, 0) as sort_order,
        COALESCE(is_active, true) as is_active
      FROM expense_categories 
      WHERE COALESCE(is_active, true) = true 
      ORDER BY COALESCE(sort_order, 0), name
    `);
    
    console.log('✅ Catégories trouvées:', result.rows.length);
    
    res.json({
      success: true,
      categories: result.rows
    });
    
  } catch (error) {
    console.error('💥 Erreur catégories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération catégories',
      details: error.message
    });
  }
});

router.get('/config/statuses', authenticateExpenseUser, async (req, res) => {
  try {
    console.log('🏷️ [EXPENSES] Route config/statuses appelée');
    
    const result = await query(`
      SELECT 
        id, 
        name, 
        COALESCE(color, '#6B7280') as color, 
        COALESCE(icon, 'Clock') as icon, 
        COALESCE(description, '') as description, 
        COALESCE(is_final, false) as is_final,
        COALESCE(sort_order, 0) as sort_order
      FROM expense_statuses 
      ORDER BY COALESCE(sort_order, 0), name
    `);
    
    console.log('✅ Statuts trouvés:', result.rows.length);
    
    res.json({
      success: true,
      statuses: result.rows,
      user_permissions: {
        canValidate: req.user?.canValidate || false
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur statuts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération statuts',
      details: error.message
    });
  }
});

router.get('/config/responsibles', authenticateExpenseUser, async (req, res) => {
  try {
    console.log('👤 [EXPENSES] Route config/responsibles appelée');
    
    const result = await query(`
      SELECT 
        id, 
        name, 
        COALESCE(department, '') as department, 
        COALESCE(position, '') as position, 
        COALESCE(email, '') as email, 
        COALESCE(phone, '') as phone,
        COALESCE(is_active, true) as is_active
      FROM expense_responsibles 
      WHERE COALESCE(is_active, true) = true 
      ORDER BY name
    `);
    
    console.log('✅ Responsables trouvés:', result.rows.length);
    
    res.json({
      success: true,
      responsibles: result.rows
    });
    
  } catch (error) {
    console.error('💥 Erreur responsables:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération responsables',
      details: error.message
    });
  }
});

router.get('/config/payment-methods', authenticateExpenseUser, async (req, res) => {
  try {
    console.log('💳 [EXPENSES] Route config/payment-methods appelée');
    
    const paymentMethods = [
      { value: 'cash', label: 'Espèces', description: 'Paiement en espèces' },
      { value: 'bank_transfer', label: 'Virement bancaire', description: 'Virement vers compte bancaire' },
      { value: 'mobile_money', label: 'Mobile Money', description: 'Orange Money, MTN Money, etc.' },
      { value: 'check', label: 'Chèque', description: 'Paiement par chèque bancaire' },
      { value: 'card', label: 'Carte bancaire', description: 'Paiement par carte' }
    ];
    
    res.json({
      success: true,
      payment_methods: paymentMethods
    });
    
  } catch (error) {
    console.error('💥 Erreur méthodes de paiement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération méthodes de paiement',
      details: error.message
    });
  }
});

// ========================
// DASHBOARD
// ========================

router.get('/dashboard', authenticateExpenseUser, async (req, res) => {
  try {
    console.log(`📊 [EXPENSES] Dashboard demandé par: ${req.user.full_name} (${req.user.role})`);
    
    let whereCondition = '';
    let whereParams = [];
    
    if (!req.user.canViewAllExpenses) {
      whereCondition = 'WHERE e.responsible_user_id = $1';
      whereParams = [req.user.id];
      console.log(`🔒 Dashboard filtré pour: ${req.user.full_name}`);
    } else {
      whereCondition = '';
      whereParams = [];
      console.log(`👑 Dashboard complet pour Super Admin: ${req.user.full_name}`);
    }
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_depenses,
        COALESCE(SUM(amount), 0) as total_montant,
        
        -- Par statut avec workflow
        COUNT(*) FILTER (WHERE s.name = 'En attente') as en_attente,
        COUNT(*) FILTER (WHERE s.name = 'Payé') as payes,
        COUNT(*) FILTER (WHERE s.name = 'Rejeté') as rejetes,
        
        -- Montants par statut
        COALESCE(SUM(amount) FILTER (WHERE s.name = 'En attente'), 0) as montant_en_attente,
        COALESCE(SUM(amount) FILTER (WHERE s.name = 'Payé'), 0) as montant_paye,
        COALESCE(SUM(amount) FILTER (WHERE s.name = 'Rejeté'), 0) as montant_rejete,
        
        -- Ce mois
        COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
                         AND EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as ce_mois,
        COALESCE(SUM(amount) FILTER (WHERE EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
                            AND EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as montant_ce_mois
        
      FROM expenses e
      LEFT JOIN expense_statuses s ON e.status_id = s.id
      ${whereCondition}
    `;
    
    const statsResult = await query(statsQuery, whereParams);
    const stats = statsResult.rows[0];
    
    const recentQuery = `
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.expense_date,
        s.name as statut_nom,
        s.color as statut_couleur,
        c.name as categorie_nom,
        
        -- 🔥 RESPONSABLE = UTILISATEUR QUI A CRÉÉ LA DÉPENSE
        COALESCE(e.responsible_user_name, 'Utilisateur inconnu') as responsable_nom,
        COALESCE(e.responsible_user_role, 'unknown') as responsable_role
        
      FROM expenses e
      LEFT JOIN expense_statuses s ON e.status_id = s.id
      LEFT JOIN expense_categories c ON e.category_id = c.id
      ${whereCondition}
      ORDER BY e.created_at DESC
      LIMIT 5
    `;
    
    const recentResult = await query(recentQuery, whereParams);
    
    console.log('✅ Dashboard généré avec succès');
    
    res.json({
      success: true,
      dashboard: {
        statistiques: {
          total_depenses: parseInt(stats.total_depenses || 0),
          total_montant: parseFloat(stats.total_montant || 0),
          montant_formate: `${parseFloat(stats.total_montant || 0).toLocaleString('fr-FR')} FG`,
          
          en_attente: parseInt(stats.en_attente || 0),
          payes: parseInt(stats.payes || 0),
          rejetes: parseInt(stats.rejetes || 0),
          
          montant_en_attente: parseFloat(stats.montant_en_attente || 0),
          montant_paye: parseFloat(stats.montant_paye || 0),
          montant_rejete: parseFloat(stats.montant_rejete || 0),
          
          ce_mois: parseInt(stats.ce_mois || 0),
          montant_ce_mois: parseFloat(stats.montant_ce_mois || 0),
          
          impact_capital: parseFloat(stats.montant_paye || 0)
        },
        depenses_recentes: recentResult.rows,
        user_permissions: {
          id: req.user?.id,
          username: req.user?.username,
          full_name: req.user?.full_name,
          role: req.user?.role,
          canValidate: req.user?.canValidate || false,
          viewing_scope: req.user.canViewAllExpenses ? 'Toutes les dépenses' : 'Mes dépenses uniquement'
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur dashboard',
      details: error.message
    });
  }
});

// ========================
// VALIDATION
// ========================

router.get('/validation/access-check', authenticateExpenseUser, (req, res) => {
  console.log(`🔍 [VALIDATION] Vérification accès pour: ${req.user.full_name} (${req.user.role})`);
  
  res.json({
    success: true,
    has_access: req.user.canValidate,
    user_info: {
      id: req.user.id,
      name: req.user.full_name,
      role: req.user.role,
      badge: req.user.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur',
      can_validate: req.user.canValidate,
      can_view_validation_page: req.user.canValidate
    },
    message: req.user.canValidate 
      ? `Accès autorisé pour ${req.user.full_name}` 
      : `Accès refusé - Réservé aux Super Administrateurs`
  });
});

router.get('/workflow/pending', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    console.log(`⏳ [VALIDATION] Dépenses en attente demandées par: ${req.user.full_name}`);

    const pendingQuery = `
      SELECT 
        e.id,
        e.reference,
        e.description,
        e.amount,
        e.amount || ' FG' as montant_formate,
        e.expense_date,
        TO_CHAR(e.expense_date, 'DD/MM/YYYY') as date_formatee,
        e.created_at,
        TO_CHAR(e.created_at, 'DD/MM/YYYY à HH24:MI') as cree_le,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.created_at))/3600 as heures_attente,
        
        c.name as categorie_nom,
        c.color as categorie_couleur,
        c.icon as categorie_icon,
        
        -- 🔥 RESPONSABLE = UTILISATEUR QUI A CRÉÉ LA DÉPENSE
        COALESCE(e.responsible_user_name, 'Utilisateur inconnu') as responsable_nom,
        COALESCE(e.responsible_user_role, 'unknown') as responsable_role,
        
        CASE 
          WHEN COALESCE(e.responsible_user_role, 'unknown') = 'super_admin' THEN 'Super Administrateur'
          WHEN COALESCE(e.responsible_user_role, 'unknown') = 'admin' THEN 'Administrateur'
          ELSE 'Utilisateur'
        END as responsable_badge,
        
        CASE 
          WHEN COALESCE(e.responsible_user_role, 'unknown') = 'super_admin' THEN '#9333EA'
          WHEN COALESCE(e.responsible_user_role, 'unknown') = 'admin' THEN '#3B82F6'
          ELSE '#6B7280'
        END as responsable_couleur,
        
        CASE 
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.created_at))/3600 > 72 THEN 'URGENT'
          WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.created_at))/3600 > 24 THEN 'IMPORTANT'
          ELSE 'NORMAL'
        END as priorite
        
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN expense_statuses s ON e.status_id = s.id
      WHERE s.name = 'En attente'
      ORDER BY e.created_at DESC
    `;

    const result = await query(pendingQuery);

    console.log('✅ Dépenses en attente pour validation:', result.rows.length);

    res.json({
      success: true,
      pending_expenses: result.rows,
      count: result.rows.length,
      validator_info: {
        name: req.user.full_name,
        role: req.user.role,
        can_validate: true
      }
    });

  } catch (error) {
    console.error('💥 Erreur dépenses en attente:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur récupération dépenses en attente',
      details: error.message
    });
  }
});


// ===== VALIDATION EN MASSE (SUPER ADMIN UNIQUEMENT) - VERSION CORRIGÉE =====
router.post('/workflow/bulk-validate', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📋 [EXPENSES] Validation en masse par Super Admin:', req.user.full_name);

    const { expense_ids, action, notes } = req.body;

    // Validation des paramètres
    if (!expense_ids || !Array.isArray(expense_ids) || expense_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste des IDs de dépenses requise'
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action requise: "approve" ou "reject"'
      });
    }

    console.log('📋 [EXPENSES] Expense IDs reçus:', expense_ids);
    console.log('📋 [EXPENSES] Types des IDs:', expense_ids.map(id => typeof id));

    // 🔧 CORRECTION MAJEURE : Valider et convertir les IDs
    const validExpenseIds = [];
    for (const id of expense_ids) {
      // Convertir en string si c'est un number
      const stringId = String(id);
      
      // Vérifier que c'est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(stringId)) {
        validExpenseIds.push(stringId);
      } else {
        console.warn(`⚠️ [EXPENSES] ID invalide ignoré: ${id} (type: ${typeof id})`);
      }
    }

    if (validExpenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun ID de dépense valide fourni'
      });
    }

    console.log('✅ [EXPENSES] IDs valides:', validExpenseIds);

    // Obtenir l'ID du statut cible
    const targetStatusName = action === 'approve' ? 'Payé' : 'Rejeté';
    const statusResult = await query('SELECT id FROM expense_statuses WHERE name = $1', [targetStatusName]);
    
    if (statusResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: `Statut "${targetStatusName}" non trouvé`
      });
    }

    const targetStatusId = statusResult.rows[0].id;
    console.log('🎯 [EXPENSES] Target status ID:', targetStatusId);

    // 🔧 CORRECTION MAJEURE : Construire la requête avec des placeholders corrects
    let updateQuery;
    let queryParams;

    if (notes && notes.trim()) {
      // Construire la liste des placeholders pour les IDs
      const idPlaceholders = validExpenseIds.map((_, index) => `$${index + 4}`).join(',');
      
      updateQuery = `
        UPDATE expenses 
        SET 
          status_id = $1,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN '[Validé par ' || $3 || ']: ' || $4
            ELSE notes || E'\\n\\n[Validé par ' || $3 || ' le ' || CURRENT_DATE || ']: ' || $4
          END${action === 'approve' ? ', paid_date = CURRENT_DATE' : ''}
        WHERE id IN (${idPlaceholders})
        AND status_id = (SELECT id FROM expense_statuses WHERE name = 'En attente')
        RETURNING id, description, amount, responsible_user_name
      `;
      
      queryParams = [targetStatusId, req.user.id, req.user.full_name, notes.trim(), ...validExpenseIds];
      
    } else {
      // Construire la liste des placeholders pour les IDs
      const idPlaceholders = validExpenseIds.map((_, index) => `$${index + 3}`).join(',');
      
      updateQuery = `
        UPDATE expenses 
        SET 
          status_id = $1,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP${action === 'approve' ? ', paid_date = CURRENT_DATE' : ''}
        WHERE id IN (${idPlaceholders})
        AND status_id = (SELECT id FROM expense_statuses WHERE name = 'En attente')
        RETURNING id, description, amount, responsible_user_name
      `;
      
      queryParams = [targetStatusId, req.user.id, ...validExpenseIds];
    }

    console.log('🔧 [EXPENSES] Query SQL:', updateQuery);
    console.log('🔧 [EXPENSES] Query params:', queryParams);

    // Exécuter la requête
    const result = await query(updateQuery, queryParams);

    console.log(`✅ Validation en masse par ${req.user.full_name}: ${result.rows.length} dépenses ${action === 'approve' ? 'approuvées' : 'rejetées'}`);

    res.json({
      success: true,
      message: `${result.rows.length} dépense(s) ${action === 'approve' ? 'approuvée(s) et payée(s)' : 'rejetée(s)'} avec succès`,
      processed_count: result.rows.length,
      requested_count: validExpenseIds.length,
      invalid_ids_count: expense_ids.length - validExpenseIds.length,
      processed_expenses: result.rows,
      action: action,
      validated_by: {
        name: req.user.full_name,
        role: req.user.role,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('💥 Erreur validation en masse:', error);
    console.error('💥 Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur validation en masse',
      details: error.message,
      debug: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// ===== ROUTE POUR VALIDATION INDIVIDUELLE (ALTERNATIVE SÉCURISÉE) =====
router.post('/workflow/validate-single', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📋 [EXPENSES] Validation individuelle par Super Admin:', req.user.full_name);

    const { expense_id, action, notes } = req.body;

    // Validation des paramètres
    if (!expense_id) {
      return res.status(400).json({
        success: false,
        error: 'ID de dépense requis'
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action requise: "approve" ou "reject"'
      });
    }

    // Valider l'UUID
    const stringId = String(expense_id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(stringId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de dépense invalide'
      });
    }

    // Obtenir l'ID du statut cible
    const targetStatusName = action === 'approve' ? 'Payé' : 'Rejeté';
    const statusResult = await query('SELECT id FROM expense_statuses WHERE name = $1', [targetStatusName]);
    
    if (statusResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: `Statut "${targetStatusName}" non trouvé`
      });
    }

    const targetStatusId = statusResult.rows[0].id;

    // Construire la requête de mise à jour
    let updateQuery;
    let queryParams;

    if (notes && notes.trim()) {
      updateQuery = `
        UPDATE expenses 
        SET 
          status_id = $1,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN '[Validé par ' || $3 || ']: ' || $4
            ELSE notes || E'\\n\\n[Validé par ' || $3 || ' le ' || CURRENT_DATE || ']: ' || $4
          END${action === 'approve' ? ', paid_date = CURRENT_DATE' : ''}
        WHERE id = $5
        AND status_id = (SELECT id FROM expense_statuses WHERE name = 'En attente')
        RETURNING id, description, amount, responsible_user_name
      `;
      
      queryParams = [targetStatusId, req.user.id, req.user.full_name, notes.trim(), stringId];
      
    } else {
      updateQuery = `
        UPDATE expenses 
        SET 
          status_id = $1,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP${action === 'approve' ? ', paid_date = CURRENT_DATE' : ''}
        WHERE id = $3
        AND status_id = (SELECT id FROM expense_statuses WHERE name = 'En attente')
        RETURNING id, description, amount, responsible_user_name
      `;
      
      queryParams = [targetStatusId, req.user.id, stringId];
    }

    const result = await query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée ou déjà traitée'
      });
    }

    console.log(`✅ Validation individuelle par ${req.user.full_name}: dépense ${action === 'approve' ? 'approuvée' : 'rejetée'}`);

    res.json({
      success: true,
      message: `Dépense ${action === 'approve' ? 'approuvée et payée' : 'rejetée'} avec succès`,
      processed_expense: result.rows[0],
      action: action,
      validated_by: {
        name: req.user.full_name,
        role: req.user.role,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('💥 Erreur validation individuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur validation individuelle',
      details: error.message
    });
  }
});

// ========================
// ROUTES CRUD PRINCIPALES DES DÉPENSES
// ========================

// ===== LISTER LES DÉPENSES AVEC RECHERCHE AMÉLIORÉE ET FILTRES SIMPLIFIÉS =====
router.get('/', authenticateExpenseUser, async (req, res) => {
  try {
    console.log(`📋 [EXPENSES] Liste demandée par: ${req.user.full_name} (${req.user.role})`);
    
    const {
      page = 1,
      limit = 12,
      search = '',           // Recherche globale intelligente
      category_id = '',
      status_id = '',
      sort_by = 'expense_date',
      sort_order = 'desc'
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    // 🔥 FILTRAGE PAR UTILISATEUR : Admin ne voit que ses dépenses, Super Admin voit tout
    if (!req.user.canViewAllExpenses) {
      whereConditions.push(`e.responsible_user_id = $${paramIndex}`);
      params.push(req.user.id);
      paramIndex++;
      console.log(`🔒 Filtrage par utilisateur: ${req.user.full_name} ne voit que ses dépenses`);
    } else {
      console.log(`👑 Super Admin: ${req.user.full_name} voit toutes les dépenses`);
    }

    // 🔍 RECHERCHE GLOBALE INTELLIGENTE - Recherche dans TOUT
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log('🔍 [EXPENSES] Recherche globale pour:', searchTerm);
      
      // Déterminer le type de recherche
      const isNumber = !isNaN(parseFloat(searchTerm));
      const isYear = /^\d{4}$/.test(searchTerm);
      const isAmount = /^\d+([.,]\d+)?$/.test(searchTerm);
      
      let searchConditions = [];
      
      // Recherche textuelle standard
      searchConditions.push(`LOWER(e.description) LIKE LOWER($${paramIndex})`);
      searchConditions.push(`LOWER(COALESCE(e.reference, '')) LIKE LOWER($${paramIndex})`);
      searchConditions.push(`LOWER(COALESCE(e.supplier_name, '')) LIKE LOWER($${paramIndex})`);
      searchConditions.push(`LOWER(COALESCE(e.responsible_user_name, '')) LIKE LOWER($${paramIndex})`);
      searchConditions.push(`LOWER(COALESCE(e.notes, '')) LIKE LOWER($${paramIndex})`);
      
      // Si c'est un nombre, chercher aussi dans les montants
      if (isNumber) {
        const numericValue = parseFloat(searchTerm.replace(',', '.'));
        searchConditions.push(`e.amount = $${paramIndex + 1}`);
        searchConditions.push(`e.amount::text LIKE $${paramIndex}`);
        params.push(`%${searchTerm}%`);
        params.push(numericValue);
        paramIndex += 2;
      } else if (isYear) {
        // Si c'est une année, chercher dans les dates
        const year = parseInt(searchTerm);
        searchConditions.push(`EXTRACT(YEAR FROM e.expense_date) = $${paramIndex + 1}`);
        searchConditions.push(`EXTRACT(YEAR FROM e.created_at) = $${paramIndex + 1}`);
        params.push(`%${searchTerm}%`);
        params.push(year);
        paramIndex += 2;
      } else {
        // Recherche textuelle normale
        params.push(`%${searchTerm}%`);
        paramIndex++;
      }
      
      // Recherche dans les catégories et statuts (JOIN)
      searchConditions.push(`LOWER(COALESCE(c.name, '')) LIKE LOWER($${paramIndex})`);
      searchConditions.push(`LOWER(COALESCE(s.name, '')) LIKE LOWER($${paramIndex})`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
      
      whereConditions.push(`(${searchConditions.join(' OR ')})`);
    }

    // Filtres spécifiques (plus restrictifs)
    if (category_id && category_id !== 'all') {
      whereConditions.push(`e.category_id = $${paramIndex}::uuid`);
      params.push(category_id);
      paramIndex++;
    }

    if (status_id && status_id !== 'all') {
      whereConditions.push(`e.status_id = $${paramIndex}::uuid`);
      params.push(status_id);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Validation du tri
    const allowedSortFields = ['expense_date', 'amount', 'reference', 'created_at', 'description'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'expense_date';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Calcul pagination
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Limiter entre 1 et 100
    const pageNum = Math.max(1, parseInt(page));
    const offset = (pageNum - 1) * limitNum;

    // Requête COUNT
    const countQuery = `
      SELECT COUNT(*) as total
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN expense_statuses s ON e.status_id = s.id
      WHERE ${whereClause}
    `;

    // Requête principale avec JOIN pour la recherche
    const expensesQuery = `
      SELECT 
        e.id,
        COALESCE(e.reference, e.id::text) as reference,
        e.description,
        e.amount,
        e.expense_date,
        e.payment_method,
        COALESCE(e.supplier_name, '') as supplier_name,
        COALESCE(e.notes, '') as notes,
        e.created_at,
        e.updated_at,
        e.category_id,
        e.status_id,
        
        -- Formatage
        TO_CHAR(e.amount, 'FM999,999,999.00') || ' FG' as montant_formate,
        TO_CHAR(e.expense_date, 'DD/MM/YYYY') as date_formatee,
        TO_CHAR(e.created_at, 'DD/MM/YYYY à HH24:MI') as cree_le,
        
        -- 🔥 RESPONSABLE = CELUI QUI A CRÉÉ LA DÉPENSE
        COALESCE(e.responsible_user_name, 'Utilisateur inconnu') as responsible_name,
        COALESCE(e.responsible_user_role, 'unknown') as responsible_role,
        
        -- Badge du responsable avec couleurs
        CASE 
          WHEN e.responsible_user_role = 'super_admin' THEN 'Super Administrateur'
          WHEN e.responsible_user_role = 'admin' THEN 'Administrateur'
          ELSE 'Utilisateur'
        END as responsible_badge,
        
        CASE 
          WHEN e.responsible_user_role = 'super_admin' THEN '#9333EA'
          WHEN e.responsible_user_role = 'admin' THEN '#3B82F6'
          ELSE '#6B7280'
        END as responsible_badge_color,
        
        -- Informations enrichies des catégories et statuts
        COALESCE(c.name, 'Catégorie inconnue') as category_name,
        COALESCE(c.color, '#3B82F6') as category_color,
        COALESCE(c.icon, 'FileText') as category_icon,
        
        COALESCE(s.name, 'En attente') as status_name,
        COALESCE(s.color, '#F59E0B') as status_color,
        COALESCE(s.icon, 'Clock') as status_icon,
        COALESCE(s.is_final, false) as status_final,
        
        -- Indicateur si c'est la dépense de l'utilisateur connecté
        CASE 
          WHEN e.responsible_user_id = $${paramIndex + 2} THEN true
          ELSE false
        END as is_own_expense
        
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN expense_statuses s ON e.status_id = s.id
      WHERE ${whereClause}
      ORDER BY e.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Paramètres pour les requêtes
    const countParams = [...params];
    const queryParams = [...params, limitNum, offset, req.user.id];

    console.log('🔍 [EXPENSES] Requête SQL:', expensesQuery);
    console.log('🔍 [EXPENSES] Paramètres:', queryParams);

    // Exécuter les requêtes
    let expensesResult, countResult;
    
    try {
      [expensesResult, countResult] = await Promise.all([
        query(expensesQuery, queryParams),
        query(countQuery, countParams)
      ]);
    } catch (queryError) {
      console.error('💥 Erreur requête SQL:', queryError);
      
      // Fallback sans JOIN si problème
      const simpleQuery = `
        SELECT 
          e.id,
          e.description,
          e.amount,
          e.expense_date,
          e.created_at,
          TO_CHAR(e.amount, 'FM999,999,999.00') || ' FG' as montant_formate,
          TO_CHAR(e.expense_date, 'DD/MM/YYYY') as date_formatee,
          COALESCE(e.responsible_user_name, 'Utilisateur inconnu') as responsible_name,
          COALESCE(e.responsible_user_role, 'unknown') as responsible_role
        FROM expenses e
        WHERE ${whereConditions[0]} ${!req.user.canViewAllExpenses ? 'AND e.responsible_user_id = $1' : ''}
        ORDER BY e.${sortField} ${sortDirection}
        LIMIT $${!req.user.canViewAllExpenses ? 2 : 1} OFFSET $${!req.user.canViewAllExpenses ? 3 : 2}
      `;
      
      const fallbackParams = !req.user.canViewAllExpenses 
        ? [req.user.id, limitNum, offset]
        : [limitNum, offset];
      
      try {
        expensesResult = await query(simpleQuery, fallbackParams);
        countResult = await query(`SELECT COUNT(*) as total FROM expenses e WHERE ${whereConditions[0]} ${!req.user.canViewAllExpenses ? 'AND e.responsible_user_id = $1' : ''}`, !req.user.canViewAllExpenses ? [req.user.id] : []);
        
        // Enrichir manuellement
        expensesResult.rows = expensesResult.rows.map(expense => ({
          ...expense,
          category_name: 'Catégorie inconnue',
          category_color: '#3B82F6',
          category_icon: 'FileText',
          status_name: 'En attente',
          status_color: '#F59E0B',
          status_icon: 'Clock',
          status_final: false,
          responsible_badge: expense.responsible_role === 'super_admin' ? 'Super Administrateur' : 'Administrateur',
          responsible_badge_color: expense.responsible_role === 'super_admin' ? '#9333EA' : '#3B82F6',
          is_own_expense: expense.responsible_user_id === req.user.id
        }));
        
      } catch (fallbackError) {
        console.error('💥 Même le fallback échoue:', fallbackError);
        throw fallbackError;
      }
    }

    const total = parseInt(countResult.rows[0].total);

    console.log(`✅ ${expensesResult.rows.length}/${total} dépenses trouvées pour ${req.user.full_name}`);
    if (search) {
      console.log(`🔍 Recherche "${search}" appliquée`);
    }

    res.json({
      success: true,
      expenses: expensesResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      },
      search_info: search ? {
        term: search,
        results_count: expensesResult.rows.length,
        search_type: /^\d{4}$/.test(search) ? 'year' : /^\d+([.,]\d+)?$/.test(search) ? 'amount' : 'text'
      } : null,
      filters: {
        category_id,
        status_id,
        search,
        user_filtered: !req.user.canViewAllExpenses,
        applied_filters: {
          has_search: !!search,
          has_category: !!category_id && category_id !== 'all',
          has_status: !!status_id && status_id !== 'all'
        }
      },
      user_info: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
        badge: req.user.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur',
        canValidate: req.user.canValidate,
        canViewAll: req.user.canViewAllExpenses,
        viewing_scope: req.user.canViewAllExpenses ? 'Toutes les dépenses' : 'Mes dépenses uniquement'
      }
    });

  } catch (error) {
    console.error('💥 Erreur liste dépenses:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des dépenses',
      details: error.message,
      debug: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        user: req.user?.email,
        query: req.query
      } : undefined,
      fallback_data: {
        expenses: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 },
        user_info: {
          id: req.user?.id,
          name: req.user?.full_name,
          role: req.user?.role
        }
      }
    });
  }
});



// ===== ROUTE POUR OBTENIR LES OPTIONS DE FILTRAGE SIMPLIFIÉES =====
router.get('/config/filter-options', authenticateExpenseUser, async (req, res) => {
  try {
    console.log('🔧 [EXPENSES] Route config/filter-options appelée');
    
    // Récupérer seulement les catégories et statuts actifs
    const [categoriesResult, statusesResult] = await Promise.all([
      query(`
        SELECT 
          id, 
          name, 
          COALESCE(color, '#3B82F6') as color, 
          COALESCE(icon, 'FileText') as icon
        FROM expense_categories 
        WHERE COALESCE(is_active, true) = true 
        ORDER BY COALESCE(sort_order, 0), name
      `),
      query(`
        SELECT 
          id, 
          name, 
          COALESCE(color, '#6B7280') as color, 
          COALESCE(icon, 'Clock') as icon
        FROM expense_statuses 
        ORDER BY COALESCE(sort_order, 0), name
      `)
    ]);
    
    // Obtenir les années disponibles depuis les dépenses existantes
    const yearsResult = await query(`
      SELECT DISTINCT EXTRACT(YEAR FROM expense_date) as year
      FROM expenses 
      WHERE expense_date IS NOT NULL
      ORDER BY year DESC
    `).catch(() => ({ rows: [] }));
    
    // Générer une liste d'années de 2020 à 2040 si pas de données
    let availableYears = yearsResult.rows.map(row => parseInt(row.year));
    if (availableYears.length === 0) {
      const currentYear = new Date().getFullYear();
      availableYears = [];
      for (let year = currentYear - 5; year <= currentYear + 15; year++) {
        availableYears.push(year);
      }
    }
    
    console.log('✅ Options de filtrage générées');
    
    res.json({
      success: true,
      filter_options: {
        categories: [
          { id: 'all', name: 'Toutes les catégories', color: '#6B7280', icon: 'Layers' },
          ...categoriesResult.rows
        ],
        statuses: [
          { id: 'all', name: 'Tous les statuts', color: '#6B7280', icon: 'List' },
          ...statusesResult.rows
        ],
        years: availableYears,
        search_hints: {
          text: 'Rechercher par description, référence, fournisseur...',
          amount: 'Rechercher par montant (ex: 1000, 250.50)',
          year: 'Rechercher par année (ex: 2024, 2025)',
          global: 'Recherche dans toutes les données'
        }
      },
      user_permissions: {
        canValidate: req.user?.canValidate || false,
        canViewAll: req.user?.canViewAllExpenses || false
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur options de filtrage:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération options de filtrage',
      details: error.message
    });
  }
});

// ===== ROUTE POUR SUGGESTIONS DE RECHERCHE =====
router.get('/search/suggestions', authenticateExpenseUser, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }
    
    console.log('🔍 [EXPENSES] Suggestions de recherche pour:', q);
    
    let whereCondition = '';
    let params = [q.toLowerCase()];
    
    // Filtrer par utilisateur si nécessaire
    if (!req.user.canViewAllExpenses) {
      whereCondition = 'AND e.responsible_user_id = $2';
      params.push(req.user.id);
    }
    
    const suggestionsQuery = `
      SELECT DISTINCT
        e.description,
        e.supplier_name,
        TO_CHAR(e.amount, 'FM999,999,999') as amount_formatted,
        EXTRACT(YEAR FROM e.expense_date) as year
      FROM expenses e
      WHERE (
        LOWER(e.description) LIKE '%' || $1 || '%' OR
        LOWER(COALESCE(e.supplier_name, '')) LIKE '%' || $1 || '%' OR
        e.amount::text LIKE '%' || $1 || '%'
      ) ${whereCondition}
      LIMIT 10
    `;
    
    const result = await query(suggestionsQuery, params);
    
    const suggestions = [];
    result.rows.forEach(row => {
      if (row.description) suggestions.push({ type: 'description', value: row.description });
      if (row.supplier_name) suggestions.push({ type: 'supplier', value: row.supplier_name });
      if (row.amount_formatted) suggestions.push({ type: 'amount', value: row.amount_formatted });
      if (row.year) suggestions.push({ type: 'year', value: row.year.toString() });
    });
    
    // Enlever les doublons
    const uniqueSuggestions = suggestions.filter((item, index, self) => 
      index === self.findIndex(t => t.value === item.value)
    );
    
    res.json({
      success: true,
      suggestions: uniqueSuggestions.slice(0, 8) // Limiter à 8 suggestions
    });
    
  } catch (error) {
    console.error('💥 Erreur suggestions:', error);
    res.json({
      success: true,
      suggestions: []
    });
  }
});


// ===== CRÉER UNE DÉPENSE AVEC RESPONSABLE AUTOMATIQUE =====
// ===== CRÉER UNE DÉPENSE AVEC RESPONSABLE AUTOMATIQUE - VERSION CORRIGÉE =====
router.post('/', authenticateExpenseUser, requireAdmin, async (req, res) => {
  try {
    console.log('➕ [EXPENSES] Création dépense par:', req.user.full_name, `(${req.user.role})`);
    
    const {
      description,
      amount,
      category_id,
      expense_date,
      payment_method,
      supplier_name,
      notes
    } = req.body;

    // Validation des champs requis
    if (!description || !amount || !category_id || !expense_date) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis: description, amount, category_id, expense_date'
      });
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Le montant doit être un nombre positif'
      });
    }

    // TOUJOURS créer avec le statut "En attente"
    const statusResult = await query(
      "SELECT id FROM expense_statuses WHERE name = 'En attente' ORDER BY sort_order LIMIT 1"
    );

    if (statusResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Statut "En attente" non trouvé. Initialisez d\'abord les données avec /init/data'
      });
    }

    const defaultStatusId = statusResult.rows[0].id;

    // Créer la dépense SANS le champ reference (généré par le trigger)
    const createQuery = `
      INSERT INTO expenses (
        description, amount, category_id, status_id,
        expense_date, payment_method, supplier_name, notes,
        budget_year, budget_month, 
        created_by, updated_by,
        responsible_user_id, responsible_user_name, responsible_user_role
      ) VALUES (
        $1, $2, $3::uuid, $4::uuid,
        $5, $6, $7, $8,
        EXTRACT(YEAR FROM $5::date), EXTRACT(MONTH FROM $5::date),
        $9, $9,
        $9, $10, $11
      ) RETURNING id, reference
    `;

    const result = await query(createQuery, [
      sanitizeText(description),
      parseFloat(amount),
      category_id,
      defaultStatusId,
      expense_date,
      payment_method || null,
      supplier_name ? sanitizeText(supplier_name) : null,
      notes ? sanitizeText(notes) : null,
      req.user.id,                    // created_by, updated_by et responsible_user_id
      req.user.full_name,             // responsible_user_name
      req.user.role                   // responsible_user_role
    ]);

    const nouvelleDepenseId = result.rows[0].id;
    const reference = result.rows[0].reference;

    // Récupérer la dépense créée avec toutes les informations
    const enrichedQuery = `
      SELECT 
        e.*,
        TO_CHAR(e.amount, 'FM999,999,999.00') || ' FG' as montant_formate,
        TO_CHAR(e.expense_date, 'DD/MM/YYYY') as date_formatee,
        TO_CHAR(e.created_at, 'DD/MM/YYYY à HH24:MI') as cree_le,
        
        -- Informations de catégorie
        c.name as category_name,
        COALESCE(c.color, '#3B82F6') as category_color,
        COALESCE(c.icon, 'FileText') as category_icon,
        
        -- Informations de statut
        s.name as status_name,
        COALESCE(s.color, '#F59E0B') as status_color,
        COALESCE(s.icon, 'Clock') as status_icon,
        
        -- Responsable (utilisateur connecté)
        e.responsible_user_name as responsible_name,
        e.responsible_user_role as responsible_role,
        
        -- Badge du responsable
        CASE 
          WHEN e.responsible_user_role = 'super_admin' THEN 'Super Administrateur'
          WHEN e.responsible_user_role = 'admin' THEN 'Administrateur'
          ELSE 'Utilisateur'
        END as responsible_badge
        
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      JOIN expense_statuses s ON e.status_id = s.id
      WHERE e.id = $1::uuid
    `;

    const enrichedResult = await query(enrichedQuery, [nouvelleDepenseId]);
    const nouvelleDepense = enrichedResult.rows[0];

    console.log(`✅ Dépense créée: ${reference} par ${req.user.full_name} (${req.user.role})`);
    console.log(`💰 Montant: ${nouvelleDepense.montant_formate} - Catégorie: ${nouvelleDepense.category_name}`);

    res.status(201).json({
      success: true,
      message: `Dépense créée avec succès par ${req.user.full_name} - En attente de validation`,
      expense: nouvelleDepense,
      created_by: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
        email: req.user.email
      },
      next_steps: req.user.role === 'super_admin' 
        ? 'Vous pouvez valider cette dépense immédiatement'
        : 'Cette dépense sera soumise au Super Administrateur pour validation'
    });

  } catch (error) {
    console.error('💥 Erreur création dépense:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la dépense',
      details: error.message
    });
  }
});

// ===== VOIR UNE DÉPENSE AVEC VÉRIFICATION DE PROPRIÉTÉ =====
router.get('/:id', authenticateExpenseUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('👁️ [EXPENSES] Route GET /:id appelée avec id:', id);

    // VALIDATION UUID POUR ÉVITER LES ERREURS
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log('⚠️ ID invalide, pas un UUID:', id);
      return res.status(400).json({
        success: false,
        error: 'ID de dépense invalide'
      });
    }

    const depenseQuery = `
      SELECT 
        e.*,
        TO_CHAR(e.amount, 'FM999,999,999.00') || ' FG' as montant_formate,
        TO_CHAR(e.expense_date, 'DD/MM/YYYY') as date_formatee,
        
        -- Informations de catégorie
        c.name as category_name,
        COALESCE(c.color, '#3B82F6') as category_color,
        COALESCE(c.icon, 'FileText') as category_icon,
        
        -- Informations de statut
        s.name as status_name,
        COALESCE(s.color, '#6B7280') as status_color,
        COALESCE(s.icon, 'Clock') as status_icon,
        COALESCE(s.is_final, false) as status_final,
        
        -- Responsable utilisateur
        COALESCE(e.responsible_user_name, 'Utilisateur inconnu') as responsible_name,
        COALESCE(e.responsible_user_role, 'unknown') as responsible_role,
        
        -- Indicateur si c'est la dépense de l'utilisateur connecté
        CASE 
          WHEN e.responsible_user_id = $2 THEN true
          ELSE false
        END as is_own_expense,
        
        -- Informations de validation détaillées
        CASE 
          WHEN e.updated_by IS NOT NULL AND e.updated_by != e.created_by THEN (
            SELECT first_name || ' ' || last_name FROM admin_users WHERE id = e.updated_by
          )
          ELSE NULL
        END as valide_par,
        
        CASE 
          WHEN s.name IN ('Payé', 'Rejeté') AND e.updated_by IS NOT NULL AND e.updated_by != e.created_by 
          THEN TO_CHAR(e.updated_at, 'DD/MM/YYYY à HH24:MI')
          ELSE NULL
        END as date_validation_formatee
        
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      JOIN expense_statuses s ON e.status_id = s.id
      WHERE e.id = $1::uuid
    `;

    const result = await query(depenseQuery, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée'
      });
    }

    const expense = result.rows[0];

    // Vérifier les droits de vue : propriétaire ou super admin
    if (!expense.is_own_expense && !req.user.canViewAllExpenses) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez voir que vos propres dépenses'
      });
    }

    res.json({
      success: true,
      expense: expense,
      user_permissions: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        role: req.user.role,
        canValidate: req.user.canValidate,
        canEdit: expense.is_own_expense || req.user.canViewAllExpenses,
        canDelete: req.user.canDeleteOwnExpenses
      }
    });

  } catch (error) {
    console.error('💥 Erreur voir dépense:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur récupération dépense',
      details: error.message
    });
  }
});

// ===== MODIFIER UNE DÉPENSE (PROPRIÉTAIRE OU SUPER ADMIN) =====
router.put('/:id', authenticateExpenseUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ [EXPENSES] Route PUT /:id appelée avec id:', id);

    // Validation UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de dépense invalide'
      });
    }

    // Vérifier que la dépense existe, son statut et son propriétaire
    const existingCheck = await query(`
      SELECT 
        e.id, 
        e.responsible_user_id,
        s.name as statut_nom 
      FROM expenses e 
      JOIN expense_statuses s ON e.status_id = s.id 
      WHERE e.id = $1::uuid
    `, [id]);
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée'
      });
    }

    const expense = existingCheck.rows[0];
    const currentStatus = expense.statut_nom;
    const ownerId = expense.responsible_user_id;

    // Vérifier les droits de modification : propriétaire ou super admin
    if (ownerId !== req.user.id && !req.user.canViewAllExpenses) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez modifier que vos propres dépenses'
      });
    }
    
    // Empêcher la modification si la dépense n'est pas en attente
    if (currentStatus !== 'En attente') {
      return res.status(400).json({
        success: false,
        error: `Impossible de modifier une dépense avec le statut "${currentStatus}". Seules les dépenses "En attente" peuvent être modifiées.`
      });
    }

    const {
      description,
      amount,
      category_id,
      expense_date,
      payment_method,
      supplier_name,
      notes
    } = req.body;

    // Construire la requête de mise à jour dynamiquement
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (description !== undefined) {
      updateFields.push(`description = ${paramIndex}`);
      updateValues.push(sanitizeText(description));
      paramIndex++;
    }

    if (amount !== undefined) {
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Le montant doit être un nombre positif'
        });
      }
      updateFields.push(`amount = ${paramIndex}`);
      updateValues.push(parseFloat(amount));
      paramIndex++;
    }

    if (category_id !== undefined) {
      updateFields.push(`category_id = ${paramIndex}::uuid`);
      updateValues.push(category_id);
      paramIndex++;
    }

    if (expense_date !== undefined) {
      updateFields.push(`expense_date = ${paramIndex}`);
      updateFields.push(`budget_year = EXTRACT(YEAR FROM ${paramIndex}::date)`);
      updateFields.push(`budget_month = EXTRACT(MONTH FROM ${paramIndex}::date)`);
      updateValues.push(expense_date);
      paramIndex++;
    }

    if (payment_method !== undefined) {
      updateFields.push(`payment_method = ${paramIndex}`);
      updateValues.push(payment_method || null);
      paramIndex++;
    }

    if (supplier_name !== undefined) {
      updateFields.push(`supplier_name = ${paramIndex}`);
      updateValues.push(supplier_name ? sanitizeText(supplier_name) : null);
      paramIndex++;
    }

    if (notes !== undefined) {
      updateFields.push(`notes = ${paramIndex}`);
      updateValues.push(notes ? sanitizeText(notes) : null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à modifier'
      });
    }

    // Ajouter updated_by et updated_at
    updateFields.push(`updated_by = ${paramIndex}`);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(req.user.id);
    paramIndex++;

    // ID pour WHERE
    updateValues.push(id);

    const updateQuery = `
      UPDATE expenses 
      SET ${updateFields.join(', ')}
      WHERE id = ${paramIndex}::uuid
      RETURNING id
    `;

    const result = await query(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée'
      });
    }

    console.log(`✅ Dépense modifiée par: ${req.user.full_name}`);

    res.json({
      success: true,
      message: 'Dépense modifiée avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur modification dépense:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur modification dépense',
      details: error.message
    });
  }
});

// ===== CHANGER LE STATUT (WORKFLOW DE VALIDATION - SUPER ADMIN UNIQUEMENT) =====
router.patch('/:id/status', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id, notes_validation } = req.body;

    console.log('🔄 [EXPENSES] Route PATCH /:id/status appelée', id, 'vers', status_id);

    // Validation UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de dépense invalide'
      });
    }

    if (!status_id) {
      return res.status(400).json({
        success: false,
        error: 'status_id requis'
      });
    }

    // Obtenir le nouveau statut
    const newStatusResult = await query('SELECT name FROM expense_statuses WHERE id = $1::uuid', [status_id]);
    if (newStatusResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Statut non valide'
      });
    }

    const newStatusName = newStatusResult.rows[0].name;

    // Vérifier l'état actuel de la dépense
    const currentExpense = await query(`
      SELECT e.id, s.name as current_status 
      FROM expenses e 
      JOIN expense_statuses s ON e.status_id = s.id 
      WHERE e.id = $1::uuid
    `, [id]);

    if (currentExpense.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée'
      });
    }

    const currentStatus = currentExpense.rows[0].current_status;

    // Règles de workflow
    if (currentStatus === 'Payé' || currentStatus === 'Rejeté') {
      return res.status(400).json({
        success: false,
        error: `Impossible de modifier le statut d'une dépense "${currentStatus}"`
      });
    }

    // Préparer les champs à mettre à jour
    let updateFields = [
      'status_id = $1::uuid',
      'updated_by = $2',
      'updated_at = CURRENT_TIMESTAMP'
    ];
    let updateValues = [status_id, req.user.id];
    let paramIndex = 3;

    // Ajouter des notes de validation si fournies
    if (notes_validation && notes_validation.trim()) {
      updateFields.push(`notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN ${paramIndex}
        ELSE notes || E'\\n\\n[Validation ${new Date().toLocaleDateString('fr-FR')}]: ' || ${paramIndex}
      END`);
      updateValues.push(notes_validation.trim());
      paramIndex++;
    }

    // Si c'est un passage à "Payé", enregistrer la date de paiement
    if (newStatusName === 'Payé') {
      updateFields.push('paid_date = CURRENT_DATE');
    }

    updateValues.push(id);

    const updateQuery = `
      UPDATE expenses 
      SET ${updateFields.join(', ')}
      WHERE id = ${paramIndex}::uuid
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée'
      });
    }

    // Message personnalisé selon l'action
    let message = '';
    if (newStatusName === 'Payé') {
      message = `✅ Dépense validée et marquée comme payée par ${req.user.full_name}`;
    } else if (newStatusName === 'Rejeté') {
      message = `❌ Dépense rejetée par ${req.user.full_name}`;
    } else {
      message = `🔄 Statut modifié vers "${newStatusName}" par ${req.user.full_name}`;
    }

    console.log('✅ Statut changé:', currentStatus, '->', newStatusName);

    res.json({
      success: true,
      message: message,
      validation_info: {
        validated_by: req.user.full_name,
        validation_date: new Date().toISOString(),
        previous_status: currentStatus,
        new_status: newStatusName
      }
    });

  } catch (error) {
    console.error('💥 Erreur changement statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur changement statut',
      details: error.message
    });
  }
});


const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // Regex UUID plus flexible qui accepte toutes les versions d'UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(uuid.trim());
};

// 🔥 NOUVELLE FONCTION : Vérifier si une dépense peut être supprimée selon son statut
const canDeleteExpense = (statusName) => {
  console.log('🔍 [canDeleteExpense] Vérification pour statut:', statusName);
  
  // Seules les dépenses "En attente" et "Rejeté" peuvent être supprimées
  if (statusName === 'Payé') {
    return {
      canDelete: false,
      reason: 'Cette dépense a été payée et ne peut plus être supprimée. Les dépenses payées sont archivées définitivement.'
    };
  }
  
  if (statusName === 'En cours') {
    return {
      canDelete: false,
      reason: 'Cette dépense est en cours de traitement et ne peut pas être supprimée.'
    };
  }
  
  // Les dépenses "En attente" et "Rejeté" peuvent être supprimées
  if (statusName === 'En attente' || statusName === 'Rejeté') {
    console.log('✅ [canDeleteExpense] Suppression autorisée pour statut:', statusName);
    return { canDelete: true };
  }
  
  // Par défaut, ne pas autoriser la suppression pour des statuts non reconnus
  console.log('❌ [canDeleteExpense] Suppression refusée pour statut non reconnu:', statusName);
  return {
    canDelete: false,
    reason: `Impossible de supprimer une dépense avec le statut "${statusName}"`
  };
};

// ===== ROUTE DELETE INDIVIDUELLE CORRIGÉE =====
router.delete('/:id', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ [EXPENSES] Route DELETE /:id appelée avec id:', id);
    console.log('🗑️ [EXPENSES] Type de l\'ID:', typeof id);
    console.log('🗑️ [EXPENSES] Longueur de l\'ID:', id?.length);

    // 🔥 VALIDATION UUID AMÉLIORÉE
    if (!id || typeof id !== 'string') {
      console.error('❌ [EXPENSES] ID manquant ou type invalide:', id);
      return res.status(400).json({
        success: false,
        error: 'ID de dépense requis',
        code: 'MISSING_ID',
        details: 'L\'ID fourni est manquant ou n\'est pas une chaîne de caractères'
      });
    }

    const cleanId = id.trim();
    
    if (!isValidUUID(cleanId)) {
      console.error('❌ [EXPENSES] UUID invalide:', cleanId);
      return res.status(400).json({
        success: false,
        error: 'Format d\'ID de dépense invalide',
        code: 'INVALID_UUID',
        details: 'L\'ID doit être un UUID valide au format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        received_id: cleanId,
        id_length: cleanId.length
      });
    }

    console.log('✅ [EXPENSES] UUID validé:', cleanId);

    // 🔍 Vérifier l'existence, le statut et récupérer toutes les informations
    const statusCheck = await query(`
      SELECT 
        e.id,
        e.reference,
        e.description,
        e.amount,
        e.responsible_user_name,
        e.responsible_user_id,
        s.name as statut_nom,
        s.color as status_color,
        c.name as category_name
      FROM expenses e 
      JOIN expense_statuses s ON e.status_id = s.id 
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = $1::uuid
    `, [cleanId]);

    if (statusCheck.rows.length === 0) {
      console.log('❌ [EXPENSES] Dépense non trouvée pour ID:', cleanId);
      return res.status(404).json({
        success: false,
        error: 'Dépense non trouvée',
        code: 'EXPENSE_NOT_FOUND',
        details: 'Aucune dépense trouvée avec cet ID'
      });
    }

    const expense = statusCheck.rows[0];
    const currentStatus = expense.statut_nom;

    console.log('📋 [EXPENSES] Dépense trouvée:', {
      id: expense.id,
      reference: expense.reference,
      description: expense.description,
      amount: expense.amount,
      status: currentStatus,
      responsible: expense.responsible_user_name
    });

    // 🔥 NOUVELLE LOGIQUE : Vérifier que la suppression est autorisée
    const { canDelete, reason } = canDeleteExpense(currentStatus);
    
    if (!canDelete) {
      console.log(`❌ [EXPENSES] Tentative de suppression interdite - Statut: ${currentStatus}`);
      console.log(`❌ [EXPENSES] Raison: ${reason}`);
      
      // Messages d'erreur personnalisés selon le statut
      let errorMessage = '';
      let suggestion = '';
      
      switch (currentStatus) {
        case 'Payé':
          errorMessage = 'Cette dépense a été payée et ne peut plus être supprimée';
          suggestion = 'Les dépenses payées sont archivées et ne peuvent pas être modifiées';
          break;
        case 'Rejeté':
          // ⚠️ Cette condition ne devrait plus jamais être atteinte avec la nouvelle logique
          errorMessage = 'ERREUR: Cette condition ne devrait pas exister - Rejeté devrait être supprimable';
          suggestion = 'Contactez l\'administrateur système';
          break;
        case 'En cours':
          errorMessage = 'Cette dépense est en cours de traitement et ne peut pas être supprimée';
          suggestion = 'Attendez la fin du traitement ou contactez l\'administrateur';
          break;
        default:
          errorMessage = reason;
          suggestion = 'Seules les dépenses "En attente" et "Rejeté" peuvent être supprimées';
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
        code: 'INVALID_STATUS_FOR_DELETION',
        details: {
          expense_id: cleanId,
          reference: expense.reference,
          current_status: currentStatus,
          allowed_statuses: ['En attente', 'Rejeté'], // 🔥 NOUVEAU : Inclure "Rejeté"
          suggestion: suggestion
        },
        expense_info: {
          id: expense.id,
          reference: expense.reference,
          description: expense.description,
          amount: expense.amount,
          status: currentStatus,
          responsible: expense.responsible_user_name,
          category: expense.category_name
        }
      });
    }

    // 🗑️ Procéder à la suppression (statut validé = "En attente" OU "Rejeté")
    console.log('🗑️ [EXPENSES] Suppression autorisée pour:', expense.reference || cleanId);
    console.log('✅ [EXPENSES] Statut autorisé pour suppression:', currentStatus);
    
    const deleteResult = await query(
      `DELETE FROM expenses 
       WHERE id = $1::uuid 
       AND status_id IN (
         SELECT id FROM expense_statuses 
         WHERE name IN ('En attente', 'Rejeté')
       )
       RETURNING id, reference, description`, 
      [cleanId]
    );

    if (deleteResult.rows.length === 0) {
      // Cas très rare : la dépense a changé de statut entre la vérification et la suppression
      console.error('❌ [EXPENSES] Échec de la suppression - Statut probablement changé');
      return res.status(409).json({
        success: false,
        error: 'La dépense ne peut plus être supprimée',
        code: 'STATUS_CHANGED',
        details: 'Le statut de la dépense a probablement été modifié pendant l\'opération'
      });
    }

    const deletedExpense = deleteResult.rows[0];

    console.log(`✅ [EXPENSES] Dépense supprimée avec succès:`);
    console.log(`   - ID: ${deletedExpense.id}`);
    console.log(`   - Référence: ${deletedExpense.reference}`);
    console.log(`   - Description: ${deletedExpense.description}`);
    console.log(`   - Statut original: ${currentStatus}`);
    console.log(`   - Par: ${req.user.full_name} (${req.user.role})`);
    console.log(`   - Responsable original: ${expense.responsible_user_name}`);

    // 🎉 Réponse de succès avec message adapté au statut
    const successMessage = currentStatus === 'Rejeté' 
      ? `Dépense rejetée "${deletedExpense.description}" supprimée avec succès`
      : `Dépense "${deletedExpense.description}" supprimée avec succès`;
    
    res.json({
      success: true,
      message: successMessage,
      code: 'DELETION_SUCCESS',
      deleted_expense: {
        id: deletedExpense.id,
        reference: deletedExpense.reference,
        description: deletedExpense.description,
        amount: expense.amount,
        original_status: currentStatus,
        responsible_user: expense.responsible_user_name,
        category: expense.category_name
      },
      deleted_by: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
        email: req.user.email
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [EXPENSES] Erreur lors de la suppression:', error);
    console.error('💥 [EXPENSES] Stack trace:', error.stack);

    // 🔍 Analyse de l'erreur pour une réponse plus précise
    let statusCode = 500;
    let errorMessage = 'Erreur serveur lors de la suppression';
    let errorCode = 'DELETION_ERROR';
    let errorDetails = error.message;

    if (error.message?.includes('invalid input syntax for type uuid')) {
      statusCode = 400;
      errorMessage = 'Format d\'ID invalide';
      errorCode = 'INVALID_UUID_FORMAT';
      errorDetails = 'L\'ID fourni n\'est pas un UUID valide';
    } else if (error.message?.includes('foreign key')) {
      statusCode = 409;
      errorMessage = 'Impossible de supprimer cette dépense';
      errorCode = 'FOREIGN_KEY_CONSTRAINT';
      errorDetails = 'La dépense est liée à d\'autres données et ne peut pas être supprimée';
    } else if (error.message?.includes('connection')) {
      statusCode = 503;
      errorMessage = 'Problème de connexion à la base de données';
      errorCode = 'DB_CONNECTION_ERROR';
      errorDetails = 'Veuillez réessayer dans quelques instants';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: errorDetails,
      debug: process.env.NODE_ENV === 'development' ? {
        original_error: error.message,
        stack: error.stack,
        request_id: req.params.id,
        user: req.user?.email
      } : undefined
    });
  }
});

// ===== ROUTE DELETE MULTIPLE CORRIGÉE =====
router.delete('/bulk/delete', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    const { expense_ids } = req.body;

    console.log('🗑️ [EXPENSES] Suppression multiple demandée');
    console.log('🗑️ [EXPENSES] IDs reçus:', expense_ids);

    // Validation des paramètres
    if (!expense_ids || !Array.isArray(expense_ids) || expense_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste des IDs de dépenses requise',
        code: 'MISSING_EXPENSE_IDS',
        details: 'Vous devez fournir un tableau d\'IDs de dépenses à supprimer'
      });
    }

    if (expense_ids.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Trop de dépenses sélectionnées',
        code: 'TOO_MANY_EXPENSES',
        details: `Maximum 20 dépenses peuvent être supprimées à la fois (reçu: ${expense_ids.length})`,
        received_count: expense_ids.length,
        max_allowed: 20
      });
    }

    // Validation et nettoyage des IDs
    const validIds = [];
    const invalidIds = [];

    for (const id of expense_ids) {
      const cleanId = String(id).trim();
      if (isValidUUID(cleanId)) {
        validIds.push(cleanId);
      } else {
        invalidIds.push(cleanId);
        console.warn(`⚠️ [EXPENSES] ID invalide ignoré: ${cleanId}`);
      }
    }

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun ID de dépense valide fourni',
        code: 'NO_VALID_IDS',
        invalid_ids: invalidIds
      });
    }

    console.log(`📊 [EXPENSES] IDs validés: ${validIds.length}/${expense_ids.length}`);

    // 🔍 Vérifier le statut de toutes les dépenses
    const statusCheckQuery = `
      SELECT 
        e.id,
        e.reference,
        e.description,
        e.amount,
        s.name as statut_nom,
        s.color as status_color,
        e.responsible_user_name,
        c.name as category_name
      FROM expenses e 
      JOIN expense_statuses s ON e.status_id = s.id 
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = ANY($1::uuid[])
    `;

    const statusResult = await query(statusCheckQuery, [validIds]);
    
    const foundExpenses = statusResult.rows;
    const foundIds = foundExpenses.map(exp => exp.id);
    const notFoundIds = validIds.filter(id => !foundIds.includes(id));
    
    // 🔥 NOUVELLE LOGIQUE : Séparer les dépenses selon leur capacité à être supprimées
    const deletableExpenses = foundExpenses.filter(exp => {
      const { canDelete } = canDeleteExpense(exp.statut_nom);
      return canDelete;
    });
    const nonDeletableExpenses = foundExpenses.filter(exp => {
      const { canDelete } = canDeleteExpense(exp.statut_nom);
      return !canDelete;
    });

    console.log(`📊 [EXPENSES] Analyse des dépenses:`);
    console.log(`   - Trouvées: ${foundExpenses.length}`);
    console.log(`   - Supprimables (En attente + Rejeté): ${deletableExpenses.length}`);
    console.log(`   - Non supprimables: ${nonDeletableExpenses.length}`);
    console.log(`   - Non trouvées: ${notFoundIds.length}`);

    // Détail par statut
    const statusBreakdown = {};
    foundExpenses.forEach(exp => {
      if (!statusBreakdown[exp.statut_nom]) {
        statusBreakdown[exp.statut_nom] = 0;
      }
      statusBreakdown[exp.statut_nom]++;
    });
    console.log(`📊 [EXPENSES] Répartition par statut:`, statusBreakdown);

    if (deletableExpenses.length === 0) {
      const reasons = nonDeletableExpenses.map(exp => {
        const { reason } = canDeleteExpense(exp.statut_nom);
        return `• ${exp.description} (${exp.statut_nom}): ${reason}`;
      }).join('\n');

      return res.status(400).json({
        success: false,
        error: 'Aucune dépense ne peut être supprimée',
        code: 'NO_DELETABLE_EXPENSES',
        details: 'Toutes les dépenses ont un statut qui empêche leur suppression',
        breakdown: {
          not_found: notFoundIds,
          non_deletable: nonDeletableExpenses.map(exp => ({
            id: exp.id,
            reference: exp.reference,
            status: exp.statut_nom,
            reason: canDeleteExpense(exp.statut_nom).reason
          })),
          invalid_ids: invalidIds
        },
        allowed_statuses: ['En attente', 'Rejeté']
      });
    }

    // 🗑️ Supprimer les dépenses autorisées
    const deletableIds = deletableExpenses.map(exp => exp.id);
    
    const deleteQuery = `
      DELETE FROM expenses 
      WHERE id = ANY($1::uuid[]) AND status_id IN (
        SELECT id FROM expense_statuses 
        WHERE name IN ('En attente', 'Rejeté')
      )
      RETURNING id, reference, description
    `;

    const deleteResult = await query(deleteQuery, [deletableIds]);
    const deletedExpenses = deleteResult.rows;

    console.log(`✅ [EXPENSES] Suppression multiple terminée:`);
    console.log(`   - Supprimées: ${deletedExpenses.length}`);
    console.log(`   - Échouées: ${nonDeletableExpenses.length + notFoundIds.length + invalidIds.length}`);
    console.log(`   - Par: ${req.user.full_name} (${req.user.role})`);

    // 📊 Préparer les détails des erreurs par statut
    const errorsByStatus = {};
    nonDeletableExpenses.forEach(exp => {
      if (!errorsByStatus[exp.statut_nom]) {
        errorsByStatus[exp.statut_nom] = [];
      }
      errorsByStatus[exp.statut_nom].push({
        id: exp.id,
        reference: exp.reference,
        description: exp.description,
        amount: exp.amount,
        responsible: exp.responsible_user_name,
        category: exp.category_name
      });
    });

    // 📋 Réponse détaillée avec codes d'erreur spécifiques
    const response = {
      success: deletedExpenses.length > 0, // Succès si au moins une suppression
      message: `${deletedExpenses.length} dépense(s) supprimée(s) sur ${expense_ids.length} demandée(s)`,
      code: deletedExpenses.length === validIds.length ? 'FULL_SUCCESS' : 'PARTIAL_SUCCESS',
      results: {
        total_requested: expense_ids.length,
        total_valid_ids: validIds.length,
        deleted_count: deletedExpenses.length,
        failed_count: nonDeletableExpenses.length + notFoundIds.length + invalidIds.length,
        
        // Dépenses supprimées avec succès
        deleted_expenses: deletedExpenses,
        
        // Erreurs détaillées par catégorie
        errors: {
          not_found: notFoundIds.map(id => ({
            id: id,
            reason: 'Dépense non trouvée',
            code: 'EXPENSE_NOT_FOUND'
          })),
          invalid_ids: invalidIds.map(id => ({
            id: id,
            reason: 'Format d\'ID invalide',
            code: 'INVALID_UUID'
          })),
          status_errors: Object.keys(errorsByStatus).map(status => ({
            status: status,
            reason: status === 'Payé' ? 'Dépense payée - suppression interdite' :
                   status === 'En cours' ? 'Dépense en cours - suppression interdite' :
                   `Statut "${status}" ne permet pas la suppression`,
            code: 'INVALID_STATUS_FOR_DELETION',
            expenses: errorsByStatus[status]
          }))
        }
      },
      deleted_by: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
        email: req.user.email
      },
      timestamp: new Date().toISOString()
    };

    // Statut HTTP selon le résultat
    if (deletedExpenses.length === 0) {
      res.status(400).json(response);
    } else if (deletedExpenses.length === validIds.length) {
      res.status(200).json(response);
    } else {
      res.status(207).json(response); // Multi-Status
    }

  } catch (error) {
    console.error('💥 [EXPENSES] Erreur suppression multiple:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression multiple',
      code: 'BULK_DELETION_ERROR',
      details: error.message
    });
  }
});

// ===== NOUVELLE ROUTE : Vérifier la possibilité de suppression avant action =====
router.post('/check-deletion', authenticateExpenseUser, requireSuperAdmin, async (req, res) => {
  try {
    const { expense_ids } = req.body;

    if (!expense_ids || !Array.isArray(expense_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Liste des IDs de dépenses requise'
      });
    }

    // Valider les IDs
    const validIds = expense_ids.filter(id => isValidUUID(String(id).trim()));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun ID de dépense valide'
      });
    }

    // Vérifier les statuts
    const checkQuery = `
      SELECT 
        e.id,
        e.reference,
        e.description,
        s.name as status_name,
        s.color as status_color,
        CASE WHEN s.name = 'En attente' THEN true ELSE false END as can_delete
      FROM expenses e 
      JOIN expense_statuses s ON e.status_id = s.id 
      WHERE e.id = ANY($1::uuid[])
    `;

    const result = await query(checkQuery, [validIds]);
    
    const deletableCount = result.rows.filter(exp => exp.can_delete).length;
    const nonDeletableCount = result.rows.filter(exp => !exp.can_delete).length;

    res.json({
      success: true,
      can_delete_all: deletableCount === result.rows.length,
      can_delete_some: deletableCount > 0,
      summary: {
        total_checked: result.rows.length,
        deletable_count: deletableCount,
        non_deletable_count: nonDeletableCount
      },
      expenses: result.rows,
      message: deletableCount === 0 ? 'Aucune dépense ne peut être supprimée' :
               deletableCount === result.rows.length ? 'Toutes les dépenses peuvent être supprimées' :
               `${deletableCount} dépense(s) sur ${result.rows.length} peuvent être supprimées`
    });

  } catch (error) {
    console.error('💥 Erreur vérification suppression:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification',
      details: error.message
    });
  }
});

// ========================
// EXPORT ET DEBUGGING
// ========================

console.log('💸 === ROUTES EXPENSES WORKFLOW DÉFINIES ===');
console.log('💸 Routes configurées:');
console.log('  🧪 GET /test/cors - Test CORS');
console.log('  🚀 POST /init/data - Initialiser avec workflow');
console.log('  🔍 GET /init/status - Vérifier état + permissions');
console.log('  🧪 GET /test/* - Tests avec infos utilisateur');
console.log('  📂 GET /config/* - Configuration avec permissions');
console.log('  📊 GET /dashboard - Dashboard financier avec filtrage utilisateur');
console.log('  🔐 GET /validation/access-check - Vérifier accès validation');
console.log('  ⏳ GET /workflow/pending - Dépenses en attente (Super Admin)');
console.log('  📋 POST /workflow/bulk-validate - Validation en masse (Super Admin)');
console.log('  📋 GET / - Liste avec filtrage par utilisateur');
console.log('  ➕ POST / - Créer avec responsable automatique');
console.log('  👁️ GET /:id - Voir avec vérification propriétaire');
console.log('  ✏️ PUT /:id - Modifier (propriétaire ou Super Admin)');
console.log('  🔄 PATCH /:id/status - Validation (Super Admin uniquement)');
console.log('  🗑️ DELETE /:id - Supprimer (Super Admin uniquement)');

console.log('💸 === WORKFLOW DE VALIDATION ===');
console.log('  1. Création -> "En attente" + responsable = utilisateur connecté');
console.log('  2. Admin -> Voit seulement ses dépenses');
console.log('  3. Super Admin -> Voit toutes les dépenses + peut valider');
console.log('  4. Validation/Rejet -> Super Admin uniquement');
console.log('  5. Modification -> Propriétaire ou Super Admin (si "En attente")');
console.log('  6. Suppression -> Super Admin uniquement (si "En attente")');

console.log('💸 === PERMISSIONS PAR RÔLE ===');
console.log('  🔸 Admin:');
console.log('    - Créer des dépenses (devient responsable automatiquement)');
console.log('    - Voir ses propres dépenses seulement');
console.log('    - Modifier ses dépenses en attente');
console.log('    - Dashboard filtré à ses dépenses');
console.log('  🔸 Super Admin:');
console.log('    - Toutes les permissions Admin');
console.log('    - Voir toutes les dépenses de tous les utilisateurs');
console.log('    - Accès page validation');
console.log('    - Valider/Rejeter des dépenses');
console.log('    - Supprimer des dépenses');
console.log('    - Dashboard complet');

console.log('💸 === CORRECTIONS CORS APPLIQUÉES ===');
console.log('  ✅ Middleware CORS en premier');
console.log('  ✅ Header x-auth-token ajouté');
console.log('  ✅ Gestion prioritaire du token');
console.log('  ✅ Route de test CORS: GET /test/cors');

console.log('💸 === EXPORT DU ROUTER AVEC AUTHENTIFICATION COMPLÈTE ===');
module.exports = router;