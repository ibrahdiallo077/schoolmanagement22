// src/hooks/useSchool.ts - Hook pour la gestion des années scolaires

import { useState, useEffect, useCallback, useReducer } from 'react';
import { 
  schoolYearService, 
  schoolYearUtils, 
  schoolYearCache 
} from '../services/schoolyearService';
import {
  SchoolYear,
  SchoolYearState,
  SchoolYearAction,
  CreateSchoolYearRequest,
  UpdateSchoolYearRequest,
  SchoolYearFilters,
  SchoolYearOption,
  SchoolYearStatsResponse
} from '../types/schoolyear.types';

// === REDUCER POUR L'ÉTAT GLOBAL ===
const initialState: SchoolYearState = {
  schoolYears: [],
  currentSchoolYear: null,
  schoolYearOptions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  stats: null,
};

function schoolYearReducer(state: SchoolYearState, action: SchoolYearAction): SchoolYearState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_SCHOOL_YEARS':
      return { 
        ...state, 
        schoolYears: action.payload, 
        isLoading: false, 
        error: null,
        lastUpdated: new Date().toISOString()
      };
    
    case 'SET_CURRENT_SCHOOL_YEAR':
      return { ...state, currentSchoolYear: action.payload };
    
    case 'SET_SCHOOL_YEAR_OPTIONS':
      return { ...state, schoolYearOptions: action.payload };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'ADD_SCHOOL_YEAR':
      return { 
        ...state, 
        schoolYears: [...state.schoolYears, action.payload],
        lastUpdated: new Date().toISOString()
      };
    
    case 'UPDATE_SCHOOL_YEAR':
      return {
        ...state,
        schoolYears: state.schoolYears.map(sy => 
          sy.id === action.payload.id ? action.payload : sy
        ),
        currentSchoolYear: state.currentSchoolYear?.id === action.payload.id 
          ? action.payload 
          : state.currentSchoolYear,
        lastUpdated: new Date().toISOString()
      };
    
    case 'REMOVE_SCHOOL_YEAR':
      return {
        ...state,
        schoolYears: state.schoolYears.filter(sy => sy.id !== action.payload),
        currentSchoolYear: state.currentSchoolYear?.id === action.payload 
          ? null 
          : state.currentSchoolYear,
        lastUpdated: new Date().toISOString()
      };
    
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    
    default:
      return state;
  }
}

// === HOOK PRINCIPAL ===
export const useSchoolYear = (autoLoad = true) => {
  const [state, dispatch] = useReducer(schoolYearReducer, initialState);

  // === ACTIONS ASYNC ===

  // Charger toutes les années scolaires
  const loadSchoolYears = useCallback(async (filters: SchoolYearFilters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Vérifier le cache d'abord
      const cacheKey = `school-years-${JSON.stringify(filters)}`;
      const cached = schoolYearCache.get(cacheKey);
      
      if (cached) {
        dispatch({ type: 'SET_SCHOOL_YEARS', payload: cached });
        return cached;
      }

      const response = await schoolYearService.getAll(filters);
      const schoolYears = response.school_years.map(schoolYearUtils.formatSchoolYear);
      
      // Mettre en cache
      schoolYearCache.set(cacheKey, schoolYears);
      
      dispatch({ type: 'SET_SCHOOL_YEARS', payload: schoolYears });
      return schoolYears;
    } catch (error: any) {
      console.error('Erreur chargement années scolaires:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur de chargement' });
      throw error;
    }
  }, []);

  // Charger l'année scolaire actuelle
  const loadCurrentSchoolYear = useCallback(async () => {
    try {
      const cached = schoolYearCache.get('current-school-year');
      if (cached) {
        dispatch({ type: 'SET_CURRENT_SCHOOL_YEAR', payload: cached });
        return cached;
      }

      const response = await schoolYearService.getCurrent();
      const currentYear = response.school_year 
        ? schoolYearUtils.formatSchoolYear(response.school_year)
        : null;
      
      if (currentYear) {
        schoolYearCache.set('current-school-year', currentYear);
      }
      
      dispatch({ type: 'SET_CURRENT_SCHOOL_YEAR', payload: currentYear });
      return currentYear;
    } catch (error: any) {
      console.error('Erreur chargement année actuelle:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur de chargement' });
      return null;
    }
  }, []);

  // Charger les options pour les sélecteurs
  const loadSchoolYearOptions = useCallback(async (includePast = false) => {
    try {
      const cached = schoolYearCache.get(`school-year-options-${includePast}`);
      if (cached) {
        dispatch({ type: 'SET_SCHOOL_YEAR_OPTIONS', payload: cached });
        return cached;
      }

      const response = await schoolYearService.getQuickOptions();
      const options = response.school_years || [];
      
      schoolYearCache.set(`school-year-options-${includePast}`, options);
      dispatch({ type: 'SET_SCHOOL_YEAR_OPTIONS', payload: options });
      return options;
    } catch (error: any) {
      console.error('Erreur chargement options années:', error);
      return [];
    }
  }, []);

  // Créer une nouvelle année scolaire
  const createSchoolYear = useCallback(async (data: CreateSchoolYearRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await schoolYearService.create(data);
      if (response.school_year) {
        const newSchoolYear = schoolYearUtils.formatSchoolYear(response.school_year);
        dispatch({ type: 'ADD_SCHOOL_YEAR', payload: newSchoolYear });
        
        // Nettoyer le cache
        schoolYearCache.clearPattern('school-year');
        
        // Si c'est l'année courante, mettre à jour
        if (newSchoolYear.is_current) {
          dispatch({ type: 'SET_CURRENT_SCHOOL_YEAR', payload: newSchoolYear });
        }
        
        return newSchoolYear;
      }
      throw new Error('Aucune donnée retournée');
    } catch (error: any) {
      console.error('Erreur création année scolaire:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur de création' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Modifier une année scolaire
  const updateSchoolYear = useCallback(async (id: string, data: UpdateSchoolYearRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await schoolYearService.update(id, data);
      if (response.school_year) {
        const updatedSchoolYear = schoolYearUtils.formatSchoolYear(response.school_year);
        dispatch({ type: 'UPDATE_SCHOOL_YEAR', payload: updatedSchoolYear });
        
        // Nettoyer le cache
        schoolYearCache.clearPattern('school-year');
        
        // Si c'est l'année courante, mettre à jour
        if (updatedSchoolYear.is_current) {
          dispatch({ type: 'SET_CURRENT_SCHOOL_YEAR', payload: updatedSchoolYear });
        }
        
        return updatedSchoolYear;
      }
      throw new Error('Aucune donnée retournée');
    } catch (error: any) {
      console.error('Erreur modification année scolaire:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur de modification' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Supprimer une année scolaire
  const deleteSchoolYear = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await schoolYearService.delete(id);
      dispatch({ type: 'REMOVE_SCHOOL_YEAR', payload: id });
      
      // Nettoyer le cache
      schoolYearCache.clearPattern('school-year');
      
      return true;
    } catch (error: any) {
      console.error('Erreur suppression année scolaire:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur de suppression' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Définir comme année courante
  const setCurrentSchoolYear = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await schoolYearService.setCurrent(id);
      if (response.school_year) {
        const currentYear = schoolYearUtils.formatSchoolYear(response.school_year);
        
        // Mettre à jour toutes les années (désactiver les autres)
        const updatedSchoolYears = state.schoolYears.map(sy => ({
          ...sy,
          is_current: sy.id === id
        }));
        
        dispatch({ type: 'SET_SCHOOL_YEARS', payload: updatedSchoolYears });
        dispatch({ type: 'SET_CURRENT_SCHOOL_YEAR', payload: currentYear });
        
        // Nettoyer le cache
        schoolYearCache.clearPattern('school-year');
        
        return currentYear;
      }
      throw new Error('Aucune donnée retournée');
    } catch (error: any) {
      console.error('Erreur définition année courante:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur de définition' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.schoolYears]);

  // Archiver une année scolaire
  const archiveSchoolYear = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await schoolYearService.archive(id);
      
      // Recharger les données
      await loadSchoolYears();
      
      return true;
    } catch (error: any) {
      console.error('Erreur archivage année scolaire:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erreur d\'archivage' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadSchoolYears]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const cached = schoolYearCache.get('school-year-stats');
      if (cached) {
        dispatch({ type: 'SET_STATS', payload: cached });
        return cached;
      }

      const response = await schoolYearService.getStats();
      const stats = response.stats;
      
      schoolYearCache.set('school-year-stats', stats);
      dispatch({ type: 'SET_STATS', payload: stats });
      return stats;
    } catch (error: any) {
      console.error('Erreur chargement statistiques:', error);
      return null;
    }
  }, []);

  // Obtenir une année par ID
  const getSchoolYearById = useCallback((id: string): SchoolYear | null => {
    return state.schoolYears.find(sy => sy.id === id) || null;
  }, [state.schoolYears]);

  // Rafraîchir toutes les données
  const refresh = useCallback(async () => {
    schoolYearCache.clear();
    await Promise.all([
      loadSchoolYears(),
      loadCurrentSchoolYear(),
      loadSchoolYearOptions()
    ]);
  }, [loadSchoolYears, loadCurrentSchoolYear, loadSchoolYearOptions]);

  // Nettoyer les erreurs
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // === EFFETS ===
  
  // Chargement automatique au montage
  useEffect(() => {
    if (autoLoad) {
      loadCurrentSchoolYear();
      loadSchoolYearOptions();
      loadSchoolYears({ include_stats: true });
    }
  }, [autoLoad, loadCurrentSchoolYear, loadSchoolYearOptions, loadSchoolYears]);

  // === VALEURS CALCULÉES ===
  
  const currentYear = state.currentSchoolYear;
  const hasCurrentYear = Boolean(currentYear);
  const totalSchoolYears = state.schoolYears.length;
  const activeYears = state.schoolYears.filter(sy => {
    const now = new Date();
    const endDate = new Date(sy.end_date);
    return endDate >= now;
  }).length;

  return {
    // État
    ...state,
    
    // Valeurs calculées
    currentYear,
    hasCurrentYear,
    totalSchoolYears,
    activeYears,
    
    // Actions
    loadSchoolYears,
    loadCurrentSchoolYear,
    loadSchoolYearOptions,
    createSchoolYear,
    updateSchoolYear,
    deleteSchoolYear,
    setCurrentSchoolYear,
    archiveSchoolYear,
    loadStats,
    getSchoolYearById,
    refresh,
    clearError,
    
    // Utilitaires
    utils: schoolYearUtils,
  };
};

// === HOOK SPÉCIALISÉ POUR SÉLECTEUR ===
export const useSchoolYearSelector = () => {
  const [options, setOptions] = useState<SchoolYearOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOptions = useCallback(async (includePast = false) => {
    try {
      setIsLoading(true);
      const response = await schoolYearService.getQuickOptions();
      setOptions(response.school_years || []);
    } catch (error) {
      console.error('Erreur chargement options:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return {
    options,
    isLoading,
    refresh: loadOptions,
  };
};

// === HOOK POUR FORMULAIRES ===
export const useSchoolYearForm = () => {
  const [formData, setFormData] = useState<Partial<CreateSchoolYearRequest>>({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation en temps réel
  const validate = useCallback((data: Partial<CreateSchoolYearRequest>) => {
    const validationErrors = schoolYearUtils.validateSchoolYear(data);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, []);

  // Mettre à jour un champ
  const updateField = useCallback((field: keyof CreateSchoolYearRequest, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Validation en temps réel
    validate(newData);
  }, [formData, validate]);

  // Générer automatiquement les dates et le nom
  const generateDefaults = useCallback((startYear?: number) => {
    const year = startYear || new Date().getFullYear();
    const defaults = schoolYearUtils.getDefaultDates(year);
    const name = schoolYearUtils.generateYearName(year);
    
    const newData = {
      ...formData,
      name,
      ...defaults,
    };
    
    setFormData(newData);
    validate(newData);
  }, [formData, validate]);

  // Réinitialiser le formulaire
  const reset = useCallback(() => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      description: '',
      is_current: false,
    });
    setErrors({});
    setIsSubmitting(false);
  }, []);

  // Initialiser avec les données d'une année existante
  const initializeWith = useCallback((schoolYear: SchoolYear) => {
    setFormData({
      name: schoolYear.name,
      start_date: schoolYear.start_date,
      end_date: schoolYear.end_date,
      description: schoolYear.description || '',
      is_current: schoolYear.is_current,
    });
    setErrors({});
  }, []);

  const isValid = Object.keys(errors).length === 0 && formData.name && formData.start_date && formData.end_date;

  return {
    formData,
    errors,
    isSubmitting,
    isValid,
    setIsSubmitting,
    updateField,
    generateDefaults,
    reset,
    initializeWith,
    validate: () => validate(formData),
  };
};

// === HOOK POUR STATISTIQUES ===
export const useSchoolYearStats = () => {
  const [stats, setStats] = useState<SchoolYearStatsResponse['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cached = schoolYearCache.get('school-year-stats');
      if (cached) {
        setStats(cached);
        return cached;
      }

      const response = await schoolYearService.getStats();
      const statsData = response.stats;
      
      schoolYearCache.set('school-year-stats', statsData);
      setStats(statsData);
      return statsData;
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement des statistiques');
      console.error('Erreur statistiques:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: loadStats,
  };
};

export default useSchoolYear;