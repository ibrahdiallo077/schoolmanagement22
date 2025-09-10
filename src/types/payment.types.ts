// src/types/payment.ts

// === TYPES DE BASE ===

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'check';

export type PaymentType = 
  | 'tuition_monthly' 
  | 'registration' 
  | 'exam_fee' 
  | 'book_fee' 
  | 'uniform_fee' 
  | 'transport_fee' 
  | 'meal_fee' 
  | 'penalty' 
  | 'advance_payment' 
  | 'other';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overpaid' | 'cancelled' | 'overdue';

export type PaymentPlan = 'monthly' | 'quarterly' | 'annual' | 'custom';

// === INTERFACES PRINCIPALES ===

/**
 * Interface pour un étudiant (version simplifiée pour les paiements)
 */
export interface PaymentStudent {
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
    type?: string;
  };
  school_year?: {
    id: string;
    name: string;
    is_current?: boolean;
  };
  guardian_name?: string;
  guardian_phone?: string;
  enrollment_date?: string;
  balance?: number;
  last_payment_date?: string;
}

/**
 * Interface principale pour un paiement
 */
export interface Payment {
  id: string;
  receipt_number: string;
  reference_number?: string;
  transaction_id?: string;
  
  // Étudiant concerné
  student_id: string;
  student: PaymentStudent;
  
  // Montants
  amount: number;
  amount_due: number;
  formatted_amount: string;
  
  // Informations de paiement
  payment_date: string;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  custom_payment_type?: string;
  
  // Période de paiement
  period: string;
  payment_month: number;
  payment_year: number;
  number_of_months: number;
  
  // Informations complémentaires
  paid_by: string;
  received_by?: string;
  notes?: string;
  
  // Statut et calculs
  status: PaymentStatus;
  completion_rate: number;
  is_complete: boolean;
  difference: number;
  
  // Métadonnées
  created_at: string;
  updated_at?: string;
  created_by?: string;
  is_cancelled: boolean;
  cancelled_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  
  // Lien avec l'échéancier
  payment_schedule_id?: string;
}

/**
 * Interface pour créer un paiement
 */
export interface CreatePaymentData {
  student_id: string;
  amount: number;
  amount_due: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
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

/**
 * Interface pour mettre à jour un paiement
 */
export interface UpdatePaymentData extends Partial<CreatePaymentData> {
  id: string;
}

/**
 * Interface pour les filtres de recherche de paiements
 */
export interface PaymentSearchFilters {
  page?: number;
  limit?: number;
  sort_by?: 'payment_date' | 'amount' | 'student.full_name' | 'created_at';
  sort_order?: 'asc' | 'desc';
  search?: string;
  payment_type?: PaymentType | 'all';
  payment_method?: PaymentMethod | 'all';
  status?: PaymentStatus | 'all';
  period?: string;
  start_date?: string;
  end_date?: string;
  student_id?: string;
  class_id?: string;
  is_cancelled?: boolean;
}

// === STRUCTURES DE FRAIS ===

/**
 * Interface pour la structure des frais d'un étudiant
 */
export interface StudentFees {
  id?: string;
  registration_fee: number;
  monthly_amount: number;
  annual_amount: number;
  exam_fee: number;
  book_fee: number;
  uniform_fee: number;
  transport_fee: number;
  meal_fee: number;
  additional_fees: number;
  
  // Calculs
  total_fees: number;
  discount_applied: number;
  discount_reason: string;
  final_amount: number;
  
  // Informations sur les réductions
  orphan_discount_percent?: number;
  needy_discount_percent?: number;
  early_payment_discount?: number;
  
  // Métadonnées
  payment_type?: PaymentPlan;
  description?: string;
  is_active?: boolean;
  academic_year?: string;
}

/**
 * Interface pour l'historique de paiement d'un étudiant
 */
export interface PaymentHistory {
  id: string;
  amount: number;
  formatted_amount: string;
  payment_date: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  receipt_number: string;
  reference_number?: string;
  notes?: string;
  status: PaymentStatus;
  paid_by: string;
  period: string;
  is_cancelled: boolean;
  created_at: string;
}

/**
 * Interface pour un échéancier de paiement
 */
export interface PaymentSchedule {
  id: string;
  student_id: string;
  tuition_fee_id?: string;
  
  // Échéance
  due_month: number;
  due_year: number;
  due_date: string;
  
  // Montants
  base_amount: number;
  discount_applied: number;
  penalty_amount: number;
  final_amount: number;
  amount_paid: number;
  balance: number;
  
  // Statut
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  overdue_days: number;
  
  // Métadonnées
  notes?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Interface pour créer un plan de paiement
 */
export interface CreateScheduleData {
  tuition_fee_id: string;
  payment_plan: PaymentPlan;
  start_month: number;
  start_year: number;
  number_of_installments?: number;
  custom_amounts?: number[];
}

// === STATISTIQUES ET RÉSUMÉS ===

/**
 * Interface pour les statistiques de paiements
 */
export interface PaymentStats {
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
  period: {
    current_year: number;
    current_month: number;
    current_month_name: string;
  };
}

/**
 * Interface pour le résumé des paiements d'un étudiant
 */
export interface StudentPaymentSummary {
  student: PaymentStudent;
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
  metadata: {
    total_payments: number;
    last_payment_date?: string;
    next_due_date?: string;
    is_up_to_date: boolean;
    overdue_amount: number;
  };
}

// === RÉPONSES API ===

/**
 * Interface pour la réponse de liste de paiements
 */
export interface PaymentListResponse {
  success: boolean;
  payments: Payment[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: PaymentSearchFilters;
  message?: string;
  error?: string;
}

/**
 * Interface pour la réponse de création/modification de paiement
 */
export interface PaymentResponse {
  success: boolean;
  payment?: Payment;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Interface pour la réponse des frais étudiant
 */
export interface StudentFeesResponse {
  success: boolean;
  student?: PaymentStudent;
  fees?: StudentFees;
  payments?: {
    history: PaymentHistory[];
    total_paid: number;
    balance: number;
    status: string;
  };
  schedules?: PaymentSchedule[];
  summary?: {
    total_expected: number;
    total_paid: number;
    remaining_balance: number;
    payment_completion: number;
    currency: string;
  };
  message?: string;
  error?: string;
}

/**
 * Interface pour la réponse des statistiques
 */
export interface PaymentStatsResponse {
  success: boolean;
  stats?: PaymentStats;
  message?: string;
  error?: string;
}

/**
 * Interface pour la réponse de recherche
 */
export interface PaymentSearchResponse {
  success: boolean;
  results: Array<{
    id: string;
    receipt_number: string;
    amount: number;
    formatted_amount: string;
    payment_date: string;
    payment_method: PaymentMethod;
    payment_type: PaymentType;
    reference_number?: string;
    student: {
      id: string;
      student_number: string;
      full_name: string;
    };
    relevance: number;
    notes?: string;
  }>;
  query: string;
  total: number;
  message?: string;
  error?: string;
}

// === UTILITAIRES ET HELPERS ===

/**
 * Interface pour les options de formatage
 */
export interface PaymentFormatOptions {
  currency?: 'GNF' | 'USD' | 'EUR';
  locale?: 'fr-GN' | 'en-US' | 'fr-FR';
  minimumFractionDigits?: number;
  showSymbol?: boolean;
}

/**
 * Interface pour les labels des types de paiement
 */
export interface PaymentTypeLabel {
  value: PaymentType;
  label: string;
  description: string;
  icon?: string;
  color?: string;
  category?: 'academic' | 'administrative' | 'extra';
}

/**
 * Interface pour les labels des méthodes de paiement
 */
export interface PaymentMethodLabel {
  value: PaymentMethod;
  label: string;
  description: string;
  icon?: string;
  color?: string;
  fee_percent?: number;
  is_electronic?: boolean;
}

// === CONSTANTES TYPÉES ===

export const PAYMENT_TYPES: PaymentTypeLabel[] = [
  { value: 'tuition_monthly', label: 'Frais mensuels', description: 'Frais de scolarité mensuel', icon: '📅', category: 'academic' },
  { value: 'registration', label: 'Inscription', description: 'Frais d\'inscription', icon: '📝', category: 'administrative' },
  { value: 'exam_fee', label: 'Examens', description: 'Frais d\'examens', icon: '📄', category: 'academic' },
  { value: 'book_fee', label: 'Livres', description: 'Frais de livres et fournitures', icon: '📚', category: 'academic' },
  { value: 'uniform_fee', label: 'Uniforme', description: 'Frais d\'uniforme scolaire', icon: '👕', category: 'extra' },
  { value: 'transport_fee', label: 'Transport', description: 'Frais de transport', icon: '🚌', category: 'extra' },
  { value: 'meal_fee', label: 'Repas', description: 'Frais de cantine', icon: '🍽️', category: 'extra' },
  { value: 'penalty', label: 'Pénalité', description: 'Pénalité de retard', icon: '⚠️', category: 'administrative' },
  { value: 'advance_payment', label: 'Avance', description: 'Paiement anticipé', icon: '⏰', category: 'administrative' },
  { value: 'other', label: 'Autres', description: 'Autre type de frais', icon: '💰', category: 'extra' }
];

export const PAYMENT_METHODS: PaymentMethodLabel[] = [
  { value: 'cash', label: 'Espèces', description: 'Paiement en liquide', icon: '💵', is_electronic: false },
  { value: 'mobile_money', label: 'Mobile Money', description: 'Orange Money, MTN...', icon: '📱', is_electronic: true },
  { value: 'bank_transfer', label: 'Virement', description: 'Virement bancaire', icon: '🏦', is_electronic: true },
  { value: 'card', label: 'Carte', description: 'Carte bancaire', icon: '💳', is_electronic: true },
  { value: 'check', label: 'Chèque', description: 'Paiement par chèque', icon: '📄', is_electronic: false }
];

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'En attente', color: 'blue' },
  { value: 'partial', label: 'Partiel', color: 'orange' },
  { value: 'paid', label: 'Payé', color: 'green' },
  { value: 'overpaid', label: 'Excédent', color: 'purple' },
  { value: 'cancelled', label: 'Annulé', color: 'red' },
  { value: 'overdue', label: 'En retard', color: 'red' }
] as const;

// === GUARDS DE TYPE ===

/**
 * Vérifier si un objet est un paiement valide
 */
export function isValidPayment(obj: any): obj is Payment {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.amount === 'number' && 
         typeof obj.student_id === 'string' &&
         obj.payment_method &&
         obj.payment_type;
}

/**
 * Vérifier si une méthode de paiement est valide
 */
export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return ['cash', 'mobile_money', 'bank_transfer', 'card', 'check'].includes(method);
}

/**
 * Vérifier si un type de paiement est valide
 */
export function isValidPaymentType(type: string): type is PaymentType {
  return [
    'tuition_monthly', 'registration', 'exam_fee', 'book_fee', 
    'uniform_fee', 'transport_fee', 'meal_fee', 'penalty', 
    'advance_payment', 'other'
  ].includes(type);
}

// === EXPORT PAR DÉFAUT ===
export default {
  PAYMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  isValidPayment,
  isValidPaymentMethod,
  isValidPaymentType
};