// src/hooks/useExpenseValidation.tsx - Hook pour gérer le workflow de validation

import { useState, useEffect, useCallback } from 'react';
import { ExpenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense.types';
import { toast } from 'react-hot-toast';

interface ValidationInfo {
  canValidate: boolean;
  username: string;
  role: string;
}

interface PendingExpense extends Expense {
  montant_formate: string;
  date_formatee: string;
  cree_le: string;
  cree_par: string;
  categorie_nom: string;
  categorie_couleur: string;
  responsable_nom: string;
}

interface ValidationStats {
  pending_count: number;
  pending_amount: number;
  pending_amount_formatted: string;
  validated_today: number;
  rejected_today: number;
  total_impact_capital: number;
  total_impact_capital_formatted: string;
}

interface UseExpenseValidationReturn {
  // État
  pendingExpenses: PendingExpense[];
  validationInfo: ValidationInfo;
  validationStats: ValidationStats;
  loading: boolean;
  validating: boolean;
  error: string | null;
  
  // Actions
  loadPendingExpenses: () => Promise<void>;
  validateSingleExpense: (expenseId: string, action: 'approve' | 'reject', notes?: string) => Promise<boolean>;
  validateMultipleExpenses: (expenseIds: string[], action: 'approve' | 'reject', notes?: string) => Promise<boolean>;
  refreshValidationData: () => Promise<void>;
  
  // Helpers
  canUserValidate: boolean;
  getPendingByCategory: () => Record<string, PendingExpense[]>;
  getPendingByResponsible: () => Record<string, PendingExpense[]>;
  getTotalPendingAmount: () => number;
}

export const useExpenseValidation = (): UseExpenseValidationReturn => {
  // ==================== State ====================
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [validationInfo, setValidationInfo] = useState<ValidationInfo>({
    canValidate: false,
    username: '',
    role: ''
  });
  const [validationStats, setValidationStats] = useState<ValidationStats>({
    pending_count: 0,
    pending_amount: 0,
    pending_amount_formatted: '0 FG',
    validated_today: 0,
    rejected_today: 0,
    total_impact_capital: 0,
    total_impact_capital_formatted: '0 FG'
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== API Base URL ====================
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ==================== API Calls ====================
  const loadValidationInfo = useCallback(async () => {
    try {
      const response = await ExpenseService.testConnection();
      if (response.success && response.data?.user) {
        setValidationInfo({
          canValidate: response.data.user.canValidate || false,
          username: response.data.user.username || '',
          role: response.data.user.role || ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement infos validation:', error);
      setError('Erreur lors du chargement des informations de validation');
    }
  }, []);

  const loadPendingExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/expenses/workflow/pending`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setPendingExpenses(data.pending_expenses || []);
          
          // Mettre à jour les stats
          const totalAmount = (data.pending_expenses || []).reduce(
            (sum: number, exp: PendingExpense) => sum + (exp.amount || 0), 
            0
          );
          
          setValidationStats(prev => ({
            ...prev,
            pending_count: data.count || 0,
            pending_amount: totalAmount,
            pending_amount_formatted: `${totalAmount.toLocaleString('fr-FR')} FG`
          }));
          
          // Mettre à jour les infos de validation si disponibles
          if (data.user_permissions) {
            setValidationInfo(data.user_permissions);
          }
        } else {
          setError(data.error || 'Erreur lors du chargement');
        }
      } else {
        setError('Erreur de connexion au serveur');
      }
    } catch (error) {
      console.error('Erreur chargement dépenses en attente:', error);
      setError('Erreur lors du chargement des dépenses en attente');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const validateSingleExpense = useCallback(async (
    expenseId: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<boolean> => {
    try {
      setValidating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/expenses/workflow/bulk-validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expense_ids: [expenseId],
          action: action,
          notes: notes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast.success(data.message);
          
          // Recharger les données
          await loadPendingExpenses();
          
          // Mettre à jour les stats du jour
          setValidationStats(prev => ({
            ...prev,
            validated_today: action === 'approve' ? prev.validated_today + 1 : prev.validated_today,
            rejected_today: action === 'reject' ? prev.rejected_today + 1 : prev.rejected_today
          }));
          
          return true;
        } else {
          setError(data.error || 'Erreur lors de la validation');
          toast.error(data.error || 'Erreur lors de la validation');
          return false;
        }
      } else {
        const errorText = `Erreur HTTP ${response.status}`;
        setError(errorText);
        toast.error(errorText);
        return false;
      }
    } catch (error) {
      console.error('Erreur validation unique:', error);
      const errorMessage = 'Erreur lors de la validation';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setValidating(false);
    }
  }, [API_BASE_URL, loadPendingExpenses]);

  const validateMultipleExpenses = useCallback(async (
    expenseIds: string[], 
    action: 'approve' | 'reject', 
    notes?: string
  ): Promise<boolean> => {
    try {
      setValidating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/expenses/workflow/bulk-validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expense_ids: expenseIds,
          action: action,
          notes: notes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast.success(data.message);
          
          // Recharger les données
          await loadPendingExpenses();
          
          // Mettre à jour les stats du jour
          setValidationStats(prev => ({
            ...prev,
            validated_today: action === 'approve' ? prev.validated_today + data.processed_count : prev.validated_today,
            rejected_today: action === 'reject' ? prev.rejected_today + data.processed_count : prev.rejected_today
          }));
          
          return true;
        } else {
          setError(data.error || 'Erreur lors de la validation en masse');
          toast.error(data.error || 'Erreur lors de la validation en masse');
          return false;
        }
      } else {
        const errorText = `Erreur HTTP ${response.status}`;
        setError(errorText);
        toast.error(errorText);
        return false;
      }
    } catch (error) {
      console.error('Erreur validation multiple:', error);
      const errorMessage = 'Erreur lors de la validation en masse';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setValidating(false);
    }
  }, [API_BASE_URL, loadPendingExpenses]);

  const refreshValidationData = useCallback(async () => {
    await Promise.all([
      loadValidationInfo(),
      loadPendingExpenses()
    ]);
  }, [loadValidationInfo, loadPendingExpenses]);

  // ==================== Helper Functions ====================
  const canUserValidate = validationInfo.canValidate;

  const getPendingByCategory = useCallback((): Record<string, PendingExpense[]> => {
    return pendingExpenses.reduce((acc, expense) => {
      const category = expense.categorie_nom || 'Sans catégorie';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(expense);
      return acc;
    }, {} as Record<string, PendingExpense[]>);
  }, [pendingExpenses]);

  const getPendingByResponsible = useCallback((): Record<string, PendingExpense[]> => {
    return pendingExpenses.reduce((acc, expense) => {
      const responsible = expense.responsable_nom || 'Non assigné';
      if (!acc[responsible]) {
        acc[responsible] = [];
      }
      acc[responsible].push(expense);
      return acc;
    }, {} as Record<string, PendingExpense[]>);
  }, [pendingExpenses]);

  const getTotalPendingAmount = useCallback((): number => {
    return pendingExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [pendingExpenses]);

  // ==================== Effects ====================
  useEffect(() => {
    loadValidationInfo();
  }, [loadValidationInfo]);

  useEffect(() => {
    if (validationInfo.canValidate) {
      loadPendingExpenses();
    }
  }, [validationInfo.canValidate, loadPendingExpenses]);

  // Auto-refresh toutes les 30 secondes si l'utilisateur peut valider
  useEffect(() => {
    if (!validationInfo.canValidate) return;

    const interval = setInterval(() => {
      loadPendingExpenses();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [validationInfo.canValidate, loadPendingExpenses]);

  // ==================== Return ====================
  return {
    // État
    pendingExpenses,
    validationInfo,
    validationStats,
    loading,
    validating,
    error,
    
    // Actions
    loadPendingExpenses,
    validateSingleExpense,
    validateMultipleExpenses,
    refreshValidationData,
    
    // Helpers
    canUserValidate,
    getPendingByCategory,
    getPendingByResponsible,
    getTotalPendingAmount
  };
};

export default useExpenseValidation;