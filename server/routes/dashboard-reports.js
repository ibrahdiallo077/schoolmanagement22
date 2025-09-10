// server/routes/dashboard-reports.js - GÉNÉRATION DE RAPPORTS
const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { formatGNF } = require('./dashboard-core');

const router = express.Router();

console.log('📋 === DASHBOARD REPORTS - GÉNÉRATION DE RAPPORTS ===');

// === RAPPORT MENSUEL COMPLET ===
router.get('/monthly-report', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    console.log(`📋 Génération rapport mensuel: ${currentMonth}/${currentYear}`);

    const monthlyReport = await transaction(async (client) => {
      const reportQuery = `
        WITH report_period AS (
          SELECT 
            DATE_TRUNC('month', DATE '${currentYear}-${currentMonth}-01') as month_start,
            DATE_TRUNC('month', DATE '${currentYear}-${currentMonth}-01') + INTERVAL '1 month' - INTERVAL '1 day' as month_end
        ),
        
        -- Étudiants du mois
        student_metrics AS (
          SELECT 
            COUNT(*) FILTER (WHERE s.created_at >= rp.month_start AND s.created_at <= rp.month_end) as new_students,
            COUNT(*) FILTER (WHERE (s.deleted = false OR s.deleted IS NULL)) as total_active_students,
            COUNT(*) FILTER (WHERE s.gender = 'M' AND (s.deleted = false OR s.deleted IS NULL)) as male_students,
            COUNT(*) FILTER (WHERE s.gender = 'F' AND (s.deleted = false OR s.deleted IS NULL)) as female_students,
            AVG(s.age) FILTER (WHERE s.age IS NOT NULL AND (s.deleted = false OR s.deleted IS NULL)) as avg_age
          FROM students s, report_period rp
        ),
        
        -- Finances du mois
        financial_metrics AS (
          SELECT 
            COALESCE(SUM(sp.amount), 0) as student_payments,
            COUNT(sp.id) as payment_transactions,
            COALESCE(SUM(e.amount), 0) as general_expenses,
            COUNT(e.id) as expense_transactions,
            COALESCE(SUM(sal.amount), 0) as staff_salaries,
            COUNT(sal.id) as salary_transactions
          FROM report_period rp
          LEFT JOIN student_payments sp ON sp.payment_date >= rp.month_start 
            AND sp.payment_date <= rp.month_end AND sp.is_cancelled = false
          LEFT JOIN expenses e ON e.paid_date >= rp.month_start 
            AND e.paid_date <= rp.month_end
          LEFT JOIN salary_payments_v2 sal ON sal.payment_date >= rp.month_start 
            AND sal.payment_date <= rp.month_end AND sal.status = 'completed'
        ),
        
        -- Académique du mois
        academic_metrics AS (
          SELECT 
            COUNT(sap.id) as total_evaluations,
            AVG(sap.overall_grade) FILTER (WHERE sap.overall_grade IS NOT NULL) as avg_grade,
            COUNT(*) FILTER (WHERE sap.overall_grade >= 16) as excellent_evaluations,
            COUNT(*) FILTER (WHERE sap.overall_grade >= 14 AND sap.overall_grade < 16) as good_evaluations,
            COUNT(*) FILTER (WHERE sap.overall_grade < 10) as poor_evaluations,
            SUM(sap.pages_memorized) FILTER (WHERE sap.pages_memorized IS NOT NULL) as pages_memorized,
            AVG(sap.attendance_rate) FILTER (WHERE sap.attendance_rate IS NOT NULL) as avg_attendance
          FROM student_academic_progress sap, report_period rp
          LEFT JOIN students s ON sap.student_id = s.id
          WHERE sap.evaluation_date >= rp.month_start 
            AND sap.evaluation_date <= rp.month_end
            AND (s.deleted = false OR s.deleted IS NULL)
        ),
        
        -- Classes et personnel
        operational_metrics AS (
          SELECT 
            (SELECT COUNT(*) FROM classes WHERE is_active = true OR is_active IS NULL) as active_classes,
            (SELECT COUNT(*) FROM staff WHERE status = 'active') as active_staff,
            (SELECT COUNT(*) FROM staff WHERE position = 'teacher' AND status = 'active') as active_teachers,
            (SELECT SUM(capacity) FROM classes WHERE is_active = true OR is_active IS NULL) as total_capacity
        )
        
        SELECT 
          sm.new_students, sm.total_active_students, sm.male_students, sm.female_students, sm.avg_age,
          fm.student_payments, fm.payment_transactions, fm.general_expenses, fm.expense_transactions,
          fm.staff_salaries, fm.salary_transactions,
          am.total_evaluations, am.avg_grade, am.excellent_evaluations, am.good_evaluations, am.poor_evaluations,
          am.pages_memorized, am.avg_attendance,
          om.active_classes, om.active_staff, om.active_teachers, om.total_capacity,
          (fm.student_payments - fm.general_expenses - fm.staff_salaries) as net_financial_flow
        FROM student_metrics sm, financial_metrics fm, academic_metrics am, operational_metrics om
      `;

      const result = await client.query(reportQuery);
      const data = result.rows[0] || {};
      
      // Calculs supplémentaires
      const occupancyRate = Math.round(((parseInt(data.total_active_students) || 0) / Math.max(parseInt(data.total_capacity) || 1, 1)) * 100);
      const excellentRate = Math.round(((parseInt(data.excellent_evaluations) || 0) / Math.max(parseInt(data.total_evaluations) || 1, 1)) * 100);
      const studentTeacherRatio = Math.round((parseInt(data.total_active_students) || 0) / Math.max(parseInt(data.active_teachers) || 1, 1));
      
      return {
        period: {
          month: parseInt(currentMonth),
          year: parseInt(currentYear),
          month_name: new Date(currentYear, currentMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        },
        
        student_summary: {
          new_this_month: parseInt(data.new_students) || 0,
          total_active: parseInt(data.total_active_students) || 0,
          male_count: parseInt(data.male_students) || 0,
          female_count: parseInt(data.female_students) || 0,
          male_percentage: Math.round(((parseInt(data.male_students) || 0) / Math.max(parseInt(data.total_active_students) || 1, 1)) * 100),
          female_percentage: Math.round(((parseInt(data.female_students) || 0) / Math.max(parseInt(data.total_active_students) || 1, 1)) * 100),
          average_age: Math.round(parseFloat(data.avg_age) || 0)
        },
        
        financial_summary: {
          total_income: parseFloat(data.student_payments) || 0,
          total_expenses: parseFloat(data.general_expenses) || 0,
          total_salaries: parseFloat(data.staff_salaries) || 0,
          net_flow: parseFloat(data.net_financial_flow) || 0,
          formatted_income: formatGNF(data.student_payments),
          formatted_expenses: formatGNF(data.general_expenses),
          formatted_salaries: formatGNF(data.staff_salaries),
          formatted_net_flow: formatGNF(data.net_financial_flow),
          payment_transactions: parseInt(data.payment_transactions) || 0,
          expense_transactions: parseInt(data.expense_transactions) || 0,
          salary_transactions: parseInt(data.salary_transactions) || 0
        },
        
        academic_summary: {
          total_evaluations: parseInt(data.total_evaluations) || 0,
          average_grade: Math.round((parseFloat(data.avg_grade) || 0) * 100) / 100,
          excellent_count: parseInt(data.excellent_evaluations) || 0,
          good_count: parseInt(data.good_evaluations) || 0,
          poor_count: parseInt(data.poor_evaluations) || 0,
          excellent_rate: excellentRate,
          pages_memorized: parseInt(data.pages_memorized) || 0,
          average_attendance: Math.round(parseFloat(data.avg_attendance) || 0)
        },
        
        operational_summary: {
          active_classes: parseInt(data.active_classes) || 0,
          active_staff: parseInt(data.active_staff) || 0,
          active_teachers: parseInt(data.active_teachers) || 0,
          total_capacity: parseInt(data.total_capacity) || 0,
          occupancy_rate: occupancyRate,
          student_teacher_ratio: studentTeacherRatio
        },
        
        key_indicators: {
          financial_health: parseFloat(data.net_financial_flow) > 0 ? 'positive' : 'negative',
          academic_performance: excellentRate > 50 ? 'excellent' : excellentRate > 30 ? 'good' : 'needs_improvement',
          capacity_utilization: occupancyRate > 80 ? 'high' : occupancyRate > 60 ? 'optimal' : 'low',
          overall_score: Math.round(
            (parseFloat(data.net_financial_flow) > 0 ? 30 : 10) +
            (excellentRate > 50 ? 25 : excellentRate > 30 ? 20 : 10) +
            (occupancyRate > 60 ? 25 : 15) +
            (studentTeacherRatio < 25 ? 20 : 10)
          )
        }
      };
    });

    console.log(`✅ Rapport mensuel généré: ${monthlyReport.period.month_name}`);
    console.log(`📊 ${monthlyReport.student_summary.total_active} étudiants, ${monthlyReport.financial_summary.formatted_net_flow} de flux net`);

    res.json({
      success: true,
      monthly_report: monthlyReport,
      generated_at: new Date().toISOString(),
      report_type: 'monthly_comprehensive'
    });

  } catch (error) {
    console.error('💥 Erreur rapport mensuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport mensuel',
      details: error.message
    });
  }
});

// === RAPPORT ACADÉMIQUE DÉTAILLÉ ===
router.get('/academic-report', authenticateToken, async (req, res) => {
  try {
    const { class_id, period = '30days' } = req.query;
    
    let dateFilter = '';
    switch(period) {
      case '7days':
        dateFilter = "AND sap.evaluation_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30days':
        dateFilter = "AND sap.evaluation_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case '3months':
        dateFilter = "AND sap.evaluation_date >= CURRENT_DATE - INTERVAL '3 months'";
        break;
      default:
        dateFilter = "AND sap.evaluation_date >= CURRENT_DATE - INTERVAL '30 days'";
    }
    
    let classFilter = '';
    let classParams = [];
    if (class_id && class_id !== 'all') {
      classFilter = 'AND s.coranic_class_id = $1';
      classParams = [class_id];
    }

    const academicQuery = `
      SELECT 
        s.id as student_id,
        s.student_number,
        s.first_name || ' ' || s.last_name as student_name,
        s.age,
        s.gender,
        c.name as class_name,
        COUNT(sap.id) as evaluation_count,
        AVG(sap.overall_grade) as avg_overall_grade,
        AVG(sap.memorization_grade) as avg_memorization,
        AVG(sap.recitation_grade) as avg_recitation,
        AVG(sap.tajwid_grade) as avg_tajwid,
        AVG(sap.behavior_grade) as avg_behavior,
        AVG(sap.attendance_rate) as avg_attendance,
        SUM(sap.pages_memorized) as total_pages_memorized,
        MAX(sap.evaluation_date) as last_evaluation_date,
        STRING_AGG(DISTINCT sap.current_sourate, ', ' ORDER BY sap.current_sourate) as sourates_studied,
        CASE 
          WHEN AVG(sap.overall_grade) >= 16 THEN 'Excellent'
          WHEN AVG(sap.overall_grade) >= 14 THEN 'Bien' 
          WHEN AVG(sap.overall_grade) >= 12 THEN 'Assez bien'
          WHEN AVG(sap.overall_grade) >= 10 THEN 'Passable'
          ELSE 'Insuffisant'
        END as performance_level
      FROM students s
      LEFT JOIN student_academic_progress sap ON s.id = sap.student_id
      LEFT JOIN classes c ON s.coranic_class_id = c.id
      WHERE (s.deleted = false OR s.deleted IS NULL) 
        ${dateFilter} 
        ${classFilter}
      GROUP BY s.id, s.student_number, s.first_name, s.last_name, s.age, s.gender, c.name
      HAVING COUNT(sap.id) > 0
      ORDER BY AVG(sap.overall_grade) DESC, s.first_name
    `;

    const result = await query(academicQuery, classParams);
    
    // Statistiques globales
    const globalStats = {
      total_students_evaluated: result.rows.length,
      overall_average: result.rows.length > 0 ? 
        result.rows.reduce((sum, row) => sum + (parseFloat(row.avg_overall_grade) || 0), 0) / result.rows.length : 0,
      performance_distribution: {
        excellent: result.rows.filter(row => row.performance_level === 'Excellent').length,
        good: result.rows.filter(row => row.performance_level === 'Bien').length,
        average: result.rows.filter(row => row.performance_level === 'Assez bien').length,
        passable: result.rows.filter(row => row.performance_level === 'Passable').length,
        insufficient: result.rows.filter(row => row.performance_level === 'Insuffisant').length
      },
      total_pages_memorized: result.rows.reduce((sum, row) => sum + (parseInt(row.total_pages_memorized) || 0), 0),
      average_attendance: result.rows.length > 0 ?
        result.rows.reduce((sum, row) => sum + (parseFloat(row.avg_attendance) || 0), 0) / result.rows.length : 0
    };

    res.json({
      success: true,
      academic_report: {
        period: period,
        class_filter: class_id || 'all',
        student_details: result.rows.map(student => ({
          ...student,
          avg_overall_grade: Math.round((parseFloat(student.avg_overall_grade) || 0) * 100) / 100,
          avg_memorization: Math.round((parseFloat(student.avg_memorization) || 0) * 100) / 100,
          avg_recitation: Math.round((parseFloat(student.avg_recitation) || 0) * 100) / 100,
          avg_tajwid: Math.round((parseFloat(student.avg_tajwid) || 0) * 100) / 100,
          avg_behavior: Math.round((parseFloat(student.avg_behavior) || 0) * 100) / 100,
          avg_attendance: Math.round(parseFloat(student.avg_attendance) || 0),
          total_pages_memorized: parseInt(student.total_pages_memorized) || 0,
          evaluation_count: parseInt(student.evaluation_count) || 0,
          last_evaluation_formatted: student.last_evaluation_date ? 
            new Date(student.last_evaluation_date).toLocaleDateString('fr-FR') : 'N/A'
        })),
        global_statistics: {
          ...globalStats,
          overall_average: Math.round(globalStats.overall_average * 100) / 100,
          average_attendance: Math.round(globalStats.average_attendance)
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erreur rapport académique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport académique',
      details: error.message
    });
  }
});

// === EXPORT PDF DATA (prêt pour génération PDF côté client) ===
router.get('/export-data', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { type = 'monthly', format = 'json' } = req.query;
    
    console.log(`📄 Export de données: ${type} en format ${format}`);
    
    // Selon le type, récupérer les données appropriées
    let exportData = {};
    
    if (type === 'monthly') {
      // Réutiliser la logique du rapport mensuel mais avec plus de détails
      exportData = {
        report_type: 'monthly_detailed',
        school_info: {
          name: 'École Coranique',
          generated_by: req.user.username,
          generated_at: new Date().toISOString(),
          period: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        },
        // Données simplifiées pour export
        summary_metrics: {
          students: '...',
          finances: '...',
          academic: '...'
          // Les données détaillées seront récupérées via les autres endpoints
        }
      };
    }
    
    res.json({
      success: true,
      export_data: exportData,
      export_info: {
        type: type,
        format: format,
        size_kb: Math.round(JSON.stringify(exportData).length / 1024),
        generated_at: new Date().toISOString(),
        filename_suggestion: `rapport_${type}_${new Date().toISOString().split('T')[0]}.${format}`
      }
    });

  } catch (error) {
    console.error('💥 Erreur export données:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des données',
      details: error.message
    });
  }
});

module.exports = router;