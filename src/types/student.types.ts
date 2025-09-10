// src/types/student.types.ts

// ✨ TYPES DE BASE

export interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  age: number;
  gender: 'M' | 'F';
  is_orphan: boolean;
  status: 'interne' | 'externe' | 'archived';
  photo_url?: string;
  enrollment_date: string;
  notes?: string;
  
  // Classes (double scolarité)
  coranic_class_id?: string;
  french_class_id?: string;
  coranic_class_name?: string;
  coranic_class_level?: string;
  french_class_name?: string;
  french_class_level?: string;
  
  // Année scolaire
  school_year_id?: string;
  school_year_name?: string;
  school_year_start?: string;
  school_year_end?: string;
  is_current_year?: boolean;
  
  // Tuteur principal
  guardian_first_name?: string;
  guardian_last_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_address?: string;
  guardian_relationship?: string;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  
  // Champs calculés (côté client)
  full_name?: string;
  age_display?: string;
  enrollment_date_display?: string;
  status_display?: string;
  gender_display?: string;
}

// ✨ DÉTAILS COMPLETS D'UN ÉTUDIANT

export interface StudentDetails extends Student {
  // Informations complètes des classes
  coranic_class_description?: string;
  french_class_description?: string;
  
  // Tous les tuteurs (pas seulement le principal)
  guardians: Guardian[];
  
  // Historique des paiements récents
  recent_payments: Payment[];
  
  // Statistiques personnelles
  payments_completed?: number;
  payments_overdue?: number;
  total_amount_due?: number;
}

// ✨ TUTEUR/GARDIEN

export interface Guardian {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  relationship: string; // "Père", "Mère", "Oncle", etc.
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
}

// ✨ PAIEMENT

export interface Payment {
  id: string;
  student_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  
  // Champs calculés
  status?: 'paid' | 'pending' | 'overdue';
  amount_remaining?: number;
}

// ✨ CLASSE

export interface Class {
  id: string;
  name: string;
  level: string; // "Débutant", "Intermédiaire", "Avancé"
  type: 'coranic' | 'french';
  description?: string;
  capacity: number;
  teacher_id?: string;
  teacher_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  
  // Statistiques (si incluses)
  student_count?: number;
  utilization_rate?: number;
}

// ✨ ANNÉE SCOLAIRE

export interface SchoolYear {
  id: string;
  name: string; // "2024-2025"
  start_date: string;
  end_date: string;
  is_current: boolean;
  description?: string;
  created_at: string;
  updated_at?: string;
}

// ✨ PARAMÈTRES DE LISTE ET PAGINATION

export interface StudentListParams {
  // Pagination
  page: number;
  limit: number;
  
  // Tri
  sort_by: keyof Student;
  sort_order: 'ASC' | 'DESC';
  
  // Filtres de recherche
  search?: string;
  
  // Filtres spécifiques
  status?: 'interne' | 'externe' | 'archived';
  gender?: 'M' | 'F';
  is_orphan?: boolean;
  coranic_class?: string;
  french_class?: string;
  school_year?: string;
  
  // Filtres de dates
  enrollment_date_from?: string;
  enrollment_date_to?: string;
  age_min?: number;
  age_max?: number;
}

export interface StudentListResponse {
  success: boolean;
  students: Student[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: Partial<StudentListParams>;
}

// ✨ RECHERCHE AVANCÉE

export interface AdvancedSearchParams {
  // Critères multiples
  criteria: SearchCriterion[];
  
  // Opérateur logique entre critères
  operator: 'AND' | 'OR';
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Tri
  sort_by?: keyof Student;
  sort_order?: 'ASC' | 'DESC';
}

export interface SearchCriterion {
  field: keyof Student | 'guardian_info' | 'class_info';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
  value: string | number | boolean;
  value2?: string | number; // Pour l'opérateur 'between'
}

// ✨ CRÉATION ET MODIFICATION

export interface CreateStudentData {
  // Informations personnelles
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  photo_url?: string;
  
  // Statut
  status: 'interne' | 'externe';
  is_orphan: boolean;
  
  // Classes (optionnelles)
  coranic_class_id?: string;
  french_class_id?: string;
  
  // Année scolaire
  school_year_id?: string;
  
  // Notes
  notes?: string;
  
  // Tuteur principal (obligatoire)
  guardian: CreateGuardianData;
  
  // Tuteurs additionnels (optionnels)
  additional_guardians?: CreateGuardianData[];
}

export interface UpdateStudentData {
  // Toutes les propriétés sont optionnelles pour la modification
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: 'M' | 'F';
  status?: 'interne' | 'externe' | 'archived';
  is_orphan?: boolean;
  coranic_class_id?: string;
  french_class_id?: string;
  school_year_id?: string;
  notes?: string;
}

export interface CreateGuardianData {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  relationship: string;
  is_primary?: boolean;
}

// ✨ STATISTIQUES

export interface StudentStats {
  general: {
    total_students: number;
    male_students: number;
    female_students: number;
    orphan_students: number;
    internal_students: number;
    external_students: number;
    average_age: number;
  };
  
  coranic_classes: ClassStats[];
  french_classes: ClassStats[];
  
  enrollment_trend: EnrollmentTrendPoint[];
  
  payments?: {
    students_paid: number;
    students_overdue: number;
    students_pending: number;
    total_amount_due: number;
  };
}

export interface ClassStats {
  id: string;
  name: string;
  level: string;
  type: 'coranic' | 'french';
  capacity: number;
  student_count: number;
  male_count: number;
  female_count: number;
  utilization_rate: number;
  average_age: number;
  orphan_count: number;
  internal_count: number;
  created_at: string;
}

export interface EnrollmentTrendPoint {
  month: string;
  new_enrollments: number;
}

// ✨ IMPORT/EXPORT

export interface ImportResult {
  total_processed: number;
  successful_imports: number;
  failed_imports: number;
  errors: ImportError[];
  created_students: Student[];
  dry_run: boolean;
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ExportParams {
  format: 'csv' | 'json' | 'excel';
  include_guardians: boolean;
  include_payments: boolean;
  filters?: Partial<StudentListParams>;
  columns?: string[];
}

// ✨ RÉINSCRIPTION

export interface ReinscriptionData {
  new_school_year_id: string;
  coranic_class_id?: string;
  french_class_id?: string;
  status?: 'interne' | 'externe';
  notes?: string;
  copy_guardian_info: boolean;
}

// ✨ ÉTATS DE CHARGEMENT

export interface LoadingState {
  list: boolean;
  details: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  upload: boolean;
  stats: boolean;
  import: boolean;
  export: boolean;
}

// ✨ ÉVÉNEMENTS ET NOTIFICATIONS

export interface StudentEvent {
  type: 'created' | 'updated' | 'deleted' | 'photo_uploaded' | 'reinscribed';
  student: Student;
  timestamp: string;
  user_id: string;
  details?: any;
}

export interface StudentNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  student_id?: string;
  auto_dismiss: boolean;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style: 'primary' | 'secondary' | 'danger';
}

// ✨ FILTRES ET RECHERCHE UI

export interface StudentFilters {
  search: string;
  status: 'all' | 'interne' | 'externe' | 'archived';
  gender: 'all' | 'M' | 'F';
  orphan_status: 'all' | 'orphan' | 'non_orphan';
  coranic_class: string | null;
  french_class: string | null;
  school_year: string | null;
  age_range: [number, number];
  enrollment_date_range: [string, string] | null;
}

export interface SearchPreset {
  id: string;
  name: string;
  description: string;
  filters: Partial<StudentFilters>;
  created_by: string;
  is_public: boolean;
  usage_count: number;
}

// ✨ TABLEAUX ET VUES

export interface StudentTableColumn {
  key: keyof Student | 'actions';
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (student: Student) => React.ReactNode;
  exportable?: boolean;
}

export interface StudentTableConfig {
  columns: StudentTableColumn[];
  default_sort: keyof Student;
  default_sort_order: 'asc' | 'desc';
  page_size_options: number[];
  default_page_size: number;
  enable_selection: boolean;
  enable_bulk_actions: boolean;
  compact_mode: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  color: 'primary' | 'secondary' | 'danger' | 'warning';
  action: (studentIds: string[]) => Promise<void>;
  requires_confirmation: boolean;
  confirmation_message?: string;
}

// ✨ FORMULAIRES

export interface StudentFormData extends CreateStudentData {
  // Champs additionnels pour l'UI
  photo_file?: File;
  confirm_guardian_email?: string;
  copy_address_from_student?: boolean;
  send_welcome_sms?: boolean;
}

export interface StudentFormErrors {
  [key: string]: string | string[];
}

export interface StudentFormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  validation: (data: Partial<StudentFormData>) => StudentFormErrors;
  completed: boolean;
  required: boolean;
}

// ✨ RAPPORTS ET ANALYTICS

export interface StudentReport {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'comparison' | 'trend';
  filters: Partial<StudentListParams>;
  generated_at: string;
  generated_by: string;
  data: any;
  format: 'table' | 'chart' | 'mixed';
}

export interface StudentAnalytics {
  total_students: number;
  growth_rate: number;
  retention_rate: number;
  demographic_breakdown: DemographicData[];
  performance_metrics: PerformanceMetric[];
  class_distribution: ClassDistribution[];
  monthly_trends: TrendData[];
}

export interface DemographicData {
  category: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface ClassDistribution {
  class_name: string;
  class_type: 'coranic' | 'french';
  student_count: number;
  capacity: number;
  utilization: number;
}

export interface TrendData {
  period: string;
  enrollments: number;
  withdrawals: number;
  net_change: number;
}

// ✨ PERMISSIONS ET SÉCURITÉ

export interface StudentPermissions {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_upload_photo: boolean;
  can_export: boolean;
  can_import: boolean;
  can_view_payments: boolean;
  can_manage_guardians: boolean;
  can_reinscribe: boolean;
  restricted_fields: string[];
}

// ✨ CONFIGURATION ET PRÉFÉRENCES

export interface StudentModuleConfig {
  auto_generate_student_number: boolean;
  student_number_format: string;
  default_photo_path: string;
  max_photo_size: number;
  allowed_photo_formats: string[];
  enable_double_schooling: boolean;
  require_guardian_email: boolean;
  enable_sms_notifications: boolean;
  auto_archive_after_years: number;
  enable_payment_tracking: boolean;
}

export interface UserPreferences {
  table_config: StudentTableConfig;
  default_filters: Partial<StudentFilters>;
  favorite_presets: string[];
  notification_settings: {
    new_student: boolean;
    photo_uploaded: boolean;
    bulk_operations: boolean;
    export_ready: boolean;
  };
  dashboard_widgets: string[];
}

// ✨ API ET ÉTATS

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: any;
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface StudentState {
  // Données principales
  students: Student[];
  current_student: StudentDetails | null;
  selected_students: string[];
  
  // États de chargement
  loading: LoadingState;
  
  // Filtres et recherche
  filters: StudentFilters;
  search_presets: SearchPreset[];
  active_preset: string | null;
  
  // Pagination
  pagination: StudentListResponse['pagination'] | null;
  
  // Cache
  cache: Map<string, { data: any; timestamp: number }>;
  
  // Erreurs et notifications
  errors: string[];
  notifications: StudentNotification[];
  
  // Statistiques
  stats: StudentStats | null;
  
  // Configuration
  config: StudentModuleConfig;
  permissions: StudentPermissions;
  preferences: UserPreferences;
  
  // Métadonnées
  last_fetch: string | null;
  is_stale: boolean;
}

// ✨ ACTIONS REDUX (SI UTILISÉ)

export type StudentActionType = 
  | 'STUDENTS_FETCH_START'
  | 'STUDENTS_FETCH_SUCCESS'
  | 'STUDENTS_FETCH_ERROR'
  | 'STUDENT_DETAILS_FETCH_START'
  | 'STUDENT_DETAILS_FETCH_SUCCESS'
  | 'STUDENT_DETAILS_FETCH_ERROR'
  | 'STUDENT_CREATE_START'
  | 'STUDENT_CREATE_SUCCESS'
  | 'STUDENT_CREATE_ERROR'
  | 'STUDENT_UPDATE_START'
  | 'STUDENT_UPDATE_SUCCESS'
  | 'STUDENT_UPDATE_ERROR'
  | 'STUDENT_DELETE_START'
  | 'STUDENT_DELETE_SUCCESS'
  | 'STUDENT_DELETE_ERROR'
  | 'STUDENT_PHOTO_UPLOAD_START'
  | 'STUDENT_PHOTO_UPLOAD_SUCCESS'
  | 'STUDENT_PHOTO_UPLOAD_ERROR'
  | 'STUDENTS_FILTERS_UPDATE'
  | 'STUDENTS_SELECTION_UPDATE'
  | 'STUDENTS_CACHE_INVALIDATE'
  | 'STUDENTS_RESET_STATE'
  | 'STUDENT_NOTIFICATION_ADD'
  | 'STUDENT_NOTIFICATION_REMOVE'
  | 'STUDENT_STATS_FETCH_SUCCESS';

export interface StudentAction {
  type: StudentActionType;
  payload?: any;
  error?: string;
  meta?: any;
}

// ✨ HOOKS ET UTILITAIRES

export interface UseStudentsOptions {
  auto_fetch: boolean;
  enable_cache: boolean;
  cache_timeout: number;
  enable_polling: boolean;
  polling_interval: number;
  default_filters: Partial<StudentFilters>;
  on_error: (error: Error) => void;
  on_success: (message: string) => void;
}

export interface UseStudentFormOptions {
  mode: 'create' | 'edit';
  student_id?: string;
  auto_save: boolean;
  auto_save_interval: number;
  validate_on_change: boolean;
  enable_photo_upload: boolean;
}

// ✨ CONSTANTES ET ENUMS

export const STUDENT_STATUS = {
  INTERNE: 'interne',
  EXTERNE: 'externe',
  ARCHIVED: 'archived'
} as const;

export const STUDENT_GENDER = {
  MALE: 'M',
  FEMALE: 'F'
} as const;

export const CLASS_TYPE = {
  CORANIC: 'coranic',
  FRENCH: 'french'
} as const;

export const CLASS_LEVEL = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé'
} as const;

export const GUARDIAN_RELATIONSHIPS = [
  'Père',
  'Mère',
  'Tuteur légal',
  'Grand-père',
  'Grand-mère',
  'Oncle',
  'Tante',
  'Frère',
  'Sœur',
  'Autre'
] as const;

export type GuardianRelationship = typeof GUARDIAN_RELATIONSHIPS[number];

// ✨ EXPORT FINAL

export default Student;