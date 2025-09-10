// src/services/schoolyearService.ts - Service API pour les années scolaires

import {
  SchoolYear,
  CreateSchoolYearRequest,
  UpdateSchoolYearRequest,
  SchoolYearListResponse,
  SchoolYearResponse,
  SchoolYearStatsResponse,
  SchoolYearFilters,
  SchoolYearOption,
  APIResponse
} from '../types/schoolyear.types';

import { apiRequest, apiRequestWithRefresh } from '../config/api';

// Base URL pour les endpoints
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// Classe d'erreur API personnalisée pour les années scolaires
export class SchoolYearAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: string | string[]
  ) {
    super(message);
    this.name = 'SchoolYearAPIError';
  }
}

// Helper pour gérer les erreurs spécifiques aux années scolaires
const handleSchoolYearError = (error: any): never => {
  if (error.message?.includes('fetch')) {
    throw new SchoolYearAPIError(
      'Erreur de connexion au serveur. Vérifiez que le backend est démarré.',
      0,
      'NETWORK_ERROR'
    );
  }
  
  // Réutiliser l'erreur si c'est déjà une APIError
  throw error;
};

// === SERVICE ANNÉES SCOLAIRES ===

export const schoolYearService = {
  
  // Lister toutes les années scolaires
  async getAll(filters: SchoolYearFilters = {}): Promise<SchoolYearListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.current_only !== undefined) {
        params.append('current_only', filters.current_only.toString());
      }
      if (filters.include_stats !== undefined) {
        params.append('include_stats', filters.include_stats.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const queryString = params.toString();
      const url = `${API_BASE}/school-years${queryString ? `?${queryString}` : ''}`;
      
      return await apiRequestWithRefresh(url);
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Obtenir l'année scolaire actuelle
  async getCurrent(): Promise<SchoolYearResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/current`);
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Obtenir une année scolaire par ID
  async getById(id: string): Promise<SchoolYearResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/${id}`);
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Créer une nouvelle année scolaire
  async create(data: CreateSchoolYearRequest): Promise<SchoolYearResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Modifier une année scolaire
  async update(id: string, data: UpdateSchoolYearRequest): Promise<SchoolYearResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Supprimer une année scolaire
  async delete(id: string): Promise<APIResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Définir comme année courante
  async setCurrent(id: string): Promise<SchoolYearResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/${id}/set-current`, {
        method: 'PATCH',
      });
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Archiver une année scolaire
  async archive(id: string): Promise<APIResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/${id}/archive`, {
        method: 'PATCH',
      });
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Obtenir les statistiques
  async getStats(): Promise<SchoolYearStatsResponse> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/school-years/stats/overview`);
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Obtenir les options pour les formulaires (select)
  async getOptions(includePast = false): Promise<{ success: boolean; school_years: SchoolYearOption[] }> {
    try {
      const params = new URLSearchParams();
      params.append('include_past', includePast.toString());
      
      return await apiRequestWithRefresh(
        `${API_BASE}/school-years/options/select?${params.toString()}`
      );
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Route rapide pour les formulaires
  async getQuickOptions(): Promise<{ success: boolean; school_years: SchoolYearOption[] }> {
    try {
      return await apiRequestWithRefresh(`${API_BASE}/quick/school-years`);
    } catch (error) {
      return handleSchoolYearError(error);
    }
  },

  // Test de connexion
  async test(): Promise<APIResponse> {
    try {
      return await apiRequest(`${API_BASE}/school-years/test`);
    } catch (error) {
      return handleSchoolYearError(error);
    }
  }
};

// === UTILITAIRES ===

export const schoolYearUtils = {
  
  // Valider les données d'une année scolaire
  validateSchoolYear(data: Partial<CreateSchoolYearRequest>): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    
    // Validation du nom
    if (!data.name?.trim()) {
      errors.name = ['Le nom de l\'année scolaire est requis'];
    } else if (!/^\d{4}-\d{4}$/.test(data.name.trim())) {
      errors.name = ['Le nom doit être au format YYYY-YYYY (ex: 2024-2025)'];
    } else {
      const [startYear, endYear] = data.name.trim().split('-').map(Number);
      if (endYear !== startYear + 1) {
        errors.name = ['L\'année de fin doit être l\'année suivant l\'année de début'];
      }
    }
    
    // Validation des dates
    if (!data.start_date) {
      errors.start_date = ['La date de début est requise'];
    }
    
    if (!data.end_date) {
      errors.end_date = ['La date de fin est requise'];
    }
    
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (endDate <= startDate) {
        errors.end_date = ['La date de fin doit être postérieure à la date de début'];
      }
      
      // Vérifier que l'année scolaire ne dépasse pas 2 ans
      const diffYears = endDate.getFullYear() - startDate.getFullYear();
      if (diffYears > 2) {
        errors.end_date = ['Une année scolaire ne peut pas dépasser 2 années civiles'];
      }
    }
    
    // Validation de la description (optionnelle)
    if (data.description && data.description.length > 1000) {
      errors.description = ['La description ne peut pas dépasser 1000 caractères'];
    }
    
    return errors;
  },

  // Formater une année scolaire pour l'affichage
  formatSchoolYear(schoolYear: SchoolYear): SchoolYear {
    return {
      ...schoolYear,
      display_name: `${schoolYear.name}${schoolYear.is_current ? ' (Actuelle)' : ''}`,
      start_date_formatted: new Date(schoolYear.start_date).toLocaleDateString('fr-FR'),
      end_date_formatted: new Date(schoolYear.end_date).toLocaleDateString('fr-FR'),
    };
  },

  // Calculer le statut d'une année scolaire
  getStatus(schoolYear: SchoolYear): { status: string; color: string } {
    const now = new Date();
    const startDate = new Date(schoolYear.start_date);
    const endDate = new Date(schoolYear.end_date);
    
    if (endDate < now) {
      return { status: 'Terminée', color: 'secondary' };
    } else if (startDate > now) {
      return { status: 'Future', color: 'info' };
    } else if (schoolYear.is_current) {
      return { status: 'En cours', color: 'success' };
    } else {
      return { status: 'Active', color: 'primary' };
    }
  },

  // Calculer le pourcentage de progression
  getProgress(schoolYear: SchoolYear): number | null {
    const now = new Date();
    const startDate = new Date(schoolYear.start_date);
    const endDate = new Date(schoolYear.end_date);
    
    if (startDate <= now && endDate >= now) {
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      return Math.round((elapsed / totalDuration) * 100);
    }
    
    return null;
  },

  // Générer un nom d'année automatique
  generateYearName(startYear?: number): string {
    const year = startYear || new Date().getFullYear();
    return `${year}-${year + 1}`;
  },

  // Obtenir les dates par défaut pour une nouvelle année
  getDefaultDates(startYear?: number): { start_date: string; end_date: string } {
    const year = startYear || new Date().getFullYear();
    return {
      start_date: `${year}-09-01`,
      end_date: `${year + 1}-07-31`
    };
  },

  // Vérifier si une année scolaire peut être supprimée
  canDelete(schoolYear: SchoolYear): { canDelete: boolean; reason?: string } {
    if (schoolYear.is_current) {
      return {
        canDelete: false,
        reason: 'Impossible de supprimer l\'année scolaire courante'
      };
    }
    
    if (schoolYear.total_students && schoolYear.total_students > 0) {
      return {
        canDelete: false,
        reason: `Cette année a ${schoolYear.total_students} étudiant(s) inscrits`
      };
    }
    
    if (schoolYear.total_classes && schoolYear.total_classes > 0) {
      return {
        canDelete: false,
        reason: `Cette année a ${schoolYear.total_classes} classe(s) créées`
      };
    }
    
    return { canDelete: true };
  }
};

// === CACHE SIMPLE ===
class SchoolYearCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const schoolYearCache = new SchoolYearCache();

// Hook utilitaire pour rafraîchir le cache
export const useSchoolYearCache = () => {
  return {
    clearCache: () => schoolYearCache.clear(),
    clearSchoolYearCache: () => schoolYearCache.clearPattern('school-year'),
  };
};