// src/types/schoolyear.types.ts - Types TypeScript pour les années scolaires

export interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  
  // Champs calculés du backend
  status_display?: string;
  status_color?: string;
  duration_days?: number;
  progress_percentage?: number | null;
  start_date_formatted?: string;
  end_date_formatted?: string;
  
  // Statistiques (optionnelles selon l'endpoint)
  total_students?: number;
  total_classes?: number;
  active_classes?: number;
  male_students?: number;
  female_students?: number;
  orphan_students?: number;
  total_capacity?: number;
  occupancy_rate?: number;
  
  // Pour les formulaires
  display_name?: string;
}

export interface CreateSchoolYearRequest {
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_current?: boolean;
}

export interface UpdateSchoolYearRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_current?: boolean;
}

export interface SchoolYearListResponse {
  success: boolean;
  school_years: SchoolYear[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface SchoolYearResponse {
  success: boolean;
  school_year: SchoolYear | null;
  message?: string;
}

export interface SchoolYearStatsResponse {
  success: boolean;
  stats: {
    general: {
      total_years: number;
      current_years: number;
      past_years: number;
      future_years: number;
      earliest_start: string;
      latest_end: string;
    };
    enrollment_evolution: Array<{
      year_name: string;
      start_date: string;
      total_students: number;
      male_students: number;
      female_students: number;
      orphan_students: number;
      total_classes: number;
    }>;
    recent_years_comparison: Array<{
      name: string;
      is_current: boolean;
      students_count: number;
      classes_count: number;
      total_capacity: number;
      occupancy_rate: number;
    }>;
  };
  generated_at: string;
}

// Filtres pour la liste
export interface SchoolYearFilters {
  current_only?: boolean;
  include_stats?: boolean;
  include_past?: boolean;
  limit?: number;
  offset?: number;
}

// État du formulaire
export interface SchoolYearFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  schoolYear: SchoolYear | null;
  isLoading: boolean;
  errors: Record<string, string>;
}

// Options pour les sélecteurs
export interface SchoolYearOption {
  id: string;
  name: string;
  display_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

// État global des années scolaires
export interface SchoolYearState {
  schoolYears: SchoolYear[];
  currentSchoolYear: SchoolYear | null;
  schoolYearOptions: SchoolYearOption[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  stats: SchoolYearStatsResponse['stats'] | null;
}

// Actions du store/hook
export type SchoolYearAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SCHOOL_YEARS'; payload: SchoolYear[] }
  | { type: 'SET_CURRENT_SCHOOL_YEAR'; payload: SchoolYear | null }
  | { type: 'SET_SCHOOL_YEAR_OPTIONS'; payload: SchoolYearOption[] }
  | { type: 'SET_STATS'; payload: SchoolYearStatsResponse['stats'] }
  | { type: 'ADD_SCHOOL_YEAR'; payload: SchoolYear }
  | { type: 'UPDATE_SCHOOL_YEAR'; payload: SchoolYear }
  | { type: 'REMOVE_SCHOOL_YEAR'; payload: string }
  | { type: 'SET_LAST_UPDATED'; payload: string };

// Validation des données
export interface SchoolYearValidation {
  name: string[];
  start_date: string[];
  end_date: string[];
  description: string[];
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  details?: string | string[];
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

// Constantes
export const SCHOOL_YEAR_STATUS = {
  PAST: 'Terminée',
  CURRENT: 'En cours',
  FUTURE: 'Future',
  ACTIVE: 'Active'
} as const;

export const SCHOOL_YEAR_STATUS_COLORS = {
  PAST: 'secondary',
  CURRENT: 'success',
  FUTURE: 'info',
  ACTIVE: 'primary'
} as const;

export type SchoolYearStatus = keyof typeof SCHOOL_YEAR_STATUS;