// src/types/dashboard.ts - TYPES TYPESCRIPT POUR DASHBOARD

export interface MonthlyReportParams {
  month: string; // Format: YYYY-MM
  includeFinancials?: boolean;
  includeAcademics?: boolean;
  includeAttendance?: boolean;
}

export interface AcademicReportParams {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  classId?: string;
  includeGrades?: boolean;
  includeAttendance?: boolean;
  includeMemorization?: boolean;
}

export interface ExportDataParams {
  format: 'csv' | 'xlsx' | 'pdf';
  dataType: 'students' | 'classes' | 'staff' | 'financials' | 'evaluations';
  filters?: Record<string, any>;
}

export interface QuickStats {
  students: number;
  classes: number;
  staff: number;
  recent_evaluations: number;
  financial: {
    balance: number;
    formatted_balance: string;
    income: number;
    expenses: number;
    salaries: number;
    health_score: number;
  };
  alerts_count: number;
  last_updated: string;
  served_from_cache?: boolean;
}

export interface CoreMetrics {
  students: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    male_percentage: number;
    female_percentage: number;
    average_age: number;
    enrolled: number;
  };
  classes: {
    total: number;
    coranic: number;
    french: number;
    total_capacity: number;
    occupancy_rate: number;
    average_capacity: number;
    new_this_week: number;
  };
  staff: {
    total: number;
    teachers: number;
    admin: number;
    student_teacher_ratio: number;
    new_this_week: number;
  };
  academic: {
    total_evaluations: number;
    evaluations_this_week: number;
    evaluations_this_month: number;
    average_grade: number;
    excellent_rate: number;
    good_rate: number;
    poor_rate: number;
    total_pages_memorized: number;
    average_attendance: number;
  };
}

export interface FinancialOverview {
  current_balance: number;
  formatted_balance: string;
  monthly_flow: number;
  formatted_monthly_flow: string;
  income: {
    student_payments: number;
    monthly_student_payments: number;
    formatted_total: string;
    formatted_monthly: string;
    total_transactions: number;
  };
  expenses: {
    general: number;
    salaries: number;
    monthly_general: number;
    monthly_salaries: number;
    formatted_general: string;
    formatted_salaries: string;
    total_transactions: number;
  };
}

export interface SystemHealth {
  indicators: {
    financial_health: 'positive' | 'negative';
    academic_performance: 'excellent' | 'good' | 'needs_improvement';
    capacity_utilization: 'high' | 'optimal' | 'low';
    staff_ratio: number;
  };
  overall_score: number;
}

export interface Alert {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  action?: string;
  color: string;
}

export interface Recommendation {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface DashboardOverview {
  core_metrics: CoreMetrics;
  financial_overview: FinancialOverview;
  system_health: SystemHealth;
  alerts: Alert[];
  recommendations: Recommendation[];
}

export interface LiveMetrics {
  today: {
    new_students: number;
    new_payments: number;
    new_evaluations: number;
    new_expenses: number;
    revenue: number;
    spent: number;
    formatted_revenue: string;
    formatted_spent: string;
    net_flow: number;
    formatted_net_flow: string;
  };
  this_week: {
    new_students: number;
    new_payments: number;
    new_evaluations: number;
    revenue: number;
    formatted_revenue: string;
  };
  last_hour: {
    new_students: number;
    new_payments: number;
    new_evaluations: number;
    activity_level: 'active' | 'quiet';
  };
  timestamp: string;
}

export interface ActivityStreamItem {
  type: 'student' | 'payment' | 'evaluation' | 'expense';
  action: string;
  entity_name: string;
  timestamp: string;
  description: string;
  color: string;
  timestamp_formatted: string;
  time_ago: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  type?: 'line' | 'bar';
  yAxisID?: string;
}

export interface ChartConfig {
  labels: string[];
  datasets: ChartDataset[];
}

export interface EnrollmentTrends {
  period: string;
  data: Array<{
    period_label: string;
    new_students: number;
    male_students: number;
    female_students: number;
  }>;
  chart_config: ChartConfig;
  summary: {
    total_period: number;
    avg_per_period: number;
  };
}

export interface FinancialFlows {
  period: string;
  data: Array<{
    month_label: string;
    income: number;
    expenses: number;
    salaries: number;
    net_flow: number;
    payment_count: number;
    expense_count: number;
  }>;
  chart_config: ChartConfig;
  summary: {
    total_income: number;
    total_expenses: number;
    total_salaries: number;
    avg_net_flow: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  details?: string;
  served_from_cache?: boolean;
}

export interface QuickStatsResponse extends ApiResponse<QuickStats> {
  quick_stats: QuickStats;
}

export interface DashboardOverviewResponse extends ApiResponse<DashboardOverview> {
  dashboard: DashboardOverview;
  metadata: {
    generated_at: string;
    calculation_time_ms: number;
    data_sources: string[];
    cache_duration_seconds: number;
    served_from_cache: boolean;
    user: {
      id: string;
      username: string;
      role: string;
    };
  };
}

export interface LiveMetricsResponse extends ApiResponse<LiveMetrics> {
  live_metrics: LiveMetrics;
}

export interface ActivityStreamResponse extends ApiResponse<ActivityStreamItem[]> {
  activity_stream: ActivityStreamItem[];
  total_activities: number;
  last_updated: string;
}

export interface ChartResponse<T> extends ApiResponse<T> {
  // Type générique pour les réponses de graphiques
}

// Types pour les périodes de filtrage
export type TimePeriod = '24hours' | '7days' | '30days' | '6months';

// Types pour les permissions utilisateur
export interface UserPermissions {
  canViewOverview: boolean;
  canViewFinancials: boolean;
  canViewReports: boolean;
  canExportData: boolean;
}

// Types d'erreur
export interface DashboardError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Configuration du dashboard
export interface DashboardConfig {
  refreshIntervals: {
    quickStats: number; // ms
    liveMetrics: number; // ms
    overview: number; // ms
  };
  cacheSettings: {
    enabled: boolean;
    maxAge: number;
  };
  features: {
    realTimeUpdates: boolean;
    notifications: boolean;
    charts: boolean;
    exports: boolean;
  };
}
