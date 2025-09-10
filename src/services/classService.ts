// src/services/classService.ts - Service CORRIGÉ compatible avec services existants
import { useState, useEffect, useCallback } from 'react';
import { 
  ClassData, 
  ClassFormData, 
  ClassResponse, 
  ClassStats, 
  ClassStatsResponse,
  ClassFilters,
  ClassOption,
  SchoolYearOption,
  SchoolYearResponse,
  TeacherOption,
  TeachersResponse,
  ReferenceData,
  UseClassesReturn
} from '@/types/classes.types';

// ===== ✅ IMPORTS DES SERVICES EXISTANTS =====
import { schoolYearService } from './schoolyearService';
import staffService from './staffService';

// Configuration des endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ENDPOINTS = {
  // Classes
  CLASSES: `${API_BASE_URL}/api/classes`,
  CLASS_BY_ID: (id: string) => `${API_BASE_URL}/api/classes/${id}`,
  CLASS_DUPLICATE: (id: string) => `${API_BASE_URL}/api/classes/${id}/duplicate`,
  CLASS_STATS: `${API_BASE_URL}/api/classes/stats/overview`,
  CLASS_SEARCH: (term: string) => `${API_BASE_URL}/api/classes/search/${term}`,
  
  // Enseignants
  TEACHERS_AVAILABLE: `${API_BASE_URL}/api/classes/teachers/available`,
  
  // Années scolaires
  SCHOOL_YEARS: `${API_BASE_URL}/api/school-years`,
  SCHOOL_YEAR_BY_ID: (id: string) => `${API_BASE_URL}/api/school-years/${id}`,
  SCHOOL_YEAR_CURRENT: `${API_BASE_URL}/api/school-years/current`,
  SCHOOL_YEAR_SET_CURRENT: (id: string) => `${API_BASE_URL}/api/school-years/${id}/set-current`
} as const;

// ===== UTILITAIRES =====

/**
 * ✅ Fonction utilitaire CORRIGÉE pour les requêtes API
 */
async function apiRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  // ✅ Récupérer le token depuis plusieurs sources
  const token = localStorage.getItem('auth_token') || 
                sessionStorage.getItem('auth_token') ||
                localStorage.getItem('auth_data')?.replace(/"/g, '');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  console.log(`🔑 Token présent: ${!!token}`);

  const response = await fetch(url, config);

  // ✅ VÉRIFICATION CONTENT-TYPE AVANT PARSING
  const contentType = response.headers.get('content-type');
  console.log(`📄 Content-Type: ${contentType}`);

  if (!response.ok) {
    let errorData: any = {};
    
    // ✅ Gestion différente selon le content-type
    if (contentType?.includes('application/json')) {
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('💥 Erreur parsing JSON error:', parseError);
      }
    } else {
      // Si c'est du HTML, c'est probablement une erreur de routage
      const htmlText = await response.text();
      console.error('❌ Réponse HTML au lieu de JSON:', htmlText.substring(0, 200));
      
      if (response.status === 404) {
        throw new Error(`Endpoint non trouvé: ${url}`);
      } else if (response.status === 401) {
        throw new Error('Token d\'authentification invalide ou expiré');
      } else {
        throw new Error(`Erreur serveur: ${response.status} - Réponse HTML reçue`);
      }
    }
    
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    console.error(`💥 API Error: ${error.message}`);
    throw error;
  }

  // ✅ VÉRIFICATION CONTENT-TYPE POUR RÉPONSE SUCCESS
  if (!contentType?.includes('application/json')) {
    const responseText = await response.text();
    console.error('❌ Réponse non-JSON pour succès:', responseText.substring(0, 200));
    throw new Error('Réponse serveur invalide (HTML au lieu de JSON)');
  }

  const data = await response.json();
  console.log(`✅ API Success: ${url}`);
  return data;
}

/**
 * Fonction pour construire les paramètres de requête
 */
function buildQueryParams(filters: ClassFilters): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

// ===== SERVICE PRINCIPAL POUR LES CLASSES =====

export class ClassService {
  
  /**
   * Récupérer toutes les classes avec filtres
   */
  static async getAll(filters: ClassFilters = {}): Promise<ClassResponse> {
    try {
      const queryParams = buildQueryParams(filters);
      const url = queryParams ? `${ENDPOINTS.CLASSES}?${queryParams}` : ENDPOINTS.CLASSES;
      
      const response = await apiRequest<ClassResponse>(url);
      
      console.log('✅ Classes récupérées:', response.classes?.length || 0);
      
      return response;
    } catch (error: any) {
      console.error('💥 Erreur récupération classes:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des classes',
        classes: []
      };
    }
  }

  /**
   * Récupérer une classe par ID
   */
  static async getById(id: string): Promise<ClassResponse> {
    try {
      const response = await apiRequest<ClassResponse>(ENDPOINTS.CLASS_BY_ID(id));
      return response;
    } catch (error: any) {
      console.error(`💥 Erreur récupération classe ${id}:`, error);
      return {
        success: false,
        error: error.message || 'Classe non trouvée'
      };
    }
  }

  /**
   * Créer une nouvelle classe
   */
  static async create(classData: ClassFormData): Promise<ClassResponse> {
    try {
      console.log('➕ Création classe:', classData.name);
      
      const response = await apiRequest<ClassResponse>(ENDPOINTS.CLASSES, {
        method: 'POST',
        body: JSON.stringify(classData),
      });
      
      console.log('✅ Classe créée:', response.class?.name);
      return response;
    } catch (error: any) {
      console.error('💥 Erreur création classe:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la classe'
      };
    }
  }

  /**
   * Mettre à jour une classe
   */
  static async update(id: string, updateData: Partial<ClassFormData>): Promise<ClassResponse> {
    try {
      console.log('✏️ Modification classe:', id);
      
      const response = await apiRequest<ClassResponse>(ENDPOINTS.CLASS_BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      console.log('✅ Classe modifiée:', response.class?.name);
      return response;
    } catch (error: any) {
      console.error('💥 Erreur modification classe:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la modification de la classe'
      };
    }
  }

  /**
   * Supprimer une classe
   */
  static async delete(id: string): Promise<ClassResponse> {
    try {
      console.log('🗑️ Suppression classe:', id);
      
      const response = await apiRequest<ClassResponse>(ENDPOINTS.CLASS_BY_ID(id), {
        method: 'DELETE',
      });
      
      console.log('✅ Classe supprimée');
      return response;
    } catch (error: any) {
      console.error('💥 Erreur suppression classe:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la classe'
      };
    }
  }

  /**
   * Dupliquer une classe
   */
  static async duplicate(id: string, newName: string, newSchoolYearId?: string): Promise<ClassResponse> {
    try {
      console.log('📋 Duplication classe:', id);
      
      const response = await apiRequest<ClassResponse>(ENDPOINTS.CLASS_DUPLICATE(id), {
        method: 'POST',
        body: JSON.stringify({ 
          new_name: newName,
          new_school_year_id: newSchoolYearId 
        }),
      });
      
      console.log('✅ Classe dupliquée:', response.duplicated_class?.name);
      return response;
    } catch (error: any) {
      console.error('💥 Erreur duplication classe:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la duplication de la classe'
      };
    }
  }

  /**
   * Récupérer les statistiques des classes
   */
  static async getStats(): Promise<ClassStatsResponse> {
    try {
      console.log('📊 Récupération statistiques classes');
      
      const response = await apiRequest<ClassStatsResponse>(ENDPOINTS.CLASS_STATS);
      
      console.log('✅ Statistiques récupérées');
      return response;
    } catch (error: any) {
      console.error('💥 Erreur statistiques classes:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des statistiques'
      };
    }
  }

  /**
   * Rechercher des classes
   */
  static async search(searchTerm: string): Promise<ClassResponse> {
    try {
      if (searchTerm.length < 2) {
        return { success: true, classes: [] };
      }

      const response = await apiRequest<ClassResponse>(ENDPOINTS.CLASS_SEARCH(searchTerm));
      
      console.log('🔍 Recherche effectuée:', response.classes?.length || 0, 'résultats');
      return response;
    } catch (error: any) {
      console.error('💥 Erreur recherche classes:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la recherche',
        classes: []
      };
    }
  }

  /**
   * Récupérer les classes par type
   */
  static async getByType(type: 'coranic' | 'french'): Promise<ClassOption[]> {
    try {
      const response = await this.getAll({ type });
      return response.classes?.map(cls => ({
        id: cls.id,
        name: cls.name,
        level: cls.level,
        type: cls.type,
        description: cls.description,
        capacity: cls.capacity,
        current_students: cls.current_students,
        available_spots: cls.available_spots,
        display_name: `${cls.name} (${cls.level})`,
        is_active: cls.is_active,
        teacher_name: cls.teacher_name,
        created_at: cls.created_at
      })) || [];
    } catch (error) {
      console.error(`💥 Erreur récupération classes ${type}:`, error);
      return [];
    }
  }
}

// ===== ✅ SERVICE POUR LES ENSEIGNANTS UTILISANT STAFFSERVICE =====

class TeacherService {
  
  /**
   * ✅ Récupérer les enseignants disponibles AVEC FALLBACK vers staffService
   */
  static async getAvailable(): Promise<TeachersResponse> {
    try {
      console.log('👨‍🏫 Récupération enseignants disponibles');
      
      // ✅ ESSAYER D'ABORD L'ENDPOINT PRINCIPAL
      try {
        const response = await apiRequest<TeachersResponse>(ENDPOINTS.TEACHERS_AVAILABLE);
        console.log('✅ Enseignants récupérés via endpoint principal:', response.teachers?.length || 0);
        return response;
      } catch (primaryError) {
        console.warn('⚠️ Endpoint principal échoué, utilisation du staffService...', primaryError.message);
        
        // ✅ FALLBACK: Utiliser staffService pour récupérer les enseignants
        const staffResult = await staffService.getStaffList({
          position: 'teacher',
          status: 'active',
          limit: 100
        });
        
        if (staffResult.success && staffResult.staff) {
          // Transformer les données staff en format teachers
          const teachers = staffResult.staff.map((staff: any) => ({
            id: staff.id,
            staff_number: staff.staff_number,
            first_name: staff.first_name,
            last_name: staff.last_name,
            full_name: `${staff.first_name} ${staff.last_name}`,
            display_name: `${staff.first_name} ${staff.last_name} (${staff.staff_number || staff.id.substring(0, 8)})`,
            position: staff.position,
            email: staff.email,
            phone: staff.phone,
            assigned_classes_count: 0
          }));
          
          console.log('✅ Enseignants récupérés via staffService:', teachers.length);
          
          return {
            success: true,
            teachers: teachers,
            total: teachers.length
          };
        } else {
          throw new Error(`Erreur staffService: ${staffResult.error}`);
        }
      }
    } catch (error: any) {
      console.error('💥 Erreur récupération enseignants (tous fallbacks échoués):', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des enseignants',
        teachers: []
      };
    }
  }

  /**
   * ✅ Debug endpoint enseignants avec staffService
   */
  static async debugTeachersEndpoint(): Promise<any> {
    console.log('🔍 === DEBUG ENSEIGNANTS ===');
    
    // Test 1: Endpoint principal
    try {
      const response = await apiRequest(ENDPOINTS.TEACHERS_AVAILABLE);
      console.log('✅ Endpoint principal OK:', response);
      return response;
    } catch (error) {
      console.error('❌ Endpoint principal échoué:', error);
    }
    
    // Test 2: StaffService
    try {
      console.log('🔍 Test staffService...');
      const staffResult = await staffService.getStaffList({ position: 'teacher', status: 'active', limit: 5 });
      console.log('✅ StaffService OK:', staffResult);
      return staffResult;
    } catch (error) {
      console.error('❌ StaffService échoué:', error);
    }
    
    return null;
  }
}

// ===== ✅ SERVICE POUR LES ANNÉES SCOLAIRES UTILISANT SCHOOLYEARSERVICE =====

class SchoolYearService {
  
  /**
   * ✅ Récupérer toutes les années scolaires AVEC FALLBACK vers schoolYearService
   */
  static async getAll(): Promise<SchoolYearResponse> {
    try {
      console.log('📅 Récupération années scolaires');
      
      // ✅ ESSAYER D'ABORD L'ENDPOINT PRINCIPAL
      try {
        const response = await apiRequest<SchoolYearResponse>(ENDPOINTS.SCHOOL_YEARS);
        console.log('✅ Années scolaires récupérées via endpoint principal:', response.school_years?.length || 0);
        return response;
      } catch (primaryError) {
        console.warn('⚠️ Endpoint principal échoué, utilisation du schoolYearService...', primaryError.message);
        
        // ✅ FALLBACK: Utiliser schoolYearService
        const schoolYearResult = await schoolYearService.getAll();
        
        if (schoolYearResult.success && schoolYearResult.school_years) {
          console.log('✅ Années scolaires récupérées via schoolYearService:', schoolYearResult.school_years.length);
          
          return {
            success: true,
            school_years: schoolYearResult.school_years
          };
        } else {
          throw new Error(`Erreur schoolYearService: ${schoolYearResult.error}`);
        }
      }
    } catch (error: any) {
      console.error('💥 Erreur récupération années scolaires:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des années scolaires',
        school_years: []
      };
    }
  }

  /**
   * ✅ Récupérer l'année scolaire courante AVEC FALLBACK
   */
  static async getCurrent(): Promise<SchoolYearOption | null> {
    try {
      console.log('🔄 Récupération année courante');
      
      // Essayer l'endpoint principal
      try {
        const response = await apiRequest<SchoolYearResponse>(ENDPOINTS.SCHOOL_YEAR_CURRENT);
        
        if (response.success && response.school_year) {
          console.log('✅ Année courante via endpoint principal:', response.school_year.name);
          return response.school_year;
        }
      } catch (error) {
        console.warn('⚠️ Endpoint principal échoué, utilisation schoolYearService...');
      }
      
      // Fallback vers schoolYearService
      const currentYearResult = await schoolYearService.getCurrent();
      if (currentYearResult.success && currentYearResult.school_year) {
        console.log('✅ Année courante via schoolYearService:', currentYearResult.school_year.name);
        return currentYearResult.school_year;
      }
      
      // Fallback final : chercher dans la liste
      const allYearsResponse = await this.getAll();
      if (allYearsResponse.success && allYearsResponse.school_years) {
        const currentYear = allYearsResponse.school_years.find(year => year.is_current);
        if (currentYear) {
          console.log('✅ Année courante trouvée dans la liste:', currentYear.name);
          return currentYear;
        }
        
        // Utiliser la première année comme fallback
        if (allYearsResponse.school_years.length > 0) {
          console.log('✅ Utilisation première année:', allYearsResponse.school_years[0].name);
          return allYearsResponse.school_years[0];
        }
      }
      
      return null;
    } catch (error) {
      console.error('💥 Erreur récupération année courante:', error);
      return null;
    }
  }

  /**
   * ✅ Debug endpoint années scolaires avec schoolYearService
   */
  static async debugSchoolYearsEndpoint(): Promise<any> {
    console.log('🔍 === DEBUG ANNÉES SCOLAIRES ===');
    
    // Test 1: Endpoint principal
    try {
      const response = await apiRequest(ENDPOINTS.SCHOOL_YEARS);
      console.log('✅ Endpoint principal OK:', response);
      return response;
    } catch (error) {
      console.error('❌ Endpoint principal échoué:', error);
    }
    
    // Test 2: SchoolYearService
    try {
      console.log('🔍 Test schoolYearService...');
      const schoolYearResult = await schoolYearService.getAll({ limit: 5 });
      console.log('✅ SchoolYearService OK:', schoolYearResult);
      return schoolYearResult;
    } catch (error) {
      console.error('❌ SchoolYearService échoué:', error);
    }
    
    return null;
  }

  // Autres méthodes de SchoolYearService...
  static async setCurrent(id: string): Promise<SchoolYearResponse> {
    try {
      const response = await apiRequest<SchoolYearResponse>(ENDPOINTS.SCHOOL_YEAR_SET_CURRENT(id), {
        method: 'PATCH'
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la définition de l\'année courante'
      };
    }
  }

  static async create(yearData: any): Promise<SchoolYearResponse> {
    try {
      const response = await apiRequest<SchoolYearResponse>(ENDPOINTS.SCHOOL_YEARS, {
        method: 'POST',
        body: JSON.stringify(yearData),
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de l\'année scolaire'
      };
    }
  }

  static async update(id: string, updateData: any): Promise<SchoolYearResponse> {
    try {
      const response = await apiRequest<SchoolYearResponse>(ENDPOINTS.SCHOOL_YEAR_BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la modification de l\'année scolaire'
      };
    }
  }

  static async delete(id: string): Promise<SchoolYearResponse> {
    try {
      const response = await apiRequest<SchoolYearResponse>(ENDPOINTS.SCHOOL_YEAR_BY_ID(id), {
        method: 'DELETE',
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression de l\'année scolaire'
      };
    }
  }
}

// ===== ✅ FONCTION DE TEST RAPIDE COMPATIBLE =====

/**
 * ✅ Fonction de test rapide pour ClassForm utilisant les services existants
 */
export const quickTestForClassForm = async (): Promise<{
  teachers: TeacherOption[];
  schoolYears: SchoolYearOption[];
  errors: string[];
}> => {
  console.log('⚡ Test rapide pour ClassForm avec services existants...');
  
  const errors: string[] = [];
  let teachers: TeacherOption[] = [];
  let schoolYears: SchoolYearOption[] = [];
  
  // Test enseignants avec fallback automatique vers staffService
  try {
    const teachersResponse = await TeacherService.getAvailable();
    if (teachersResponse.success) {
      teachers = teachersResponse.teachers || [];
      console.log('✅ Enseignants OK:', teachers.length);
    } else {
      errors.push(`Enseignants: ${teachersResponse.error}`);
    }
  } catch (error: any) {
    errors.push(`Enseignants: ${error.message}`);
  }
  
  // Test années scolaires avec fallback automatique vers schoolYearService
  try {
    const schoolYearsResponse = await SchoolYearService.getAll();
    if (schoolYearsResponse.success) {
      schoolYears = schoolYearsResponse.school_years || [];
      console.log('✅ Années scolaires OK:', schoolYears.length);
    } else {
      errors.push(`Années scolaires: ${schoolYearsResponse.error}`);
    }
  } catch (error: any) {
    errors.push(`Années scolaires: ${error.message}`);
  }
  
  return { teachers, schoolYears, errors };
};

/**
 * ✅ Debug complet avec les services existants
 */
export const debugAllEndpoints = async (): Promise<void> => {
  console.log('🔍 === DEBUG COMPLET AVEC SERVICES EXISTANTS ===');
  
  // Test authentification
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  console.log('🔑 Token présent:', !!token);
  console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'Aucun');
  
  // Test classes
  try {
    console.log('\n📊 Test Classes...');
    const classesResult = await ClassService.getAll({ limit: 1 });
    console.log('✅ Classes:', classesResult.success ? 'OK' : 'Erreur');
  } catch (error) {
    console.error('❌ Classes échoué');
  }
  
  // Test enseignants
  try {
    console.log('\n👨‍🏫 Test Enseignants...');
    await TeacherService.debugTeachersEndpoint();
  } catch (error) {
    console.error('❌ Debug enseignants échoué');
  }
  
  // Test années scolaires
  try {
    console.log('\n📅 Test Années Scolaires...');
    await SchoolYearService.debugSchoolYearsEndpoint();
  } catch (error) {
    console.error('❌ Debug années scolaires échoué');
  }
  
  console.log('\n✅ === FIN DEBUG COMPLET ===');
};

// ===== HOOKS SIMPLIFIÉS =====

export const useClasses = (initialFilters: ClassFilters = {}): UseClassesReturn => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ClassFilters>(initialFilters);
  const [sorting, setSortingState] = useState<{
    field: 'name' | 'level' | 'type' | 'capacity' | 'occupancy_rate' | 'created_at';
    direction: 'asc' | 'desc';
  }>({ field: 'name', direction: 'asc' });

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ClassService.getAll(filters);
      
      if (response.success && response.classes) {
        setClasses(response.classes);
      } else {
        throw new Error(response.error || 'Erreur de chargement');
      }
    } catch (err: any) {
      console.error('💥 Erreur chargement classes:', err);
      setError(err.message || 'Erreur lors du chargement des classes');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const response = await ClassService.getStats();
      
      if (response.success && response.stats) {
        setStats(response.stats);
      } else {
        console.warn('⚠️ Erreur chargement statistiques:', response.error);
      }
    } catch (err) {
      console.error('💥 Erreur chargement statistiques:', err);
    }
  }, []);

  const createClass = useCallback(async (data: ClassFormData): Promise<ClassResponse> => {
    const response = await ClassService.create(data);
    if (response.success) {
      await loadClasses();
      await loadStats();
    }
    return response;
  }, [loadClasses, loadStats]);

  const updateClass = useCallback(async (id: string, data: Partial<ClassFormData>): Promise<ClassResponse> => {
    const response = await ClassService.update(id, data);
    if (response.success) {
      await loadClasses();
      await loadStats();
    }
    return response;
  }, [loadClasses, loadStats]);

  const deleteClass = useCallback(async (id: string): Promise<ClassResponse> => {
    const response = await ClassService.delete(id);
    if (response.success) {
      await loadClasses();
      await loadStats();
    }
    return response;
  }, [loadClasses, loadStats]);

  const duplicateClass = useCallback(async (id: string, newName: string): Promise<ClassResponse> => {
    const response = await ClassService.duplicate(id, newName);
    if (response.success) {
      await loadClasses();
      await loadStats();
    }
    return response;
  }, [loadClasses, loadStats]);

  const setFilters = useCallback((newFilters: Partial<ClassFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setSorting = useCallback((newSorting: typeof sorting) => {
    setSortingState(newSorting);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadClasses(), loadStats()]);
  }, [loadClasses, loadStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    loadClasses();
    loadStats();
  }, [loadClasses, loadStats]);

  return {
    classes,
    stats,
    isLoading,
    error,
    filters,
    sorting,
    loadClasses,
    loadStats,
    createClass,
    updateClass,
    deleteClass,
    duplicateClass,
    setFilters,
    setSorting,
    clearFilters,
    refresh,
    clearError
  };
};

// ===== ✅ HOOK POUR LES DONNÉES DE RÉFÉRENCE AVEC SERVICES EXISTANTS =====

export const useReferenceData = (): ReferenceData & { refresh: () => void } => {
  const [data, setData] = useState<ReferenceData>({
    classes: {
      coranic: [],
      french: [],
      all: []
    },
    schoolYears: [],
    currentSchoolYear: null,
    teachers: [],
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔄 Chargement données de référence avec services existants...');

      // ✅ Charger toutes les données en parallèle avec les services existants
      const results = await Promise.allSettled([
        ClassService.getAll(),
        SchoolYearService.getAll(),
        TeacherService.getAvailable()
      ]);

      // ✅ Traiter les résultats
      let allClasses: ClassOption[] = [];
      let schoolYears: SchoolYearOption[] = [];
      let teachers: TeacherOption[] = [];

      // Classes
      if (results[0].status === 'fulfilled' && results[0].value.success) {
        allClasses = results[0].value.classes?.map(cls => ({
          id: cls.id,
          name: cls.name,
          level: cls.level,
          type: cls.type,
          description: cls.description,
          capacity: cls.capacity,
          current_students: cls.current_students,
          available_spots: cls.available_spots,
          display_name: `${cls.name} (${cls.level})`,
          is_active: cls.is_active,
          teacher_name: cls.teacher_name,
          created_at: cls.created_at
        })) || [];
        console.log('✅ Classes chargées:', allClasses.length);
      } else {
        console.error('❌ Erreur classes:', results[0].status === 'rejected' ? results[0].reason : 'Classes non disponibles');
      }

      // Années scolaires
      if (results[1].status === 'fulfilled' && results[1].value.success) {
        schoolYears = results[1].value.school_years || [];
        console.log('✅ Années scolaires chargées:', schoolYears.length);
      } else {
        console.error('❌ Erreur années scolaires:', results[1].status === 'rejected' ? results[1].reason : 'Années non disponibles');
      }

      // Enseignants
      if (results[2].status === 'fulfilled' && results[2].value.success) {
        teachers = results[2].value.teachers || [];
        console.log('✅ Enseignants chargés:', teachers.length);
      } else {
        console.error('❌ Erreur enseignants:', results[2].status === 'rejected' ? results[2].reason : 'Enseignants non disponibles');
      }

      const coranicClasses = allClasses.filter(cls => cls.type === 'coranic');
      const frenchClasses = allClasses.filter(cls => cls.type === 'french');

      // Récupérer l'année courante avec fallback
      let currentSchoolYear: SchoolYearOption | null = null;
      try {
        currentSchoolYear = await SchoolYearService.getCurrent();
      } catch (error) {
        console.warn('⚠️ Utilisation de la première année comme courante');
        currentSchoolYear = schoolYears.find(year => year.is_current) || schoolYears[0] || null;
      }

      setData({
        classes: {
          coranic: coranicClasses,
          french: frenchClasses,
          all: allClasses
        },
        schoolYears,
        currentSchoolYear,
        teachers,
        loading: false,
        error: null
      });

      console.log('✅ Données de référence chargées avec succès:', {
        classes: allClasses.length,
        schoolYears: schoolYears.length,
        teachers: teachers.length,
        currentYear: currentSchoolYear?.name || 'Aucune'
      });

    } catch (error: any) {
      console.error('💥 Erreur chargement données de référence:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors du chargement des données'
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    refresh: loadData
  };
};

// ===== ✅ HOOKS DE SÉLECTEURS SIMPLIFIÉS =====

export const useClassSelector = (type?: 'coranic' | 'french') => {
  const [options, setOptions] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const classes = type 
        ? await ClassService.getByType(type)
        : (await ClassService.getAll()).classes?.map(cls => ({
            id: cls.id,
            name: cls.name,
            level: cls.level,
            type: cls.type,
            display_name: `${cls.name} (${cls.level})`,
            is_active: cls.is_active,
            current_students: cls.current_students,
            available_spots: cls.available_spots
          })) || [];

      setOptions(classes);
    } catch (error) {
      console.error('💥 Erreur chargement options classes:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return { options, isLoading, refresh: loadOptions };
};

export const useSchoolYearSelector = () => {
  const [options, setOptions] = useState<SchoolYearOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await SchoolYearService.getAll();
      setOptions(response.school_years || []);
    } catch (error) {
      console.error('💥 Erreur chargement options années:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return { options, isLoading, refresh: loadOptions };
};

export const useTeacherSelector = () => {
  const [options, setOptions] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await TeacherService.getAvailable();
      setOptions(response.teachers || []);
    } catch (error) {
      console.error('💥 Erreur chargement options enseignants:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return { options, isLoading, refresh: loadOptions };
};

// ===== EXPORTS =====
export { 
  ClassService as default, 
  SchoolYearService, 
  TeacherService,
  apiRequest,
  buildQueryParams,
  ENDPOINTS
};