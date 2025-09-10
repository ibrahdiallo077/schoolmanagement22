// server/routes/dashboard-overview.js - VERSION CORRIGÉE AVEC FINANCES EXACTES
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  dashboardCache, 
  CACHE_DURATION_DASHBOARD,
  getFromCache, 
  setCache, 
  formatGNF, 
  calculatePercentage 
} = require('./dashboard-core');

const router = express.Router();

console.log('📊 === DASHBOARD OVERVIEW - CORRIGÉ AVEC FINANCES EXACTES ===');

// === ROUTE PRINCIPALE : DASHBOARD OVERVIEW AVEC FINANCES CORRECTES ===
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `dashboard_overview_${req.user.id}`;
    const cached = getFromCache(dashboardCache, cacheKey, CACHE_DURATION_DASHBOARD);
    
    if (cached) {
      console.log('📊 Dashboard overview servi depuis le cache');
      return res.json({ ...cached, metadata: { ...cached.metadata, served_from_cache: true } });
    }

    console.log('📊 Dashboard overview - Calcul complet avec données financières CORRIGÉES...');
    const startTime = Date.now();

    const dashboardData = await transaction(async (client) => {
      // 🚀 REQUÊTE UNIFIÉE ULTRA-OPTIMISÉE AVEC FINANCES CORRIGÉES
      const unifiedQuery = `
        WITH date_filters AS (
          SELECT 
            CURRENT_DATE as today,
            CURRENT_DATE - INTERVAL '30 days' as month_ago,
            CURRENT_DATE - INTERVAL '7 days' as week_ago,
            EXTRACT(MONTH FROM CURRENT_DATE) as current_month,
            EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
            EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') as prev_month,
            EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') as prev_year
        ),
        
        -- 🎓 STATISTIQUES ÉTUDIANTS COMPLÈTES
        student_stats AS (
          SELECT 
            COUNT(*) as total_students,
            COUNT(*) FILTER (WHERE s.deleted = false OR s.deleted IS NULL) as active_students,
            COUNT(*) FILTER (WHERE s.gender = 'M' AND (s.deleted = false OR s.deleted IS NULL)) as male_students,
            COUNT(*) FILTER (WHERE s.gender = 'F' AND (s.deleted = false OR s.deleted IS NULL)) as female_students,
            COUNT(*) FILTER (WHERE s.created_at >= df.week_ago) as new_students_week,
            COUNT(*) FILTER (WHERE s.created_at >= df.month_ago) as new_students_month,
            COUNT(*) FILTER (WHERE s.status = 'interne' AND (s.deleted = false OR s.deleted IS NULL)) as internal_students,
            COUNT(*) FILTER (WHERE s.status = 'externe' AND (s.deleted = false OR s.deleted IS NULL)) as external_students,
            COUNT(*) FILTER (WHERE s.is_orphan = true AND (s.deleted = false OR s.deleted IS NULL)) as orphan_students,
            AVG(s.age) FILTER (WHERE s.age IS NOT NULL AND (s.deleted = false OR s.deleted IS NULL)) as avg_age
          FROM students s
          CROSS JOIN date_filters df
        ),
        
        -- 🏛️ STATISTIQUES CLASSES 
        class_stats AS (
          SELECT 
            COUNT(*) as total_classes,
            COUNT(*) FILTER (WHERE c.is_active = true OR c.is_active IS NULL) as active_classes,
            COUNT(*) FILTER (WHERE c.type = 'coranic' AND (c.is_active = true OR c.is_active IS NULL)) as coranic_classes,
            COUNT(*) FILTER (WHERE c.type = 'french' AND (c.is_active = true OR c.is_active IS NULL)) as french_classes,
            SUM(c.capacity) FILTER (WHERE c.is_active = true OR c.is_active IS NULL) as total_capacity,
            AVG(c.capacity) FILTER (WHERE c.capacity > 0 AND (c.is_active = true OR c.is_active IS NULL)) as avg_capacity,
            COUNT(*) FILTER (WHERE c.created_at >= df.week_ago) as new_classes_week
          FROM classes c
          CROSS JOIN date_filters df
        ),
        
        -- 👥 STATISTIQUES PERSONNEL
        staff_stats AS (
          SELECT 
            COUNT(*) as total_staff,
            COUNT(*) FILTER (WHERE st.status = 'active') as active_staff,
            COUNT(*) FILTER (WHERE st.position = 'teacher' AND st.status = 'active') as active_teachers,
            COUNT(*) FILTER (WHERE st.position = 'admin' AND st.status = 'active') as admin_staff,
            COUNT(*) FILTER (WHERE st.created_at >= df.week_ago) as new_staff_week
          FROM staff st
          CROSS JOIN date_filters df
        ),
        
        -- 📊 ÉVALUATIONS ACADÉMIQUES RÉCENTES
        academic_stats AS (
          SELECT 
            COUNT(*) as total_evaluations,
            COUNT(*) FILTER (WHERE sap.created_at >= df.week_ago) as evaluations_week,
            COUNT(*) FILTER (WHERE sap.created_at >= df.month_ago) as evaluations_month,
            AVG(sap.overall_grade) FILTER (WHERE sap.overall_grade IS NOT NULL) as avg_overall_grade,
            COUNT(*) FILTER (WHERE sap.overall_grade >= 16) as excellent_evaluations,
            COUNT(*) FILTER (WHERE sap.overall_grade >= 14 AND sap.overall_grade < 16) as good_evaluations,
            COUNT(*) FILTER (WHERE sap.overall_grade < 10) as poor_evaluations,
            SUM(sap.pages_memorized) FILTER (WHERE sap.pages_memorized IS NOT NULL) as total_pages_memorized,
            AVG(sap.attendance_rate) FILTER (WHERE sap.attendance_rate IS NOT NULL) as avg_attendance
          FROM student_academic_progress sap
          JOIN students s ON sap.student_id = s.id
          CROSS JOIN date_filters df
          WHERE (s.deleted = false OR s.deleted IS NULL)
        ),
        
        -- 💰 FINANCES GLOBALES CORRIGÉES (SOUS-REQUÊTES SÉPARÉES)
        financial_stats AS (
          SELECT 
            -- Revenus étudiants (paiements de scolarité)
            COALESCE((
              SELECT SUM(amount) 
              FROM student_payments sp
              CROSS JOIN date_filters df
              WHERE sp.is_cancelled = false
            ), 0) as total_student_payments,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM student_payments sp
              CROSS JOIN date_filters df
              WHERE sp.is_cancelled = false 
                AND sp.payment_date >= df.month_ago
            ), 0) as monthly_student_payments,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM student_payments sp
              CROSS JOIN date_filters df
              WHERE sp.is_cancelled = false 
                AND sp.payment_date >= df.week_ago
            ), 0) as weekly_student_payments,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM student_payments sp
              CROSS JOIN date_filters df
              WHERE sp.is_cancelled = false 
                AND EXTRACT(MONTH FROM sp.payment_date) = df.prev_month
                AND EXTRACT(YEAR FROM sp.payment_date) = df.prev_year
            ), 0) as prev_monthly_student_payments,
            
            COALESCE((
              SELECT COUNT(*) 
              FROM student_payments sp
              WHERE sp.is_cancelled = false
            ), 0) as total_payment_transactions,
            
            -- Dépenses générales
            COALESCE((
              SELECT SUM(amount) 
              FROM expenses e
              WHERE e.paid_date IS NOT NULL
            ), 0) as total_expenses,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM expenses e
              CROSS JOIN date_filters df
              WHERE e.paid_date IS NOT NULL 
                AND e.paid_date >= df.month_ago
            ), 0) as monthly_expenses,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM expenses e
              CROSS JOIN date_filters df
              WHERE e.paid_date IS NOT NULL 
                AND e.paid_date >= df.week_ago
            ), 0) as weekly_expenses,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM expenses e
              CROSS JOIN date_filters df
              WHERE e.paid_date IS NOT NULL 
                AND EXTRACT(MONTH FROM e.paid_date) = df.prev_month
                AND EXTRACT(YEAR FROM e.paid_date) = df.prev_year
            ), 0) as prev_monthly_expenses,
            
            COALESCE((
              SELECT COUNT(*) 
              FROM expenses e
              WHERE e.paid_date IS NOT NULL
            ), 0) as total_expense_transactions,
            
            -- Salaires personnel
            COALESCE((
              SELECT SUM(amount) 
              FROM salary_payments_v2 sal
              WHERE sal.status = 'completed'
            ), 0) as total_salaries,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM salary_payments_v2 sal
              CROSS JOIN date_filters df
              WHERE sal.status = 'completed' 
                AND sal.payment_date >= df.month_ago
            ), 0) as monthly_salaries,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM salary_payments_v2 sal
              CROSS JOIN date_filters df
              WHERE sal.status = 'completed' 
                AND sal.payment_date >= df.week_ago
            ), 0) as weekly_salaries,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM salary_payments_v2 sal
              CROSS JOIN date_filters df
              WHERE sal.status = 'completed' 
                AND EXTRACT(MONTH FROM sal.payment_date) = df.prev_month
                AND EXTRACT(YEAR FROM sal.payment_date) = df.prev_year
            ), 0) as prev_monthly_salaries,
            
            COALESCE((
              SELECT COUNT(*) 
              FROM salary_payments_v2 sal
              WHERE sal.status = 'completed'
            ), 0) as total_salary_transactions,
            
            -- Transactions manuelles (revenus)
            COALESCE((
              SELECT SUM(amount) 
              FROM manual_financial_transactions mft
              WHERE mft.type = 'INCOME' 
                AND mft.impact_capital = true
            ), 0) as manual_income_total,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM manual_financial_transactions mft
              CROSS JOIN date_filters df
              WHERE mft.type = 'INCOME' 
                AND mft.impact_capital = true 
                AND mft.transaction_date >= df.month_ago
            ), 0) as monthly_manual_income,
            
            -- Transactions manuelles (dépenses)
            COALESCE((
              SELECT SUM(amount) 
              FROM manual_financial_transactions mft
              WHERE mft.type = 'EXPENSE' 
                AND mft.impact_capital = true
            ), 0) as manual_expenses_total,
            
            COALESCE((
              SELECT SUM(amount) 
              FROM manual_financial_transactions mft
              CROSS JOIN date_filters df
              WHERE mft.type = 'EXPENSE' 
                AND mft.impact_capital = true 
                AND mft.transaction_date >= df.month_ago
            ), 0) as monthly_manual_expenses,
            
            COALESCE((
              SELECT COUNT(*) 
              FROM manual_financial_transactions mft
              WHERE mft.impact_capital = true
            ), 0) as manual_transactions_count
        )
        
        SELECT 
          -- Étudiants
          ss.total_students, ss.active_students, ss.male_students, ss.female_students,
          ss.new_students_week, ss.new_students_month, ss.avg_age, 
          ss.internal_students, ss.external_students, ss.orphan_students,
          
          -- Classes  
          cs.total_classes, cs.active_classes, cs.coranic_classes, cs.french_classes,
          cs.total_capacity, cs.avg_capacity, cs.new_classes_week,
          
          -- Personnel
          st.total_staff, st.active_staff, st.active_teachers, st.admin_staff, st.new_staff_week,
          
          -- Académique
          ac.total_evaluations, ac.evaluations_week, ac.evaluations_month,
          ac.avg_overall_grade, ac.excellent_evaluations, ac.good_evaluations, ac.poor_evaluations,
          ac.total_pages_memorized, ac.avg_attendance,
          
          -- Finances complètes CORRIGÉES
          fs.total_student_payments, fs.monthly_student_payments, fs.weekly_student_payments, 
          fs.prev_monthly_student_payments, fs.total_payment_transactions,
          fs.total_expenses, fs.monthly_expenses, fs.weekly_expenses, fs.prev_monthly_expenses, 
          fs.total_expense_transactions,
          fs.total_salaries, fs.monthly_salaries, fs.weekly_salaries, fs.prev_monthly_salaries, 
          fs.total_salary_transactions,
          fs.manual_income_total, fs.manual_expenses_total, fs.monthly_manual_income, 
          fs.monthly_manual_expenses, fs.manual_transactions_count,
          
          -- Calculs financiers globaux CORRIGÉS
          (fs.total_student_payments + fs.manual_income_total - fs.total_expenses - fs.total_salaries - fs.manual_expenses_total) as current_balance,
          (fs.monthly_student_payments + fs.monthly_manual_income - fs.monthly_expenses - fs.monthly_salaries - fs.monthly_manual_expenses) as monthly_flow,
          (fs.prev_monthly_student_payments - fs.prev_monthly_expenses - fs.prev_monthly_salaries) as prev_monthly_flow,
          (fs.total_student_payments + fs.manual_income_total) as total_income,
          (fs.total_expenses + fs.total_salaries + fs.manual_expenses_total) as total_all_expenses
          
        FROM student_stats ss, class_stats cs, staff_stats st, academic_stats ac, financial_stats fs
      `;

      console.log('📊 Exécution de la requête unifiée avec finances CORRIGÉES...');
      const result = await client.query(unifiedQuery);
      const data = result.rows[0] || {};
      
      console.log('📊 Données récupérées avec finances CORRIGÉES:', {
        students: data.active_students,
        classes: data.active_classes,
        staff: data.active_staff,
        evaluations: data.total_evaluations,
        balance: formatGNF(data.current_balance),
        monthly_flow: formatGNF(data.monthly_flow),
        student_payments: formatGNF(data.total_student_payments),
        expenses: formatGNF(data.total_expenses),
        salaries: formatGNF(data.total_salaries),
        manual_income: formatGNF(data.manual_income_total),
        manual_expenses: formatGNF(data.manual_expenses_total)
      });
      
      // 📈 CALCULS DE TENDANCES ET RATIOS
      const activeStudents = parseInt(data.active_students) || 0;
      const totalCapacity = parseInt(data.total_capacity) || 1;
      const occupancyRate = Math.round((activeStudents / totalCapacity) * 100);
      
      const currentBalance = parseFloat(data.current_balance) || 0;
      const monthlyFlow = parseFloat(data.monthly_flow) || 0;
      const prevMonthlyFlow = parseFloat(data.prev_monthly_flow) || 0;
      
      const totalEvaluations = parseInt(data.total_evaluations) || 1;
      const excellentRate = Math.round((parseInt(data.excellent_evaluations) || 0) / totalEvaluations * 100);
      
      // Calculs de tendances
      const calculateTrend = (current, previous) => {
        if (!previous || previous === 0) return { percentage: 0, direction: 'stable' };
        const change = ((current - previous) / previous) * 100;
        return {
          percentage: Math.abs(change).toFixed(1),
          direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
          raw_change: change
        };
      };
      
      const incomeTrend = calculateTrend(
        parseFloat(data.monthly_student_payments) + parseFloat(data.monthly_manual_income),
        parseFloat(data.prev_monthly_student_payments)
      );
      
      const expenseTrend = calculateTrend(
        parseFloat(data.monthly_expenses) + parseFloat(data.monthly_salaries) + parseFloat(data.monthly_manual_expenses),
        parseFloat(data.prev_monthly_expenses) + parseFloat(data.prev_monthly_salaries)
      );
      
      const balanceTrend = calculateTrend(monthlyFlow, prevMonthlyFlow);
      
      // 📊 INDICATEURS DE SANTÉ
      const healthIndicators = {
        financial_health: currentBalance > 0 ? 'positive' : 'negative',
        academic_performance: excellentRate > 60 ? 'excellent' : excellentRate > 40 ? 'good' : 'needs_improvement',
        capacity_utilization: occupancyRate > 80 ? 'high' : occupancyRate > 60 ? 'optimal' : 'low',
        staff_ratio: Math.round(activeStudents / Math.max(parseInt(data.active_teachers) || 1, 1))
      };
      
      // Score de santé global
      const healthScore = Math.min(100, Math.max(0,
        (currentBalance > 0 ? 30 : 10) + 
        (monthlyFlow > 0 ? 25 : 10) + 
        (excellentRate > 50 ? 25 : excellentRate > 30 ? 20 : 10) + 
        (occupancyRate > 60 && occupancyRate < 95 ? 20 : 10)
      ));
      
      // 🚨 ALERTES INTELLIGENTES
      const alerts = [];
      
      if (currentBalance < 0) {
        alerts.push({
          type: 'FINANCIAL_DEFICIT',
          severity: 'HIGH',
          title: 'Déficit financier',
          message: `Capital négatif: ${formatGNF(Math.abs(currentBalance))}`,
          action: 'Revoir la stratégie financière',
          color: '#EF4444'
        });
      }
      
      if (monthlyFlow < -1000000) {
        alerts.push({
          type: 'MONTHLY_DEFICIT',
          severity: 'HIGH',
          title: 'Déficit mensuel important',
          message: `Déficit ce mois: ${formatGNF(Math.abs(monthlyFlow))}`,
          action: 'Analyser les dépenses mensuelles',
          color: '#F59E0B'
        });
      }
      
      if (occupancyRate > 95) {
        alerts.push({
          type: 'CAPACITY_FULL',
          severity: 'MEDIUM',
          title: 'Capacité saturée',
          message: `Taux d'occupation: ${occupancyRate}%`,
          action: 'Considérer l\'ouverture de nouvelles classes',
          color: '#F59E0B'
        });
      }
      
      if (excellentRate < 30) {
        alerts.push({
          type: 'ACADEMIC_PERFORMANCE',
          severity: 'MEDIUM',
          title: 'Performance académique',
          message: `Seulement ${excellentRate}% d'évaluations excellentes`,
          action: 'Renforcer l\'accompagnement pédagogique',
          color: '#F59E0B'
        });
      }
      
      const staffStudentRatio = healthIndicators.staff_ratio;
      if (staffStudentRatio > 25) {
        alerts.push({
          type: 'STAFF_SHORTAGE',
          severity: 'MEDIUM',
          title: 'Ratio enseignant/élève élevé',
          message: `${staffStudentRatio} élèves par enseignant`,
          action: 'Recruter des enseignants supplémentaires',
          color: '#F59E0B'
        });
      }

      // Si pas d'alertes critiques, ajouter une alerte positive
      if (alerts.length === 0) {
        alerts.push({
          type: 'SYSTEM_HEALTHY',
          severity: 'LOW',
          title: 'Système en bonne santé',
          message: 'Toutes les métriques sont dans les normes',
          action: 'Continuer le bon travail',
          color: '#10B981'
        });
      }

      return {
        // 📊 STATISTIQUES PRINCIPALES
        core_metrics: {
          students: {
            total: activeStudents,
            new_this_week: parseInt(data.new_students_week) || 0,
            new_this_month: parseInt(data.new_students_month) || 0,
            male_percentage: calculatePercentage(parseInt(data.male_students) || 0, activeStudents),
            female_percentage: calculatePercentage(parseInt(data.female_students) || 0, activeStudents),
            internal_percentage: calculatePercentage(parseInt(data.internal_students) || 0, activeStudents),
            external_percentage: calculatePercentage(parseInt(data.external_students) || 0, activeStudents),
            orphan_percentage: calculatePercentage(parseInt(data.orphan_students) || 0, activeStudents),
            average_age: Math.round(parseFloat(data.avg_age) || 0)
          },
          classes: {
            total: parseInt(data.active_classes) || 0,
            coranic: parseInt(data.coranic_classes) || 0,
            french: parseInt(data.french_classes) || 0,
            total_capacity: totalCapacity,
            occupancy_rate: occupancyRate,
            average_capacity: Math.round(parseFloat(data.avg_capacity) || 0),
            new_this_week: parseInt(data.new_classes_week) || 0
          },
          staff: {
            total: parseInt(data.active_staff) || 0,
            teachers: parseInt(data.active_teachers) || 0,
            admin: parseInt(data.admin_staff) || 0,
            student_teacher_ratio: staffStudentRatio,
            new_this_week: parseInt(data.new_staff_week) || 0
          },
          academic: {
            total_evaluations: totalEvaluations,
            evaluations_this_week: parseInt(data.evaluations_week) || 0,
            evaluations_this_month: parseInt(data.evaluations_month) || 0,
            average_grade: Math.round((parseFloat(data.avg_overall_grade) || 0) * 10) / 10,
            excellent_rate: excellentRate,
            good_rate: Math.round((parseInt(data.good_evaluations) || 0) / totalEvaluations * 100),
            poor_rate: Math.round((parseInt(data.poor_evaluations) || 0) / totalEvaluations * 100),
            total_pages_memorized: parseInt(data.total_pages_memorized) || 0,
            average_attendance: Math.round(parseFloat(data.avg_attendance) || 0)
          }
        },
        
        // 💰 FINANCES COMPLÈTES CORRIGÉES (COHÉRENTES AVEC FINANCE.JS)
        financial_overview: {
          current_balance: currentBalance,
          formatted_balance: formatGNF(currentBalance),
          monthly_flow: monthlyFlow,
          formatted_monthly_flow: formatGNF(monthlyFlow),
          balance_trend: balanceTrend,
          
          income: {
            // Revenus étudiants
            student_payments: parseFloat(data.total_student_payments) || 0,
            monthly_student_payments: parseFloat(data.monthly_student_payments) || 0,
            weekly_student_payments: parseFloat(data.weekly_student_payments) || 0,
            formatted_total: formatGNF(data.total_student_payments),
            formatted_monthly: formatGNF(data.monthly_student_payments),
            formatted_weekly: formatGNF(data.weekly_student_payments),
            total_transactions: parseInt(data.total_payment_transactions) || 0,
            
            // Revenus manuels
            manual_income: parseFloat(data.manual_income_total) || 0,
            monthly_manual_income: parseFloat(data.monthly_manual_income) || 0,
            formatted_manual_total: formatGNF(data.manual_income_total),
            formatted_monthly_manual: formatGNF(data.monthly_manual_income),
            
            // Total revenus
            total_income: parseFloat(data.total_income) || 0,
            formatted_total_income: formatGNF(data.total_income),
            income_trend: incomeTrend
          },
          
          expenses: {
            // Dépenses générales
            general: parseFloat(data.total_expenses) || 0,
            monthly_general: parseFloat(data.monthly_expenses) || 0,
            weekly_general: parseFloat(data.weekly_expenses) || 0,
            formatted_general: formatGNF(data.total_expenses),
            formatted_monthly_general: formatGNF(data.monthly_expenses),
            formatted_weekly_general: formatGNF(data.weekly_expenses),
            general_transactions: parseInt(data.total_expense_transactions) || 0,
            
            // Salaires
            salaries: parseFloat(data.total_salaries) || 0,
            monthly_salaries: parseFloat(data.monthly_salaries) || 0,
            weekly_salaries: parseFloat(data.weekly_salaries) || 0,
            formatted_salaries: formatGNF(data.total_salaries),
            formatted_monthly_salaries: formatGNF(data.monthly_salaries),
            formatted_weekly_salaries: formatGNF(data.weekly_salaries),
            salary_transactions: parseInt(data.total_salary_transactions) || 0,
            
            // Dépenses manuelles
            manual_expenses: parseFloat(data.manual_expenses_total) || 0,
            monthly_manual_expenses: parseFloat(data.monthly_manual_expenses) || 0,
            formatted_manual_expenses: formatGNF(data.manual_expenses_total),
            formatted_monthly_manual_expenses: formatGNF(data.monthly_manual_expenses),
            
            // Total dépenses
            total_expenses: parseFloat(data.total_all_expenses) || 0,
            formatted_total_expenses: formatGNF(data.total_all_expenses),
            expense_trend: expenseTrend
          },
          
          // Transactions manuelles (finance.js)
          manual_transactions: {
            total_count: parseInt(data.manual_transactions_count) || 0,
            income_total: parseFloat(data.manual_income_total) || 0,
            expenses_total: parseFloat(data.manual_expenses_total) || 0,
            monthly_income: parseFloat(data.monthly_manual_income) || 0,
            monthly_expenses: parseFloat(data.monthly_manual_expenses) || 0
          }
        },
        
        // 🏥 SANTÉ DU SYSTÈME
        system_health: {
          indicators: healthIndicators,
          overall_score: Math.round(healthScore),
          financial_score: currentBalance > 0 ? 
            (currentBalance > 5000000 ? 100 : currentBalance > 1000000 ? 80 : 60) : 20,
          academic_score: excellentRate > 70 ? 100 : excellentRate > 50 ? 80 : excellentRate > 30 ? 60 : 40,
          operational_score: occupancyRate > 60 && occupancyRate < 95 ? 100 : 70
        },
        
        // 🚨 ALERTES ET RECOMMANDATIONS
        alerts: alerts,
        
        // 🎯 RECOMMANDATIONS INTELLIGENTES
        recommendations: [
          ...(currentBalance < 0 ? [{
            type: 'FINANCIAL',
            priority: 'HIGH',
            title: 'Améliorer la situation financière',
            description: 'Analyser les dépenses et optimiser les revenus'
          }] : []),
          
          ...(monthlyFlow < 0 ? [{
            type: 'CASH_FLOW',
            priority: 'HIGH',
            title: 'Améliorer le flux de trésorerie mensuel',
            description: `Déficit mensuel: ${formatGNF(Math.abs(monthlyFlow))}`
          }] : []),
          
          ...(occupancyRate < 50 ? [{
            type: 'ENROLLMENT',
            priority: 'MEDIUM',
            title: 'Augmenter les inscriptions',
            description: `Capacité utilisée à ${occupancyRate}% seulement`
          }] : []),
          
          ...(excellentRate < 40 ? [{
            type: 'ACADEMIC',
            priority: 'MEDIUM',
            title: 'Améliorer les performances académiques',
            description: 'Renforcer l\'accompagnement des étudiants'
          }] : []),
          
          ...(staffStudentRatio > 25 ? [{
            type: 'STAFFING',
            priority: 'MEDIUM',
            title: 'Recruter plus d\'enseignants',
            description: `Ratio actuel: ${staffStudentRatio} élèves/enseignant`
          }] : []),

          // Recommandations positives si système en bonne santé
          ...(alerts.length === 1 && alerts[0].type === 'SYSTEM_HEALTHY' ? [{
            type: 'GROWTH',
            priority: 'LOW',
            title: 'Opportunités de croissance',
            description: 'Votre système fonctionne bien, explorez de nouvelles opportunités'
          }] : [])
        ]
      };
    });

    const responseData = {
      success: true,
      dashboard: dashboardData,
      metadata: {
        generated_at: new Date().toISOString(),
        calculation_time_ms: Date.now() - startTime,
        data_sources: [
          'students', 'classes', 'staff', 'student_academic_progress',
          'student_payments', 'expenses', 'salary_payments_v2', 'manual_financial_transactions'
        ],
        cache_duration_seconds: CACHE_DURATION_DASHBOARD / 1000,
        served_from_cache: false,
        integration: 'finance_unified_corrected',
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        }
      }
    };

    setCache(dashboardCache, cacheKey, responseData);
    
    console.log(`✅ Dashboard overview généré avec finances CORRIGÉES en ${Date.now() - startTime}ms`);
    console.log(`📊 Données: ${dashboardData.core_metrics.students.total} étudiants, ${dashboardData.core_metrics.classes.total} classes`);
    console.log(`💰 Finance: ${dashboardData.financial_overview.formatted_balance} de capital`);
    console.log(`📈 Flux mensuel: ${dashboardData.financial_overview.formatted_monthly_flow}`);
    console.log(`🏥 Santé système: ${dashboardData.system_health.overall_score}/100`);
    console.log(`🚨 Alertes: ${dashboardData.alerts.length}`);
    console.log(`💎 Revenus étudiants: ${formatGNF(dashboardData.financial_overview.income.student_payments)}`);
    console.log(`💸 Dépenses totales: ${formatGNF(dashboardData.financial_overview.expenses.total_expenses)}`);
    console.log(`💰 Transactions manuelles: ${dashboardData.financial_overview.manual_transactions.total_count}`);
    
    res.json(responseData);

  } catch (error) {
    console.error('⛔ Erreur Dashboard Overview:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du tableau de bord',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      fallback_data: {
        core_metrics: {
          students: { 
            total: 0, 
            new_this_week: 0, 
            new_this_month: 0,
            male_percentage: 0,
            female_percentage: 0,
            internal_percentage: 0,
            external_percentage: 0,
            orphan_percentage: 0,
            average_age: 0
          },
          classes: { 
            total: 0, 
            coranic: 0,
            french: 0,
            total_capacity: 0,
            occupancy_rate: 0,
            average_capacity: 0,
            new_this_week: 0
          },
          staff: { 
            total: 0, 
            teachers: 0,
            admin: 0,
            student_teacher_ratio: 0,
            new_this_week: 0
          },
          academic: { 
            total_evaluations: 0, 
            evaluations_this_week: 0,
            evaluations_this_month: 0,
            average_grade: 0,
            excellent_rate: 0,
            good_rate: 0,
            poor_rate: 0,
            total_pages_memorized: 0,
            average_attendance: 0
          }
        },
        financial_overview: {
          current_balance: 0,
          formatted_balance: '0 FG',
          monthly_flow: 0,
          formatted_monthly_flow: '0 FG',
          balance_trend: { percentage: 0, direction: 'stable' },
          income: {
            student_payments: 0,
            monthly_student_payments: 0,
            weekly_student_payments: 0,
            formatted_total: '0 FG',
            formatted_monthly: '0 FG',
            formatted_weekly: '0 FG',
            total_transactions: 0,
            manual_income: 0,
            monthly_manual_income: 0,
            formatted_manual_total: '0 FG',
            formatted_monthly_manual: '0 FG',
            total_income: 0,
            formatted_total_income: '0 FG',
            income_trend: { percentage: 0, direction: 'stable' }
          },
          expenses: {
            general: 0,
            monthly_general: 0,
            weekly_general: 0,
            formatted_general: '0 FG',
            formatted_monthly_general: '0 FG',
            formatted_weekly_general: '0 FG',
            general_transactions: 0,
            salaries: 0,
            monthly_salaries: 0,
            weekly_salaries: 0,
            formatted_salaries: '0 FG',
            formatted_monthly_salaries: '0 FG',
            formatted_weekly_salaries: '0 FG',
            salary_transactions: 0,
            manual_expenses: 0,
            monthly_manual_expenses: 0,
            formatted_manual_expenses: '0 FG',
            formatted_monthly_manual_expenses: '0 FG',
            total_expenses: 0,
            formatted_total_expenses: '0 FG',
            expense_trend: { percentage: 0, direction: 'stable' }
          },
          manual_transactions: {
            total_count: 0,
            income_total: 0,
            expenses_total: 0,
            monthly_income: 0,
            monthly_expenses: 0
          }
        },
        system_health: { 
          overall_score: 0,
          financial_score: 0,
          academic_score: 0,
          operational_score: 0,
          indicators: {
            financial_health: 'negative',
            academic_performance: 'needs_improvement',
            capacity_utilization: 'low',
            staff_ratio: 0
          }
        },
        alerts: [{
          type: 'SYSTEM_ERROR',
          severity: 'HIGH',
          title: 'Erreur système',
          message: 'Impossible de récupérer les données',
          action: 'Contacter l\'administrateur',
          color: '#EF4444'
        }],
        recommendations: [{
          type: 'TECHNICAL',
          priority: 'HIGH',
          title: 'Vérifier la configuration',
          description: 'Un problème technique empêche l\'affichage des données'
        }]
      }
    });
  }
});

module.exports = router;