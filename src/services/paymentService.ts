// src/services/paymentService.ts
import { apiClient, ApiResponse } from './apiClient';

// Types pour les données de paiement
export interface CreatePaymentData {
  student_id: string;
  amount: number;
  amount_due: number;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'check';
  payment_type: 'tuition_monthly' | 'registration' | 'exam_fee' | 'book_fee' | 'uniform_fee' | 'transport_fee' | 'meal_fee' | 'penalty' | 'advance_payment' | 'other';
  custom_payment_type?: string;
  receipt_number?: string;
  reference_number?: string;
  transaction_id?: string;
  notes?: string;
  paid_by: string;
  payment_date?: string;
  payment_month?: number;
  payment_year?: number;
  number_of_months?: number;
  schedule_id?: string;
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {
  id: string;
}

export interface PaymentSearchFilters {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  payment_type?: string;
  payment_method?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateScheduleData {
  tuition_fee_id: string;
  payment_plan: 'monthly' | 'annual';
  start_month: number;
  start_year: number;
}

// Types spécifiques pour les réponses
export interface PaymentResponse extends ApiResponse {
  payments?: any[];
  payment?: any;
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface StudentFeesResponse extends ApiResponse {
  student?: any;
  fees?: any;
  payments?: {
    history: any[];
    total_paid: number;
    balance: number;
    status: string;
  };
  schedules?: any[];
  summary?: any;
}

export interface PaymentStatsResponse extends ApiResponse {
  stats?: {
    today: any;
    month: any;
    year: any;
    total: any;
    period: any;
  };
}

class PaymentService {
  constructor() {
    console.log('💰 PaymentService initialisé avec apiClient');
  }

  // === GESTION DES PAIEMENTS ===

  /**
   * Lister tous les paiements avec filtres
   */
  async getPayments(filters?: PaymentSearchFilters): Promise<PaymentResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/payments${params.toString() ? `?${params.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get<PaymentResponse>(endpoint);
      return {
        success: true,
        ...response,
        payments: response.payments || response.data?.payments || []
      };
    } catch (error) {
      console.error('❌ Erreur getPayments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des paiements',
        payments: []
      };
    }
  }

  /**
   * Créer un nouveau paiement
   */
  async createPayment(paymentData: CreatePaymentData): Promise<ApiResponse> {
    console.log('💰 Création paiement:', paymentData);
    
    // Validation des données requises
    const validationErrors = this.validatePaymentData(paymentData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', ')
      };
    }

    const endpoint = `/payments/students/${paymentData.student_id}/payments`;
    
    try {
      const response = await apiClient.post(endpoint, paymentData);
      console.log('✅ Paiement créé avec succès:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur création paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création du paiement'
      };
    }
  }

  /**
   * Mettre à jour un paiement existant
   */
  async updatePayment(paymentId: string, paymentData: Partial<CreatePaymentData>): Promise<ApiResponse> {
    console.log('🔄 Mise à jour paiement:', { paymentId, paymentData });
    
    if (!paymentId) {
      return {
        success: false,
        error: 'ID paiement requis'
      };
    }

    const endpoint = `/payments/${paymentId}`;
    
    try {
      const response = await apiClient.put(endpoint, paymentData);
      console.log('✅ Paiement mis à jour avec succès:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur mise à jour paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du paiement'
      };
    }
  }

  /**
   * Supprimer un paiement
   */
  async deletePayment(paymentId: string): Promise<ApiResponse> {
    console.log('🗑️ Suppression paiement:', paymentId);
    
    if (!paymentId) {
      return {
        success: false,
        error: 'ID paiement requis'
      };
    }

    const endpoint = `/payments/${paymentId}`;
    
    try {
      const response = await apiClient.delete(endpoint);
      console.log('✅ Paiement supprimé avec succès:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur suppression paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du paiement'
      };
    }
  }

  /**
   * Annuler un paiement
   */
  async cancelPayment(paymentId: string, reason: string): Promise<ApiResponse> {
    console.log('❌ Annulation paiement:', { paymentId, reason });
    
    if (!paymentId) {
      return {
        success: false,
        error: 'ID paiement requis'
      };
    }

    if (!reason?.trim() || reason.trim().length < 5) {
      return {
        success: false,
        error: 'Motif d\'annulation requis (minimum 5 caractères)'
      };
    }

    const endpoint = `/payments/payments/${paymentId}/cancel`;
    
    try {
      const response = await apiClient.put(endpoint, { reason: reason.trim() });
      console.log('✅ Paiement annulé avec succès:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur annulation paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation du paiement'
      };
    }
  }

  // === GESTION DES FRAIS ÉTUDIANTS ===

  /**
   * Récupérer les frais d'un étudiant
   */
  async getStudentFees(studentId: string, options?: { year?: number; month?: number }): Promise<StudentFeesResponse> {
    console.log('📊 Récupération frais étudiant:', { studentId, options });
    
    if (!studentId) {
      return {
        success: false,
        error: 'ID étudiant requis'
      };
    }

    const params = new URLSearchParams();
    if (options?.year) params.append('year', options.year.toString());
    if (options?.month) params.append('month', options.month.toString());

    const endpoint = `/payments/students/${studentId}/fees${params.toString() ? `?${params.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get<StudentFeesResponse>(endpoint);
      console.log('✅ Frais étudiant récupérés:', response);
      return {
        success: true,
        ...response,
        student: response.student || response.data?.student,
        fees: response.fees || response.data?.fees,
        payments: response.payments || response.data?.payments,
        schedules: response.schedules || response.data?.schedules,
        summary: response.summary || response.data?.summary
      };
    } catch (error) {
      console.error('❌ Erreur récupération frais étudiant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des frais'
      };
    }
  }

  /**
   * Récupérer l'historique des paiements d'un étudiant
   */
  async getPaymentHistory(studentId: string, options?: {
    page?: number;
    limit?: number;
    payment_type?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse> {
    console.log('📚 Historique paiements étudiant:', { studentId, options });
    
    if (!studentId) {
      return {
        success: false,
        error: 'ID étudiant requis'
      };
    }

    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/payments/students/${studentId}/payments/history${params.toString() ? `?${params.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(endpoint);
      console.log('✅ Historique paiements récupéré:', response);
      return {
        success: true,
        ...response,
        payments: response.payments || response.data?.payments || [],
        pagination: response.pagination || response.data?.pagination,
        statistics: response.statistics || response.data?.statistics
      };
    } catch (error) {
      console.error('❌ Erreur récupération historique:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'historique',
        payments: [],
        pagination: {},
        statistics: {}
      };
    }
  }

  // === STATISTIQUES ===

  /**
   * Récupérer les statistiques des paiements
   */
  async getPaymentStats(): Promise<PaymentStatsResponse> {
    console.log('📈 Récupération statistiques paiements');
    
    const endpoint = '/payments/stats';
    
    try {
      const response = await apiClient.get<PaymentStatsResponse>(endpoint);
      console.log('✅ Statistiques récupérées:', response);
      return {
        success: true,
        ...response,
        stats: response.stats || response.data?.stats
      };
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques'
      };
    }
  }

  // === PLANS DE PAIEMENT ===

  /**
   * Créer un plan de paiement pour un étudiant
   */
  async createPaymentSchedule(studentId: string, scheduleData: CreateScheduleData): Promise<ApiResponse> {
    console.log('📅 Création plan de paiement:', { studentId, scheduleData });
    
    if (!studentId) {
      return {
        success: false,
        error: 'ID étudiant requis'
      };
    }

    const validationErrors = this.validateScheduleData(scheduleData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', ')
      };
    }

    const endpoint = `/payments/students/${studentId}/schedules`;
    
    try {
      const response = await apiClient.post(endpoint, scheduleData);
      console.log('✅ Plan de paiement créé:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur création plan de paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création du plan de paiement'
      };
    }
  }

  // === REÇUS ===

  /**
   * Télécharger un reçu PDF
   */
  async downloadReceipt(paymentId: string): Promise<Blob> {
    console.log('📄 Téléchargement reçu:', paymentId);
    
    if (!paymentId) {
      throw new Error('ID paiement requis');
    }

    const endpoint = `/payments/receipts/${paymentId}`;
    
    try {
      const response = await apiClient.get<Blob>(endpoint);
      
      if (response.success && response.data instanceof Blob) {
        console.log('✅ Reçu téléchargé:', response);
        return response.data;
      } else {
        throw new Error('Format de réponse invalide pour le reçu');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement reçu:', error);
      throw error;
    }
  }

  /**
   * Générer et télécharger un reçu
   */
  async generateAndDownloadReceipt(payment: any): Promise<void> {
    console.log('🎫 Génération reçu pour:', payment);
    
    try {
      // Essayer d'abord le téléchargement via l'API
      const blob = await this.downloadReceipt(payment.id);
      
      // Créer le lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu_${payment.receipt_number || 'paiement'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Reçu téléchargé avec succès');
    } catch (error) {
      console.warn('⚠️ Erreur API, génération reçu simple:', error);
      
      // Fallback: générer un reçu texte simple
      this.generateSimpleReceipt(payment);
    }
  }

  /**
   * Générer un reçu simple en texte
   */
  private generateSimpleReceipt(payment: any): void {
    const formatGNF = (amount: number) => {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const paymentTypes = [
      { value: 'tuition_monthly', label: 'Frais mensuels' },
      { value: 'registration', label: 'Inscription' },
      { value: 'exam_fee', label: 'Examens' },
      { value: 'book_fee', label: 'Livres' },
      { value: 'uniform_fee', label: 'Uniforme' },
      { value: 'transport_fee', label: 'Transport' },
      { value: 'meal_fee', label: 'Repas' },
      { value: 'penalty', label: 'Pénalité' },
      { value: 'advance_payment', label: 'Avance' },
      { value: 'other', label: 'Autres' }
    ];

    const paymentMethods = [
      { value: 'cash', label: 'Espèces' },
      { value: 'mobile_money', label: 'Mobile Money' },
      { value: 'bank_transfer', label: 'Virement' },
      { value: 'card', label: 'Carte' },
      { value: 'check', label: 'Chèque' }
    ];

    const receiptContent = `
Haramain
École Coranique et Française
Conakry, République de Guinée

================================
         REÇU DE PAIEMENT
================================

Numéro de reçu: ${payment.receipt_number || 'N/A'}
Date: ${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}

ÉTUDIANT:
Nom: ${payment.student?.full_name || 'N/A'}
N° Étudiant: ${payment.student?.student_number || 'N/A'}
Classe: ${payment.student?.coranic_class?.name || 'Non assignée'}
Statut: ${payment.student?.status || 'N/A'}

PAIEMENT:
Type: ${payment.payment_type === 'other' 
  ? (payment.custom_payment_type || 'Autres')
  : (paymentTypes.find(pt => pt.value === payment.payment_type)?.label || 'N/A')
}
Période: ${payment.period || 'N/A'}
${(payment.number_of_months || 0) > 1 ? `Nombre de mois: ${payment.number_of_months}` : ''}
Montant dû: ${formatGNF(payment.amount_due || payment.amount)}
Montant payé: ${formatGNF(payment.amount)}
Méthode: ${paymentMethods.find(pm => pm.value === payment.payment_method)?.label || 'N/A'}
Payé par: ${payment.paid_by || 'N/A'}

${payment.is_complete ? 
  (payment.difference > 0 ? `Excédent: ${formatGNF(payment.difference)}` : 'PAIEMENT COMPLET') :
  `Reste à payer: ${formatGNF(Math.abs(payment.difference || 0))}`
}

${payment.notes ? `Notes: ${payment.notes}` : ''}

================================
Merci pour votre confiance

Signature: ___________________
    `;

    // Créer et télécharger le fichier texte
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu_${payment.receipt_number || 'paiement'}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('✅ Reçu simple généré et téléchargé');
  }

  // === RECHERCHE ===

  /**
   * Recherche rapide de paiements
   */
  async searchPayments(query: string, limit: number = 10): Promise<ApiResponse> {
    console.log('🔍 Recherche paiements:', { query, limit });
    
    if (!query?.trim() || query.trim().length < 2) {
      return {
        success: true,
        results: [],
        message: 'Tapez au moins 2 caractères pour rechercher'
      };
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString()
    });

    const endpoint = `/payments/search?${params.toString()}`;
    
    try {
      const response = await apiClient.get(endpoint);
      console.log('✅ Recherche terminée:', response);
      return {
        success: true,
        ...response,
        results: response.results || response.data?.results || []
      };
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la recherche',
        results: []
      };
    }
  }

  // === UTILITAIRES ===

  /**
   * Formater un montant en GNF
   */
  formatGNF(amount: number | string | undefined | null): string {
    const numAmount = Number(amount || 0);
    if (isNaN(numAmount)) return '0 GNF';
    
    try {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0
      }).format(numAmount);
    } catch (error) {
      return `${numAmount.toLocaleString()} GNF`;
    }
  }

  /**
   * Obtenir le nom du mois
   */
  getMonthName(month: number | string | undefined | null): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthNum = Number(month || 1);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return 'Mois inconnu';
    return months[monthNum - 1] || 'Mois inconnu';
  }

  /**
   * Valider les données de paiement
   */
  validatePaymentData(data: Partial<CreatePaymentData>): string[] {
    const errors: string[] = [];

    if (!data.student_id) {
      errors.push('ID étudiant requis');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Montant invalide');
    }

    if (!data.payment_method) {
      errors.push('Méthode de paiement requise');
    }

    if (!data.payment_type) {
      errors.push('Type de paiement requis');
    }

    if (data.payment_type === 'other' && !data.custom_payment_type?.trim()) {
      errors.push('Type de paiement personnalisé requis pour "Autres"');
    }

    if (!data.paid_by?.trim()) {
      errors.push('Nom du payeur requis');
    }

    if (data.number_of_months && (data.number_of_months < 1 || data.number_of_months > 12)) {
      errors.push('Nombre de mois invalide (1-12)');
    }

    return errors;
  }

  /**
   * Valider les données de plan de paiement
   */
  private validateScheduleData(data: CreateScheduleData): string[] {
    const errors: string[] = [];

    if (!data.tuition_fee_id) {
      errors.push('ID structure de frais requis');
    }

    if (!data.payment_plan) {
      errors.push('Plan de paiement requis');
    }

    if (!data.start_month || data.start_month < 1 || data.start_month > 12) {
      errors.push('Mois de début invalide');
    }

    if (!data.start_year || data.start_year < 2020) {
      errors.push('Année de début invalide');
    }

    return errors;
  }

  /**
   * Générer un numéro de reçu automatique
   */
  generateReceiptNumber(): string {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `REC-${currentYear}${currentMonth}-${randomNum}`;
  }
}

// Instance singleton du service
export const paymentService = new PaymentService();

// Export par défaut
export default paymentService;