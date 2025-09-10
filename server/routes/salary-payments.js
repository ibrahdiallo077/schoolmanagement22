// server/routes/salary-payments.js - VERSION CORRIGÉE SELON STRUCTURE DB

const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sanitizeText } = require('../utils/validation');

const router = express.Router();

console.log('💰 Module salary-payments.js chargé - VERSION CORRIGÉE DB');

// === CONSTANTES ===
const PAYMENT_TYPES = [
  { value: 'monthly', label: 'Salaire mensuel' },
  { value: 'bonus', label: 'Prime/Bonus' },
  { value: 'advance', label: 'Avance sur salaire' },
  { value: 'custom', label: 'Paiement personnalisé' }
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: '💵' },
  { value: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { value: 'check', label: 'Chèque', icon: '📄' }
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'En attente', color: 'orange', icon: '⏳' },
  { value: 'completed', label: 'Payé', color: 'green', icon: '✅' },
  { value: 'partial', label: 'Partiel', color: 'blue', icon: '📊' },
  { value: 'cancelled', label: 'Annulé', color: 'red', icon: '❌' }
];

// === MIDDLEWARE CORS ===
router.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173',
    'http://127.0.0.1:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  console.log(`💰 SALARY-PAYMENTS: ${req.method} ${req.originalUrl}`);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// === FONCTIONS UTILITAIRES ===
const formatGNF = (amount) => {
  const numAmount = Number(amount || 0);
  if (isNaN(numAmount)) return '0 FG';
  return `${numAmount.toLocaleString()} FG`;
};

const getMonthName = (month) => {
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthNum = Number(month || 1);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return 'Mois inconnu';
  return months[monthNum - 1] || 'Mois inconnu';
};

const generateReceiptNumber = async (paymentType = 'monthly') => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const typeCode = paymentType.toUpperCase().substring(0, 3);
    const baseId = `SAL-${typeCode}-${currentYear}${currentMonth.toString().padStart(2, '0')}`;
    
    const result = await query(
      `SELECT COUNT(*) as count FROM salary_payments_v2 WHERE receipt_number LIKE $1`,
      [`${baseId}-%`]
    );
    
    const nextNumber = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
    return `${baseId}-${nextNumber}`;
  } catch (error) {
    console.error('💥 Erreur génération numéro reçu:', error);
    throw new Error('Erreur génération numéro reçu');
  }
};

// === RÉCUPÉRER ANNÉE SCOLAIRE COURANTE ===
const getCurrentSchoolYear = async () => {
  try {
    const result = await query(`
      SELECT 
        id, name, start_date, end_date,
        EXTRACT(YEAR FROM start_date) as start_year,
        EXTRACT(YEAR FROM end_date) as end_year
      FROM school_years 
      WHERE is_current = true 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const schoolYear = result.rows[0];
      return {
        id: schoolYear.id,
        name: schoolYear.name,
        start_year: parseInt(schoolYear.start_year),
        end_year: parseInt(schoolYear.end_year),
        current_year: parseInt(schoolYear.start_year)
      };
    }
    
    // Fallback sur année civile
    const currentYear = new Date().getFullYear();
    console.warn('⚠️ Aucune année scolaire courante, utilisation année civile:', currentYear);
    
    return {
      id: null,
      name: `${currentYear}-${currentYear + 1}`,
      start_year: currentYear,
      end_year: currentYear + 1,
      current_year: currentYear
    };
  } catch (error) {
    console.error('💥 Erreur récupération année scolaire:', error);
    const currentYear = new Date().getFullYear();
    return {
      id: null,
      name: `${currentYear}-${currentYear + 1}`,
      current_year: currentYear
    };
  }
};

// ✅ FONCTION CORRIGÉE - Créer configuration salaire temporaire
const createTemporarySalaryConfig = async (staffId, amount) => {
  try {
    console.log(`🔧 Création config salaire temporaire pour staff ${staffId}, montant: ${amount}`);
    
    const insertResult = await query(`
      INSERT INTO staff_salaries_v2 (
        staff_id, monthly_salary, bonus_percent, deduction_percent, 
        is_active, notes, created_at
      ) VALUES (
        $1, $2, 0, 5, true, 'Configuration temporaire créée automatiquement', CURRENT_TIMESTAMP
      ) RETURNING id
    `, [staffId, parseFloat(amount)]);
    
    const newConfigId = insertResult.rows[0].id;
    console.log(`✅ Config salaire temporaire créée avec ID: ${newConfigId}`);
    
    return newConfigId;
  } catch (error) {
    console.error('💥 Erreur création config temporaire:', error);
    throw error;
  }
};

// === ROUTE DE TEST ÉTENDUE ===
router.get('/test', async (req, res) => {
  try {
    const currentSchoolYear = await getCurrentSchoolYear();
    
    // ✅ Test simple de récupération des paiements
    const testQuery = await query('SELECT COUNT(*) as count FROM salary_payments_v2');
    const paymentCount = testQuery.rows[0].count;
    
    // ✅ Test de récupération des employés
    const staffQuery = await query('SELECT COUNT(*) as count FROM staff WHERE status = $1', ['active']);
    const staffCount = staffQuery.rows[0].count;
    
    res.json({
      success: true,
      message: 'API Paiements Salaires - VERSION CORRIGÉE DB',
      timestamp: new Date().toISOString(),
      current_school_year: currentSchoolYear,
      database_status: {
        total_payments: parseInt(paymentCount),
        active_staff: parseInt(staffCount)
      },
      available_payment_types: PAYMENT_TYPES.length,
      available_payment_methods: PAYMENT_METHODS.length,
      available_statuses: PAYMENT_STATUSES.length,
      api_endpoints: [
        '/test',
        '/dashboard',
        '/history',
        '/staff/available',
        '/create',
        '/payment/:id',
        '/payment/:id/status'
      ]
    });
  } catch (error) {
    console.error('💥 Erreur test:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test de l\'API',
      details: error.message
    });
  }
});

// === EMPLOYÉS DISPONIBLES POUR PAIEMENT ===
router.get('/staff/available', authenticateToken, async (req, res) => {
  try {
    const { search = '' } = req.query;
    
    console.log('👥 Récupération employés disponibles pour paiement');

    let searchCondition = '';
    let params = [];
    
    if (search.trim()) {
      searchCondition = `AND (
        LOWER(s.first_name) LIKE LOWER($1) OR 
        LOWER(s.last_name) LIKE LOWER($1) OR 
        LOWER(s.staff_number) LIKE LOWER($1)
      )`;
      params = [`%${search.trim()}%`];
    }

    // Récupérer tous les employés actifs avec leurs configs salaire éventuelles
    const staffQuery = `
      SELECT 
        s.id as staff_id,
        s.staff_number,
        s.first_name,
        s.last_name,
        s.first_name || ' ' || s.last_name as full_name,
        s.position,
        s.department,
        s.photo_url,
        s.email,
        s.phone,
        
        -- Configuration salaire (peut être NULL)
        ss.id as salary_config_id,
        ss.monthly_salary,
        ss.bonus_percent,
        ss.deduction_percent,
        ss.is_active as salary_config_active,
        
        -- Calculs seulement si configuration existe
        CASE 
          WHEN ss.monthly_salary IS NOT NULL THEN 
            ss.monthly_salary * (1 + COALESCE(ss.bonus_percent, 0) / 100)
          ELSE NULL
        END as gross_salary,
        
        CASE 
          WHEN ss.monthly_salary IS NOT NULL THEN 
            ss.monthly_salary * (1 + COALESCE(ss.bonus_percent, 0) / 100) * (1 - COALESCE(ss.deduction_percent, 5) / 100)
          ELSE NULL
        END as net_salary
        
      FROM staff s
      LEFT JOIN staff_salaries_v2 ss ON s.id = ss.staff_id AND ss.is_active = true
      WHERE s.status = 'active' ${searchCondition}
      ORDER BY s.first_name, s.last_name
    `;

    const result = await query(staffQuery, params);
    
    console.log(`📊 ${result.rows.length} employés trouvés`);

    if (result.rows.length === 0) {
      console.log('⚠️ Aucun employé actif trouvé');
      return res.json({
        success: true,
        staff: [],
        total_staff: 0,
        message: 'Aucun employé actif trouvé'
      });
    }

    const enrichedStaff = result.rows.map(staff => {
      // ✅ Utiliser staff_id pour identifier l'employé
      const staffSalaryId = staff.salary_config_id || `temp_${staff.staff_id}`;
      
      return {
        value: staffSalaryId,
        label: `${staff.first_name} ${staff.last_name}`,
        
        staff_id: staff.staff_id,
        staff_salary_id: staffSalaryId,
        staff_number: staff.staff_number,
        first_name: staff.first_name,
        last_name: staff.last_name,
        full_name: staff.full_name,
        position: staff.position || 'Poste non défini',
        department: staff.department || 'Département non défini',
        photo_url: staff.photo_url,
        email: staff.email,
        phone: staff.phone,
        
        monthly_salary: staff.monthly_salary,
        gross_salary: staff.gross_salary,
        net_salary: staff.net_salary,
        
        has_salary_config: !!staff.salary_config_id,
        salary_config_active: staff.salary_config_active || false,
        
        display_name: `${staff.first_name} ${staff.last_name}`,
        display_label: `${staff.first_name} ${staff.last_name} (${staff.staff_number})`,
        subtitle: `${staff.position || 'Poste non défini'}`,
        
        formatted_monthly_salary: staff.monthly_salary ? 
          formatGNF(staff.monthly_salary) : null,
          
        formatted_net_salary: staff.net_salary ? 
          formatGNF(staff.net_salary) : null
      };
    });

    console.log(`✅ ${enrichedStaff.length} employés disponibles`);

    res.json({
      success: true,
      staff: enrichedStaff,
      total_staff: enrichedStaff.length
    });

  } catch (error) {
    console.error('💥 Erreur récupération employés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des employés',
      details: error.message
    });
  }
});

// ✅ CRÉER UN NOUVEAU PAIEMENT - VERSION CORRIGÉE SELON STRUCTURE DB ===
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      staff_salary_id, payment_type, amount, payment_date, payment_method,
      payment_year, payment_month, gross_amount, net_amount, notes, payment_status = 'completed'
    } = req.body;

    console.log('➕ CRÉATION NOUVEAU PAIEMENT SALAIRE');
    console.log('📝 Données reçues:', { staff_salary_id, payment_type, amount, payment_method });

    // Validation basique
    if (!staff_salary_id || !payment_type || !amount || !payment_method) {
      console.error('❌ Champs obligatoires manquants');
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants (staff_salary_id, payment_type, amount, payment_method)'
      });
    }

    // Récupérer l'année scolaire courante
    const currentSchoolYear = await getCurrentSchoolYear();
    console.log('📅 Année scolaire courante:', currentSchoolYear);

    let finalStaffSalaryId = staff_salary_id;

    // ✅ GESTION DES IDs TEMPORAIRES
    if (staff_salary_id.startsWith('temp_')) {
      console.log('🔧 ID temporaire détecté, création config salaire...');
      
      // Extraire l'ID de l'employé
      const actualStaffId = staff_salary_id.replace('temp_', '');
      
      // Vérifier que l'employé existe
      const staffExists = await query('SELECT id FROM staff WHERE id = $1 AND status = $2', [actualStaffId, 'active']);
      if (staffExists.rows.length === 0) {
        console.error('❌ Employé non trouvé:', actualStaffId);
        return res.status(400).json({
          success: false,
          error: 'Employé non trouvé ou inactif'
        });
      }

      // Créer une configuration salaire temporaire
      try {
        finalStaffSalaryId = await createTemporarySalaryConfig(actualStaffId, amount);
        console.log(`✅ Config temporaire créée avec ID: ${finalStaffSalaryId}`);
      } catch (configError) {
        console.error('💥 Erreur création config temporaire:', configError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création de la configuration salaire'
        });
      }
    } else {
      // Vérifier que la config salaire existe
      const configExists = await query('SELECT id FROM staff_salaries_v2 WHERE id = $1', [staff_salary_id]);
      if (configExists.rows.length === 0) {
        console.error('❌ Configuration salaire non trouvée:', staff_salary_id);
        return res.status(400).json({
          success: false,
          error: 'Configuration salaire non trouvée'
        });
      }
    }

    // Valeurs par défaut
    const finalPaymentYear = payment_year || currentSchoolYear.current_year;
    const finalPaymentMonth = payment_month || new Date().getMonth() + 1;
    const netAmount = parseFloat(amount);
    const grossAmount = gross_amount ? parseFloat(gross_amount) : netAmount;

    // Générer numéro de reçu
    const receiptNumber = await generateReceiptNumber(payment_type);

    console.log('💾 Insertion en base de données...');
    
    // ✅ REQUÊTE CORRIGÉE SELON STRUCTURE DB RÉELLE
    const createResult = await query(`
      INSERT INTO salary_payments_v2 (
        staff_salary_id, 
        payment_type, 
        amount, 
        payment_date, 
        payment_method,
        payment_year, 
        payment_month, 
        gross_amount, 
        net_amount, 
        receipt_number,
        notes, 
        payment_status,
        status,
        created_at, 
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, CURRENT_TIMESTAMP, $13
      ) RETURNING *
    `, [
      finalStaffSalaryId, // Utiliser l'ID final (réel ou temporaire créé)
      payment_type,
      parseFloat(amount),
      payment_date || new Date().toISOString().split('T')[0],
      payment_method,
      finalPaymentYear,
      finalPaymentMonth,
      grossAmount,
      netAmount,
      receiptNumber,
      notes ? sanitizeText(notes) : null,
      payment_status, // payment_status ET status
      req.user?.username || 'system'
    ]);

    const newPayment = createResult.rows[0];

    // Enrichir les données
    const typeObj = PAYMENT_TYPES.find(pt => pt.value === newPayment.payment_type);
    const methodObj = PAYMENT_METHODS.find(pm => pm.value === newPayment.payment_method);
    const statusObj = PAYMENT_STATUSES.find(ps => ps.value === newPayment.payment_status);

    const enrichedPayment = {
      ...newPayment,
      type_label: typeObj ? typeObj.label : newPayment.payment_type,
      method_label: methodObj ? methodObj.label : newPayment.payment_method,
      method_icon: methodObj ? methodObj.icon : '💰',
      status_label: statusObj ? statusObj.label : newPayment.payment_status,
      status_color: statusObj ? statusObj.color : 'gray',
      status_icon: statusObj ? statusObj.icon : '❓',
      
      formatted_amount: formatGNF(newPayment.amount),
      formatted_gross_amount: formatGNF(newPayment.gross_amount),
      formatted_net_amount: formatGNF(newPayment.net_amount),
      
      period_display: `${getMonthName(newPayment.payment_month)} ${newPayment.payment_year}`,
      school_year_info: currentSchoolYear
    };

    console.log(`✅ Paiement créé avec succès: ${receiptNumber}`);

    res.status(201).json({
      success: true,
      message: `Paiement ${receiptNumber} créé avec succès`,
      payment: enrichedPayment,
      current_school_year: currentSchoolYear
    });

  } catch (error) {
    console.error('💥 Erreur création paiement:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du paiement',
      details: error.message
    });
  }
});

// === TABLEAU DE BORD PRINCIPAL ===
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const currentSchoolYear = await getCurrentSchoolYear();
    const { year = currentSchoolYear.current_year, month } = req.query;
    
    console.log(`📊 Génération tableau de bord pour ${month ? `${month}/` : ''}${year}`);

    // Filtres de date
    let dateFilter = 'WHERE payment_year = $1';
    let params = [parseInt(year)];
    
    if (month) {
      dateFilter += ' AND payment_month = $2';
      params.push(parseInt(month));
    }

    // Statistiques principales - CORRIGÉES SELON STRUCTURE DB
    const mainStatsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(DISTINCT staff_salary_id) as unique_staff_paid,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        AVG(amount) as average_payment
      FROM salary_payments_v2 
      ${dateFilter}
    `;

    // Statistiques personnel
    const staffStatsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_active_staff,
        COUNT(DISTINCT ss.staff_id) as staff_with_salary_config,
        SUM(CASE WHEN ss.is_active = true THEN ss.monthly_salary ELSE 0 END) as total_monthly_payroll,
        AVG(CASE WHEN ss.is_active = true THEN ss.monthly_salary END) as avg_monthly_salary
      FROM staff s
      LEFT JOIN staff_salaries_v2 ss ON s.id = ss.staff_id
      WHERE s.status = 'active'
    `;

    // Paiements récents
    const recentPaymentsQuery = `
      SELECT 
        sp.id, sp.receipt_number, sp.amount, sp.payment_date, sp.status as payment_status,
        sp.payment_type, sp.payment_method,
        s.first_name, s.last_name, s.staff_number, s.photo_url, s.position
      FROM salary_payments_v2 sp
      INNER JOIN staff_salaries_v2 ss ON sp.staff_salary_id = ss.id
      INNER JOIN staff s ON ss.staff_id = s.id
      ORDER BY sp.created_at DESC
      LIMIT 10
    `;

    // Exécuter les requêtes
    const [mainStats, staffStats, recentPayments] = await Promise.all([
      query(mainStatsQuery, params),
      query(staffStatsQuery),
      query(recentPaymentsQuery)
    ]);

    const main = mainStats.rows[0];
    const staff = staffStats.rows[0];

    // Enrichir les paiements récents
    const enrichedRecentPayments = recentPayments.rows.map(payment => {
      const statusObj = PAYMENT_STATUSES.find(ps => ps.value === payment.payment_status);
      const typeObj = PAYMENT_TYPES.find(pt => pt.value === payment.payment_type);
      const methodObj = PAYMENT_METHODS.find(pm => pm.value === payment.payment_method);
      
      return {
        ...payment,
        staff_name: `${payment.first_name} ${payment.last_name}`,
        formatted_amount: formatGNF(payment.amount),
        payment_date_formatted: payment.payment_date ? 
          new Date(payment.payment_date).toLocaleDateString('fr-FR') : null,
        status_label: statusObj ? statusObj.label : payment.payment_status,
        status_color: statusObj ? statusObj.color : 'gray',
        status_icon: statusObj ? statusObj.icon : '❓',
        type_label: typeObj ? typeObj.label : payment.payment_type,
        method_label: methodObj ? methodObj.label : payment.payment_method,
        method_icon: methodObj ? methodObj.icon : '💰'
      };
    });

    // Construction de la réponse
    const dashboard = {
      period: {
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        month_name: month ? getMonthName(month) : null,
        school_year: currentSchoolYear
      },

      statistics: {
        total_payments: parseInt(main.total_payments || 0),
        completed_payments: parseInt(main.completed_payments || 0),
        pending_payments: parseInt(main.pending_payments || 0),
        total_amount: parseFloat(main.total_amount || 0),
        completed_amount: parseFloat(main.completed_amount || 0),
        pending_amount: parseFloat(main.pending_amount || 0),
        staff_paid_current_period: parseInt(main.unique_staff_paid || 0),
        
        formatted_total_amount: formatGNF(main.total_amount),
        formatted_completed_amount: formatGNF(main.completed_amount),
        formatted_pending_amount: formatGNF(main.pending_amount),
        
        completion_rate: main.total_payments > 0 ? 
          parseFloat(((main.completed_payments / main.total_payments) * 100).toFixed(2)) : 0
      },

      staff_info: {
        total_active_staff: parseInt(staff.total_active_staff || 0),
        staff_with_salary_config: parseInt(staff.staff_with_salary_config || 0),
        staff_paid_current_period: parseInt(main.unique_staff_paid || 0),
        total_monthly_payroll: parseFloat(staff.total_monthly_payroll || 0),
        avg_monthly_salary: parseFloat(staff.avg_monthly_salary || 0),
        formatted_monthly_payroll: formatGNF(staff.total_monthly_payroll),
        formatted_avg_salary: formatGNF(staff.avg_monthly_salary)
      },

      recent_payments: enrichedRecentPayments
    };

    console.log('✅ Tableau de bord généré avec succès');

    res.json({
      success: true,
      dashboard: dashboard
    });

  } catch (error) {
    console.error('💥 Erreur génération tableau de bord:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du tableau de bord'
    });
  }
});

// === HISTORIQUE DES PAIEMENTS ===
// CORRECTION DE LA ROUTE /history dans salary-payments.js
// Dans salary-payments.js, route GET '/history', remplacez cette section :

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search = '', payment_type = '',
      payment_method = '', payment_status = '', payment_year = '', payment_month = '',
      sortBy = 'payment_date', sortOrder = 'desc'
    } = req.query;

    console.log('📋 Récupération historique paiements');
    console.log('🔍 Paramètres reçus:', { page, limit, search, payment_type, payment_method, payment_status, payment_year, payment_month });

    // ✅ SUPPRIMEZ CETTE LIGNE PROBLÉMATIQUE :
    // const finalYear = payment_year || currentSchoolYear.current_year;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // ✅ SEULEMENT ajouter le filtre année SI spécifiée
    if (payment_year && payment_year.trim() !== '') {
      whereConditions.push(`sp.payment_year = $${paramIndex}`);
      queryParams.push(parseInt(payment_year));
      paramIndex++;
      console.log(`🗓️ Filtrage par année: ${payment_year}`);
    } else {
      console.log('🗓️ Pas de filtre année - Affichage de TOUTES les années');
    }

    // Filtres de recherche
    if (search.trim()) {
      whereConditions.push(`(
        LOWER(s.first_name) LIKE LOWER($${paramIndex}) OR 
        LOWER(s.last_name) LIKE LOWER($${paramIndex}) OR 
        LOWER(s.staff_number) LIKE LOWER($${paramIndex}) OR
        LOWER(sp.receipt_number) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (payment_type) {
      whereConditions.push(`sp.payment_type = $${paramIndex}`);
      queryParams.push(payment_type);
      paramIndex++;
    }

    if (payment_method) {
      whereConditions.push(`sp.payment_method = $${paramIndex}`);
      queryParams.push(payment_method);
      paramIndex++;
    }

    if (payment_status) {
      whereConditions.push(`sp.status = $${paramIndex}`);
      queryParams.push(payment_status);
      paramIndex++;
    }

    if (payment_month) {
      whereConditions.push(`sp.payment_month = $${paramIndex}`);
      queryParams.push(parseInt(payment_month));
      paramIndex++;
    }

    // ✅ WHERE clause dynamique
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const paymentsQuery = `
      SELECT 
        sp.id, sp.receipt_number, sp.amount, sp.payment_date, sp.status as payment_status,
        sp.payment_type, sp.payment_method, sp.payment_year, sp.payment_month,
        sp.gross_amount, sp.net_amount, sp.notes, sp.created_at,
        sp.staff_salary_id,
        
        s.staff_number, s.first_name, s.last_name, s.position, s.photo_url, s.department,
        s.first_name || ' ' || s.last_name as staff_name,
        
        ss.monthly_salary
        
      FROM salary_payments_v2 sp
      INNER JOIN staff_salaries_v2 ss ON sp.staff_salary_id = ss.id
      INNER JOIN staff s ON ss.staff_id = s.id
      ${whereClause}
      ORDER BY sp.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    console.log('🔍 Requête SQL finale:', paymentsQuery);
    console.log('📋 Paramètres SQL:', queryParams);

    const paymentsResult = await query(paymentsQuery, queryParams);

    // Enrichir les données (code existant)
    const enrichedPayments = paymentsResult.rows.map(payment => {
      const statusObj = PAYMENT_STATUSES.find(ps => ps.value === payment.payment_status);
      const typeObj = PAYMENT_TYPES.find(pt => pt.value === payment.payment_type);
      const methodObj = PAYMENT_METHODS.find(pm => pm.value === payment.payment_method);

      return {
        ...payment,
        formatted_amount: formatGNF(payment.amount),
        formatted_gross_amount: formatGNF(payment.gross_amount),
        formatted_net_amount: formatGNF(payment.net_amount),
        payment_date_formatted: payment.payment_date ? 
          new Date(payment.payment_date).toLocaleDateString('fr-FR') : null,
        
        status_label: statusObj ? statusObj.label : payment.payment_status,
        status_color: statusObj ? statusObj.color : 'gray',
        status_icon: statusObj ? statusObj.icon : '❓',
        type_label: typeObj ? typeObj.label : payment.payment_type,
        method_label: methodObj ? methodObj.label : payment.payment_method,
        method_icon: methodObj ? methodObj.icon : '💰',
        
        period_display: payment.payment_month ? 
          `${getMonthName(payment.payment_month)} ${payment.payment_year}` : 
          payment.payment_year
      };
    });

    // Requête de comptage avec mêmes conditions
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM salary_payments_v2 sp
      INNER JOIN staff_salaries_v2 ss ON sp.staff_salary_id = ss.id
      INNER JOIN staff s ON ss.staff_id = s.id
      ${whereClause}
    `;
    
    const countParams = queryParams.slice(0, -2);
    const countResult = await query(countQuery, countParams);
    const totalPayments = parseInt(countResult.rows[0].total);

    console.log(`✅ ${enrichedPayments.length} paiements récupérés sur ${totalPayments} total`);

    // Récupérer l'année scolaire pour info
    const currentSchoolYear = await getCurrentSchoolYear();

    res.json({
      success: true,
      payments: enrichedPayments,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: totalPayments,
        total_pages: Math.ceil(totalPayments / parseInt(limit)),
        has_next: parseInt(page) < Math.ceil(totalPayments / parseInt(limit)),
        has_prev: parseInt(page) > 1
      },
      filters: {
        search, payment_type, payment_method, payment_status,
        payment_year: payment_year || null, // ✅ Retourner null si vide
        payment_month, sortBy, sortOrder
      },
      current_school_year: currentSchoolYear
    });

  } catch (error) {
    console.error('💥 Erreur récupération historique:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique',
      details: error.message
    });
  }
});


// === DÉTAILS D'UN PAIEMENT ===
router.get('/payment/:id', authenticateToken, async (req, res) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    const paymentQuery = `
      SELECT 
        sp.*,
        s.staff_number, s.first_name, s.last_name, s.position, s.department,
        s.photo_url, s.email, s.phone,
        s.first_name || ' ' || s.last_name as staff_name,
        ss.monthly_salary, ss.bonus_percent, ss.deduction_percent
      FROM salary_payments_v2 sp
      INNER JOIN staff_salaries_v2 ss ON sp.staff_salary_id = ss.id
      INNER JOIN staff s ON ss.staff_id = s.id
      WHERE sp.id = $1
    `;

    const paymentResult = await query(paymentQuery, [paymentId]);

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    const payment = paymentResult.rows[0];

    // Enrichir les données
    const typeObj = PAYMENT_TYPES.find(pt => pt.value === payment.payment_type);
    const methodObj = PAYMENT_METHODS.find(pm => pm.value === payment.payment_method);
    const statusObj = PAYMENT_STATUSES.find(ps => ps.value === (payment.payment_status || payment.status));

    const enrichedPayment = {
      ...payment,
      payment_status: payment.payment_status || payment.status, // Compatibilité
      type_label: typeObj ? typeObj.label : payment.payment_type,
      method_label: methodObj ? methodObj.label : payment.payment_method,
      method_icon: methodObj ? methodObj.icon : '💰',
      status_label: statusObj ? statusObj.label : (payment.payment_status || payment.status),
      status_color: statusObj ? statusObj.color : 'gray',
      status_icon: statusObj ? statusObj.icon : '❓',
      
      formatted_amount: formatGNF(payment.amount),
      formatted_gross_amount: formatGNF(payment.gross_amount),
      formatted_net_amount: formatGNF(payment.net_amount),
      formatted_monthly_salary: formatGNF(payment.monthly_salary),
      
      payment_date_formatted: payment.payment_date ? 
        new Date(payment.payment_date).toLocaleDateString('fr-FR') : null,
      created_at_formatted: payment.created_at ? 
        new Date(payment.created_at).toLocaleString('fr-FR') : null,
      
      period_display: payment.payment_month ? 
        `${getMonthName(payment.payment_month)} ${payment.payment_year}` : 
        payment.payment_year
    };

    res.json({
      success: true,
      payment: enrichedPayment
    });

  } catch (error) {
    console.error('💥 Erreur récupération détails paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails'
    });
  }
});

// === MODIFIER UN PAIEMENT - VERSION CORRIGÉE SANS updated_at ===
router.put('/payment/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const {
      payment_type, amount, payment_date, payment_method, payment_year,
      payment_month, gross_amount, net_amount, notes, payment_status
    } = req.body;

    console.log(`✏️ Modification paiement ${paymentId}`);

    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    // Vérifier existence
    const existingPayment = await query(
      'SELECT receipt_number FROM salary_payments_v2 WHERE id = $1',
      [paymentId]
    );

    if (existingPayment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    // ✅ REQUÊTE DE MISE À JOUR SANS updated_at
    const updateResult = await query(`
      UPDATE salary_payments_v2 SET
        payment_type = $1, 
        amount = $2, 
        payment_date = $3, 
        payment_method = $4,
        payment_year = $5, 
        payment_month = $6, 
        gross_amount = $7, 
        net_amount = $8,
        notes = $9, 
        payment_status = $10,
        status = $10
      WHERE id = $11
      RETURNING *
    `, [
      payment_type, parseFloat(amount), payment_date, payment_method,
      parseInt(payment_year), payment_month ? parseInt(payment_month) : null,
      gross_amount ? parseFloat(gross_amount) : null,
      net_amount ? parseFloat(net_amount) : null,
      notes ? sanitizeText(notes) : null, payment_status, paymentId
    ]);

    const updatedPayment = updateResult.rows[0];
    updatedPayment.formatted_amount = formatGNF(updatedPayment.amount);

    console.log(`✅ Paiement ${updatedPayment.receipt_number} modifié`);

    res.json({
      success: true,
      message: `Paiement ${updatedPayment.receipt_number} modifié avec succès`,
      payment: updatedPayment
    });

  } catch (error) {
    console.error('💥 Erreur modification paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification'
    });
  }
});

// === SUPPRIMER UN PAIEMENT ===
router.delete('/payment/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentId = req.params.id;

    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement invalide'
      });
    }

    // Récupérer les infos avant suppression
    const paymentInfo = await query(`
      SELECT sp.receipt_number, sp.amount, s.first_name, s.last_name
      FROM salary_payments_v2 sp
      INNER JOIN staff_salaries_v2 ss ON sp.staff_salary_id = ss.id
      INNER JOIN staff s ON ss.staff_id = s.id
      WHERE sp.id = $1
    `, [paymentId]);
    
    if (paymentInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    const payment = paymentInfo.rows[0];

    await query('DELETE FROM salary_payments_v2 WHERE id = $1', [paymentId]);

    console.log(`✅ Paiement supprimé: ${payment.receipt_number}`);

    res.json({
      success: true,
      message: `Paiement ${payment.receipt_number} supprimé avec succès`,
      deleted_payment: {
        receipt_number: payment.receipt_number,
        staff_name: `${payment.first_name} ${payment.last_name}`,
        amount: formatGNF(payment.amount)
      }
    });

  } catch (error) {
    console.error('💥 Erreur suppression paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

// === CHANGER LE STATUT D'UN PAIEMENT - VERSION CORRIGÉE SANS updated_at ===
router.patch('/payment/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { payment_status, status } = req.body;

    console.log('🔄 Changement statut paiement:', { paymentId, payment_status, status });

    if (!paymentId || (!payment_status && !status)) {
      return res.status(400).json({
        success: false,
        error: 'ID paiement et statut requis'
      });
    }

    // ✅ Utiliser payment_status ou status selon ce qui est fourni
    const finalStatus = payment_status || status;

    const validStatuses = PAYMENT_STATUSES.map(s => s.value);
    if (!validStatuses.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Statut de paiement invalide: ' + finalStatus
      });
    }

    // ✅ D'abord vérifier que le paiement existe
    const checkPayment = await query(
      'SELECT id, receipt_number FROM salary_payments_v2 WHERE id = $1',
      [paymentId]
    );

    if (checkPayment.rows.length === 0) {
      console.error('❌ Paiement non trouvé:', paymentId);
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    console.log('✅ Paiement trouvé:', checkPayment.rows[0]);

    // ✅ MISE À JOUR SANS updated_at (colonne inexistante)
    const updateResult = await query(`
      UPDATE salary_payments_v2 
      SET 
        payment_status = $1, 
        status = $1
      WHERE id = $2 
      RETURNING id, receipt_number, payment_status, status
    `, [finalStatus, paymentId]);

    if (updateResult.rows.length === 0) {
      console.error('❌ Échec mise à jour statut pour:', paymentId);
      return res.status(500).json({
        success: false,
        error: 'Échec de la mise à jour du statut'
      });
    }

    const updatedPayment = updateResult.rows[0];
    console.log('✅ Statut mis à jour:', updatedPayment);

    const statusObj = PAYMENT_STATUSES.find(s => s.value === finalStatus);
    
    res.json({
      success: true,
      message: `Statut du paiement ${updatedPayment.receipt_number} changé vers "${statusObj?.label || finalStatus}"`,
      new_status: {
        value: finalStatus,
        label: statusObj?.label || finalStatus,
        color: statusObj?.color || 'gray',
        icon: statusObj?.icon || '❓'
      },
      updated_payment: {
        id: updatedPayment.id,
        receipt_number: updatedPayment.receipt_number,
        payment_status: updatedPayment.payment_status,
        status: updatedPayment.status
      }
    });

  } catch (error) {
    console.error('💥 Erreur changement statut:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de statut',
      details: error.message
    });
  }
});

// === STATISTIQUES RAPIDES ===
router.get('/stats/quick', authenticateToken, async (req, res) => {
  try {
    const currentSchoolYear = await getCurrentSchoolYear();
    const currentYear = currentSchoolYear.current_year;
    const currentMonth = new Date().getMonth() + 1;

    const quickStatsQuery = `
      SELECT 
        -- Statistiques globales
        (SELECT COUNT(*) FROM salary_payments_v2) as total_all_payments,
        (SELECT SUM(amount) FROM salary_payments_v2 WHERE status = 'completed') as total_all_amount,
        
        -- Année scolaire en cours
        (SELECT COUNT(*) FROM salary_payments_v2 WHERE payment_year = $1) as current_year_count,
        (SELECT SUM(amount) FROM salary_payments_v2 WHERE payment_year = $1 AND status = 'completed') as current_year_amount,
        
        -- Mois en cours
        (SELECT COUNT(*) FROM salary_payments_v2 WHERE payment_year = $1 AND payment_month = $2) as current_month_count,
        (SELECT SUM(amount) FROM salary_payments_v2 WHERE payment_year = $1 AND payment_month = $2 AND status = 'completed') as current_month_amount,
        
        -- En attente
        (SELECT COUNT(*) FROM salary_payments_v2 WHERE status = 'pending') as pending_count,
        (SELECT SUM(amount) FROM salary_payments_v2 WHERE status = 'pending') as pending_amount,
        
        -- Personnel
        (SELECT COUNT(DISTINCT s.id) FROM staff s WHERE s.status = 'active') as total_active_staff,
        (SELECT COUNT(DISTINCT ss.staff_id) FROM staff_salaries_v2 ss WHERE ss.is_active = true) as staff_with_salary
    `;

    const result = await query(quickStatsQuery, [currentYear, currentMonth]);
    const stats = result.rows[0];

    res.json({
      success: true,
      quick_stats: {
        total_payments: parseInt(stats.total_all_payments || 0),
        total_amount: parseFloat(stats.total_all_amount || 0),
        current_year_payments: parseInt(stats.current_year_count || 0),
        current_year_amount: parseFloat(stats.current_year_amount || 0),
        current_month_payments: parseInt(stats.current_month_count || 0),
        current_month_amount: parseFloat(stats.current_month_amount || 0),
        pending_payments: parseInt(stats.pending_count || 0),
        pending_amount: parseFloat(stats.pending_amount || 0),
        total_active_staff: parseInt(stats.total_active_staff || 0),
        staff_with_salary: parseInt(stats.staff_with_salary || 0),
        
        // Formatés
        formatted_total_amount: formatGNF(stats.total_all_amount),
        formatted_current_year: formatGNF(stats.current_year_amount),
        formatted_current_month: formatGNF(stats.current_month_amount),
        formatted_pending_amount: formatGNF(stats.pending_amount)
      },
      current_school_year: currentSchoolYear
    });

  } catch (error) {
    console.error('💥 Erreur statistiques rapides:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// === CONSTANTES ET CONFIGURATIONS ===
router.get('/config/payment-types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    payment_types: PAYMENT_TYPES
  });
});

router.get('/config/payment-methods', authenticateToken, (req, res) => {
  res.json({
    success: true,
    payment_methods: PAYMENT_METHODS
  });
});

router.get('/config/payment-statuses', authenticateToken, (req, res) => {
  res.json({
    success: true,
    payment_statuses: PAYMENT_STATUSES
  });
});

// === RÉCUPÉRER ANNÉE SCOLAIRE COURANTE (endpoint) ===
router.get('/current-school-year', authenticateToken, async (req, res) => {
  try {
    const currentSchoolYear = await getCurrentSchoolYear();
    
    res.json({
      success: true,
      current_school_year: currentSchoolYear,
      message: currentSchoolYear.id ? 
        `Année scolaire courante: ${currentSchoolYear.name}` :
        'Aucune année scolaire définie, utilisation année civile'
    });
    
  } catch (error) {
    console.error('💥 Erreur récupération année scolaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'année scolaire courante'
    });
  }
});

console.log('✅ === SALARY-PAYMENTS.JS CORRIGÉ SELON STRUCTURE DB ===');
console.log('🎯 Routes disponibles:');
console.log('   ├─ GET /test - Test API avec année scolaire');
console.log('   ├─ GET /dashboard - Tableau de bord principal');
console.log('   ├─ GET /history - Historique des paiements');
console.log('   ├─ GET /staff/available - Employés disponibles pour paiement');
console.log('   ├─ POST /create - Créer nouveau paiement');
console.log('   ├─ GET /payment/:id - Détails d\'un paiement');
console.log('   ├─ PUT /payment/:id - Modifier un paiement');
console.log('   ├─ DELETE /payment/:id - Supprimer un paiement');
console.log('   ├─ PATCH /payment/:id/status - Changer statut paiement');
console.log('   ├─ GET /stats/quick - Statistiques rapides');
console.log('   ├─ GET /current-school-year - Récupérer année scolaire courante');
console.log('   └─ GET /config/* - Configurations (types, méthodes, statuts)');
console.log('');
console.log('🔧 CORRECTIONS APPLIQUÉES:');
console.log('   ✅ Champs DB corrigés: status au lieu de payment_status');
console.log('   ✅ Gestion des IDs temporaires pour employés sans config');
console.log('   ✅ Création automatique de configs salaire temporaires');
console.log('   ✅ Requêtes SQL alignées sur structure DB réelle');
console.log('   ✅ Compatibilité avec les deux champs statut');

module.exports = router;