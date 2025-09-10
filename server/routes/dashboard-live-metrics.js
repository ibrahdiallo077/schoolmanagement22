// server/routes/dashboard-live-metrics.js - MÉTRIQUES TEMPS RÉEL CORRIGÉES AVEC FINANCE
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { 
  liveCache, 
  CACHE_DURATION_LIVE,
  getFromCache, 
  setCache, 
  formatGNF 
} = require('./dashboard-core');

const router = express.Router();

console.log('📈 === DASHBOARD LIVE METRICS - MÉTRIQUES TEMPS RÉEL AVEC FINANCE ===');

// === ROUTE : MÉTRIQUES TEMPS RÉEL COMPLÈTES AVEC FINANCE ===
router.get('/live-metrics', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `live_metrics_${req.user.id}`;
    const cached = getFromCache(liveCache, cacheKey, CACHE_DURATION_LIVE);
    
    if (cached) {
      return res.json({ ...cached, served_from_cache: true });
    }

    console.log('📈 Calcul métriques temps réel avec données financières complètes...');

    // REQUÊTE UNIFIÉE POUR TOUTES LES DONNÉES FINANCIÈRES
    const liveQuery = `
      WITH time_filters AS (
        SELECT 
          CURRENT_DATE as today,
          CURRENT_TIMESTAMP - INTERVAL '1 hour' as last_hour,
          CURRENT_DATE - INTERVAL '7 days' as week_ago,
          CURRENT_DATE - INTERVAL '30 days' as month_ago
      ),
      
      -- 🎓 STATISTIQUES ÉTUDIANTS
      student_metrics AS (
        SELECT 
          COUNT(*) FILTER (WHERE s.created_at >= tf.today) as students_today,
          COUNT(*) FILTER (WHERE s.created_at >= tf.last_hour) as students_hour,
          COUNT(*) FILTER (WHERE s.created_at >= tf.week_ago) as students_week,
          COUNT(*) FILTER (WHERE s.created_at >= tf.month_ago) as students_month,
          COUNT(*) FILTER (WHERE (s.deleted = false OR s.deleted IS NULL)) as total_active_students,
          COUNT(*) FILTER (WHERE s.status = 'interne' AND (s.deleted = false OR s.deleted IS NULL)) as internal_students,
          COUNT(*) FILTER (WHERE s.status = 'externe' AND (s.deleted = false OR s.deleted IS NULL)) as external_students,
          COUNT(*) FILTER (WHERE s.gender = 'M' AND (s.deleted = false OR s.deleted IS NULL)) as male_students,
          COUNT(*) FILTER (WHERE s.gender = 'F' AND (s.deleted = false OR s.deleted IS NULL)) as female_students,
          COUNT(*) FILTER (WHERE s.is_orphan = true AND (s.deleted = false OR s.deleted IS NULL)) as orphan_students
        FROM students s, time_filters tf
      ),
      
      -- 🏛️ STATISTIQUES CLASSES
      class_metrics AS (
        SELECT 
          COUNT(*) FILTER (WHERE c.is_active = true OR c.is_active IS NULL) as active_classes,
          COUNT(*) FILTER (WHERE c.type = 'coranic' AND (c.is_active = true OR c.is_active IS NULL)) as coranic_classes,
          COUNT(*) FILTER (WHERE c.type = 'french' AND (c.is_active = true OR c.is_active IS NULL)) as french_classes,
          COUNT(*) FILTER (WHERE c.created_at >= tf.today) as classes_today,
          COUNT(*) FILTER (WHERE c.created_at >= tf.week_ago) as classes_week,
          SUM(c.capacity) FILTER (WHERE c.is_active = true OR c.is_active IS NULL) as total_capacity,
          AVG(c.capacity) FILTER (WHERE c.capacity > 0 AND (c.is_active = true OR c.is_active IS NULL)) as avg_capacity
        FROM classes c, time_filters tf
      ),
      
      -- 👥 STATISTIQUES PERSONNEL
      staff_metrics AS (
        SELECT 
          COUNT(*) FILTER (WHERE st.status = 'active') as active_staff,
          COUNT(*) FILTER (WHERE st.position = 'teacher' AND st.status = 'active') as active_teachers,
          COUNT(*) FILTER (WHERE st.position = 'admin' AND st.status = 'active') as admin_staff,
          COUNT(*) FILTER (WHERE st.created_at >= tf.today) as staff_today,
          COUNT(*) FILTER (WHERE st.created_at >= tf.week_ago) as staff_week
        FROM staff st, time_filters tf
      ),
      
      -- 📊 ÉVALUATIONS ACADÉMIQUES
      academic_metrics AS (
        SELECT 
          COUNT(*) FILTER (WHERE sap.created_at >= tf.today) as evaluations_today,
          COUNT(*) FILTER (WHERE sap.created_at >= tf.last_hour) as evaluations_hour,
          COUNT(*) FILTER (WHERE sap.created_at >= tf.week_ago) as evaluations_week,
          COUNT(*) FILTER (WHERE sap.created_at >= tf.month_ago) as evaluations_month,
          COUNT(*) as total_evaluations,
          AVG(sap.overall_grade) FILTER (WHERE sap.overall_grade IS NOT NULL) as avg_overall_grade,
          COUNT(*) FILTER (WHERE sap.overall_grade >= 16) as excellent_evaluations,
          COUNT(*) FILTER (WHERE sap.overall_grade >= 14 AND sap.overall_grade < 16) as good_evaluations,
          COUNT(*) FILTER (WHERE sap.overall_grade < 10) as poor_evaluations,
          SUM(sap.pages_memorized) FILTER (WHERE sap.pages_memorized IS NOT NULL) as total_pages_memorized,
          AVG(sap.attendance_rate) FILTER (WHERE sap.attendance_rate IS NOT NULL) as avg_attendance
        FROM student_academic_progress sap
        JOIN students s ON sap.student_id = s.id, time_filters tf
        WHERE (s.deleted = false OR s.deleted IS NULL)
      ),
      
      -- 💰 MÉTRIQUES FINANCIÈRES COMPLÈTES (INTÉGRATION FINANCE.JS)
      financial_metrics AS (
        SELECT 
          -- Revenus étudiants
          COALESCE(SUM(sp.amount) FILTER (WHERE sp.is_cancelled = false), 0) as total_student_payments,
          COALESCE(SUM(sp.amount) FILTER (
            WHERE sp.is_cancelled = false 
              AND sp.payment_date >= tf.today
          ), 0) as student_payments_today,
          COALESCE(SUM(sp.amount) FILTER (
            WHERE sp.is_cancelled = false 
              AND sp.payment_date >= tf.week_ago
          ), 0) as student_payments_week,
          COALESCE(SUM(sp.amount) FILTER (
            WHERE sp.is_cancelled = false 
              AND sp.payment_date >= tf.month_ago
          ), 0) as student_payments_month,
          COUNT(sp.id) FILTER (WHERE sp.is_cancelled = false AND sp.payment_date >= tf.today) as payment_transactions_today,
          COUNT(sp.id) FILTER (WHERE sp.is_cancelled = false AND sp.payment_date >= tf.week_ago) as payment_transactions_week,
          
          -- Dépenses générales
          COALESCE(SUM(e.amount) FILTER (WHERE e.paid_date IS NOT NULL), 0) as total_expenses,
          COALESCE(SUM(e.amount) FILTER (
            WHERE e.paid_date IS NOT NULL 
              AND e.expense_date >= tf.today
          ), 0) as expenses_today,
          COALESCE(SUM(e.amount) FILTER (
            WHERE e.paid_date IS NOT NULL 
              AND e.expense_date >= tf.week_ago
          ), 0) as expenses_week,
          COALESCE(SUM(e.amount) FILTER (
            WHERE e.paid_date IS NOT NULL 
              AND e.expense_date >= tf.month_ago
          ), 0) as expenses_month,
          COUNT(e.id) FILTER (WHERE e.paid_date IS NOT NULL AND e.expense_date >= tf.today) as expense_transactions_today,
          COUNT(e.id) FILTER (WHERE e.paid_date IS NOT NULL AND e.expense_date >= tf.week_ago) as expense_transactions_week,
          
          -- Salaires personnel
          COALESCE(SUM(sal.amount) FILTER (WHERE sal.status = 'completed'), 0) as total_salaries,
          COALESCE(SUM(sal.amount) FILTER (
            WHERE sal.status = 'completed' 
              AND sal.payment_date >= tf.today
          ), 0) as salaries_today,
          COALESCE(SUM(sal.amount) FILTER (
            WHERE sal.status = 'completed' 
              AND sal.payment_date >= tf.week_ago
          ), 0) as salaries_week,
          COALESCE(SUM(sal.amount) FILTER (
            WHERE sal.status = 'completed' 
              AND sal.payment_date >= tf.month_ago
          ), 0) as salaries_month,
          COUNT(sal.id) FILTER (WHERE sal.status = 'completed' AND sal.payment_date >= tf.today) as salary_transactions_today,
          
          -- Transactions manuelles (intégration avec finance.js)
          COALESCE(SUM(mft.amount) FILTER (
            WHERE mft.type = 'INCOME' 
              AND mft.impact_capital = true 
              AND mft.transaction_date >= tf.today
          ), 0) as manual_income_today,
          COALESCE(SUM(mft.amount) FILTER (
            WHERE mft.type = 'EXPENSE' 
              AND mft.impact_capital = true 
              AND mft.transaction_date >= tf.today
          ), 0) as manual_expenses_today,
          COALESCE(SUM(mft.amount) FILTER (
            WHERE mft.type = 'INCOME' 
              AND mft.impact_capital = true 
              AND mft.transaction_date >= tf.week_ago
          ), 0) as manual_income_week,
          COALESCE(SUM(mft.amount) FILTER (
            WHERE mft.type = 'EXPENSE' 
              AND mft.impact_capital = true 
              AND mft.transaction_date >= tf.week_ago
          ), 0) as manual_expenses_week,
          COUNT(mft.id) FILTER (WHERE mft.impact_capital = true AND mft.transaction_date >= tf.today) as manual_transactions_today,
          
          -- Capital total
          COALESCE(SUM(sp.amount) FILTER (WHERE sp.is_cancelled = false), 0) +
          COALESCE(SUM(mft.amount) FILTER (WHERE mft.type = 'INCOME' AND mft.impact_capital = true), 0) -
          COALESCE(SUM(e.amount) FILTER (WHERE e.paid_date IS NOT NULL), 0) -
          COALESCE(SUM(sal.amount) FILTER (WHERE sal.status = 'completed'), 0) -
          COALESCE(SUM(mft.amount) FILTER (WHERE mft.type = 'EXPENSE' AND mft.impact_capital = true), 0) as current_balance
          
        FROM time_filters tf
        LEFT JOIN student_payments sp ON 1=1
        LEFT JOIN expenses e ON 1=1
        LEFT JOIN salary_payments_v2 sal ON 1=1
        LEFT JOIN manual_financial_transactions mft ON 1=1
      ),
      
      -- 🔔 NOTIFICATIONS RÉCENTES
      notification_metrics AS (
        SELECT 
          COUNT(*) FILTER (WHERE n.created_at >= tf.today AND n.is_active = true) as notifications_today,
          COUNT(*) FILTER (WHERE n.created_at >= tf.last_hour AND n.is_active = true) as notifications_hour,
          COUNT(*) FILTER (WHERE n.is_read = false AND n.is_active = true) as unread_notifications,
          COUNT(*) FILTER (WHERE n.priority = 'urgent' AND n.is_read = false AND n.is_active = true) as urgent_notifications,
          COUNT(*) FILTER (WHERE n.due_date <= CURRENT_TIMESTAMP AND n.is_active = true) as overdue_notifications
        FROM notifications n, time_filters tf
      )
      
      SELECT 
        -- Étudiants
        sm.students_today, sm.students_hour, sm.students_week, sm.students_month,
        sm.total_active_students, sm.internal_students, sm.external_students,
        sm.male_students, sm.female_students, sm.orphan_students,
        
        -- Classes
        cm.active_classes, cm.coranic_classes, cm.french_classes,
        cm.classes_today, cm.classes_week, cm.total_capacity, cm.avg_capacity,
        
        -- Personnel
        stm.active_staff, stm.active_teachers, stm.admin_staff,
        stm.staff_today, stm.staff_week,
        
        -- Académique
        am.evaluations_today, am.evaluations_hour, am.evaluations_week, am.evaluations_month,
        am.total_evaluations, am.avg_overall_grade, am.excellent_evaluations,
        am.good_evaluations, am.poor_evaluations, am.total_pages_memorized, am.avg_attendance,
        
        -- Finances
        fm.total_student_payments, fm.student_payments_today, fm.student_payments_week, fm.student_payments_month,
        fm.payment_transactions_today, fm.payment_transactions_week,
        fm.total_expenses, fm.expenses_today, fm.expenses_week, fm.expenses_month,
        fm.expense_transactions_today, fm.expense_transactions_week,
        fm.total_salaries, fm.salaries_today, fm.salaries_week, fm.salaries_month,
        fm.salary_transactions_today,
        fm.manual_income_today, fm.manual_expenses_today, fm.manual_income_week, fm.manual_expenses_week,
        fm.manual_transactions_today, fm.current_balance,
        
        -- Notifications
        nm.notifications_today, nm.notifications_hour, nm.unread_notifications,
        nm.urgent_notifications, nm.overdue_notifications,
        
        -- Calculs dérivés
        (fm.student_payments_today + fm.manual_income_today - fm.expenses_today - fm.salaries_today - fm.manual_expenses_today) as daily_net_flow,
        (fm.student_payments_week + fm.manual_income_week - fm.expenses_week - fm.salaries_week - fm.manual_expenses_week) as weekly_net_flow,
        
        -- Ratios et pourcentages
        CASE 
          WHEN cm.total_capacity > 0 THEN ROUND((sm.total_active_students::decimal / cm.total_capacity) * 100, 1)
          ELSE 0
        END as occupancy_rate,
        
        CASE 
          WHEN stm.active_teachers > 0 THEN ROUND(sm.total_active_students::decimal / stm.active_teachers, 1)
          ELSE 0
        END as student_teacher_ratio,
        
        CASE 
          WHEN am.total_evaluations > 0 THEN ROUND((am.excellent_evaluations::decimal / am.total_evaluations) * 100, 1)
          ELSE 0
        END as excellence_rate
        
      FROM student_metrics sm, class_metrics cm, staff_metrics stm, 
           academic_metrics am, financial_metrics fm, notification_metrics nm
    `;
    
    const result = await query(liveQuery);
    const data = result.rows[0] || {};
    
    // CALCULS SUPPLÉMENTAIRES ET FORMATAGE
    const currentBalance = parseFloat(data.current_balance) || 0;
    const dailyNetFlow = parseFloat(data.daily_net_flow) || 0;
    const weeklyNetFlow = parseFloat(data.weekly_net_flow) || 0;
    
    const totalRevenue = (parseFloat(data.total_student_payments) || 0) + (parseFloat(data.manual_income_today) || 0);
    const totalExpenses = (parseFloat(data.total_expenses) || 0) + (parseFloat(data.total_salaries) || 0) + (parseFloat(data.manual_expenses_today) || 0);
    
    // SANTÉ FINANCIÈRE
    const healthScore = Math.min(100, Math.max(0,
      (currentBalance > 0 ? 40 : 0) + 
      (weeklyNetFlow > 0 ? 30 : 0) + 
      (data.excellence_rate > 50 ? 20 : 0) + 
      (data.occupancy_rate > 60 && data.occupancy_rate < 95 ? 10 : 0)
    ));
    
    const healthLevel = healthScore >= 80 ? 'excellent' : 
                       healthScore >= 60 ? 'good' : 
                       healthScore >= 40 ? 'warning' : 'critical';

    // NIVEAU D'ACTIVITÉ
    const totalTodayActivity = (parseInt(data.students_today) || 0) + 
                              (parseInt(data.payment_transactions_today) || 0) + 
                              (parseInt(data.evaluations_today) || 0) + 
                              (parseInt(data.expense_transactions_today) || 0) + 
                              (parseInt(data.notifications_today) || 0);
    
    const activityLevel = totalTodayActivity > 20 ? 'très_active' :
                         totalTodayActivity > 10 ? 'active' :
                         totalTodayActivity > 5 ? 'modérée' : 'calme';

    const responseData = {
      success: true,
      live_metrics: {
        // AUJOURD'HUI
        today: {
          new_students: parseInt(data.students_today) || 0,
          new_payments: parseInt(data.payment_transactions_today) || 0,
          new_evaluations: parseInt(data.evaluations_today) || 0,
          new_expenses: parseInt(data.expense_transactions_today) || 0,
          new_notifications: parseInt(data.notifications_today) || 0,
          new_staff: parseInt(data.staff_today) || 0,
          new_classes: parseInt(data.classes_today) || 0,
          manual_transactions: parseInt(data.manual_transactions_today) || 0,
          
          revenue: (parseFloat(data.student_payments_today) || 0) + (parseFloat(data.manual_income_today) || 0),
          spent: (parseFloat(data.expenses_today) || 0) + (parseFloat(data.salaries_today) || 0) + (parseFloat(data.manual_expenses_today) || 0),
          net_flow: dailyNetFlow,
          
          formatted_revenue: formatGNF((parseFloat(data.student_payments_today) || 0) + (parseFloat(data.manual_income_today) || 0)),
          formatted_spent: formatGNF((parseFloat(data.expenses_today) || 0) + (parseFloat(data.salaries_today) || 0) + (parseFloat(data.manual_expenses_today) || 0)),
          formatted_net_flow: formatGNF(dailyNetFlow),
          
          activity_level: activityLevel,
          total_activities: totalTodayActivity
        },
        
        // CETTE SEMAINE
        this_week: {
          new_students: parseInt(data.students_week) || 0,
          new_payments: parseInt(data.payment_transactions_week) || 0,
          new_evaluations: parseInt(data.evaluations_week) || 0,
          new_expenses: parseInt(data.expense_transactions_week) || 0,
          new_staff: parseInt(data.staff_week) || 0,
          new_classes: parseInt(data.classes_week) || 0,
          
          revenue: (parseFloat(data.student_payments_week) || 0) + (parseFloat(data.manual_income_week) || 0),
          spent: (parseFloat(data.expenses_week) || 0) + (parseFloat(data.salaries_week) || 0) + (parseFloat(data.manual_expenses_week) || 0),
          net_flow: weeklyNetFlow,
          
          formatted_revenue: formatGNF((parseFloat(data.student_payments_week) || 0) + (parseFloat(data.manual_income_week) || 0)),
          formatted_net_flow: formatGNF(weeklyNetFlow)
        },
        
        // DERNIÈRE HEURE
        last_hour: {
          new_students: parseInt(data.students_hour) || 0,
          new_evaluations: parseInt(data.evaluations_hour) || 0,
          new_notifications: parseInt(data.notifications_hour) || 0,
          activity_level: (parseInt(data.students_hour) + parseInt(data.evaluations_hour) + parseInt(data.notifications_hour)) > 0 ? 'active' : 'quiet'
        },
        
        // TOTAUX GÉNÉRAUX
        totals: {
          active_students: parseInt(data.total_active_students) || 0,
          internal_students: parseInt(data.internal_students) || 0,
          external_students: parseInt(data.external_students) || 0,
          male_students: parseInt(data.male_students) || 0,
          female_students: parseInt(data.female_students) || 0,
          orphan_students: parseInt(data.orphan_students) || 0,
          
          active_classes: parseInt(data.active_classes) || 0,
          coranic_classes: parseInt(data.coranic_classes) || 0,
          french_classes: parseInt(data.french_classes) || 0,
          total_capacity: parseInt(data.total_capacity) || 0,
          
          active_staff: parseInt(data.active_staff) || 0,
          active_teachers: parseInt(data.active_teachers) || 0,
          admin_staff: parseInt(data.admin_staff) || 0,
          
          total_evaluations: parseInt(data.total_evaluations) || 0,
          total_pages_memorized: parseInt(data.total_pages_memorized) || 0
        },
        
        // FINANCES GLOBALES (INTÉGRATION FINANCE.JS)
        financial_overview: {
          current_balance: currentBalance,
          formatted_balance: formatGNF(currentBalance),
          
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          formatted_total_revenue: formatGNF(totalRevenue),
          formatted_total_expenses: formatGNF(totalExpenses),
          
          student_payments: {
            total: parseFloat(data.total_student_payments) || 0,
            today: parseFloat(data.student_payments_today) || 0,
            week: parseFloat(data.student_payments_week) || 0,
            month: parseFloat(data.student_payments_month) || 0,
            formatted_total: formatGNF(data.total_student_payments),
            formatted_today: formatGNF(data.student_payments_today),
            formatted_week: formatGNF(data.student_payments_week),
            formatted_month: formatGNF(data.student_payments_month)
          },
          
          general_expenses: {
            total: parseFloat(data.total_expenses) || 0,
            today: parseFloat(data.expenses_today) || 0,
            week: parseFloat(data.expenses_week) || 0,
            month: parseFloat(data.expenses_month) || 0,
            formatted_total: formatGNF(data.total_expenses),
            formatted_today: formatGNF(data.expenses_today),
            formatted_week: formatGNF(data.expenses_week),
            formatted_month: formatGNF(data.expenses_month)
          },
          
          staff_salaries: {
            total: parseFloat(data.total_salaries) || 0,
            today: parseFloat(data.salaries_today) || 0,
            week: parseFloat(data.salaries_week) || 0,
            month: parseFloat(data.salaries_month) || 0,
            formatted_total: formatGNF(data.total_salaries),
            formatted_today: formatGNF(data.salaries_today),
            formatted_week: formatGNF(data.salaries_week),
            formatted_month: formatGNF(data.salaries_month)
          },
          
          manual_transactions: {
            income_today: parseFloat(data.manual_income_today) || 0,
            expenses_today: parseFloat(data.manual_expenses_today) || 0,
            income_week: parseFloat(data.manual_income_week) || 0,
            expenses_week: parseFloat(data.manual_expenses_week) || 0,
            transactions_today: parseInt(data.manual_transactions_today) || 0,
            formatted_income_today: formatGNF(data.manual_income_today),
            formatted_expenses_today: formatGNF(data.manual_expenses_today),
            formatted_income_week: formatGNF(data.manual_income_week),
            formatted_expenses_week: formatGNF(data.manual_expenses_week)
          }
        },
        
        // MÉTRIQUES ACADÉMIQUES
        academic_performance: {
          avg_grade: Math.round((parseFloat(data.avg_overall_grade) || 0) * 100) / 100,
          excellence_rate: parseFloat(data.excellence_rate) || 0,
          excellent_count: parseInt(data.excellent_evaluations) || 0,
          good_count: parseInt(data.good_evaluations) || 0,
          poor_count: parseInt(data.poor_evaluations) || 0,
          avg_attendance: Math.round(parseFloat(data.avg_attendance) || 0)
        },
        
        // RATIOS ET INDICATEURS
        key_ratios: {
          occupancy_rate: parseFloat(data.occupancy_rate) || 0,
          student_teacher_ratio: parseFloat(data.student_teacher_ratio) || 0,
          male_percentage: data.total_active_students > 0 ? Math.round((data.male_students / data.total_active_students) * 100) : 0,
          female_percentage: data.total_active_students > 0 ? Math.round((data.female_students / data.total_active_students) * 100) : 0,
          orphan_percentage: data.total_active_students > 0 ? Math.round((data.orphan_students / data.total_active_students) * 100) : 0,
          internal_percentage: data.total_active_students > 0 ? Math.round((data.internal_students / data.total_active_students) * 100) : 0
        },
        
        // NOTIFICATIONS ET ALERTES
        notifications: {
          unread: parseInt(data.unread_notifications) || 0,
          urgent: parseInt(data.urgent_notifications) || 0,
          overdue: parseInt(data.overdue_notifications) || 0,
          today: parseInt(data.notifications_today) || 0,
          hour: parseInt(data.notifications_hour) || 0
        },
        
        // SANTÉ DU SYSTÈME
        system_health: {
          score: Math.round(healthScore),
          level: healthLevel,
          financial_health: currentBalance > 0 ? 'positive' : 'negative',
          academic_performance: data.excellence_rate > 60 ? 'excellent' : data.excellence_rate > 40 ? 'good' : 'needs_improvement',
          capacity_utilization: data.occupancy_rate > 80 ? 'high' : data.occupancy_rate > 60 ? 'optimal' : 'low'
        },
        
        timestamp: new Date().toISOString()
      },
      served_from_cache: false
    };

    setCache(liveCache, cacheKey, responseData);
    
    console.log('✅ Métriques temps réel générées avec toutes les données financières:');
    console.log(`📊 ${responseData.live_metrics.totals.active_students} étudiants actifs`);
    console.log(`🏛️ ${responseData.live_metrics.totals.active_classes} classes actives`);
    console.log(`👥 ${responseData.live_metrics.totals.active_staff} membres du personnel`);
    console.log(`💰 Capital: ${responseData.live_metrics.financial_overview.formatted_balance}`);
    console.log(`📈 Flux quotidien: ${responseData.live_metrics.today.formatted_net_flow}`);
    console.log(`📈 Santé système: ${responseData.live_metrics.system_health.score}/100`);
    
    res.json(responseData);

  } catch (error) {
    console.error('💥 Erreur Live Metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des métriques temps réel',
      live_metrics: {
        today: { new_students: 0, new_payments: 0, new_evaluations: 0, revenue: 0, formatted_revenue: '0 FG' },
        this_week: { new_students: 0, new_payments: 0, new_evaluations: 0, formatted_revenue: '0 FG' },
        last_hour: { new_students: 0, new_payments: 0, activity_level: 'quiet' },
        system_health: { score: 0, level: 'critical' },
        financial_overview: {
          current_balance: 0,
          formatted_balance: '0 FG',
          student_payments: { total: 0, formatted_total: '0 FG' },
          general_expenses: { total: 0, formatted_total: '0 FG' },
          staff_salaries: { total: 0, formatted_total: '0 FG' }
        }
      }
    });
  }
});

module.exports = router;