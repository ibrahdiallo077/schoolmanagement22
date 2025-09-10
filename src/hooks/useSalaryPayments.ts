// src/hooks/useSalaryPayments.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  salaryPaymentsService, 
  DashboardData, 
  Payment, 
  PaymentFilters, 
  Staff, 
  PaymentFormData,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  PaginationData 
} from '../services/salaryPaymentsService';

// Types pour les composants existants (compatible avec les props attendues)
interface PaymentDetail {
  id: string;
  receipt_number: string;
  type_label: string;
  payment_status: string;
  status_icon: string;
  status_label: string;
  staff_name: string;
  staff_number: string;
  position: string;
  department: string;
  photo_url?: string;
  period_display: string;
  payment_year: number;
  month_name?: string;
  payment_date_formatted: string;
  method_icon: string;
  method_label: string;
  paid_by?: string;
  is_advance: boolean;
  gross_amount?: number;
  bonus_amount?: number;
  tax_amount?: number;
  deduction_amount?: number;
  amount: number;
  net_amount?: number;
  formatted_gross_amount?: string;
  formatted_bonus_amount?: string;
  formatted_tax_amount?: string;
  formatted_deduction_amount?: string;
  formatted_amount: string;
  formatted_net_amount?: string;
  notes?: string;
  created_at_formatted?: string;
}

interface UseSalaryPaymentsState {
  // Dashboard
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  
  // Historique
  payments: Payment[];
  paymentsLoading: boolean;
  pagination: PaginationData | null;
  
  // Staff
  availableStaff: Staff[];
  staffLoading: boolean;
  
  // Configurations
  paymentTypes: PaymentType[];
  paymentMethods: PaymentMethod[];
  paymentStatuses: PaymentStatus[];
  configsLoading: boolean;
  
  // UI States (utilise PaymentDetail pour compatibilité avec les composants)
  selectedPayment: PaymentDetail | null;
  editingPayment: PaymentDetail | null;
  showPaymentForm: boolean;
  showPaymentDetail: boolean;
  
  // Filtres
  filters: PaymentFilters;
  
  // Messages
  successMessage: string | null;
  errorMessage: string | null;
  
  // Loading states
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export const useSalaryPayments = () => {
  // === ÉTAT PRINCIPAL ===
  const [state, setState] = useState<UseSalaryPaymentsState>({
    dashboardData: null,
    dashboardLoading: false,
    payments: [],
    paymentsLoading: false,
    pagination: null,
    availableStaff: [],
    staffLoading: false,
    paymentTypes: [],
    paymentMethods: [],
    paymentStatuses: [],
    configsLoading: false,
    selectedPayment: null,
    editingPayment: null,
    showPaymentForm: false,
    showPaymentDetail: false,
    filters: {
      search: '',
      payment_type: '',
      payment_method: '',
      payment_status: '',
      payment_year: new Date().getFullYear().toString(),
      payment_month: '',
      page: 1,
      limit: 20
    },
    successMessage: null,
    errorMessage: null,
    creating: false,
    updating: false,
    deleting: false
  });

  // === FONCTION DE CONVERSION ===
  const convertPaymentToDetail = useCallback((payment: Payment): PaymentDetail => {
    return {
      id: payment.id,
      receipt_number: payment.receipt_number,
      type_label: payment.type_label,
      payment_status: payment.payment_status,
      status_icon: payment.status_icon,
      status_label: payment.status_label,
      staff_name: payment.staff_name,
      staff_number: payment.staff_number,
      position: payment.position,
      department: payment.department,
      photo_url: payment.photo_url,
      period_display: payment.period_display,
      payment_year: payment.payment_year,
      month_name: payment.payment_month?.toString(),
      payment_date_formatted: payment.payment_date_formatted,
      method_icon: payment.method_icon,
      method_label: payment.method_label,
      paid_by: payment.paid_by,
      is_advance: payment.payment_type === 'advance',
      gross_amount: payment.gross_amount,
      bonus_amount: 0, // À adapter selon vos données
      tax_amount: 0, // À adapter selon vos données
      deduction_amount: 0, // À adapter selon vos données
      amount: payment.amount,
      net_amount: payment.net_amount,
      formatted_gross_amount: payment.formatted_gross_amount,
      formatted_bonus_amount: '0 FG',
      formatted_tax_amount: '0 FG',
      formatted_deduction_amount: '0 FG',
      formatted_amount: payment.formatted_amount,
      formatted_net_amount: payment.formatted_net_amount,
      notes: payment.notes,
      created_at_formatted: new Date().toLocaleDateString('fr-FR')
    };
  }, []);

  // === UTILITAIRES ===
  const updateState = useCallback((updates: Partial<UseSalaryPaymentsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearMessages = useCallback(() => {
    updateState({ successMessage: null, errorMessage: null });
  }, [updateState]);

  const showSuccess = useCallback((message: string) => {
    updateState({ successMessage: message, errorMessage: null });
    setTimeout(() => clearMessages(), 5000);
  }, [updateState, clearMessages]);

  const showError = useCallback((message: string) => {
    updateState({ errorMessage: message, successMessage: null });
    setTimeout(() => clearMessages(), 7000);
  }, [updateState, clearMessages]);

  // === CHARGEMENT DU TABLEAU DE BORD ===
  const loadDashboard = useCallback(async (year?: number, month?: number) => {
    updateState({ dashboardLoading: true });
    
    try {
      const response = await salaryPaymentsService.getDashboard(year, month);
      
      if (response.success && response.data) {
        updateState({ 
          dashboardData: response.data,
          dashboardLoading: false 
        });
      } else {
        showError(response.error || 'Erreur lors du chargement du tableau de bord');
        updateState({ dashboardLoading: false });
      }
    } catch (error) {
      showError('Erreur lors du chargement du tableau de bord');
      updateState({ dashboardLoading: false });
    }
  }, [updateState, showError]);

  // === CHARGEMENT DE L'HISTORIQUE ===
  const loadPayments = useCallback(async (customFilters?: Partial<PaymentFilters>) => {
    updateState({ paymentsLoading: true });
    
    const finalFilters = { ...state.filters, ...customFilters };
    
    try {
      const response = await salaryPaymentsService.getPaymentsHistory(finalFilters);
      
      if (response.success && response.data) {
        updateState({
          payments: response.data.payments,
          pagination: response.data.pagination,
          paymentsLoading: false,
          filters: finalFilters
        });
      } else {
        showError(response.error || 'Erreur lors du chargement des paiements');
        updateState({ paymentsLoading: false });
      }
    } catch (error) {
      showError('Erreur lors du chargement des paiements');
      updateState({ paymentsLoading: false });
    }
  }, [state.filters, updateState, showError]);

  // === CHARGEMENT DES EMPLOYÉS ===
  const loadAvailableStaff = useCallback(async (search?: string) => {
    updateState({ staffLoading: true });
    
    try {
      const response = await salaryPaymentsService.getAvailableStaff(search);
      
      if (response.success && response.data) {
        updateState({
          availableStaff: response.data.staff,
          staffLoading: false
        });
      } else {
        showError(response.error || 'Erreur lors du chargement des employés');
        updateState({ staffLoading: false });
      }
    } catch (error) {
      showError('Erreur lors du chargement des employés');
      updateState({ staffLoading: false });
    }
  }, [updateState, showError]);

  // === CHARGEMENT DES CONFIGURATIONS ===
  const loadConfigurations = useCallback(async () => {
    updateState({ configsLoading: true });
    
    try {
      const [typesResponse, methodsResponse, statusesResponse] = await Promise.all([
        salaryPaymentsService.getPaymentTypes(),
        salaryPaymentsService.getPaymentMethods(),
        salaryPaymentsService.getPaymentStatuses()
      ]);

      if (typesResponse.success && methodsResponse.success && statusesResponse.success) {
        updateState({
          paymentTypes: typesResponse.data?.payment_types || [],
          paymentMethods: methodsResponse.data?.payment_methods || [],
          paymentStatuses: statusesResponse.data?.payment_statuses || [],
          configsLoading: false
        });
      } else {
        showError('Erreur lors du chargement des configurations');
        updateState({ configsLoading: false });
      }
    } catch (error) {
      showError('Erreur lors du chargement des configurations');
      updateState({ configsLoading: false });
    }
  }, [updateState, showError]);

  // === CRÉER UN PAIEMENT ===
  const createPayment = useCallback(async (paymentData: PaymentFormData) => {
    updateState({ creating: true });
    
    try {
      const response = await salaryPaymentsService.createPayment(paymentData);
      
      if (response.success) {
        showSuccess(response.data?.message || 'Paiement créé avec succès');
        updateState({ 
          creating: false,
          showPaymentForm: false 
        });
        
        // Recharger les données
        await Promise.all([
          loadPayments(),
          loadDashboard()
        ]);
      } else {
        showError(response.error || 'Erreur lors de la création du paiement');
        updateState({ creating: false });
      }
    } catch (error) {
      showError('Erreur lors de la création du paiement');
      updateState({ creating: false });
    }
  }, [updateState, showSuccess, showError, loadPayments, loadDashboard]);

  // === MODIFIER UN PAIEMENT ===
  const updatePayment = useCallback(async (paymentId: string, paymentData: Partial<PaymentFormData>) => {
    updateState({ updating: true });
    
    try {
      const response = await salaryPaymentsService.updatePayment(paymentId, paymentData);
      
      if (response.success) {
        showSuccess(response.data?.message || 'Paiement modifié avec succès');
        updateState({ 
          updating: false,
          showPaymentForm: false,
          editingPayment: null
        });
        
        // Recharger les données
        await Promise.all([
          loadPayments(),
          loadDashboard()
        ]);
      } else {
        showError(response.error || 'Erreur lors de la modification du paiement');
        updateState({ updating: false });
      }
    } catch (error) {
      showError('Erreur lors de la modification du paiement');
      updateState({ updating: false });
    }
  }, [updateState, showSuccess, showError, loadPayments, loadDashboard]);

  // === SUPPRIMER UN PAIEMENT ===
  const deletePayment = useCallback(async (paymentId: string) => {
    updateState({ deleting: true });
    
    try {
      const response = await salaryPaymentsService.deletePayment(paymentId);
      
      if (response.success) {
        showSuccess(response.data?.message || 'Paiement supprimé avec succès');
        updateState({ deleting: false });
        
        // Recharger les données
        await Promise.all([
          loadPayments(),
          loadDashboard()
        ]);
      } else {
        showError(response.error || 'Erreur lors de la suppression du paiement');
        updateState({ deleting: false });
      }
    } catch (error) {
      showError('Erreur lors de la suppression du paiement');
      updateState({ deleting: false });
    }
  }, [updateState, showSuccess, showError, loadPayments, loadDashboard]);

  // === CHANGER STATUT ===
  const changePaymentStatus = useCallback(async (paymentId: string, status: string) => {
    try {
      const response = await salaryPaymentsService.changePaymentStatus(paymentId, status);
      
      if (response.success) {
        showSuccess(response.data?.message || 'Statut modifié avec succès');
        
        // Recharger les données
        await Promise.all([
          loadPayments(),
          loadDashboard()
        ]);
      } else {
        showError(response.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      showError('Erreur lors du changement de statut');
    }
  }, [showSuccess, showError, loadPayments, loadDashboard]);

  // === GESTION DES VUES ===
  const openPaymentForm = useCallback((payment?: Payment) => {
    updateState({
      showPaymentForm: true,
      editingPayment: payment ? convertPaymentToDetail(payment) : null
    });
  }, [updateState, convertPaymentToDetail]);

  const closePaymentForm = useCallback(() => {
    updateState({
      showPaymentForm: false,
      editingPayment: null
    });
  }, [updateState]);

  const openPaymentDetail = useCallback((payment: Payment) => {
    updateState({
      selectedPayment: convertPaymentToDetail(payment),
      showPaymentDetail: true
    });
  }, [updateState, convertPaymentToDetail]);

  const closePaymentDetail = useCallback(() => {
    updateState({
      selectedPayment: null,
      showPaymentDetail: false
    });
  }, [updateState]);

  // === GESTION DES FILTRES ===
  const updateFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters, page: 1 };
    updateState({ filters: updatedFilters });
    loadPayments(updatedFilters);
  }, [state.filters, updateState, loadPayments]);

  const resetFilters = useCallback(() => {
    const defaultFilters: PaymentFilters = {
      search: '',
      payment_type: '',
      payment_method: '',
      payment_status: '',
      payment_year: new Date().getFullYear().toString(),
      payment_month: '',
      page: 1,
      limit: 20
    };
    updateState({ filters: defaultFilters });
    loadPayments(defaultFilters);
  }, [updateState, loadPayments]);

  // === PAGINATION ===
  const changePage = useCallback((page: number) => {
    const newFilters = { ...state.filters, page };
    updateState({ filters: newFilters });
    loadPayments(newFilters);
  }, [state.filters, updateState, loadPayments]);

  // === EXPORT ===
  const exportToCSV = useCallback(async () => {
    try {
      await salaryPaymentsService.exportCSV({
        year: state.filters.payment_year,
        month: state.filters.payment_month,
        payment_status: state.filters.payment_status
      });
      showSuccess('Export CSV téléchargé avec succès');
    } catch (error) {
      showError('Erreur lors de l\'export CSV');
    }
  }, [state.filters, showSuccess, showError]);

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    loadConfigurations();
    loadDashboard();
    loadPayments();
  }, []);

  // === RETOUR DES DONNÉES ET FONCTIONS ===
  return {
    // État
    ...state,
    
    // Actions principales
    loadDashboard,
    loadPayments,
    loadAvailableStaff,
    createPayment,
    updatePayment,
    deletePayment,
    changePaymentStatus,
    
    // Gestion des vues
    openPaymentForm,
    closePaymentForm,
    openPaymentDetail,
    closePaymentDetail,
    
    // Filtres et pagination
    updateFilters,
    resetFilters,
    changePage,
    
    // Utilitaires
    exportToCSV,
    clearMessages,
    
    // Loading states combinés
    isLoading: state.dashboardLoading || state.paymentsLoading || state.creating || state.updating || state.deleting
  };
};

// Export du type PaymentDetail pour usage externe
export type { PaymentDetail };