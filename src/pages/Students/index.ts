// src/pages/Students/index.ts
// Index pour exporter tous les composants Students modernes

// Pages principales
export { default as StudentsListPage } from './StudentsListPage';
export { default as StudentProfilePage } from './StudentProfilePage';
export { default as StudentFormPage } from './StudentFormPage';
export { default as StudentsPage } from '../StudentsPage';

// Types communs pour les étudiants (réexportés depuis le service)
export type { 
  Student, 
  StudentStats, 
  StudentsListResponse,
  StudentResponse,
  DeleteResponse,
  UploadPhotoResponse,
  StudentListParams 
} from '../../services/studentService';

// Service principal (réexporté pour faciliter l'import)
export { StudentService } from '../../services/studentService';

// Types additionnels pour l'interface
export interface StudentFormData {
  // Informations de base
  first_name: string;
  last_name: string;
  birth_date: string;
  age?: number;
  gender: 'M' | 'F';
  is_orphan: boolean;
  status: 'interne' | 'externe';
  enrollment_date: string;
  notes?: string;
  
  // Photo
  photo_file?: File;
  
  // Classes (optionnel)
  coranic_class_id?: string;
  french_class_id?: string;
  
  // Tuteur (optionnel)
  guardian?: {
    first_name: string;
    last_name: string;
    relationship: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface StudentFilters {
  search: string;
  status: 'all' | 'interne' | 'externe';
  payment_status: 'all' | 'paid' | 'pending' | 'overdue' | 'partial';
  gender: 'all' | 'M' | 'F';
  orphan: 'all' | 'true' | 'false';
}

export interface StudentModalStates {
  showDetail: boolean;
  showDelete: boolean;
  showPhoto: boolean;
  showForm: boolean;
}

// Constantes utiles
export const STUDENT_STATUS_OPTIONS = [
  { value: 'interne', label: 'Interne', icon: 'Home' },
  { value: 'externe', label: 'Externe', icon: 'Building2' }
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'À jour', color: 'green' },
  { value: 'pending', label: 'En attente', color: 'blue' },
  { value: 'overdue', label: 'En retard', color: 'red' },
  { value: 'partial', label: 'Partiel', color: 'orange' }
] as const;

export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  { value: 'père', label: 'Père' },
  { value: 'mère', label: 'Mère' },
  { value: 'tuteur', label: 'Tuteur' },
  { value: 'oncle', label: 'Oncle' },
  { value: 'tante', label: 'Tante' },
  { value: 'grand-père', label: 'Grand-père' },
  { value: 'grand-mère', label: 'Grand-mère' },
  { value: 'autre', label: 'Autre' }
] as const;

export const CORANIC_CLASS_OPTIONS = [
  { value: '1', label: 'CP Coran - Débutant' },
  { value: '2', label: 'CE1 Coran - Élémentaire' },
  { value: '3', label: 'CE2 Coran - Élémentaire' },
  { value: '4', label: '6ème Coran - Intermédiaire' },
  { value: '5', label: '5ème Coran - Intermédiaire' },
  { value: '6', label: '4ème Coran - Avancé' },
  { value: '7', label: '3ème Coran - Avancé' }
] as const;

export const FRENCH_CLASS_OPTIONS = [
  { value: '1', label: 'CP - Cours Préparatoire' },
  { value: '2', label: 'CE1 - Cours Élémentaire 1' },
  { value: '3', label: 'CE2 - Cours Élémentaire 2' },
  { value: '4', label: 'CM1 - Cours Moyen 1' },
  { value: '5', label: 'CM2 - Cours Moyen 2' },
  { value: '6', label: '6ème - Collège' },
  { value: '7', label: '5ème - Collège' },
  { value: '8', label: '4ème - Collège' },
  { value: '9', label: '3ème - Collège' }
] as const;

// Utilitaires d'aide
export const StudentUtils = {
  /**
   * Génère les initiales d'un étudiant
   */
  getInitials: (firstName: string, lastName: string): string => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  },

  /**
   * Calcule l'âge d'un étudiant
   */
  calculateAge: (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  /**
   * Génère un numéro d'étudiant unique
   */
  generateStudentNumber: (): string => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `ELV-${year}-${timestamp}`;
  },

  /**
   * Formate un montant en devise locale
   */
  formatCurrency: (amount: number, currency: string = 'GNF'): string => {
    return `${amount.toLocaleString()} ${currency}`;
  },

  /**
   * Obtient la configuration de couleur pour un statut de paiement
   */
  getPaymentStatusConfig: (status?: string) => {
    switch (status) {
      case 'paid':
        return {
          bg: 'from-emerald-500 to-green-600',
          text: 'À jour',
          color: 'emerald',
          icon: 'CheckCircle'
        };
      case 'pending':
        return {
          bg: 'from-blue-500 to-indigo-600',
          text: 'En attente',
          color: 'blue',
          icon: 'Clock'
        };
      case 'overdue':
        return {
          bg: 'from-red-500 to-rose-600',
          text: 'En retard',
          color: 'red',
          icon: 'XCircle'
        };
      case 'partial':
        return {
          bg: 'from-orange-500 to-amber-600',
          text: 'Partiel',
          color: 'orange',
          icon: 'AlertTriangle'
        };
      default:
        return {
          bg: 'from-slate-500 to-gray-600',
          text: 'Non défini',
          color: 'gray',
          icon: 'Clock'
        };
    }
  },

  /**
   * Obtient la configuration de couleur pour un statut d'étudiant
   */
  getStudentStatusConfig: (student: Student) => {
    if (student.is_orphan) {
      return {
        bg: 'from-rose-500 via-pink-500 to-red-500',
        text: 'Orphelin ' + (student.status === 'interne' ? 'Interne' : 'Externe'),
        color: 'rose',
        icon: 'Heart'
      };
    }
    
    return student.status === 'interne'
      ? {
          bg: 'from-indigo-500 via-blue-500 to-purple-600',
          text: 'Interne',
          color: 'indigo',
          icon: 'Home'
        }
      : {
          bg: 'from-emerald-500 via-green-500 to-teal-600',
          text: 'Externe',
          color: 'emerald',
          icon: 'Building2'
        };
  },

  /**
   * Valide les données d'un formulaire étudiant
   */
  validateStudentForm: (data: Partial<StudentFormData>): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.first_name?.trim()) {
      errors.first_name = 'Le prénom est requis';
    }
    if (!data.last_name?.trim()) {
      errors.last_name = 'Le nom de famille est requis';
    }
    if (!data.birth_date) {
      errors.birth_date = 'La date de naissance est requise';
    }
    if (!data.gender) {
      errors.gender = 'Le genre est requis';
    }
    if (!data.status) {
      errors.status = 'Le statut est requis';
    }
    if (!data.enrollment_date) {
      errors.enrollment_date = 'La date d\'inscription est requise';
    }

    // Validation du tuteur si renseigné
    if (data.guardian) {
      if (!data.guardian.first_name?.trim()) {
        errors['guardian.first_name'] = 'Le prénom du tuteur est requis';
      }
      if (!data.guardian.last_name?.trim()) {
        errors['guardian.last_name'] = 'Le nom du tuteur est requis';
      }
      if (!data.guardian.relationship?.trim()) {
        errors['guardian.relationship'] = 'La relation est requise';
      }
    }

    return errors;
  }
};

// Export par défaut du module complet
export default {
  StudentsListPage,
  StudentProfilePage,
  StudentFormPage,
  StudentsPage,
  StudentService,
  StudentUtils,
  STUDENT_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  GUARDIAN_RELATIONSHIP_OPTIONS,
  CORANIC_CLASS_OPTIONS,
  FRENCH_CLASS_OPTIONS
};