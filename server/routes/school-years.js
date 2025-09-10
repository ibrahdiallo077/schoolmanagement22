// server/routes/school-years.js - Routes pour gestion des années scolaires - CORRIGÉ
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sanitizeText } = require('../utils/validation');

const router = express.Router();

console.log('📅 Module school-years.js chargé - Gestion années scolaires - VERSION CORRIGÉE');

// === MIDDLEWARE CORS ===
router.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  console.log(`📅 SCHOOL-YEARS: ${req.method} ${req.path} - Origin: ${origin || 'none'}`);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// === FONCTIONS UTILITAIRES ===

// Valider les données d'une année scolaire
const validateSchoolYearData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 4) {
    errors.push('Le nom doit contenir au moins 4 caractères (ex: 2024-2025)');
  }
  
  // Vérifier le format du nom (YYYY-YYYY)
  if (data.name && !data.name.match(/^\d{4}-\d{4}$/)) {
    errors.push('Le nom doit être au format YYYY-YYYY (ex: 2024-2025)');
  }
  
  if (!data.start_date || !Date.parse(data.start_date)) {
    errors.push('Date de début invalide');
  }
  
  if (!data.end_date || !Date.parse(data.end_date)) {
    errors.push('Date de fin invalide');
  }
  
  // Vérifier que la date de fin est après la date de début
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (endDate <= startDate) {
      errors.push('La date de fin doit être postérieure à la date de début');
    }
    
    // Vérifier que l'année scolaire ne dépasse pas 2 ans
    const diffYears = endDate.getFullYear() - startDate.getFullYear();
    if (diffYears > 2) {
      errors.push('Une année scolaire ne peut pas dépasser 2 années civiles');
    }
  }
  
  return errors;
};

// === ✅ ROUTE DE TEST CORRIGÉE ===
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint school-years');
  res.json({
    success: true,
    message: 'Routes années scolaires fonctionnelles - VERSION CORRIGÉE',
    timestamp: new Date().toISOString(),
    routes: [
      'GET / - Lister toutes les années scolaires',
      'GET /current - Année scolaire actuelle',
      'GET /:id - Détails d\'une année scolaire',
      'POST / - Créer une nouvelle année scolaire',
      'PUT /:id - Modifier une année scolaire',
      'DELETE /:id - Supprimer une année scolaire',
      'PATCH /:id/set-current - Définir comme année courante',
      'GET /options/select - ✅ ANNÉES POUR FORMULAIRES (CORRIGÉ)',
      'GET /stats - Statistiques des années scolaires'
    ],
    debug: {
      cors_enabled: true,
      authentication_required: true,
      content_type: 'application/json'
    }
  });
});

// === ✅ ANNÉES SCOLAIRES POUR FORMULAIRES - CORRIGÉ ===
router.get('/options/select', authenticateToken, async (req, res) => {
  try {
    console.log('📅 === RÉCUPÉRATION ANNÉES POUR FORMULAIRES ===');
    console.log('📡 Headers reçus:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer [TOKEN]' : 'Non fourni',
      'origin': req.headers.origin
    });

    const { include_past = 'false' } = req.query;

    console.log('🔍 Paramètres de filtre:', { include_past });

    let whereCondition = '1=1';
    if (include_past === 'false') {
      whereCondition = 'end_date >= CURRENT_DATE';
    }

    const optionsQuery = `
      SELECT 
        id,
        name,
        start_date,
        end_date,
        is_current,
        description,
        name || CASE 
          WHEN is_current THEN ' (Actuelle)'
          WHEN end_date < CURRENT_DATE THEN ' (Terminée)'
          WHEN start_date > CURRENT_DATE THEN ' (Future)'
          ELSE ''
        END as display_name,
        
        -- Informations de statut pour debug
        CASE 
          WHEN is_current THEN 'current'
          WHEN end_date < CURRENT_DATE THEN 'past'
          WHEN start_date > CURRENT_DATE THEN 'future'
          ELSE 'active'
        END as status_type
        
      FROM school_years
      WHERE ${whereCondition}
      ORDER BY 
        CASE WHEN is_current THEN 0 ELSE 1 END,
        start_date DESC
    `;

    console.log('🔍 Exécution requête années scolaires pour select...');
    console.log('📝 Requête SQL:', optionsQuery);
    
    const result = await query(optionsQuery);

    console.log(`✅ ${result.rows.length} années scolaires trouvées pour formulaires`);
    
    // Log détaillé pour debug
    if (result.rows.length > 0) {
      console.log('📅 Première année exemple:', {
        id: result.rows[0].id,
        name: result.rows[0].name,
        display_name: result.rows[0].display_name,
        is_current: result.rows[0].is_current,
        status_type: result.rows[0].status_type
      });
      
      console.log('📅 Toutes les années trouvées:');
      result.rows.forEach((year, index) => {
        console.log(`   ${index + 1}. ${year.display_name} (${year.status_type})`);
      });
    } else {
      console.warn('⚠️ Aucune année scolaire trouvée pour les formulaires');
      
      // Requête de diagnostic complète
      const diagResult = await query(`
        SELECT 
          id,
          name,
          start_date,
          end_date,
          is_current,
          CASE 
            WHEN end_date < CURRENT_DATE THEN 'Terminée'
            WHEN start_date > CURRENT_DATE THEN 'Future'
            WHEN is_current THEN 'Actuelle'
            ELSE 'Active'
          END as status,
          end_date >= CURRENT_DATE as meets_filter
        FROM school_years 
        ORDER BY start_date DESC
      `);
      
      console.log('📊 Diagnostic table school_years:');
      console.log('   Total années en base:', diagResult.rows.length);
      diagResult.rows.forEach((year, index) => {
        console.log(`   ${index + 1}. ${year.name} - ${year.status} - Filtre OK: ${year.meets_filter}`);
      });
    }

    // ✅ RÉPONSE JSON GARANTIE
    const response = {
      success: true,
      school_years: result.rows,
      total: result.rows.length,
      filters: {
        include_past: include_past,
        where_condition: whereCondition
      },
      debug: {
        query_executed: true,
        rows_found: result.rows.length,
        endpoint: '/api/school-years/options/select'
      }
    };

    console.log('📤 Réponse envoyée:', {
      success: response.success,
      school_years_count: response.school_years.length,
      content_type: 'application/json'
    });

    // ✅ HEADERS JSON EXPLICITES
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(response);

  } catch (error) {
    console.error('💥 === ERREUR ANNÉES SCOLAIRES OPTIONS ===');
    console.error('❌ Erreur:', error.message);
    console.error('📍 Stack:', error.stack);
    
    // ✅ RÉPONSE D'ERREUR JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des années scolaires',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code
      } : undefined,
      debug: {
        endpoint: '/api/school-years/options/select',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// === LISTER TOUTES LES ANNÉES SCOLAIRES ===
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      current_only = 'false',
      include_stats = 'true',
      limit = 20,
      offset = 0
    } = req.query;

    console.log('📋 Récupération années scolaires');

    let whereCondition = '1=1';
    let queryParams = [];

    if (current_only === 'true') {
      whereCondition = 'sy.is_current = true';
    }

    const schoolYearsQuery = `
      SELECT 
        sy.id, 
        sy.name, 
        sy.start_date, 
        sy.end_date, 
        sy.is_current,
        sy.description,
        sy.created_at, 
        sy.updated_at,
        
        -- Informations calculées
        CASE 
          WHEN sy.end_date < CURRENT_DATE THEN 'Terminée'
          WHEN sy.start_date > CURRENT_DATE THEN 'Future'
          WHEN sy.is_current = true THEN 'En cours'
          ELSE 'Active'
        END as status_display,
        
        CASE 
          WHEN sy.end_date < CURRENT_DATE THEN 'secondary'
          WHEN sy.start_date > CURRENT_DATE THEN 'info'
          WHEN sy.is_current = true THEN 'success'
          ELSE 'primary'
        END as status_color,
        
        -- Durée en jours
        (sy.end_date - sy.start_date) as duration_days,
        
        -- Progression (si année en cours)
        CASE 
          WHEN sy.start_date <= CURRENT_DATE AND sy.end_date >= CURRENT_DATE THEN
            ROUND(100.0 * (CURRENT_DATE - sy.start_date) / (sy.end_date - sy.start_date), 1)
          ELSE NULL
        END as progress_percentage,
        
        -- Dates formatées
        TO_CHAR(sy.start_date, 'DD/MM/YYYY') as start_date_formatted,
        TO_CHAR(sy.end_date, 'DD/MM/YYYY') as end_date_formatted
        
        ${include_stats === 'true' ? `,
        -- Statistiques si demandées
        (SELECT COUNT(*) FROM students s WHERE s.school_year_id = sy.id AND (s.deleted = false OR s.deleted IS NULL)) as total_students,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id) as total_classes,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id AND c.is_active = true) as active_classes
        ` : ''}

      FROM school_years sy
      WHERE ${whereCondition}
      ORDER BY sy.start_date DESC
      LIMIT $1 OFFSET $2
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const result = await query(schoolYearsQuery, queryParams);

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM school_years sy WHERE ${whereCondition}`;
    const countResult = await query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    console.log(`✅ ${result.rows.length} années scolaires récupérées`);

    res.json({
      success: true,
      school_years: result.rows,
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        per_page: parseInt(limit),
        total_items: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('💥 Erreur récupération années scolaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des années scolaires'
    });
  }
});

// === ANNÉE SCOLAIRE ACTUELLE ===
router.get('/current', authenticateToken, async (req, res) => {
  try {
    console.log('📅 Récupération année scolaire actuelle');

    const currentYearQuery = `
      SELECT 
        sy.*,
        
        -- Statistiques de l'année courante
        (SELECT COUNT(*) FROM students s WHERE s.school_year_id = sy.id AND (s.deleted = false OR s.deleted IS NULL)) as total_students,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id) as total_classes,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id AND c.is_active = true) as active_classes,
        
        -- Progression
        ROUND(100.0 * (CURRENT_DATE - sy.start_date) / (sy.end_date - sy.start_date), 1) as progress_percentage,
        
        -- Jours restants
        (sy.end_date - CURRENT_DATE) as days_remaining,
        
        -- Dates formatées
        TO_CHAR(sy.start_date, 'DD/MM/YYYY') as start_date_formatted,
        TO_CHAR(sy.end_date, 'DD/MM/YYYY') as end_date_formatted
        
      FROM school_years sy
      WHERE sy.is_current = true
      LIMIT 1
    `;

    const result = await query(currentYearQuery);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        school_year: null,
        message: 'Aucune année scolaire courante définie'
      });
    }

    const currentYear = result.rows[0];

    console.log('✅ Année scolaire actuelle:', currentYear.name);

    res.json({
      success: true,
      school_year: currentYear
    });

  } catch (error) {
    console.error('💥 Erreur récupération année actuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'année scolaire actuelle'
    });
  }
});

// === DÉTAILS D'UNE ANNÉE SCOLAIRE ===
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const yearId = req.params.id;

    if (!yearId || !yearId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'année scolaire invalide'
      });
    }

    console.log('👁️ Récupération détails année scolaire ID:', yearId);

    const yearQuery = `
      SELECT 
        sy.*,
        
        -- Statistiques complètes
        (SELECT COUNT(*) FROM students s WHERE s.school_year_id = sy.id AND (s.deleted = false OR s.deleted IS NULL)) as total_students,
        (SELECT COUNT(*) FROM students s WHERE s.school_year_id = sy.id AND s.gender = 'M' AND (s.deleted = false OR s.deleted IS NULL)) as male_students,
        (SELECT COUNT(*) FROM students s WHERE s.school_year_id = sy.id AND s.gender = 'F' AND (s.deleted = false OR s.deleted IS NULL)) as female_students,
        (SELECT COUNT(*) FROM students s WHERE s.school_year_id = sy.id AND s.is_orphan = true AND (s.deleted = false OR s.deleted IS NULL)) as orphan_students,
        
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id) as total_classes,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id AND c.is_active = true) as active_classes,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id AND c.type = 'coranic') as coranic_classes,
        (SELECT COUNT(*) FROM classes c WHERE c.school_year_id = sy.id AND c.type = 'french') as french_classes,
        
        -- Capacité totale
        (SELECT SUM(c.capacity) FROM classes c WHERE c.school_year_id = sy.id AND c.is_active = true) as total_capacity,
        
        -- Progression si année en cours
        CASE 
          WHEN sy.start_date <= CURRENT_DATE AND sy.end_date >= CURRENT_DATE THEN
            ROUND(100.0 * (CURRENT_DATE - sy.start_date) / (sy.end_date - sy.start_date), 1)
          ELSE NULL
        END as progress_percentage,
        
        -- Statut
        CASE 
          WHEN sy.end_date < CURRENT_DATE THEN 'Terminée'
          WHEN sy.start_date > CURRENT_DATE THEN 'Future'
          WHEN sy.is_current = true THEN 'En cours'
          ELSE 'Active'
        END as status_display,
        
        -- Dates formatées
        TO_CHAR(sy.start_date, 'DD/MM/YYYY') as start_date_formatted,
        TO_CHAR(sy.end_date, 'DD/MM/YYYY') as end_date_formatted,
        
        -- Durée
        (sy.end_date - sy.start_date) as duration_days

      FROM school_years sy
      WHERE sy.id = $1
    `;

    const result = await query(yearQuery, [yearId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Année scolaire non trouvée'
      });
    }

    const yearData = result.rows[0];

    // Récupérer les classes de cette année
    const classesQuery = `
      SELECT 
        id, name, level, type, capacity, teacher_name, is_active,
        CASE 
          WHEN type = 'coranic' THEN (
            SELECT COUNT(*) FROM students s WHERE s.coranic_class_id = id AND (s.deleted = false OR s.deleted IS NULL)
          )
          WHEN type = 'french' THEN (
            SELECT COUNT(*) FROM students s WHERE s.french_class_id = id AND (s.deleted = false OR s.deleted IS NULL)
          )
          ELSE 0
        END as current_students
      FROM classes 
      WHERE school_year_id = $1
      ORDER BY type, level, name
    `;

    const classesResult = await query(classesQuery, [yearId]);

    console.log(`✅ Détails année scolaire: ${yearData.name} (${classesResult.rows.length} classes)`);

    res.json({
      success: true,
      school_year: {
        ...yearData,
        classes: classesResult.rows,
        occupancy_rate: yearData.total_capacity > 0 
          ? Math.round((yearData.total_students / yearData.total_capacity) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('💥 Erreur récupération détails année scolaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails de l\'année scolaire'
    });
  }
});

// === CRÉER UNE NOUVELLE ANNÉE SCOLAIRE ===
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      start_date,
      end_date,
      description,
      is_current = false
    } = req.body;

    console.log('➕ Création nouvelle année scolaire:', { name, start_date, end_date });

    // Validation des données
    const validationErrors = validateSchoolYearData({
      name, start_date, end_date
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationErrors
      });
    }

    // Vérifier l'unicité du nom
    const existingYear = await query(
      'SELECT id, name FROM school_years WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existingYear.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Une année scolaire avec ce nom existe déjà'
      });
    }

    // Utiliser une transaction pour gérer l'année courante
    const result = await transaction(async (client) => {
      // Si cette année doit être courante, désactiver les autres
      if (is_current) {
        await client.query(
          'UPDATE school_years SET is_current = false WHERE is_current = true'
        );
      }

      // Créer la nouvelle année scolaire
      const createResult = await client.query(`
        INSERT INTO school_years (
          name, start_date, end_date, description, is_current,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        sanitizeText(name),
        start_date,
        end_date,
        description ? sanitizeText(description) : null,
        is_current
      ]);

      return createResult.rows[0];
    });

    console.log('✅ Année scolaire créée:', result.name);

    res.status(201).json({
      success: true,
      message: 'Année scolaire créée avec succès',
      school_year: result
    });

  } catch (error) {
    console.error('💥 Erreur création année scolaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'année scolaire'
    });
  }
});

// === MODIFIER UNE ANNÉE SCOLAIRE ===
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const yearId = req.params.id;

    if (!yearId || !yearId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'année scolaire invalide'
      });
    }

    const {
      name,
      start_date,
      end_date,
      description,
      is_current
    } = req.body;

    console.log('✏️ Modification année scolaire ID:', yearId);

    // Vérifier que l'année existe
    const existingYear = await query(
      'SELECT id, name FROM school_years WHERE id = $1',
      [yearId]
    );

    if (existingYear.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Année scolaire non trouvée'
      });
    }

    // Validation des nouvelles données
    const validationErrors = validateSchoolYearData({
      name, start_date, end_date
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationErrors
      });
    }

    // Vérifier l'unicité du nom (sauf pour cette année)
    if (name) {
      const duplicateYear = await query(
        'SELECT id FROM school_years WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name, yearId]
      );

      if (duplicateYear.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Une autre année scolaire avec ce nom existe déjà'
        });
      }
    }

    // Utiliser une transaction pour la modification
    const result = await transaction(async (client) => {
      // Si cette année doit devenir courante, désactiver les autres
      if (is_current === true) {
        await client.query(
          'UPDATE school_years SET is_current = false WHERE is_current = true AND id != $1',
          [yearId]
        );
      }

      // Mettre à jour l'année scolaire
      const updateResult = await client.query(`
        UPDATE school_years SET
          name = $1, start_date = $2, end_date = $3, description = $4,
          is_current = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `, [
        sanitizeText(name),
        start_date,
        end_date,
        description ? sanitizeText(description) : null,
        is_current !== undefined ? is_current : false,
        yearId
      ]);

      return updateResult.rows[0];
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Année scolaire non trouvée pour la modification'
      });
    }

    console.log('✅ Année scolaire modifiée:', result.name);

    res.json({
      success: true,
      message: 'Année scolaire modifiée avec succès',
      school_year: result
    });

  } catch (error) {
    console.error('💥 Erreur modification année scolaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l\'année scolaire'
    });
  }
});

// === DÉFINIR COMME ANNÉE COURANTE ===
router.patch('/:id/set-current', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const yearId = req.params.id;

    if (!yearId || !yearId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'année scolaire invalide'
      });
    }

    console.log('🎯 Définition année courante ID:', yearId);

    // Vérifier que l'année existe
    const yearExists = await query(
      'SELECT id, name FROM school_years WHERE id = $1',
      [yearId]
    );

    if (yearExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Année scolaire non trouvée'
      });
    }

    // Utiliser une transaction pour garantir l'unicité
    const result = await transaction(async (client) => {
      // Désactiver toutes les années courantes
      await client.query(
        'UPDATE school_years SET is_current = false WHERE is_current = true'
      );

      // Activer cette année comme courante
      const updateResult = await client.query(
        'UPDATE school_years SET is_current = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [yearId]
      );

      return updateResult.rows[0];
    });

    console.log('✅ Année courante définie:', result.name);

    res.json({
      success: true,
      message: `Année scolaire "${result.name}" définie comme courante`,
      school_year: result
    });

  } catch (error) {
    console.error('💥 Erreur définition année courante:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la définition de l\'année courante'
    });
  }
});

// === SUPPRIMER UNE ANNÉE SCOLAIRE ===
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const yearId = req.params.id;

    if (!yearId || !yearId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'année scolaire invalide'
      });
    }

    console.log('🗑️ Suppression année scolaire ID:', yearId);

    // Vérifier que l'année existe
    const yearResult = await query(
      'SELECT id, name, is_current FROM school_years WHERE id = $1',
      [yearId]
    );

    if (yearResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Année scolaire non trouvée'
      });
    }

    const yearData = yearResult.rows[0];

    // Empêcher la suppression de l'année courante
    if (yearData.is_current) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer l\'année scolaire courante',
        suggestion: 'Définissez d\'abord une autre année comme courante'
      });
    }

    // Vérifier s'il y a des étudiants ou classes liés
    const relatedDataQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE school_year_id = $1) as students_count,
        (SELECT COUNT(*) FROM classes WHERE school_year_id = $1) as classes_count
    `;

    const relatedData = await query(relatedDataQuery, [yearId]);
    const { students_count, classes_count } = relatedData.rows[0];

    if (parseInt(students_count) > 0 || parseInt(classes_count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer cette année scolaire',
        details: {
          students_count: parseInt(students_count),
          classes_count: parseInt(classes_count),
          message: 'Des étudiants ou classes sont encore liés à cette année'
        },
        suggestion: 'Supprimez d\'abord les étudiants et classes ou transférez-les vers une autre année'
      });
    }

    // Supprimer l'année scolaire
    const deleteResult = await query(
      'DELETE FROM school_years WHERE id = $1 RETURNING name',
      [yearId]
    );

    console.log('✅ Année scolaire supprimée:', deleteResult.rows[0].name);

    res.json({
      success: true,
      message: `Année scolaire "${deleteResult.rows[0].name}" supprimée avec succès`,
      deleted_school_year: {
        id: yearId,
        name: deleteResult.rows[0].name
      }
    });

  } catch (error) {
    console.error('💥 Erreur suppression année scolaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'année scolaire'
    });
  }
});

// === STATISTIQUES DES ANNÉES SCOLAIRES ===
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération statistiques années scolaires');

    // Statistiques générales
    const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_years,
        COUNT(CASE WHEN is_current = true THEN 1 END) as current_years,
        COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as past_years,
        COUNT(CASE WHEN start_date > CURRENT_DATE THEN 1 END) as future_years,
        MIN(start_date) as earliest_start,
        MAX(end_date) as latest_end
      FROM school_years
    `;

    // Évolution des inscriptions par année
    const enrollmentEvolutionQuery = `
      SELECT 
        sy.name as year_name,
        sy.start_date,
        COUNT(s.id) as total_students,
        COUNT(CASE WHEN s.gender = 'M' THEN 1 END) as male_students,
        COUNT(CASE WHEN s.gender = 'F' THEN 1 END) as female_students,
        COUNT(CASE WHEN s.is_orphan = true THEN 1 END) as orphan_students,
        COUNT(c.id) as total_classes
      FROM school_years sy
      LEFT JOIN students s ON sy.id = s.school_year_id AND (s.deleted = false OR s.deleted IS NULL)
      LEFT JOIN classes c ON sy.id = c.school_year_id
      GROUP BY sy.id, sy.name, sy.start_date
      ORDER BY sy.start_date DESC
      LIMIT 10
    `;

    // Comparaison années récentes
    const recentYearsQuery = `
      SELECT 
        sy.name,
        sy.is_current,
        COUNT(DISTINCT s.id) as students_count,
        COUNT(DISTINCT c.id) as classes_count,
        SUM(c.capacity) as total_capacity,
        ROUND(100.0 * COUNT(DISTINCT s.id) / NULLIF(SUM(c.capacity), 0), 1) as occupancy_rate
      FROM school_years sy
      LEFT JOIN students s ON sy.id = s.school_year_id AND (s.deleted = false OR s.deleted IS NULL)
      LEFT JOIN classes c ON sy.id = c.school_year_id AND c.is_active = true
      WHERE sy.start_date >= CURRENT_DATE - INTERVAL '3 years'
      GROUP BY sy.id, sy.name, sy.is_current, sy.start_date
      ORDER BY sy.start_date DESC
    `;

    const [generalStats, enrollmentEvolution, recentYears] = await Promise.all([
      query(generalStatsQuery),
      query(enrollmentEvolutionQuery),
      query(recentYearsQuery)
    ]);

    console.log('✅ Statistiques années scolaires récupérées');

    res.json({
      success: true,
      stats: {
        general: generalStats.rows[0],
        enrollment_evolution: enrollmentEvolution.rows,
        recent_years_comparison: recentYears.rows
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erreur statistiques années scolaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// === ARCHIVER UNE ANNÉE SCOLAIRE ===
router.patch('/:id/archive', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const yearId = req.params.id;

    if (!yearId || !yearId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'année scolaire invalide'
      });
    }

    console.log('📦 Archivage année scolaire ID:', yearId);

    // Vérifier que l'année existe et n'est pas courante
    const yearResult = await query(
      'SELECT id, name, is_current, end_date FROM school_years WHERE id = $1',
      [yearId]
    );

    if (yearResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Année scolaire non trouvée'
      });
    }

    const yearData = yearResult.rows[0];

    if (yearData.is_current) {
      return res.status(400).json({
        success: false,
        error: 'Impossible d\'archiver l\'année scolaire courante'
      });
    }

    // L'archivage consiste à désactiver toutes les classes de cette année
    const archiveResult = await transaction(async (client) => {
      // Désactiver toutes les classes de cette année
      const classesUpdate = await client.query(`
        UPDATE classes 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE school_year_id = $1 AND is_active = true
        RETURNING id
      `, [yearId]);

      // Mettre à jour la description pour indiquer l'archivage
      const yearUpdate = await client.query(`
        UPDATE school_years 
        SET description = COALESCE(description, '') || ' [Archivée le ' || TO_CHAR(CURRENT_DATE, 'DD/MM/YYYY') || ']',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [yearId]);

      return {
        year: yearUpdate.rows[0],
        archived_classes: classesUpdate.rows.length
      };
    });

    console.log(`✅ Année scolaire archivée: ${yearData.name} (${archiveResult.archived_classes} classes désactivées)`);

    res.json({
      success: true,
      message: `Année scolaire "${yearData.name}" archivée avec succès`,
      archived_year: archiveResult.year,
      archived_classes_count: archiveResult.archived_classes
    });

  } catch (error) {
    console.error('💥 Erreur archivage année scolaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'archivage de l\'année scolaire'
    });
  }
});

console.log('✅ === SCHOOL-YEARS.JS CORRIGÉ ET COMPLET ===');
console.log('📅 Fonctionnalités disponibles:');
console.log('  - CRUD complet des années scolaires');
console.log('  - ✅ GET /options/select - Années pour formulaires (CORRIGÉ)');
console.log('  - Gestion de l\'année courante unique');
console.log('  - Statistiques et évolution');
console.log('  - Archivage et protection des données');
console.log('  - Validation des dates et formats');
console.log('🚨 PROBLÈMES CORRIGÉS:');
console.log('  ❌ Endpoint manquant → ✅ /options/select disponible');
console.log('  ❌ Pas de debugging → ✅ Logs détaillés ajoutés');
console.log('  ❌ Réponses non-JSON → ✅ Headers JSON explicites');

module.exports = router;