// src/services/academicProgressService.ts - VERSION FINALE QUI FONCTIONNE

import { apiClient, ApiResponse } from './apiClient';

// === TYPES ===
interface AcademicEvaluation {
  id: string;
  student_id?: string;
  student_name?: string;
  student_number?: string;
  current_sourate?: string;
  sourate_number?: number;
  current_jouzou?: number;
  current_hizb?: number;
  pages_memorized?: number;
  verses_memorized?: number;
  overall_grade?: number | string;
  memorization_grade?: number | string;
  recitation_grade?: number | string;
  tajwid_grade?: number | string;
  behavior_grade?: number | string;
  grade_mention?: string;
  memorization_status?: string;
  attendance_rate?: number;
  evaluation_date: string;
  evaluation_date_formatted?: string;
  class_name?: string;
  school_year_name?: string;
  age?: number;
  is_validated?: boolean;
  teacher_comment?: string;
  next_month_objective?: string;
  difficulties?: string;
  strengths?: string;
  student_behavior?: string;
}

interface EvaluationSearchFilters {
  student_id?: string;
  student_name?: string;
  school_year_id?: string;
  class_id?: string;
  sourate_name?: string;
  grade_min?: number;
  grade_max?: number;
  memorization_status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

interface CreateEvaluationData {
  student_id: string;
  evaluation_date?: string;
  school_year_id?: string;
  class_id?: string;
  current_sourate: string;
  sourate_number?: number;
  current_jouzou?: number;
  current_hizb?: number;
  pages_memorized?: number;
  verses_memorized?: number;
  memorization_status?: string;
  memorization_grade?: number;
  recitation_grade?: number;
  tajwid_grade?: number;
  behavior_grade?: number;
  attendance_rate?: number;
  student_behavior?: string;
  teacher_comment?: string;
  next_month_objective?: string;
  difficulties?: string;
  strengths?: string;
}

interface StudentSelectOption {
  id: string;
  display_name: string;
  student_number?: string;
  class_name?: string;
}

interface ClassSelectOption {
  id: string;
  display_name: string;
  type?: string;
  level?: string;
}

interface SchoolYearSelectOption {
  id: string;
  display_name: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// === CLASSE SERVICE ===
class AcademicProgressService {
  private readonly baseEndpoint = '/academic-progress';

  constructor() {
    console.log('AcademicProgressService initialisé');
  }

  // === MÉTHODE UTILITAIRE POUR CONSTRUIRE LES URLS AVEC PARAMÈTRES ===
  private buildUrlWithParams(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }

    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  // === TEST DE CONNEXION ===
  async testConnection(): Promise<ApiResponse> {
    try {
      console.log('Test connexion academic-progress...');
      const response = await apiClient.get(`${this.baseEndpoint}/test`);
      console.log('Réponse test:', response);
      return response;
    } catch (error) {
      console.error('Erreur test connexion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  }

  // === ÉTUDIANTS POUR SELECT ===
  async getStudentsForSelect(params?: { 
    limit?: number; 
    class_id?: string; 
    school_year_id?: string; 
    search?: string; 
  }): Promise<ApiResponse & { 
    students?: StudentSelectOption[];
    total_count?: number;
  }> {
    try {
      console.log('Service - Récupération étudiants pour select:', params);
      
      // Construction de l'URL selon les routes backend définies
      const endpoint = `${this.baseEndpoint}/data/students-select`;
      const url = this.buildUrlWithParams(endpoint, {
        limit: params?.limit || 100,
        class_id: params?.class_id,
        school_year_id: params?.school_year_id,
        search: params?.search
      });
      
      console.log('URL construite pour étudiants:', url);
      
      const response = await apiClient.get(url);
      console.log('Réponse étudiants:', response);

      // Adaptation de la réponse selon le format backend
      return {
        success: response.success !== false,
        students: response.students || [],
        total_count: response.total || 0,
        error: response.error
      };
    } catch (error) {
      console.error('Erreur récupération étudiants:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération étudiants',
        students: []
      };
    }
  }

  // === CLASSES POUR SELECT ===
  async getClassesForSelect(): Promise<ApiResponse & { 
    classes?: ClassSelectOption[];
    total_count?: number;
  }> {
    try {
      console.log('Service - Récupération classes pour select');
      
      const endpoint = `${this.baseEndpoint}/data/classes-select`;
      console.log('URL classes:', endpoint);
      
      const response = await apiClient.get(endpoint);
      console.log('Réponse classes:', response);

      return {
        success: response.success !== false,
        classes: response.classes || [],
        total_count: response.total || 0,
        error: response.error
      };
    } catch (error) {
      console.error('Erreur récupération classes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération classes',
        classes: []
      };
    }
  }

  // === ANNÉES SCOLAIRES POUR SELECT ===
  async getSchoolYearsForSelect(): Promise<ApiResponse & { 
    school_years?: SchoolYearSelectOption[];
    current_year?: SchoolYearSelectOption;
    total_count?: number;
  }> {
    try {
      console.log('Service - Récupération années scolaires pour select');
      
      const endpoint = `${this.baseEndpoint}/data/school-years-select`;
      console.log('URL années scolaires:', endpoint);
      
      const response = await apiClient.get(endpoint);
      console.log('Réponse années scolaires:', response);

      return {
        success: response.success !== false,
        school_years: response.school_years || [],
        current_year: response.current_year || null,
        total_count: response.total || 0,
        error: response.error
      };
    } catch (error) {
      console.error('Erreur récupération années scolaires:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération années scolaires',
        school_years: []
      };
    }
  }

  // === ÉVALUATIONS AVEC FILTRES ===
  async getEvaluations(filters: EvaluationSearchFilters): Promise<ApiResponse & { 
    evaluations?: AcademicEvaluation[];
    pagination?: PaginationInfo;
    filters_applied?: EvaluationSearchFilters;
  }> {
    try {
      console.log('Service - Récupération évaluations avec filtres:', filters);
      
      // Valeurs par défaut sûres pour éviter les erreurs 400
      const safeFilters: Record<string, any> = {
        page: Math.max(1, filters.page || 1),
        limit: Math.min(50, Math.max(1, filters.limit || 8)),
        sort_by: filters.sort_by || 'evaluation_date',
        sort_order: (filters.sort_order === 'ASC' || filters.sort_order === 'DESC') ? filters.sort_order : 'DESC'
      };
      
      // Ajouter uniquement les filtres non vides et valides
      if (filters.student_id?.trim()) {
        safeFilters.student_id = filters.student_id.trim();
      }
      if (filters.student_name?.trim()) {
        safeFilters.student_name = filters.student_name.trim();
      }
      if (filters.school_year_id?.trim()) {
        safeFilters.school_year_id = filters.school_year_id.trim();
      }
      if (filters.class_id?.trim()) {
        safeFilters.class_id = filters.class_id.trim();
      }
      if (filters.sourate_name?.trim()) {
        safeFilters.sourate_name = filters.sourate_name.trim();
      }
      if (filters.memorization_status?.trim()) {
        safeFilters.memorization_status = filters.memorization_status.trim();
      }
      
      // Filtres numériques avec validation
      if (typeof filters.grade_min === 'number' && filters.grade_min >= 0 && filters.grade_min <= 20) {
        safeFilters.grade_min = filters.grade_min;
      }
      if (typeof filters.grade_max === 'number' && filters.grade_max >= 0 && filters.grade_max <= 20) {
        safeFilters.grade_max = filters.grade_max;
      }
      
      // Filtres de dates avec validation simple
      if (filters.date_from?.trim()) {
        safeFilters.date_from = filters.date_from.trim();
      }
      if (filters.date_to?.trim()) {
        safeFilters.date_to = filters.date_to.trim();
      }

      // Construction de l'URL - selon votre backend, les évaluations sont sur la route racine
      const url = this.buildUrlWithParams(this.baseEndpoint, safeFilters);
      
      console.log('URL évaluations construite:', url);
      console.log('Paramètres sécurisés envoyés:', safeFilters);
      
      const response = await apiClient.get(url);
      console.log('Réponse évaluations:', {
        success: response.success,
        hasEvaluations: !!response.evaluations,
        count: response.evaluations?.length || 0,
        hasPagination: !!response.pagination
      });

      return {
        success: response.success !== false,
        evaluations: response.evaluations || [],
        pagination: response.pagination || null,
        filters_applied: safeFilters,
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur évaluations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération évaluations',
        evaluations: []
      };
    }
  }

  // === CRÉER ÉVALUATION ===
  async createEvaluation(evaluationData: CreateEvaluationData): Promise<ApiResponse & { 
    evaluation?: AcademicEvaluation;
    evaluation_id?: string;
    message?: string;
  }> {
    try {
      console.log('Service - Création évaluation:', evaluationData);
      
      // Validation de base
      if (!evaluationData.student_id?.trim()) {
        throw new Error('ID étudiant requis');
      }
      
      if (!evaluationData.current_sourate?.trim()) {
        throw new Error('Nom de la sourate requis');
      }

      // Nettoyage des données vides
      const cleanData = Object.fromEntries(
        Object.entries(evaluationData).filter(([_, value]) => 
          value !== undefined && value !== null && 
          !(typeof value === 'string' && value.trim() === '')
        )
      );

      console.log('Données nettoyées pour création:', cleanData);

      const response = await apiClient.post(this.baseEndpoint, cleanData);
      console.log('Service - Réponse création:', response);

      return {
        success: response.success !== false,
        evaluation: response.evaluation || null,
        evaluation_id: response.evaluation_id || response.evaluation?.id,
        message: response.message || 'Évaluation créée avec succès',
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur création évaluation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur création évaluation'
      };
    }
  }

  // === MODIFIER ÉVALUATION ===
  async updateEvaluation(
    evaluationId: string, 
    evaluationData: Partial<CreateEvaluationData>
  ): Promise<ApiResponse & { 
    evaluation?: AcademicEvaluation;
    message?: string;
  }> {
    try {
      console.log('Service - Modification évaluation:', evaluationId, evaluationData);
      
      if (!evaluationId?.trim()) {
        throw new Error('ID évaluation requis');
      }

      // Nettoyage des données vides
      const cleanData = Object.fromEntries(
        Object.entries(evaluationData).filter(([_, value]) => 
          value !== undefined && value !== null && 
          !(typeof value === 'string' && value.trim() === '')
        )
      );

      if (Object.keys(cleanData).length === 0) {
        throw new Error('Aucune donnée à modifier');
      }

      console.log('Données nettoyées pour modification:', cleanData);

      const response = await apiClient.put(`${this.baseEndpoint}/${evaluationId}`, cleanData);
      console.log('Service - Réponse modification:', response);

      return {
        success: response.success !== false,
        evaluation: response.evaluation || null,
        message: response.message || 'Évaluation modifiée avec succès',
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur modification évaluation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur modification évaluation'
      };
    }
  }

  // === SUPPRIMER ÉVALUATION ===
  async deleteEvaluation(evaluationId: string): Promise<ApiResponse & { 
    message?: string;
  }> {
    try {
      console.log('Service - Suppression évaluation:', evaluationId);
      
      if (!evaluationId?.trim()) {
        throw new Error('ID évaluation requis');
      }

      const response = await apiClient.delete(`${this.baseEndpoint}/${evaluationId}`);
      console.log('Service - Réponse suppression:', response);

      return {
        success: response.success !== false,
        message: response.message || 'Évaluation supprimée avec succès',
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur suppression évaluation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur suppression évaluation'
      };
    }
  }

  // === RÉCUPÉRER ÉVALUATION PAR ID ===
  async getEvaluationById(evaluationId: string): Promise<ApiResponse & { 
    evaluation?: AcademicEvaluation;
  }> {
    try {
      console.log('Service - Récupération évaluation par ID:', evaluationId);
      
      if (!evaluationId?.trim()) {
        throw new Error('ID évaluation requis');
      }

      const response = await apiClient.get(`${this.baseEndpoint}/${evaluationId}`);
      console.log('Service - Réponse évaluation par ID:', response);

      return {
        success: response.success !== false,
        evaluation: response.evaluation || null,
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur évaluation par ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération évaluation'
      };
    }
  }

  // === STATISTIQUES ===
  async getOverviewStats(): Promise<ApiResponse & any> {
    try {
      console.log('Service - Récupération statistiques');
      
      const response = await apiClient.get(`${this.baseEndpoint}/stats/overview`);
      console.log('Service - Réponse statistiques:', response);

      return {
        success: response.success !== false,
        general: response.general || {},
        performance: response.performance || {},
        subjects: response.subjects || {},
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur statistiques:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération statistiques',
        general: {},
        performance: {},
        subjects: {}
      };
    }
  }

  // === HISTORIQUE ÉTUDIANT ===
  async getStudentHistory(studentId: string, limit: number = 20): Promise<ApiResponse & {
    student?: any;
    history?: AcademicEvaluation[];
    summary?: any;
  }> {
    try {
      console.log('Service - Récupération historique étudiant:', studentId);
      
      if (!studentId?.trim()) {
        throw new Error('ID étudiant requis');
      }

      const url = this.buildUrlWithParams(`${this.baseEndpoint}/students/${studentId}`, { limit });
      const response = await apiClient.get(url);
      console.log('Service - Réponse historique étudiant:', response);

      return {
        success: response.success !== false,
        student: response.student || null,
        history: response.history || [],
        summary: response.summary || null,
        error: response.error
      };
    } catch (error) {
      console.error('Service - Erreur historique étudiant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur récupération historique',
        history: []
      };
    }
  }

  // === MÉTHODES DE DIAGNOSTIC ===
  async runDiagnostic(): Promise<ApiResponse & any> {
    console.log('=== DIAGNOSTIC ACADEMIC PROGRESS SERVICE ===');
    
    const results: any = {
      connection: null,
      endpoints: {},
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Test connexion de base
      console.log('1. Test connexion basique...');
      const healthCheck = await this.testConnection();
      results.connection = {
        status: healthCheck.success ? 'OK' : 'ERREUR',
        message: healthCheck.success ? 'Service connecté' : (healthCheck.error || 'Erreur connexion'),
        details: healthCheck
      };

      // 2. Test étudiants
      console.log('2. Test étudiants...');
      try {
        const studentsTest = await this.getStudentsForSelect({ limit: 1 });
        results.endpoints.students = {
          status: studentsTest.success ? 'OK' : 'ERREUR',
          error: studentsTest.error || null,
          data_count: studentsTest.students?.length || 0
        };
      } catch (err) {
        results.endpoints.students = { 
          status: 'ERREUR', 
          error: err instanceof Error ? err.message : 'Erreur inconnue' 
        };
      }

      // 3. Test classes
      console.log('3. Test classes...');
      try {
        const classesTest = await this.getClassesForSelect();
        results.endpoints.classes = {
          status: classesTest.success ? 'OK' : 'ERREUR',
          error: classesTest.error || null,
          data_count: classesTest.classes?.length || 0
        };
      } catch (err) {
        results.endpoints.classes = { 
          status: 'ERREUR', 
          error: err instanceof Error ? err.message : 'Erreur inconnue' 
        };
      }

      // 4. Test années scolaires
      console.log('4. Test années scolaires...');
      try {
        const yearsTest = await this.getSchoolYearsForSelect();
        results.endpoints.school_years = {
          status: yearsTest.success ? 'OK' : 'ERREUR',
          error: yearsTest.error || null,
          data_count: yearsTest.school_years?.length || 0,
          current_year: yearsTest.current_year?.display_name || null
        };
      } catch (err) {
        results.endpoints.school_years = { 
          status: 'ERREUR', 
          error: err instanceof Error ? err.message : 'Erreur inconnue' 
        };
      }

      // 5. Test évaluations basic
      console.log('5. Test évaluations basic...');
      try {
        const evaluationsTest = await this.getEvaluations({ page: 1, limit: 1 });
        results.endpoints.evaluations = {
          status: evaluationsTest.success ? 'OK' : 'ERREUR',
          error: evaluationsTest.error || null,
          data_count: evaluationsTest.evaluations?.length || 0,
          pagination: evaluationsTest.pagination || null
        };
      } catch (err) {
        results.endpoints.evaluations = { 
          status: 'ERREUR', 
          error: err instanceof Error ? err.message : 'Erreur inconnue' 
        };
      }

      console.log('=== FIN DIAGNOSTIC ===');
      console.log('Résultats:', results);

      return {
        success: true,
        ...results
      };

    } catch (error) {
      console.error('Erreur diagnostic global:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur diagnostic',
        ...results
      };
    }
  }

  // === TEST SIMPLE POUR VÉRIFIER QUE LE SERVICE FONCTIONNE ===
  async testBasicFunctionality(): Promise<boolean> {
    try {
      console.log('=== TEST FONCTIONNALITÉ BASIQUE ===');
      
      // Test 1: Connexion
      const connection = await this.testConnection();
      if (!connection.success) {
        console.error('❌ Test connexion échoué:', connection.error);
        return false;
      }
      console.log('✅ Test connexion réussi');

      // Test 2: Étudiants
      const students = await this.getStudentsForSelect({ limit: 1 });
      if (!students.success) {
        console.error('❌ Test étudiants échoué:', students.error);
        return false;
      }
      console.log('✅ Test étudiants réussi');

      // Test 3: Évaluations sans filtres
      const evaluations = await this.getEvaluations({ page: 1, limit: 1 });
      if (!evaluations.success) {
        console.error('❌ Test évaluations échoué:', evaluations.error);
        return false;
      }
      console.log('✅ Test évaluations réussi');

      console.log('✅ TOUS LES TESTS BASIQUES RÉUSSIS');
      return true;

    } catch (error) {
      console.error('❌ Erreur test basique:', error);
      return false;
    }
  }
}

// === INSTANCE SINGLETON ===
export const academicProgressService = new AcademicProgressService();

// === EXPORT PAR DÉFAUT ===
export default academicProgressService;