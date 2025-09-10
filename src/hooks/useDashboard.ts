// src/hooks/useDashboard.ts - HOOKS CORRIGÉS POUR CONNEXION RÉELLE BACKEND

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services/dashboardService';
import type {
  QuickStats,
  DashboardOverview,
  LiveMetrics,
  ActivityStreamItem,
  EnrollmentTrends,
  FinancialFlows,
  TimePeriod,
  QuickStatsResponse,
  DashboardOverviewResponse,
  LiveMetricsResponse,
  ActivityStreamResponse,
  ChartResponse,
  ApiResponse
} from '../types/dashboard';

// === TYPES DE BASE POUR LES HOOKS ===
interface BaseHookResult {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface CachedHookResult extends BaseHookResult {
  servedFromCache: boolean;
  lastUpdated: string | null;
}

// === HOOK OVERVIEW DASHBOARD (CORRIGÉ) ===
export interface UseDashboardOverviewResult extends CachedHookResult {
  overview: DashboardOverview | null;
}

export const useDashboardOverview = (autoRefresh: boolean = false): UseDashboardOverviewResult => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [servedFromCache, setServedFromCache] = useState<boolean>(false);
  
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOverview = useCallback(async () => {
    if (isLoadingRef.current || !isMountedRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Chargement dashboard overview...');
      const response: DashboardOverviewResponse = await dashboardService.getOverview();

      if (!isMountedRef.current) return;

      if (response.success && response.dashboard) {
        setOverview(response.dashboard);
        setLastUpdated(new Date().toISOString());
        setServedFromCache(response.metadata?.served_from_cache || false);
        console.log('✅ Dashboard overview chargé:', {
          students: response.dashboard.core_metrics?.students?.total || 0,
          balance: response.dashboard.financial_overview?.formatted_balance || '0 FG',
          score: response.dashboard.system_health?.overall_score || 0
        });
      } else {
        throw new Error(response.error || 'Erreur chargement dashboard');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion dashboard';
      console.error('❌ Erreur dashboard overview:', errorMsg);
      setError(errorMsg);
      // NE PAS remettre overview à null - garder les dernières données
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, []);

  // Initialisation
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Auto-refresh optionnel
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchOverview, 30000); // 30s comme le cache backend
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, fetchOverview]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    overview,
    loading,
    error,
    refetch: fetchOverview,
    lastUpdated,
    servedFromCache
  };
};

// === HOOK QUICK STATS (CORRIGÉ) ===
export interface UseQuickStatsResult extends CachedHookResult {
  stats: QuickStats | null;
}

export const useQuickStats = (autoRefresh: boolean = true): UseQuickStatsResult => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [servedFromCache, setServedFromCache] = useState<boolean>(false);
  
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Chargement quick stats...');
      const response: QuickStatsResponse = await dashboardService.getQuickStats();

      if (!isMountedRef.current) return;

      if (response.success && response.quick_stats) {
        setStats(response.quick_stats);
        setLastUpdated(new Date().toISOString());
        setServedFromCache(response.served_from_cache || false);
        console.log('✅ Quick stats chargées:', {
          students: response.quick_stats.students,
          balance: response.quick_stats.financial?.formatted_balance
        });
      } else {
        throw new Error(response.error || 'Erreur stats rapides');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('❌ Erreur quick stats:', errorMsg);
      setError(errorMsg);
      // Garder les dernières données en cas d'erreur
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStats, 10000); // 10s pour quick stats
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, autoRefresh]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    lastUpdated,
    servedFromCache
  };
};

// === HOOK MÉTRIQUES TEMPS RÉEL (CORRIGÉ) ===
export interface UseLiveMetricsResult extends CachedHookResult {
  metrics: LiveMetrics | null;
}

export const useLiveMetrics = (autoRefresh: boolean = true): UseLiveMetricsResult => {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [servedFromCache, setServedFromCache] = useState<boolean>(false);
  
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Chargement live metrics...');
      const response: LiveMetricsResponse = await dashboardService.getLiveMetrics(false); // Toujours fresh

      if (!isMountedRef.current) return;

      if (response.success && response.live_metrics) {
        setMetrics(response.live_metrics);
        setLastUpdated(response.live_metrics.timestamp || new Date().toISOString());
        setServedFromCache(response.served_from_cache || false);
        console.log('✅ Live metrics chargées:', {
          today_students: response.live_metrics.today?.new_students || 0,
          health_score: response.live_metrics.system_health?.score || 0
        });
      } else {
        throw new Error(response.error || 'Erreur métriques temps réel');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('❌ Erreur live metrics:', errorMsg);
      setError(errorMsg);
      // Garder les dernières données
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMetrics, 5000); // 5s pour temps réel
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMetrics, autoRefresh]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
    lastUpdated,
    servedFromCache
  };
};

// === HOOK WIDGETS SIMPLES (CORRIGÉ) ===
export interface UseWidgetStatsResult extends BaseHookResult {
  stats: {
    students: number;
    classes: number;
    staff: number;
    balance: number;
    formatted_balance: string;
    daily_flow: number;
    formatted_daily_flow: string;
    payments_today: number;
    evaluations_today: number;
    health_indicator: string;
    activity_level: string;
  } | null;
}

export const useWidgetStats = (autoRefresh: boolean = true): UseWidgetStatsResult => {
  const [stats, setStats] = useState<UseWidgetStatsResult['stats']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement widget stats...');
      const response = await dashboardService.getWidgetStats();
      if (!isMountedRef.current) return;

      if (response.success && response.widget_stats) {
        setStats(response.widget_stats);
        console.log('✅ Widget stats chargées:', {
          students: response.widget_stats.students,
          balance: response.widget_stats.formatted_balance
        });
      } else {
        throw new Error(response.error || 'Erreur widgets');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('❌ Erreur widget stats:', errorMsg);
      setError(errorMsg);
      // Garder les dernières données
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStats, 15000); // 15s pour widgets
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, autoRefresh]);

  return { 
    stats, 
    loading, 
    error, 
    refetch: fetchStats 
  };
};

// === HOOK FLUX D'ACTIVITÉ (CORRIGÉ) ===
export interface UseActivityStreamResult extends BaseHookResult {
  activities: ActivityStreamItem[];
  totalActivities: number;
  lastUpdated: string | null;
}

export const useActivityStream = (autoRefresh: boolean = true): UseActivityStreamResult => {
  const [activities, setActivities] = useState<ActivityStreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActivities, setTotalActivities] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Chargement activity stream...');
      const response: ActivityStreamResponse = await dashboardService.getActivityStream();

      if (!isMountedRef.current) return;

      if (response.success) {
        setActivities(response.activity_stream || []);
        setTotalActivities(response.total_activities || 0);
        setLastUpdated(response.last_updated || new Date().toISOString());
        console.log('✅ Activity stream chargé:', {
          activities: response.activity_stream?.length || 0
        });
      } else {
        throw new Error(response.error || 'Erreur flux d\'activité');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('❌ Erreur activity stream:', errorMsg);
      setError(errorMsg);
      // Garder les dernières données
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchActivities, 20000); // 20s pour les activités
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchActivities, autoRefresh]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
    totalActivities,
    lastUpdated
  };
};

// === HOOK SANTÉ DASHBOARD (CORRIGÉ) ===
export interface UseDashboardHealthResult {
  health: ApiResponse<any> | null;
  loading: boolean;
  checkHealth: () => Promise<void>;
  isHealthy: boolean;
  connectionStatus: any;
}

export const useDashboardHealth = (): UseDashboardHealthResult => {
  const [health, setHealth] = useState<ApiResponse<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const isMountedRef = useRef(true);

  const checkHealth = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    try {
      console.log('🔍 Test de santé dashboard...');
      const response = await dashboardService.testConnection();
      const status = dashboardService.getConnectionStatus();
      
      if (isMountedRef.current) {
        setHealth(response);
        setConnectionStatus(status);
        console.log('✅ Test santé terminé:', {
          success: response.success,
          online: status.online
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorHealth = { 
          success: false, 
          error: err instanceof Error ? err.message : 'Connexion échouée' 
        };
        setHealth(errorHealth);
        console.error('❌ Test santé échoué:', errorHealth.error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    return () => {
      isMountedRef.current = false;
    };
  }, [checkHealth]);

  const isHealthy = health?.success === true;

  return { 
    health, 
    loading, 
    checkHealth,
    isHealthy,
    connectionStatus
  };
};

// === HOOK COMPOSITE DASHBOARD COMPLET (CORRIGÉ) ===
export interface UseDashboardResult {
  overview: UseDashboardOverviewResult;
  quickStats: UseQuickStatsResult;
  liveMetrics: UseLiveMetricsResult;
  widgets: UseWidgetStatsResult;
  activities: UseActivityStreamResult;
  health: UseDashboardHealthResult;
  refreshAll: () => Promise<void>;
  isLoading: boolean;
  hasErrors: boolean;
  hasCriticalError: boolean;
  lastRefresh: string | null;
}

export const useDashboard = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}): UseDashboardResult => {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  const overview = useDashboardOverview(autoRefresh);
  const quickStats = useQuickStats(autoRefresh);
  const liveMetrics = useLiveMetrics(autoRefresh);
  const widgets = useWidgetStats(autoRefresh);
  const activities = useActivityStream(autoRefresh);
  const health = useDashboardHealth();
  
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAll = useCallback(async () => {
    console.log('🔄 Rafraîchissement complet dashboard...');
    
    const results = await Promise.allSettled([
      overview.refetch(),
      quickStats.refetch(),
      liveMetrics.refetch(),
      widgets.refetch(),
      activities.refetch(),
      health.checkHealth()
    ]);
    
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`✅ Rafraîchissement terminé - ${results.length - failed}/${results.length} succès`);
    
    setLastRefresh(new Date().toISOString());
  }, [overview, quickStats, liveMetrics, widgets, activities, health]);

  // Refresh global périodique
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        console.log('⏰ Auto-refresh déclenché');
        refreshAll();
      }, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refreshAll]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isLoading = overview.loading || quickStats.loading || liveMetrics.loading || widgets.loading;
  const hasErrors = !!(overview.error || quickStats.error || liveMetrics.error || widgets.error);
  
  // Erreur critique = pas de données du tout et erreur de connexion
  const hasCriticalError = !health.isHealthy && !overview.overview && !quickStats.stats;

  return {
    overview,
    quickStats,
    liveMetrics,
    widgets,
    activities,
    health,
    refreshAll,
    isLoading,
    hasErrors,
    hasCriticalError,
    lastRefresh
  };
};

// === HOOKS GRAPHIQUES SIMPLIFIÉS (pour fonctionnalités futures) ===
export const useEnrollmentTrends = (initialPeriod: TimePeriod = '6months') => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>(initialPeriod);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getEnrollmentTrends(currentPeriod);
      if (response.success) {
        setData(response.chart_data);
      } else {
        setError(response.error || 'Fonctionnalité non disponible');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [currentPeriod]);

  const changePeriod = useCallback((period: TimePeriod) => {
    setCurrentPeriod(period);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    changePeriod,
    currentPeriod
  };
};

export const useFinancialFlows = (initialPeriod: TimePeriod = '6months') => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>(initialPeriod);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getFinancialFlows(currentPeriod);
      if (response.success) {
        setData(response.chart_data);
      } else {
        setError(response.error || 'Fonctionnalité non disponible');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [currentPeriod]);

  const changePeriod = useCallback((period: TimePeriod) => {
    setCurrentPeriod(period);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    changePeriod,
    currentPeriod
  };
};

// === HOOK CLASS DISTRIBUTION ===
export interface UseClassDistributionResult extends BaseHookResult {
  data: any | null;
}

export const useClassDistribution = (): UseClassDistributionResult => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getClassDistribution();
      if (!isMountedRef.current) return;

      if (response.success) {
        setData(response.class_distribution || response.chart_data || null);
      } else {
        setError(response.error || 'Fonctionnalité non disponible');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// === HOOK CACHE ET DIAGNOSTIC ===
export interface UseCacheResult {
  cacheInfo: any;
  clearCache: () => void;
  clearSpecificCache: (key: string) => void;
  refreshCacheInfo: () => void;
}

export const useCache = (): UseCacheResult => {
  const [cacheInfo, setCacheInfo] = useState<any>(null);

  const refreshCacheInfo = useCallback(() => {
    try {
      const info = dashboardService.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.warn('Erreur récupération info cache:', error);
      setCacheInfo({ error: 'Cache info indisponible' });
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      dashboardService.invalidateCache();
      refreshCacheInfo();
      console.log('✅ Cache vidé');
    } catch (error) {
      console.error('Erreur vidage cache:', error);
    }
  }, [refreshCacheInfo]);

  const clearSpecificCache = useCallback((key: string) => {
    try {
      dashboardService.clearSpecificCache(key);
      refreshCacheInfo();
      console.log(`✅ Cache vidé pour: ${key}`);
    } catch (error) {
      console.error(`Erreur vidage cache ${key}:`, error);
    }
  }, [refreshCacheInfo]);

  useEffect(() => {
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  return {
    cacheInfo,
    clearCache,
    clearSpecificCache,
    refreshCacheInfo
  };
};

// === EXPORTS ===
export default {
  // Hooks principaux
  useDashboardOverview,
  useQuickStats,
  useLiveMetrics,
  useWidgetStats,
  useActivityStream,
  
  // Hooks graphiques
  useEnrollmentTrends,
  useFinancialFlows,
  useClassDistribution,
  
  // Hooks système
  useDashboardHealth,
  
  // Hooks composites
  useDashboard,
  useCache
};