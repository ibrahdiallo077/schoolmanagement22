// server/routes/payments.js - VERSION COMPLÈTE ORDONNÉE
const express = require('express');
const { query, transaction } = require('../config/database');
const PDFDocument = require('pdfkit');
const path = require('path');

const router = express.Router();

// === MIDDLEWARE D'AUTHENTIFICATION ===
const authenticateTokenDev = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      req.user = { id: 'dev-user', role: 'admin' };
      return next();
    }
    
    req.user = { id: 'authenticated-user', role: 'admin' };
    next();
  } catch (error) {
    console.error('❌ Erreur middleware auth:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur d\'authentification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// === MIDDLEWARE CORS ===
router.use((req, res, next) => {
  try {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log('🌐 Origin développement autorisé:', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  } catch (error) {
    console.error('❌ Erreur middleware CORS:', error);
    next(error);
  }
});

// === MIDDLEWARE DE DEBUG ===
router.use((req, res, next) => {
  console.log(`🔍 PAYMENTS DEBUG: ${req.method} ${req.path}`);
  console.log(`🔍 ORIGINAL URL: ${req.originalUrl}`);
  console.log(`🔍 PARAMS:`, req.params);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`🔍 BODY:`, req.body);
  }
  next();
});

// === UTILITAIRES ===
const formatCurrency = (amount) => {
  try {
    if (!amount || isNaN(amount)) return '0 GNF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.error('❌ Erreur formatage devise:', error);
    return `${amount} GNF`;
  }
};

const generateReceiptNumber = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `REC-${currentYear}${currentMonth}`;
    
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM student_payments 
         WHERE receipt_number LIKE $1 
         AND EXTRACT(YEAR FROM payment_date) = $2
         AND EXTRACT(MONTH FROM payment_date) = $3`,
        [`${prefix}-%`, currentYear, new Date().getMonth() + 1]
      );
      
      const nextNumber = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
      return `${prefix}-${nextNumber}`;
    } catch (dbError) {
      console.warn('⚠️ Erreur génération numéro BDD, fallback:', dbError.message);
      const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `${prefix}-${randomNum}`;
    }
  } catch (error) {
    console.error('❌ Erreur génération numéro reçu:', error);
    return `REC-${Date.now()}`;
  }
};

const validatePaymentData = (data) => {
  const errors = [];
  
  try {
    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
      errors.push('Montant invalide ou manquant');
    }
    
    const validMethods = ['cash', 'bank_transfer', 'mobile_money', 'check', 'card'];
    if (!data.payment_method || !validMethods.includes(data.payment_method)) {
      errors.push('Méthode de paiement invalide');
    }
    
    const validTypes = ['tuition_monthly', 'registration', 'exam_fee', 'book_fee', 'uniform_fee', 'transport_fee', 'meal_fee', 'penalty', 'advance_payment', 'other'];
    if (!data.payment_type || !validTypes.includes(data.payment_type)) {
      errors.push('Type de paiement invalide');
    }
    
    if (data.payment_type === 'other' && (!data.custom_payment_type || !data.custom_payment_type.trim())) {
      errors.push('Type de paiement personnalisé requis pour "Autres"');
    }
    
    if (!data.paid_by || !data.paid_by.trim()) {
      errors.push('Nom du payeur requis');
    }
    
    if (data.payment_date && !Date.parse(data.payment_date)) {
      errors.push('Date de paiement invalide');
    }
    
    return errors;
  } catch (error) {
    console.error('❌ Erreur validation données:', error);
    return ['Erreur lors de la validation des données'];
  }
};

// ===============================================
// 🔥 1. ROUTES GÉNÉRALES (EN PREMIER)
// ===============================================

// === 1.1 ROUTE STATISTIQUES (DOIT ÊTRE AVANT /:paymentId) ===
// === 1.1 ROUTE STATISTIQUES (DOIT ÊTRE AVANT /:paymentId) ===
router.get('/stats', authenticateTokenDev, async (req, res) => {
  console.log('📊 Récupération des statistiques de paiements');
  
  try {
    // Statistiques générales
    const totalStatsResult = await query(`
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(AVG(amount), 0) as avg_payment
      FROM student_payments 
      WHERE (is_cancelled = false OR is_cancelled IS NULL)
    `);

    // Statistiques du mois en cours
    const monthlyStatsResult = await query(`
      SELECT 
        COUNT(*) as monthly_payments,
        COALESCE(SUM(amount), 0) as monthly_revenue
      FROM student_payments 
      WHERE (is_cancelled = false OR is_cancelled IS NULL)
      AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    `);

    // 🔥 CALCUL RÉEL DES MONTANTS EN ATTENTE
    const pendingStatsResult = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount < amount_due THEN (amount_due - amount) ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN amount < amount_due THEN 1 END) as pending_count
      FROM student_payments 
      WHERE (is_cancelled = false OR is_cancelled IS NULL)
    `);

    // 🔥 CALCUL RÉEL DES RETARDS (paiements de plus de 30 jours)
    const overdueStatsResult = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount < amount_due THEN (amount_due - amount) ELSE 0 END), 0) as overdue_amount,
        COUNT(CASE WHEN amount < amount_due THEN 1 END) as overdue_count
      FROM student_payments 
      WHERE (is_cancelled = false OR is_cancelled IS NULL)
      AND payment_date < CURRENT_DATE - INTERVAL '30 days'
      AND amount < amount_due
    `);

    const totalStats = totalStatsResult.rows[0];
    const monthlyStats = monthlyStatsResult.rows[0];
    const pendingStats = pendingStatsResult.rows[0];
    const overdueStats = overdueStatsResult.rows[0];

    console.log('📊 Statistiques calculées:', {
      total_revenue: totalStats.total_revenue,
      monthly_revenue: monthlyStats.monthly_revenue,
      pending_amount: pendingStats.pending_amount,
      overdue_amount: overdueStats.overdue_amount,
      total_payments: totalStats.total_payments
    });

    res.json({
      success: true,
      stats: {
        // 🔥 DONNÉES RÉELLES UNIQUEMENT
        total_revenue: parseFloat(totalStats.total_revenue),
        monthly_revenue: parseFloat(monthlyStats.monthly_revenue),
        pending_amount: parseFloat(pendingStats.pending_amount), // Calculé réellement
        overdue_amount: parseFloat(overdueStats.overdue_amount), // Calculé réellement
        total_transactions: parseInt(totalStats.total_payments)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === 1.2 LISTE GÉNÉRALE DES PAIEMENTS (ROUTE GET /) ===
router.get('/', authenticateTokenDev, async (req, res) => {
  console.log('📋 Liste des paiements');
  
  try {
    const { 
      student_id = null,
      limit = 20,
      search = null,
      status = null,
      payment_type = null,
      payment_method = null,
      date_start = null,
      date_end = null
    } = req.query;

    let whereConditions = ['(sp.is_cancelled = false OR sp.is_cancelled IS NULL)'];
    let queryParams = [];
    let paramCount = 0;

    // Filtres
    if (student_id) {
      paramCount++;
      whereConditions.push(`sp.student_id = $${paramCount}`);
      queryParams.push(student_id);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        LOWER(s.first_name || ' ' || s.last_name) LIKE LOWER($${paramCount}) OR
        LOWER(sp.receipt_number) LIKE LOWER($${paramCount}) OR
        LOWER(s.student_number) LIKE LOWER($${paramCount}) OR
        LOWER(sp.paid_by) LIKE LOWER($${paramCount})
      )`);
      queryParams.push(`%${search}%`);
    }

    if (payment_type && payment_type !== 'all') {
      paramCount++;
      whereConditions.push(`sp.payment_type = $${paramCount}`);
      queryParams.push(payment_type);
    }

    if (payment_method && payment_method !== 'all') {
      paramCount++;
      whereConditions.push(`sp.payment_method = $${paramCount}`);
      queryParams.push(payment_method);
    }

    if (date_start) {
      paramCount++;
      whereConditions.push(`sp.payment_date >= $${paramCount}`);
      queryParams.push(date_start);
    }

    if (date_end) {
      paramCount++;
      whereConditions.push(`sp.payment_date <= $${paramCount}`);
      queryParams.push(date_end);
    }

    const whereClause = whereConditions.join(' AND ');

    const paymentsQuery = `
      SELECT 
        sp.id, sp.amount, sp.amount_due, sp.payment_date, sp.payment_method, sp.payment_type,
        sp.receipt_number, sp.reference_number, sp.transaction_id,
        sp.received_by, sp.notes, sp.created_at, sp.paid_by,
        sp.payment_month, sp.payment_year, sp.number_of_months,
        
        s.id as student_id, s.student_number, s.first_name, s.last_name,
        s.status as student_status, s.is_orphan,
        
        cc.name as class_name, sy.name as school_year_name

      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      LEFT JOIN classes cc ON s.coranic_class_id = cc.id
      LEFT JOIN school_years sy ON s.school_year_id = sy.id
      WHERE ${whereClause}
      ORDER BY sp.payment_date DESC, sp.created_at DESC
    `;

    const paymentsResult = await query(paymentsQuery, queryParams);
    const limitedPayments = paymentsResult.rows.slice(0, parseInt(limit));

    console.log(`📋 Liste récupérée: ${limitedPayments.length} paiements sur ${paymentsResult.rows.length} total`);

    res.json({
      success: true,
      payments: limitedPayments.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        amount_due: parseFloat(payment.amount_due || payment.amount),
        formatted_amount: formatCurrency(payment.amount),
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        receipt_number: payment.receipt_number,
        reference_number: payment.reference_number,
        transaction_id: payment.transaction_id,
        received_by: payment.received_by,
        notes: payment.notes,
        paid_by: payment.paid_by,
        payment_month: payment.payment_month,
        payment_year: payment.payment_year,
        number_of_months: payment.number_of_months,
        created_at: payment.created_at,
        student: {
          id: payment.student_id,
          student_number: payment.student_number,
          full_name: `${payment.first_name} ${payment.last_name}`,
          first_name: payment.first_name,
          last_name: payment.last_name,
          status: payment.student_status,
          is_orphan: payment.is_orphan,
          coranic_class: payment.class_name ? { name: payment.class_name } : null
        }
      })),
      total: paymentsResult.rows.length,
      showing: limitedPayments.length
    });

  } catch (error) {
    console.error('❌ Erreur liste paiements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des paiements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================================
// 🔥 2. ROUTES SPÉCIFIQUES AUX ÉTUDIANTS
// ===============================================

// === 2.1 ENREGISTRER UN PAIEMENT ===
router.post('/students/:studentId/payments', authenticateTokenDev, async (req, res) => {
  console.log('🚀 === DÉBUT ENREGISTREMENT PAIEMENT ===');
  console.log(`📝 Student ID: ${req.params.studentId}`);
  console.log(`📊 Données reçues:`, req.body);
  
  try {
    const { studentId } = req.params;
    const paymentData = req.body;

    // ✅ ÉTAPE 1: Validation des données
    console.log('🔍 Validation des données...');
    const validationErrors = validatePaymentData(paymentData);
    if (validationErrors.length > 0) {
      console.log('❌ Erreurs de validation:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationErrors
      });
    }

    // ✅ ÉTAPE 2: Vérification de l'étudiant
    console.log('👤 Vérification existence étudiant...');
    let student = null;
    try {
      const studentCheck = await query(
        'SELECT id, student_number, first_name, last_name FROM students WHERE id = $1 AND (deleted = false OR deleted IS NULL)',
        [studentId]
      );

      if (studentCheck.rows.length === 0) {
        console.log('❌ Étudiant non trouvé:', studentId);
        return res.status(404).json({
          success: false,
          error: 'Étudiant non trouvé',
          student_id: studentId
        });
      }

      student = studentCheck.rows[0];
      console.log('✅ Étudiant trouvé:', student.first_name, student.last_name);
    } catch (studentError) {
      console.error('❌ Erreur vérification étudiant:', studentError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification de l\'étudiant',
        details: process.env.NODE_ENV === 'development' ? studentError.message : undefined
      });
    }

    // ✅ ÉTAPE 3: Transaction d'enregistrement
    console.log('💾 Début transaction enregistrement...');
    let result = null;
    try {
      result = await transaction(async (client) => {
        // Générer numéro de reçu
        const receiptNumber = await generateReceiptNumber();
        console.log('🧾 Numéro reçu généré:', receiptNumber);

        // Déterminer le type final de paiement
        const finalPaymentType = paymentData.payment_type === 'other' 
          ? paymentData.custom_payment_type 
          : paymentData.payment_type;

        console.log('📝 Insertion paiement avec données:', {
          studentId,
          amount: parseFloat(paymentData.amount),
          payment_type: finalPaymentType,
          receipt_number: receiptNumber
        });

        const paymentResult = await client.query(`
          INSERT INTO student_payments (
            student_id, amount, payment_date, payment_method, payment_type,
            receipt_number, reference_number, transaction_id, 
            received_by, notes, created_by, payment_schedule_id,
            paid_by, payment_month, payment_year, number_of_months, amount_due,
            is_cancelled, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            false, CURRENT_TIMESTAMP
          ) RETURNING *
        `, [
          studentId,
          parseFloat(paymentData.amount),
          paymentData.payment_date || new Date().toISOString().split('T')[0],
          paymentData.payment_method,
          finalPaymentType,
          receiptNumber,
          paymentData.reference_number || null,
          paymentData.transaction_id || null,
          req.user.id || 'administration',
          paymentData.notes || null,
          req.user.id || 'system',
          paymentData.schedule_id || null,
          paymentData.paid_by,
          paymentData.payment_month || new Date().getMonth() + 1,
          paymentData.payment_year || new Date().getFullYear(),
          paymentData.number_of_months || 1,
          parseFloat(paymentData.amount_due || paymentData.amount)
        ]);

        const payment = paymentResult.rows[0];
        console.log('✅ Paiement inséré avec succès, ID:', payment.id);

        return payment;
      });

      console.log('🎉 Transaction terminée avec succès');
    } catch (transactionError) {
      console.error('❌ Erreur transaction:', transactionError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement du paiement',
        details: process.env.NODE_ENV === 'development' ? transactionError.message : undefined,
        sql_error: process.env.NODE_ENV === 'development' ? transactionError.code : undefined
      });
    }

    // ✅ ÉTAPE 4: Réponse de succès
    console.log('✅ === PAIEMENT ENREGISTRÉ AVEC SUCCÈS ===');
    res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      payment: {
        id: result.id,
        amount: parseFloat(result.amount),
        payment_date: result.payment_date,
        payment_method: result.payment_method,
        payment_type: result.payment_type,
        receipt_number: result.receipt_number,
        reference_number: result.reference_number,
        transaction_id: result.transaction_id,
        notes: result.notes,
        paid_by: result.paid_by,
        payment_month: result.payment_month,
        payment_year: result.payment_year,
        number_of_months: result.number_of_months,
        formatted_amount: formatCurrency(result.amount),
        student: {
          id: student.id,
          student_number: student.student_number,
          full_name: `${student.first_name} ${student.last_name}`
        }
      }
    });

  } catch (error) {
    console.error('💥 ERREUR CRITIQUE ENREGISTREMENT PAIEMENT:', error);
    console.error('📊 Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur critique lors de l\'enregistrement du paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
      request_id: req.headers['x-request-id'] || 'unknown'
    });
  }
});

// === 2.2 CALCULER LES FRAIS D'UN ÉTUDIANT ===
router.get('/students/:studentId/fees', authenticateTokenDev, async (req, res) => {
  console.log('💰 Calcul frais étudiant:', req.params.studentId);
  
  try {
    const { studentId } = req.params;

    if (!studentId || !studentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID étudiant invalide'
      });
    }

    const studentResult = await query(`
      SELECT 
        s.id, s.student_number, s.first_name, s.last_name, s.status, s.is_orphan,
        s.coranic_class_id, s.school_year_id, s.created_at as enrollment_date,
        
        CASE 
          WHEN cc.id IS NOT NULL THEN JSON_BUILD_OBJECT(
            'id', cc.id,
            'name', cc.name,
            'level', cc.level,
            'type', COALESCE(cc.type, 'coranic')
          )
          ELSE NULL
        END as coranic_class,
        
        CASE 
          WHEN sy.id IS NOT NULL THEN JSON_BUILD_OBJECT(
            'id', sy.id,
            'name', sy.name,
            'is_current', COALESCE(sy.is_current, false)
          )
          ELSE NULL
        END as school_year

      FROM students s
      LEFT JOIN classes cc ON s.coranic_class_id = cc.id
      LEFT JOIN school_years sy ON s.school_year_id = sy.id
      WHERE s.id = $1 AND (s.deleted = false OR s.deleted IS NULL)
    `, [studentId]);
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non trouvé'
      });
    }

    const student = studentResult.rows[0];
    console.log('✅ Étudiant trouvé pour calcul frais:', student.first_name, student.last_name);

    const defaultFees = {
      registration_fee: 800000,
      monthly_amount: 500000,
      annual_amount: 0,
      exam_fee: 0,
      book_fee: 0,
      uniform_fee: 0,
      transport_fee: 0,
      meal_fee: 0,
      additional_fees: 0,
      total_fees: 800000,
      discount_applied: 0,
      discount_reason: 'Aucune réduction',
      final_amount: 800000
    };

    if (student.is_orphan) {
      const discountPercent = 50;
      const discountAmount = defaultFees.total_fees * (discountPercent / 100);
      defaultFees.discount_applied = discountAmount;
      defaultFees.final_amount = defaultFees.total_fees - discountAmount;
      defaultFees.discount_reason = `Réduction orphelin (${discountPercent}%)`;
    }

    const paymentsResult = await query(`
      SELECT 
        sp.id, sp.amount, sp.payment_date, sp.payment_method, sp.payment_type,
        sp.receipt_number, sp.reference_number, sp.notes, sp.created_at
      FROM student_payments sp
      WHERE sp.student_id = $1 AND sp.is_cancelled = false
      ORDER BY sp.payment_date DESC, sp.created_at DESC
    `, [studentId]);

    const totalPaid = paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const balance = defaultFees.final_amount - totalPaid;

    console.log('💰 Calcul terminé - Total payé:', formatCurrency(totalPaid), 'Balance:', formatCurrency(balance));

    res.json({
      success: true,
      student: {
        id: student.id,
        student_number: student.student_number,
        full_name: `${student.first_name} ${student.last_name}`,
        status: student.status,
        is_orphan: student.is_orphan,
        enrollment_date: student.enrollment_date,
        coranic_class: student.coranic_class,
        school_year: student.school_year
      },
      fees: defaultFees,
      payments: {
        history: paymentsResult.rows,
        total_paid: totalPaid,
        balance: balance,
        status: balance <= 0 ? 'paid' : balance > 0 ? 'pending' : 'overpaid'
      },
      summary: {
        total_expected: defaultFees.final_amount,
        total_paid: totalPaid,
        remaining_balance: balance,
        payment_completion: totalPaid > 0 ? (totalPaid / defaultFees.final_amount) * 100 : 0,
        currency: 'GNF'
      }
    });

  } catch (error) {
    console.error('❌ Erreur calcul frais:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des frais',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === 2.3 HISTORIQUE DES PAIEMENTS D'UN ÉTUDIANT ===
router.get('/students/:studentId/history', authenticateTokenDev, async (req, res) => {
  return handlePaymentHistory(req, res);
});

router.get('/students/:studentId/payments', authenticateTokenDev, async (req, res) => {
  return handlePaymentHistory(req, res);
});

// Fonction commune pour gérer l'historique
async function handlePaymentHistory(req, res) {
  console.log('📜 Historique paiements pour étudiant:', req.params.studentId);
  
  try {
    const { studentId } = req.params;
    const { limit = 20 } = req.query;

    const studentCheck = await query(
      'SELECT id, student_number, first_name, last_name FROM students WHERE id = $1 AND (deleted = false OR deleted IS NULL)',
      [studentId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Étudiant non trouvé'
      });
    }

    const student = studentCheck.rows[0];

    const paymentsResult = await query(`
      SELECT 
        sp.id, sp.amount, sp.payment_date, sp.payment_method, sp.payment_type,
        sp.receipt_number, sp.reference_number, sp.notes, sp.created_at, sp.paid_by
      FROM student_payments sp
      WHERE sp.student_id = $1 AND (sp.is_cancelled = false OR sp.is_cancelled IS NULL)
      ORDER BY sp.payment_date DESC, sp.created_at DESC
    `, [studentId]);

    const limitedPayments = paymentsResult.rows.slice(0, parseInt(limit));

    console.log(`📜 Historique récupéré: ${limitedPayments.length} paiements`);

    res.json({
      success: true,
      student: {
        id: student.id,
        student_number: student.student_number,
        full_name: `${student.first_name} ${student.last_name}`
      },
      payments: limitedPayments.map(payment => ({
        ...payment,
        formatted_amount: formatCurrency(payment.amount)
      })),
      total: paymentsResult.rows.length
    });

  } catch (error) {
    console.error('❌ Erreur historique paiements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ===============================================
// 🔥 3. ROUTES SPÉCIALISÉES (PDF - DOIT ÊTRE AVANT /:paymentId)
// ===============================================

// === 3.1 GÉNÉRER REÇU PDF ===
router.get('/receipts/:paymentId', authenticateTokenDev, async (req, res) => {
  console.log('📄 Génération reçu PDF pour paiement:', req.params.paymentId);
  
  try {
    const { paymentId } = req.params;

    // Validation de l'ID
    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paiement invalide'
      });
    }

    // Récupérer les données du paiement
    const paymentResult = await query(`
      SELECT 
        sp.*, 
        s.id as student_id, s.student_number, s.first_name, s.last_name,
        s.status as student_status, s.is_orphan,
        cc.name as class_name
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      LEFT JOIN classes cc ON s.coranic_class_id = cc.id
      WHERE sp.id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    const payment = paymentResult.rows[0];

    // Créer le PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu_${payment.receipt_number}.pdf"`);
    
    // Pipe le PDF vers la réponse
    doc.pipe(res);

    // En-tête
    doc.fontSize(18).text('Haramain', { align: 'center' });
    doc.fontSize(12).text('École Coranique', { align: 'center' });
    doc.text('Conakry, République de Guinée', { align: 'center' });
    doc.moveDown();

    // Ligne de séparation
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Titre du reçu
    doc.fontSize(16).text('REÇU DE PAIEMENT', { align: 'center' });
    doc.moveDown();

    // Informations du reçu
    doc.fontSize(11);
    doc.text(`Reçu N° : ${payment.receipt_number}`, 50, doc.y);
    doc.text(`Date : ${new Date(payment.payment_date).toLocaleDateString('fr-FR')}`, 400, doc.y - 12);
    doc.moveDown(2);

    // Informations étudiant
    doc.fontSize(12).text('INFORMATIONS ÉTUDIANT', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Nom complet : ${payment.first_name} ${payment.last_name}`);
    doc.text(`N° Étudiant : ${payment.student_number}`);
    if (payment.class_name) {
      doc.text(`Classe : ${payment.class_name}`);
    }
    doc.text(`Statut : ${payment.student_status}${payment.is_orphan ? ' - Orphelin' : ''}`);
    doc.moveDown();

    // Ligne de séparation
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Détails du paiement
    doc.fontSize(12).text('DÉTAILS DU PAIEMENT', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Description : ${payment.payment_type}`);
    doc.text(`Période : ${payment.payment_month}/${payment.payment_year}`);
    if (payment.number_of_months > 1) {
      doc.text(`Nombre de mois : ${payment.number_of_months}`);
    }
    doc.text(`Montant dû : ${formatCurrency(payment.amount_due || payment.amount)}`);
    doc.text(`Montant payé : ${formatCurrency(payment.amount)}`);
    doc.text(`Mode de paiement : ${payment.payment_method}`);
    doc.text(`Payé par : ${payment.paid_by}`);
    doc.moveDown();

    // Notes
    if (payment.notes) {
      doc.text('Notes :', { underline: true });
      doc.text(payment.notes);
      doc.moveDown();
    }

    // Signature
    doc.moveDown(2);
    doc.text('Reçu par : Administration');
    doc.moveDown();
    doc.text('Signature : _________________');

    // Pied de page
    doc.fontSize(8);
    doc.text('Ce reçu est généré électroniquement et fait foi de paiement.', 50, 720, { align: 'center' });
    doc.text('Conservez ce reçu comme preuve de paiement.', { align: 'center' });

    // Finaliser le PDF
    doc.end();

    console.log('✅ Reçu PDF généré avec succès');

  } catch (error) {
    console.error('❌ Erreur génération reçu PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du reçu PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================================
// 🔥 4. ROUTES CRUD INDIVIDUELLES (À LA FIN)
// ===============================================

// === 4.1 OBTENIR UN PAIEMENT SPÉCIFIQUE ===
router.get('/:paymentId', authenticateTokenDev, async (req, res) => {
  console.log('🔍 Récupération paiement:', req.params.paymentId);
  
  try {
    const { paymentId } = req.params;

    // Validation de l'ID
    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paiement invalide'
      });
    }

    const paymentResult = await query(`
      SELECT 
        sp.*, 
        s.id as student_id, s.student_number, s.first_name, s.last_name,
        s.status as student_status, s.is_orphan,
        cc.name as class_name
      FROM student_payments sp
      JOIN students s ON sp.student_id = s.id
      LEFT JOIN classes cc ON s.coranic_class_id = cc.id
      WHERE sp.id = $1
    `, [paymentId]);

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    const payment = paymentResult.rows[0];

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: parseFloat(payment.amount),
        amount_due: parseFloat(payment.amount_due || payment.amount),
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        receipt_number: payment.receipt_number,
        reference_number: payment.reference_number,
        notes: payment.notes,
        paid_by: payment.paid_by,
        payment_month: payment.payment_month,
        payment_year: payment.payment_year,
        number_of_months: payment.number_of_months,
        created_at: payment.created_at,
        formatted_amount: formatCurrency(payment.amount),
        student: {
          id: payment.student_id,
          student_number: payment.student_number,
          full_name: `${payment.first_name} ${payment.last_name}`,
          first_name: payment.first_name,
          last_name: payment.last_name,
          status: payment.student_status,
          is_orphan: payment.is_orphan,
          class_name: payment.class_name
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === 4.2 MODIFIER UN PAIEMENT ===
router.put('/:paymentId', authenticateTokenDev, async (req, res) => {
  console.log('✏️ Modification paiement:', req.params.paymentId);
  
  try {
    const { paymentId } = req.params;
    const updateData = req.body;

    // Validation de l'ID
    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paiement invalide'
      });
    }

    // Validation des données
    const validationErrors = validatePaymentData(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationErrors
      });
    }

    // Vérifier que le paiement existe
    const existingPayment = await query(
      'SELECT id, student_id FROM student_payments WHERE id = $1',
      [paymentId]
    );

    if (existingPayment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    // Déterminer le type final de paiement
    const finalPaymentType = updateData.payment_type === 'other' 
      ? updateData.custom_payment_type 
      : updateData.payment_type;

    // Mise à jour
    const updateResult = await query(`
      UPDATE student_payments SET
        amount = $1,
        payment_date = $2,
        payment_method = $3,
        payment_type = $4,
        notes = $5,
        paid_by = $6,
        payment_month = $7,
        payment_year = $8,
        number_of_months = $9,
        amount_due = $10
      WHERE id = $11
      RETURNING *
    `, [
      parseFloat(updateData.amount),
      updateData.payment_date || new Date().toISOString().split('T')[0],
      updateData.payment_method,
      finalPaymentType,
      updateData.notes || null,
      updateData.paid_by,
      updateData.payment_month || new Date().getMonth() + 1,
      updateData.payment_year || new Date().getFullYear(),
      updateData.number_of_months || 1,
      parseFloat(updateData.amount_due || updateData.amount),
      paymentId
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour'
      });
    }

    const updatedPayment = updateResult.rows[0];

    console.log('✅ Paiement modifié avec succès:', updatedPayment.receipt_number);

    res.json({
      success: true,
      message: 'Paiement modifié avec succès',
      payment: {
        id: updatedPayment.id,
        amount: parseFloat(updatedPayment.amount),
        payment_date: updatedPayment.payment_date,
        payment_method: updatedPayment.payment_method,
        payment_type: updatedPayment.payment_type,
        receipt_number: updatedPayment.receipt_number,
        notes: updatedPayment.notes,
        paid_by: updatedPayment.paid_by,
        payment_month: updatedPayment.payment_month,
        payment_year: updatedPayment.payment_year,
        number_of_months: updatedPayment.number_of_months,
        formatted_amount: formatCurrency(updatedPayment.amount)
      }
    });

  } catch (error) {
    console.error('❌ Erreur modification paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === 4.3 SUPPRIMER UN PAIEMENT ===
router.delete('/:paymentId', authenticateTokenDev, async (req, res) => {
  console.log('🗑️ Suppression paiement:', req.params.paymentId);
  
  try {
    const { paymentId } = req.params;

    // Validation de l'ID
    if (!paymentId || !paymentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paiement invalide'
      });
    }

    // Vérifier que le paiement existe
    const existingPayment = await query(
      'SELECT id, receipt_number, amount FROM student_payments WHERE id = $1',
      [paymentId]
    );

    if (existingPayment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé'
      });
    }

    const payment = existingPayment.rows[0];

    // Suppression physique
    const deleteResult = await query(
      'DELETE FROM student_payments WHERE id = $1 RETURNING id',
      [paymentId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression'
      });
    }

    console.log('✅ Paiement supprimé avec succès:', payment.receipt_number);

    res.json({
      success: true,
      message: 'Paiement supprimé avec succès',
      deleted_payment: {
        id: payment.id,
        receipt_number: payment.receipt_number,
        amount: payment.amount
      }
    });

  } catch (error) {
    console.error('❌ Erreur suppression paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================================
// 🔥 5. MIDDLEWARE DE GESTION D'ERREURS GLOBALES (TOUT À LA FIN)
// ===============================================

router.use((error, req, res, next) => {
  console.error('💥 ERREUR GLOBALE PAYMENTS:', error);
  
  if (error.code && error.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      error: 'Erreur de contrainte base de données',
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Erreur interne du module payments',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// 🔥 6. LOGS DES ROUTES DISPONIBLES
// ===============================================

console.log('✅ Module payments chargé - VERSION COMPLÈTE ORDONNÉE');
console.log('🔥 Routes disponibles dans l\'ordre optimal:');
console.log('');
console.log('📊 ROUTES GÉNÉRALES:');
console.log('  1. GET  /stats                          - Statistiques générales');
console.log('  2. GET  /                               - Liste générale des paiements');
console.log('');
console.log('👥 ROUTES ÉTUDIANTS:');
console.log('  3. POST /students/:studentId/payments   - Enregistrer paiement');
console.log('  4. GET  /students/:studentId/fees       - Calculer frais');
console.log('  5. GET  /students/:studentId/history    - Historique paiements');
console.log('  6. GET  /students/:studentId/payments   - Historique paiements (alias)');
console.log('');
console.log('📄 ROUTES SPÉCIALISÉES:');
console.log('  7. GET  /receipts/:paymentId            - Générer reçu PDF');
console.log('');
console.log('🔧 ROUTES CRUD INDIVIDUELLES:');
console.log('  8. GET    /:paymentId                   - Obtenir un paiement spécifique');
console.log('  9. PUT    /:paymentId                   - Modifier un paiement');
console.log(' 10. DELETE /:paymentId                   - Supprimer un paiement');
console.log('');
console.log('⚠️  ORDRE CRITIQUE: /stats, /receipts/:id AVANT /:id pour éviter les conflits');

module.exports = router;