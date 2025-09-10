// server/routes/dashboard-charts.js - DONNÉES POUR GRAPHIQUES
const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { formatGNF } = require('./dashboard-core');

const router = express.Router();

console.log('📊 === DASHBOARD CHARTS - DONNÉES POUR GRAPHIQUES ===');

// === GRAPHIQUE : ÉVOLUTION DES INSCRIPTIONS ===
router.get('/enrollment-trends', authenticateToken, async (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    let interval, dateFormat, periodFilter;
    switch(period) {
      case '24hours':
        interval = '1 hour';
        dateFormat = 'HH24:MI';
        periodFilter = "CURRENT_TIMESTAMP - INTERVAL '24 hours'";
        break;
      case '7days':
        interval = '1 day';
        dateFormat = 'DD/MM';
        periodFilter = "CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30days':
        interval = '1 day';
        dateFormat = 'DD/MM';
        periodFilter = "CURRENT_DATE - INTERVAL '30 days'";
        break;
      case '6months':
      default:
        interval = '1 month';
        dateFormat = 'MM/YYYY';
        periodFilter = "CURRENT_DATE - INTERVAL '6 months'";
        break;
    }

    const enrollmentQuery = `
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('${interval.split(' ')[1]}', ${periodFilter}),
          DATE_TRUNC('${interval.split(' ')[1]}', CURRENT_TIMESTAMP),
          INTERVAL '${interval}'
        ) as period_start
      ),
      enrollment_data AS (
        SELECT 
          ds.period_start,
          COUNT(s.id) as new_students,
          COUNT(s.id) FILTER (WHERE s.gender = 'M') as male_students,
          COUNT(s.id) FILTER (WHERE s.gender = 'F') as female_students
        FROM date_series ds
        LEFT JOIN students s ON DATE_TRUNC('${interval.split(' ')[1]}', s.created_at) = ds.period_start
          AND (s.deleted = false OR s.deleted IS NULL)
        GROUP BY ds.period_start
        ORDER BY ds.period_start
      )
      SELECT 
        TO_CHAR(period_start, '${dateFormat}') as period_label,
        new_students,
        male_students,
        female_students,
        period_start
      FROM enrollment_data
    `;
    
    const result = await query(enrollmentQuery);
    
    res.json({
      success: true,
      enrollment_trends: {
        period: period,
        data: result.rows,
        chart_config: {
          labels: result.rows.map(row => row.period_label),
          datasets: [
            {
              label: 'Total nouveaux étudiants',
              data: result.rows.map(row => parseInt(row.new_students) || 0),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true
            },
            {
              label: 'Étudiants (H)',
              data: result.rows.map(row => parseInt(row.male_students) || 0),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            },
            {
              label: 'Étudiantes (F)',
              data: result.rows.map(row => parseInt(row.female_students) || 0),
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)'
            }
          ]
        },
        summary: {
          total_period: result.rows.reduce((sum, row) => sum + (parseInt(row.new_students) || 0), 0),
          avg_per_period: Math.round(result.rows.reduce((sum, row) => sum + (parseInt(row.new_students) || 0), 0) / Math.max(result.rows.length, 1))
        }
      }
    });

  } catch (error) {
    console.error('Erreur Enrollment Trends:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tendances d\'inscription',
      enrollment_trends: { period: req.query.period || '6months', data: [], chart_config: { labels: [], datasets: [] } }
    });
  }
});

// === GRAPHIQUE : FLUX FINANCIERS ===
router.get('/financial-flows', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    const financialQuery = `
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) as month_start
      ),
      financial_data AS (
        SELECT 
          ds.month_start,
          COALESCE(SUM(sp.amount), 0) as income,
          COALESCE(SUM(e.amount), 0) as expenses,
          COALESCE(SUM(sal.amount), 0) as salaries,
          COUNT(sp.id) as payment_count,
          COUNT(e.id) as expense_count
        FROM date_series ds
        LEFT JOIN student_payments sp ON DATE_TRUNC('month', sp.payment_date) = ds.month_start
          AND sp.is_cancelled = false
        LEFT JOIN expenses e ON DATE_TRUNC('month', e.paid_date) = ds.month_start
        LEFT JOIN salary_payments_v2 sal ON DATE_TRUNC('month', sal.payment_date) = ds.month_start
          AND sal.status = 'completed'
        GROUP BY ds.month_start
        ORDER BY ds.month_start
      )
      SELECT 
        TO_CHAR(month_start, 'MM/YYYY') as month_label,
        income,
        expenses,
        salaries,
        (income - expenses - salaries) as net_flow,
        payment_count,
        expense_count,
        month_start
      FROM financial_data
    `;
    
    const result = await query(financialQuery);
    
    res.json({
      success: true,
      financial_flows: {
        period: period,
        data: result.rows,
        chart_config: {
          labels: result.rows.map(row => row.month_label),
          datasets: [
            {
              label: 'Revenus étudiants',
              data: result.rows.map(row => parseFloat(row.income) || 0),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              type: 'bar'
            },
            {
              label: 'Dépenses générales',
              data: result.rows.map(row => parseFloat(row.expenses) || 0),
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              type: 'bar'
            },
            {
              label: 'Salaires',
              data: result.rows.map(row => parseFloat(row.salaries) || 0),
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              type: 'bar'
            },
            {
              label: 'Flux net',
              data: result.rows.map(row => parseFloat(row.net_flow) || 0),
              borderColor: '#6366F1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        },
        summary: {
          total_income: result.rows.reduce((sum, row) => sum + (parseFloat(row.income) || 0), 0),
          total_expenses: result.rows.reduce((sum, row) => sum + (parseFloat(row.expenses) || 0), 0),
          total_salaries: result.rows.reduce((sum, row) => sum + (parseFloat(row.salaries) || 0), 0),
          avg_net_flow: result.rows.reduce((sum, row) => sum + (parseFloat(row.net_flow) || 0), 0) / Math.max(result.rows.length, 1)
        }
      }
    });

  } catch (error) {
    console.error('Erreur Financial Flows:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des flux financiers',
      financial_flows: { period: req.query.period || '6months', data: [], chart_config: { labels: [], datasets: [] } }
    });
  }
});

// === GRAPHIQUE : PERFORMANCE ACADÉMIQUE ===
router.get('/academic-performance', authenticateToken, async (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    const academicQuery = `
      WITH date_series AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) as month_start
      ),
      academic_data AS (
        SELECT 
          ds.month_start,
          COUNT(sap.id) as total_evaluations,
          AVG(sap.overall_grade) FILTER (WHERE sap.overall_grade IS NOT NULL) as avg_grade,
          COUNT(sap.id) FILTER (WHERE sap.overall_grade >= 16) as excellent,
          COUNT(sap.id) FILTER (WHERE sap.overall_grade >= 14 AND sap.overall_grade < 16) as good,
          COUNT(sap.id) FILTER (WHERE sap.overall_grade >= 12 AND sap.overall_grade < 14) as average,
          COUNT(sap.id) FILTER (WHERE sap.overall_grade < 12) as poor,
          AVG(sap.attendance_rate) FILTER (WHERE sap.attendance_rate IS NOT NULL) as avg_attendance,
          SUM(sap.pages_memorized) FILTER (WHERE sap.pages_memorized IS NOT NULL) as total_pages
        FROM date_series ds
        LEFT JOIN student_academic_progress sap ON DATE_TRUNC('month', sap.evaluation_date) = ds.month_start
        LEFT JOIN students s ON sap.student_id = s.id AND (s.deleted = false OR s.deleted IS NULL)
        GROUP BY ds.month_start
        ORDER BY ds.month_start
      )
      SELECT 
        TO_CHAR(month_start, 'MM/YYYY') as month_label,
        total_evaluations,
        ROUND(avg_grade::numeric, 2) as avg_grade,
        excellent, good, average, poor,
        ROUND(avg_attendance::numeric, 1) as avg_attendance,
        total_pages,
        month_start
      FROM academic_data
    `;
    
    const result = await query(academicQuery);
    
    res.json({
      success: true,
      academic_performance: {
        period: period,
        data: result.rows,
        chart_config: {
          labels: result.rows.map(row => row.month_label),
          datasets: [
            {
              label: 'Note moyenne',
              data: result.rows.map(row => parseFloat(row.avg_grade) || 0),
              borderColor: '#6366F1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              type: 'line',
              yAxisID: 'y1'
            },
            {
              label: 'Excellentes (≥16)',
              data: result.rows.map(row => parseInt(row.excellent) || 0),
              backgroundColor: '#10B981',
              type: 'bar'
            },
            {
              label: 'Bonnes (14-16)',
              data: result.rows.map(row => parseInt(row.good) || 0),
              backgroundColor: '#3B82F6',
              type: 'bar'
            },
            {
              label: 'Moyennes (12-14)',
              data: result.rows.map(row => parseInt(row.average) || 0),
              backgroundColor: '#F59E0B',
              type: 'bar'
            },
            {
              label: 'Faibles (<12)',
              data: result.rows.map(row => parseInt(row.poor) || 0),
              backgroundColor: '#EF4444',
              type: 'bar'
            }
          ]
        },
        summary: {
          total_evaluations: result.rows.reduce((sum, row) => sum + (parseInt(row.total_evaluations) || 0), 0),
          overall_avg_grade: result.rows.reduce((sum, row) => sum + (parseFloat(row.avg_grade) || 0), 0) / Math.max(result.rows.length, 1),
          total_pages_memorized: result.rows.reduce((sum, row) => sum + (parseInt(row.total_pages) || 0), 0)
        }
      }
    });

  } catch (error) {
    console.error('Erreur Academic Performance:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des performances académiques',
      academic_performance: { period: req.query.period || '6months', data: [], chart_config: { labels: [], datasets: [] } }
    });
  }
});

// === GRAPHIQUE : RÉPARTITION DES CLASSES ===
router.get('/class-distribution', authenticateToken, async (req, res) => {
  try {
    const classDistQuery = `
      WITH class_stats AS (
        SELECT 
          c.id,
          c.name,
          c.type,
          c.level,
          c.capacity,
          COUNT(s.id) as current_students,
          ROUND((COUNT(s.id)::float / NULLIF(c.capacity, 0)) * 100, 1) as occupancy_rate
        FROM classes c
        LEFT JOIN students s ON c.id = s.coranic_class_id 
          AND (s.deleted = false OR s.deleted IS NULL)
        WHERE (c.is_active = true OR c.is_active IS NULL)
        GROUP BY c.id, c.name, c.type, c.level, c.capacity
        ORDER BY current_students DESC
      )
      SELECT 
        id, name, type, level, capacity, current_students, occupancy_rate,
        CASE 
          WHEN occupancy_rate >= 90 THEN 'saturée'
          WHEN occupancy_rate >= 70 THEN 'bien remplie'
          WHEN occupancy_rate >= 50 THEN 'normale'
          WHEN occupancy_rate >= 25 THEN 'faible'
          ELSE 'très faible'
        END as status
      FROM class_stats
    `;
    
    const result = await query(classDistQuery);
    
    // Calculs pour graphiques circulaires
    const typeDistribution = result.rows.reduce((acc, row) => {
      const type = row.type || 'coranic';
      if (!acc[type]) acc[type] = 0;
      acc[type] += parseInt(row.current_students) || 0;
      return acc;
    }, {});
    
    const statusDistribution = result.rows.reduce((acc, row) => {
      if (!acc[row.status]) acc[row.status] = 0;
      acc[row.status] += 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      class_distribution: {
        detailed_data: result.rows,
        type_distribution: {
          labels: Object.keys(typeDistribution),
          data: Object.values(typeDistribution),
          chart_config: {
            type: 'doughnut',
            colors: ['#3B82F6', '#10B981', '#F59E0B']
          }
        },
        status_distribution: {
          labels: Object.keys(statusDistribution),
          data: Object.values(statusDistribution),
          chart_config: {
            type: 'pie',
            colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6B7280']
          }
        },
        summary: {
          total_classes: result.rows.length,
          total_students: result.rows.reduce((sum, row) => sum + (parseInt(row.current_students) || 0), 0),
          avg_occupancy: Math.round(result.rows.reduce((sum, row) => sum + (parseFloat(row.occupancy_rate) || 0), 0) / Math.max(result.rows.length, 1))
        }
      }
    });

  } catch (error) {
    console.error('Erreur Class Distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la répartition des classes',
      class_distribution: { detailed_data: [], type_distribution: {}, status_distribution: {}, summary: {} }
    });
  }
});

module.exports = router;