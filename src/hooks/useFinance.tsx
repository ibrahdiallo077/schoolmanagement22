// hooks/useFinance.tsx - Hook Finance Corrigé pour éviter les boucles infinies
import { useState, useEffect, useCallback, useRef } from 'react';
import { financeService, FinanceAPIError } from '../services/financeService';
import type {
  UseFinanceOptions,
  UseFinanceFilters,
  UseFinanceState,
  UseFinanceReturn,
  TransactionInjectionData,
  InjectionResponse,
  DashboardData,
  CurrentCapital,
  LiveTransaction,
  TransactionStatistics,
  FinancialReport,
  ReportPeriod,
  TransactionType
} from '../types/finance.types';

// ================================================================
// 🎣 HOOK PRINCIPAL useFinance - VERSION CORRIGÉE
// ================================================================

export function useFinance(
  options: UseFinanceOptions = {},
  filters: UseFinanceFilters = {}
): UseFinanceReturn {
  // Configuration par défaut CORRIGÉE pour éviter les boucles
  const {
    autoRefresh = false, // ✅ DÉSACTIVÉ PAR DÉFAUT pour éviter les boucles
    refreshInterval = 120000, // ✅ 2 minutes au lieu de 1 minute
    enableCache = true,
    onError,
    onSuccess,
  } = options;

  const {
    transactionFilters = { limit: 50 },
    manualTransactionType = 'all',
    manualTransactionLimit = 20
  } = filters;

  // ================================================================
  // 📊 ÉTAT DU HOOK
  // ================================================================

  const [state, setState] = useState<UseFinanceState>({
    // Données
    dashboard: null,
    capital: null,
    transactions: [],
    statistics: null,
    manualTransactions: [],
    
    // Chargement
    isLoading: true,
    isDashboardLoading: false,
    isCapitalLoading: false,
    isTransactionsLoading: false,
    isManualTransactionsLoading: false,
    
    // Erreurs
    error: null,
    dashboardError: null,
    capitalError: null,
    transactionsError: null,
    
    // Actions
    isInjecting: false,
    isDeleting: false,
    
    // Métadonnées
    lastUpdated: null,
    refreshCount: 0,
    connectionStatus: 'disconnected'
  });

  // Références pour éviter les fuites mémoire et contrôler les boucles
  const mountedRef = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRefreshingRef = useRef(false); // ✅ NOUVEAU: éviter les refresh multiples
  const lastRefreshTimeRef = useRef<number>(0); // ✅ NOUVEAU: throttling

  // ================================================================
  // 🔄 FONCTIONS DE MISE À JOUR CORRIGÉES
  // ================================================================

  const updateState = useCallback((updates: Partial<UseFinanceState>) => {
    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: any, context: string) => {
    if (!mountedRef.current) return;
    
    const errorMessage = FinanceAPIError.formatMessage(error);
    console.error(`💥 [useFinance] ${context}:`, error);
    
    // ✅ CORRECTION: Ne pas déclencher de refresh automatique sur erreur
    updateState({
      connectionStatus: 'error',
      error: errorMessage
    });
    
    if (onError && error instanceof FinanceAPIError) {
      onError(error);
    }
  }, [onError, updateState]);

  const handleSuccess = useCallback((action: string) => {
    if (!mountedRef.current) return;
    
    updateState({
      connectionStatus: 'connected',
      error: null,
      lastUpdated: new Date(),
      refreshCount: state.refreshCount + 1
    });
    
    if (onSuccess) {
      onSuccess(action);
    }
  }, [onSuccess, updateState, state.refreshCount]);

  // ================================================================
  // 📊 FONCTIONS DE CHARGEMENT DES DONNÉES CORRIGÉES
  // ================================================================

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading) {
        updateState({ isDashboardLoading: true, dashboardError: null });
      }
      
      const dashboard = await financeService.getDashboard(enableCache);
      
      if (mountedRef.current) {
        updateState({
          dashboard,
          isDashboardLoading: false,
          dashboardError: null
        });
        handleSuccess('dashboard loaded');
      }
    } catch (error) {
      if (mountedRef.current) {
        updateState({
          isDashboardLoading: false,
          dashboardError: FinanceAPIError.formatMessage(error)
        });
        handleError(error, 'Dashboard loading');
      }
    }
  }, [enableCache, updateState, handleError, handleSuccess]);

  const loadCapital = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading) {
        updateState({ isCapitalLoading: true, capitalError: null });
      }
      
      const capital = await financeService.getCurrentCapital(enableCache);
      
      if (mountedRef.current) {
        updateState({
          capital,
          isCapitalLoading: false,
          capitalError: null
        });
        handleSuccess('capital loaded');
      }
    } catch (error) {
      if (mountedRef.current) {
        updateState({
          isCapitalLoading: false,
          capitalError: FinanceAPIError.formatMessage(error)
        });
        handleError(error, 'Capital loading');
      }
    }
  }, [enableCache, updateState, handleError, handleSuccess]);

  const loadTransactions = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading) {
        updateState({ isTransactionsLoading: true, transactionsError: null });
      }
      
      const { transactions, statistics } = await financeService.getLiveTransactions(transactionFilters);
      
      if (mountedRef.current) {
        updateState({
          transactions,
          statistics,
          isTransactionsLoading: false,
          transactionsError: null
        });
        handleSuccess('transactions loaded');
      }
    } catch (error) {
      if (mountedRef.current) {
        updateState({
          isTransactionsLoading: false,
          transactionsError: FinanceAPIError.formatMessage(error)
        });
        handleError(error, 'Transactions loading');
      }
    }
  }, [transactionFilters, updateState, handleError, handleSuccess]);

  const loadManualTransactions = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading) {
        updateState({ isManualTransactionsLoading: true });
      }
      
      const manualTransactions = await financeService.getManualTransactions(
        manualTransactionLimit,
        manualTransactionType
      );
      
      if (mountedRef.current) {
        updateState({
          manualTransactions,
          isManualTransactionsLoading: false
        });
        handleSuccess('manual transactions loaded');
      }
    } catch (error) {
      if (mountedRef.current) {
        console.warn('⚠️ [useFinance] Transactions manuelles non disponibles:', error);
        updateState({ 
          isManualTransactionsLoading: false,
          manualTransactions: []
        });
      }
    }
  }, [manualTransactionLimit, manualTransactionType, updateState, handleSuccess]);

  // ================================================================
  // 🔄 FONCTION DE RAFRAÎCHISSEMENT CORRIGÉE AVEC THROTTLING
  // ================================================================

  const refreshAll = useCallback(async (showLoading = false, forceRefresh = false) => {
    if (!mountedRef.current) return;
    
    // ✅ CORRECTION 1: Éviter les refresh multiples simultanés
    if (isRefreshingRef.current && !forceRefresh) {
      console.log('🔄 [useFinance] Refresh déjà en cours, ignoré');
      return;
    }
    
    // ✅ CORRECTION 2: Throttling - minimum 30 secondes entre les refresh
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < 30000 && !forceRefresh) {
      console.log(`🔄 [useFinance] Refresh trop fréquent (${timeSinceLastRefresh}ms), ignoré`);
      return;
    }
    
    isRefreshingRef.current = true;
    lastRefreshTimeRef.current = now;
    
    console.log('🔄 [useFinance] Rafraîchissement séquentiel des données...');
    
    if (showLoading) {
      updateState({ isLoading: true });
    }
    
    // Annuler les requêtes précédentes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      // ✅ CHARGEMENT SÉQUENTIEL avec délais plus longs pour éviter 429
      console.log('📊 Chargement du dashboard...');
      await loadDashboard(false);
      
      // ✅ CORRECTION 3: Délai plus long entre les requêtes (1 seconde au lieu de 500ms)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('💰 Chargement du capital...');
      await loadCapital(false);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📋 Chargement des transactions...');
      await loadTransactions(false);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔧 Chargement des transactions manuelles...');
      await loadManualTransactions(false);
      
      if (mountedRef.current) {
        updateState({ isLoading: false });
        console.log('✅ [useFinance] Rafraîchissement séquentiel terminé avec succès');
      }
    } catch (error) {
      if (mountedRef.current) {
        updateState({ isLoading: false });
        handleError(error, 'Sequential refresh');
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [loadDashboard, loadCapital, loadTransactions, loadManualTransactions, updateState, handleError]);

  // ================================================================
  // 💉 FONCTIONS D'INJECTION CORRIGÉES
  // ================================================================

  const injectTransaction = useCallback(async (data: TransactionInjectionData): Promise<InjectionResponse> => {
    if (!mountedRef.current) throw new Error('Component unmounted');
    
    try {
      updateState({ isInjecting: true, error: null });
      
      console.log('🚀 [useFinance] Injection de transaction:', data);
      
      const response = await financeService.injectTransaction(data);
      
      if (mountedRef.current) {
        updateState({ isInjecting: false });
        handleSuccess('transaction injected');
        
        // ✅ CORRECTION 4: Délai plus long et pas de refresh automatique
        console.log('💡 Transaction injectée, refresh manuel recommandé');
      }
      
      return response;
    } catch (error) {
      if (mountedRef.current) {
        updateState({ isInjecting: false });
        handleError(error, 'Transaction injection');
      }
      throw error;
    }
  }, [updateState, handleError, handleSuccess]);

  const addMoney = useCallback(async (
    amount: number, 
    description: string, 
    category?: string, 
    entityName?: string
  ): Promise<InjectionResponse> => {
    return injectTransaction({
      type: 'INCOME',
      amount,
      description,
      category: category || 'Revenus divers',
      entity_name: entityName || 'Manuel',
      impact_capital: true
    });
  }, [injectTransaction]);

  const removeMoney = useCallback(async (
    amount: number, 
    description: string, 
    category?: string, 
    entityName?: string
  ): Promise<InjectionResponse> => {
    return injectTransaction({
      type: 'EXPENSE',
      amount,
      description,
      category: category || 'Dépenses diverses',
      entity_name: entityName || 'Manuel',
      impact_capital: true
    });
  }, [injectTransaction]);

  const initializeCapital = useCallback(async (amount: number, description?: string) => {
    if (!mountedRef.current) throw new Error('Component unmounted');
    
    try {
      updateState({ isInjecting: true, error: null });
      
      const response = await financeService.initializeCapital(amount, description);
      
      if (mountedRef.current) {
        updateState({ isInjecting: false });
        handleSuccess('capital initialized');
        
        // ✅ CORRECTION: Pas de refresh automatique
        console.log('💡 Capital initialisé, refresh manuel recommandé');
      }
      
      return response;
    } catch (error) {
      if (mountedRef.current) {
        updateState({ isInjecting: false });
        handleError(error, 'Capital initialization');
      }
      throw error;
    }
  }, [updateState, handleError, handleSuccess]);

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionInjectionData>) => {
    if (!mountedRef.current) throw new Error('Component unmounted');
    
    try {
      updateState({ isInjecting: true, error: null });
      
      const response = await financeService.updateManualTransaction(id, data);
      
      if (mountedRef.current) {
        updateState({ isInjecting: false });
        handleSuccess('transaction updated');
        
        // ✅ CORRECTION: Pas de refresh automatique
        console.log('💡 Transaction modifiée, refresh manuel recommandé');
      }
      
      return response;
    } catch (error) {
      if (mountedRef.current) {
        updateState({ isInjecting: false });
        handleError(error, 'Transaction update');
      }
      throw error;
    }
  }, [updateState, handleError, handleSuccess]);

  const getTransactionDetails = useCallback(async (id: string) => {
    try {
      return await financeService.getTransactionDetails(id);
    } catch (error) {
      handleError(error, 'Transaction details');
      throw error;
    }
  }, [handleError]);

  // ================================================================
  // 🗑️ FONCTION DE SUPPRESSION CORRIGÉE
  // ================================================================

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    if (!mountedRef.current) throw new Error('Component unmounted');
    
    try {
      updateState({ isDeleting: true, error: null });
      
      await financeService.deleteManualTransaction(id);
      
      if (mountedRef.current) {
        updateState({ isDeleting: false });
        handleSuccess('transaction deleted');
        
        // ✅ CORRECTION: Pas de refresh automatique
        console.log('💡 Transaction supprimée, refresh manuel recommandé');
      }
    } catch (error) {
      if (mountedRef.current) {
        updateState({ isDeleting: false });
        handleError(error, 'Transaction deletion');
      }
      throw error;
    }
  }, [updateState, handleError, handleSuccess]);

  // ================================================================
  // 📈 FONCTIONS DE RAPPORT
  // ================================================================

  const getReport = useCallback(async (
    period: ReportPeriod = 'current_month',
    year?: number,
    month?: number
  ): Promise<FinancialReport> => {
    try {
      return await financeService.getReport(period, year, month);
    } catch (error) {
      handleError(error, 'Report generation');
      throw error;
    }
  }, [handleError]);

  // ================================================================
  // 🔧 FONCTIONS UTILITAIRES
  // ================================================================

  const clearCache = useCallback(() => {
    financeService.invalidateCache();
    console.log('🧹 [useFinance] Cache invalidé');
  }, []);

  const diagnose = useCallback(async () => {
    try {
      return await financeService.diagnose();
    } catch (error) {
      handleError(error, 'Diagnostic');
      throw error;
    }
  }, [handleError]);

  // ✅ NOUVELLE FONCTION: Refresh manuel avec force
  const manualRefresh = useCallback(() => {
    console.log('🔄 [useFinance] Refresh manuel déclenché');
    return refreshAll(true, true); // force = true
  }, [refreshAll]);

  // ================================================================
  // ⏰ EFFET DE RAFRAÎCHISSEMENT AUTOMATIQUE CORRIGÉ
  // ================================================================

  useEffect(() => {
    // ✅ CORRECTION: Auto-refresh désactivé par défaut pour éviter les boucles
    if (!autoRefresh) {
      console.log('🔄 [useFinance] Auto-refresh désactivé');
      return;
    }
    
    console.log(`🔄 [useFinance] Auto-refresh activé (intervalle: ${refreshInterval}ms)`);
    
    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !isRefreshingRef.current) {
          console.log('🔄 [useFinance] Auto-refresh déclenché');
          refreshAll(false, false); // pas de force sur auto-refresh
          setupAutoRefresh();
        }
      }, refreshInterval);
    };
    
    setupAutoRefresh();
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshAll]);

  // ================================================================
  // 🚀 EFFET D'INITIALISATION CORRIGÉ
  // ================================================================

  useEffect(() => {
    let initialLoadTimer: NodeJS.Timeout;
    
    // ✅ CORRECTION: Délai plus long pour l'initialisation
    initialLoadTimer = setTimeout(() => {
      if (mountedRef.current) {
        console.log('🚀 [useFinance] Chargement initial');
        refreshAll(true, true); // force pour le chargement initial
      }
    }, 500); // 500ms au lieu de 100ms
    
    return () => {
      clearTimeout(initialLoadTimer);
    };
  }, []); // ✅ CORRECTION: Dépendances vides pour éviter les re-renders

  // ================================================================
  // 🧹 NETTOYAGE
  // ================================================================

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      isRefreshingRef.current = false;
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ================================================================
  // 📊 DONNÉES CALCULÉES
  // ================================================================

  const isAnyLoading = state.isDashboardLoading || 
                      state.isCapitalLoading || 
                      state.isTransactionsLoading || 
                      state.isManualTransactionsLoading ||
                      state.isLoading;

  const hasAnyError = !!(state.error || 
                        state.dashboardError || 
                        state.capitalError || 
                        state.transactionsError);

  // Données dérivées avec valeurs par défaut sûres
  const currentBalance = state.capital?.current_balance || 0;
  const formattedBalance = state.capital?.formatted_balance || '0 FG';
  const monthlyIncome = state.dashboard?.unified_flows?.income?.monthly || 0;
  const monthlyExpenses = state.dashboard?.unified_flows?.expenses?.monthly || 0;
  const netFlow = state.dashboard?.unified_flows?.net_balance?.amount || 0;
  const alertsCount = state.dashboard?.alerts?.length || 0;
  const transactionCount = state.transactions.length;
  const financialHealth = state.dashboard?.financial_health || null;
  const alerts = state.dashboard?.alerts || [];
  const totalTransactions = state.statistics?.total_transactions || 0;
  const totalIncome = state.statistics?.total_income || 0;
  const totalExpenses = state.statistics?.total_expenses || 0;

  // Score de santé avec calcul par défaut
  const healthScore = financialHealth ? {
    score: financialHealth.score,
    level: financialHealth.level
  } : null;

  // ================================================================
  // 🎯 RETOUR DU HOOK
  // ================================================================

  return {
    // 📊 Données principales
    dashboard: state.dashboard,
    capital: state.capital,
    transactions: state.transactions,
    statistics: state.statistics,
    manualTransactions: state.manualTransactions,
    
    // 📈 Données calculées
    healthScore,
    
    // ⏳ États de chargement
    isLoading: state.isLoading,
    isDashboardLoading: state.isDashboardLoading,
    isCapitalLoading: state.isCapitalLoading,
    isTransactionsLoading: state.isTransactionsLoading,
    isManualTransactionsLoading: state.isManualTransactionsLoading,
    isAnyLoading,
    
    // ❌ États d'erreur
    error: state.error,
    dashboardError: state.dashboardError,
    capitalError: state.capitalError,
    transactionsError: state.transactionsError,
    hasAnyError,
    
    // 🔄 États d'action
    isInjecting: state.isInjecting,
    isDeleting: state.isDeleting,
    
    // 🔗 État de connexion
    connectionStatus: state.connectionStatus,
    
    // 📅 Métadonnées
    lastUpdated: state.lastUpdated,
    refreshCount: state.refreshCount,
    
    // 🔄 Actions de rafraîchissement CORRIGÉES
    refresh: manualRefresh, // ✅ CORRECTION: Utiliser le refresh manuel
    refreshDashboard: loadDashboard,
    refreshCapital: loadCapital,
    refreshTransactions: loadTransactions,
    refreshManualTransactions: loadManualTransactions,
    
    // 💉 Actions d'injection et modification
    injectTransaction,
    addMoney,
    removeMoney,
    initializeCapital,
    updateTransaction,
    getTransactionDetails,
    
    // 🗑️ Actions de suppression
    deleteTransaction,
    
    // 📈 Actions de rapport
    getReport,
    
    // 🔧 Utilitaires
    clearCache,
    diagnose,
    formatGNF: financeService.formatGNF,
    
    // 📊 Raccourcis vers les données importantes
    currentBalance,
    formattedBalance,
    monthlyIncome,
    monthlyExpenses,
    netFlow,
    alertsCount,
    transactionCount,
    
    // 🏥 Santé financière
    financialHealth,
    alerts,
    
    // 📊 Statistiques
    totalTransactions,
    totalIncome,
    totalExpenses,
    
    // ✅ NOUVEAUX: Contrôles additionnels
    isRefreshing: isRefreshingRef.current,
    lastRefreshTime: lastRefreshTimeRef.current,
    autoRefreshEnabled: autoRefresh
  };
}

// ================================================================
// 🎣 HOOKS SPÉCIALISÉS CORRIGÉS
// ================================================================

/**
 * Hook pour le capital uniquement (mise à jour rapide) - CORRIGÉ
 */
export function useCapital(options: { autoRefresh?: boolean; refreshInterval?: number } = {}) {
  const {
    autoRefresh = false, // ✅ CORRECTION: Désactivé par défaut
    refreshInterval = 60000 // ✅ CORRECTION: 1 minute au lieu de 30 secondes
  } = options;

  return useFinance(
    { autoRefresh, refreshInterval, enableCache: true },
    { transactionFilters: { limit: 0 }, manualTransactionLimit: 0 }
  );
}

/**
 * Hook pour les transactions uniquement - CORRIGÉ
 */
export function useTransactions(
  filters: { limit?: number; type?: TransactionType } = { limit: 50 },
  options: { autoRefresh?: boolean; refreshInterval?: number } = {}
) {
  const {
    autoRefresh = false, // ✅ CORRECTION: Désactivé par défaut
    refreshInterval = 60000 // ✅ CORRECTION: 1 minute
  } = options;

  return useFinance(
    { autoRefresh, refreshInterval, enableCache: false },
    { transactionFilters: filters }
  );
}

/**
 * Hook pour les transactions manuelles uniquement - CORRIGÉ
 */
export function useManualTransactions(
  type: 'INCOME' | 'EXPENSE' | 'all' = 'all',
  limit = 20,
  options: { autoRefresh?: boolean } = {}
) {
  const { autoRefresh = false } = options; // ✅ Reste désactivé

  return useFinance(
    { autoRefresh, enableCache: false },
    { 
      transactionFilters: { limit: 0 },
      manualTransactionType: type,
      manualTransactionLimit: limit
    }
  );
}

/**
 * Hook pour injection de transactions (sans auto-refresh) - CORRIGÉ
 */
export function useFinanceActions() {
  return useFinance(
    { autoRefresh: false, enableCache: false }, // ✅ Bien désactivé
    { transactionFilters: { limit: 0 }, manualTransactionLimit: 0 }
  );
}

// ================================================================
// 🔧 HOOK DE DIAGNOSTIC
// ================================================================

export function useFinanceDiagnostic() {
  const [diagnostic, setDiagnostic] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    try {
      const result = await financeService.diagnose();
      setDiagnostic(result);
      return result;
    } catch (error) {
      console.error('💥 Erreur diagnostic:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    diagnostic,
    isRunning,
    runDiagnostic
  };
}

// ================================================================
// 🚀 EXPORTS
// ================================================================

export default useFinance;