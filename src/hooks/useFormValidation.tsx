// src/hooks/useFormValidation.ts
import { useState, useCallback } from 'react';
import { STUDENT_FORM_CONFIG } from '@/config/studentFormConfig';

// Interface pour les données du formulaire (reprise du types.ts)
export interface StudentFormData {
  // Informations personnelles
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F' | '';
  status: 'interne' | 'externe' | '';
  is_orphan: boolean;
  is_needy: boolean;
  
  // Scolarité
  coranic_class_id: string;
  french_class_id: string;
  school_year_id: string;
  
  // Tuteur
  guardian: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    relationship: string;
  };
  
  // Photo et notes
  photo?: File | null;
  photo_preview?: string;
  notes: string;
}

export interface FormErrors {
  [key: string]: string | null;
}

export const useFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  // Valider un champ individuel
  const validateField = useCallback((field: string, value: any): string | null => {
    const validation = STUDENT_FORM_CONFIG.validation;

    // Champs requis
    if (validation.required[field] && (!value || (typeof value === 'string' && !value.trim()))) {
      return validation.required[field];
    }

    // Validation par patterns
    if (value && typeof value === 'string') {
      // Téléphone
      if (field.includes('phone') && validation.patterns.phone.pattern) {
        if (!validation.patterns.phone.pattern.test(value)) {
          return validation.patterns.phone.message;
        }
      }

      // Email
      if (field.includes('email') && value.trim() && validation.patterns.email.pattern) {
        if (!validation.patterns.email.pattern.test(value)) {
          return validation.patterns.email.message;
        }
      }
    }

    return null;
  }, []);

  // Valider l'âge
  const validateAge = useCallback((birthDate: string): string | null => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    const validation = STUDENT_FORM_CONFIG.validation;
    if (age < validation.age.min || age > validation.age.max) {
      return validation.age.message;
    }

    return null;
  }, []);

  // Valider une section complète
  const validateSection = useCallback((sectionId: string, formData: StudentFormData): FormErrors => {
    const sectionErrors: FormErrors = {};

    switch (sectionId) {
      case 'personal':
        // Champs obligatoires
        const personalRequiredFields = ['first_name', 'last_name', 'birth_date', 'gender'];
        personalRequiredFields.forEach(field => {
          const error = validateField(field, formData[field as keyof StudentFormData]);
          if (error) sectionErrors[field] = error;
        });

        // Validation de l'âge
        if (formData.birth_date) {
          const ageError = validateAge(formData.birth_date);
          if (ageError) sectionErrors.birth_date = ageError;
        }
        break;

      case 'guardian':
        // Champs obligatoires du tuteur
        const guardianRequiredFields = ['guardian.first_name', 'guardian.last_name', 'guardian.phone', 'guardian.relationship'];
        guardianRequiredFields.forEach(field => {
          const fieldValue = field === 'guardian.phone' ? formData.guardian.phone :
                            field === 'guardian.first_name' ? formData.guardian.first_name :
                            field === 'guardian.last_name' ? formData.guardian.last_name :
                            field === 'guardian.relationship' ? formData.guardian.relationship : '';
          
          const error = validateField(field, fieldValue);
          if (error) sectionErrors[field] = error;
        });

        // Email optionnel mais doit être valide si renseigné
        if (formData.guardian.email) {
          const emailError = validateField('guardian.email', formData.guardian.email);
          if (emailError) sectionErrors['guardian.email'] = emailError;
        }
        break;

      case 'schooling':
        // Cette section est entièrement optionnelle
        // Pas de validation spécifique nécessaire
        break;

      case 'photo':
        // Section optionnelle
        // Validation de la photo si présente sera gérée par usePhotoUpload
        break;

      case 'summary':
        // Validation finale - on valide tout le formulaire
        return validateForm(formData);
    }

    return sectionErrors;
  }, [validateField, validateAge]);

  // Valider tout le formulaire
  const validateForm = useCallback((formData: StudentFormData): FormErrors => {
    const allErrors: FormErrors = {};

    // Valider toutes les sections
    const sections = ['personal', 'guardian'];
    sections.forEach(sectionId => {
      const sectionErrors = validateSection(sectionId, formData);
      Object.assign(allErrors, sectionErrors);
    });

    return allErrors;
  }, [validateSection]);

  // Définir une erreur pour un champ spécifique
  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  // Effacer toutes les erreurs
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Effacer l'erreur d'un champ spécifique
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Obtenir les erreurs d'une section
  const getSectionErrors = useCallback((sectionId: string): FormErrors => {
    const sectionErrors: FormErrors = {};
    
    const sectionFields = {
      personal: ['first_name', 'last_name', 'birth_date', 'gender'],
      guardian: ['guardian.first_name', 'guardian.last_name', 'guardian.phone', 'guardian.email', 'guardian.relationship'],
      schooling: ['coranic_class_id', 'french_class_id', 'school_year_id'],
      photo: ['photo', 'notes'],
      summary: Object.keys(errors)
    };

    const fields = sectionFields[sectionId as keyof typeof sectionFields] || [];
    
    fields.forEach(field => {
      if (errors[field]) {
        sectionErrors[field] = errors[field];
      }
    });

    return sectionErrors;
  }, [errors]);

  // Vérifier si une section a des erreurs
  const hasSectionErrors = useCallback((sectionId: string): boolean => {
    const sectionErrors = getSectionErrors(sectionId);
    return Object.keys(sectionErrors).length > 0;
  }, [getSectionErrors]);

  // Compter le nombre total d'erreurs
  const getErrorCount = useCallback((): number => {
    return Object.values(errors).filter(error => error !== null).length;
  }, [errors]);

  return {
    // État
    errors,
    
    // Actions
    setErrors,
    setFieldError,
    clearErrors,
    clearFieldError,
    
    // Validation
    validateField,
    validateAge,
    validateSection,
    validateForm,
    
    // Utilitaires
    getSectionErrors,
    hasSectionErrors,
    getErrorCount
  };
};

export default useFormValidation;