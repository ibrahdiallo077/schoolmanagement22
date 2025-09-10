// src/services/salaryPaymentsService.ts
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface DashboardData {
  period: {
    year: number;
    month?: number;
    month_name?: string;
  };
  main_cards: {
    total_receipts: {
      value: number;
      formatted_value: string;
      count: number;
      change_percent: number;
      trend: 'up' | 'down' | 'neutral';
    };
    current_month: {
      value: number;
      formatted_value: string;
      count: number;
      change_percent: number;
      trend: 'up' | 'down' | 'neutral';
    };
    pending: {
      value: number;
      formatted_value: string;
      count: number;
      change_percent: number;
      trend: 'up' | 'down' | 'neutral';
    };
    overdue: {
      value: number;
      formatted_value: string;
      count: number;
      change_percent: number;
      trend: 'up' | 'down' | 'neutral';
    };
    transactions: {
      value: number;
      count: number;
      change_percent: number;
      trend: 'up' | 'down' | 'neutral';
    };
  };
  recent_payments: Array<{
    id: string;
    receipt_number: string;
    staff_name: string;
    staff_number: string;
    position: string;
    photo_url?: string;
    amount: number;
    formatted_amount: string;
    payment_date_formatted: string;
    status_label: string;
    status_color: string;
    status_icon: string;
    type_label: string;
    method_label: string;
    method_icon: string;
  }>;
  statistics: {
    total_payments: number;
    completed_payments: number;
    pending_payments: number;
    completion_rate: number;
    formatted_total_amount: string;
    formatted_completed_amount: string;
    formatted_pending_amount: string;
  };
}

interface Payment {
  id: string;
  receipt_number: string;
  staff_name: string;
  staff_number: string;
  position: string;
  department: string;
  photo_url?: string;
  amount: number;
  formatted_amount: string;
  gross_amount?: number;
  formatted_gross_amount?: string;
  net_amount?: number;
  formatted_net_amount?: string;
  payment_date: string;
  payment_date_formatted: string;
  payment_type: string;
  type_label: string;
  payment_method: string;
  method_label: string;
  method_icon: string;
  payment_status: string;
  status_label: string;
  status_color: string;
  status_icon: string;
  payment_year: number;
  payment_month?: number;
  period_display: string;
  notes?: string;
  paid_by?: string;
}

interface PaymentFilters {
  search?: string;
  payment_type?: string;
  payment_method?: string;
  payment_status?: string;
  payment_year?: string;
  payment_month?: string;
  date_start?: string;
  date_end?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface PaginationData {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface Staff {
  salary_config_id: string;
  display_name: string;
  staff_number: string;
  position: string;
  department: string;
  monthly_salary: number;
  photo_url?: string;
  formatted_net_salary: string;
  formatted_monthly_salary: string;
}

interface PaymentFormData {
  staff_salary_id: string;
  payment_type: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_year: number;
  payment_month?: number;
  gross_amount?: number;
  net_amount?: number;
  tax_amount?: number;
  bonus_amount?: number;
  deduction_amount?: number;
  paid_by: string;
  notes: string;
  is_advance: boolean;
  payment_status: string;
}

interface PaymentType {
  value: string;
  label: string;
  description?: string;
}

interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
}

interface PaymentStatus {
  value: string;
  label: string;
  icon: string;
}

class SalaryPaymentsService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    // ✅ CORRECTION DE L'URL - Utilise l'URL complète comme dans le formulaire
    this.baseURL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/salary-payments`;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      console.log('🌍 API Request:', url); // ✅ DEBUG
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.token ? `Bearer ${this.token}` : '',
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      
      console.log('📡 API Response status:', response.status); // ✅ DEBUG
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ API Response data:', data); // ✅ DEBUG
      
      return {
        success: data.success || true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('💥 API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  }

  // === TABLEAU DE BORD ===
  async getDashboard(year?: number, month?: number): Promise<ApiResponse<DashboardData>> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const response = await this.request<{dashboard: DashboardData}>(
      `/dashboard?${params.toString()}`
    );
    
    return {
      ...response,
      data: response.data?.dashboard
    };
  }

  // === HISTORIQUE DES PAIEMENTS ===
  async getPaymentsHistory(filters: PaymentFilters = {}): Promise<ApiResponse<{
    payments: Payment[];
    pagination: PaginationData;
  }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.request(`/history?${params.toString()}`);
  }

  // === EMPLOYÉS DISPONIBLES ===
  async getAvailableStaff(search?: string): Promise<ApiResponse<{
    staff: Staff[];
    total_staff: number;
  }>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    return this.request(`/staff/available?${params.toString()}`);
  }

  // === CRÉER UN PAIEMENT ===
  async createPayment(paymentData: PaymentFormData): Promise<ApiResponse<{
    payment: Payment;
    message: string;
  }>> {
    return this.request('/create', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  // === DÉTAILS D'UN PAIEMENT ===
  async getPaymentDetails(paymentId: string): Promise<ApiResponse<{
    payment: Payment;
  }>> {
    return this.request(`/payment/${paymentId}`);
  }

  // === MODIFIER UN PAIEMENT ===
  async updatePayment(
    paymentId: string, 
    paymentData: Partial<PaymentFormData>
  ): Promise<ApiResponse<{
    payment: Payment;
    message: string;
  }>> {
    return this.request(`/payment/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  }

  // === SUPPRIMER UN PAIEMENT ===
  async deletePayment(paymentId: string): Promise<ApiResponse<{
    message: string;
    deleted_payment: {
      receipt_number: string;
      staff_name: string;
      amount: string;
    };
  }>> {
    return this.request(`/payment/${paymentId}`, {
      method: 'DELETE'
    });
  }

  // === CHANGER STATUT ===
  async changePaymentStatus(
    paymentId: string, 
    status: string
  ): Promise<ApiResponse<{
    message: string;
    new_status: {
      value: string;
      label: string;
      color: string;
      icon: string;
    };
  }>> {
    return this.request(`/payment/${paymentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: status })
    });
  }

  // === CONFIGURATIONS ===
  async getPaymentTypes(): Promise<ApiResponse<{
    payment_types: PaymentType[];
  }>> {
    return this.request('/config/payment-types');
  }

  async getPaymentMethods(): Promise<ApiResponse<{
    payment_methods: PaymentMethod[];
  }>> {
    return this.request('/config/payment-methods');
  }

  async getPaymentStatuses(): Promise<ApiResponse<{
    payment_statuses: PaymentStatus[];
  }>> {
    return this.request('/config/payment-statuses');
  }

  // === STATISTIQUES RAPIDES ===
  async getQuickStats(): Promise<ApiResponse<{
    quick_stats: {
      total_payments: number;
      total_amount: number;
      current_month_payments: number;
      current_month_amount: number;
      pending_payments: number;
      pending_amount: number;
      total_active_staff: number;
      staff_with_salary: number;
      formatted_total_amount: string;
      formatted_current_month: string;
      formatted_pending_amount: string;
    };
  }>> {
    return this.request('/stats/quick');
  }

  // === EXPORT CSV ===
  async exportCSV(filters: {
    year?: string;
    month?: string;
    payment_status?: string;
  } = {}): Promise<void> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${this.baseURL}/export/csv?${params.toString()}`, {
        headers: {
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `paiements_salaires_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('💥 Erreur export CSV:', error);
      throw error;
    }
  }

  // === TEST DE CONNEXION ===
  async testConnection(): Promise<ApiResponse<{
    message: string;
    timestamp: string;
  }>> {
    return this.request('/test');
  }
}

// Instance singleton
export const salaryPaymentsService = new SalaryPaymentsService();

// Types exportés
export type {
  DashboardData,
  Payment,
  PaymentFilters,
  Staff,
  PaymentFormData,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  PaginationData,
  ApiResponse
};