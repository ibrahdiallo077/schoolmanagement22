// server/routes/finance.js - BACKEND FINAL CORRIGÉ
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { sanitizeText } = require('../utils/validation');

const router = express.Router();

console.log('🏦 === SYSTÈME FINANCIER UNIFIÉ V3.0 FINAL ===');

// === MIDDLEWARE ANTI RATE LIMITING ===
const requestTracker = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 secondes
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requêtes max par 10 secondes

router.use((req, res, next) => {
  const clientId = req.ip + (req.user?.id || 'anonymous');
  const now = Date.now();
  
  // Nettoyer les anciennes entrées
  for (const [key, data] of requestTracker.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      requestTracker.delete(key);
    }
  }
  
  // Vérifier le rate limiting
  if (requestTracker.has(clientId)) {
    const data = requestTracker.get(clientId);
    if (now - data.firstRequest < RATE_LIMIT_WINDOW) {
      data.count++;
      if (data.count > MAX_REQUESTS_PER_WINDOW) {
        console.log(`⚠️ Rate limit dépassé pour ${clientId}: ${data.count} requêtes`);
        return res.status(429).json({
          success: false,
          error: 'Trop de requêtes. Veuillez patienter.',
          retry_after: Math.ceil((RATE_LIMIT_WINDOW - (now - data.firstRequest)) / 1000)
        });
      }
    } else {
      requestTracker.set(clientId, { firstRequest: now, count: 1 });
    }
  } else {
    requestTracker.set(clientId, { firstRequest: now, count: 1 });
  }
  
  console.log(`🏦 FINANCE-API: ${req.method} ${req.originalUrl} [${clientId}]`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// === CACHE INTELLIGENT ===
const cache = new Map();
const CACHE_DURATION = 5000; // 5 secondes de cache

function getFromCache(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_DURATION) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 100) {
    const oldestKeys = Array.from(cache.keys()).slice(0, 50);
    oldestKeys.forEach(key => cache.delete(key));
  }
}

// === UTILITAIRES ===
const formatGNF = (amount) => {
  const num = Number(amount || 0);
  if (isNaN(num)) return '0 FG';
  
  // Pour les très gros montants, utiliser un format compact et lisible
  if (num >= 1000000000000) {
    // Trillions - 1,000,000,000,000+
    return `${(num / 1000000000000).toFixed(1)}T FG`;
  } else if (num >= 1000000000) {
    // Milliards - 1,000,000,000+
    return `${(num / 1000000000).toFixed(1)}B FG`;
  } else if (num >= 1000000) {
    // Millions - 1,000,000+
    return `${(num / 1000000).toFixed(1)}M FG`;
  } else if (num >= 100000) {
    // À partir de 100,000 FG, utiliser le format K
    return `${(num / 1000).toFixed(0)}K FG`;
  } else {
    // Pour les montants plus petits, affichage normal avec virgules
    return `${num.toLocaleString('en-US')} FG`;
  }
};

const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return { percentage: 0, direction: 'stable' };
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change).toFixed(1),
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    raw_change: change
  };
};

// === 1. DASHBOARD PRINCIPAL ===
router.get('/dashboard', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const cacheKey = 'dashboard_' + req.user.id;
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('📊 Dashboard servi depuis le cache');
      return res.json(cached);
    }

    console.log('📊 Dashboard - Calcul en temps réel optimisé');
    
    const dashboardData = await transaction(async (client) => {
      const unifiedQuery = `
        WITH financial_data AS (
          -- Paiements étudiants
          SELECT 
            'student_payment' as source_type,
            'INCOME' as transaction_type,
            amount,
            payment_date as transaction_date,
            EXTRACT(MONTH FROM payment_date) as month,
            EXTRACT(YEAR FROM payment_date) as year,
            EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
            EXTRACT(YEAR FROM CURRENT_DATE) as current_year
          FROM student_payments 
          WHERE is_cancelled = FALSE 
            AND payment_date IS NOT NULL
            AND payment_date >= CURRENT_DATE - INTERVAL '13 months'
          
          UNION ALL
          
          -- Dépenses générales
          SELECT 
            'general_expense' as source_type,
            'EXPENSE' as transaction_type,
            amount,
            paid_date as transaction_date,
            EXTRACT(MONTH FROM paid_date) as month,
            EXTRACT(YEAR FROM paid_date) as year,
            EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
            EXTRACT(YEAR FROM CURRENT_DATE) as current_year
          FROM expenses 
          WHERE paid_date IS NOT NULL
            AND expense_date IS NOT NULL
            AND paid_date >= CURRENT_DATE - INTERVAL '13 months'
          
          UNION ALL
          
          -- Salaires personnel
          SELECT 
            'staff_salary' as source_type,
            'EXPENSE' as transaction_type,
            amount,
            payment_date as transaction_date,
            EXTRACT(MONTH FROM payment_date) as month,
            EXTRACT(YEAR FROM payment_date) as year,
            EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
            EXTRACT(YEAR FROM CURRENT_DATE) as current_year
          FROM salary_payments_v2 
          WHERE status = 'completed'
            AND payment_date IS NOT NULL
            AND payment_date >= CURRENT_DATE - INTERVAL '13 months'
          
          UNION ALL
          
          -- Transactions manuelles
          SELECT 
            'manual_transaction' as source_type,
            type as transaction_type,
            amount,
            transaction_date,
            EXTRACT(MONTH FROM transaction_date) as month,
            EXTRACT(YEAR FROM transaction_date) as year,
            EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
            EXTRACT(YEAR FROM CURRENT_DATE) as current_year
          FROM manual_financial_transactions 
          WHERE impact_capital = true
            AND transaction_date IS NOT NULL
            AND transaction_date >= CURRENT_DATE - INTERVAL '13 months'
        ),
        
        totals AS (
          SELECT 
            SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) as total_expenses,
            SUM(CASE WHEN transaction_type = 'INCOME' AND month = current_month AND year = current_year 
                     THEN amount ELSE 0 END) as monthly_income,
            SUM(CASE WHEN transaction_type = 'EXPENSE' AND month = current_month AND year = current_year 
                     THEN amount ELSE 0 END) as monthly_expenses,
            SUM(CASE WHEN transaction_type = 'INCOME' AND month = current_month - 1 AND year = current_year 
                     THEN amount ELSE 0 END) as prev_monthly_income,
            SUM(CASE WHEN transaction_type = 'EXPENSE' AND month = current_month - 1 AND year = current_year 
                     THEN amount ELSE 0 END) as prev_monthly_expenses,
            SUM(CASE WHEN source_type = 'student_payment' THEN amount ELSE 0 END) as student_payments_total,
            SUM(CASE WHEN source_type = 'general_expense' THEN amount ELSE 0 END) as general_expenses_total,
            SUM(CASE WHEN source_type = 'staff_salary' THEN amount ELSE 0 END) as staff_salaries_total,
            SUM(CASE WHEN source_type = 'manual_transaction' AND transaction_type = 'INCOME' 
                     THEN amount ELSE 0 END) as manual_income_total,
            SUM(CASE WHEN source_type = 'manual_transaction' AND transaction_type = 'EXPENSE' 
                     THEN amount ELSE 0 END) as manual_expense_total,
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN source_type = 'student_payment' THEN 1 END) as student_payments_count,
            COUNT(CASE WHEN source_type = 'general_expense' THEN 1 END) as general_expenses_count,
            COUNT(CASE WHEN source_type = 'staff_salary' THEN 1 END) as staff_salaries_count,
            COUNT(CASE WHEN source_type = 'manual_transaction' THEN 1 END) as manual_transactions_count
          FROM financial_data
        )
        SELECT * FROM totals
      `;

      const result = await client.query(unifiedQuery);
      const data = result.rows[0] || {};
      
      const totalIncome = parseFloat(data.total_income) || 0;
      const totalExpenses = parseFloat(data.total_expenses) || 0;
      const currentBalance = totalIncome - totalExpenses;
      
      const monthlyIncome = parseFloat(data.monthly_income) || 0;
      const monthlyExpenses = parseFloat(data.monthly_expenses) || 0;
      const monthlyFlow = monthlyIncome - monthlyExpenses;
      
      const prevMonthlyIncome = parseFloat(data.prev_monthly_income) || 0;
      const prevMonthlyExpenses = parseFloat(data.prev_monthly_expenses) || 0;
      const prevMonthlyFlow = prevMonthlyIncome - prevMonthlyExpenses;
      
      console.log('💰 Calculs terminés:');
      console.log(`├─ 🎓 Paiements étudiants: ${formatGNF(data.student_payments_total)}`);
      console.log(`├─ 💼 Dépenses générales: ${formatGNF(data.general_expenses_total)}`);
      console.log(`├─ 👥 Salaires personnel: ${formatGNF(data.staff_salaries_total)}`);
      console.log(`├─ 🏦 Revenus manuels: ${formatGNF(data.manual_income_total)}`);
      console.log(`└─ 💎 Capital actuel: ${formatGNF(currentBalance)}`);
      
      return {
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          balance: currentBalance,
          monthly_income: monthlyIncome,
          monthly_expenses: monthlyExpenses,
          monthly_flow: monthlyFlow,
          prev_monthly_income: prevMonthlyIncome,
          prev_monthly_expenses: prevMonthlyExpenses,
          prev_monthly_flow: prevMonthlyFlow,
          transactions: parseInt(data.total_transactions) || 0
        },
        sources: {
          student_payments: {
            total: parseFloat(data.student_payments_total) || 0,
            count: parseInt(data.student_payments_count) || 0
          },
          general_expenses: {
            total: parseFloat(data.general_expenses_total) || 0,
            count: parseInt(data.general_expenses_count) || 0
          },
          staff_salaries: {
            total: parseFloat(data.staff_salaries_total) || 0,
            count: parseInt(data.staff_salaries_count) || 0
          },
          manual_income: {
            total: parseFloat(data.manual_income_total) || 0,
            count: parseInt(data.manual_transactions_count) || 0
          },
          manual_expenses: {
            total: parseFloat(data.manual_expense_total) || 0
          }
        }
      };
    });
    
    // Calculs des tendances
    const incomeTrend = calculateTrend(dashboardData.totals.monthly_income, dashboardData.totals.prev_monthly_income);
    const expenseTrend = calculateTrend(dashboardData.totals.monthly_expenses, dashboardData.totals.prev_monthly_expenses);
    const balanceTrend = calculateTrend(dashboardData.totals.monthly_flow, dashboardData.totals.prev_monthly_flow);
    
    // Santé financière
    const currentBalance = dashboardData.totals.balance;
    const healthScore = Math.min(100, Math.max(0,
      (currentBalance > 0 ? 40 : 0) + 
      (dashboardData.totals.monthly_flow > 0 ? 30 : 0) + 
      (balanceTrend.direction === 'up' ? 20 : balanceTrend.direction === 'stable' ? 15 : 5) + 
      (currentBalance > 1000000 ? 10 : 0)
    ));
    
    const healthLevel = healthScore >= 80 ? 'excellent' : 
                       healthScore >= 60 ? 'good' : 
                       healthScore >= 40 ? 'warning' : 'critical';
    
    // Alertes
    const alerts = [];
    if (currentBalance < 0) {
      alerts.push({
        type: 'CAPITAL_NEGATIVE',
        severity: 'CRITICAL',
        title: 'Capital négatif',
        message: `Déficit de ${formatGNF(Math.abs(currentBalance))}`,
        color: '#EF4444'
      });
    }
    
    if (dashboardData.totals.monthly_flow < -1000000) {
      alerts.push({
        type: 'MONTHLY_DEFICIT',
        severity: 'HIGH',
        title: 'Déficit mensuel important',
        message: `Déficit ce mois: ${formatGNF(Math.abs(dashboardData.totals.monthly_flow))}`,
        color: '#F59E0B'
      });
    }
    
    const responseData = {
      success: true,
      dashboard: {
        financial_health: {
          score: Math.round(healthScore),
          level: healthLevel,
          current_balance: currentBalance,
          formatted_balance: formatGNF(currentBalance),
          monthly_flow: dashboardData.totals.monthly_flow,
          formatted_monthly_flow: formatGNF(dashboardData.totals.monthly_flow),
          trend: balanceTrend
        },
        unified_flows: {
          income: {
            total: dashboardData.totals.income,
            monthly: dashboardData.totals.monthly_income,
            formatted_total: formatGNF(dashboardData.totals.income),
            formatted_monthly: formatGNF(dashboardData.totals.monthly_income),
            trend: incomeTrend
          },
          expenses: {
            total: dashboardData.totals.expenses,
            monthly: dashboardData.totals.monthly_expenses,
            formatted_total: formatGNF(dashboardData.totals.expenses),
            formatted_monthly: formatGNF(dashboardData.totals.monthly_expenses),
            trend: expenseTrend
          }
        },
        statistics: {
          total_transactions: dashboardData.totals.transactions,
          total_income: dashboardData.totals.income,
          total_expenses: dashboardData.totals.expenses,
          current_balance: currentBalance,
          total_student_payments: dashboardData.sources.student_payments.total,
          total_general_expenses: dashboardData.sources.general_expenses.total,
          total_staff_salaries: dashboardData.sources.staff_salaries.total,
          total_manual_income: dashboardData.sources.manual_income.total,
          total_manual_expenses: dashboardData.sources.manual_expenses.total,
          formatted_student_payments: formatGNF(dashboardData.sources.student_payments.total),
          formatted_general_expenses: formatGNF(dashboardData.sources.general_expenses.total),
          formatted_staff_salaries: formatGNF(dashboardData.sources.staff_salaries.total),
          formatted_current_balance: formatGNF(currentBalance)
        },
        alerts: alerts,
        metadata: {
          generated_at: new Date().toISOString(),
          calculation_method: 'unified_optimized_query',
          cached: false
        }
      }
    };
    
    setCache(cacheKey, responseData);
    console.log('✅ Dashboard généré et mis en cache');
    res.json(responseData);
    
  } catch (error) {
    console.error('💥 Erreur Dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du dashboard',
      details: error.message
    });
  }
});

// === 2. CAPITAL EN TEMPS RÉEL ===
router.get('/capital/current', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const cacheKey = 'capital_current';
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const capitalQuery = `
      WITH flows AS (
        SELECT SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) as balance
        FROM (
          SELECT 'INCOME' as type, amount FROM student_payments WHERE is_cancelled = FALSE
          UNION ALL
          SELECT 'EXPENSE' as type, amount FROM expenses WHERE paid_date IS NOT NULL
          UNION ALL  
          SELECT 'EXPENSE' as type, amount FROM salary_payments_v2 WHERE status = 'completed'
          UNION ALL
          SELECT type, amount FROM manual_financial_transactions WHERE impact_capital = true
        ) all_flows
      )
      SELECT * FROM flows
    `;
    
    const result = await query(capitalQuery);
    const balance = parseFloat(result.rows[0]?.balance || 0);
    
    const responseData = {
      success: true,
      capital: {
        current_balance: balance,
        formatted_balance: formatGNF(balance),
        last_updated: new Date().toISOString()
      }
    };
    
    setCache(cacheKey, responseData);
    res.json(responseData);
    
  } catch (error) {
    console.error('💥 Erreur capital:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du capital'
    });
  }
});

// === 3. TRANSACTIONS EN TEMPS RÉEL ===
router.get('/transactions/live', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const cacheKey = `transactions_live_${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const transactionsQuery = `
      WITH live_transactions AS (
        SELECT 
          'INCOME' as type,
          'SP-' || sp.id as transaction_id,
          sp.amount,
          sp.payment_date as date,
          'Paiement étudiant' as category,
          s.first_name || ' ' || s.last_name as entity_name,
          sp.payment_method as method,
          sp.receipt_number as reference,
          sp.created_at as recorded_at,
          'completed' as status
        FROM student_payments sp
        JOIN students s ON sp.student_id = s.id
        WHERE sp.is_cancelled = FALSE
        
        UNION ALL
        
        SELECT 
          'EXPENSE' as type,
          'EX-' || e.id as transaction_id,
          e.amount,
          e.expense_date as date,
          COALESCE(ec.name, 'Autres dépenses') as category,
          COALESCE(e.supplier_name, 'Fournisseur') as entity_name,
          e.payment_method as method,
          e.reference as reference,
          e.created_at as recorded_at,
          CASE WHEN e.paid_date IS NOT NULL THEN 'completed' ELSE 'pending' END as status
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.paid_date IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'EXPENSE' as type,
          'SAL-' || sal.id as transaction_id,
          sal.amount,
          sal.payment_date as date,
          'Salaire personnel' as category,
          st.first_name || ' ' || st.last_name as entity_name,
          sal.payment_method as method,
          sal.receipt_number as reference,
          sal.created_at as recorded_at,
          sal.status
        FROM salary_payments_v2 sal
        JOIN staff_salaries_v2 ss ON sal.staff_salary_id = ss.id
        JOIN staff st ON ss.staff_id = st.id
        WHERE sal.status = 'completed'
        
        UNION ALL
        
        SELECT 
          type,
          'MAN-' || id as transaction_id,
          amount,
          transaction_date as date,
          category,
          entity_name,
          payment_method as method,
          reference,
          created_at as recorded_at,
          status
        FROM manual_financial_transactions
        WHERE impact_capital = true
      )
      SELECT * FROM live_transactions
      ORDER BY recorded_at DESC
      LIMIT $1
    `;
    
    const result = await query(transactionsQuery, [parseInt(limit)]);
    
    const responseData = {
      success: true,
      live_transactions: {
        transactions: result.rows.map(tx => ({
          ...tx,
          formatted_amount: formatGNF(tx.amount),
          formatted_date: new Date(tx.date).toLocaleDateString('fr-FR'),
          color: tx.type === 'INCOME' ? '#10B981' : '#EF4444'
        })),
        count: result.rows.length
      }
    };
    
    setCache(cacheKey, responseData);
    res.json(responseData);
    
  } catch (error) {
    console.error('💥 Erreur transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des transactions'
    });
  }
});

// === 4. TRANSACTIONS MANUELLES ===
router.get('/manual-transactions', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const cacheKey = `manual_transactions_${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Créer la table si nécessaire
    await query(`
      CREATE TABLE IF NOT EXISTS manual_financial_transactions (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
        category VARCHAR(100),
        amount NUMERIC(15,2) NOT NULL,
        description TEXT NOT NULL,
        transaction_date DATE NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'manual_injection',
        notes TEXT,
        entity_name VARCHAR(255),
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'completed',
        impact_capital BOOLEAN DEFAULT true,
        metadata JSONB
      )
    `);

    const manualQuery = `
      SELECT 
        id, reference, type, category, amount, description,
        transaction_date, payment_method, notes, entity_name,
        status, impact_capital, created_at, updated_at
      FROM manual_financial_transactions
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await query(manualQuery, [parseInt(limit)]);
    
    const responseData = {
      success: true,
      manual_transactions: result.rows.map(tx => ({
        ...tx,
        amount: parseFloat(tx.amount),
        formatted_amount: formatGNF(tx.amount),
        formatted_date: new Date(tx.transaction_date).toLocaleDateString('fr-FR'),
        formatted_created_at: new Date(tx.created_at).toLocaleString('fr-FR'),
        color: tx.type === 'INCOME' ? '#10B981' : '#EF4444'
      })),
      statistics: {
        total_count: result.rows.length,
        total_income: result.rows
          .filter(tx => tx.type === 'INCOME')
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
        total_expenses: result.rows
          .filter(tx => tx.type === 'EXPENSE')
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
      }
    };
    
    setCache(cacheKey, responseData);
    res.json(responseData);
    
  } catch (error) {
    console.error('💥 Erreur transactions manuelles:', error);
    res.json({
      success: true,
      manual_transactions: [],
      statistics: { total_count: 0, total_income: 0, total_expenses: 0 }
    });
  }
});

// === 5. INJECTION DE TRANSACTION MANUELLE ===
router.post('/inject-transaction', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { type, amount, category, description, entity_name, transaction_date, payment_method, notes } = req.body;

    if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type requis: INCOME ou EXPENSE' });
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Montant valide requis' });
    }

    if (!description?.trim()) {
      return res.status(400).json({ success: false, error: 'Description requise' });
    }

    const finalAmount = parseFloat(amount);
    const finalDate = transaction_date || new Date().toISOString().split('T')[0];
    const finalReference = `INJ-${type}-${Date.now()}`;

    // Créer la table si nécessaire
    await query(`
      CREATE TABLE IF NOT EXISTS manual_financial_transactions (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
        category VARCHAR(100),
        amount NUMERIC(15,2) NOT NULL,
        description TEXT NOT NULL,
        transaction_date DATE NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'manual_injection',
        notes TEXT,
        entity_name VARCHAR(255),
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'completed',
        impact_capital BOOLEAN DEFAULT true,
        metadata JSONB
      )
    `);

    const insertResult = await query(`
      INSERT INTO manual_financial_transactions (
        reference, type, category, amount, description,
        transaction_date, payment_method, notes, entity_name,
        created_by, status, impact_capital
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      finalReference, type, category || 'Divers', finalAmount, description,
      finalDate, payment_method || 'manual_injection', notes, entity_name || 'Manuel',
      req.user.id, 'completed', true
    ]);

    // Vider le cache
    cache.clear();

    res.status(201).json({
      success: true,
      message: `Transaction ${type.toLowerCase()} injectée avec succès`,
      transaction: {
        id: insertResult.rows[0].id,
        reference: insertResult.rows[0].reference,
        type: insertResult.rows[0].type,
        amount: finalAmount,
        formatted_amount: formatGNF(finalAmount),
        description: insertResult.rows[0].description,
        transaction_date: insertResult.rows[0].transaction_date,
        category: insertResult.rows[0].category,
        entity_name: insertResult.rows[0].entity_name
      }
    });

  } catch (error) {
    console.error('💥 Erreur injection:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'injection de la transaction'
    });
  }
});

// === 6. MODIFIER UNE TRANSACTION MANUELLE ===
router.put('/manual-transaction/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, entity_name, notes, payment_method } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const updateResult = await query(`
      UPDATE manual_financial_transactions 
      SET 
        amount = COALESCE($2, amount),
        category = COALESCE($3, category),
        description = COALESCE($4, description),
        entity_name = COALESCE($5, entity_name),
        notes = COALESCE($6, notes),
        payment_method = COALESCE($7, payment_method),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      parseInt(id),
      amount ? parseFloat(amount) : null,
      category,
      description,
      entity_name,
      notes,
      payment_method
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }

    // Vider le cache
    cache.clear();

    res.json({
      success: true,
      message: 'Transaction modifiée avec succès',
      transaction: {
        id: updateResult.rows[0].id,
        reference: updateResult.rows[0].reference,
        type: updateResult.rows[0].type,
        amount: parseFloat(updateResult.rows[0].amount),
        formatted_amount: formatGNF(updateResult.rows[0].amount),
        description: updateResult.rows[0].description,
        category: updateResult.rows[0].category,
        entity_name: updateResult.rows[0].entity_name,
        notes: updateResult.rows[0].notes,
        updated_at: updateResult.rows[0].updated_at
      }
    });

  } catch (error) {
    console.error('💥 Erreur modification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification'
    });
  }
});

// === 7. DÉTAILS D'UNE TRANSACTION MANUELLE ===
router.get('/manual-transaction/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const result = await query(`
      SELECT 
        id, reference, type, category, amount, description,
        transaction_date, payment_method, notes, entity_name,
        status, impact_capital, created_at, updated_at, metadata
      FROM manual_financial_transactions
      WHERE id = $1
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }

    const tx = result.rows[0];

    res.json({
      success: true,
      transaction: {
        ...tx,
        amount: parseFloat(tx.amount),
        formatted_amount: formatGNF(tx.amount),
        formatted_date: new Date(tx.transaction_date).toLocaleDateString('fr-FR'),
        formatted_created_at: new Date(tx.created_at).toLocaleString('fr-FR'),
        formatted_updated_at: tx.updated_at ? new Date(tx.updated_at).toLocaleString('fr-FR') : null,
        color: tx.type === 'INCOME' ? '#10B981' : '#EF4444',
        icon: tx.type === 'INCOME' ? '💰' : '💸',
        metadata_parsed: tx.metadata ? 
          (typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata) : null
      }
    });

  } catch (error) {
    console.error('💥 Erreur détails transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails'
    });
  }
});

// === 8. SUPPRIMER UNE TRANSACTION MANUELLE ===
router.delete('/manual-transaction/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const result = await query('DELETE FROM manual_financial_transactions WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }

    // Vider le cache
    cache.clear();

    res.json({
      success: true,
      message: 'Transaction supprimée avec succès',
      deleted_transaction: {
        id: result.rows[0].id,
        reference: result.rows[0].reference,
        type: result.rows[0].type,
        formatted_amount: formatGNF(result.rows[0].amount),
        description: result.rows[0].description
      }
    });

  } catch (error) {
    console.error('💥 Erreur suppression:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

// === 9. INITIALISER LE CAPITAL ===
router.post('/initialize-capital', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Montant du capital initial requis et valide'
      });
    }

    const finalAmount = parseFloat(amount);
    const finalDescription = description || 'Capital initial de l\'école';
    const reference = `CAP-INITIAL-${Date.now()}`;

    // Vérifier s'il y a déjà un capital initial
    const existingCapital = await query(`
      SELECT COUNT(*) as count, SUM(amount) as total 
      FROM manual_financial_transactions 
      WHERE type = 'INCOME' 
        AND (LOWER(category) LIKE '%capital%' OR LOWER(category) LIKE '%initial%' OR LOWER(description) LIKE '%capital%')
    `);

    const hasInitialCapital = parseInt(existingCapital.rows[0].count) > 0;
    const existingAmount = parseFloat(existingCapital.rows[0].total) || 0;

    if (hasInitialCapital) {
      return res.status(400).json({
        success: false,
        error: 'Un capital initial existe déjà',
        existing_capital: {
          amount: existingAmount,
          formatted_amount: formatGNF(existingAmount)
        }
      });
    }

    // Créer la table si nécessaire
    await query(`
      CREATE TABLE IF NOT EXISTS manual_financial_transactions (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
        category VARCHAR(100),
        amount NUMERIC(15,2) NOT NULL,
        description TEXT NOT NULL,
        transaction_date DATE NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'manual_injection',
        notes TEXT,
        entity_name VARCHAR(255),
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'completed',
        impact_capital BOOLEAN DEFAULT true,
        metadata JSONB
      )
    `);

    // Insérer le capital initial
    const insertResult = await query(`
      INSERT INTO manual_financial_transactions (
        reference, type, category, amount, description,
        transaction_date, payment_method, entity_name,
        created_by, status, impact_capital, metadata
      ) VALUES (
        $1, 'INCOME', 'Capital initial', $2, $3, CURRENT_DATE,
        'capital_injection', 'Administration', $4, 'completed', true, $5
      ) RETURNING *
    `, [
      reference,
      finalAmount,
      finalDescription,
      req.user.id,
      JSON.stringify({
        type: 'initial_capital',
        injected_by: req.user.username,
        injection_date: new Date().toISOString(),
        is_initial_capital: true
      })
    ]);

    // Vider le cache
    cache.clear();

    console.log(`✅ Capital initial ajouté: ${formatGNF(finalAmount)}`);

    res.status(201).json({
      success: true,
      message: 'Capital initial ajouté avec succès',
      capital_initial: {
        id: insertResult.rows[0].id,
        reference: insertResult.rows[0].reference,
        amount: finalAmount,
        formatted_amount: formatGNF(finalAmount),
        description: finalDescription,
        transaction_date: insertResult.rows[0].transaction_date,
        created_at: insertResult.rows[0].created_at
      },
      injected_by: {
        username: req.user.username,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Erreur initialisation capital:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initialisation du capital',
      details: error.message
    });
  }
});

// === 10. SANTÉ DU SYSTÈME ===
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🏦 Système Financier Unifié - Opérationnel Anti-Rate-Limiting',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    cache_size: cache.size,
    active_requests: requestTracker.size,
    features: [
      '🚀 Anti Rate Limiting',
      '⚡ Cache intelligent',
      '📊 Dashboard optimisé',
      '💰 Capital temps réel',
      '📄 Transactions unifiées',
      '💉 Injection manuelle',
      '✏️ Modification transactions',
      '👁️ Détails transactions',
      '🗑️ Suppression sécurisée',
      '🏦 Initialisation capital'
    ]
  });
});

// === 11. ROUTE DE DEBUG ===
router.get('/debug', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const debugInfo = {
      cache_size: cache.size,
      active_requests: requestTracker.size,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime(),
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      database_status: 'connected',
      last_requests: Array.from(requestTracker.entries()).slice(-5).map(([client, data]) => ({
        client: client.substring(0, 20) + '...',
        requests: data.count,
        first_request: new Date(data.firstRequest).toISOString()
      })),
      cache_keys: Array.from(cache.keys()).slice(0, 10)
    };

    res.json({
      success: true,
      debug: debugInfo,
      message: 'Informations de débogage système financier'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des infos de debug',
      details: error.message
    });
  }
});

// === GESTION D'ERREURS GLOBALES ===
router.use((error, req, res, next) => {
  console.error('💥 ERREUR FINANCE GLOBALE:', error);

  if (error.message?.includes('rate limit') || error.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Trop de requêtes. Veuillez patienter.',
      retry_after: 10
    });
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      error: 'Service temporairement indisponible'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Erreur interne du système financier',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
  });
});

// === NETTOYAGE PÉRIODIQUE ===
setInterval(() => {
  const now = Date.now();

  // Nettoyer le cache
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > CACHE_DURATION * 2) {
      cache.delete(key);
    }
  }

  // Nettoyer le tracker de requêtes
  for (const [key, data] of requestTracker.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW * 2) {
      requestTracker.delete(key);
    }
  }

  // Log de nettoyage toutes les 5 minutes
  if (now % 300000 < 30000) {
    console.log(`🧹 Cache nettoyé: ${cache.size} éléments, ${requestTracker.size} clients trackés`);
  }
}, 30000);

console.log('✅ SYSTÈME FINANCIER UNIFIÉ V3.0 FINAL - CHARGÉ COMPLÈTEMENT');
console.log('🚀 Fonctionnalités disponibles:');
console.log('   ⚡ Anti Rate Limiting (50 req/10s)');
console.log('   💾 Cache intelligent (5s)');
console.log('   📊 Dashboard temps réel');
console.log('   💰 Capital en temps réel');
console.log('   📄 Transactions unifiées');
console.log('   💉 Injection de transactions');
console.log('   ✏️ Modification de transactions');
console.log('   👁️ Détails de transactions');
console.log('   🗑️ Suppression de transactions');
console.log('   🏦 Initialisation du capital');
console.log('   🔧 Route de debug');
console.log('');
console.log('📋 Routes disponibles:');
console.log('   GET    /dashboard                   - Dashboard principal');
console.log('   GET    /capital/current            - Capital temps réel');
console.log('   GET    /transactions/live          - Transactions temps réel');
console.log('   GET    /manual-transactions        - Liste transactions manuelles');
console.log('   GET    /manual-transaction/:id     - Détails transaction manuelle');
console.log('   POST   /inject-transaction         - Injection transaction');
console.log('   PUT    /manual-transaction/:id     - Modifier transaction');
console.log('   DELETE /manual-transaction/:id     - Supprimer transaction');
console.log('   POST   /initialize-capital         - Initialiser capital');
console.log('   GET    /health                     - Santé système');
console.log('   GET    /debug                      - Debug système');

module.exports = router;