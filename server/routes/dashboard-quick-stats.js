// server/routes/dashboard-quick-stats.js - STATISTIQUES RAPIDES AVEC FINANCE
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  quickCache, 
  CACHE_DURATION_QUICK,
  getFromCache, 
  setCache, 
  formatGNF 
} = require('./dashboard-core');

const router = express.Router();

console.log('⚡ === DASHBOARD QUICK STATS - STATISTIQUES RAPIDES AVEC FINANCE ===');

// === ROUTE RAPIDE : STATISTIQUES ESSENTIELLES AVEC FINANCE ===
router.get('/quick-stats', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `quick_stats_${req.user.id}`;
    const cached = getFromCache(quickCache, cacheKey, CACHE_DURATION_QUICK);
    
    if (cached) {
      console.log('⚡ Quick stats depuis le cache');
      return res.json({ ...cached, served_from_cache: true });
    }

    console.log('⚡ Quick stats - Calcul rapide avec finance...');
    
    const quickQuery = `
      WITH quick_counts AS (
        SELECT 
          -- Compteurs de base
          (SELECT COUNT(*) FROM students WHERE deleted = false OR deleted IS NULL) as students,
          (SELECT COUNT(*) FROM classes WHERE is_active = true OR is_active IS NULL) as classes,
          (SELECT COUNT(*) FROM staff WHERE status = 'active') as staff,
          (SELECT COUNT(*) FROM student_academic_progress WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_evaluations,
          
          -- Revenus totaux (paiements étudiants + transactions manuelles revenus)
          (SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE is_cancelled = false) as student_payments_total,
          (SELECT COALESCE(SUM(amount), 0) FROM manual_financial_transactions 
           WHERE type = 'INCOME' AND impact_capital = true) as manual_income_total,
          
          -- Dépenses totales (dépenses générales + salaires + transactions manuelles dépenses)
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE paid_date IS NOT NULL) as expenses_total,
          (SELECT COALESCE(SUM(amount), 0) FROM salary_payments_v2 WHERE status = 'completed') as salaries_total,
          (SELECT COALESCE(SUM(amount), 0) FROM manual_financial_transactions 
           WHERE type = 'EXPENSE' AND impact_capital = true) as manual_expenses_total,
          
          -- Revenus et dépenses du mois
          (SELECT COALESCE(SUM(amount), 0) FROM student_payments 
           WHERE is_cancelled = false AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as student_payments_month,
          (SELECT COALESCE(SUM(amount), 0) FROM expenses 
           WHERE paid_date IS NOT NULL AND expense_date >= DATE_TRUNC('month', CURRENT_DATE)) as expenses_month,
          (SELECT COALESCE(SUM(amount), 0) FROM salary_payments_v2 
           WHERE status = 'completed' AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as salaries_month,
          (SELECT COALESCE(SUM(amount), 0) FROM manual_financial_transactions 
           WHERE type = 'INCOME' AND impact_capital = true 
           AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as manual_income_month,
          (SELECT COALESCE(SUM(amount), 0) FROM manual_financial_transactions 
           WHERE type = 'EXPENSE' AND impact_capital = true 
           AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)) as manual_expenses_month,
          
          -- Nouveaux éléments cette semaine
          (SELECT COUNT(*) FROM students WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_students_week,
          (SELECT COUNT(*) FROM student_payments 
           WHERE is_cancelled = false AND payment_date >= CURRENT_DATE - INTERVAL '7 days') as new_payments_week,
          
          -- Notifications non lues
          (SELECT COUNT(*) FROM notifications WHERE is_read = false AND is_active = true) as unread_notifications
      )
      SELECT 
        students, classes, staff, recent_evaluations,
        student_payments_total, manual_income_total, expenses_total, salaries_total, manual_expenses_total,
        student_payments_month, expenses_month, salaries_month, manual_income_month, manual_expenses_month,
        new_students_week, new_payments_week, unread_notifications,
        
        -- Calcul du capital total
        (student_payments_total + manual_income_total - expenses_total - salaries_total - manual_expenses_total) as current_balance,
        
        -- Calcul du flux mensuel
        (student_payments_month + manual_income_month - expenses_month - salaries_month - manual_expenses_month) as monthly_flow,
        
        -- Total revenus et dépenses
        (student_payments_total + manual_income_total) as total_income,
        (expenses_total + salaries_total + manual_expenses_total) as total_expenses
        
      FROM quick_counts
    `;

    const result = await query(quickQuery);
    const data = result.rows[0] || {};
    
    const currentBalance = parseFloat(data.current_balance) || 0;
    const monthlyFlow = parseFloat(data.monthly_flow) || 0;
    const totalIncome = parseFloat(data.total_income) || 0;
    const totalExpenses = parseFloat(data.total_expenses) || 0;
    
    // Score de santé financière
    const healthScore = Math.min(100, Math.max(0,
      (currentBalance > 0 ? 40 : 0) + 
      (monthlyFlow > 0 ? 30 : 0) + 
      (currentBalance > 1000000 ? 20 : currentBalance > 500000 ? 15 : 10) + 
      (monthlyFlow > 500000 ? 10 : monthlyFlow > 0 ? 5 : 0)
    ));
    
    // Niveau de santé
    const healthLevel = healthScore >= 80 ? 'excellent' : 
                       healthScore >= 60 ? 'good' : 
                       healthScore >= 40 ? 'warning' : 'critical';
    
    // Alertes de base
    const alertsCount = (currentBalance < 0 ? 1 : 0) + 
                       (monthlyFlow < -1000000 ? 1 : 0) + 
                       (parseInt(data.unread_notifications) > 10 ? 1 : 0);
    
    const responseData = {
      success: true,
      quick_stats: {
        // Compteurs principaux
        students: parseInt(data.students) || 0,
        classes: parseInt(data.classes) || 0,
        staff: parseInt(data.staff) || 0,
        recent_evaluations: parseInt(data.recent_evaluations) || 0,
        
        // Nouveautés de la semaine
        new_students_week: parseInt(data.new_students_week) || 0,
        new_payments_week: parseInt(data.new_payments_week) || 0,
        
        // Finances détaillées
        financial: {
          // Capital et flux
          balance: currentBalance,
          formatted_balance: formatGNF(currentBalance),
          monthly_flow: monthlyFlow,
          formatted_monthly_flow: formatGNF(monthlyFlow),
          
          // Revenus détaillés
          income: {
            total: totalIncome,
            student_payments: parseFloat(data.student_payments_total) || 0,
            manual_income: parseFloat(data.manual_income_total) || 0,
            monthly_student_payments: parseFloat(data.student_payments_month) || 0,
            monthly_manual_income: parseFloat(data.manual_income_month) || 0,
            formatted_total: formatGNF(totalIncome),
            formatted_student_payments: formatGNF(data.student_payments_total),
            formatted_manual_income: formatGNF(data.manual_income_total),
            formatted_monthly_total: formatGNF((parseFloat(data.student_payments_month) || 0) + (parseFloat(data.manual_income_month) || 0))
          },
          
          // Dépenses détaillées
          expenses: {
            total: totalExpenses,
            general_expenses: parseFloat(data.expenses_total) || 0,
            staff_salaries: parseFloat(data.salaries_total) || 0,
            manual_expenses: parseFloat(data.manual_expenses_total) || 0,
            monthly_general: parseFloat(data.expenses_month) || 0,
            monthly_salaries: parseFloat(data.salaries_month) || 0,
            monthly_manual: parseFloat(data.manual_expenses_month) || 0,
            formatted_total: formatGNF(totalExpenses),
            formatted_general: formatGNF(data.expenses_total),
            formatted_salaries: formatGNF(data.salaries_total),
            formatted_manual: formatGNF(data.manual_expenses_total),
            formatted_monthly_total: formatGNF((parseFloat(data.expenses_month) || 0) + (parseFloat(data.salaries_month) || 0) + (parseFloat(data.manual_expenses_month) || 0))
          },
          
          // Santé financière
          health_score: Math.round(healthScore),
          health_level: healthLevel,
          financial_health: currentBalance > 0 ? 'positive' : 'negative',
          flow_trend: monthlyFlow > 0 ? 'positive' : monthlyFlow < 0 ? 'negative' : 'stable'
        },
        
        // Notifications
        notifications: {
          unread: parseInt(data.unread_notifications) || 0,
          has_urgent: parseInt(data.unread_notifications) > 10
        },
        
        // Alertes et indicateurs
        alerts_count: alertsCount,
        has_critical_alerts: currentBalance < 0 || monthlyFlow < -1000000,
        
        // Ratios rapides
        ratios: {
          students_per_class: parseInt(data.classes) > 0 ? Math.round((parseInt(data.students) || 0) / parseInt(data.classes)) : 0,
          students_per_staff: parseInt(data.staff) > 0 ? Math.round((parseInt(data.students) || 0) / parseInt(data.staff)) : 0,
          income_expense_ratio: totalExpenses > 0 ? Math.round((totalIncome / totalExpenses) * 100) / 100 : 0
        },
        
        // Métadonnées
        last_updated: new Date().toISOString(),
        cache_info: {
          served_from_cache: false,
          cache_duration_seconds: CACHE_DURATION_QUICK / 1000
        }
      },
      served_from_cache: false
    };

    setCache(quickCache, cacheKey, responseData);
    
    console.log(`⚡ Quick stats générées:`);
    console.log(`├─ 📊 ${responseData.quick_stats.students} étudiants, ${responseData.quick_stats.classes} classes`);
    console.log(`├─ 💰 Capital: ${responseData.quick_stats.financial.formatted_balance}`);
    console.log(`├─ 📈 Flux mensuel: ${responseData.quick_stats.financial.formatted_monthly_flow}`);
    console.log(`└─ 🏥 Santé: ${responseData.quick_stats.financial.health_score}/100 (${responseData.quick_stats.financial.health_level})`);
    
    res.json(responseData);

  } catch (error) {
    console.error('💥 Erreur Quick Stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques rapides',
      quick_stats: {
        students: 0, 
        classes: 0, 
        staff: 0, 
        recent_evaluations: 0,
        new_students_week: 0,
        new_payments_week: 0,
        financial: { 
          balance: 0, 
          formatted_balance: '0 FG', 
          health_score: 0,
          health_level: 'critical',
          income: { total: 0, formatted_total: '0 FG' },
          expenses: { total: 0, formatted_total: '0 FG' }
        },
        notifications: { unread: 0, has_urgent: false },
        alerts_count: 1,
        has_critical_alerts: true,
        ratios: { students_per_class: 0, students_per_staff: 0, income_expense_ratio: 0 }
      }
    });
  }
});

// === ROUTE : MÉTRIQUES ULTRA-RAPIDES (pour widgets) ===
router.get('/widget-stats', authenticateToken, async (req, res) => {
  try {
    const widgetQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE deleted = false OR deleted IS NULL) as students,
        (SELECT COUNT(*) FROM classes WHERE is_active = true OR is_active IS NULL) as classes,
        (SELECT COUNT(*) FROM staff WHERE status = 'active') as staff,
        
        -- Capital unifié (intégration finance.js)
        (SELECT COALESCE(
          (SELECT SUM(amount) FROM student_payments WHERE is_cancelled = false) + 
          (SELECT SUM(amount) FROM manual_financial_transactions WHERE type = 'INCOME' AND impact_capital = true) -
          (SELECT SUM(amount) FROM expenses WHERE paid_date IS NOT NULL) -
          (SELECT SUM(amount) FROM salary_payments_v2 WHERE status = 'completed') -
          (SELECT SUM(amount) FROM manual_financial_transactions WHERE type = 'EXPENSE' AND impact_capital = true), 0
        )) as balance,
        
        -- Flux du jour
        (SELECT COALESCE(
          (SELECT SUM(amount) FROM student_payments 
           WHERE is_cancelled = false AND payment_date >= CURRENT_DATE) +
          (SELECT SUM(amount) FROM manual_financial_transactions 
           WHERE type = 'INCOME' AND impact_capital = true AND transaction_date >= CURRENT_DATE) -
          (SELECT SUM(amount) FROM expenses 
           WHERE paid_date IS NOT NULL AND expense_date >= CURRENT_DATE) -
          (SELECT SUM(amount) FROM salary_payments_v2 
           WHERE status = 'completed' AND payment_date >= CURRENT_DATE) -
          (SELECT SUM(amount) FROM manual_financial_transactions 
           WHERE type = 'EXPENSE' AND impact_capital = true AND transaction_date >= CURRENT_DATE), 0
        )) as daily_flow,
        
        -- Activité du jour
        (SELECT COUNT(*) FROM student_payments 
         WHERE is_cancelled = false AND payment_date >= CURRENT_DATE) as payments_today,
        (SELECT COUNT(*) FROM student_academic_progress 
         WHERE created_at >= CURRENT_DATE) as evaluations_today
    `;

    const result = await query(widgetQuery);
    const data = result.rows[0] || {};
    
    const balance = parseFloat(data.balance) || 0;
    const dailyFlow = parseFloat(data.daily_flow) || 0;
    
    res.json({
      success: true,
      widget_stats: {
        students: parseInt(data.students) || 0,
        classes: parseInt(data.classes) || 0,
        staff: parseInt(data.staff) || 0,
        balance: balance,
        formatted_balance: formatGNF(balance),
        daily_flow: dailyFlow,
        formatted_daily_flow: formatGNF(dailyFlow),
        payments_today: parseInt(data.payments_today) || 0,
        evaluations_today: parseInt(data.evaluations_today) || 0,
        health_indicator: balance > 0 ? 'positive' : 'negative',
        activity_level: (parseInt(data.payments_today) + parseInt(data.evaluations_today)) > 5 ? 'active' : 'quiet'
      }
    });

  } catch (error) {
    console.error('💥 Erreur Widget Stats:', error);
    res.json({
      success: true,
      widget_stats: { 
        students: 0, 
        classes: 0, 
        staff: 0,
        balance: 0, 
        formatted_balance: '0 FG',
        daily_flow: 0,
        formatted_daily_flow: '0 FG',
        payments_today: 0,
        evaluations_today: 0,
        health_indicator: 'negative',
        activity_level: 'quiet'
      }
    });
  }
});

console.log('✅ Dashboard Quick Stats avec Finance - Chargé');
console.log('⚡ Fonctionnalités:');
console.log('   📊 Statistiques rapides avec finance complète');
console.log('   💰 Capital unifié (étudiants + manuels - dépenses - salaires)');
console.log('   📈 Flux financiers mensuels et quotidiens');
console.log('   🏥 Score de santé financière');
console.log('   🚨 Alertes automatiques');
console.log('   📱 Widgets ultra-rapides');
console.log('   🔄 Cache intelligent');

module.exports = router;