// src/hooks/useStudentForm.tsx
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface Guardian {
  name: string;
  relationship: string;
  phone: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface StudentFormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  status: string;
  is_orphan: boolean;
  is_needy: boolean;
  coranic_class_id: string;
  french_class_id?: string;
  school_year_id: string;
  is_priority?: boolean;
  financial_aid?: boolean;
  schooling_notes?: string;
  guardian: Guardian;
  photo?: File;
  notes?: string;
}

interface UseStudentFormProps {
  mode: 'create' | 'edit';
  studentId?: string;
  onSuccess?: (student: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export interface UseStudentFormReturn {
  formData: StudentFormData;
  updateFormData: (field: string, value: any) => void;
  currentSection: string;
  goToNextSection: () => void;
  goToPreviousSection: () => void;
  isFirstSection: boolean;
  isLastSection: boolean;
  sections: Array<{
    id: string;
    title: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  }>;
  errors: Record<string, string>;
  loading: boolean;
  canSubmit: boolean;
  calculatedAge: number;
  submitForm: () => Promise<void>;
  photoUpload: {
    preview?: string;
    uploading: boolean;
    error?: string;
  };
  getFormSummary: () => any;
}

export const useStudentForm = ({
  mode,
  studentId,
  onSuccess,
  onError,
  redirectTo
}: UseStudentFormProps): UseStudentFormReturn => {
  const navigate = useNavigate();

  // État du formulaire
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    status: '',
    is_orphan: false,
    is_needy: false,
    coranic_class_id: '',
    french_class_id: '',
    school_year_id: '',
    is_priority: false,
    financial_aid: false,
    schooling_notes: '',
    guardian: {
      name: '',
      relationship: '',
      phone: '',
      phone_secondary: '',
      email: '',
      address: '',
      city: '',
      country: 'Mali'
    },
    notes: ''
  });

  // État de l'interface
  const [currentSection, setCurrentSection] = useState('personal');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [photoUpload, setPhotoUpload] = useState({
    preview: undefined,
    uploading: false,
    error: undefined,
    handleDrop: (files: FileList | File[]) => {
      const file = files[0];
      if (file) {
        // Validation du fichier
        if (!file.type.startsWith('image/')) {
          setPhotoUpload(prev => ({ ...prev, error: 'Veuillez sélectionner une image valide' }));
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB max
          setPhotoUpload(prev => ({ ...prev, error: 'La taille de l\'image ne doit pas dépasser 5MB' }));
          return;
        }

        // Créer un aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoUpload(prev => ({
            ...prev,
            preview: e.target?.result as string,
            error: undefined
          }));
          updateFormData('photo', file);
        };
        reader.readAsDataURL(file);
      }
    },
    handleRemove: () => {
      setPhotoUpload(prev => ({
        ...prev,
        preview: undefined,
        error: undefined
      }));
      updateFormData('photo', undefined);
    }
  });

  // Sections du formulaire
  const sections = [
    {
      id: 'personal',
      title: 'Informations personnelles',
      label: 'Étudiant',
      icon: 'user',
      color: 'blue',
      description: 'Informations de base'
    },
    {
      id: 'schooling',
      title: 'Classes et cursus',
      label: 'Classes',
      icon: 'graduation-cap',
      color: 'emerald',
      description: 'Inscription aux classes'
    },
    {
      id: 'guardian',
      title: 'Responsable légal',
      label: 'Responsable',
      icon: 'user-check',
      color: 'indigo',
      description: 'Contact du responsable'
    },
    {
      id: 'photo',
      title: 'Photo et compléments',
      label: 'Compléments',
      icon: 'camera',
      color: 'purple',
      description: 'Photo et notes'
    },
    {
      id: 'summary',
      title: 'Résumé et validation',
      label: 'Validation',
      icon: 'check-circle',
      color: 'green',
      description: 'Vérification finale'
    }
  ];

  // Fonction pour mettre à jour les données du formulaire
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => {
      // Gestion des champs imbriqués (ex: guardian.name)
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof StudentFormData],
            [child]: value
          }
        };
      }
      
      return {
        ...prev,
        [field]: value
      };
    });

    // Supprimer l'erreur du champ si elle existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Navigation entre sections
  const currentSectionIndex = sections.findIndex(s => s.id === currentSection);
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;

  const goToNextSection = useCallback(() => {
    if (!isLastSection) {
      const nextSection = sections[currentSectionIndex + 1];
      setCurrentSection(nextSection.id);
    }
  }, [currentSectionIndex, isLastSection, sections]);

  const goToPreviousSection = useCallback(() => {
    if (!isFirstSection) {
      const prevSection = sections[currentSectionIndex - 1];
      setCurrentSection(prevSection.id);
    }
  }, [currentSectionIndex, isFirstSection, sections]);

  // Calcul de l'âge
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return 0;
    
    const today = new Date();
    const birth = new Date(formData.birth_date);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }, [formData.birth_date]);

  // Validation du formulaire
  const canSubmit = useMemo(() => {
    const requiredFields = [
      'first_name',
      'last_name', 
      'birth_date',
      'gender',
      'status',
      'coranic_class_id',
      'school_year_id'
    ];

    const requiredGuardianFields = [
      'guardian.name',
      'guardian.relationship',
      'guardian.phone'
    ];

    // Vérifier les champs requis
    for (const field of requiredFields) {
      if (!formData[field as keyof StudentFormData]) {
        return false;
      }
    }

    // Vérifier les champs du responsable
    for (const field of requiredGuardianFields) {
      const [parent, child] = field.split('.');
      const parentData = formData[parent as keyof StudentFormData] as any;
      if (!parentData || !parentData[child]) {
        return false;
      }
    }

    return true;
  }, [formData]);

  // Soumission du formulaire
  const submitForm = useCallback(async () => {
    setLoading(true);
    
    try {
      // Ici vous ajouterez l'appel API pour sauvegarder
      console.log('📝 Soumission du formulaire:', formData);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSuccess) {
        onSuccess(formData);
      }
      
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/students');
      }
      
    } catch (error: any) {
      console.error('💥 Erreur soumission:', error);
      
      if (onError) {
        onError(error.message || 'Erreur lors de la soumission');
      }
      
      setErrors({ submit: error.message || 'Erreur lors de la soumission' });
    } finally {
      setLoading(false);
    }
  }, [formData, navigate, onError, onSuccess, redirectTo]);

  // Résumé du formulaire
  const getFormSummary = useCallback(() => {
    return {
      student: {
        name: `${formData.first_name} ${formData.last_name}`,
        age: calculatedAge,
        gender: formData.gender,
        status: formData.status
      },
      guardian: formData.guardian,
      classes: {
        coranic: formData.coranic_class_id,
        french: formData.french_class_id
      },
      schoolYear: formData.school_year_id
    };
  }, [formData, calculatedAge]);

  return {
    formData,
    updateFormData,
    currentSection,
    goToNextSection,
    goToPreviousSection,
    isFirstSection,
    isLastSection,
    sections,
    errors,
    loading,
    canSubmit,
    calculatedAge,
    submitForm,
    photoUpload,
    getFormSummary
  };
};