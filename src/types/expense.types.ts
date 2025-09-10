// src/types/expense.types.ts - Types TypeScript pour les dépenses - VERSION MISE À JOUR

// ============================================================================
// BASE TYPES
// ============================================================================

export interface Expense {
  id: string;
  reference?: string;
  description: string;
  amount: number;
  expense_date: string;
  supplier_name?: string;
  notes?: string;
  payment_method?: string;
  budget_year?: number;
  budget_month?: number;
  paid_date?: string;
  
  // Relations
  category_id: string;
  status_id: string;
  created_by?: number;
  updated_by?: number;
  
  // 🔥 RESPONSABLE AUTOMATIQUE - Utilisateur qui a créé la dépense
  responsible_user_id?: string;
  responsible_user_name?: string;
  responsible_user_role?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Computed/Formatted fields (from API)
  montant_formate?: string;
  date_formatee?: string;
  cree_le?: string;
  
  // Informations enrichies par le backend
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  status_name?: string;
  status_color?: string;
  status_icon?: string;
  status_final?: boolean;
  
  // Responsable enrichi
  responsible_name?: string;
  responsible_role?: string;
  responsible_badge?: string;
  responsible_badge_color?: string;
  responsible_department?: string;
  
  // Validation et permissions
  is_own_expense?: boolean;
  valide_par?: string;
  date_validation_formatee?: string;
  
  // Workflow et priorité
  priorite?: string;
  heures_attente?: number;
  createur_email?: string;
  
  // Legacy fields (compatibilité)
  categorie_nom?: string;
  categorie_couleur?: string;
  categorie_icone?: string;
  statut_nom?: string;
  statut_couleur?: string;
  statut_icone?: string;
  responsable_nom?: string;
  responsable_dept?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  
  // Statistics (from API)
  total_depenses?: number;
  total_montant?: number;
  total_montant_formate?: string;
  depenses_cette_annee?: number;
}

export interface ExpenseStatus {
  id: string;
  name: string;
  name_ar?: string;
  color: string;
  icon?: string;
  description?: string;
  is_final?: boolean;
  sort_order?: number;
  created_at?: string;
  
  // Statistics (from API)
  total_depenses?: number;
  total_montant?: number;
  total_montant_formate?: string;
}

// ============================================================================
// DTO TYPES
// ============================================================================

export interface CreateExpenseDto {
  description: string;
  amount: number;
  category_id: string;
  expense_date: string;
  payment_method?: string;
  supplier_name?: string;
  notes?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {
  status_id?: string;
  paid_date?: string;
}

// ============================================================================
// 🆕 NOUVEAUX TYPES - RECHERCHE INTELLIGENTE
// ============================================================================

export interface FilterOptions {
  categories: { 
    id: string; 
    name: string; 
    color: string; 
    icon: string; 
  }[];
  statuses: { 
    id: string; 
    name: string; 
    color: string; 
    icon: string; 
  }[];
  years: number[];
  search_hints: {
    text: string;
    amount: string;
    year: string;
    global: string;
  };
}

export interface SearchSuggestion {
  type: 'description' | 'supplier' | 'amount' | 'year';
  value: string;
}

export interface SearchInfo {
  term: string;
  type: 'text' | 'amount' | 'year' | 'mixed';
  results_count: number;
  search_time_ms?: number;
  applied_filters?: {
    text_search?: string;
    amount_search?: number;
    year_search?: number;
  };
}

// ============================================================================
// API RESPONSE TYPES ÉTENDUS
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  
  // 🆕 Propriétés supplémentaires du backend
  user_permissions?: {
    id?: number;
    username?: string;
    full_name?: string;
    role?: string;
    canValidate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canViewAll?: boolean;
    canCreateExpense?: boolean;
    canViewValidation?: boolean;
    canViewAllExpenses?: boolean;
    canEditOwnExpenses?: boolean;
    canDeleteOwnExpenses?: boolean;
  };
  
  // 🆕 Informations de création
  created_by?: {
    id: number;
    name: string;
    role: string;
    email: string;
  };
  
  // 🆕 Étapes suivantes
  next_steps?: string;
  
  // 🆕 Informations de validation
  validation_info?: {
    validated_by: string;
    validation_date: string;
    previous_status: string;
    new_status: string;
  };
  
  // 🆕 Statut de préparation
  is_ready?: boolean;
  
  // 🆕 Informations utilisateur
  user?: {
    id: number;
    username: string;
    full_name: string;
    role: string;
    canValidate: boolean;
  };
  
  // 🆕 Compteurs
  count?: number;
  processed_count?: number;
  requested_count?: number;
  
  // 🆕 Informations du validateur
  validator_info?: {
    name: string;
    role: string;
    can_validate: boolean;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  error?: string;
  message?: string;
}

export interface ExpenseListResponse extends PaginatedResponse<Expense> {
  filters?: ExpenseFilters;
  
  // 🆕 RECHERCHE INTELLIGENTE
  search_info?: SearchInfo;
  
  // 🆕 Statistiques par statut
  statistics?: Array<{
    status_name: string;
    count: number;
    total_amount: number;
  }>;
  
  // 🆕 Informations utilisateur
  user_info?: {
    id: number;
    name: string;
    role: string;
    badge: string;
    canValidate: boolean;
    canViewAll: boolean;
    viewing_scope: string;
  };
}

// ============================================================================
// 🔧 FILTER AND SEARCH TYPES - VERSION SIMPLIFIÉE
// ============================================================================

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  
  // 🔍 RECHERCHE INTELLIGENTE GLOBALE
  search?: string; // Remplace year, month, description, etc.
  
  // 🎯 FILTRES SIMPLIFIÉS
  category_id?: string;
  status_id?: string;
  
  // 📊 TRI
  sort_by?: keyof Expense;
  sort_order?: 'asc' | 'desc';
  
  // 🔧 GARDE POUR COMPATIBILITÉ (optionnel)
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_method?: string;
  user_filtered?: boolean;
}

// ============================================================================
// DASHBOARD TYPES ÉTENDUS
// ============================================================================

export interface ExpenseDashboard {
  stats: {
    total_depenses: number;
    total_montant: number;
    montant_formate: string;
    en_attente: number;
    payes: number;
    rejetes?: number;
    montant_en_attente: number;
    montant_en_attente_formate: string;
    montant_paye: number;
    montant_paye_formate: string;
    montant_rejete?: number;
    montant_rejete_formate?: string;
    ce_mois: number;
    montant_ce_mois: number;
    montant_ce_mois_formate: string;
    montant_ce_mois_valide?: number;
    montant_ce_mois_valide_formate?: string;
    impact_capital?: number;
    impact_capital_formate?: string;
  };
  recent_expenses: Expense[];
  top_categories: Array<{
    categorie: string;
    color: string;
    icon: string;
    nombre_depenses: number;
    total_montant: number;
    montant_formate: string;
    pourcentage: number;
  }>;
  monthly_trend: Array<{
    mois: string;
    mois_nom: string;
    nombre_depenses: number;
    total_montant: number;
    montant_formate: string;
  }>;
  
  // 🆕 Permissions utilisateur dans le dashboard
  user_permissions?: {
    id: number;
    username: string;
    full_name: string;
    role: string;
    canValidate: boolean;
    viewing_scope: string;
  };
}

// ============================================================================
// 🔧 HOOK TYPES - VERSION MISE À JOUR
// ============================================================================

export interface UseExpensesOptions {
  autoLoad?: boolean;
  defaultFilters?: Partial<ExpenseFilters>;
  onError?: (error: Error) => void;
}

export interface UseExpensesReturn {
  // Data
  expenses: Expense[];
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  dashboard: ExpenseDashboard | null;

  responsibles: ExpenseResponsible[]
  
  // 🆕 NOUVEAUX : Filtres intelligents
  filterOptions: FilterOptions | null;
  searchSuggestions: SearchSuggestion[];
  searchInfo: SearchInfo | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  configLoading: boolean;
  dashboardLoading?: boolean;
  suggestionsLoading?: boolean;
  
  // Error state
  error: string | null;
  clearError: () => void;
  
  // Ready state
  isReady: boolean;
  
  // Filters & pagination
  filters: ExpenseFilters;
  pagination: PaginatedResponse<Expense>['pagination'];
  
  // Selection
  selectedIds: string[];
  
  // Actions - CRUD
  loadExpenses: (filters?: Partial<ExpenseFilters>) => Promise<void>;
  loadDashboard: () => Promise<void>;
  createExpense: (data: CreateExpenseDto) => Promise<Expense | null>;
  updateExpense: (id: string, data: Partial<CreateExpenseDto>) => Promise<Expense | null>;
  updateExpenseStatus: (id: string, status_id: string, payment_date?: string) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  deleteMultipleExpenses: (ids: string[]) => Promise<boolean>;
  
  // 🆕 NOUVELLES ACTIONS - Recherche intelligente
  loadFilterOptions: () => Promise<void>;
  getSearchSuggestions: (query: string) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<ExpenseFilters>) => void;
  clearFilters: () => void;
  
  // Selection
  selectExpense: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Utils
  refreshAll: () => Promise<void>;
  getExpenseById: (id: string) => Expense | undefined;
  getCategoryById: (id: string) => ExpenseCategory | undefined;
  getStatusById: (id: string) => ExpenseStatus | undefined;
  testApiConnection: () => Promise<boolean>;
  
  // Computed stats
  stats: {
    totalAmount: number;
    totalAmountFormatted: string;
    paidAmount: number;
    paidAmountFormatted: string;
    pendingAmount: number;
    pendingAmountFormatted: string;
    paidCount: number;
    pendingCount: number;
    averageAmount: number;
    averageAmountFormatted: string;
    selectedAmount: number;
    selectedAmountFormatted: string;
  };
}

// ============================================================================
// 🔧 COMPONENT PROPS TYPES - VERSION MISE À JOUR
// ============================================================================

export interface ExpenseCardProps {
  expense: Expense;
  isSelected: boolean;
  onSelect: () => void;
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  onEdit?: (expense: Expense) => void;
  onView?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  onSuccess?: (expense: Expense) => void;
}

export interface ExpenseListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  loading?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onEdit?: (expense: Expense) => void;
  onView?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  onFiltersChange: (filters: Partial<ExpenseFilters>) => void;
  onClearFilters: () => void;
}

export interface ExpenseStatsProps {
  dashboard?: ExpenseDashboard | null;
  stats?: UseExpensesReturn['stats'];
  loading?: boolean;
}

// ============================================================================
// 🆕 NOUVEAU : SmartSearchProps
// ============================================================================

export interface SmartSearchProps {
  filters: ExpenseFilters;
  filterOptions: FilterOptions | null;
  searchSuggestions: SearchSuggestion[];
  onFiltersChange: (filters: Partial<ExpenseFilters>) => void;
  onClearFilters: () => void;
  onSearchSuggestions: (query: string) => void;
  isLoading?: boolean;
  suggestionsLoading?: boolean;
}

// ============================================================================
// 🆕 WORKFLOW ET VALIDATION TYPES
// ============================================================================

export interface ValidationAccessInfo {
  has_access: boolean;
  user_info: {
    id: number;
    name: string;
    role: string;
    badge: string;
    can_validate: boolean;
    can_view_validation_page: boolean;
  };
  message: string;
}

export interface UserPermissions {
  canValidate: boolean;
  canCreateExpense: boolean;
  canViewValidation: boolean;
  canViewAllExpenses: boolean;
  canEditOwnExpenses: boolean;
  canDeleteOwnExpenses: boolean;
  canBulkValidate?: boolean;
}

export interface BulkValidationRequest {
  expense_ids: string[];
  action: 'approve' | 'reject';
  notes?: string;
}

export interface BulkValidationResponse {
  processed_count: number;
  requested_count: number;
  processed_expenses: Array<{
    id: string;
    description: string;
    amount: number;
    responsible_user_name: string;
  }>;
  action: 'approve' | 'reject';
  validated_by: {
    name: string;
    role: string;
    email: string;
  };
}

// ============================================================================
// 🆕 ENRICHED EXPENSE TYPE (avec toutes les propriétés backend)
// ============================================================================

export interface EnrichedExpense extends Expense {
  // Toutes les propriétés enrichies garanties présentes
  category_name: string;
  category_color: string;
  category_icon: string;
  status_name: string;
  status_color: string;
  status_icon: string;
  status_final: boolean;
  responsible_name: string;
  responsible_department: string;
  montant_formate: string;
}

// ============================================================================
// 🆕 VALIDATION ET AUTHENTIFICATION TYPES
// ============================================================================

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  
  // Permissions spécifiques aux dépenses
  canValidate: boolean;
  canCreateExpense: boolean;
  canViewValidation: boolean;
  canViewAllExpenses: boolean;
  canEditOwnExpenses: boolean;
  canDeleteOwnExpenses: boolean;
  canBulkValidate: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// 🆕 PAYMENT METHOD TYPES ÉTENDUS
// ============================================================================

export interface PaymentMethodConfig {
  value: PaymentMethod;
  label: string;
  description: string;
  icon?: string;
  active?: boolean;
  fees?: number;
  processing_time?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'card';

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: string;
  description?: string;
  active?: boolean;
}

export type SortField = keyof Expense;
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  order: SortOrder;
  label: string;
}

// ============================================================================
// 🆕 STATUS TYPES POUR WORKFLOW
// ============================================================================

export type ExpenseStatusType = 'pending' | 'approved' | 'rejected' | 'paid';

export interface StatusTransition {
  from: ExpenseStatusType;
  to: ExpenseStatusType;
  requiredRole: string;
  description: string;
}

// ============================================================================
// 🆕 NOTIFICATION TYPES
// ============================================================================

export interface ExpenseNotification {
  id: string;
  type: 'expense_created' | 'expense_approved' | 'expense_rejected' | 'expense_requires_validation';
  expense_id: string;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// 🆕 EXPORT TYPES
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filters?: ExpenseFilters;
  fields?: (keyof Expense)[];
  groupBy?: 'category' | 'status' | 'month';
}

export interface ExportResponse {
  success: boolean;
  download_url?: string;
  filename?: string;
  error?: string;
}

// ============================================================================
// 🆕 ADVANCED SEARCH TYPES
// ============================================================================

export interface AdvancedSearchFilters extends ExpenseFilters {
  description_contains?: string;
  supplier_contains?: string;
  notes_contains?: string;
  created_by_user?: number;
  validated_by_user?: number;
  has_receipt?: boolean;
  is_recurring?: boolean;
}

// ============================================================================
// 🆕 STATISTICS TYPES
// ============================================================================

export interface ExpenseStatistics {
  total_count: number;
  total_amount: number;
  average_amount: number;
  by_status: Record<string, { count: number; amount: number }>;
  by_category: Record<string, { count: number; amount: number }>;
  by_month: Record<string, { count: number; amount: number }>;
  top_expenses: Expense[];
  recent_activity: Array<{
    date: string;
    action: string;
    expense_id: string;
    user_name: string;
  }>;
}

// ============================================================================
// 🆕 AUDIT TRAIL TYPES
// ============================================================================

export interface ExpenseAudit {
  id: string;
  expense_id: string;
  action: 'created' | 'updated' | 'status_changed' | 'deleted';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by: number;
  performed_by_name: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
}


export interface ExpenseResponsible {
  id: string;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}