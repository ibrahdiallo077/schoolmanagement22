// types/finance.types.ts - Types Finance Compatible Backend

// ================================================================
// 🏦 TYPES PRINCIPAUX - COMPATIBLE BACKEND finance.js
// ================================================================

/**
 * Type de transaction
 */
export type TransactionType = 'INCOME' | 'EXPENSE';

/**
 * Période de rapport
 */
export type ReportPeriod = 'current_month' | 'last_3_months' | 'current_year' | 'custom';

/**
 * Granularité des données
 */
export type DataGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Niveau de santé financière
 */
export type HealthLevel = 'excellent' | 'good' | 'warning' | 'critical';

/**
 * Direction de tendance
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Statut de connexion
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

// ================================================================
// 💰 CAPITAL ET SOLDE
// ================================================================

/**
 * Capital actuel - COMPATIBLE ROUTE: GET /capital/current
 */
export interface CurrentCapital {
  current_balance: number;
  formatted_balance: string;
  total_income: number;
  total_expenses: number;
  formatted_income: string;
  formatted_expenses: string;
  health_level: HealthLevel;
  last_updated: string;
}

/**
 * Tendance financière
 */
export interface FinancialTrend {
  percentage: number;
  direction: TrendDirection;
  raw_change: number;
}

// ================================================================
// 📊 DASHBOARD - COMPATIBLE ROUTE: GET /dashboard
// ================================================================

/**
 * Santé financière
 */
export interface FinancialHealth {
  score: number;
  level: HealthLevel;
  current_balance: number;
  formatted_balance: string;
  monthly_flow: number;
  formatted_monthly_flow: string;
  trend: FinancialTrend;
  status_message: string;
}

/**
 * Flux de revenus
 */
export interface IncomeFlow {
  total: number;
  monthly: number;
  formatted_total: string;
  formatted_monthly: string;
  trend: FinancialTrend;
  transaction_count: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
}

/**
 * Flux de dépenses
 */
export interface ExpenseFlow {
  total: number;
  monthly: number;
  formatted_total: string;
  formatted_monthly: string;
  trend: FinancialTrend;
  transaction_count: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
}

/**
 * Balance nette
 */
export interface NetBalance {
  amount: number;
  formatted: string;
  trend: FinancialTrend;
  is_positive: boolean;
  total_net: number;
  formatted_total_net: string;
}

/**
 * Flux financiers unifiés
 */
export interface UnifiedFlows {
  income: IncomeFlow;
  expenses: ExpenseFlow;
  net_balance: NetBalance;
}

/**
 * Évolution temporelle
 */
export interface FinancialEvolution {
  year: number;
  month: number;
  period_label: string;
  income: number;
  expenses: number;
  net_flow: number;
  monthly_balance: number;
  cumulative_balance: number;
  formatted_income: string;
  formatted_expenses: string;
  formatted_net_flow: string;
  formatted_balance: string;
  formatted_cumulative: string;
  net_flow_positive: boolean;
  growth_rate: number;
}

/**
 * Répartition par source
 */
export interface SourceBreakdown {
  source_name: string;
  type: TransactionType;
  total_amount: number;
  transaction_count: number;
  average_amount: number;
  formatted_amount: string;
  formatted_average: string;
  color: string;
  icon: string;
  percentage: number;
}

/**
 * Analyse des paiements
 */
export interface PaymentAnalysis {
  year: number;
  month: number;
  period_label: string;
  payment_count: number;
  total_collected: number;
  avg_payment: number;
  unique_students: number;
  formatted_total: string;
  formatted_avg: string;
}

/**
 * Alerte financière
 */
export interface FinancialAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  recommendation: string;
  color: string;
}

/**
 * Statistiques détaillées
 */
export interface DetailedStatistics {
  total_transactions: number;
  unique_sources: number;
  unique_entities: number;
  income_transactions: number;
  expense_transactions: number;
  avg_transaction_size: number;
  largest_income: number;
  largest_expense: number;
  income_expense_ratio: number;
}

/**
 * Métadonnées
 */
export interface DashboardMetadata {
  generated_at: string;
  period: {
    month: number;
    year: number;
    name: string;
  };
  data_source: string;
  last_transaction_date: string | null;
}

/**
 * Dashboard principal - STRUCTURE EXACTE DU BACKEND
 */
export interface DashboardData {
  financial_health: FinancialHealth;
  unified_flows: UnifiedFlows;
  evolution: FinancialEvolution[];
  source_breakdown: SourceBreakdown[];
  payment_analysis: PaymentAnalysis[];
  alerts: FinancialAlert[];
  statistics: DetailedStatistics;
  metadata: DashboardMetadata;
}

// ================================================================
// 💼 TRANSACTIONS - COMPATIBLE ROUTE: GET /transactions/live
// ================================================================

/**
 * Transaction en temps réel
 */
export interface LiveTransaction {
  transaction_id: string;
  type: TransactionType;
  amount: number;
  formatted_amount: string;
  date: string;
  formatted_date: string;
  category: string;
  entity_name: string;
  method: string;
  reference: string;
  recorded_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  color: string;
  icon: string;
  
  // Champs optionnels pour transactions manuelles
  id?: number;
  description?: string;
  transaction_date?: string;
  payment_method?: string;
  notes?: string;
  impact_capital?: boolean;
  created_at?: string;
  formatted_created_at?: string;
  created_by_username?: string;
  created_by_name?: string;
  impact_on_capital?: 'positive' | 'negative';
  metadata_parsed?: any;
}

/**
 * Statistiques des transactions
 */
export interface TransactionStatistics {
  total_transactions: number;
  total_income: number;
  total_expenses: number;
  formatted_income: string;
  formatted_expenses: string;
  net_impact: number;
  formatted_net_impact: string;
}

/**
 * Filtres pour les transactions
 */
export interface TransactionFilters {
  limit?: number;
  type?: TransactionType;
  category?: string;
  entity_name?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
}

// ================================================================
// 💉 INJECTION DE TRANSACTIONS - COMPATIBLE ROUTE: POST /inject-transaction
// ================================================================

/**
 * Données pour injection de transaction
 */
export interface TransactionInjectionData {
  type: TransactionType;
  amount: number;
  category?: string;
  description: string;
  entity_name?: string;
  transaction_date?: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  impact_capital?: boolean;
}

/**
 * Impact sur le capital
 */
export interface CapitalImpact {
  new_balance: number;
  formatted_new_balance: string;
  total_income: number;
  total_expenses: number;
  formatted_total_income: string;
  formatted_total_expenses: string;
  impact_amount: number;
}

/**
 * Information sur l'injecteur
 */
export interface InjectionUser {
  username: string;
  full_name: string;
  timestamp: string;
}

/**
 * Transaction injectée
 */
export interface InjectedTransaction {
  id: number;
  reference: string;
  type: TransactionType;
  amount: number;
  formatted_amount: string;
  description: string;
  transaction_date: string;
  formatted_date: string;
  entity_name: string;
  category: string;
  payment_method: string;
  notes: string | null;
  status: string;
  created_at: string;
  impact_description: string;
}

/**
 * Réponse d'injection - STRUCTURE EXACTE DU BACKEND
 */
export interface InjectionResponse {
  success: boolean;
  message: string;
  transaction: InjectedTransaction;
  capital_impact: CapitalImpact | null;
  injected_by: InjectionUser;
}

// ================================================================
// 📈 RAPPORTS - COMPATIBLE ROUTE: GET /report
// ================================================================

/**
 * Rapport financier
 */
export interface FinancialReport {
  period: ReportPeriod;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  formatted_income: string;
  formatted_expenses: string;
  formatted_net_balance: string;
  total_transactions: number;
  income_transactions: number;
  expense_transactions: number;
  generated_at: string;
}

// ================================================================
// 🏥 SANTÉ DU SYSTÈME - COMPATIBLE ROUTE: GET /health
// ================================================================

/**
 * Santé du système
 */
export interface SystemHealth {
  success: boolean;
  message: string;
  version: string;
  features: string[];
  timestamp: string;
}

// ================================================================
// 🎯 TYPES POUR LES HOOKS
// ================================================================

/**
 * Options pour useFinance
 */
export interface UseFinanceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
  onError?: (error: any) => void;
  onSuccess?: (action: string) => void;
}

/**
 * Filtres pour useFinance
 */
export interface UseFinanceFilters {
  transactionFilters?: TransactionFilters;
  manualTransactionType?: 'INCOME' | 'EXPENSE' | 'all';
  manualTransactionLimit?: number;
}

/**
 * État du hook useFinance
 */
export interface UseFinanceState {
  // Données principales
  dashboard: DashboardData | null;
  capital: CurrentCapital | null;
  transactions: LiveTransaction[];
  statistics: TransactionStatistics | null;
  manualTransactions: LiveTransaction[];
  
  // États de chargement
  isLoading: boolean;
  isDashboardLoading: boolean;
  isCapitalLoading: boolean;
  isTransactionsLoading: boolean;
  isManualTransactionsLoading: boolean;
  
  // États d'erreur
  error: string | null;
  dashboardError: string | null;
  capitalError: string | null;
  transactionsError: string | null;
  
  // États d'action
  isInjecting: boolean;
  isDeleting: boolean;
  
  // Métadonnées
  lastUpdated: Date | null;
  refreshCount: number;
  connectionStatus: ConnectionStatus;
}

/**
 * Retour du hook useFinance
 */
export interface UseFinanceReturn {
  // 📊 Données principales
  dashboard: DashboardData | null;
  capital: CurrentCapital | null;
  transactions: LiveTransaction[];
  statistics: TransactionStatistics | null;
  manualTransactions: LiveTransaction[];
  
  // 📈 Données calculées
  healthScore: { score: number; level: HealthLevel } | null;
  
  // ⏳ États de chargement
  isLoading: boolean;
  isDashboardLoading: boolean;
  isCapitalLoading: boolean;
  isTransactionsLoading: boolean;
  isManualTransactionsLoading: boolean;
  isAnyLoading: boolean;
  
  // ❌ États d'erreur
  error: string | null;
  dashboardError: string | null;
  capitalError: string | null;
  transactionsError: string | null;
  hasAnyError: boolean;
  
  // 🔄 États d'action
  isInjecting: boolean;
  isDeleting: boolean;
  
  // 🔗 État de connexion
  connectionStatus: ConnectionStatus;
  
  // 📅 Métadonnées
  lastUpdated: Date | null;
  refreshCount: number;
  
  // 🔄 Actions de rafraîchissement
  refresh: (showLoading?: boolean) => Promise<void>;
  refreshDashboard: (showLoading?: boolean) => Promise<void>;
  refreshCapital: (showLoading?: boolean) => Promise<void>;
  refreshTransactions: (showLoading?: boolean) => Promise<void>;
  refreshManualTransactions: (showLoading?: boolean) => Promise<void>;
  
  // 💉 Actions d'injection
  injectTransaction: (data: TransactionInjectionData) => Promise<InjectionResponse>;
  addMoney: (amount: number, description: string, category?: string, entityName?: string) => Promise<InjectionResponse>;
  removeMoney: (amount: number, description: string, category?: string, entityName?: string) => Promise<InjectionResponse>;
  
  // 🗑️ Actions de suppression
  deleteTransaction: (id: string) => Promise<void>;
  
  // 📈 Actions de rapport
  getReport: (period?: ReportPeriod, year?: number, month?: number) => Promise<FinancialReport>;
  
  // 🔧 Utilitaires
  clearCache: () => void;
  diagnose: () => Promise<any>;
  formatGNF: (amount: number) => string;
  
  // 📊 Raccourcis vers les données importantes
  currentBalance: number;
  formattedBalance: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  netFlow: number;
  alertsCount: number;
  transactionCount: number;
  
  // 🏥 Santé financière
  financialHealth: FinancialHealth | null;
  alerts: FinancialAlert[];
  
  // 📊 Statistiques
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
}

// ================================================================
// 🎨 TYPES POUR LES COMPOSANTS UI
// ================================================================

/**
 * Props pour les composants de dashboard
 */
export interface DashboardProps {
  dashboard?: DashboardData | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
}

/**
 * Props pour les composants de capital
 */
export interface CapitalProps {
  capital?: CurrentCapital | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showTrends?: boolean;
  className?: string;
}

/**
 * Props pour les composants de transactions
 */
export interface TransactionsProps {
  transactions?: LiveTransaction[];
  statistics?: TransactionStatistics | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  filters?: TransactionFilters;
  onFilterChange?: (filters: TransactionFilters) => void;
  className?: string;
}

/**
 * Props pour les composants d'injection
 */
export interface InjectionProps {
  onInject?: (data: TransactionInjectionData) => Promise<InjectionResponse>;
  isInjecting?: boolean;
  className?: string;
}

/**
 * Props pour les composants d'alerte
 */
export interface AlertProps {
  alerts?: FinancialAlert[];
  onDismiss?: (alertType: string) => void;
  className?: string;
}

/**
 * Props pour les graphiques
 */
export interface ChartProps {
  data?: any[];
  isLoading?: boolean;
  error?: string | null;
  height?: number;
  className?: string;
}

// ================================================================
// 🔧 TYPES UTILITAIRES
// ================================================================

/**
 * Configuration du cache
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize?: number;
}

/**
 * Configuration des intervalles
 */
export interface RefreshIntervals {
  dashboard: number;
  capital: number;
  transactions: number;
  alerts: number;
}

/**
 * Limites du système
 */
export interface SystemLimits {
  maxTransactionAmount: number;
  maxTransactionsPerPage: number;
  maxExportRecords: number;
  minDescriptionLength: number;
  minEntityNameLength: number;
  minReferenceLength: number;
}

/**
 * Configuration générale
 */
export interface FinanceConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  refreshIntervals: RefreshIntervals;
  cache: CacheConfig;
  limits: SystemLimits;
  debug: boolean;
}

// ================================================================
// 📊 TYPES POUR LES STATISTIQUES AVANCÉES
// ================================================================

/**
 * Tendance mensuelle
 */
export interface MonthlyTrend {
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  growth_rate: number;
  transaction_count: number;
}

/**
 * Répartition par catégorie
 */
export interface CategoryBreakdown {
  category: string;
  type: TransactionType;
  amount: number;
  percentage: number;
  transaction_count: number;
  color: string;
}

/**
 * Performance mensuelle
 */
export interface MonthlyPerformance {
  current_month: {
    income: number;
    expenses: number;
    balance: number;
    transactions: number;
  };
  previous_month: {
    income: number;
    expenses: number;
    balance: number;
    transactions: number;
  };
  growth: {
    income_growth: number;
    expense_growth: number;
    balance_growth: number;
    transaction_growth: number;
  };
}

/**
 * Prédictions financières
 */
export interface FinancialPrediction {
  month: number;
  year: number;
  predicted_income: number;
  predicted_expenses: number;
  predicted_balance: number;
  confidence_score: number;
  factors: string[];
}

// ================================================================
// 🚨 TYPES POUR LA GESTION D'ERREURS
// ================================================================

/**
 * Erreur de l'API Finance
 */
export interface FinanceAPIErrorData {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp?: string;
}

/**
 * Réponse d'erreur standardisée
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
  timestamp?: string;
}

/**
 * Réponse de succès standardisée
 */
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp?: string;
}

/**
 * Réponse API générique
 */
export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ================================================================
// 🎯 TYPES POUR LES ACTIONS UTILISATEUR
// ================================================================

/**
 * Action de l'utilisateur
 */
export interface UserAction {
  type: 'INJECT' | 'DELETE' | 'REFRESH' | 'EXPORT' | 'FILTER';
  payload?: any;
  timestamp: Date;
  user_id?: string;
  user_name?: string;
}

/**
 * Historique des actions
 */
export interface ActionHistory {
  actions: UserAction[];
  total_count: number;
  last_action?: UserAction;
}

// ================================================================
// 🔄 TYPES POUR LES WEBSOCKETS (FUTUR)
// ================================================================

/**
 * Message WebSocket
 */
export interface WebSocketMessage {
  type: 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'CAPITAL_CHANGED' | 'ALERT_TRIGGERED';
  payload: any;
  timestamp: string;
}

/**
 * Configuration WebSocket
 */
export interface WebSocketConfig {
  enabled: boolean;
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
}

// ================================================================
// 🎨 TYPES POUR LES THÈMES ET STYLES
// ================================================================

/**
 * Couleurs du thème financier
 */
export interface FinanceTheme {
  colors: {
    income: string;
    expense: string;
    positive: string;
    negative: string;
    neutral: string;
    warning: string;
    error: string;
    success: string;
  };
  gradients: {
    income: string;
    expense: string;
    balance: string;
  };
}

/**
 * Configuration des graphiques
 */
export interface ChartConfig {
  theme: 'light' | 'dark';
  colors: string[];
  animations: boolean;
  responsive: boolean;
  height: number;
  locale: string;
}

// ================================================================
// 📱 TYPES POUR LA RESPONSIVITÉ
// ================================================================

/**
 * Points de rupture
 */
export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

/**
 * Configuration responsive
 */
export interface ResponsiveConfig {
  breakpoints: Breakpoints;
  hideOnMobile: string[];
  stackOnTablet: string[];
}

// ================================================================
// 🔐 TYPES POUR LA SÉCURITÉ
// ================================================================

/**
 * Permissions utilisateur
 */
export interface UserPermissions {
  can_view_dashboard: boolean;
  can_view_capital: boolean;
  can_view_transactions: boolean;
  can_inject_transactions: boolean;
  can_delete_transactions: boolean;
  can_export_data: boolean;
  can_view_reports: boolean;
}

/**
 * Contexte de sécurité
 */
export interface SecurityContext {
  user_id: string;
  user_role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  permissions: UserPermissions;
  session_expires_at: string;
}

// ================================================================
// 🚀 EXPORTS ET RÉEXPORTS
// ================================================================

// Les types sont déjà exportés individuellement avec `export interface` ou `export type`
// Pas besoin de réexporter avec `export type {}`

// ================================================================
// 📝 CONSTANTES DE TYPES
// ================================================================

/**
 * Types de transactions disponibles
 */
export const TRANSACTION_TYPES: TransactionType[] = ['INCOME', 'EXPENSE'];

/**
 * Périodes de rapport disponibles
 */
export const REPORT_PERIODS: ReportPeriod[] = ['current_month', 'last_3_months', 'current_year', 'custom'];

/**
 * Niveaux de santé financière
 */
export const HEALTH_LEVELS: HealthLevel[] = ['excellent', 'good', 'warning', 'critical'];

/**
 * Directions de tendance
 */
export const TREND_DIRECTIONS: TrendDirection[] = ['up', 'down', 'stable'];

/**
 * Statuts de connexion
 */
export const CONNECTION_STATUSES: ConnectionStatus[] = ['connected', 'disconnected', 'error'];

/**
 * Granularités disponibles
 */
export const DATA_GRANULARITIES: DataGranularity[] = ['daily', 'weekly', 'monthly', 'yearly'];

// ================================================================
// 🎯 TYPES GUARDS
// ================================================================

/**
 * Vérifie si c'est un type de transaction valide
 */
export function isTransactionType(value: any): value is TransactionType {
  return typeof value === 'string' && TRANSACTION_TYPES.includes(value as TransactionType);
}

/**
 * Vérifie si c'est une période de rapport valide
 */
export function isReportPeriod(value: any): value is ReportPeriod {
  return typeof value === 'string' && REPORT_PERIODS.includes(value as ReportPeriod);
}

/**
 * Vérifie si c'est un niveau de santé valide
 */
export function isHealthLevel(value: any): value is HealthLevel {
  return typeof value === 'string' && HEALTH_LEVELS.includes(value as HealthLevel);
}

/**
 * Vérifie si c'est une direction de tendance valide
 */
export function isTrendDirection(value: any): value is TrendDirection {
  return typeof value === 'string' && TREND_DIRECTIONS.includes(value as TrendDirection);
}

/**
 * Vérifie si c'est un statut de connexion valide
 */
export function isConnectionStatus(value: any): value is ConnectionStatus {
  return typeof value === 'string' && CONNECTION_STATUSES.includes(value as ConnectionStatus);
}

/**
 * Vérifie si c'est une granularité valide
 */
export function isDataGranularity(value: any): value is DataGranularity {
  return typeof value === 'string' && DATA_GRANULARITIES.includes(value as DataGranularity);
}

// ================================================================
// 🔧 UTILITAIRES DE VALIDATION
// ================================================================

/**
 * Valide les données d'injection de transaction
 */
export function validateTransactionInjectionData(data: any): data is TransactionInjectionData {
  return (
    typeof data === 'object' &&
    data !== null &&
    isTransactionType(data.type) &&
    typeof data.amount === 'number' &&
    data.amount > 0 &&
    typeof data.description === 'string' &&
    data.description.trim().length >= 5
  );
}

/**
 * Valide les filtres de transaction
 */
export function validateTransactionFilters(filters: any): filters is TransactionFilters {
  if (typeof filters !== 'object' || filters === null) {
    return false;
  }
  
  return (
    (filters.limit === undefined || (typeof filters.limit === 'number' && filters.limit > 0)) &&
    (filters.type === undefined || isTransactionType(filters.type)) &&
    (filters.amount_min === undefined || (typeof filters.amount_min === 'number' && filters.amount_min >= 0)) &&
    (filters.amount_max === undefined || (typeof filters.amount_max === 'number' && filters.amount_max >= 0))
  );
}

/**
 * Valide une réponse d'API
 */
export function isAPIResponse(response: any): response is APIResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean'
  );
}

/**
 * Valide une réponse de succès
 */
export function isSuccessResponse<T>(response: any): response is SuccessResponse<T> {
  return isAPIResponse(response) && response.success === true;
}

/**
 * Valide une réponse d'erreur
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return (
    isAPIResponse(response) &&
    response.success === false &&
    typeof response.error === 'string'
  );
}

// ================================================================
// 🎨 HELPERS DE FORMATAGE
// ================================================================

/**
 * Formatte un montant en FG
 */
export function formatGNF(amount: number): string {
  if (isNaN(amount)) return '0 FG';
  return `${amount.toLocaleString('fr-FR')} FG`;
}

/**
 * Parse un montant depuis une chaîne
 */
export function parseGNF(formattedAmount: string): number {
  const cleanAmount = formattedAmount.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleanAmount);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatte une date pour l'affichage
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
}

/**
 * Formatte une date et heure pour l'affichage
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('fr-FR');
}

/**
 * Calcule le pourcentage de changement
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Détermine la couleur selon le type de transaction
 */
export function getTransactionColor(type: TransactionType): string {
  return type === 'INCOME' ? '#10B981' : '#EF4444';
}

/**
 * Détermine l'icône selon le type de transaction
 */
export function getTransactionIcon(type: TransactionType): string {
  return type === 'INCOME' ? '💰' : '💸';
}

/**
 * Détermine la couleur selon le niveau de santé
 */
export function getHealthColor(level: HealthLevel): string {
  switch (level) {
    case 'excellent': return '#10B981';
    case 'good': return '#059669';
    case 'warning': return '#F59E0B';
    case 'critical': return '#EF4444';
    default: return '#6B7280';
  }
}

// ================================================================
// 🚀 EXPORT PAR DÉFAUT
// ================================================================

export default {
  // Types principaux
  TransactionType,
  ReportPeriod,
  HealthLevel,
  TrendDirection,
  ConnectionStatus,
  
  // Constantes
  TRANSACTION_TYPES,
  REPORT_PERIODS,
  HEALTH_LEVELS,
  TREND_DIRECTIONS,
  CONNECTION_STATUSES,
  DATA_GRANULARITIES,
  
  // Type guards
  isTransactionType,
  isReportPeriod,
  isHealthLevel,
  isTrendDirection,
  isConnectionStatus,
  isDataGranularity,
  
  // Validation
  validateTransactionInjectionData,
  validateTransactionFilters,
  isAPIResponse,
  isSuccessResponse,
  isErrorResponse,
  
  // Formatage
  formatGNF,
  parseGNF,
  formatDate,
  formatDateTime,
  calculatePercentageChange,
  getTransactionColor,
  getTransactionIcon,
  getHealthColor
};