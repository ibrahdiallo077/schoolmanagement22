// src/components/students/EnrollmentWizard/types.ts

export interface StudentFormData {
  // Informations personnelles
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  is_needy?: boolean;
  profile_photo?: File | null;
  
  // Scolarité
  coranic_class_id?: string;
  french_class_id?: string;
  french_school_name?: string;
  school_year_id?: string;
  schooling_notes?: string;
  
  // Tuteur/Guardian
  guardian: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    address?: string;
    relationship: string;
  };
  
  // Paiement
  payment?: {
    amount?: number;
    frequency?: string;
    payment_method?: string;
    scholarship?: string;
    payment_date?: string;
    enrollment_date?: string;
    notes?: string;
  };
  
  // Notes
  notes?: string;
}

export interface EnrollmentWizardProps {
  mode?: 'create' | 'edit';
  studentId?: string;
  onSuccess: (student: any) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  redirectTo?: string;
}

export interface SectionProps {
  formData: StudentFormData;
  updateFormData: (field: keyof StudentFormData | string, value: any) => void;
  errors: Record<string, string>;
}

export interface StepConfig {
  id: string;
  label: string;
  icon: any;
  color: string;
  component: React.ComponentType<SectionProps>;
}

export interface CreateStudentRequest {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  is_needy?: boolean;
  coranic_class_id?: string;
  french_class_id?: string;
  school_year_id?: string;
  guardian: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    address?: string;
    relationship: string;
  };
  notes?: string;
}