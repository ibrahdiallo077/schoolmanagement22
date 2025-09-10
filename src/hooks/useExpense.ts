// hooks/useExpense.ts - VERSION COMPLÈTE CORRIGÉE AVEC UUID HARMONISÉ

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseResponsible,
  CreateExpenseDto,
  ExpenseFilters,
  ExpenseDashboard,
  UseExpensesOptions,
  UseExpensesReturn,
  PaginatedResponse
} from '@/types/expense.types';

import ExpenseService, { validateUUID, cleanExpenseIds, debugUUID } from '@/services/expenseService';

// ============================================================================
// MAIN HOOK - VERSION COMPLÈTE CORRIGÉE AVEC UUID HARMONISÉ
// ============================================================================

export const useExpenses = (options: UseExpensesOptions = {}): UseExpensesReturn => {
  const {
    autoLoad = true,
    defaultFilters = {},
    onError
  } = options;

  // ==================== State ====================
  
  // Data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [statuses, setStatuses] = useState<ExpenseStatus[]>([]);
  const [responsibles, setResponsibles] = useState<ExpenseResponsible[]>([]);
  const [dashboard, setDashboard] = useState<ExpenseDashboard | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Filters and pagination
  const [filters, setFiltersState] = useState<ExpenseFilters>({
    page: 1,
    limit: 20,
    sort_by: 'expense_date' as keyof Expense,
    sort_order: 'desc' as 'asc' | 'desc',
    ...defaultFilters
  });
  
  const [pagination, setPagination] = useState<PaginatedResponse<Expense>['pagination'] | null>(null);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ==================== Error Handling ====================
  
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`💥 Error in ${context}:`, error);
    
    const userMessage = error.message.includes('fetch') 
      ? 'Problème de connexion au serveur. Vérifiez que le backend est démarré.' 
      : error.message || `Erreur lors de ${context}`;
    
    setError(userMessage);
    
    if (onError) {
      onError(error);
    } else {
      toast.error(userMessage);
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== Configuration Loading ROBUSTE ====================
  
  const loadConfigurations = useCallback(async () => {
    setConfigLoading(true);
    clearError();
    
    try {
      console.log('📄 Loading configurations from unified API...');
      
      // 🔥 GESTION ROBUSTE : Chaque config est chargée indépendamment avec fallbacks
      const configPromises = [
        ExpenseService.getCategories().catch(error => {
          console.warn('⚠️ Categories loading failed:', error);
          return { success: false, data: [], error: error.message };
        }),
        ExpenseService.getStatuses().catch(error => {
          console.warn('⚠️ Statuses loading failed:', error);
          return { success: false, data: [], error: error.message };
        }),
        ExpenseService.getResponsibles().catch(error => {
          console.warn('⚠️ Responsibles loading failed:', error);
          return { success: false, data: [], error: error.message };
        })
      ];

      const [categoriesRes, statusesRes, responsiblesRes] = await Promise.allSettled(configPromises);

      // Handle categories avec fallback gracieux
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        console.log('✅ Categories loaded:', categoriesRes.value.data?.length);
        setCategories(categoriesRes.value.data || []);
      } else {
        console.warn('⚠️ Categories failed to load - using empty array');
        setCategories([]);
      }

      // Handle statuses avec fallback par défaut
      if (statusesRes.status === 'fulfilled' && statusesRes.value.success) {
        console.log('✅ Statuses loaded:', statusesRes.value.data?.length);
        setStatuses(statusesRes.value.data || []);
      } else {
        console.warn('⚠️ Statuses failed to load - using fallback');
        setStatuses([
          { id: 'pending', name: 'En attente', color: '#F59E0B', icon: 'Clock' },
          { id: 'paid', name: 'Payé', color: '#10B981', icon: 'Check' },
          { id: 'rejected', name: 'Rejeté', color: '#EF4444', icon: 'X' }
        ] as ExpenseStatus[]);
      }

      // Handle responsibles avec fallback gracieux (non-critique)
      if (responsiblesRes.status === 'fulfilled' && responsiblesRes.value.success) {
        console.log('✅ Responsibles loaded:', responsiblesRes.value.data?.length);
        setResponsibles(responsiblesRes.value.data || []);
      } else {
        console.warn('⚠️ Responsibles failed to load - using empty array (non-critical)');
        setResponsibles([]); // Non-critique, peut être vide
      }

      console.log('✅ Configuration loading completed (with potential fallbacks)');

    } catch (error) {
      console.error('💥 Critical configuration loading error:', error);
      handleError(error as Error, 'chargement des configurations');
      
      // 🔥 Fallback configurations pour permettre à l'app de fonctionner
      setCategories([]);
      setStatuses([
        { id: 'pending', name: 'En attente', color: '#F59E0B', icon: 'Clock' },
        { id: 'paid', name: 'Payé', color: '#10B981', icon: 'Check' },
        { id: 'rejected', name: 'Rejeté', color: '#EF4444', icon: 'X' }
      ] as ExpenseStatus[]);
      setResponsibles([]);
    } finally {
      setConfigLoading(false);
    }
  }, [handleError]);

  // ==================== Data Loading ====================
  
  const loadExpenses = useCallback(async (newFilters?: Partial<ExpenseFilters>) => {
    setLoading(true);
    clearError();
    
    try {
      const filtersToUse = newFilters ? { ...filters, ...newFilters } : filters;
      console.log('📄 Loading expenses with filters:', filtersToUse);
      
      const response = await ExpenseService.getExpenses(filtersToUse);
      
      if (response.success) {
        console.log('✅ Expenses loaded:', response.data?.length);
        setExpenses(response.data || []);
        setPagination(response.pagination);
      } else {
        throw new Error(response.error || 'Erreur de chargement des dépenses');
      }
      
    } catch (error) {
      handleError(error as Error, 'chargement des dépenses');
      // En cas d'erreur, garder les données existantes plutôt que de tout effacer
    } finally {
      setLoading(false);
    }
  }, [filters, handleError]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    
    try {
      console.log('📄 Loading dashboard from unified API...');
      const response = await ExpenseService.getDashboard();
      
      if (response.success) {
        console.log('✅ Dashboard loaded successfully');
        setDashboard(response.data || null);
      } else {
        console.warn('⚠️ Dashboard loading failed:', response.error);
        // Ne pas lancer d'erreur pour le dashboard, juste un warning
      }
      
    } catch (error) {
      console.warn('⚠️ Dashboard loading error:', error);
      // Ne pas afficher d'erreur utilisateur pour le dashboard
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // ==================== CRUD Operations ====================
  
  const createExpense = useCallback(async (data: CreateExpenseDto): Promise<Expense | null> => {
    setCreating(true);
    clearError();
    
    try {
      console.log('📄 Creating expense with unified API...', data);
      const response = await ExpenseService.createExpense(data);
      
      if (response.success && response.data) {
        toast.success(response.message || 'Dépense créée avec succès');
        
        // Refresh the list
        await Promise.all([
          loadExpenses(),
          loadDashboard()
        ]);
        
        console.log('✅ Expense created:', response.data.id);
        return response.data;
      } else {
        throw new Error(response.error || 'Erreur lors de la création');
      }
      
    } catch (error) {
      handleError(error as Error, 'création de la dépense');
      return null;
    } finally {
      setCreating(false);
    }
  }, [loadExpenses, loadDashboard, handleError]);

  const updateExpense = useCallback(async (id: string, data: Partial<CreateExpenseDto>): Promise<Expense | null> => {
    setUpdating(true);
    clearError();
    
    try {
      console.log('📄 Updating expense with unified API...', id, data);
      const response = await ExpenseService.updateExpense(id, data);
      
      if (response.success) {
        toast.success(response.message || 'Dépense modifiée avec succès');
        
        // Recharger les dépenses car updateExpense ne retourne pas les données complètes
        await Promise.all([
          loadExpenses(),
          loadDashboard()
        ]);
        
        console.log('✅ Expense updated:', id);
        return null; // Retourner null car on recharge les données
      } else {
        throw new Error(response.error || 'Erreur lors de la modification');
      }
      
    } catch (error) {
      handleError(error as Error, 'modification de la dépense');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [loadExpenses, loadDashboard, handleError]);

  // 🔥 CORRECTION : Utiliser changeExpenseStatus au lieu de updateExpenseStatus
  const updateExpenseStatus = useCallback(async (id: string, status_id: string, notes?: string): Promise<Expense | null> => {
    setUpdating(true);
    clearError();
    
    try {
      console.log('📄 Updating expense status with unified API...', id, status_id);
      const response = await ExpenseService.changeExpenseStatus(id, status_id, notes);
      
      if (response.success) {
        toast.success(response.message || 'Statut modifié avec succès');
        
        // Recharger les dépenses et le dashboard
        await Promise.all([
          loadExpenses(),
          loadDashboard()
        ]);
        
        console.log('✅ Expense status updated:', id);
        return null; // Retourner null car on recharge les données
      } else {
        throw new Error(response.error || 'Erreur lors du changement de statut');
      }
      
    } catch (error) {
      handleError(error as Error, 'changement de statut de la dépense');
      return null;
    } finally {
      setUpdating(false);
    }
  }, [loadExpenses, loadDashboard, handleError]);

  // 🔥 CORRECTION : Suppression individuelle avec mise à jour optimiste et validation UUID
  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    // Validation préalable
    const cleanId = validateUUID(id, 'deleteExpense-hook');
    if (!cleanId) {
      console.error('❌ [useExpenses] ID invalide pour suppression:', id);
      debugUUID(id, 'deleteExpense-hook');
      toast.error('ID de dépense invalide');
      return false;
    }

    setDeleting(true);
    clearError();
    
    try {
      console.log('🗑️ [useExpenses] Suppression de la dépense:', cleanId);

      // 📡 Appel API avec UUID validé
      const response = await ExpenseService.deleteExpense(cleanId);
      
      if (response.success) {
        console.log('✅ [useExpenses] Suppression API réussie pour:', cleanId);
        
        // 🔥 CORRECTION : Mise à jour IMMÉDIATE de la liste locale
        setExpenses(prevExpenses => {
          const filteredExpenses = prevExpenses.filter(exp => exp.id !== cleanId);
          console.log(`📊 [useExpenses] Liste mise à jour: ${prevExpenses.length} -> ${filteredExpenses.length}`);
          return filteredExpenses;
        });
        
        // Nettoyer la sélection
        setSelectedIds(prevSelected => {
          const cleanedSelection = prevSelected.filter(selectedId => selectedId !== cleanId);
          if (cleanedSelection.length !== prevSelected.length) {
            console.log(`🎯 [useExpenses] Sélection nettoyée: ${prevSelected.length} -> ${cleanedSelection.length}`);
          }
          return cleanedSelection;
        });
        
        // Mise à jour du dashboard en arrière-plan
        loadDashboard().catch(err => {
          console.warn('⚠️ [useExpenses] Erreur reload dashboard après suppression:', err);
        });
        
        toast.success(response.message || 'Dépense supprimée avec succès');
        console.log('✅ [useExpenses] Suppression complète pour:', cleanId);
        
        return true;
      } else {
        console.error('❌ [useExpenses] Échec suppression API:', response.error);
        throw new Error(response.error || 'Erreur lors de la suppression');
      }
      
    } catch (error: any) {
      console.error('💥 [useExpenses] Erreur suppression:', error);
      handleError(error, 'suppression de la dépense');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [loadDashboard, handleError]);

  // 🔥 CORRECTION : Suppression multiple optimisée avec validation UUID
  const deleteMultipleExpenses = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!Array.isArray(ids) || ids.length === 0) {
      console.warn('⚠️ [useExpenses] Aucun ID fourni pour suppression multiple');
      return true;
    }
    
    // Nettoyer et valider les IDs
    const cleanIds = cleanExpenseIds(ids);
    if (cleanIds.length === 0) {
      console.error('❌ [useExpenses] Aucun ID valide pour suppression multiple');
      toast.error('Aucune dépense valide sélectionnée');
      return false;
    }

    if (cleanIds.length !== ids.length) {
      console.warn(`⚠️ [useExpenses] IDs filtrés: ${ids.length} -> ${cleanIds.length}`);
    }
    
    setDeleting(true);
    clearError();
    
    try {
      console.log('🗑️ [useExpenses] Suppression multiple de:', cleanIds.length, 'dépenses');

      // 📡 Utiliser le service avec suppression multiple optimisée
      const response = await ExpenseService.deleteMultipleExpenses(cleanIds);
      
      if (response.success && response.data) {
        const { successful, failed, successfulIds, errors } = response.data;
        
        console.log(`✅ [useExpenses] Suppression multiple: ${successful} réussies, ${failed} échouées`);
        
        if (successful > 0 && successfulIds.length > 0) {
          // 🔥 CORRECTION : Mise à jour IMMÉDIATE pour les suppressions réussies
          setExpenses(prevExpenses => {
            const filteredExpenses = prevExpenses.filter(exp => !successfulIds.includes(exp.id));
            console.log(`📊 [useExpenses] Liste mise à jour après suppression multiple: ${prevExpenses.length} -> ${filteredExpenses.length}`);
            return filteredExpenses;
          });
          
          // Nettoyer la sélection pour les éléments supprimés
          setSelectedIds(prevSelected => {
            const cleanedSelection = prevSelected.filter(selectedId => !successfulIds.includes(selectedId));
            console.log(`🎯 [useExpenses] Sélection nettoyée après suppression multiple: ${prevSelected.length} -> ${cleanedSelection.length}`);
            return cleanedSelection;
          });
          
          // Mise à jour du dashboard en arrière-plan
          loadDashboard().catch(err => {
            console.warn('⚠️ [useExpenses] Erreur reload dashboard après suppression multiple:', err);
          });
        }
        
        // Messages utilisateur
        if (failed === 0) {
          toast.success(`${successful} dépense(s) supprimée(s) avec succès`);
        } else {
          toast.success(`${successful} dépense(s) supprimée(s)`);
          if (failed > 0) {
            toast.error(`${failed} suppression(s) échouée(s)`);
            console.error('❌ [useExpenses] Erreurs suppression multiple:', errors);
          }
        }
        
        return failed === 0;
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression multiple');
      }
      
    } catch (error: any) {
      console.error('💥 [useExpenses] Erreur suppression multiple:', error);
      handleError(error, 'suppression multiple des dépenses');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [loadDashboard, handleError]);

  // ==================== Filter Management ====================
  
  const setFilters = useCallback((newFilters: Partial<ExpenseFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Reset to first page when filters change (except when changing page itself)
    if (!newFilters.page && Object.keys(newFilters).length > 0) {
      updatedFilters.page = 1;
    }
    
    setFiltersState(updatedFilters);
    console.log('📄 Filters updated:', updatedFilters);
  }, [filters]);

  const clearFilters = useCallback(() => {
    const clearedFilters: ExpenseFilters = {
      page: 1,
      limit: filters.limit,
      sort_by: 'expense_date' as keyof Expense,
      sort_order: 'desc' as 'asc' | 'desc'
    };
    
    setFiltersState(clearedFilters);
    console.log('🧹 Filters cleared');
  }, [filters.limit]);

  // ==================== 🔥 CORRECTION : Selection Management avec validation UUID ====================
  
  const selectExpense = useCallback((id: string) => {
    const cleanId = validateUUID(id, 'selectExpense');
    if (!cleanId) {
      console.warn('⚠️ [useExpenses] Tentative de sélection avec ID invalide:', id);
      debugUUID(id, 'selectExpense');
      return;
    }

    setSelectedIds(prev => {
      const isSelected = prev.includes(cleanId);
      const newSelection = isSelected 
        ? prev.filter(selectedId => selectedId !== cleanId)
        : [...prev, cleanId];
      
      console.log(`🎯 [useExpenses] Sélection ${isSelected ? 'désélectionnée' : 'sélectionnée'}:`, cleanId);
      return newSelection;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allValidIds = expenses
        .map(exp => validateUUID(exp.id, 'selectAll'))
        .filter((id): id is string => id !== null);
      
      const isAllSelected = prev.length === allValidIds.length && 
        allValidIds.every(id => prev.includes(id));
      
      const newSelection = isAllSelected ? [] : allValidIds;
      
      console.log(`🎯 [useExpenses] Sélection globale: ${prev.length} -> ${newSelection.length}`);
      return newSelection;
    });
  }, [expenses]);

  const clearSelection = useCallback(() => {
    console.log('🧹 [useExpenses] Nettoyage de la sélection');
    setSelectedIds([]);
  }, []);

  // ==================== Utility Functions ====================
  
  const refreshAll = useCallback(async () => {
    console.log('📄 Refreshing all data from unified API...');
    clearError();
    
    try {
      await Promise.all([
        loadConfigurations(),
        loadExpenses(),
        loadDashboard()
      ]);
      console.log('✅ All data refreshed successfully');
      toast.success('Données actualisées');
    } catch (error) {
      handleError(error as Error, 'actualisation des données');
    }
  }, [loadConfigurations, loadExpenses, loadDashboard, handleError]);

  const getExpenseById = useCallback((id: string): Expense | undefined => {
    const cleanId = validateUUID(id, 'getExpenseById');
    return cleanId ? expenses.find(exp => exp.id === cleanId) : undefined;
  }, [expenses]);

  const getCategoryById = useCallback((id: string): ExpenseCategory | undefined => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const getStatusById = useCallback((id: string): ExpenseStatus | undefined => {
    return statuses.find(status => status.id === id);
  }, [statuses]);

  const getResponsibleById = useCallback((id: string): ExpenseResponsible | undefined => {
    return responsibles.find(resp => resp.id === id);
  }, [responsibles]);

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      console.log('🧪 Testing API connection...');
      const response = await ExpenseService.testConnection();
      
      if (response.success) {
        toast.success('Connexion API réussie');
        console.log('✅ API connection test passed:', response.data);
        return true;
      } else {
        toast.error('Test de connexion échoué');
        console.error('❌ API connection test failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('💥 API connection test error:', error);
      toast.error('Erreur de test de connexion');
      return false;
    }
  }, []);

  // ==================== 🔥 CORRECTION : Computed Values avec validation UUID ====================
  
  const computedStats = useMemo(() => {
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // 🔥 CORRECTION : Utiliser les bons noms de champs selon le backend
    const paidExpenses = expenses.filter(exp => 
      exp.status_name?.toLowerCase().includes('payé') || 
      exp.status_name?.toLowerCase().includes('paid') ||
      exp.statut_nom?.toLowerCase().includes('payé') || 
      exp.statut_nom?.toLowerCase().includes('paid')
    );
    
    const pendingExpenses = expenses.filter(exp => 
      exp.status_name?.toLowerCase().includes('attente') || 
      exp.status_name?.toLowerCase().includes('pending') ||
      exp.statut_nom?.toLowerCase().includes('attente') || 
      exp.statut_nom?.toLowerCase().includes('pending')
    );
    
    const paidAmount = paidExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const pendingAmount = pendingExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // 🔥 CORRECTION : Calcul sécurisé pour les éléments sélectionnés avec validation UUID
    const selectedExpenses = expenses.filter(exp => {
      const cleanId = validateUUID(exp.id, 'computedStats-selected');
      return cleanId && selectedIds.includes(cleanId);
    });
    
    const selectedAmount = selectedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    return {
      totalAmount,
      totalAmountFormatted: new Intl.NumberFormat('fr-FR').format(totalAmount) + ' FG',
      paidAmount,
      paidAmountFormatted: new Intl.NumberFormat('fr-FR').format(paidAmount) + ' FG',
      pendingAmount,
      pendingAmountFormatted: new Intl.NumberFormat('fr-FR').format(pendingAmount) + ' FG',
      paidCount: paidExpenses.length,
      pendingCount: pendingExpenses.length,
      averageAmount: expenses.length > 0 ? totalAmount / expenses.length : 0,
      averageAmountFormatted: expenses.length > 0 ? 
        new Intl.NumberFormat('fr-FR').format(totalAmount / expenses.length) + ' FG' : '0 FG',
      selectedAmount,
      selectedAmountFormatted: new Intl.NumberFormat('fr-FR').format(selectedAmount) + ' FG',
      selectedCount: selectedExpenses.length
    };
  }, [expenses, selectedIds]);

  // Is ready check - Plus flexible
  const isReady = useMemo(() => {
    // L'app est prête dès qu'on a au moins les statuts (les catégories peuvent être vides)
    return statuses.length > 0;
  }, [statuses.length]);

  // ==================== Effects ====================
  
  // Initial setup
  useEffect(() => {
    if (autoLoad) {
      console.log('🚀 Initializing expense hook with unified API...');
      loadConfigurations();
    }
  }, [autoLoad, loadConfigurations]);

  // Load expenses when configurations are ready and filters change
  useEffect(() => {
    if (autoLoad && isReady && !loading) {
      console.log('📄 Loading expenses due to filter change...');
      loadExpenses();
    }
  }, [filters, autoLoad, isReady, loadExpenses]);

  // Load dashboard when expenses change - Optimisé
  useEffect(() => {
    if (autoLoad && isReady && !dashboardLoading) {
      console.log('📄 Loading dashboard due to readiness...');
      loadDashboard();
    }
  }, [autoLoad, isReady, loadDashboard]);

  // 🔥 NOUVEAU : Effect pour nettoyer les sélections invalides
  useEffect(() => {
    const validExpenseIds = expenses
      .map(exp => validateUUID(exp.id, 'cleanup-selection'))
      .filter((id): id is string => id !== null);
    
    const invalidSelections = selectedIds.filter(id => !validExpenseIds.includes(id));
    
    if (invalidSelections.length > 0) {
      console.log('🧹 [useExpenses] Nettoyage des sélections invalides:', invalidSelections);
      setSelectedIds(prev => prev.filter(id => validExpenseIds.includes(id)));
    }
  }, [expenses, selectedIds]);

  // ==================== Return Hook Interface ====================
  
  return {
    // Data
    expenses,
    categories,
    statuses,
    responsibles,
    dashboard,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    configLoading,
    dashboardLoading,
    
    // Error state
    error,
    clearError,
    
    // Ready state
    isReady,
    
    // Filters & pagination
    filters,
    pagination,
    
    // Selection
    selectedIds,
    
    // Actions - CRUD
    loadExpenses,
    loadDashboard,
    createExpense,
    updateExpense,
    updateExpenseStatus,
    deleteExpense,
    deleteMultipleExpenses,
    
    // Filters
    setFilters,
    clearFilters,
    
    // Selection
    selectExpense,
    selectAll,
    clearSelection,
    
    // Utils
    refreshAll,
    getExpenseById,
    getCategoryById,
    getStatusById,
    getResponsibleById,
    testApiConnection,
    
    // Computed stats
    stats: computedStats
  };
};

// ============================================================================
// SPECIALIZED HOOKS - VERSIONS AMÉLIORÉES
// ============================================================================

/**
 * Hook for dashboard only (lighter) - VERSION ROBUSTE
 */
export const useExpenseDashboard = () => {
  const [dashboard, setDashboard] = useState<ExpenseDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Loading dashboard (hook) from unified API...');
      const response = await ExpenseService.getDashboard();
      
      if (response.success) {
        console.log('✅ Dashboard (hook) loaded successfully');
        setDashboard(response.data || null);
      } else {
        throw new Error(response.error || 'Erreur de chargement du dashboard');
      }
    } catch (error) {
      console.error('💥 Dashboard (hook) loading error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: loadDashboard
  };
};

/**
 * Hook for configurations only - VERSION ROBUSTE
 */
export const useExpenseConfig = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [statuses, setStatuses] = useState<ExpenseStatus[]>([]);
  const [responsibles, setResponsibles] = useState<ExpenseResponsible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Loading config (hook) from unified API...');
      
      // 🔥 GESTION ROBUSTE avec Promise.allSettled
      const [categoriesRes, statusesRes, responsiblesRes] = await Promise.allSettled([
        ExpenseService.getCategories().catch(error => ({ success: false, data: [], error: error.message })),
        ExpenseService.getStatuses().catch(error => ({ success: false, data: [], error: error.message })),
        ExpenseService.getResponsibles().catch(error => ({ success: false, data: [], error: error.message }))
      ]);

      // Gestion robuste des résultats
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        console.log('✅ Categories (hook) loaded:', categoriesRes.value.data?.length);
        setCategories(categoriesRes.value.data || []);
      }

      if (statusesRes.status === 'fulfilled' && statusesRes.value.success) {
        console.log('✅ Statuses (hook) loaded:', statusesRes.value.data?.length);
        setStatuses(statusesRes.value.data || []);
      } else {
        // Fallback pour les statuts
        setStatuses([
          { id: 'pending', name: 'En attente', color: '#F59E0B', icon: 'Clock' },
          { id: 'paid', name: 'Payé', color: '#10B981', icon: 'Check' },
          { id: 'rejected', name: 'Rejeté', color: '#EF4444', icon: 'X' }
        ] as ExpenseStatus[]);
      }

      if (responsiblesRes.status === 'fulfilled' && responsiblesRes.value.success) {
        console.log('✅ Responsibles (hook) loaded:', responsiblesRes.value.data?.length);
        setResponsibles(responsiblesRes.value.data || []);
      }
      
    } catch (error) {
      console.error('💥 Config (hook) loading error:', error);
      setError((error as Error).message);
      
      // Fallback en cas d'erreur globale
      setStatuses([
        { id: 'pending', name: 'En attente', color: '#F59E0B', icon: 'Clock' },
        { id: 'paid', name: 'Payé', color: '#10B981', icon: 'Check' },
        { id: 'rejected', name: 'Rejeté', color: '#EF4444', icon: 'X' }
      ] as ExpenseStatus[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    categories,
    statuses,
    responsibles,
    loading,
    error,
    refresh: loadConfig
  };
};

/**
 * Hook for single expense management - VERSION ROBUSTE AVEC UUID
 */
export const useExpense = (id?: string) => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpense = useCallback(async (expenseId: string) => {
    // 🔥 CORRECTION : Validation UUID préalable
    const cleanId = validateUUID(expenseId, 'useExpense-loadExpense');
    if (!cleanId) {
      setError('ID de dépense invalide');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Loading single expense:', cleanId);
      const response = await ExpenseService.getExpense(cleanId);
      
      if (response.success) {
        console.log('✅ Expense loaded:', cleanId);
        setExpense(response.data || null);
      } else {
        throw new Error(response.error || 'Dépense non trouvée');
      }
    } catch (error) {
      console.error('💥 Single expense loading error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadExpense(id);
    }
  }, [id, loadExpense]);

  return {
    expense,
    loading,
    error,
    reload: id ? () => loadExpense(id) : undefined
  };
};

/**
 * 🔥 NOUVEAU : Hook pour la gestion de validation des dépenses
 */
export const useExpenseValidation = () => {
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Loading pending expenses for validation...');
      const response = await ExpenseService.getPendingExpenses();
      
      if (response.success) {
        console.log('✅ Pending expenses loaded:', response.data?.length);
        setPendingExpenses(response.data || []);
      } else {
        throw new Error(response.error || 'Erreur de chargement des dépenses en attente');
      }
    } catch (error) {
      console.error('💥 Pending expenses loading error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateSingle = useCallback(async (
    expenseId: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<boolean> => {
    // 🔥 VALIDATION UUID
    const cleanId = validateUUID(expenseId, 'validateSingle');
    if (!cleanId) {
      toast.error('ID de dépense invalide');
      return false;
    }

    setValidating(true);
    
    try {
      console.log('📄 Validating single expense:', cleanId, action);
      const response = await ExpenseService.validateSingleExpense(cleanId, action, notes);
      
      if (response.success) {
        // Supprimer de la liste locale
        setPendingExpenses(prev => prev.filter(exp => exp.id !== cleanId));
        
        toast.success(response.message || `Dépense ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);
        console.log('✅ Single validation completed:', cleanId);
        return true;
      } else {
        throw new Error(response.error || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('💥 Single validation error:', error);
      toast.error((error as Error).message);
      return false;
    } finally {
      setValidating(false);
    }
  }, []);

  const validateBulk = useCallback(async (
    expenseIds: string[], 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<boolean> => {
    // 🔥 VALIDATION UUID pour tous les IDs
    const cleanIds = cleanExpenseIds(expenseIds);
    if (cleanIds.length === 0) {
      toast.error('Aucune dépense valide sélectionnée');
      return false;
    }

    setValidating(true);
    
    try {
      console.log('📄 Validating bulk expenses:', cleanIds.length, action);
      const response = await ExpenseService.bulkValidateExpenses(cleanIds, action, notes);
      
      if (response.success && response.data) {
        // Supprimer les dépenses traitées de la liste locale
        if (response.data.processed_count > 0) {
          setPendingExpenses(prev => 
            prev.filter(exp => !cleanIds.includes(exp.id))
          );
        }
        
        toast.success(response.message || `${response.data.processed_count} dépense(s) ${action === 'approve' ? 'approuvée(s)' : 'rejetée(s)'}`);
        console.log('✅ Bulk validation completed:', response.data.processed_count);
        return true;
      } else {
        throw new Error(response.error || 'Erreur lors de la validation en masse');
      }
    } catch (error) {
      console.error('💥 Bulk validation error:', error);
      toast.error((error as Error).message);
      return false;
    } finally {
      setValidating(false);
    }
  }, []);

  const checkAccess = useCallback(async () => {
    try {
      const response = await ExpenseService.checkValidationAccess();
      return response.success && response.data?.has_access;
    } catch (error) {
      console.error('💥 Access check error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadPendingExpenses();
  }, [loadPendingExpenses]);

  return {
    pendingExpenses,
    loading,
    validating,
    error,
    loadPendingExpenses,
    validateSingle,
    validateBulk,
    checkAccess
  };
};

/**
 * 🔥 NOUVEAU : Hook pour les statistiques avancées
 */
export const useExpenseStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Loading expense stats...');
      const [dashboardRes, expensesRes] = await Promise.allSettled([
        ExpenseService.getDashboard(),
        ExpenseService.getExpenses({ limit: 1000 }) // Charger plus pour les stats
      ]);

      let dashboardData = null;
      let expensesData: Expense[] = [];

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.success) {
        dashboardData = dashboardRes.value.data;
      }

      if (expensesRes.status === 'fulfilled' && expensesRes.value.success) {
        expensesData = expensesRes.value.data || [];
      }

      // Calculer des statistiques avancées
      const now = new Date();
      const thisMonth = expensesData.filter(exp => {
        const expDate = new Date(exp.expense_date);
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      });

      const lastMonth = expensesData.filter(exp => {
        const expDate = new Date(exp.expense_date);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
        return expDate.getMonth() === lastMonthDate.getMonth() && expDate.getFullYear() === lastMonthDate.getFullYear();
      });

      const categoryStats = expensesData.reduce((acc, exp) => {
        const category = exp.category_name || 'Non catégorisé';
        if (!acc[category]) {
          acc[category] = { count: 0, amount: 0 };
        }
        acc[category].count++;
        acc[category].amount += exp.amount || 0;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      const calculatedStats = {
        dashboard: dashboardData,
        thisMonth: {
          count: thisMonth.length,
          amount: thisMonth.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        },
        lastMonth: {
          count: lastMonth.length,
          amount: lastMonth.reduce((sum, exp) => sum + (exp.amount || 0), 0)
        },
        categories: Object.entries(categoryStats)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount),
        totalExpenses: expensesData.length,
        totalAmount: expensesData.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      };

      setStats(calculatedStats);
      console.log('✅ Stats calculated successfully');
      
    } catch (error) {
      console.error('💥 Stats loading error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
};

console.log('✅ [useExpenses] Hook principal et hooks spécialisés corrigés avec UUID harmonisé');

// Default export
export default useExpenses;