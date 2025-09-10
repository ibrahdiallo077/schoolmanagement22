// src/types/staff.types.ts - Types et interfaces centralisés pour le module staff (VERSION SIMPLIFIÉE)

// === INTERFACES PRINCIPALES ===

export interface Staff {
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

export interface StaffFormData {
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

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  position?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StaffApiResponse {
  success: boolean;
  employee?: Staff;
  staff?: Staff;
  message?: string;
  error?: string;
}

export interface StaffListApiResponse {
  success: boolean;
  staff?: Staff[];
  data?: Staff[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    current_page?: number;
    total_pages?: number;
    total_items?: number;
    per_page?: number;
  };
  error?: string;
}

export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  on_leave?: number;
  teachers: number;
  administrators?: number;
  averageSalary: number;
}

// === OPTIONS POUR LES SELECTS ===

export interface PositionOption {
  value: string;
  label: string;
  icon?: string;
  category?: string;
}

export interface DepartmentOption {
  value: string;
  label: string;
  icon?: string;
}

// === CONSTANTES ===

export const POSITION_OPTIONS: PositionOption[] = [
  { value: 'teacher', label: 'Enseignant(e)', icon: '👨‍🏫', category: 'Éducation' },
  { value: 'principal', label: 'Directeur/trice', icon: '👨‍💼', category: 'Direction' },
  { value: 'assistant_principal', label: 'Directeur/trice adjoint(e)', icon: '👩‍💼', category: 'Direction' },
  { value: 'admin', label: 'Administrateur/trice', icon: '⚙️', category: 'Administration' },
  { value: 'secretary', label: 'Secrétaire', icon: '📋', category: 'Administration' },
  { value: 'accountant', label: 'Comptable', icon: '💰', category: 'Finance' },
  { value: 'librarian', label: 'Bibliothécaire', icon: '📚', category: 'Éducation' },
  { value: 'counselor', label: 'Conseiller/ère', icon: '🧠', category: 'Éducation' },
  { value: 'cleaner', label: 'Agent(e) d\'entretien', icon: '🧹', category: 'Services' },
  { value: 'guard', label: 'Gardien(ne)', icon: '👮‍♂️', category: 'Sécurité' },
  { value: 'cook', label: 'Cuisinier(ère)', icon: '👨‍🍳', category: 'Services' },
  { value: 'nurse', label: 'Infirmier(ère)', icon: '👩‍⚕️', category: 'Santé' },
  { value: 'maintenance', label: 'Agent(e) de maintenance', icon: '🔧', category: 'Maintenance' },
  { value: 'driver', label: 'Chauffeur', icon: '🚗', category: 'Transport' },
  { value: 'it_support', label: 'Support informatique', icon: '💻', category: 'Technique' }
];

export const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  { value: 'administration', label: 'Administration', icon: '🏢' },
  { value: 'education', label: 'Éducation', icon: '🎓' },
  { value: 'education_coranique', label: 'Éducation Coranique', icon: '🕌' },
  { value: 'education_francaise', label: 'Éducation Française', icon: '🇫🇷' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'security', label: 'Sécurité', icon: '🛡️' },
  { value: 'services', label: 'Services Généraux', icon: '🔧' },
  { value: 'food_service', label: 'Restauration', icon: '🍽️' },
  { value: 'health', label: 'Santé', icon: '⚕️' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
  { value: 'library', label: 'Bibliothèque', icon: '📚' },
  { value: 'it', label: 'Informatique', icon: '💻' }
];

// === LABELS ET MAPPINGS ===

export const STAFF_STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  on_leave: 'En congé'
} as const;

export const STAFF_STATUS_COLORS = {
  active: 'emerald',
  inactive: 'red',
  on_leave: 'orange'
} as const;

export const STAFF_POSITION_LABELS = {
  teacher: 'Enseignant(e)',
  principal: 'Directeur/trice',
  assistant_principal: 'Directeur/trice adjoint(e)',
  admin: 'Administrateur/trice',
  secretary: 'Secrétaire',
  accountant: 'Comptable',
  librarian: 'Bibliothécaire',
  counselor: 'Conseiller/ère',
  cleaner: 'Agent(e) d\'entretien',
  guard: 'Gardien(ne)',
  cook: 'Cuisinier(ère)',
  nurse: 'Infirmier(ère)',
  maintenance: 'Agent(e) de maintenance',
  driver: 'Chauffeur',
  it_support: 'Support informatique'
} as const;

export const STAFF_DEPARTMENT_LABELS = {
  administration: 'Administration',
  education: 'Éducation',
  education_coranique: 'Éducation Coranique',
  education_francaise: 'Éducation Française',
  finance: 'Finance',
  maintenance: 'Maintenance',
  security: 'Sécurité',
  services: 'Services Généraux',
  food_service: 'Restauration',
  health: 'Santé',
  transport: 'Transport',
  library: 'Bibliothèque',
  it: 'Informatique'
} as const;

// === TYPES DÉRIVÉS ===

export type StaffStatus = keyof typeof STAFF_STATUS_LABELS;
export type StaffPosition = keyof typeof STAFF_POSITION_LABELS;
export type StaffDepartment = keyof typeof STAFF_DEPARTMENT_LABELS;

// === FONCTIONS UTILITAIRES ===

export const formatStaffName = (staff: Staff): string => {
  return staff.full_name || `${staff.first_name} ${staff.last_name}`;
};

export const getPositionLabel = (position?: string): string => {
  return position && position in STAFF_POSITION_LABELS 
    ? STAFF_POSITION_LABELS[position as StaffPosition] 
    : 'Poste non défini';
};

export const getDepartmentLabel = (department?: string): string => {
  return department && department in STAFF_DEPARTMENT_LABELS 
    ? STAFF_DEPARTMENT_LABELS[department as StaffDepartment] 
    : 'Département non assigné';
};

export const getStatusLabel = (status: string): string => {
  return status in STAFF_STATUS_LABELS 
    ? STAFF_STATUS_LABELS[status as StaffStatus] 
    : status;
};

export const calculateSeniority = (hireDate?: string): string => {
  if (!hireDate) return 'Non défini';
  
  const hire = new Date(hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} jours`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return months > 0 ? `${years} an${years > 1 ? 's' : ''} ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
};

// === INTERFACES POUR LES COMPOSANTS ===

export interface StaffCardProps {
  staff: Staff;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

export interface StaffFormProps {
  initialData?: Partial<Staff>;
  onSubmit: (data: StaffFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export interface StaffListProps {
  filters?: StaffListParams;
  onStaffSelect?: (staff: Staff) => void;
  selectable?: boolean;
  showActions?: boolean;
}

// === INTERFACES POUR LES HOOKS ===

export interface UseStaffListReturn {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: StaffStats;
  currentFilters: StaffListParams;
  updateFilters: (filters: Partial<StaffListParams>) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseStaffReturn {
  staff: Staff | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (data: Partial<StaffFormData>) => Promise<boolean>;
  delete: () => Promise<boolean>;
}

// === VALIDATION ===

export const validateStaffData = (data: Partial<StaffFormData>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Champs obligatoires
  if (!data.first_name?.trim()) {
    errors.push('Le prénom est requis');
  } else if (data.first_name.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  }
  
  if (!data.last_name?.trim()) {
    errors.push('Le nom est requis');
  } else if (data.last_name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }
  
  // Email (optionnel mais doit être valide si fourni)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Format d\'email invalide');
  }
  
  // Téléphone guinéen
  if (data.phone) {
    const phoneRegex = /^(\+224|00224|224)?[67][0-9]{7,8}$/;
    const cleanPhone = data.phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Format de téléphone guinéen invalide (+224 6XX XXX XXX ou +224 7XX XXX XXX)');
    }
  }
  
  // Dates
  if (data.hire_date && isNaN(Date.parse(data.hire_date))) {
    errors.push('Date d\'embauche invalide');
  }
  
  if (data.date_of_birth) {
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      errors.push('Date de naissance invalide');
    } else if (age < 16 || age > 100) {
      errors.push('L\'âge doit être entre 16 et 100 ans');
    }
  }
  
  // Salaire
  if (data.salary && (isNaN(Number(data.salary)) || Number(data.salary) < 0)) {
    errors.push('Le salaire doit être un nombre positif');
  }
  
  return { isValid: errors.length === 0, errors };
};

// === FILTRES PAR DÉFAUT ===

export const createDefaultFilters = (): StaffListParams => ({
  page: 1,
  limit: 12,
  search: '',
  position: undefined,
  department: undefined,
  status: undefined,
  sortBy: 'first_name',
  sortOrder: 'asc'
});

// === EXPORTS PAR DÉFAUT ===

export default {
  POSITION_OPTIONS,
  DEPARTMENT_OPTIONS,
  STAFF_STATUS_LABELS,
  STAFF_STATUS_COLORS,
  STAFF_POSITION_LABELS,
  STAFF_DEPARTMENT_LABELS,
  formatStaffName,
  getPositionLabel,
  getDepartmentLabel,
  getStatusLabel,
  calculateSeniority,
  validateStaffData,
  createDefaultFilters
};