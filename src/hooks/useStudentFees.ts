// src/hooks/useStudentFees.ts
import { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';

// Types pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

interface PaymentHistoryResponse extends ApiResponse {
  payments: PaymentHistory[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  statistics: {
    total_payments: number;
    total_amount: number;
    formatted_total: string;
    cash_payments: number;
    mobile_money_payments: number;
    bank_transfer_payments: number;
    registration_payments: number;
    tuition_payments: number;
    last_payment_date: string;
    first_payment_date: string;
  };
}

interface PaymentStatsResponse extends ApiResponse {
  stats: {
    today: {
      payments: number;
      revenue: number;
      formatted_revenue: string;
      students: number;
    };
    month: {
      payments: number;
      revenue: number;
      formatted_revenue: string;
      students: number;
    };
    year: {
      payments: number;
      revenue: number;
      formatted_revenue: string;
      students: number;
    };
    total: {
      payments: number;
      revenue: number;
      formatted_revenue: string;
      students: number;
    };
  };
}

interface StudentFeesResponse extends ApiResponse, StudentFeesData {}

export interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  status: 'interne' | 'externe';
  is_orphan: boolean;
  age: number;
  photo_url?: string;
  coranic_class?: {
    id: string;
    name: string;
    level?: string;
  };
  guardian_name?: string;
  guardian_phone?: string;
}

export interface StudentFees {
  registration_fee: number;
  monthly_amount: number;
  annual_amount: number;
  exam_fee: number;
  book_fee: number;
  uniform_fee: number;
  transport_fee: number;
  meal_fee: number;
  additional_fees: number;
  total_fees: number;
  discount_applied: number;
  discount_reason: string;
  final_amount: number;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_method: string;
  receipt_number: string;
  notes?: string;
  status?: string;
}

export interface PaymentSchedule {
  id: string;
  due_month: number;
  due_year: number;
  due_date: string;
  base_amount: number;
  discount_applied: number;
  penalty_amount: number;
  final_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  overdue_days: number;
  notes?: string;
}

export interface StudentFeesData {
  student: Student;
  fees: StudentFees;
  payments: {
    history: PaymentHistory[];
    total_paid: number;
    balance: number;
    status: 'paid' | 'pending' | 'overpaid';
  };
  schedules: PaymentSchedule[];
  summary: {
    total_expected: number;
    total_paid: number;
    remaining_balance: number;
    payment_completion: number;
    currency: string;
  };
}

export interface UseStudentFeesResult {
  studentFees: StudentFeesData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useStudentFees = (studentId: string | null): UseStudentFeesResult => {
  const [studentFees, setStudentFees] = useState<StudentFeesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentFees = async () => {
    if (!studentId) {
      setStudentFees(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Chargement des frais pour l\'étudiant:', studentId);
      
      const response = await paymentService.getStudentFees(studentId) as StudentFeesResponse;
      
      if (response?.success) {
        console.log('✅ Frais chargés avec succès:', response);
        setStudentFees({
          student: response.student,
          fees: response.fees,
          payments: response.payments,
          schedules: response.schedules,
          summary: response.summary
        });
      } else {
        const errorMessage = response?.error || 'Erreur lors du chargement des frais';
        console.error('❌ Erreur API:', errorMessage);
        setError(errorMessage);
        setStudentFees(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('💥 Erreur chargement frais:', err);
      setError(errorMessage);
      setStudentFees(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchStudentFees();
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    fetchStudentFees();
  }, [studentId]);

  return {
    studentFees,
    loading,
    error,
    refetch,
    clearError
  };
};

// Hook spécialisé pour l'historique des paiements
export const usePaymentHistory = (studentId: string | null, options?: {
  page?: number;
  limit?: number;
  payment_type?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const [history, setHistory] = useState<{
    payments: PaymentHistory[];
    pagination: any;
    statistics: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!studentId) {
      setHistory(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await paymentService.getPaymentHistory(studentId, options) as PaymentHistoryResponse;
      
      if (response?.success) {
        setHistory({
          payments: response.payments || [],
          pagination: response.pagination || {},
          statistics: response.statistics || {}
        });
      } else {
        setError(response?.error || 'Erreur lors du chargement de l\'historique');
        setHistory(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [studentId, options?.page, options?.limit, options?.payment_type, options?.payment_method, options?.start_date, options?.end_date]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    clearError: () => setError(null)
  };
};

// Hook pour les statistiques des paiements
export const usePaymentStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentService.getPaymentStats() as PaymentStatsResponse;
      
      if (response?.success) {
        setStats(response.stats || null);
      } else {
        setError(response?.error || 'Erreur lors du chargement des statistiques');
        setStats(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    clearError: () => setError(null)
  };
};

// Hook pour créer un plan de paiement
export const useCreatePaymentSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSchedule = async (studentId: string, scheduleData: {
    tuition_fee_id: string;
    payment_plan: 'monthly' | 'annual';
    start_month: number;
    start_year: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentService.createPaymentSchedule(studentId, scheduleData) as ApiResponse;
      
      if (response?.success) {
        return response;
      } else {
        const errorMessage = response?.error || 'Erreur lors de la création du plan';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSchedule,
    loading,
    error,
    clearError: () => setError(null)
  };
};

export default useStudentFees;