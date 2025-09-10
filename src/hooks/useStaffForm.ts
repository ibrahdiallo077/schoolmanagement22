// src/hooks/useStaffForm.ts - Hook pour la gestion des formulaires de personnel

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// === TYPES ET INTERFACES ===

interface StaffFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status: 'active' | 'inactive';
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

interface FormErrors {
  [key: string]: string;
}

interface StaffFormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  isValid: boolean;
  isComplete: boolean;
}

interface UseStaffFormOptions {
  mode: 'create' | 'edit';
  staffId?: string;
  initialData?: Partial<StaffFormData>;
  onSuccess?: (data: StaffFormData) => void;
  onError?: (error: string) => void;
  enableStepValidation?: boolean;
}

interface UseStaffFormReturn {
  // Données du formulaire
  formData: StaffFormData;
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>;
  updateField: (field: keyof StaffFormData, value: any) => void;
  updateFields: (fields: Partial<StaffFormData>) => void;
  resetForm: () => void;
  
  // Validation
  errors: FormErrors;
  isValid: boolean;
  validateField: (field: keyof StaffFormData) => boolean;
  validateForm: () => boolean;
  clearErrors: () => void;
  
  // Étapes du formulaire
  currentStep: number;
  totalSteps: number;
  steps: StaffFormStep[];
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  
  // Actions
  loading: boolean;
  submitForm: () => Promise<void>;
  saveDraft: () => void;
  loadDraft: () => void;
  
  // Utilitaires
  isDirty: boolean;
  progress: number;
  completedSteps: number;
  
  // Mode
  mode: 'create' | 'edit';
  staffId?: string;
}

// === SERVICE STAFF LOCAL ===

const staffService = {
  async createStaff(data: StaffFormData) {
    try {
      const staffList = JSON.parse(localStorage.getItem('staffList') || '[]');
      
      const newStaff = {
        id: `STAFF-${Date.now()}`,
        staff_number: `ST${Date.now().toString().slice(-6)}`,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        status: data.status,
        hire_date: data.hire_date,
        salary: data.salary,
        address: data.address,
        qualifications: data.qualifications,
        notes: data.notes,
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone,
        payment_method: data.payment_method,
        bank_account: data.bank_account,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        photo_url: data.profilePhoto ? URL.createObjectURL(data.profilePhoto) : undefined,
        initials: `${data.first_name[0]}${data.last_name[0]}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      staffList.push(newStaff);
      localStorage.setItem('staffList', JSON.stringify(staffList));
      window.dispatchEvent(new Event('staffListUpdated'));

      return { success: true, employee: newStaff };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la création' };
    }
  },

  async updateStaff(id: string, data: StaffFormData) {
    try {
      const staffList = JSON.parse(localStorage.getItem('staffList') || '[]');
      const index = staffList.findIndex((s: any) => s.id === id);
      
      if (index === -1) {
        return { success: false, error: 'Employé non trouvé' };
      }

      const updatedStaff = {
        ...staffList[index],
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        status: data.status,
        hire_date: data.hire_date,
        salary: data.salary,
        address: data.address,
        qualifications: data.qualifications,
        notes: data.notes,
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone,
        payment_method: data.payment_method,
        bank_account: data.bank_account,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        photo_url: data.profilePhoto ? URL.createObjectURL(data.profilePhoto) : staffList[index].photo_url,
        initials: `${data.first_name[0]}${data.last_name[0]}`,
        updated_at: new Date().toISOString()
      };

      staffList[index] = updatedStaff;
      localStorage.setItem('staffList', JSON.stringify(staffList));
      window.dispatchEvent(new Event('staffListUpdated'));

      return { success: true, employee: updatedStaff };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  },

  async getStaffById(id: string) {
    try {
      const staffList = JSON.parse(localStorage.getItem('staffList') || '[]');
      const staff = staffList.find((s: any) => s.id === id);
      
      if (staff) {
        return { success: true, employee: staff };
      } else {
        return { success: false, error: 'Employé non trouvé' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors du chargement' };
    }
  }
};

// === VALIDATION ===

const validateStaffData = (data: Partial<StaffFormData>): FormErrors => {
  const errors: FormErrors = {};

  // Nom et prénom obligatoires
  if (!data.first_name?.trim()) {
    errors.first_name = 'Le prénom est obligatoire';
  } else if (data.first_name.length < 2) {
    errors.first_name = 'Le prénom doit contenir au moins 2 caractères';
  }

  if (!data.last_name?.trim()) {
    errors.last_name = 'Le nom est obligatoire';
  } else if (data.last_name.length < 2) {
    errors.last_name = 'Le nom doit contenir au moins 2 caractères';
  }

  // Email (optionnel mais doit être valide si fourni)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Format d\'email invalide';
  }

  // Téléphone (format guinéen)
  if (data.phone) {
    const phoneRegex = /^(\+224|00224|224)?[67][0-9]{7,8}$/;
    const cleanPhone = data.phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Format de téléphone guinéen invalide (+224 6XX XXX XXX)';
    }
  }

  // Date d'embauche
  if (data.hire_date && isNaN(Date.parse(data.hire_date))) {
    errors.hire_date = 'Date d\'embauche invalide';
  }

  // Date de naissance
  if (data.date_of_birth) {
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      errors.date_of_birth = 'Date de naissance invalide';
    } else if (age < 16 || age > 100) {
      errors.date_of_birth = 'L\'âge doit être entre 16 et 100 ans';
    }
  }

  // Salaire
  if (data.salary && (isNaN(Number(data.salary)) || Number(data.salary) < 0)) {
    errors.salary = 'Le salaire doit être un nombre positif';
  }

  return errors;
};

// === CONFIGURATION DES ÉTAPES ===

const createFormSteps = (mode: 'create' | 'edit'): StaffFormStep[] => [
  {
    id: 'personal',
    title: 'Informations personnelles',
    description: 'Nom, prénom, date de naissance et genre',
    fields: ['first_name', 'last_name', 'date_of_birth', 'gender'],
    isValid: false,
    isComplete: false
  },
  {
    id: 'professional',
    title: 'Détails professionnels',
    description: 'Poste, département, date d\'embauche et qualifications',
    fields: ['position', 'department', 'hire_date', 'qualifications'],
    isValid: false,
    isComplete: false
  },
  {
    id: 'contact',
    title: 'Informations de contact',
    description: 'Email, téléphone, adresse et contact d\'urgence',
    fields: ['email', 'phone', 'address', 'emergency_contact', 'emergency_phone'],
    isValid: false,
    isComplete: false
  },
  {
    id: 'financial',
    title: 'Détails financiers',
    description: 'Salaire, mode de paiement et compte bancaire',
    fields: ['salary', 'payment_method', 'bank_account'],
    isValid: false,
    isComplete: false
  },
  {
    id: 'summary',
    title: mode === 'edit' ? 'Modifications' : 'Récapitulatif',
    description: mode === 'edit' ? 'Vérifiez vos modifications' : 'Vérifiez toutes les informations',
    fields: ['status', 'notes'],
    isValid: false,
    isComplete: false
  }
];

// === HOOK PRINCIPAL ===

export const useStaffForm = (options: UseStaffFormOptions): UseStaffFormReturn => {
  const { 
    mode, 
    staffId, 
    initialData = {}, 
    onSuccess, 
    onError,
    enableStepValidation = true 
  } = options;

  // Données initiales du formulaire
  const defaultFormData: StaffFormData = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    status: 'active',
    hire_date: '',
    salary: undefined,
    address: '',
    qualifications: '',
    notes: '',
    emergency_contact: '',
    emergency_phone: '',
    payment_method: '',
    bank_account: '',
    date_of_birth: '',
    gender: undefined,
    profilePhoto: undefined,
    ...initialData
  };

  // États du formulaire
  const [formData, setFormData] = useState<StaffFormData>(defaultFormData);
  const [originalData, setOriginalData] = useState<StaffFormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<StaffFormStep[]>(createFormSteps(mode));

  // Charger les données initiales si en mode édition
  useEffect(() => {
    const loadInitialData = async () => {
      if (mode === 'edit' && staffId) {
        try {
          const response = await staffService.getStaffById(staffId);
          if (response.success && response.employee) {
            const staff = response.employee;
            const formattedData: StaffFormData = {
              first_name: staff.first_name || '',
              last_name: staff.last_name || '',
              email: staff.email || '',
              phone: staff.phone || '',
              position: staff.position || '',
              department: staff.department || '',
              status: staff.status || 'active',
              hire_date: staff.hire_date ? staff.hire_date.split('T')[0] : '',
              salary: staff.salary,
              address: staff.address || '',
              qualifications: staff.qualifications || '',
              notes: staff.notes || '',
              emergency_contact: staff.emergency_contact || '',
              emergency_phone: staff.emergency_phone || '',
              payment_method: staff.payment_method || '',
              bank_account: staff.bank_account || '',
              date_of_birth: staff.date_of_birth ? staff.date_of_birth.split('T')[0] : '',
              gender: staff.gender,
              profilePhoto: undefined
            };
            setFormData(formattedData);
            setOriginalData(formattedData);
          }
        } catch (error) {
          onError?.('Erreur lors du chargement des données');
        }
      }
    };

    loadInitialData();
  }, [mode, staffId, onError]);

  // Validation d'un champ
  const validateField = useCallback((field: keyof StaffFormData): boolean => {
    const fieldErrors = validateStaffData({ [field]: formData[field] });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldErrors[field]) {
        newErrors[field] = fieldErrors[field];
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });

    return !fieldErrors[field];
  }, [formData]);

  // Validation complète du formulaire
  const validateForm = useCallback((): boolean => {
    const formErrors = validateStaffData(formData);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [formData]);

  // Mise à jour d'un champ
  const updateField = useCallback((field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation en temps réel
    if (enableStepValidation) {
      setTimeout(() => validateField(field), 100);
    }
  }, [validateField, enableStepValidation]);

  // Mise à jour de plusieurs champs
  const updateFields = useCallback((fields: Partial<StaffFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  }, []);

  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setErrors({});
    setCurrentStep(0);
  }, [defaultFormData]);

  // Effacer les erreurs
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Vérifier si le formulaire est valide
  const isValid = Object.keys(errors).length === 0 && 
                  formData.first_name.trim() !== '' && 
                  formData.last_name.trim() !== '';

  // Calculer si des modifications ont été apportées
  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Navigation entre les étapes
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  // Validation des étapes
  useEffect(() => {
    const updatedSteps = steps.map(step => {
      const stepFields = step.fields;
      const stepData = Object.fromEntries(
        stepFields.map(field => [field, formData[field as keyof StaffFormData]])
      );
      const stepErrors = validateStaffData(stepData);
      
      const isValid = Object.keys(stepErrors).length === 0;
      const isComplete = stepFields.every(field => {
        const value = formData[field as keyof StaffFormData];
        return value !== undefined && value !== '' && value !== null;
      });

      return { ...step, isValid, isComplete };
    });

    setSteps(updatedSteps);
  }, [formData, steps]);

  // Calculer le progrès
  const completedSteps = steps.filter(step => step.isComplete).length;
  const progress = (completedSteps / steps.length) * 100;

  // Vérifications de navigation
  const canGoNext = currentStep < steps.length - 1;
  const canGoPrev = currentStep > 0;

  // Soumission du formulaire
  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      onError?.('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (mode === 'edit' && staffId) {
        response = await staffService.updateStaff(staffId, formData);
      } else {
        response = await staffService.createStaff(formData);
      }

      if (response.success) {
        onSuccess?.(formData);
      } else {
        onError?.(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      onError?.('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [formData, mode, staffId, onSuccess, onError, validateForm]);

  // Sauvegarde brouillon
  const saveDraft = useCallback(() => {
    const draftKey = `staff-draft-${mode}-${staffId || 'new'}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, mode, staffId]);

  // Chargement brouillon
  const loadDraft = useCallback(() => {
    const draftKey = `staff-draft-${mode}-${staffId || 'new'}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const draftData = JSON.parse(saved);
        setFormData(draftData);
      } catch (error) {
        console.error('Erreur chargement brouillon:', error);
      }
    }
  }, [mode, staffId]);

  return {
    // Données du formulaire
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    
    // Validation
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
    
    // Étapes
    currentStep,
    totalSteps: steps.length,
    steps,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,
    
    // Actions
    loading,
    submitForm,
    saveDraft,
    loadDraft,
    
    // Utilitaires
    isDirty,
    progress,
    completedSteps,
    
    // Mode
    mode,
    staffId
  };
};

export default useStaffForm;