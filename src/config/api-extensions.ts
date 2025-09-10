// src/config/api-extensions.ts - Extensions API pour les modules étudiants
import { API_ENDPOINTS } from './api';

// Obtenir l'URL de base depuis votre configuration existante
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✨ NOUVEAUX ENDPOINTS pour le module étudiant
export const STUDENT_API_ENDPOINTS = {
  // === GESTION DES ÉTUDIANTS ===
  STUDENTS: `${API_BASE_URL}/api/students`,
  STUDENT_BY_ID: (id: string) => `${API_BASE_URL}/api/students/${id}`,
  STUDENT_PHOTO: (id: string) => `${API_BASE_URL}/api/students/${id}/photo`,
  STUDENT_CHECK_NUMBER: (number: string) => `${API_BASE_URL}/api/students/check-number/${number}`,
  STUDENTS_SEARCH: `${API_BASE_URL}/api/students/search/quick`,
  STUDENTS_STATS: `${API_BASE_URL}/api/students/stats/overview`,
  STUDENT_RESTORE: (id: string) => `${API_BASE_URL}/api/students/${id}/restore`,
  
  // === GESTION DES CLASSES ===
  CLASSES: `${API_BASE_URL}/api/classes`,
  CLASSES_BY_TYPE: (type: string) => `${API_BASE_URL}/api/classes?type=${type}`,
  CLASS_BY_ID: (id: string) => `${API_BASE_URL}/api/classes/${id}`,
  CORANIC_CLASSES: `${API_BASE_URL}/api/classes?type=coranic`,
  FRENCH_CLASSES: `${API_BASE_URL}/api/classes?type=french`,
  
  // === GESTION DES ANNÉES SCOLAIRES ===
  SCHOOL_YEARS: `${API_BASE_URL}/api/school-years`,
  CURRENT_SCHOOL_YEAR: `${API_BASE_URL}/api/school-years/current`,
  SCHOOL_YEAR_BY_ID: (id: string) => `${API_BASE_URL}/api/school-years/${id}`,
  
  // === GESTION DES TUTEURS ===
  GUARDIANS: `${API_BASE_URL}/api/guardians`,
  GUARDIAN_BY_ID: (id: string) => `${API_BASE_URL}/api/guardians/${id}`,
  STUDENT_GUARDIANS: (studentId: string) => `${API_BASE_URL}/api/students/${studentId}/guardians`,
  
  // === RAPPORTS ET STATISTIQUES ===
  ENROLLMENT_REPORT: `${API_BASE_URL}/api/reports/enrollment`,
  CLASS_DISTRIBUTION: `${API_BASE_URL}/api/reports/class-distribution`,
  ORPHAN_STUDENTS: `${API_BASE_URL}/api/students?is_orphan=true`,
  INTERNAL_STUDENTS: `${API_BASE_URL}/api/students?status=interne`,
  
  // === IMPORTS ET EXPORTS ===
  IMPORT_STUDENTS: `${API_BASE_URL}/api/students/import`,
  EXPORT_STUDENTS: `${API_BASE_URL}/api/students/export`,
  EXPORT_TEMPLATE: `${API_BASE_URL}/api/students/export-template`,
};

// ✨ Extension de votre configuration API existante
export const EXTENDED_API_ENDPOINTS = {
  ...API_ENDPOINTS,
  ...STUDENT_API_ENDPOINTS,
};

// ✨ Types spécifiques aux modules étudiants
export interface StudentApiResponse {
  success: boolean;
  message?: string;
  student?: any;
  students?: any[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied?: Record<string, any>;
  error?: string;
  details?: string[];
}

export interface ClassApiResponse {
  success: boolean;
  message?: string;
  class?: any;
  classes?: any[];
  error?: string;
}

export interface SchoolYearApiResponse {
  success: boolean;
  message?: string;
  school_year?: any;
  school_years?: any[];
  error?: string;
}

export interface GuardianApiResponse {
  success: boolean;
  message?: string;
  guardian?: any;
  guardians?: any[];
  error?: string;
}

// ✨ Configuration spécifique aux étudiants
export const STUDENT_API_CONFIG = {
  // Pagination par défaut
  defaultPagination: {
    page: 1,
    limit: 20,
    maxLimit: 100
  },
  
  // Filtres disponibles
  availableFilters: [
    'search',
    'status',
    'gender', 
    'is_orphan',
    'is_needy',
    'coranic_class',
    'french_class',
    'school_year',
    'age_min',
    'age_max'
  ],
  
  // Options de tri
  sortOptions: [
    'created_at',
    'first_name',
    'last_name',
    'birth_date',
    'student_number',
    'enrollment_date'
  ],
  
  // Upload photo
  photoUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    endpoint: STUDENT_API_ENDPOINTS.STUDENT_PHOTO
  },
  
  // Validation
  validation: {
    name: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/
    },
    phone: {
      minLength: 8,
      maxLength: 15,
      pattern: /^[0-9+\s()-]+$/
    },
    age: {
      min: 3,
      max: 25
    }
  }
};

// ✨ Fonctions utilitaires pour les requêtes étudiants
export const buildStudentListUrl = (params: Record<string, any> = {}): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${STUDENT_API_ENDPOINTS.STUDENTS}?${queryString}` : STUDENT_API_ENDPOINTS.STUDENTS;
};

export const buildClassListUrl = (type?: 'coranic' | 'french'): string => {
  if (type) {
    return STUDENT_API_ENDPOINTS.CLASSES_BY_TYPE(type);
  }
  return STUDENT_API_ENDPOINTS.CLASSES;
};

// ✨ Validation des endpoints (pour debug)
export const validateApiEndpoints = (): {
  valid: boolean;
  endpoints: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let validCount = 0;
  
  Object.entries(STUDENT_API_ENDPOINTS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (value.startsWith('http')) {
        validCount++;
      } else {
        errors.push(`${key}: URL invalide - ${value}`);
      }
    } else if (typeof value === 'function') {
      try {
        const testUrl = value('test-id');
        if (testUrl.startsWith('http')) {
          validCount++;
        } else {
          errors.push(`${key}: Fonction génère URL invalide - ${testUrl}`);
        }
      } catch (e) {
        errors.push(`${key}: Erreur fonction - ${e}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    endpoints: validCount,
    errors
  };
};

// ✨ Log de configuration (pour debug en développement)
if (import.meta.env.DEV) {
  const validation = validateApiEndpoints();
  console.log('🔧 Extensions API Étudiants chargées:', {
    baseUrl: API_BASE_URL,
    endpoints: Object.keys(STUDENT_API_ENDPOINTS).length,
    validation: validation.valid ? '✅ Tous valides' : `❌ ${validation.errors.length} erreurs`,
    features: [
      '✅ CRUD Étudiants complet',
      '✅ Gestion classes & années',
      '✅ Upload photos sécurisé', 
      '✅ Recherche & filtres avancés',
      '✅ Statistiques & rapports',
      '✅ Compatible API v3.0'
    ]
  });
  
  if (!validation.valid) {
    console.warn('⚠️ Erreurs dans les endpoints:', validation.errors);
  }
}

export default EXTENDED_API_ENDPOINTS;// src/config/api-extensions.ts - Extensions API pour les modules étudiants
import { API_ENDPOINTS } from './api';

// Obtenir l'URL de base depuis votre configuration existante
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✨ NOUVEAUX ENDPOINTS pour le module étudiant
export const STUDENT_API_ENDPOINTS = {
  // === GESTION DES ÉTUDIANTS ===
  STUDENTS: `${API_BASE_URL}/api/students`,
  STUDENT_BY_ID: (id: string) => `${API_BASE_URL}/api/students/${id}`,
  STUDENT_PHOTO: (id: string) => `${API_BASE_URL}/api/students/${id}/photo`,
  STUDENT_CHECK_NUMBER: (number: string) => `${API_BASE_URL}/api/students/check-number/${number}`,
  STUDENTS_SEARCH: `${API_BASE_URL}/api/students/search/quick`,
  STUDENTS_STATS: `${API_BASE_URL}/api/students/stats/overview`,
  STUDENT_RESTORE: (id: string) => `${API_BASE_URL}/api/students/${id}/restore`,
  
  // === GESTION DES CLASSES ===
  CLASSES: `${API_BASE_URL}/api/classes`,
  CLASSES_BY_TYPE: (type: string) => `${API_BASE_URL}/api/classes?type=${type}`,
  CLASS_BY_ID: (id: string) => `${API_BASE_URL}/api/classes/${id}`,
  CORANIC_CLASSES: `${API_BASE_URL}/api/classes?type=coranic`,
  FRENCH_CLASSES: `${API_BASE_URL}/api/classes?type=french`,
  
  // === GESTION DES ANNÉES SCOLAIRES ===
  SCHOOL_YEARS: `${API_BASE_URL}/api/school-years`,
  CURRENT_SCHOOL_YEAR: `${API_BASE_URL}/api/school-years/current`,
  SCHOOL_YEAR_BY_ID: (id: string) => `${API_BASE_URL}/api/school-years/${id}`,
  
  // === GESTION DES TUTEURS ===
  GUARDIANS: `${API_BASE_URL}/api/guardians`,
  GUARDIAN_BY_ID: (id: string) => `${API_BASE_URL}/api/guardians/${id}`,
  STUDENT_GUARDIANS: (studentId: string) => `${API_BASE_URL}/api/students/${studentId}/guardians`,
  
  // === RAPPORTS ET STATISTIQUES ===
  ENROLLMENT_REPORT: `${API_BASE_URL}/api/reports/enrollment`,
  CLASS_DISTRIBUTION: `${API_BASE_URL}/api/reports/class-distribution`,
  ORPHAN_STUDENTS: `${API_BASE_URL}/api/students?is_orphan=true`,
  INTERNAL_STUDENTS: `${API_BASE_URL}/api/students?status=interne`,
  
  // === IMPORTS ET EXPORTS ===
  IMPORT_STUDENTS: `${API_BASE_URL}/api/students/import`,
  EXPORT_STUDENTS: `${API_BASE_URL}/api/students/export`,
  EXPORT_TEMPLATE: `${API_BASE_URL}/api/students/export-template`,
};

// ✨ Extension de votre configuration API existante
export const EXTENDED_API_ENDPOINTS = {
  ...API_ENDPOINTS,
  ...STUDENT_API_ENDPOINTS,
};

// ✨ Types spécifiques aux modules étudiants
export interface StudentApiResponse {
  success: boolean;
  message?: string;
  student?: any;
  students?: any[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied?: Record<string, any>;
  error?: string;
  details?: string[];
}

export interface ClassApiResponse {
  success: boolean;
  message?: string;
  class?: any;
  classes?: any[];
  error?: string;
}

export interface SchoolYearApiResponse {
  success: boolean;
  message?: string;
  school_year?: any;
  school_years?: any[];
  error?: string;
}

export interface GuardianApiResponse {
  success: boolean;
  message?: string;
  guardian?: any;
  guardians?: any[];
  error?: string;
}

// ✨ Configuration spécifique aux étudiants
export const STUDENT_API_CONFIG = {
  // Pagination par défaut
  defaultPagination: {
    page: 1,
    limit: 20,
    maxLimit: 100
  },
  
  // Filtres disponibles
  availableFilters: [
    'search',
    'status',
    'gender', 
    'is_orphan',
    'is_needy',
    'coranic_class',
    'french_class',
    'school_year',
    'age_min',
    'age_max'
  ],
  
  // Options de tri
  sortOptions: [
    'created_at',
    'first_name',
    'last_name',
    'birth_date',
    'student_number',
    'enrollment_date'
  ],
  
  // Upload photo
  photoUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    endpoint: STUDENT_API_ENDPOINTS.STUDENT_PHOTO
  },
  
  // Validation
  validation: {
    name: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/
    },
    phone: {
      minLength: 8,
      maxLength: 15,
      pattern: /^[0-9+\s()-]+$/
    },
    age: {
      min: 3,
      max: 25
    }
  }
};

// ✨ Fonctions utilitaires pour les requêtes étudiants
export const buildStudentListUrl = (params: Record<string, any> = {}): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${STUDENT_API_ENDPOINTS.STUDENTS}?${queryString}` : STUDENT_API_ENDPOINTS.STUDENTS;
};

export const buildClassListUrl = (type?: 'coranic' | 'french'): string => {
  if (type) {
    return STUDENT_API_ENDPOINTS.CLASSES_BY_TYPE(type);
  }
  return STUDENT_API_ENDPOINTS.CLASSES;
};

// ✨ Validation des endpoints (pour debug)
export const validateApiEndpoints = (): {
  valid: boolean;
  endpoints: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let validCount = 0;
  
  Object.entries(STUDENT_API_ENDPOINTS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (value.startsWith('http')) {
        validCount++;
      } else {
        errors.push(`${key}: URL invalide - ${value}`);
      }
    } else if (typeof value === 'function') {
      try {
        const testUrl = value('test-id');
        if (testUrl.startsWith('http')) {
          validCount++;
        } else {
          errors.push(`${key}: Fonction génère URL invalide - ${testUrl}`);
        }
      } catch (e) {
        errors.push(`${key}: Erreur fonction - ${e}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    endpoints: validCount,
    errors
  };
};

// ✨ Log de configuration (pour debug en développement)
if (import.meta.env.DEV) {
  const validation = validateApiEndpoints();
  console.log('🔧 Extensions API Étudiants chargées:', {
    baseUrl: API_BASE_URL,
    endpoints: Object.keys(STUDENT_API_ENDPOINTS).length,
    validation: validation.valid ? '✅ Tous valides' : `❌ ${validation.errors.length} erreurs`,
    features: [
      '✅ CRUD Étudiants complet',
      '✅ Gestion classes & années',
      '✅ Upload photos sécurisé', 
      '✅ Recherche & filtres avancés',
      '✅ Statistiques & rapports',
      '✅ Compatible API v3.0'
    ]
  });
  
  if (!validation.valid) {
    console.warn('⚠️ Erreurs dans les endpoints:', validation.errors);
  }
}

export default EXTENDED_API_ENDPOINTS;// src/config/api-extensions.ts - Extensions API pour les modules étudiants
import { API_ENDPOINTS } from './api';

// Obtenir l'URL de base depuis votre configuration existante
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✨ NOUVEAUX ENDPOINTS pour le module étudiant
export const STUDENT_API_ENDPOINTS = {
  // === GESTION DES ÉTUDIANTS ===
  STUDENTS: `${API_BASE_URL}/api/students`,
  STUDENT_BY_ID: (id: string) => `${API_BASE_URL}/api/students/${id}`,
  STUDENT_PHOTO: (id: string) => `${API_BASE_URL}/api/students/${id}/photo`,
  STUDENT_CHECK_NUMBER: (number: string) => `${API_BASE_URL}/api/students/check-number/${number}`,
  STUDENTS_SEARCH: `${API_BASE_URL}/api/students/search/quick`,
  STUDENTS_STATS: `${API_BASE_URL}/api/students/stats/overview`,
  STUDENT_RESTORE: (id: string) => `${API_BASE_URL}/api/students/${id}/restore`,
  
  // === GESTION DES CLASSES ===
  CLASSES: `${API_BASE_URL}/api/classes`,
  CLASSES_BY_TYPE: (type: string) => `${API_BASE_URL}/api/classes?type=${type}`,
  CLASS_BY_ID: (id: string) => `${API_BASE_URL}/api/classes/${id}`,
  CORANIC_CLASSES: `${API_BASE_URL}/api/classes?type=coranic`,
  FRENCH_CLASSES: `${API_BASE_URL}/api/classes?type=french`,
  
  // === GESTION DES ANNÉES SCOLAIRES ===
  SCHOOL_YEARS: `${API_BASE_URL}/api/school-years`,
  CURRENT_SCHOOL_YEAR: `${API_BASE_URL}/api/school-years/current`,
  SCHOOL_YEAR_BY_ID: (id: string) => `${API_BASE_URL}/api/school-years/${id}`,
  
  // === GESTION DES TUTEURS ===
  GUARDIANS: `${API_BASE_URL}/api/guardians`,
  GUARDIAN_BY_ID: (id: string) => `${API_BASE_URL}/api/guardians/${id}`,
  STUDENT_GUARDIANS: (studentId: string) => `${API_BASE_URL}/api/students/${studentId}/guardians`,
  
  // === RAPPORTS ET STATISTIQUES ===
  ENROLLMENT_REPORT: `${API_BASE_URL}/api/reports/enrollment`,
  CLASS_DISTRIBUTION: `${API_BASE_URL}/api/reports/class-distribution`,
  ORPHAN_STUDENTS: `${API_BASE_URL}/api/students?is_orphan=true`,
  INTERNAL_STUDENTS: `${API_BASE_URL}/api/students?status=interne`,
  
  // === IMPORTS ET EXPORTS ===
  IMPORT_STUDENTS: `${API_BASE_URL}/api/students/import`,
  EXPORT_STUDENTS: `${API_BASE_URL}/api/students/export`,
  EXPORT_TEMPLATE: `${API_BASE_URL}/api/students/export-template`,
};

// ✨ Extension de votre configuration API existante
export const EXTENDED_API_ENDPOINTS = {
  ...API_ENDPOINTS,
  ...STUDENT_API_ENDPOINTS,
};

// ✨ Types spécifiques aux modules étudiants
export interface StudentApiResponse {
  success: boolean;
  message?: string;
  student?: any;
  students?: any[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied?: Record<string, any>;
  error?: string;
  details?: string[];
}

export interface ClassApiResponse {
  success: boolean;
  message?: string;
  class?: any;
  classes?: any[];
  error?: string;
}

export interface SchoolYearApiResponse {
  success: boolean;
  message?: string;
  school_year?: any;
  school_years?: any[];
  error?: string;
}

export interface GuardianApiResponse {
  success: boolean;
  message?: string;
  guardian?: any;
  guardians?: any[];
  error?: string;
}

// ✨ Configuration spécifique aux étudiants
export const STUDENT_API_CONFIG = {
  // Pagination par défaut
  defaultPagination: {
    page: 1,
    limit: 20,
    maxLimit: 100
  },
  
  // Filtres disponibles
  availableFilters: [
    'search',
    'status',
    'gender', 
    'is_orphan',
    'is_needy',
    'coranic_class',
    'french_class',
    'school_year',
    'age_min',
    'age_max'
  ],
  
  // Options de tri
  sortOptions: [
    'created_at',
    'first_name',
    'last_name',
    'birth_date',
    'student_number',
    'enrollment_date'
  ],
  
  // Upload photo
  photoUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    endpoint: STUDENT_API_ENDPOINTS.STUDENT_PHOTO
  },
  
  // Validation
  validation: {
    name: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/
    },
    phone: {
      minLength: 8,
      maxLength: 15,
      pattern: /^[0-9+\s()-]+$/
    },
    age: {
      min: 3,
      max: 25
    }
  }
};

// ✨ Fonctions utilitaires pour les requêtes étudiants
export const buildStudentListUrl = (params: Record<string, any> = {}): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${STUDENT_API_ENDPOINTS.STUDENTS}?${queryString}` : STUDENT_API_ENDPOINTS.STUDENTS;
};

export const buildClassListUrl = (type?: 'coranic' | 'french'): string => {
  if (type) {
    return STUDENT_API_ENDPOINTS.CLASSES_BY_TYPE(type);
  }
  return STUDENT_API_ENDPOINTS.CLASSES;
};

// ✨ Validation des endpoints (pour debug)
export const validateApiEndpoints = (): {
  valid: boolean;
  endpoints: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let validCount = 0;
  
  Object.entries(STUDENT_API_ENDPOINTS).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (value.startsWith('http')) {
        validCount++;
      } else {
        errors.push(`${key}: URL invalide - ${value}`);
      }
    } else if (typeof value === 'function') {
      try {
        const testUrl = value('test-id');
        if (testUrl.startsWith('http')) {
          validCount++;
        } else {
          errors.push(`${key}: Fonction génère URL invalide - ${testUrl}`);
        }
      } catch (e) {
        errors.push(`${key}: Erreur fonction - ${e}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    endpoints: validCount,
    errors
  };
};

// ✨ Log de configuration (pour debug en développement)
if (import.meta.env.DEV) {
  const validation = validateApiEndpoints();
  console.log('🔧 Extensions API Étudiants chargées:', {
    baseUrl: API_BASE_URL,
    endpoints: Object.keys(STUDENT_API_ENDPOINTS).length,
    validation: validation.valid ? '✅ Tous valides' : `❌ ${validation.errors.length} erreurs`,
    features: [
      '✅ CRUD Étudiants complet',
      '✅ Gestion classes & années',
      '✅ Upload photos sécurisé', 
      '✅ Recherche & filtres avancés',
      '✅ Statistiques & rapports',
      '✅ Compatible API v3.0'
    ]
  });
  
  if (!validation.valid) {
    console.warn('⚠️ Erreurs dans les endpoints:', validation.errors);
  }
}

export default EXTENDED_API_ENDPOINTS;