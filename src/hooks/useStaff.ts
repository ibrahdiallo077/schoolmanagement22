// src/hooks/useStaff.tsx - Hook personnalisé pour la gestion du personnel (VERSION API)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import staffService from '../services/staffService';

// === TYPES ET INTERFACES ===

interface Staff {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'on_leave';
  qualifications?: string;
  notes?: string;
  photo_url?: string;
  initials?: string;
  assigned_classes_count?: number;
  salary?: number;
  emergency_contact?: string;
  emergency_phone?: string;
  payment_method?: string;
  bank_account?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  created_at?: string;
  updated_at?: string;
}

interface StaffFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date?: string;
  salary?: number;
  address?: string;
  qualifications?: string;
  notes?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  payment_method?: string;
  bank_account?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  profilePhoto?: File;
}

interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  department?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseStaffListResult {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    teachers: number;
    averageSalary: number;
  };
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<StaffListParams>) => void;
  resetFilters: () => void;
  currentFilters: StaffListParams;
}

interface UseStaffDetailResult {
  staff: Staff | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStaff: (data: Partial<StaffFormData>) => Promise<boolean>;
  deleteStaff: () => Promise<boolean>;
}

interface UseStaffActionsResult {
  createStaff: (data: StaffFormData) => Promise<{ success: boolean; staff?: Staff; error?: string }>;
  updateStaff: (id: string, data: StaffFormData) => Promise<{ success: boolean; staff?: Staff; error?: string }>;
  deleteStaff: (id: string) => Promise<{ success: boolean; error?: string }>;
  changeStatus: (id: string, status: 'active' | 'inactive' | 'on_leave', reason?: string) => Promise<{ success: boolean; error?: string }>;
  navigateToStaff: (id: string) => void;
  navigateToEdit: (id: string) => void;
  navigateToCreate: () => void;
  navigateToList: () => void;
  processing: boolean;
}

// === HOOKS ===

// Hook pour la liste du personnel
export const useStaffList = (initialFilters: Partial<StaffListParams> = {}): UseStaffListResult => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  const defaultFilters: StaffListParams = {
    page: 1,
    limit: 12,
    search: '',
    position: '',
    department: '',
    status: '',
    sortBy: 'first_name',
    sortOrder: 'asc'
  };

  const [currentFilters, setCurrentFilters] = useState<StaffListParams>({
    ...defaultFilters,
    ...initialFilters
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 useStaffList: Récupération données avec filtres:', currentFilters);
      
      // Test de connexion d'abord
      const connectionTest = await staffService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Erreur de connexion: ${connectionTest.error}`);
      }

      const response = await staffService.getStaffList(currentFilters);

      if (response.success) {
        console.log('✅ useStaffList: Données récupérées:', response);
        
        setStaff(response.staff || []);
        
        if (response.pagination) {
          setPagination({
            currentPage: response.pagination.page || 1,
            totalPages: response.pagination.totalPages || 1,
            totalItems: response.pagination.total || 0,
            hasNext: (response.pagination.page || 1) < (response.pagination.totalPages || 1),
            hasPrev: (response.pagination.page || 1) > 1
          });
        }
      } else {
        console.error('❌ useStaffList: Erreur API:', response.error);
        setError(response.error || 'Erreur lors du chargement');
        setStaff([]);
      }
    } catch (err: any) {
      console.error('💥 useStaffList: Exception:', err);
      setError(err.message || 'Erreur de connexion');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Écouter les mises à jour de données
  useEffect(() => {
    const handleDataUpdate = (event: any) => {
      console.log('🔄 useStaffList: Mise à jour détectée:', event.detail);
      fetchData();
    };

    window.addEventListener('staffListUpdated', handleDataUpdate);
    return () => window.removeEventListener('staffListUpdated', handleDataUpdate);
  }, [fetchData]);

  // Calcul des statistiques
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    inactive: staff.filter(s => s.status === 'inactive').length,
    teachers: staff.filter(s => s.position === 'teacher').length,
    averageSalary: staff.length > 0 
      ? staff.reduce((sum, s) => sum + (s.salary || 0), 0) / staff.length 
      : 0
  };

  const updateFilters = useCallback((newFilters: Partial<StaffListParams>) => {
    console.log('🔄 useStaffList: Mise à jour filtres:', newFilters);
    setCurrentFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1
    }));
  }, []);

  const resetFilters = useCallback(() => {
    console.log('🔄 useStaffList: Reset filtres');
    setCurrentFilters(defaultFilters);
  }, []);

  return {
    staff,
    loading,
    error,
    pagination,
    stats,
    refetch: fetchData,
    updateFilters,
    resetFilters,
    currentFilters
  };
};

// Hook pour les détails d'un employé
export const useStaffDetail = (staffId: string): UseStaffDetailResult => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!staffId) {
      setError('ID employé manquant');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('👤 useStaffDetail: Récupération employé ID:', staffId);
      
      // Test de connexion d'abord
      const connectionTest = await staffService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Erreur de connexion: ${connectionTest.error}`);
      }

      const response = await staffService.getStaffById(staffId);

      if (response.success && response.employee) {
        console.log('✅ useStaffDetail: Employé récupéré:', response.employee);
        setStaff(response.employee);
      } else {
        console.error('❌ useStaffDetail: Erreur:', response.error);
        setError(response.error || 'Employé non trouvé');
        setStaff(null);
      }
    } catch (err: any) {
      console.error('💥 useStaffDetail: Exception:', err);
      setError(err.message || 'Erreur de connexion');
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Écouter les mises à jour spécifiques à cet employé
  useEffect(() => {
    const handleDataUpdate = (event: any) => {
      const detail = event.detail;
      if (detail && (detail.employeeId === staffId || detail.employee?.id === staffId)) {
        console.log('🔄 useStaffDetail: Mise à jour détectée pour employé:', staffId);
        fetchStaff();
      }
    };

    window.addEventListener('staffListUpdated', handleDataUpdate);
    return () => window.removeEventListener('staffListUpdated', handleDataUpdate);
  }, [fetchStaff, staffId]);

  const updateStaff = useCallback(async (data: Partial<StaffFormData>): Promise<boolean> => {
    if (!staffId) return false;

    try {
      console.log('✏️ useStaffDetail: Mise à jour employé:', staffId, data);
      
      const response = await staffService.updateStaff(staffId, data as StaffFormData);
      
      if (response.success) {
        console.log('✅ useStaffDetail: Mise à jour réussie');
        await fetchStaff();
        return true;
      } else {
        console.error('❌ useStaffDetail: Erreur mise à jour:', response.error);
        setError(response.error || 'Erreur lors de la mise à jour');
        return false;
      }
    } catch (error: any) {
      console.error('💥 useStaffDetail: Exception mise à jour:', error);
      setError(error.message || 'Erreur de connexion');
      return false;
    }
  }, [staffId, fetchStaff]);

  const deleteStaff = useCallback(async (): Promise<boolean> => {
    if (!staffId) return false;

    try {
      console.log('🗑️ useStaffDetail: Suppression employé:', staffId);
      
      const response = await staffService.deleteStaff(staffId);
      
      if (response.success) {
        console.log('✅ useStaffDetail: Suppression réussie');
        return true;
      } else {
        console.error('❌ useStaffDetail: Erreur suppression:', response.error);
        setError(response.error || 'Erreur lors de la suppression');
        return false;
      }
    } catch (error: any) {
      console.error('💥 useStaffDetail: Exception suppression:', error);
      setError(error.message || 'Erreur de connexion');
      return false;
    }
  }, [staffId]);

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff,
    updateStaff,
    deleteStaff
  };
};

// Hook pour les actions globales
export const useStaffActions = (): UseStaffActionsResult => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const createStaff = useCallback(async (data: StaffFormData) => {
    setProcessing(true);
    try {
      console.log('➕ useStaffActions: Création employé:', data);
      
      const response = await staffService.createStaff(data);
      
      console.log('✅ useStaffActions: Réponse création:', response);
      
      return {
        success: response.success,
        staff: response.employee,
        error: response.error
      };
    } catch (error: any) {
      console.error('💥 useStaffActions: Exception création:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    } finally {
      setProcessing(false);
    }
  }, []);

  const updateStaff = useCallback(async (id: string, data: StaffFormData) => {
    setProcessing(true);
    try {
      console.log('✏️ useStaffActions: Modification employé:', id, data);
      
      const response = await staffService.updateStaff(id, data);
      
      console.log('✅ useStaffActions: Réponse modification:', response);
      
      return {
        success: response.success,
        staff: response.employee,
        error: response.error
      };
    } catch (error: any) {
      console.error('💥 useStaffActions: Exception modification:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    } finally {
      setProcessing(false);
    }
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    setProcessing(true);
    try {
      console.log('🗑️ useStaffActions: Suppression employé:', id);
      
      const response = await staffService.deleteStaff(id);
      
      console.log('✅ useStaffActions: Réponse suppression:', response);
      
      return {
        success: response.success,
        error: response.error
      };
    } catch (error: any) {
      console.error('💥 useStaffActions: Exception suppression:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    } finally {
      setProcessing(false);
    }
  }, []);

  const changeStatus = useCallback(async (id: string, status: 'active' | 'inactive' | 'on_leave', reason?: string) => {
    setProcessing(true);
    try {
      console.log('🔄 useStaffActions: Changement statut:', id, status, reason);
      
      const response = await staffService.changeStaffStatus(id, status, reason);
      
      console.log('✅ useStaffActions: Réponse changement statut:', response);
      
      return {
        success: response.success,
        error: response.error
      };
    } catch (error: any) {
      console.error('💥 useStaffActions: Exception changement statut:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    } finally {
      setProcessing(false);
    }
  }, []);

  const navigateToStaff = useCallback((id: string) => {
    navigate(`/staff/${id}`);
  }, [navigate]);

  const navigateToEdit = useCallback((id: string) => {
    navigate(`/staff/edit/${id}`);
  }, [navigate]);

  const navigateToCreate = useCallback(() => {
    navigate('/staff/create');
  }, [navigate]);

  const navigateToList = useCallback(() => {
    navigate('/staff');
  }, [navigate]);

  return {
    createStaff,
    updateStaff,
    deleteStaff,
    changeStatus,
    navigateToStaff,
    navigateToEdit,
    navigateToCreate,
    navigateToList,
    processing
  };
};

// Hook combiné principal
export const useStaff = (options: { 
  autoLoad?: boolean;
  initialFilters?: Partial<StaffListParams>;
} = {}) => {
  const { autoLoad = true, initialFilters = {} } = options;
  
  const listHook = useStaffList(initialFilters);
  const actionsHook = useStaffActions();
  
  const refreshAndNavigate = useCallback(async (action: () => void) => {
    await listHook.refetch();
    action();
  }, [listHook.refetch]);

  return {
    ...listHook,
    ...actionsHook,
    refreshAndNavigate,
    
    createAndRefresh: useCallback(async (data: StaffFormData) => {
      const result = await actionsHook.createStaff(data);
      if (result.success) {
        await listHook.refetch();
      }
      return result;
    }, [actionsHook.createStaff, listHook.refetch]),
    
    updateAndRefresh: useCallback(async (id: string, data: StaffFormData) => {
      const result = await actionsHook.updateStaff(id, data);
      if (result.success) {
        await listHook.refetch();
      }
      return result;
    }, [actionsHook.updateStaff, listHook.refetch]),
    
    deleteAndRefresh: useCallback(async (id: string) => {
      const result = await actionsHook.deleteStaff(id);
      if (result.success) {
        await listHook.refetch();
      }
      return result;
    }, [actionsHook.deleteStaff, listHook.refetch])
  };
};

export default useStaff;