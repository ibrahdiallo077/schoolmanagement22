// src/hooks/useNotification.tsx - VERSION SIMPLIFIÉE AVEC EXPORTS CORRECTS

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import NotificationService, {
  type Notification,
  type NotificationFilters,
  type NotificationCounts,
  type CreateNotificationData,
  type NotificationListResponse,
  type ApiResponse
} from '../services/notificationService';

// ================================
// TYPES POUR LES HOOKS
// ================================

export interface UseNotificationsOptions {
  autoLoad?: boolean;
  defaultFilters?: Partial<NotificationFilters>;
  onError?: (error: Error) => void;
  onAuthError?: () => void;
}

export interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  counts: NotificationCounts | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  countsLoading: boolean;
  
  // Error state
  error: string | null;
  clearError: () => void;
  authError: boolean;
  
  // Ready state
  isReady: boolean;
  
  // Filters & pagination
  filters: NotificationFilters;
  pagination: NotificationListResponse['pagination'] | null;
  
  // Selection
  selectedIds: string[];
  
  // Actions - CRUD
  loadNotifications: (newFilters?: Partial<NotificationFilters>) => Promise<void>;
  loadCounts: () => Promise<void>;
  createNotification: (data: CreateNotificationData) => Promise<Notification | null>;
  markAsRead: (id: string, isRead?: boolean) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  
  // Filters
  setFilters: (newFilters: Partial<NotificationFilters>) => void;
  clearFilters: () => void;
  
  // Selection
  selectNotification: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Utils
  refreshAll: () => Promise<void>;
  refresh: () => Promise<void>; // Alias
  getNotificationById: (id: string) => Notification | undefined;
  testApiConnection: () => Promise<boolean>;
  retryAfterAuth: () => Promise<void>;
  
  // Computed stats
  stats: {
    totalCount: number;
    unreadCount: number;
    urgentCount: number;
    selectedCount: number;
    hasUnread: boolean;
    hasUrgent: boolean;
    hasSelected: boolean;
  };
}

// ================================
// HOOK PRINCIPAL
// ================================

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    autoLoad = true,
    defaultFilters = {},
    onError,
    onAuthError
  } = options;

  // ==================== State ====================
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);
  const [filters, setFiltersState] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...defaultFilters
  });
  const [pagination, setPagination] = useState<NotificationListResponse['pagination'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  // ==================== Error Handling ====================
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`💥 [useNotifications] Error in ${context}:`, error);
    
    const isAuthError = 
      error.message?.includes('401') ||
      error.message?.includes('Unauthorized') ||
      error.message?.includes('Token') ||
      error.message?.includes('Session expirée');
    
    if (isAuthError) {
      setAuthError(true);
      setError('Session expirée. Veuillez vous reconnecter.');
      if (onAuthError) onAuthError();
      return;
    }
    
    const userMessage = error.message || `Erreur lors de ${context}`;
    setError(userMessage);
    setAuthError(false);
    
    if (onError) {
      onError(error);
    } else {
      toast.error(userMessage);
    }
  }, [onError, onAuthError]);

  const clearError = useCallback(() => {
    setError(null);
    setAuthError(false);
  }, []);

  // ==================== Data Loading ====================
  const loadNotifications = useCallback(async (newFilters?: Partial<NotificationFilters>) => {
    setLoading(true);
    clearError();
    
    try {
      const filtersToUse = newFilters ? { ...filters, ...newFilters } : filters;
      const response = await NotificationService.getNotifications(filtersToUse);
      
      if (response.success) {
        setNotifications(response.data || []);
        setPagination(response.pagination || null);
        if (authError) setAuthError(false);
      } else {
        throw new Error(response.error || 'Erreur de chargement');
      }
    } catch (error) {
      handleError(error as Error, 'chargement des notifications');
    } finally {
      setLoading(false);
    }
  }, [filters, handleError, authError]);

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    
    try {
      const response = await NotificationService.getCounts();
      
      if (response.success) {
        setCounts(response.data || null);
        if (authError) setAuthError(false);
      } else {
        setCounts({
          total_unread: 0,
          urgent_unread: 0,
          high_unread: 0,
          medium_unread: 0,
          low_unread: 0,
          error_unread: 0,
          warning_unread: 0,
          reminder_unread: 0,
          due_soon: 0,
          overdue: 0
        });
      }
    } catch (error) {
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('401') || errorMessage.includes('Session expirée')) {
        setAuthError(true);
      }
      
      setCounts({
        total_unread: 0,
        urgent_unread: 0,
        high_unread: 0,
        medium_unread: 0,
        low_unread: 0,
        error_unread: 0,
        warning_unread: 0,
        reminder_unread: 0,
        due_soon: 0,
        overdue: 0
      });
    } finally {
      setCountsLoading(false);
    }
  }, [authError]);

  // ==================== CRUD Operations ====================
  const createNotification = useCallback(async (data: CreateNotificationData): Promise<Notification | null> => {
    setCreating(true);
    clearError();
    
    try {
      const response = await NotificationService.createNotification(data);
      
      if (response.success && response.data) {
        toast.success(response.message || 'Notification créée avec succès');
        await Promise.all([loadNotifications(), loadCounts()]);
        return response.data;
      } else {
        throw new Error(response.error || 'Erreur lors de la création');
      }
    } catch (error) {
      handleError(error as Error, 'création de la notification');
      return null;
    } finally {
      setCreating(false);
    }
  }, [loadNotifications, loadCounts, handleError]);

  const markAsRead = useCallback(async (id: string, isRead: boolean = true): Promise<boolean> => {
    try {
      const response = await NotificationService.markAsRead(id, isRead);
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, is_read: isRead } : notif
          )
        );
        await loadCounts();
        return true;
      }
      return false;
    } catch (error) {
      handleError(error as Error, 'marquage de lecture');
      return false;
    }
  }, [loadCounts, handleError]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    setUpdating(true);
    
    try {
      const response = await NotificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        await loadCounts();
        toast.success(response.message || 'Toutes les notifications marquées comme lues');
        return true;
      }
      return false;
    } catch (error) {
      handleError(error as Error, 'marquage global');
      return false;
    } finally {
      setUpdating(false);
    }
  }, [loadCounts, handleError]);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true);
    clearError();
    
    try {
      const response = await NotificationService.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        await loadCounts();
        toast.success(response.message || 'Notification supprimée avec succès');
        return true;
      }
      return false;
    } catch (error) {
      handleError(error as Error, 'suppression de la notification');
      return false;
    } finally {
      setDeleting(false);
    }
  }, [loadCounts, handleError]);

  // ==================== Filter Management ====================
  const setFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    if (!newFilters.page && Object.keys(newFilters).length > 0) {
      updatedFilters.page = 1;
    }
    setFiltersState(updatedFilters);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFiltersState({
      page: 1,
      limit: filters.limit,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  }, [filters.limit]);

  // ==================== Selection Management ====================
  const selectNotification = useCallback((id: string) => {
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      return isSelected 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allIds = notifications.map(notif => notif.id);
      const isAllSelected = prev.length === allIds.length && allIds.every(id => prev.includes(id));
      return isAllSelected ? [] : allIds;
    });
  }, [notifications]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ==================== Utility Functions ====================
  const refreshAll = useCallback(async () => {
    clearError();
    try {
      await Promise.all([loadNotifications(), loadCounts()]);
      toast.success('Données actualisées');
    } catch (error) {
      handleError(error as Error, 'actualisation des données');
    }
  }, [loadNotifications, loadCounts, handleError]);

  const getNotificationById = useCallback((id: string): Notification | undefined => {
    return notifications.find(notif => notif.id === id);
  }, [notifications]);

  const testApiConnection = useCallback(async () => {
    try {
      const response = await NotificationService.testConnection();
      if (response.success) {
        toast.success('Connexion API réussie');
        setAuthError(false);
        return true;
      } else {
        toast.error('Test de connexion échoué');
        return false;
      }
    } catch (error) {
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('401') || errorMessage.includes('Session expirée')) {
        setAuthError(true);
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else {
        toast.error('Erreur de test de connexion');
      }
      return false;
    }
  }, []);

  const retryAfterAuth = useCallback(async () => {
    setAuthError(false);
    setError(null);
    await Promise.all([loadNotifications(), loadCounts()]);
  }, [loadNotifications, loadCounts]);

  // ==================== Computed Values ====================
  const computedStats = useMemo(() => {
    const totalCount = notifications.length;
    const unreadCount = counts?.total_unread || 0;
    const urgentCount = counts?.urgent_unread || 0;
    const selectedCount = selectedIds.length;
    
    return {
      totalCount,
      unreadCount,
      urgentCount,
      selectedCount,
      hasUnread: unreadCount > 0,
      hasUrgent: urgentCount > 0,
      hasSelected: selectedCount > 0
    };
  }, [notifications.length, counts, selectedIds.length]);

  const isReady = useMemo(() => {
    return !loading || notifications.length > 0 || error !== null;
  }, [loading, notifications.length, error]);

  // ==================== Effects ====================
  useEffect(() => {
    if (autoLoad && !authError) {
      const timeoutId = setTimeout(() => {
        Promise.all([loadNotifications(), loadCounts()]).catch(err => {
          console.error('💥 [useNotifications] Initial loading error:', err);
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [autoLoad, loadNotifications, loadCounts, authError]);

  useEffect(() => {
    if (autoLoad && isReady && !loading && !authError) {
      loadNotifications();
    }
  }, [filters, autoLoad, isReady, loadNotifications, authError]);

  // ==================== Return Hook Interface ====================
  return {
    // Data
    notifications,
    counts,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    countsLoading,
    
    // Error state
    error,
    clearError,
    authError,
    
    // Ready state
    isReady,
    
    // Filters & pagination
    filters,
    pagination,
    
    // Selection
    selectedIds,
    
    // Actions - CRUD
    loadNotifications,
    loadCounts,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Filters
    setFilters,
    clearFilters,
    
    // Selection
    selectNotification,
    selectAll,
    clearSelection,
    
    // Utils
    refreshAll,
    refresh: refreshAll, // Alias
    getNotificationById,
    testApiConnection,
    retryAfterAuth,
    
    // Computed stats
    stats: computedStats
  };
};

// ================================
// HOOKS SPÉCIALISÉS
// ================================

export const useNotificationCounts = () => {
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      const result = await NotificationService.getCounts();
      if (result.success) {
        setCounts(result.data || null);
      } else {
        throw new Error(result.error || 'Erreur compteurs');
      }
    } catch (err: any) {
      if (err.message?.includes('Session expirée') || err.message?.includes('401')) {
        setAuthError(true);
      }
      
      setCounts({
        total_unread: 0,
        urgent_unread: 0,
        high_unread: 0,
        medium_unread: 0,
        low_unread: 0,
        error_unread: 0,
        warning_unread: 0,
        reminder_unread: 0,
        due_soon: 0,
        overdue: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCounts();
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [loadCounts]);

  return {
    counts,
    loading,
    authError,
    refresh: loadCounts,
    unreadCount: counts?.total_unread || 0,
    urgentCount: counts?.urgent_unread || 0,
    hasUrgent: (counts?.urgent_unread || 0) > 0,
    hasUnread: (counts?.total_unread || 0) > 0
  };
};

export const useNotificationAlerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      const result = await NotificationService.getAlerts();
      if (result.success) {
        setAlerts(result.data || []);
      } else {
        throw new Error(result.error || 'Erreur alertes');
      }
    } catch (err: any) {
      if (err.message?.includes('Session expirée') || err.message?.includes('401')) {
        setAuthError(true);
      }
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAlerts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [loadAlerts]);

  return {
    alerts,
    loading,
    authError,
    refresh: loadAlerts,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter(alert => 
      alert.alert_type === 'overdue' || alert.alert_type === 'urgent_unread'
    )
  };
};

export const useNotificationDetail = (id: string) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadNotification = async () => {
      try {
        setLoading(true);
        setAuthError(false);
        
        const result = await NotificationService.getNotifications({ search: id, limit: 1 });
        if (result.success) {
          const found = result.data?.find(n => n.id === id);
          setNotification(found || null);
        } else {
          throw new Error(result.error || 'Notification non trouvée');
        }
      } catch (err: any) {
        if (err.message?.includes('Session expirée') || err.message?.includes('401')) {
          setAuthError(true);
        }
        setNotification(null);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      loadNotification();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [id]);

  return {
    notification,
    loading,
    authError,
    exists: !!notification,
    notFound: !loading && !notification && !authError
  };
};

export const useNotificationConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = useCallback(async () => {
    try {
      setLoading(true);
      const result = await NotificationService.testConnection();
      setIsConnected(result.success);
    } catch (err) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  return {
    isConnected,
    loading,
    testConnection,
    isOnline: isConnected === true,
    isOffline: isConnected === false,
    isUnknown: isConnected === null
  };
};

// Export par défaut
export default useNotifications;

console.log('✅ [useNotifications] Hook principal et hooks spécialisés exports corrects');