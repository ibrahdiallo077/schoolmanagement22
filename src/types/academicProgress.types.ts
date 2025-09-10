// src/types/academicProgress.types.ts - VERSION CORRIGÉE COMPLÈTE AVEC TOUS LES FILTRES

export interface DiagnosticResult {
  success: boolean;
  tests: DiagnosticTest[];
  summary: DiagnosticSummary;
  error?: string;
}

export interface DiagnosticTest {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  data?: any;
}

export interface DiagnosticSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: 'success' | 'failure' | 'partial' | 'unknown';
}

export interface CreateEvaluationData {
  student_id: string;
  evaluation_date?: string;
  school_year_id?: string;
  class_id?: string;
  current_sourate: string;
  sourate_number?: number | string;
  current_jouzou?: number | string;
  current_hizb?: number | string;
  pages_memorized?: number | string;
  verses_memorized?: number | string;
  memorization_status?: string;
  memorization_grade?: number | string;
  recitation_grade?: number | string;
  tajwid_grade?: number | string;
  behavior_grade?: number | string;
  attendance_rate?: number | string;
  student_behavior?: string;
  teacher_comment?: string;
  next_month_objective?: string;
  difficulties?: string;
  strengths?: string;
}

export interface AcademicEvaluation {
  id: string;
  student_id: string;
  student_name?: string;
  student_number?: string;
  age?: number;
  class_name?: string;
  school_year_name?: string;
  evaluation_date: string;
  evaluation_date_formatted?: string;
  current_sourate: string;
  sourate_number?: number;
  current_jouzou?: number;
  current_hizb?: number;
  pages_memorized: number;
  verses_memorized: number;
  memorization_status: string;
  memorization_grade?: number;
  recitation_grade?: number;
  tajwid_grade?: number;
  behavior_grade?: number;
  overall_grade?: number;
  grade_mention?: string;
  attendance_rate: number;
  student_behavior: string;
  teacher_comment?: string;
  next_month_objective?: string;
  difficulties?: string;
  strengths?: string;
  is_validated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentSelectOption {
  id: string;
  student_number?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  age?: number;
  gender?: string;
  current_class?: {
    id: string;
    name: string;
    level: string;
  } | null;
}

export interface ClassSelectOption {
  id: string;
  name: string;
  level?: string;
  capacity?: number;
  current_students?: number;
  display_name: string;
}

export interface SchoolYearSelectOption {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description?: string;
  display_name: string;
}

export interface StudentInfo {
  id: string;
  student_number?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  age?: number;
  gender?: string;
}

export interface AcademicStats {
  general: {
    total_evaluations: number;
    students_evaluated: number;
    global_average: number;
    average_attendance: number;
    total_pages_memorized: number;
  };
  performance: {
    excellent: { count: number; percentage: string };
    good: { count: number; percentage: string };
    average: { count: number; percentage: string };
    below_average: { count: number; percentage: string };
  };
  subjects: {
    memorization: number;
    recitation: number;
    tajwid: number;
    behavior: number;
  };
}

// ====== INTERFACE COMPLÈTE POUR LES FILTRES ======
export interface EvaluationSearchFilters {
  // Pagination et tri
  page?: number;
  limit?: number;
  sort_by?: 'evaluation_date' | 'overall_grade' | 'student_name' | 'current_sourate';
  sort_order?: 'ASC' | 'DESC';
  
  // Filtres de base
  student_id?: string;
  school_year_id?: string;
  class_id?: string;
  
  // NOUVEAUX FILTRES ALIGNÉS BACKEND
  student_name?: string;        // Recherche par nom d'étudiant
  sourate_name?: string;        // Recherche par nom de sourate
  grade_min?: number;           // Note minimale
  grade_max?: number;           // Note maximale
  memorization_status?: string; // Statut de mémorisation
  date_from?: string;           // Date de début (format YYYY-MM-DD)
  date_to?: string;             // Date de fin (format YYYY-MM-DD)
  student_behavior?: string;    // Comportement étudiant
  has_comments?: boolean;       // Filtrer les évaluations avec commentaires
  is_validated?: boolean;       // Filtrer par statut de validation
}

// ====== INTERFACE ÉTENDUE POUR LES FILTRES AVANCÉS ======
export interface ExtendedEvaluationFilters extends EvaluationSearchFilters {
  // Filtres additionnels pour usage interne
  attendance_min?: number;      // Présence minimale
  attendance_max?: number;      // Présence maximale
  created_from?: string;        // Date de création depuis
  created_to?: string;          // Date de création jusqu'à
  teacher_id?: string;          // Filtrer par enseignant (futur)
  has_objectives?: boolean;     // A des objectifs définis
  has_difficulties?: boolean;   // A des difficultés notées
  has_strengths?: boolean;      // A des forces identifiées
  grade_type?: 'memorization' | 'recitation' | 'tajwid' | 'behavior' | 'overall'; // Type de note à filtrer
}

// ====== INTERFACES POUR LES RÉPONSES API ======
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

export interface EvaluationsApiResponse extends ApiResponse {
  evaluations?: AcademicEvaluation[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied?: Partial<EvaluationSearchFilters>;
}

export interface StudentsApiResponse extends ApiResponse {
  students?: StudentSelectOption[];
  total?: number;
  debug_info?: any;
}

export interface ClassesApiResponse extends ApiResponse {
  classes?: ClassSelectOption[];
  total?: number;
}

export interface SchoolYearsApiResponse extends ApiResponse {
  school_years?: SchoolYearSelectOption[];
  current_year?: SchoolYearSelectOption | null;
  total?: number;
}

export interface StudentHistoryApiResponse extends ApiResponse {
  student?: StudentInfo;
  history?: AcademicEvaluation[];
  summary?: {
    total_evaluations: number;
    period_covered?: {
      from: string;
      to: string;
    } | null;
  };
}

export interface StudentEvolutionApiResponse extends ApiResponse {
  student?: StudentInfo;
  evolution?: AcademicEvaluation[];
  progression_analysis?: {
    grade_trend?: number | null;
    pages_progress?: number | null;
    verses_progress?: number | null;
    recent_performance?: number | null;
  };
  summary?: {
    total_evaluations: number;
    period_covered?: {
      from: string;
      to: string;
    } | null;
    current_level?: {
      sourate: string;
      pages: number;
      last_grade: number;
    } | null;
  };
}

export interface EvaluationPdfApiResponse extends ApiResponse {
  pdf_data?: {
    student: {
      name: string;
      student_number?: string;
      age?: number;
      class: string;
    };
    evaluation: {
      date: string;
      school_year: string;
      created_at: string;
    };
    progress: {
      current_sourate: string;
      sourate_number?: number;
      jouzou?: number;
      hizb?: number;
      pages_memorized: number;
      verses_memorized: number;
    };
    grades: {
      memorization?: number;
      recitation?: number;
      tajwid?: number;
      behavior?: number;
      overall?: number;
      mention?: string;
    };
    attendance: {
      rate: number;
    };
    comments: {
      teacher?: string;
      objectives?: string;
      difficulties?: string;
      strengths?: string;
    };
  };
  filename?: string;
}

// ====== CONSTANTES POUR VALIDATION ======
export const VALIDATION_CONSTANTS = {
  MAX_SOURATE_NUMBER: 114,
  MAX_JOUZOU_NUMBER: 30,
  MAX_HIZB_NUMBER: 60,
  MIN_GRADE: 0,
  MAX_GRADE: 20,
  MIN_ATTENDANCE: 0,
  MAX_ATTENDANCE: 100,
  
  VALID_MEMORIZATION_STATUSES: [
    'non_commence',
    'en_cours', 
    'memorise',
    'perfectionne',
    'a_reviser'
  ] as const,
  
  VALID_BEHAVIOR_VALUES: [
    'excellent',
    'tres_bon',
    'bon',
    'moyen',
    'difficile'
  ] as const,
  
  VALID_SORT_FIELDS: [
    'evaluation_date',
    'overall_grade', 
    'student_name',
    'current_sourate'
  ] as const,
  
  VALID_SORT_ORDERS: ['ASC', 'DESC'] as const
} as const;

// ====== TYPES UTILITAIRES ======
export type MemorizationStatus = typeof VALIDATION_CONSTANTS.VALID_MEMORIZATION_STATUSES[number];
export type StudentBehavior = typeof VALIDATION_CONSTANTS.VALID_BEHAVIOR_VALUES[number];
export type SortField = typeof VALIDATION_CONSTANTS.VALID_SORT_FIELDS[number];
export type SortOrder = typeof VALIDATION_CONSTANTS.VALID_SORT_ORDERS[number];

// ====== INTERFACES POUR LES HOOKS ======
export interface UseEvaluationsResult {
  evaluations: AcademicEvaluation[];
  loading: boolean;
  error: string | null;
  pagination: EvaluationsApiResponse['pagination'] | null;
  refetch: (filters?: EvaluationSearchFilters) => Promise<void>;
  clearError: () => void;
}

export interface UseFormDataResult {
  students: StudentSelectOption[];
  classes: ClassSelectOption[];
  schoolYears: SchoolYearSelectOption[];
  currentSchoolYear?: SchoolYearSelectOption;
  loading: boolean;
  error: string | null;
  studentsLoading: boolean;
  classesLoading: boolean;
  schoolYearsLoading: boolean;
  refetchStudents: (options?: any) => Promise<void>;
  refetchClasses: () => Promise<void>;
  refetchSchoolYears: () => Promise<void>;
  clearError: () => void;
  hasStudents: boolean;
  hasClasses: boolean;
  hasSchoolYears: boolean;
  isInitialized: boolean;
}

export interface UseCreateEvaluationResult {
  createEvaluation: (data: CreateEvaluationData) => Promise<ApiResponse>;
  loading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export interface UseUpdateEvaluationResult {
  updateEvaluation: (evaluationId: string, data: Partial<CreateEvaluationData>) => Promise<ApiResponse>;
  loading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export interface UseDeleteEvaluationResult {
  deleteEvaluation: (evaluationId: string) => Promise<ApiResponse>;
  loading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export interface UseEvaluationDetailsResult {
  evaluation: AcademicEvaluation | null;
  loading: boolean;
  error: string | null;
  fetchEvaluation: (evaluationId: string) => Promise<void>;
  clearEvaluation: () => void;
}

// ====== INTERFACES POUR LES OPTIONS DE REQUÊTE API ======
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  timeout?: number;
  headers?: Record<string, string>;
}

// ====== INTERFACES POUR LES FILTRES DE RECHERCHE ======
export interface FilterOption {
  value: string | number;
  label: string;
  description?: string;
}

export interface GradeRange {
  min: number;
  max: number;
  label: string;
  color?: string;
}

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

// ====== CONSTANTES POUR LES FILTRES ======
export const FILTER_CONSTANTS = {
  MEMORIZATION_STATUS_OPTIONS: [
    { value: 'non_commence', label: 'Non commencé', color: 'gray' },
    { value: 'en_cours', label: 'En cours', color: 'blue' },
    { value: 'memorise', label: 'Mémorisé', color: 'green' },
    { value: 'perfectionne', label: 'Perfectionné', color: 'emerald' },
    { value: 'a_reviser', label: 'À réviser', color: 'yellow' }
  ],
  
  BEHAVIOR_OPTIONS: [
    { value: 'excellent', label: 'Excellent', color: 'green' },
    { value: 'tres_bon', label: 'Très bon', color: 'blue' },
    { value: 'bon', label: 'Bon', color: 'indigo' },
    { value: 'moyen', label: 'Moyen', color: 'yellow' },
    { value: 'difficile', label: 'Difficile', color: 'red' }
  ],
  
  SORT_OPTIONS: [
    { value: 'evaluation_date', label: 'Date d\'évaluation' },
    { value: 'overall_grade', label: 'Note globale' },
    { value: 'student_name', label: 'Nom étudiant' },
    { value: 'current_sourate', label: 'Sourate' }
  ],
  
  GRADE_RANGES: [
    { min: 16, max: 20, label: 'Excellent (16-20)', color: 'green' },
    { min: 14, max: 15.99, label: 'Bien (14-16)', color: 'blue' },
    { min: 12, max: 13.99, label: 'Assez bien (12-14)', color: 'orange' },
    { min: 10, max: 11.99, label: 'Passable (10-12)', color: 'yellow' },
    { min: 0, max: 9.99, label: 'Insuffisant (0-10)', color: 'red' }
  ],
  
  ITEMS_PER_PAGE_OPTIONS: [
    { value: 5, label: '5 par page' },
    { value: 8, label: '8 par page' },
    { value: 12, label: '12 par page' },
    { value: 20, label: '20 par page' },
    { value: 50, label: '50 par page' }
  ]
} as const;

// ====== TYPES POUR LES ACTIONS DE COMPOSANTS ======
export interface EvaluationActionHandlers {
  onView?: (evaluation: AcademicEvaluation) => void;
  onEdit?: (evaluation: AcademicEvaluation) => void;
  onDelete?: (evaluationId: string) => void;
  onDownloadPDF?: (evaluationId: string) => void;
  onDuplicate?: (evaluation: AcademicEvaluation) => void;
  onValidate?: (evaluationId: string) => void;
}

// ====== INTERFACES POUR LES STATISTIQUES ======
export interface PerformanceMetrics {
  total_evaluations: number;
  average_grade: number;
  grade_distribution: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
  };
  attendance_average: number;
  progress_indicators: {
    total_pages: number;
    total_verses: number;
    active_students: number;
  };
}

export interface StudentProgressSummary {
  student_id: string;
  student_name: string;
  latest_evaluation?: AcademicEvaluation;
  total_evaluations: number;
  average_grade: number;
  grade_trend: 'improving' | 'declining' | 'stable' | 'unknown';
  current_sourate: string;
  pages_memorized: number;
  last_evaluation_date: string;
}

// ====== TYPES POUR LA VALIDATION ======
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// ====== TYPES POUR L'EXPORT ======
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: EvaluationSearchFilters;
  include_comments?: boolean;
  include_stats?: boolean;
  date_format?: 'iso' | 'fr' | 'us';
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  total_exported?: number;
  error?: string;
}

// ====== TYPES POUR LES MODALS ET UI ======
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface FormModalProps extends ModalProps {
  loading?: boolean;
  error?: string;
  success?: string;
}

export interface EvaluationModalProps extends FormModalProps {
  students?: StudentSelectOption[];
  classes?: ClassSelectOption[];
  schoolYears?: SchoolYearSelectOption[];
  currentSchoolYear?: SchoolYearSelectOption;
}

// ====== TYPES POUR LES ÉVÉNEMENTS ET CALLBACKS ======
export type EvaluationEventHandler = (evaluation: AcademicEvaluation) => void;
export type EvaluationDeleteHandler = (evaluationId: string) => void;
export type FilterUpdateHandler<T = any> = (key: keyof EvaluationSearchFilters, value: T) => void;
export type FiltersUpdateHandler = (filters: Partial<EvaluationSearchFilters>) => void;

// ====== INTERFACES POUR LES COMPOSANTS DE LISTE ======
export interface ListComponentProps {
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export interface PaginatedListProps extends ListComponentProps {
  pagination?: EvaluationsApiResponse['pagination'];
  onPageChange?: (page: number) => void;
}

// ====== TYPES POUR LES UTILITAIRES ======
export interface GradeMentionConfig {
  min: number;
  max: number;
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
}

export interface StatusConfig {
  value: string;
  label: string;
  color: string;
  icon?: string;
}

// ====== EXPORT DE TOUTES LES INTERFACES ======
export type {
  // Interfaces principales déjà exportées ci-dessus
};

// ====== CONSTANTES D'EXPORT ======
export const DEFAULT_FILTERS: EvaluationSearchFilters = {
  page: 1,
  limit: 8,
  sort_by: 'evaluation_date',
  sort_order: 'DESC'
};

export const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 8,
  total_items: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false
};

export const EMPTY_STATS: AcademicStats = {
  general: {
    total_evaluations: 0,
    students_evaluated: 0,
    global_average: 0,
    average_attendance: 0,
    total_pages_memorized: 0
  },
  performance: {
    excellent: { count: 0, percentage: '0' },
    good: { count: 0, percentage: '0' },
    average: { count: 0, percentage: '0' },
    below_average: { count: 0, percentage: '0' }
  },
  subjects: {
    memorization: 0,
    recitation: 0,
    tajwid: 0,
    behavior: 0
  }
};

// ====== FONCTIONS UTILITAIRES POUR LES TYPES ======

export const isValidGrade = (grade: any): grade is number => {
  const num = Number(grade);
  return !isNaN(num) && num >= 0 && num <= 20;
};

export const isValidAttendanceRate = (rate: any): rate is number => {
  const num = Number(rate);
  return !isNaN(num) && num >= 0 && num <= 100;
};

export const isValidMemorizationStatus = (status: any): status is MemorizationStatus => {
  return VALIDATION_CONSTANTS.VALID_MEMORIZATION_STATUSES.includes(status);
};

export const isValidStudentBehavior = (behavior: any): behavior is StudentBehavior => {
  return VALIDATION_CONSTANTS.VALID_BEHAVIOR_VALUES.includes(behavior);
};

export const isValidSortField = (field: any): field is SortField => {
  return VALIDATION_CONSTANTS.VALID_SORT_FIELDS.includes(field);
};

export const isValidSortOrder = (order: any): order is SortOrder => {
  return VALIDATION_CONSTANTS.VALID_SORT_ORDERS.includes(order);
};

// ====== GUARDS DE TYPE ======

export const isAcademicEvaluation = (obj: any): obj is AcademicEvaluation => {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.student_id === 'string' &&
         typeof obj.current_sourate === 'string' &&
         typeof obj.evaluation_date === 'string' &&
         typeof obj.memorization_status === 'string';
};

export const isStudentSelectOption = (obj: any): obj is StudentSelectOption => {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.first_name === 'string' &&
         typeof obj.last_name === 'string' &&
         typeof obj.full_name === 'string' &&
         typeof obj.display_name === 'string';
};

export const isEvaluationSearchFilters = (obj: any): obj is EvaluationSearchFilters => {
  if (!obj || typeof obj !== 'object') return false;
  
  // Vérifier que toutes les propriétés sont du bon type si présentes
  const optionalStringFields = ['student_id', 'school_year_id', 'class_id', 'student_name', 'sourate_name', 'memorization_status', 'student_behavior', 'date_from', 'date_to'];
  const optionalNumberFields = ['page', 'limit', 'grade_min', 'grade_max'];
  const optionalBooleanFields = ['has_comments', 'is_validated'];
  
  for (const field of optionalStringFields) {
    if (obj[field] !== undefined && typeof obj[field] !== 'string') {
      return false;
    }
  }
  
  for (const field of optionalNumberFields) {
    if (obj[field] !== undefined && typeof obj[field] !== 'number') {
      return false;
    }
  }
  
  for (const field of optionalBooleanFields) {
    if (obj[field] !== undefined && typeof obj[field] !== 'boolean') {
      return false;
    }
  }
  
  return true;
};