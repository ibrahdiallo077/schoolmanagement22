// src/types/classes.types.ts - Types TypeScript pour le système de gestion des classes

// ===== TYPES DE BASE =====

export type ClassType = 'coranic' | 'french';
export type ClassStatus = 'active' | 'inactive';
export type ClassLevel = 
  | 'CP1' | 'CP2' | 'CE1' | 'CE2' | 'CM1' | 'CM2'
  | '6ème' | '5ème' | '4ème' | '3ème'
  | 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Memorisation';

// ===== INTERFACES PRINCIPALES =====

/**
 * Interface principale pour une classe
 */
export interface ClassData {
  id: string;
  name: string;
  level: string;
  type: ClassType;
  description?: string;
  capacity: number;
  teacher_id?: string;
  teacher_name?: string;
  monthly_fee: number;
  is_active: boolean;
  school_year_id?: string;
  created_at: string;
  updated_at?: string;
  
  // Données calculées côté serveur
  current_students?: number;
  available_spots?: number;
  occupancy_rate?: number;
  male_students?: number;
  female_students?: number;
  status_display?: string;
  status_color?: 'success' | 'warning' | 'danger' | 'secondary';
  type_display?: string;
  
  // Relations
  school_year?: SchoolYearRelation;
  teacher?: TeacherRelation;
}

/**
 * Interface pour les relations avec les années scolaires
 */
export interface SchoolYearRelation {
  id: string;
  name: string;
  is_current: boolean;
  start_date?: string;
  end_date?: string;
}

/**
 * Interface pour les relations avec les enseignants
 */
export interface TeacherRelation {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  position: string;
  phone?: string;
  email?: string;
}

/**
 * Interface pour les options de classe (selects)
 */
export interface ClassOption {
  id: string;
  name: string;
  level: string;
  type: ClassType;
  description?: string;
  capacity?: number;
  current_students?: number;
  available_spots?: number;
  display_name?: string;
  is_active?: boolean;
  teacher_name?: string;
  school_year_name?: string;
  created_at?: string;
}

/**
 * Interface pour les données de formulaire
 */
export interface ClassFormData {
  name: string;
  level: string;
  type: ClassType;
  description: string;
  capacity: number;
  teacher_id: string;
  school_year_id: string;
  monthly_fee: number;
  is_active: boolean;
}

/**
 * Interface pour les statistiques des classes
 */
export interface ClassStats {
  general: {
    total_classes: number;
    active_classes: number;
    inactive_classes: number;
    coranic_classes: number;
    french_classes: number;
    total_capacity: number;
    average_capacity: number;
    average_monthly_fee: number;
    classes_with_teacher: number;
    total_students: number;
    average_occupancy: number;
  };
  by_type: Array<{
    type: ClassType;
    class_count: number;
    total_capacity: number;
    total_students: number;
    average_occupancy_rate: number;
  }>;
  top_classes: Array<{
    id: string;
    name: string;
    level: string;
    type: ClassType;
    capacity: number;
    current_students: number;
    occupancy_rate: number;
    teacher_name?: string;
  }>;
  by_level: Array<{
    level: string;
    type: ClassType;
    class_count: number;
    total_capacity: number;
  }>;
}

// ===== TYPES POUR LES RÉPONSES API =====

/**
 * Réponse API pour les classes
 */
export interface ClassResponse {
  success: boolean;
  classes?: ClassData[];
  class?: ClassData;
  error?: string;
  message?: string;
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  filters?: {
    active?: string;
    type?: string;
    school_year_id?: string;
    search?: string;
  };
}

/**
 * Réponse API pour les statistiques
 */
export interface ClassStatsResponse {
  success: boolean;
  stats?: ClassStats;
  error?: string;
  generated_at?: string;
}

/**
 * Réponse API pour les enseignants disponibles
 */
export interface TeachersResponse {
  success: boolean;
  teachers?: TeacherOption[];
  error?: string;
  total?: number;
}

/**
 * Interface pour les options d'enseignant
 */
export interface TeacherOption {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  position: string;
  phone?: string;
  email?: string;
  full_name: string;
  display_name: string;
  assigned_classes_count: number;
}

// ===== TYPES POUR LES FILTRES ET RECHERCHE =====

/**
 * Paramètres de recherche et filtrage
 */
export interface ClassFilters {
  search?: string;
  type?: ClassType | 'all';
  status?: 'all' | 'active' | 'inactive';
  teacher?: 'all' | 'with' | 'without';
  school_year_id?: string;
  level?: string;
  limit?: number;
  offset?: number;
}

/**
 * Paramètres de tri
 */
export interface ClassSorting {
  field: 'name' | 'level' | 'type' | 'capacity' | 'occupancy_rate' | 'created_at';
  direction: 'asc' | 'desc';
}

// ===== TYPES POUR LES ANNÉES SCOLAIRES =====

/**
 * Interface pour les années scolaires
 */
export interface SchoolYearOption {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description?: string;
  created_at?: string;
  start_date_formatted?: string;
  end_date_formatted?: string;
  display_name?: string;
  status?: string;
  progress_percentage?: number;
  total_classes?: number;
  total_students?: number;
}

/**
 * Réponse API pour les années scolaires
 */
export interface SchoolYearResponse {
  success: boolean;
  school_years?: SchoolYearOption[];
  school_year?: SchoolYearOption;
  error?: string;
  message?: string;
}

// ===== TYPES POUR LES PROPS DES COMPOSANTS =====

/**
 * Props pour le composant ClassCard
 */
export interface ClassCardProps {
  classData: ClassData;
  onEdit?: (classData: ClassData) => void;
  onDelete?: (classData: ClassData) => void;
  onView?: (classData: ClassData) => void;
  onDuplicate?: (classData: ClassData) => void;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * Props pour le composant ClassForm
 */
export interface ClassFormProps {
  classData?: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClassFormData) => Promise<void>;
  mode?: 'create' | 'edit';
  title?: string;
  className?: string;
}

/**
 * Props pour le composant ClassList
 */
export interface ClassListProps {
  onEdit?: (classData: ClassData) => void;
  onDelete?: (classData: ClassData) => void;
  onView?: (classData: ClassData) => void;
  onDuplicate?: (classData: ClassData) => void;
  onCreate?: () => void;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
  filters?: ClassFilters;
  sorting?: ClassSorting;
}

/**
 * Props pour le composant ClassStats
 */
export interface ClassStatsProps {
  className?: string;
  compact?: boolean;
  showTitle?: boolean;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

// ===== TYPES POUR LES HOOKS =====

/**
 * Retour du hook useClasses
 */
export interface UseClassesReturn {
  classes: ClassData[];
  stats: ClassStats | null;
  isLoading: boolean;
  error: string | null;
  filters: ClassFilters;
  sorting: ClassSorting;
  
  // Actions
  loadClasses: () => Promise<void>;
  loadStats: () => Promise<void>;
  createClass: (data: ClassFormData) => Promise<ClassResponse>;
  updateClass: (id: string, data: Partial<ClassFormData>) => Promise<ClassResponse>;
  deleteClass: (id: string) => Promise<ClassResponse>;
  duplicateClass: (id: string, newName: string) => Promise<ClassResponse>;
  
  // Filtrage et tri
  setFilters: (filters: Partial<ClassFilters>) => void;
  setSorting: (sorting: ClassSorting) => void;
  clearFilters: () => void;
  
  // Utilitaires
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Retour du hook useClassForm
 */
export interface UseClassFormReturn {
  formData: ClassFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  teachers: TeacherOption[];
  schoolYears: SchoolYearOption[];
  isLoadingData: boolean;
  
  // Actions
  updateField: (field: keyof ClassFormData, value: any) => void;
  validateForm: () => boolean;
  submitForm: (onSave: (data: ClassFormData) => Promise<void>) => Promise<void>;
  resetForm: () => void;
  loadFormData: () => Promise<void>;
  
  // Génération automatique
  generateClassName: (type: ClassType) => void;
}

// ===== TYPES POUR LES DONNÉES DE RÉFÉRENCE =====

/**
 * Interface pour les données de référence
 */
export interface ReferenceData {
  classes: {
    coranic: ClassOption[];
    french: ClassOption[];
    all: ClassOption[];
  };
  schoolYears: SchoolYearOption[];
  currentSchoolYear: SchoolYearOption | null;
  teachers: TeacherOption[];
  loading: boolean;
  error: string | null;
}

// ===== CONSTANTES ET ENUMS =====

/**
 * Options pour les niveaux de classe
 */
export const CLASS_LEVELS: Array<{value: string; label: string; category: string}> = [
  // Niveaux primaires français
  { value: 'CP1', label: 'CP1 - Cours Préparatoire 1', category: 'Primaire' },
  { value: 'CP2', label: 'CP2 - Cours Préparatoire 2', category: 'Primaire' },
  { value: 'CE1', label: 'CE1 - Cours Élémentaire 1', category: 'Primaire' },
  { value: 'CE2', label: 'CE2 - Cours Élémentaire 2', category: 'Primaire' },
  { value: 'CM1', label: 'CM1 - Cours Moyen 1', category: 'Primaire' },
  { value: 'CM2', label: 'CM2 - Cours Moyen 2', category: 'Primaire' },
  
  // Niveaux collège
  { value: '6ème', label: '6ème - Sixième', category: 'Collège' },
  { value: '5ème', label: '5ème - Cinquième', category: 'Collège' },
  { value: '4ème', label: '4ème - Quatrième', category: 'Collège' },
  { value: '3ème', label: '3ème - Troisième', category: 'Collège' },
  
  // Niveaux coraniques
  { value: 'Débutant', label: 'Débutant - Niveau initiation', category: 'Coranique' },
  { value: 'Intermédiaire', label: 'Intermédiaire - Niveau moyen', category: 'Coranique' },
  { value: 'Avancé', label: 'Avancé - Niveau expert', category: 'Coranique' },
  { value: 'Memorisation', label: 'Mémorisation - Hifz', category: 'Coranique' }
];

/**
 * Configuration des types de classe
 */
export const CLASS_TYPES = {
  coranic: {
    value: 'coranic',
    label: 'Coranique',
    icon: '🕌',
    color: 'emerald',
    description: 'Enseignement religieux islamique'
  },
  french: {
    value: 'french',
    label: 'Française',
    icon: '🇫🇷',
    color: 'blue',
    description: 'Programme national français'
  }
} as const;

/**
 * Configuration des couleurs de statut
 */
export const STATUS_COLORS = {
  success: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  secondary: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200'
  }
} as const;

// ===== TYPES UTILITAIRES =====

/**
 * Type pour les erreurs de validation
 */
export type ValidationErrors = Record<keyof ClassFormData, string>;

/**
 * Type pour les actions sur les classes
 */
export type ClassAction = 'create' | 'edit' | 'delete' | 'duplicate' | 'view' | 'export';

/**
 * Type pour les modes d'affichage
 */
export type ViewMode = 'grid' | 'list' | 'compact';

export default ClassData;