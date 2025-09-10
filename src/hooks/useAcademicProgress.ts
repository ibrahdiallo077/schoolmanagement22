// src/hooks/useAcademicProgress.ts - VERSION CORRIGÉE SANS ERREURS

import { useState, useEffect, useCallback, useRef } from 'react';
import { academicProgressService } from '../services/academicProgressService';

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

// === HOOK DE DIAGNOSTIC ===
export const useDiagnosticAcademicProgress = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  const runDiagnostic = useCallback(async () => {
    setDiagnosticLoading(true);
    console.log('Lancement diagnostic academic progress...');
    
    try {
      const results = await academicProgressService.runDiagnostic();
      setDiagnosticResults(results);
      console.log('Résultats diagnostic:', results);
      return results;
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      setDiagnosticResults({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur diagnostic'
      });
    } finally {
      setDiagnosticLoading(false);
    }
  }, []);

  return {
    diagnosticResults,
    diagnosticLoading,
    runDiagnostic
  };
};

// === HOOK POUR LES DONNÉES DE FORMULAIRES ===
export interface UseFormDataResult {
  students: StudentSelectOption[];
  classes: ClassSelectOption[];
  schoolYears: SchoolYearSelectOption[];
  loading: boolean;
  error: string | null;
  refetchStudents: () => Promise<void>;
  refetchClasses: () => Promise<void>;
  refetchSchoolYears: () => Promise<void>;
  hasStudents: boolean;
  currentSchoolYear?: SchoolYearSelectOption;
  retry: () => Promise<void>;
  runDiagnostic: () => Promise<any>;
}

export const useFormData = (): UseFormDataResult => {
  const [students, setStudents] = useState<StudentSelectOption[]>([]);
  const [classes, setClasses] = useState<ClassSelectOption[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearSelectOption[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<SchoolYearSelectOption>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isInitializedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchStudents = useCallback(async () => {
    try {
      console.log('Chargement étudiants - Tentative', retryCountRef.current + 1);
      const response = await academicProgressService.getStudentsForSelect({ limit: 100 });
      
      if (response?.success && Array.isArray(response.students)) {
        setStudents(response.students);
        console.log('Étudiants chargés:', response.students.length);
        retryCountRef.current = 0;
      } else {
        console.warn('Réponse étudiants inattendue:', response);
        setStudents([]);
        if (response?.error) {
          setError(`Étudiants: ${response.error}`);
        }
      }
    } catch (err) {
      console.error('Erreur chargement étudiants:', err);
      setStudents([]);
      setError('Erreur de connexion étudiants');
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      console.log('Chargement classes - Tentative', retryCountRef.current + 1);
      const response = await academicProgressService.getClassesForSelect();
      
      if (response?.success && Array.isArray(response.classes)) {
        setClasses(response.classes);
        console.log('Classes chargées:', response.classes.length);
        retryCountRef.current = 0;
      } else {
        console.warn('Réponse classes inattendue:', response);
        const fallbackClasses = [
          { id: 'class-1', display_name: 'Coranique - Niveau 1', type: 'coranique', level: '1' },
          { id: 'class-2', display_name: 'Coranique - Niveau 2', type: 'coranique', level: '2' },
          { id: 'class-3', display_name: 'Française - CP', type: 'française', level: 'CP' },
          { id: 'class-4', display_name: 'Française - CE1', type: 'française', level: 'CE1' },
        ];
        setClasses(fallbackClasses);
        console.log('Classes fallback utilisées');
        
        if (response?.error) {
          setError(`Classes: ${response.error}`);
        }
      }
    } catch (err) {
      console.error('Erreur chargement classes:', err);
      const fallbackClasses = [
        { id: 'fallback-1', display_name: 'Coranique - Débutant', type: 'coranique', level: 'débutant' },
        { id: 'fallback-2', display_name: 'Française - Élémentaire', type: 'française', level: 'élémentaire' },
      ];
      setClasses(fallbackClasses);
      setError('Classes indisponibles - données temporaires chargées');
    }
  }, []);

  const fetchSchoolYears = useCallback(async () => {
    try {
      console.log('Chargement années scolaires - Tentative', retryCountRef.current + 1);
      const response = await academicProgressService.getSchoolYearsForSelect();
      
      if (response?.success && Array.isArray(response.school_years)) {
        setSchoolYears(response.school_years);
        setCurrentSchoolYear(response.current_year || response.school_years.find(y => y.is_current) || response.school_years[0]);
        console.log('Années scolaires chargées:', response.school_years.length);
        console.log('Année courante:', response.current_year?.display_name);
        retryCountRef.current = 0;
      } else {
        console.warn('Réponse années scolaires inattendue:', response);
        const currentYear = new Date().getFullYear();
        const fallbackYears = [
          { 
            id: 'current-year', 
            display_name: `${currentYear}-${currentYear + 1}`, 
            is_current: true,
            start_date: `${currentYear}-09-01`,
            end_date: `${currentYear + 1}-06-30`
          }
        ];
        setSchoolYears(fallbackYears);
        setCurrentSchoolYear(fallbackYears[0]);
        console.log('Année scolaire fallback utilisée');
        
        if (response?.error) {
          setError(`Années scolaires: ${response.error}`);
        }
      }
    } catch (err) {
      console.error('Erreur chargement années scolaires:', err);
      const currentYear = new Date().getFullYear();
      const fallbackYear = { 
        id: 'fallback-year', 
        display_name: `${currentYear}-${currentYear + 1}`, 
        is_current: true 
      };
      setSchoolYears([fallbackYear]);
      setCurrentSchoolYear(fallbackYear);
      setError('Années scolaires indisponibles - année courante chargée');
    }
  }, []);

  const retryAll = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      console.warn('Nombre maximum de tentatives atteint');
      setError('Impossible de charger les données après 3 tentatives');
      return;
    }
    
    retryCountRef.current++;
    setError(null);
    setLoading(true);
    
    try {
      await Promise.allSettled([
        fetchStudents(),
        fetchClasses(),
        fetchSchoolYears()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStudents, fetchClasses, fetchSchoolYears]);

  const runDiagnostic = useCallback(async () => {
    console.log('Lancement diagnostic depuis useFormData...');
    return await academicProgressService.runDiagnostic();
  }, []);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      const loadData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          await Promise.allSettled([
            fetchStudents(),
            fetchClasses(),
            fetchSchoolYears()
          ]);
        } catch (globalError) {
          console.error('Erreur globale chargement données:', globalError);
          setError('Erreur de chargement global');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [fetchStudents, fetchClasses, fetchSchoolYears]);

  return {
    students,
    classes,
    schoolYears,
    currentSchoolYear,
    loading,
    error,
    refetchStudents: fetchStudents,
    refetchClasses: fetchClasses,
    refetchSchoolYears: fetchSchoolYears,
    hasStudents: students.length > 0,
    retry: retryAll,
    runDiagnostic
  };
};

// === HOOK POUR LES ÉVALUATIONS ===
export interface UseAcademicEvaluationsResult {
  evaluations: AcademicEvaluation[];
  loading: boolean;
  error: string | null;
  pagination: any;
  refetch: () => Promise<void>;
  hasData: boolean;
  debugInfo: any;
}

export const useAcademicEvaluations = (filters: EvaluationSearchFilters): UseAcademicEvaluationsResult => {
  const [evaluations, setEvaluations] = useState<AcademicEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const isLoadingRef = useRef(false);
  const filtersRef = useRef<string>('');
  const retryCountRef = useRef(0);

  const fetchEvaluations = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('Requête déjà en cours, ignorée');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('Chargement évaluations avec filtres:', filters);
      
      // Validation stricte des filtres pour éviter erreur 400
      const safeFilters: EvaluationSearchFilters = {
        page: Math.max(1, filters.page || 1),
        limit: Math.min(50, Math.max(1, filters.limit || 8)),
        sort_by: ['evaluation_date', 'overall_grade', 'student_name', 'created_at'].includes(filters.sort_by || '') 
          ? filters.sort_by 
          : 'evaluation_date',
        sort_order: (filters.sort_order === 'ASC' || filters.sort_order === 'DESC') 
          ? filters.sort_order 
          : 'DESC'
      };
      
      // Ajouter seulement les filtres valides et non vides
      if (filters.student_id?.trim()) {
        safeFilters.student_id = filters.student_id.trim();
      }
      if (filters.student_name?.trim() && filters.student_name.trim().length >= 2) {
        safeFilters.student_name = filters.student_name.trim();
      }
      if (filters.school_year_id?.trim()) {
        safeFilters.school_year_id = filters.school_year_id.trim();
      }
      if (filters.class_id?.trim()) {
        safeFilters.class_id = filters.class_id.trim();
      }
      if (filters.sourate_name?.trim() && filters.sourate_name.trim().length >= 2) {
        safeFilters.sourate_name = filters.sourate_name.trim();
      }
      if (filters.memorization_status?.trim()) {
        safeFilters.memorization_status = filters.memorization_status.trim();
      }
      
      // Validation stricte des grades
      if (typeof filters.grade_min === 'number' && filters.grade_min >= 0 && filters.grade_min <= 20) {
        safeFilters.grade_min = filters.grade_min;
      }
      if (typeof filters.grade_max === 'number' && filters.grade_max >= 0 && filters.grade_max <= 20) {
        safeFilters.grade_max = filters.grade_max;
      }
      
      // Validation des dates
      if (filters.date_from?.trim()) {
        const dateFrom = filters.date_from.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
          safeFilters.date_from = dateFrom;
        }
      }
      if (filters.date_to?.trim()) {
        const dateTo = filters.date_to.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
          safeFilters.date_to = dateTo;
        }
      }
      
      const debugData = {
        originalFilters: filters,
        safeFilters,
        filtersCount: Object.keys(safeFilters).length,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(debugData);
      
      console.log('Filtres sécurisés:', safeFilters);
      
      const response = await academicProgressService.getEvaluations(safeFilters);
      
      if (response?.success && Array.isArray(response.evaluations)) {
        setEvaluations(response.evaluations);
        setPagination(response.pagination || null);
        console.log('Évaluations chargées:', response.evaluations.length);
        retryCountRef.current = 0;
      } else {
        const errorMsg = response?.error || 'Erreur chargement évaluations';
        console.error('Erreur API évaluations:', errorMsg);
        
        // Si c'est une erreur de validation, essayer sans filtres
        if (errorMsg.includes('invalides') || errorMsg.includes('Bad Request')) {
          console.log('Tentative de chargement sans filtres avancés...');
          const basicResponse = await academicProgressService.getEvaluations({
            page: 1,
            limit: 8,
            sort_by: 'evaluation_date',
            sort_order: 'DESC'
          });
          
          if (basicResponse?.success) {
            setEvaluations(basicResponse.evaluations || []);
            setPagination(basicResponse.pagination || null);
            setError('Certains filtres ignorés - données de base chargées');
            console.log('Données de base chargées');
            return;
          }
        }
        
        setError(errorMsg);
        setEvaluations([]);
      }
    } catch (err) {
      console.error('Erreur chargement évaluations:', err);
      setError('Erreur de connexion');
      setEvaluations([]);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [filters]);

  // Déclenchement réactif optimisé
  useEffect(() => {
    const currentFiltersString = JSON.stringify(filters);
    if (currentFiltersString !== filtersRef.current) {
      filtersRef.current = currentFiltersString;
      
      const timeoutId = setTimeout(() => {
        fetchEvaluations();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, fetchEvaluations]);

  return {
    evaluations,
    loading,
    error,
    pagination,
    refetch: fetchEvaluations,
    hasData: evaluations.length > 0,
    debugInfo
  };
};

// === HOOK POUR LES STATISTIQUES ===
export interface UseAcademicStatsResult {
  stats: {
    general: any;
    performance: any;
    subjects: any;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasData: boolean;
}

export const useAcademicStats = (): UseAcademicStatsResult => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isInitializedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Chargement statistiques');
      const response = await academicProgressService.getOverviewStats();
      
      if (response?.success) {
        setStats(response);
        console.log('Statistiques chargées');
      } else {
        console.warn('Réponse stats inattendue, utilisation fallback');
        const fallbackStats = {
          general: {
            total_students: 0,
            total_evaluations: 0,
            total_classes: 0,
            avg_overall_grade: 0,
            last_evaluation_date: new Date().toISOString()
          },
          performance: {
            excellent_count: 0,
            good_count: 0,
            average_count: 0,
            poor_count: 0,
            excellent_rate: 0,
            good_rate: 0,
            average_rate: 0,
            poor_rate: 0
          },
          subjects: {
            memorization: { avg_grade: 0, total_pages: 0 },
            recitation: { avg_grade: 0, excellent_rate: 0 },
            tajwid: { avg_grade: 0, improvement_needed: 0 },
            behavior: { avg_grade: 0, good_behavior_rate: 0 }
          }
        };
        setStats(fallbackStats);
        setError('Statistiques indisponibles - données temporaires affichées');
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      setError('Erreur de connexion stats');
      setStats({
        general: { total_students: 0, total_evaluations: 0 },
        performance: { excellent_rate: 0, good_rate: 0 },
        subjects: { memorization: { avg_grade: 0 } }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    hasData: stats !== null
  };
};

// === HOOK POUR LES FILTRES ===
export const useEvaluationFilters = () => {
  const [filters, setFilters] = useState<EvaluationSearchFilters>({
    page: 1,
    limit: 8,
    sort_by: 'evaluation_date',
    sort_order: 'DESC'
  });

  const updateFilter = useCallback((key: keyof EvaluationSearchFilters, value: any) => {
    setFilters(prev => {
      let validatedValue = value;
      
      if (key === 'page') {
        validatedValue = Math.max(1, parseInt(value) || 1);
      } else if (key === 'limit') {
        validatedValue = Math.min(50, Math.max(1, parseInt(value) || 8));
      } else if (key === 'grade_min' || key === 'grade_max') {
        validatedValue = value !== undefined && value !== '' ? parseFloat(value) : undefined;
      }
      
      const newFilters = { ...prev, [key]: validatedValue };
      
      if (key !== 'page') {
        newFilters.page = 1;
      }
      
      console.log('Filtre mis à jour:', key, '=', validatedValue);
      return newFilters;
    });
  }, []);

  const updateFilters = useCallback((newFilters: Partial<EvaluationSearchFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      if (!newFilters.hasOwnProperty('page')) {
        updated.page = 1;
      }
      
      console.log('Filtres mis à jour:', newFilters);
      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => {
    console.log('Reset des filtres');
    setFilters({
      page: 1,
      limit: 8,
      sort_by: 'evaluation_date',
      sort_order: 'DESC'
    });
  }, []);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters
  };
};

// === HOOK POUR CRÉER UNE ÉVALUATION ===
export const useCreateEvaluation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createEvaluation = useCallback(async (evaluationData: CreateEvaluationData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Création évaluation:', evaluationData);
      
      if (!evaluationData.student_id?.trim()) {
        throw new Error('ID étudiant requis');
      }
      
      if (!evaluationData.current_sourate?.trim()) {
        throw new Error('Nom de la sourate requis');
      }

      const response = await academicProgressService.createEvaluation(evaluationData);
      
      if (response?.success) {
        setSuccess(response.message || 'Évaluation créée avec succès');
        console.log('Évaluation créée:', response);
        return response;
      } else {
        throw new Error(response?.error || 'Erreur création');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('Erreur création évaluation:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    createEvaluation,
    loading,
    error,
    success,
    clearMessages
  };
};

// === HOOK POUR MODIFIER UNE ÉVALUATION ===
export const useUpdateEvaluation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateEvaluation = useCallback(async (evaluationId: string, evaluationData: Partial<CreateEvaluationData>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Modification évaluation:', evaluationId, evaluationData);
      
      if (!evaluationId?.trim()) {
        throw new Error('ID évaluation requis');
      }

      const cleanedData = Object.fromEntries(
        Object.entries(evaluationData).filter(([_, value]) => 
          value !== undefined && value !== null && 
          (typeof value !== 'string' || value.trim() !== '')
        )
      );

      if (Object.keys(cleanedData).length === 0) {
        throw new Error('Aucune donnée à modifier');
      }

      const response = await academicProgressService.updateEvaluation(evaluationId, cleanedData);
      
      if (response?.success) {
        setSuccess(response.message || 'Évaluation modifiée avec succès');
        console.log('Modification réussie:', response);
        return response;
      } else {
        throw new Error(response?.error || 'Erreur modification');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('Erreur modification évaluation:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    updateEvaluation,
    loading,
    error,
    success,
    clearMessages
  };
};