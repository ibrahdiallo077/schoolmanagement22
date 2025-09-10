// server/routes/notifications.js - VERSION ISOLATION COMPLÈTE 
// Chaque utilisateur ne voit que SES propres notifications

const express = require('express');
const { query } = require('../config/database');
const { sanitizeText } = require('../utils/validation');

const router = express.Router();

console.log('🔔 === MODULE NOTIFICATIONS.JS - ISOLATION COMPLÈTE ===');

// === MIDDLEWARE CORS EN PREMIER ===
router.use((req, res, next) => {
  console.log('🌐 [NOTIFICATIONS] CORS middleware pour:', req.method, req.originalUrl);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-auth-token, X-Auth-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [NOTIFICATIONS] OPTIONS request handled');
    return res.status(200).end();
  }
  next();
});

// === MIDDLEWARE D'AUTHENTIFICATION (inchangé) ===
const authenticateUser = async (req, res, next) => {
  console.log('🔐 [NOTIFICATIONS] Auth middleware pour:', req.method, req.originalUrl);
  
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
    }

    console.log('🔑 [NOTIFICATIONS] Token présent:', !!token, 'Length:', token?.length || 0);

    if (!token) {
      console.log('❌ [NOTIFICATIONS] Aucun token fourni');
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
      console.log('✅ [NOTIFICATIONS] Token décodé pour userId:', decoded.userId, 'email:', decoded.email);
    } catch (jwtError) {
      console.log('❌ [NOTIFICATIONS] Erreur JWT:', jwtError.message);
      
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
    
    let user;
    
    try {
      const userResult = await query(
        `SELECT id, username, email, first_name, last_name, role, is_active, avatar_url, created_at
         FROM admin_users 
         WHERE id = $1 AND is_active = true`,
        [decoded.userId]
      );
      
      console.log('🔍 [NOTIFICATIONS] Résultat DB pour userId', decoded.userId, ':', userResult.rows.length, 'lignes');
      
      if (userResult.rows.length === 0) {
        console.log('❌ [NOTIFICATIONS] Utilisateur non trouvé ou inactif pour ID:', decoded.userId);
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvé ou compte inactif',
          code: 'USER_NOT_FOUND'
        });
      }
      
      user = userResult.rows[0];
      console.log('✅ [NOTIFICATIONS] Utilisateur trouvé:', user.email, 'Role:', user.role, 'Actif:', user.is_active);
      
    } catch (dbError) {
      console.error('💥 [NOTIFICATIONS] Erreur base de données:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'Erreur de connexion à la base de données',
        code: 'DB_CONNECTION_ERROR'
      });
    }

    // 4. Construction de l'objet utilisateur avec permissions
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
      
      // PERMISSIONS NOTIFICATIONS - ISOLATION COMPLÈTE
      canManageAllNotifications: false, // Personne ne voit tout
      canCreateNotifications: ['admin', 'super_admin'].includes(user.role),
      canDeleteNotifications: ['admin', 'super_admin'].includes(user.role),
      canViewNotifications: ['admin', 'super_admin'].includes(user.role)
    };

    console.log(`✅ [NOTIFICATIONS] Utilisateur authentifié: ${user.first_name} ${user.last_name} (${user.role})`);
    console.log(`🔒 [NOTIFICATIONS] ISOLATION: chaque utilisateur voit uniquement SES notifications`);
    
    next();
    
  } catch (error) {
    console.error('💥 [NOTIFICATIONS] Erreur authentification globale:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification',
      code: 'AUTH_ERROR',
      details: error.message
    });
  }
};

// === MIDDLEWARE DE PERMISSIONS ===
const requireAdmin = (req, res, next) => {
  if (!req.user?.canCreateNotifications) {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux Administrateurs',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

// ========================
// COMPTEUR DE NOTIFICATIONS - MODIFIÉ POUR ISOLATION
// ========================

router.get('/count', authenticateUser, async (req, res) => {
  try {
    console.log('📢 [NOTIFICATIONS] Comptage notifications pour:', req.user.full_name);
    
    // ISOLATION COMPLÈTE: L'utilisateur ne voit QUE ses propres notifications créées
    const countQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE is_read = FALSE AND is_active = TRUE) as total_unread,
        COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = FALSE AND is_active = TRUE) as urgent_unread,
        COUNT(*) FILTER (WHERE priority = 'high' AND is_read = FALSE AND is_active = TRUE) as high_unread,
        COUNT(*) FILTER (WHERE priority = 'medium' AND is_read = FALSE AND is_active = TRUE) as medium_unread,
        COUNT(*) FILTER (WHERE priority = 'low' AND is_read = FALSE AND is_active = TRUE) as low_unread,
        COUNT(*) FILTER (WHERE type = 'error' AND is_read = FALSE AND is_active = TRUE) as error_unread,
        COUNT(*) FILTER (WHERE type = 'warning' AND is_read = FALSE AND is_active = TRUE) as warning_unread,
        COUNT(*) FILTER (WHERE type = 'reminder' AND is_read = FALSE AND is_active = TRUE) as reminder_unread,
        COUNT(*) FILTER (WHERE due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' AND due_date > CURRENT_TIMESTAMP AND is_active = TRUE) as due_soon,
        COUNT(*) FILTER (WHERE due_date <= CURRENT_TIMESTAMP AND is_active = TRUE) as overdue
      FROM notifications 
      WHERE created_by = $1 AND is_active = TRUE
    `;
    
    const result = await query(countQuery, [req.user.id]);
    const counts = result.rows[0];
    
    console.log('✅ Comptage notifications (ISOLATION) pour', req.user.full_name, ':', counts);
    
    res.json({
      success: true,
      counts: {
        total_unread: parseInt(counts.total_unread || 0),
        urgent_unread: parseInt(counts.urgent_unread || 0),
        high_unread: parseInt(counts.high_unread || 0),
        medium_unread: parseInt(counts.medium_unread || 0),
        low_unread: parseInt(counts.low_unread || 0),
        error_unread: parseInt(counts.error_unread || 0),
        warning_unread: parseInt(counts.warning_unread || 0),
        reminder_unread: parseInt(counts.reminder_unread || 0),
        due_soon: parseInt(counts.due_soon || 0),
        overdue: parseInt(counts.overdue || 0)
      },
      user: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role
      },
      isolation_mode: true
    });
    
  } catch (error) {
    console.error('💥 Erreur comptage notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur comptage notifications',
      details: error.message
    });
  }
});

// ========================
// LISTER LES NOTIFICATIONS - MODIFIÉ POUR ISOLATION
// ========================

router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('📋 [NOTIFICATIONS] Liste demandée par:', req.user.full_name, 'Role:', req.user.role);
    
    const {
      page = 1,
      limit = 20,
      priority = '',
      type = '',
      category = '',
      is_read = '',
      search = '',
      sort_by = 'created_at',
      sort_order = 'desc',
      date_filter = ''
    } = req.query;

    // ISOLATION COMPLÈTE: L'utilisateur ne voit QUE ses propres notifications créées
    let whereConditions = ['n.created_by = $1', 'n.is_active = TRUE'];
    let params = [req.user.id];
    let paramIndex = 2;

    // FILTRE PAR PRIORITÉ
    if (priority && priority !== 'all' && priority !== '') {
      whereConditions.push(`n.priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    // FILTRE PAR TYPE
    if (type && type !== 'all' && type !== '') {
      whereConditions.push(`n.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    // FILTRE PAR CATÉGORIE
    if (category && category !== 'all' && category !== '') {
      whereConditions.push(`n.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // FILTRE PAR STATUT DE LECTURE
    if (is_read !== '' && is_read !== 'all') {
      whereConditions.push(`n.is_read = $${paramIndex}`);
      params.push(is_read === 'true');
      paramIndex++;
    }

    // RECHERCHE TEXTUELLE
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereConditions.push(`(
        LOWER(n.title) LIKE LOWER($${paramIndex}) OR 
        LOWER(COALESCE(n.message, '')) LIKE LOWER($${paramIndex}) OR
        LOWER(COALESCE(n.category, '')) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // FILTRE PAR DATE
    if (date_filter && date_filter !== 'all') {
      switch (date_filter) {
        case 'today':
          whereConditions.push(`DATE(n.created_at) = CURRENT_DATE`);
          break;
        case 'week':
          whereConditions.push(`n.created_at >= CURRENT_DATE - INTERVAL '7 days'`);
          break;
        case 'month':
          whereConditions.push(`n.created_at >= CURRENT_DATE - INTERVAL '30 days'`);
          break;
        case 'overdue':
          whereConditions.push(`n.due_date <= CURRENT_TIMESTAMP AND n.due_date IS NOT NULL`);
          break;
        case 'due_soon':
          whereConditions.push(`n.due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' AND n.due_date > CURRENT_TIMESTAMP`);
          break;
      }
    }

    const whereClause = whereConditions.join(' AND ');

    // Validation du tri
    const allowedSortFields = ['created_at', 'priority', 'due_date', 'title', 'type', 'is_read'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Calcul pagination
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const pageNum = Math.max(1, parseInt(page));
    const offset = (pageNum - 1) * limitNum;

    // Requête COUNT
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereClause}
    `;

    // Requête principale avec informations enrichies
    const notificationsQuery = `
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.category,
        n.is_read,
        n.is_active,
        n.user_id,
        n.related_entity_type,
        n.related_entity_id,
        n.metadata,
        n.created_at,
        n.due_date,
        n.reminder_date,
        n.created_by,
        
        -- Formatage des dates
        TO_CHAR(n.created_at, 'DD/MM/YYYY HH24:MI') as created_at_formatted,
        TO_CHAR(n.due_date, 'DD/MM/YYYY HH24:MI') as due_date_formatted,
        TO_CHAR(n.reminder_date, 'DD/MM/YYYY HH24:MI') as reminder_date_formatted,
        
        -- Calcul du temps restant et statut d'échéance
        CASE 
          WHEN n.due_date IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (n.due_date - CURRENT_TIMESTAMP))/3600
          ELSE NULL 
        END as hours_remaining,
        
        CASE 
          WHEN n.due_date IS NULL THEN 'no_deadline'
          WHEN n.due_date <= CURRENT_TIMESTAMP THEN 'overdue'
          WHEN n.due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN 'due_soon'
          ELSE 'on_time'
        END as deadline_status,
        
        -- Couleur de priorité
        CASE n.priority
          WHEN 'urgent' THEN '#DC2626'
          WHEN 'high' THEN '#EA580C'
          WHEN 'medium' THEN '#D97706'
          WHEN 'low' THEN '#059669'
        END as priority_color,
        
        -- Icône du type
        CASE n.type
          WHEN 'error' THEN 'AlertTriangle'
          WHEN 'warning' THEN 'AlertCircle'
          WHEN 'success' THEN 'CheckCircle'
          WHEN 'info' THEN 'Info'
          WHEN 'reminder' THEN 'Clock'
          WHEN 'alert' THEN 'Bell'
          ELSE 'Bell'
        END as type_icon,
        
        -- Couleur du type
        CASE n.type
          WHEN 'error' THEN '#DC2626'
          WHEN 'warning' THEN '#F59E0B'
          WHEN 'success' THEN '#059669'
          WHEN 'info' THEN '#3B82F6'
          WHEN 'reminder' THEN '#7C3AED'
          WHEN 'alert' THEN '#DC2626'
          ELSE '#6B7280'
        END as type_color,
        
        -- Informations utilisateur cible
        u.first_name || ' ' || u.last_name as target_user_name,
        u.email as target_user_email,
        u.role as target_user_role,
        
        -- Informations créateur (toujours l'utilisateur actuel en mode isolation)
        cb.first_name || ' ' || cb.last_name as created_by_name,
        cb.email as created_by_email,
        cb.role as created_by_role,
        
        -- Permissions simplifiées (créateur peut tout faire sur ses notifications)
        TRUE as can_delete,
        TRUE as can_read
        
      FROM notifications n
      LEFT JOIN admin_users u ON n.user_id = u.id
      LEFT JOIN admin_users cb ON n.created_by = cb.id
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN '${sortField}' = 'priority' THEN
            CASE n.priority
              WHEN 'urgent' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END
          ELSE NULL
        END ${sortDirection},
        n.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Paramètres pour les requêtes
    const countParams = [...params];
    const queryParams = [...params, limitNum, offset];

    console.log('📋 [NOTIFICATIONS] ISOLATION - Utilisateur ne voit que SES créations:', req.user.full_name);

    // Exécuter les requêtes
    const [notificationsResult, countResult] = await Promise.all([
      query(notificationsQuery, queryParams),
      query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);

    console.log(`✅ ${notificationsResult.rows.length}/${total} notifications trouvées (ISOLATION) pour ${req.user.full_name} (${req.user.role})`);

    res.json({
      success: true,
      notifications: notificationsResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        priority,
        type,
        category,
        is_read,
        search,
        date_filter,
        applied_filters: {
          has_priority: !!priority && priority !== 'all',
          has_type: !!type && type !== 'all',
          has_category: !!category && category !== 'all',
          has_read_filter: is_read !== '' && is_read !== 'all',
          has_search: !!search,
          has_date_filter: !!date_filter && date_filter !== 'all'
        }
      },
      user_info: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
        isolation_mode: true
      }
    });

  } catch (error) {
    console.error('💥 Erreur liste notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des notifications',
      details: error.message
    });
  }
});

// ========================
// CRÉER UNE NOTIFICATION - MODIFIÉ POUR AUTO-ASSIGNMENT
// ========================

router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('➕ [NOTIFICATIONS] Création notification par:', req.user.full_name);
    
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      category = 'general',
      user_id: requestedUserId, // Ignoré en mode isolation
      due_date = null,
      reminder_date = null,
      related_entity_type = null,
      related_entity_id = null,
      metadata = {}
    } = req.body;

    // Validation des champs requis (inchangée)
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le titre est requis et ne peut pas être vide'
      });
    }

    if (title.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Le titre ne peut pas dépasser 255 caractères'
      });
    }

    // Validation des valeurs énumérées (inchangée)
    const validTypes = ['info', 'warning', 'error', 'success', 'reminder', 'alert'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validCategories = ['general', 'expense', 'payment', 'salary', 'system'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type invalide. Types autorisés: ' + validTypes.join(', ')
      });
    }
    
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Priorité invalide. Priorités autorisées: ' + validPriorities.join(', ')
      });
    }

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Catégorie invalide. Catégories autorisées: ' + validCategories.join(', ')
      });
    }

    // ISOLATION: La notification est automatiquement assignée au créateur
    const finalUserId = req.user.id; // Toujours le créateur
    
    console.log(`🔒 [NOTIFICATIONS] ISOLATION - Auto-assignment à l'utilisateur: ${req.user.full_name} (ID: ${finalUserId})`);

    // Créer la notification avec auto-assignment
    const createQuery = `
      INSERT INTO notifications (
        title, message, type, priority, category,
        user_id, due_date, reminder_date,
        related_entity_type, related_entity_id, metadata,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12
      ) RETURNING id, title, type, priority, created_at
    `;

    const result = await query(createQuery, [
      sanitizeText(title),
      message ? sanitizeText(message) : null,
      type,
      priority,
      category,
      finalUserId, // Auto-assignée au créateur
      due_date,
      reminder_date,
      related_entity_type,
      related_entity_id,
      JSON.stringify(metadata),
      req.user.id
    ]);

    const newNotification = result.rows[0];

    console.log(`✅ Notification créée (ISOLATION): ${newNotification.title} assignée à ${req.user.full_name}`);

    // Récupérer la notification complète
    const enrichedQuery = `
      SELECT 
        n.*,
        TO_CHAR(n.created_at, 'DD/MM/YYYY HH24:MI') as created_at_formatted,
        TO_CHAR(n.due_date, 'DD/MM/YYYY HH24:MI') as due_date_formatted,
        TO_CHAR(n.reminder_date, 'DD/MM/YYYY HH24:MI') as reminder_date_formatted,
        
        CASE n.priority
          WHEN 'urgent' THEN '#DC2626'
          WHEN 'high' THEN '#EA580C'
          WHEN 'medium' THEN '#D97706'
          WHEN 'low' THEN '#059669'
        END as priority_color,
        
        CASE n.type
          WHEN 'error' THEN 'AlertTriangle'
          WHEN 'warning' THEN 'AlertCircle'
          WHEN 'success' THEN 'CheckCircle'
          WHEN 'info' THEN 'Info'
          WHEN 'reminder' THEN 'Clock'
          WHEN 'alert' THEN 'Bell'
          ELSE 'Bell'
        END as type_icon,
        
        u.first_name || ' ' || u.last_name as target_user_name,
        cb.first_name || ' ' || cb.last_name as created_by_name
        
      FROM notifications n
      LEFT JOIN admin_users u ON n.user_id = u.id
      LEFT JOIN admin_users cb ON n.created_by = cb.id
      WHERE n.id = $1
    `;

    const enrichedResult = await query(enrichedQuery, [newNotification.id]);
    const completeNotification = enrichedResult.rows[0];

    res.status(201).json({
      success: true,
      message: `Notification "${newNotification.title}" créée et assignée à vous-même`,
      notification: completeNotification,
      created_by: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role,
        email: req.user.email
      },
      isolation_mode: true,
      auto_assigned: true
    });

  } catch (error) {
    console.error('💥 Erreur création notification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la notification',
      details: error.message
    });
  }
});

// ========================
// MARQUER COMME LUE/NON LUE - MODIFIÉ POUR ISOLATION
// ========================

router.patch('/:id/read', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read = true } = req.body;
    
    console.log(`📖 [NOTIFICATIONS] Marquage ${is_read ? 'lu' : 'non lu'} pour notification ${id} par ${req.user.full_name}`);

    // Validation UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de notification invalide'
      });
    }

    // ISOLATION: Vérifier que la notification appartient au créateur
    const checkQuery = `
      SELECT id, title, user_id, created_by, is_read
      FROM notifications 
      WHERE id = $1::uuid 
      AND created_by = $2
      AND is_active = TRUE
    `;

    const checkResult = await query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification non trouvée ou non accessible (vous ne pouvez modifier que vos propres notifications)'
      });
    }

    // Mettre à jour le statut de lecture
    const updateQuery = `
      UPDATE notifications 
      SET 
        is_read = $1,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $2
      WHERE id = $3::uuid
      RETURNING id, title, is_read
    `;

    const result = await query(updateQuery, [is_read, req.user.id, id]);
    const updatedNotification = result.rows[0];

    console.log(`✅ Notification ${is_read ? 'marquée comme lue' : 'marquée comme non lue'}: ${updatedNotification.title}`);

    res.json({
      success: true,
      message: `Notification ${is_read ? 'marquée comme lue' : 'marquée comme non lue'}`,
      notification: updatedNotification,
      isolation_mode: true
    });

  } catch (error) {
    console.error('💥 Erreur marquage lecture:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du marquage de lecture',
      details: error.message
    });
  }
});

// ========================
// MARQUER TOUTES COMME LUES - MODIFIÉ POUR ISOLATION
// ========================

router.patch('/mark-all-read', authenticateUser, async (req, res) => {
  try {
    console.log(`📚 [NOTIFICATIONS] Marquage toutes comme lues pour ${req.user.full_name}`);

    // ISOLATION: Marquer uniquement les notifications créées par l'utilisateur
    const updateQuery = `
      UPDATE notifications 
      SET 
        is_read = TRUE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE created_by = $1
      AND is_read = FALSE
      AND is_active = TRUE
      RETURNING id, title
    `;

    const result = await query(updateQuery, [req.user.id]);

    console.log(`✅ ${result.rows.length} notifications marquées comme lues pour ${req.user.full_name} (ISOLATION)`);

    res.json({
      success: true,
      message: `${result.rows.length} notification(s) marquée(s) comme lue(s)`,
      marked_count: result.rows.length,
      marked_notifications: result.rows,
      isolation_mode: true
    });

  } catch (error) {
    console.error('💥 Erreur marquage toutes lues:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du marquage de toutes les notifications',
      details: error.message
    });
  }
});

// ========================
// SUPPRIMER UNE NOTIFICATION - MODIFIÉ POUR ISOLATION
// ========================

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ [NOTIFICATIONS] Suppression notification ${id} par ${req.user.full_name} (${req.user.role})`);

    // Validation UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de notification invalide'
      });
    }

    // ISOLATION: Vérifier que la notification appartient au créateur
    const checkQuery = `
      SELECT id, title, user_id, created_by, type, priority
      FROM notifications 
      WHERE id = $1::uuid 
      AND created_by = $2
      AND is_active = TRUE
    `;

    const checkResult = await query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification non trouvée ou non accessible (vous ne pouvez supprimer que vos propres notifications)'
      });
    }

    // Supprimer (soft delete)
    const deleteQuery = `
      UPDATE notifications 
      SET 
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE id = $2::uuid
      RETURNING id, title
    `;

    const result = await query(deleteQuery, [req.user.id, id]);
    const deletedNotification = result.rows[0];

    console.log(`✅ Notification supprimée (ISOLATION): ${deletedNotification.title} par ${req.user.full_name}`);

    res.json({
      success: true,
      message: `Notification "${deletedNotification.title}" supprimée avec succès`,
      deleted_notification: deletedNotification,
      deleted_by: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role
      },
      isolation_mode: true
    });

  } catch (error) {
    console.error('💥 Erreur suppression notification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la notification',
      details: error.message
    });
  }
});

// ========================
// OBTENIR LES ALERTES - MODIFIÉ POUR ISOLATION
// ========================

router.get('/alerts', authenticateUser, async (req, res) => {
  try {
    console.log(`🚨 [NOTIFICATIONS] Alertes demandées par ${req.user.full_name}`);

    // ISOLATION: Alertes uniquement pour les notifications créées par l'utilisateur
    const alertsQuery = `
      SELECT 
        'overdue' as alert_type,
        'Notifications en retard' as alert_title,
        COUNT(*) as count,
        '#DC2626' as color,
        'AlertTriangle' as icon,
        json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'priority', priority,
            'due_date', TO_CHAR(due_date, 'DD/MM/YYYY HH24:MI'),
            'hours_overdue', EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - due_date))/3600
          )
          ORDER BY due_date
        ) as notifications
      FROM notifications 
      WHERE created_by = $1
      AND is_active = TRUE
      AND due_date <= CURRENT_TIMESTAMP
      AND due_date IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'due_soon' as alert_type,
        'À traiter dans les 24h' as alert_title,
        COUNT(*) as count,
        '#F59E0B' as color,
        'Clock' as icon,
        json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'priority', priority,
            'due_date', TO_CHAR(due_date, 'DD/MM/YYYY HH24:MI'),
            'hours_remaining', EXTRACT(EPOCH FROM (due_date - CURRENT_TIMESTAMP))/3600
          )
          ORDER BY due_date
        ) as notifications
      FROM notifications 
      WHERE created_by = $1
      AND is_active = TRUE
      AND due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours'
      AND due_date > CURRENT_TIMESTAMP
      
      UNION ALL
      
      SELECT 
        'urgent_unread' as alert_type,
        'Notifications urgentes non lues' as alert_title,
        COUNT(*) as count,
        '#DC2626' as color,
        'AlertCircle' as icon,
        json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'type', type,
            'created_at', TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI'),
            'due_date', TO_CHAR(due_date, 'DD/MM/YYYY HH24:MI')
          )
          ORDER BY created_at DESC
        ) as notifications
      FROM notifications 
      WHERE created_by = $1
      AND is_active = TRUE
      AND is_read = FALSE
      AND priority = 'urgent'
    `;

    const alertsResult = await query(alertsQuery, [req.user.id]);
    
    // Filtrer les alertes qui ont du contenu
    const activeAlerts = alertsResult.rows.filter(alert => alert.count > 0);

    console.log(`✅ ${activeAlerts.length} types d'alertes trouvées pour ${req.user.full_name} (ISOLATION)`);

    res.json({
      success: true,
      alerts: activeAlerts,
      summary: {
        total_alert_types: activeAlerts.length,
        total_notifications_in_alerts: activeAlerts.reduce((sum, alert) => sum + parseInt(alert.count), 0),
        has_overdue: activeAlerts.some(alert => alert.alert_type === 'overdue'),
        has_due_soon: activeAlerts.some(alert => alert.alert_type === 'due_soon'),
        has_urgent: activeAlerts.some(alert => alert.alert_type === 'urgent_unread'),
        highest_priority_alert: activeAlerts.find(alert => 
          alert.alert_type === 'overdue' || alert.alert_type === 'urgent_unread'
        )?.alert_type || null
      },
      user_info: {
        id: req.user.id,
        name: req.user.full_name,
        role: req.user.role
      },
      isolation_mode: true
    });

  } catch (error) {
    console.error('💥 Erreur alertes notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes',
      details: error.message
    });
  }
});

// ========================
// DASHBOARD DES NOTIFICATIONS - MODIFIÉ POUR ISOLATION
// ========================

router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    console.log(`📊 [NOTIFICATIONS] Dashboard demandé par: ${req.user.full_name} (${req.user.role})`);
    
    // ISOLATION: Statistiques uniquement pour les notifications créées par l'utilisateur
    const dashboardQuery = `
      SELECT 
        -- Compteurs par priorité (seulement les notifications créées par l'utilisateur)
        COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = FALSE AND is_active = TRUE) as urgent_unread,
        COUNT(*) FILTER (WHERE priority = 'high' AND is_read = FALSE AND is_active = TRUE) as high_unread,
        COUNT(*) FILTER (WHERE priority = 'medium' AND is_read = FALSE AND is_active = TRUE) as medium_unread,
        COUNT(*) FILTER (WHERE priority = 'low' AND is_read = FALSE AND is_active = TRUE) as low_unread,
        
        -- Compteurs par type
        COUNT(*) FILTER (WHERE type = 'error' AND is_read = FALSE AND is_active = TRUE) as error_unread,
        COUNT(*) FILTER (WHERE type = 'warning' AND is_read = FALSE AND is_active = TRUE) as warning_unread,
        COUNT(*) FILTER (WHERE type = 'reminder' AND is_read = FALSE AND is_active = TRUE) as reminder_unread,
        COUNT(*) FILTER (WHERE type = 'success' AND is_read = FALSE AND is_active = TRUE) as success_unread,
        COUNT(*) FILTER (WHERE type = 'info' AND is_read = FALSE AND is_active = TRUE) as info_unread,
        
        -- Statistiques générales
        COUNT(*) FILTER (WHERE is_read = FALSE AND is_active = TRUE) as total_unread,
        COUNT(*) FILTER (WHERE is_read = TRUE AND is_active = TRUE) as total_read,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND is_active = TRUE) as today_created,
        COUNT(*) FILTER (WHERE due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' AND due_date > CURRENT_TIMESTAMP AND is_active = TRUE) as due_soon,
        COUNT(*) FILTER (WHERE due_date <= CURRENT_TIMESTAMP AND is_active = TRUE) as overdue,
        
        -- Par catégorie
        COUNT(*) FILTER (WHERE category = 'expense' AND is_read = FALSE AND is_active = TRUE) as expense_unread,
        COUNT(*) FILTER (WHERE category = 'payment' AND is_read = FALSE AND is_active = TRUE) as payment_unread,
        COUNT(*) FILTER (WHERE category = 'salary' AND is_read = FALSE AND is_active = TRUE) as salary_unread,
        COUNT(*) FILTER (WHERE category = 'system' AND is_read = FALSE AND is_active = TRUE) as system_unread,
        COUNT(*) FILTER (WHERE category = 'general' AND is_read = FALSE AND is_active = TRUE) as general_unread
        
      FROM notifications 
      WHERE created_by = $1 AND is_active = TRUE
    `;
    
    const dashboardResult = await query(dashboardQuery, [req.user.id]);
    const stats = dashboardResult.rows[0];
    
    // Récupérer les notifications récentes créées par l'utilisateur
    const recentQuery = `
      SELECT 
        id, title, type, priority, category, is_read,
        created_at,
        due_date,
        TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as created_at_formatted,
        TO_CHAR(due_date, 'DD/MM/YYYY HH24:MI') as due_date_formatted,
        
        CASE priority
          WHEN 'urgent' THEN '#DC2626'
          WHEN 'high' THEN '#EA580C'
          WHEN 'medium' THEN '#D97706'
          WHEN 'low' THEN '#059669'
        END as priority_color,
        
        CASE type
          WHEN 'error' THEN 'AlertTriangle'
          WHEN 'warning' THEN 'AlertCircle'
          WHEN 'success' THEN 'CheckCircle'
          WHEN 'info' THEN 'Info'
          WHEN 'reminder' THEN 'Clock'
          WHEN 'alert' THEN 'Bell'
          ELSE 'Bell'
        END as type_icon,
        
        CASE 
          WHEN due_date IS NULL THEN 'no_deadline'
          WHEN due_date <= CURRENT_TIMESTAMP THEN 'overdue'
          WHEN due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN 'due_soon'
          ELSE 'on_time'
        END as deadline_status
        
      FROM notifications 
      WHERE created_by = $1 AND is_active = TRUE
      ORDER BY 
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
      LIMIT 10
    `;
    
    const recentResult = await query(recentQuery, [req.user.id]);
    
    console.log('✅ Dashboard notifications généré avec succès pour', req.user.full_name, '(ISOLATION)');
    
    res.json({
      success: true,
      dashboard: {
        statistics: {
          // Totaux
          total_unread: parseInt(stats.total_unread || 0),
          total_read: parseInt(stats.total_read || 0),
          today_created: parseInt(stats.today_created || 0),
          due_soon: parseInt(stats.due_soon || 0),
          overdue: parseInt(stats.overdue || 0),
          
          // Par priorité
          urgent_unread: parseInt(stats.urgent_unread || 0),
          high_unread: parseInt(stats.high_unread || 0),
          medium_unread: parseInt(stats.medium_unread || 0),
          low_unread: parseInt(stats.low_unread || 0),
          
          // Par type
          error_unread: parseInt(stats.error_unread || 0),
          warning_unread: parseInt(stats.warning_unread || 0),
          reminder_unread: parseInt(stats.reminder_unread || 0),
          success_unread: parseInt(stats.success_unread || 0),
          info_unread: parseInt(stats.info_unread || 0),
          
          // Par catégorie
          expense_unread: parseInt(stats.expense_unread || 0),
          payment_unread: parseInt(stats.payment_unread || 0),
          salary_unread: parseInt(stats.salary_unread || 0),
          system_unread: parseInt(stats.system_unread || 0),
          general_unread: parseInt(stats.general_unread || 0)
        },
        recent_notifications: recentResult.rows,
        user_permissions: {
          id: req.user?.id,
          username: req.user?.username,
          full_name: req.user?.full_name,
          role: req.user?.role,
          isolation_mode: true,
          canManageAll: false,
          canCreate: req.user?.canCreateNotifications || false,
          canDelete: req.user?.canDeleteNotifications || false
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur dashboard notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur dashboard notifications',
      details: error.message
    });
  }
});

// ========================
// ROUTES UTILITAIRES (inchangées)
// ========================

router.get('/test/api', authenticateUser, async (req, res) => {
  try {
    console.log('🧪 [NOTIFICATIONS] Test API avec auth pour:', req.user.full_name);
    
    const testQueries = await Promise.all([
      query('SELECT COUNT(*) as total_notifications FROM notifications WHERE created_by = $1', [req.user.id]).catch(() => ({ rows: [{ total_notifications: 0 }] })),
      query('SELECT COUNT(*) as unread_notifications FROM notifications WHERE created_by = $1 AND is_read = FALSE AND is_active = TRUE', [req.user.id]).catch(() => ({ rows: [{ unread_notifications: 0 }] })),
      query('SELECT COUNT(*) as urgent_notifications FROM notifications WHERE created_by = $1 AND priority = \'urgent\' AND is_read = FALSE AND is_active = TRUE', [req.user.id]).catch(() => ({ rows: [{ urgent_notifications: 0 }] }))
    ]);
    
    res.json({
      success: true,
      message: 'API Notifications fonctionnelle en mode ISOLATION !',
      test_results: {
        database_status: {
          total_notifications: parseInt(testQueries[0].rows[0].total_notifications),
          unread_notifications: parseInt(testQueries[1].rows[0].unread_notifications),
          urgent_notifications: parseInt(testQueries[2].rows[0].urgent_notifications)
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
          isolation_mode: true,
          canManageAll: false,
          canCreate: req.user?.canCreateNotifications,
          canDelete: req.user?.canDeleteNotifications
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur test API notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur test API notifications',
      details: error.message
    });
  }
});

router.get('/types', authenticateUser, (req, res) => {
  res.json({
    success: true,
    types: [
      { value: 'info', label: 'Information', icon: 'Info', color: '#3B82F6' },
      { value: 'warning', label: 'Avertissement', icon: 'AlertCircle', color: '#F59E0B' },
      { value: 'error', label: 'Erreur', icon: 'AlertTriangle', color: '#DC2626' },
      { value: 'success', label: 'Succès', icon: 'CheckCircle', color: '#059669' },
      { value: 'reminder', label: 'Rappel', icon: 'Clock', color: '#7C3AED' },
      { value: 'alert', label: 'Alerte', icon: 'Bell', color: '#DC2626' }
    ]
  });
});

router.get('/priorities', authenticateUser, (req, res) => {
  res.json({
    success: true,
    priorities: [
      { value: 'low', label: 'Faible', color: '#059669', order: 4 },
      { value: 'medium', label: 'Moyenne', color: '#D97706', order: 3 },
      { value: 'high', label: 'Haute', color: '#EA580C', order: 2 },
      { value: 'urgent', label: 'Urgente', color: '#DC2626', order: 1 }
    ]
  });
});

router.get('/categories', authenticateUser, (req, res) => {
  res.json({
    success: true,
    categories: [
      { value: 'general', label: 'Général' },
      { value: 'expense', label: 'Dépenses' },
      { value: 'payment', label: 'Paiements' },
      { value: 'salary', label: 'Salaires' },
      { value: 'system', label: 'Système' }
    ]
  });
});

console.log('🔔 === ROUTES NOTIFICATIONS - MODE ISOLATION COMPLÈTE ===');
console.log('🔔 Routes configurées:');
console.log('  🧪 GET /test/* - Tests et vérifications');
console.log('  📢 GET /count - Compteur notifications (SES créations uniquement)');
console.log('  📋 GET / - Liste (SES créations uniquement)');
console.log('  ➕ POST / - Créer notification (auto-assignée à soi-même)');
console.log('  📖 PATCH /:id/read - Marquer comme lu (SES notifications)');
console.log('  📚 PATCH /mark-all-read - Marquer toutes comme lues (SES notifications)');
console.log('  🗑️ DELETE /:id - Supprimer (SES notifications)');
console.log('  🚨 GET /alerts - Alertes (SES notifications)');
console.log('  📊 GET /dashboard - Dashboard (SES notifications)');
console.log('  🔧 GET /types - Types disponibles');
console.log('  🏷️ GET /priorities - Priorités disponibles');
console.log('  📂 GET /categories - Catégories disponibles');

console.log('🔔 === ISOLATION COMPLÈTE ACTIVÉE ===');
console.log('  🔸 Chaque utilisateur ne voit QUE ses propres notifications');
console.log('  🔸 Auto-assignment: toute notification créée est assignée au créateur');
console.log('  🔸 Permissions: chaque utilisateur gère uniquement ses créations');
console.log('  🔸 Aucune notification globale ou partagée');

console.log('🔔 === EXPORT DU ROUTER NOTIFICATIONS (ISOLATION) ===');
module.exports = router;