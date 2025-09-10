// src/services/dashboardService.ts - SERVICE CORRIGÉ POUR CONNEXION RÉELLE BACKEND

import type {
  QuickStatsResponse,
  DashboardOverviewResponse,
  LiveMetricsResponse,
  ActivityStreamResponse,
  EnrollmentTrends,
  FinancialFlows,
  ChartResponse,
  TimePeriod,
  DashboardError,
  ApiResponse
} from '../types/dashboard.types';

// Configuration API - ROUTES EXACTES DE VOTRE BACKEND
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class DashboardApiError extends Error {
  public status: number;
  public code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'DashboardApiError';
    this.status = status;
    this.code = code;
  }
}

class DashboardService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 30 * 1000; // 30 secondes comme votre backend
  private isOnline = true;
  private retryAttempts = 0;
  private maxRetries = 3;

  constructor() {
    console.log('🚀 Dashboard Service v7.0 - Connexion réelle backend');
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.testConnection();
      console.log('✅ Service dashboard initialisé avec succès');
    } catch (error) {
      console.warn('⚠️ Problème de connexion initial:', error);
    }
  }

  // =================== GESTION DES TOKENS ===================
  private getAuthHeaders(): HeadersInit {
    // Chercher le token dans tous les endroits possibles
    const token = localStorage.getItem('authToken') || 
                  sessionStorage.getItem('authToken') ||
                  localStorage.getItem('auth_token') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('access_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token trouvé et ajouté aux headers');
    } else {
      console.warn('⚠️ Aucun token d\'authentification trouvé');
    }

    return headers;
  }

  // =================== REQUÊTES HTTP ROBUSTES ===================
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      signal: AbortSignal.timeout(15000), // 15 secondes timeout
    };

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 API Request [Tentative ${attempt + 1}/${this.maxRetries + 1}]: ${url}`);
        
        const response = await fetch(url, config);
        
        // Log détaillé pour debug
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          // Gestion spécifique des erreurs d'auth
          if (response.status === 401) {
            console.error('🔐 Erreur d\'authentification - Token invalide ou expiré');
            throw new DashboardApiError('Token d\'authentification invalide', 401, 'AUTH_ERROR');
          }
          
          if (response.status === 403) {
            console.error('🚫 Accès refusé - Permissions insuffisantes');
            throw new DashboardApiError('Accès refusé', 403, 'FORBIDDEN');
          }
          
          if (response.status >= 500) {
            console.error('🔥 Erreur serveur');
            throw new DashboardApiError(`Erreur serveur: ${response.status}`, response.status, 'SERVER_ERROR');
          }
          
          throw new DashboardApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }
        
        const data = await response.json();
        console.log(`✅ API Success [${response.status}]:`, data.success ? 'Données reçues' : 'Erreur dans réponse');
        
        this.isOnline = true;
        this.retryAttempts = 0;
        
        return data;
        
      } catch (error: any) {
        console.error(`❌ Tentative ${attempt + 1} échouée:`, error.message);
        
        // Si c'est la dernière tentative, lever l'erreur
        if (attempt === this.maxRetries) {
          this.isOnline = false;
          throw this.handleError(error, url);
        }
        
        // Attendre avant la prochaine tentative (backoff exponentiel)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏱️ Attente ${waitTime}ms avant nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Toutes les tentatives ont échoué');
  }

  // =================== MÉTHODES PRINCIPALES CORRIGÉES ===================

  async testConnection(): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Test de connexion au backend...');
      const response = await this.request<ApiResponse<any>>(`${API_BASE_URL}/api/dashboard-overview/overview`);
      
      if (response.success) {
        console.log('✅ Connexion backend réussie');
        return { success: true, message: 'Connexion établie' };
      } else {
        console.warn('⚠️ Backend répond mais avec erreur:', response.error);
        return { success: false, error: response.error || 'Erreur backend' };
      }
    } catch (error) {
      console.error('❌ Test de connexion échoué:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connexion impossible'
      };
    }
  }

  async getOverview(useCache = true): Promise<DashboardOverviewResponse> {
    const cacheKey = 'dashboard_overview';
    
    if (useCache) {
      const cached = this.getCachedData<DashboardOverviewResponse>(cacheKey);
      if (cached) {
        console.log('📦 Overview depuis cache');
        return cached;
      }
    }

    try {
      console.log('🔄 Récupération overview depuis backend...');
      const response = await this.request<DashboardOverviewResponse>(`${API_BASE_URL}/api/dashboard-overview/overview`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la récupération des données');
      }
      
      // Validation des données reçues
      if (!response.dashboard) {
        throw new Error('Format de réponse invalide - dashboard manquant');
      }
      
      console.log('✅ Overview reçu:', {
        students: response.dashboard.core_metrics?.students?.total || 0,
        balance: response.dashboard.financial_overview?.formatted_balance || '0 FG',
        health_score: response.dashboard.system_health?.overall_score || 0
      });
      
      this.setCachedData(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('❌ Erreur getOverview:', error);
      throw error; // Re-lancer l'erreur pour que le composant puisse la gérer
    }
  }

  async getQuickStats(useCache = true): Promise<QuickStatsResponse> {
    const cacheKey = 'quick_stats';
    
    if (useCache) {
      const cached = this.getCachedData<QuickStatsResponse>(cacheKey);
      if (cached) {
        console.log('📦 Quick stats depuis cache');
        return cached;
      }
    }

    try {
      console.log('🔄 Récupération quick stats depuis backend...');
      const response = await this.request<QuickStatsResponse>(`${API_BASE_URL}/api/dashboard-quick-stats/quick-stats`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur quick stats');
      }
      
      console.log('✅ Quick stats reçues:', {
        students: response.quick_stats?.students || 0,
        balance: response.quick_stats?.financial?.formatted_balance || '0 FG'
      });
      
      this.setCachedData(cacheKey, response);
      return response;
      
    } catch (error) {
      console.error('❌ Erreur getQuickStats:', error);
      throw error;
    }
  }

  async getLiveMetrics(useCache = false): Promise<LiveMetricsResponse> {
    const cacheKey = 'live_metrics';
    
    if (useCache) {
      const cached = this.getCachedData<LiveMetricsResponse>(cacheKey);
      if (cached) {
        console.log('📦 Live metrics depuis cache');
        return cached;
      }
    }

    try {
      console.log('🔄 Récupération live metrics depuis backend...');
      const response = await this.request<LiveMetricsResponse>(`${API_BASE_URL}/api/dashboard-live-metrics/live-metrics`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur live metrics');
      }
      
      console.log('✅ Live metrics reçues:', {
        today_students: response.live_metrics?.today?.new_students || 0,
        today_revenue: response.live_metrics?.today?.formatted_revenue || '0 FG',
        health_score: response.live_metrics?.system_health?.score || 0
      });
      
      // Cache plus court pour les données temps réel
      this.setCachedData(cacheKey, response, 10000); // 10 secondes
      return response;
      
    } catch (error) {
      console.error('❌ Erreur getLiveMetrics:', error);
      throw error;
    }
  }

  async getFinancialData(useCache = false): Promise<ApiResponse<any>> {
    try {
      console.log('🔄 Récupération données financières...');
      const response = await this.request<ApiResponse<any>>(`${API_BASE_URL}/api/finance/dashboard`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur données financières');
      }
      
      console.log('✅ Données financières reçues');
      return response;
      
    } catch (error) {
      console.error('❌ Erreur getFinancialData:', error);
      throw error;
    }
  }

  async getWidgetStats(): Promise<ApiResponse<any>> {
    try {
      console.log('🔄 Récupération widget stats...');
      const response = await this.request<ApiResponse<any>>(`${API_BASE_URL}/api/dashboard-quick-stats/widget-stats`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur widget stats');
      }
      
      console.log('✅ Widget stats reçues:', {
        students: response.widget_stats?.students || 0,
        balance: response.widget_stats?.formatted_balance || '0 FG'
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Erreur getWidgetStats:', error);
      throw error;
    }
  }

  async getActivityStream(): Promise<ActivityStreamResponse> {
    try {
      console.log('🔄 Génération activity stream...');
      
      // Essayer de récupérer des données réelles du backend pour enrichir l'activité
      const [overviewData, liveData] = await Promise.allSettled([
        this.getOverview(true),
        this.getLiveMetrics(true)
      ]);
      
      const activities = [];
      
      // Ajouter des activités basées sur les données réelles
      if (overviewData.status === 'fulfilled' && overviewData.value.success) {
        const dashboard = overviewData.value.dashboard;
        
        if (dashboard.core_metrics?.students?.new_this_week > 0) {
          activities.push({
            type: 'new_student',
            title: 'Nouvelles inscriptions',
            description: `${dashboard.core_metrics.students.new_this_week} nouveaux étudiants cette semaine`,
            time: 'Cette semaine',
            amount: null
          });
        }
        
        activities.push({
          type: 'financial',
          title: 'Situation financière',
          description: `Capital: ${dashboard.financial_overview?.formatted_balance || '0 FG'}`,
          time: 'Maintenant',
          amount: dashboard.financial_overview?.formatted_balance || '0 FG'
        });
      }
      
      if (liveData.status === 'fulfilled' && liveData.value.success) {
        const live = liveData.value.live_metrics;
        
        if (live.today?.new_payments > 0) {
          activities.push({
            type: 'payment',
            title: 'Paiements reçus',
            description: `${live.today.new_payments} paiements aujourd'hui`,
            time: 'Aujourd\'hui',
            amount: live.today.formatted_revenue
          });
        }
        
        if (live.today?.new_evaluations > 0) {
          activities.push({
            type: 'evaluation',
            title: 'Évaluations',
            description: `${live.today.new_evaluations} évaluations effectuées`,
            time: 'Aujourd\'hui',
            amount: null
          });
        }
      }
      
      // Activité par défaut si pas de données
      if (activities.length === 0) {
        activities.push({
          type: 'system',
          title: 'Système opérationnel',
          description: 'Dashboard connecté au backend',
          time: 'Maintenant',
          amount: null
        });
      }

      return {
        success: true,
        activity_stream: activities.slice(0, 5),
        total_activities: activities.length,
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erreur getActivityStream:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Activity stream unavailable',
        activity_stream: [
          {
            type: 'system',
            title: 'Erreur de connexion',
            description: 'Impossible de récupérer les activités',
            time: 'Maintenant',
            amount: null
          }
        ],
        total_activities: 1,
        last_updated: new Date().toISOString()
      };
    }
  }

  // =================== MÉTHODES NON IMPLÉMENTÉES (RETOUR PROPRE) ===================
  async getEnrollmentTrends(period: TimePeriod = '6months'): Promise<ChartResponse<EnrollmentTrends>> {
    return {
      success: false,
      error: 'Fonctionnalité en développement',
      details: 'Les graphiques de tendances seront disponibles dans une prochaine version',
      chart_data: [],
      period,
      chart_type: 'enrollment_trends'
    };
  }

  async getFinancialFlows(period: TimePeriod = '6months'): Promise<ChartResponse<FinancialFlows>> {
    return {
      success: false,
      error: 'Fonctionnalité en développement',
      details: 'Les graphiques financiers seront disponibles dans une prochaine version',
      chart_data: [],
      period,
      chart_type: 'financial_flows'
    };
  }

  async getAcademicPerformance(period: TimePeriod = '6months'): Promise<ApiResponse<any>> {
    return {
      success: false,
      error: 'Fonctionnalité en développement',
      details: 'Les statistiques académiques avancées seront disponibles dans une prochaine version'
    };
  }

  async getClassDistribution(): Promise<ApiResponse<any>> {
    return {
      success: false,
      error: 'Fonctionnalité en développement',
      details: 'La distribution des classes sera disponible dans une prochaine version'
    };
  }

  async getHourlyStats(): Promise<ApiResponse<any>> {
    return {
      success: false,
      error: 'Fonctionnalité en développement',
      details: 'Les statistiques horaires seront disponibles dans une prochaine version'
    };
  }

  // =================== GESTION DU CACHE ===================
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any, customTimeout?: number): void {
    // Utiliser le timeout personnalisé ou celui par défaut
    const timeout = customTimeout || this.cacheTimeout;
    
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(),
      timeout 
    });
    
    // Nettoyage automatique du cache
    if (this.cache.size > 20) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
      console.log('🗑️ Cache nettoyé - ancien élément supprimé');
    }
  }

  // =================== GESTION DES ERREURS ===================
  private handleError(error: any, context: string): DashboardApiError {
    if (error instanceof DashboardApiError) {
      return error;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new DashboardApiError(
        'Erreur de réseau - Vérifiez votre connexion internet et que le serveur backend est démarré', 
        0, 
        'NETWORK_ERROR'
      );
    }
    
    if (error.name === 'AbortError') {
      return new DashboardApiError(
        'Timeout - Le serveur met trop de temps à répondre', 
        0, 
        'TIMEOUT_ERROR'
      );
    }
    
    return new DashboardApiError(
      error.message || 'Erreur inconnue', 
      500, 
      'UNKNOWN_ERROR'
    );
  }

  // =================== MÉTHODES DE CONTRÔLE ===================
  async forceReconnect(): Promise<boolean> {
    console.log('🔄 Reconnexion forcée...');
    this.retryAttempts = 0;
    this.invalidateCache();
    
    try {
      const result = await this.testConnection();
      this.isOnline = result.success;
      console.log(result.success ? '✅ Reconnexion réussie' : '❌ Reconnexion échouée');
      return result.success;
    } catch (error) {
      console.error('❌ Erreur lors de la reconnexion:', error);
      this.isOnline = false;
      return false;
    }
  }

  invalidateCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache entièrement vidé');
  }

  clearSpecificCache(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache vidé pour: ${key}`);
  }

  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
    console.log(`⏱️ Timeout cache mis à jour: ${timeout}ms`);
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout,
      is_online: this.isOnline,
      retry_attempts: this.retryAttempts
    };
  }

  getConnectionStatus() {
    return {
      online: this.isOnline,
      retry_attempts: this.retryAttempts,
      cache_size: this.cache.size,
      backend_url: API_BASE_URL
    };
  }

  destroy(): void {
    this.invalidateCache();
    console.log('🔥 Service dashboard détruit');
  }
}

// Instance singleton
export const dashboardService = new DashboardService();
export default dashboardService;