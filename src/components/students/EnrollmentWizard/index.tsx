// src/components/students/EnrollmentWizard/index.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Camera, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  Users, 
  Save, 
  X, 
  AlertTriangle, 
  Check,
  Upload,
  Eye,
  EyeOff,
  School,
  Heart,
  Home,
  ArrowRight,
  ArrowLeft,
  Star,
  Shield,
  Globe,
  Loader2,
  Plus
} from 'lucide-react';

// Import de vos services existants - CORRIGÉ
import { 
  StudentService, 
  type CreateStudentRequest,
  useReferenceData // CORRIGÉ - import depuis studentService
} from '../../../services/studentService';

// Interface pour les props du composant
interface EnrollmentWizardProps {
  mode?: 'create' | 'edit';
  studentId?: string;
  onSuccess?: (student: any) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

// Types modifiés pour correspondre à votre API
interface StudentFormData {
  // Informations personnelles
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  
  // Scolarité - Flexibilité ajoutée
  coranic_class_id: string;
  coranic_level: string; // NOUVEAU - niveau personnalisé
  french_class_id: string;
  french_level: string; // NOUVEAU - niveau personnalisé
  french_school_name: string;
  
  // Tuteur avec structure conforme à l'API
  guardian: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    relationship: string; // MODIFIÉ - correspond à l'API
  };
  
  // Paiement inscription en francs guinéens
  payment: {
    amount: number;
    payment_date: string;
    enrollment_date: string;
    payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
    frequency: 'mensuel' | 'trimestriel' | 'annuel';
    notes: string;
  };
  
  // Photo optionnelle
  photo?: File;
  photo_preview?: string;
  
  // Notes
  notes: string;
}

const EnrollmentWizard: React.FC<EnrollmentWizardProps> = ({
  mode = 'create',
  studentId,
  onSuccess,
  onCancel,
  onError,
  redirectTo = '/students'
}) => {
  const navigate = useNavigate();
  
  // Charger les données de référence
  const { 
    classes, 
    schoolYears, 
    currentSchoolYear, 
    loading: referenceLoading, 
    error: referenceError 
  } = useReferenceData();

  // État principal - MODIFIÉ avec nouvelles propriétés
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    status: 'externe',
    is_orphan: false,
    coranic_class_id: '',
    coranic_level: '', // NOUVEAU
    french_class_id: '',
    french_level: '', // NOUVEAU
    french_school_name: '',
    guardian: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      relationship: 'pere' // MODIFIÉ
    },
    payment: {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      enrollment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      frequency: 'annuel',
      notes: ''
    },
    notes: ''
  });

  // États UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [currentSection, setCurrentSection] = useState('personal');
  const [touched, setTouched] = useState<Record<string, boolean>>({}); // NOUVEAU - pour gérer l'affichage des erreurs
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Types de parenté - SIMPLIFIÉ
  const relationshipTypes = [
    { value: 'pere', label: 'Père', icon: '👨' },
    { value: 'mere', label: 'Mère', icon: '👩' },
    { value: 'tuteur_legal', label: 'Tuteur légal', icon: '🛡️' },
    { value: 'grand_parent', label: 'Grand-parent', icon: '👴' },
    { value: 'oncle', label: 'Oncle', icon: '👨‍🦱' },
    { value: 'tante', label: 'Tante', icon: '👩‍🦱' },
    { value: 'frere', label: 'Frère', icon: '👦' },
    { value: 'soeur', label: 'Sœur', icon: '👧' },
    { value: 'autre', label: 'Autre', icon: '👤' }
  ];

  // Navigation sections
  const sections = [
    { 
      id: 'personal', 
      label: 'Identité', 
      icon: User, 
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200' 
    },
    { 
      id: 'schooling', 
      label: 'Scolarité', 
      icon: BookOpen, 
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200' 
    },
    { 
      id: 'guardian', 
      label: 'Tuteur', 
      icon: Users, 
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200' 
    },
    { 
      id: 'payment', 
      label: 'Paiement', 
      icon: CreditCard, 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200' 
    },
    { 
      id: 'finalize', 
      label: 'Finaliser', 
      icon: Camera, 
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200' 
    }
  ];

  // NOUVEAU - Charger les données existantes en mode édition
  useEffect(() => {
    if (mode === 'edit' && studentId) {
      loadExistingStudent();
    }
  }, [mode, studentId]);

  const loadExistingStudent = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      const result = await StudentService.getById(studentId);
      
      if (result.success && result.student) {
        const student = result.student;
        
        // Mapper les données existantes vers le formulaire
        setFormData({
          first_name: student.first_name,
          last_name: student.last_name,
          birth_date: student.birth_date,
          gender: student.gender,
          status: student.status,
          is_orphan: student.is_orphan,
          coranic_class_id: student.coranic_class?.id || '',
          coranic_level: '',
          french_class_id: student.french_class?.id || '',
          french_level: '',
          french_school_name: '',
          guardian: {
            first_name: student.guardian?.first_name || '',
            last_name: student.guardian?.last_name || '',
            phone: student.guardian?.phone || '',
            email: student.guardian?.email || '',
            address: student.guardian?.address || '',
            relationship: student.guardian?.relationship || 'pere'
          },
          payment: {
            amount: student.current_balance || 0,
            payment_date: new Date().toISOString().split('T')[0],
            enrollment_date: student.enrollment_date.split('T')[0],
            payment_method: 'cash',
            frequency: 'annuel',
            notes: ''
          },
          photo_preview: student.photo_url || undefined,
          notes: student.notes || ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement étudiant:', error);
      onError?.('Erreur lors du chargement des données de l\'étudiant');
    } finally {
      setLoading(false);
    }
  };

  // NOUVEAU - Marquer un champ comme touché
  const markFieldAsTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Validation des sections - MODIFIÉ pour n'afficher les erreurs que si touché
  const validateSection = (sectionId: string) => {
    const newErrors: Record<string, string> = {};

    switch (sectionId) {
      case 'personal':
        if (touched.first_name && !formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
        if (touched.last_name && !formData.last_name.trim()) newErrors.last_name = 'Nom requis';
        if (touched.birth_date && !formData.birth_date) newErrors.birth_date = 'Date de naissance requise';
        break;
        
      case 'schooling':
        // Plus de validation obligatoire - flexibilité maximale
        break;
        
      case 'guardian':
        if (touched['guardian.first_name'] && !formData.guardian.first_name.trim()) {
          newErrors['guardian.first_name'] = 'Prénom du tuteur requis';
        }
        if (touched['guardian.last_name'] && !formData.guardian.last_name.trim()) {
          newErrors['guardian.last_name'] = 'Nom du tuteur requis';
        }
        if (touched['guardian.phone'] && !formData.guardian.phone.trim()) {
          newErrors['guardian.phone'] = 'Téléphone requis';
        }
        if (touched['guardian.email'] && formData.guardian.email && !/\S+@\S+\.\S+/.test(formData.guardian.email)) {
          newErrors['guardian.email'] = 'Email invalide';
        }
        break;
        
      case 'payment':
        if (touched['payment.amount'] && (!formData.payment.amount || formData.payment.amount < 1000)) {
          newErrors['payment.amount'] = 'Montant minimum 1000 GNF requis';
        }
        if (touched['payment.enrollment_date'] && !formData.payment.enrollment_date) {
          newErrors['payment.enrollment_date'] = 'Date d\'inscription requise';
        }
        break;
    }

    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  // Validation stricte pour navigation - vérifie réellement les champs obligatoires
  const validateSectionForNavigation = (sectionId: string) => {
    const newErrors: Record<string, string> = {};

    switch (sectionId) {
      case 'personal':
        if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
        if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
        if (!formData.birth_date) newErrors.birth_date = 'Date de naissance requise';
        break;
        
      case 'guardian':
        if (!formData.guardian.first_name.trim()) newErrors['guardian.first_name'] = 'Prénom du tuteur requis';
        if (!formData.guardian.last_name.trim()) newErrors['guardian.last_name'] = 'Nom du tuteur requis';
        if (!formData.guardian.phone.trim()) newErrors['guardian.phone'] = 'Téléphone requis';
        if (formData.guardian.email && !/\S+@\S+\.\S+/.test(formData.guardian.email)) {
          newErrors['guardian.email'] = 'Email invalide';
        }
        break;
        
      case 'payment':
        if (!formData.payment.amount || formData.payment.amount < 1000) {
          newErrors['payment.amount'] = 'Montant minimum 1000 GNF requis';
        }
        if (!formData.payment.enrollment_date) {
          newErrors['payment.enrollment_date'] = 'Date d\'inscription requise';
        }
        break;
    }

    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  // Vérifier si une section est valide pour navigation
  const isSectionValidForNavigation = (sectionId: string) => {
    const { isValid } = validateSectionForNavigation(sectionId);
    return isValid;
  };

  // Vérifier si on peut accéder à une section
  const canAccessSection = (sectionId: string) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    
    if (sectionIndex <= currentIndex) return true;
    
    for (let i = 0; i < sectionIndex; i++) {
      if (!isSectionValidForNavigation(sections[i].id)) {
        return false;
      }
    }
    
    return true;
  };

  // Mise à jour des données - MODIFIÉ pour marquer comme touché
  const updateFormData = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    
    // Marquer comme touché
    markFieldAsTouched(path);
    
    // Effacer l'erreur pour ce champ
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[path];
        return newErrors;
      });
    }
  }, [errors]);

  // Validation en temps réel - MODIFIÉ pour utiliser touched
  useEffect(() => {
    const { errors: sectionErrors } = validateSection(currentSection);
    setErrors(sectionErrors);
  }, [formData, currentSection, touched]);

  // Gestion photo
  const handlePhotoUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'La photo doit faire moins de 5MB' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          photo: file,
          photo_preview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  }, []);

  // Utilitaires
  const formatGNF = (amount: number): string => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Navigation - MODIFIÉ pour utiliser la validation stricte
  const nextSection = () => {
    const { errors: sectionErrors, isValid } = validateSectionForNavigation(currentSection);
    
    if (!isValid) {
      // Marquer tous les champs de la section comme touchés
      Object.keys(sectionErrors).forEach(field => markFieldAsTouched(field));
      setErrors(sectionErrors);
      alert('Veuillez remplir tous les champs obligatoires avant de continuer.');
      return;
    }
    
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1].id);
    }
  };

  const prevSection = () => {
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1].id);
    }
  };

  const goToSection = (sectionId: string) => {
    if (canAccessSection(sectionId)) {
      setCurrentSection(sectionId);
    } else {
      alert('Veuillez compléter les étapes précédentes pour accéder à cette section.');
    }
  };

  // FONCTION CORRIGÉE - Soumission API avec gestion mode création/édition
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider toutes les sections avec validation stricte
    let hasErrors = false;
    const allErrors: Record<string, string> = {};
    
    for (const section of sections.slice(0, -1)) {
      const { errors: sectionErrors, isValid } = validateSectionForNavigation(section.id);
      if (!isValid) {
        hasErrors = true;
        Object.assign(allErrors, sectionErrors);
        // Marquer tous les champs en erreur comme touchés
        Object.keys(sectionErrors).forEach(field => markFieldAsTouched(field));
      }
    }
    
    if (hasErrors) {
      setErrors(allErrors);
      alert('Veuillez corriger toutes les erreurs avant de finaliser l\'inscription.');
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      console.log(`📝 Préparation des données pour l'API (${mode})...`, formData);
      
      // CORRIGÉ - Structure des données conforme à l'API
      const apiData: CreateStudentRequest = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date,
        gender: formData.gender,
        status: formData.status,
        is_orphan: formData.is_orphan,
        
        // Classes - utilisation flexible
        ...(formData.coranic_class_id && { coranic_class_id: formData.coranic_class_id }),
        ...(formData.french_class_id && { french_class_id: formData.french_class_id }),
        ...(currentSchoolYear?.id && { school_year_id: currentSchoolYear.id }),
        
        // CORRIGÉ - Structure tuteur conforme à l'API
        guardian: {
          first_name: formData.guardian.first_name.trim(),
          last_name: formData.guardian.last_name.trim(),
          phone: formData.guardian.phone.trim(),
          ...(formData.guardian.email && { email: formData.guardian.email.trim() }),
          ...(formData.guardian.address && { address: formData.guardian.address.trim() }),
          relationship: formData.guardian.relationship
        },
        
        ...(formData.notes && { notes: formData.notes.trim() })
      };
      
      console.log('🚀 Données envoyées à l\'API:', apiData);
      
      // Appel API selon le mode
      const result = mode === 'edit' && studentId
        ? await StudentService.update(studentId, apiData)
        : await StudentService.create(apiData);
      
      if (result.success && result.student) {
        console.log(`✅ Étudiant ${mode === 'edit' ? 'modifié' : 'créé'} avec succès:`, result.student);
        
        // Upload de la photo si présente
        if (formData.photo && result.student.id) {
          try {
            console.log('📸 Upload de la photo...');
            const photoResult = await StudentService.uploadPhoto(result.student.id, formData.photo);
            if (photoResult.success) {
              console.log('✅ Photo uploadée avec succès');
            } else {
              console.warn('⚠️ Erreur upload photo:', photoResult.error);
            }
          } catch (photoError) {
            console.warn('⚠️ Erreur upload photo:', photoError);
          }
        }
        
        const successMessage = mode === 'edit'
          ? `✏️ Modification réussie ! ${formData.first_name} ${formData.last_name} a été mis(e) à jour.`
          : `🎉 Inscription réussie ! ${formData.first_name} ${formData.last_name} a été inscrit(e) avec succès.`;
        
        // Callback de succès
        if (onSuccess) {
          onSuccess(result.student);
        } else {
          alert(successMessage);
          navigate(redirectTo);
        }
        
      } else {
        const errorMessage = result.error || 'Erreur inconnue lors de l\'opération';
        console.error('❌ Erreur API:', errorMessage, result.details);
        setApiError(errorMessage);
        
        if (onError) {
          onError(errorMessage);
        } else {
          alert(`❌ Erreur lors de l'${mode === 'edit' ? 'édition' : 'inscription'}: ${errorMessage}`);
        }
      }
      
    } catch (error: any) {
      console.error(`💥 Erreur lors de l'${mode === 'edit' ? 'édition' : 'inscription'}:`, error);
      const errorMessage = error.message || 'Erreur de connexion au serveur';
      setApiError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      } else {
        alert(`❌ Erreur lors de l'${mode === 'edit' ? 'édition' : 'inscription'}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const age = calculateAge(formData.birth_date);
  const currentSectionData = sections.find(s => s.id === currentSection);

  // Loader pendant chargement données de référence
  if (referenceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Erreur chargement données
  if (referenceError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{referenceError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onCancel ? onCancel() : navigate(redirectTo)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                {mode === 'edit' ? 'Modifier Étudiant' : 'Inscription Étudiant'}
              </h1>
              <p className="text-sm text-gray-500">Markaz Ubayd Ibn Kab</p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Étape {sections.findIndex(s => s.id === currentSection) + 1}/5</div>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage erreurs API */}
      {apiError && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{apiError}</span>
            <button onClick={() => setApiError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            
            {/* Navigation sections */}
            <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-6">
                  {sections.map((_, index) => (
                    <React.Fragment key={index}>
                      {index < sections.length - 1 && (
                        <div className="flex-1 mx-6 relative">
                          <div className="h-1 bg-gray-200 rounded-full relative overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-700 ease-out rounded-full ${
                                isSectionValidForNavigation(sections[index].id) && index < sections.findIndex(s => s.id === currentSection)
                                  ? 'w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 shadow-lg' 
                                  : 'w-0 bg-gray-300'
                              }`}
                            />
                            {isSectionValidForNavigation(sections[index].id) && index < sections.findIndex(s => s.id === currentSection) && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse rounded-full"></div>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex justify-between items-center relative z-10">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    const isActive = currentSection === section.id;
                    const isCompleted = isSectionValidForNavigation(section.id) && index < sections.findIndex(s => s.id === currentSection);
                    const canAccess = canAccessSection(section.id);
                    
                    return (
                      <div key={section.id} className="flex flex-col items-center group">
                        <button
                          type="button"
                          onClick={() => goToSection(section.id)}
                          disabled={!canAccess}
                          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                            canAccess ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'
                          } ${
                            isActive 
                              ? `bg-gradient-to-r ${section.color} text-white shadow-2xl scale-110 z-20` 
                              : isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl z-10' 
                                : canAccess
                                  ? 'bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400 shadow-lg hover:shadow-xl backdrop-blur-sm'
                                  : 'bg-gray-200 text-gray-400 opacity-50'
                          }`}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          
                          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border-2 border-white transition-all ${
                            isActive
                              ? 'bg-white text-gray-800 shadow-lg scale-110'
                              : isCompleted
                                ? 'bg-green-100 text-green-700 shadow-md'
                                : canAccess
                                  ? 'bg-gray-100 text-gray-500 shadow-sm'
                                  : 'bg-gray-200 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          
                          {isActive && (
                            <div className={`absolute -inset-2 bg-gradient-to-r ${section.color} rounded-full blur opacity-30 animate-pulse`}></div>
                          )}
                          
                          {isCompleted && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                          )}
                        </button>
                        
                        <div className="mt-3 text-center">
                          <span className={`text-sm font-medium transition-colors block ${
                            isActive 
                              ? 'text-gray-900 font-semibold' 
                              : isCompleted 
                                ? 'text-green-700 font-medium' 
                                : canAccess
                                  ? 'text-gray-600'
                                  : 'text-gray-400'
                          }`}>
                            {section.label}
                          </span>
                          
                          <span className={`text-xs transition-colors mt-1 flex items-center justify-center gap-1 ${
                            isActive 
                              ? 'text-blue-600 font-medium' 
                              : isCompleted 
                                ? 'text-green-600' 
                                : canAccess
                                  ? 'text-gray-500'
                                  : 'text-gray-400'
                          }`}>
                            {isActive && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>}
                            {isCompleted && <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>}
                            {isActive ? 'En cours' : isCompleted ? 'Terminé' : canAccess ? 'Disponible' : 'Verrouillé'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contenu sections */}
            <div className={`${currentSectionData?.bgColor} min-h-[500px]`}>
              
              {/* Section Identité */}
              {currentSection === 'personal' && (
                <div className="p-6 animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentSectionData?.color} text-white flex items-center justify-center`}>
                        <User className="w-5 h-5" />
                      </div>
                      Informations personnelles
                    </h2>
                    <p className="text-gray-600">Renseignez les informations de base de l'étudiant</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => updateFormData('first_name', e.target.value)}
                        onBlur={() => markFieldAsTouched('first_name')}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Prénom de l'étudiant"
                      />
                      {errors.first_name && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.first_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => updateFormData('last_name', e.target.value)}
                        onBlur={() => markFieldAsTouched('last_name')}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Nom de famille"
                      />
                      {errors.last_name && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.last_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date de naissance <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => updateFormData('birth_date', e.target.value)}
                        onBlur={() => markFieldAsTouched('birth_date')}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.birth_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                      {age > 0 && (
                        <p className="text-xs text-blue-600">📅 Âge: {age} ans</p>
                      )}
                      {errors.birth_date && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.birth_date}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Genre <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateFormData('gender', 'M')}
                          className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            formData.gender === 'M'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          👨 Masculin
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFormData('gender', 'F')}
                          className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            formData.gender === 'F'
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 text-gray-700 hover:border-pink-300'
                          }`}
                        >
                          👩 Féminin
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateFormData('status', 'externe')}
                          className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            formData.status === 'externe'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-700 hover:border-green-300'
                          }`}
                        >
                          🚶 Externe
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFormData('status', 'interne')}
                          className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            formData.status === 'interne'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-700 hover:border-blue-300'
                          }`}
                        >
                          🏠 Interne
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.is_orphan}
                          onChange={(e) => updateFormData('is_orphan', e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <Heart className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Orphelin</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Scolarité - Identique mais avec possibilité d'édition */}
              {currentSection === 'schooling' && (
                <div className="p-6 animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentSectionData?.color} text-white flex items-center justify-center`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      Double Scolarité
                    </h2>
                    <p className="text-gray-600">Enseignement coranique et cursus académique français (flexibilité maximale)</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Section Coranique */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🕌</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-emerald-800">Enseignement Coranique</h3>
                          <p className="text-sm text-emerald-600">Mémorisation et récitation</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-emerald-700 mb-1">
                            Classe existante (optionnel)
                          </label>
                          <select
                            value={formData.coranic_class_id}
                            onChange={(e) => {
                              updateFormData('coranic_class_id', e.target.value);
                              if (e.target.value) {
                                updateFormData('coranic_level', '');
                              }
                            }}
                            className="w-full px-3 py-2.5 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                          >
                            <option value="">Choisir une classe existante</option>
                            {classes.coranic.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} - {cls.level} {cls.current_students ? `(${cls.current_students}/${cls.capacity})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-center text-xs text-emerald-600 font-medium">— OU —</div>
                        
                        <div>
                          <label className="block text-sm font-medium text-emerald-700 mb-1">
                            Niveau personnalisé
                          </label>
                          <input
                            type="text"
                            value={formData.coranic_level}
                            onChange={(e) => {
                              updateFormData('coranic_level', e.target.value);
                              if (e.target.value) {
                                updateFormData('coranic_class_id', '');
                              }
                            }}
                            placeholder="Ex: Niveau 1, Tahfiz, Juz 3, Débutant..."
                            className="w-full px-3 py-2.5 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Française */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-blue-800">École Française</h3>
                          <p className="text-sm text-blue-600">Cursus académique</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Classe existante (optionnel)
                          </label>
                          <select
                            value={formData.french_class_id}
                            onChange={(e) => {
                              updateFormData('french_class_id', e.target.value);
                              if (e.target.value) {
                                updateFormData('french_level', '');
                              }
                            }}
                            className="w-full px-3 py-2.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value="">Choisir une classe existante</option>
                            {classes.french.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} - {cls.level} {cls.current_students ? `(${cls.current_students}/${cls.capacity})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-center text-xs text-blue-600 font-medium">— OU —</div>
                        
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Niveau personnalisé
                          </label>
                          <input
                            type="text"
                            value={formData.french_level}
                            onChange={(e) => {
                              updateFormData('french_level', e.target.value);
                              if (e.target.value) {
                                updateFormData('french_class_id', '');
                              }
                            }}
                            placeholder="Ex: CP, 6ème, 2nde, CM1..."
                            className="w-full px-3 py-2.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Nom de l'école (optionnel)
                          </label>
                          <input
                            type="text"
                            value={formData.french_school_name}
                            onChange={(e) => updateFormData('french_school_name', e.target.value)}
                            placeholder="Nom de l'école française"
                            className="w-full px-3 py-2.5 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Résumé des sélections */}
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">📋 Résumé des sélections</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Coranique:</span>
                        <span className="ml-2 font-medium text-emerald-700">
                          {formData.coranic_class_id 
                            ? classes.coranic.find(c => c.id === formData.coranic_class_id)?.name || 'Classe sélectionnée'
                            : formData.coranic_level
                              ? formData.coranic_level
                              : 'Non renseigné'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Français:</span>
                        <span className="ml-2 font-medium text-blue-700">
                          {formData.french_class_id 
                            ? classes.french.find(c => c.id === formData.french_class_id)?.name || 'Classe sélectionnée'
                            : formData.french_level
                              ? formData.french_level
                              : 'Non renseigné'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Tuteur - Identique */}
              {currentSection === 'guardian' && (
                <div className="p-6 animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentSectionData?.color} text-white flex items-center justify-center`}>
                        <Users className="w-5 h-5" />
                      </div>
                      Tuteur Principal
                    </h2>
                    <p className="text-gray-600">Contact principal et responsable légal</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Prénom du tuteur <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.guardian.first_name}
                        onChange={(e) => updateFormData('guardian.first_name', e.target.value)}
                        onBlur={() => markFieldAsTouched('guardian.first_name')}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors['guardian.first_name'] ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Prénom"
                      />
                      {errors['guardian.first_name'] && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.first_name']}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nom du tuteur <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.guardian.last_name}
                        onChange={(e) => updateFormData('guardian.last_name', e.target.value)}
                        onBlur={() => markFieldAsTouched('guardian.last_name')}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          errors['guardian.last_name'] ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Nom"
                      />
                      {errors['guardian.last_name'] && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.last_name']}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Parenté <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.guardian.relationship}
                        onChange={(e) => updateFormData('guardian.relationship', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {relationshipTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.guardian.phone}
                          onChange={(e) => updateFormData('guardian.phone', e.target.value)}
                          onBlur={() => markFieldAsTouched('guardian.phone')}
                          className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                            errors['guardian.phone'] ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          placeholder="623 45 67 89"
                        />
                      </div>
                      {errors['guardian.phone'] && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.phone']}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email (optionnel)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={formData.guardian.email}
                          onChange={(e) => updateFormData('guardian.email', e.target.value)}
                          onBlur={() => markFieldAsTouched('guardian.email')}
                          className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            errors['guardian.email'] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                          placeholder="email@exemple.com"
                        />
                      </div>
                      {errors['guardian.email'] && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.email']}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Adresse (optionnel)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          value={formData.guardian.address}
                          onChange={(e) => updateFormData('guardian.address', e.target.value)}
                          rows={2}
                          className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Adresse complète"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Paiement */}
              {currentSection === 'payment' && (
                <div className="p-6 animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentSectionData?.color} text-white flex items-center justify-center`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      Paiement d'Inscription
                    </h2>
                    <p className="text-gray-600">Frais en Francs Guinéens (GNF)</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Montant (GNF) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.payment.amount || ''}
                          onChange={(e) => updateFormData('payment.amount', parseInt(e.target.value) || 0)}
                          onBlur={() => markFieldAsTouched('payment.amount')}
                          className={`w-full px-4 py-3 text-right border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none ${
                            errors['payment.amount'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          style={{
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                            margin: 0
                          }}
                          placeholder="50000"
                          min="1000"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                          GNF
                        </span>
                      </div>
                      {formData.payment.amount > 0 && (
                        <p className="text-xs text-green-600">
                          💰 {formatGNF(formData.payment.amount)}
                        </p>
                      )}
                      {errors['payment.amount'] && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['payment.amount']}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Fréquence</label>
                      <select
                        value={formData.payment.frequency}
                        onChange={(e) => updateFormData('payment.frequency', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="annuel">📅 Annuel</option>
                        <option value="trimestriel">📅 Trimestriel</option>
                        <option value="mensuel">📅 Mensuel</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Méthode</label>
                      <select
                        value={formData.payment.payment_method}
                        onChange={(e) => updateFormData('payment.payment_method', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="cash">💵 Espèces</option>
                        <option value="mobile_money">📱 Mobile Money</option>
                        <option value="bank_transfer">🏦 Virement</option>
                        <option value="check">📄 Chèque</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date inscription <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.payment.enrollment_date}
                        onChange={(e) => updateFormData('payment.enrollment_date', e.target.value)}
                        onBlur={() => markFieldAsTouched('payment.enrollment_date')}
                        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors['payment.enrollment_date'] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      {errors['payment.enrollment_date'] && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['payment.enrollment_date']}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Notes (optionnel)</label>
                      <textarea
                        value={formData.payment.notes}
                        onChange={(e) => updateFormData('payment.notes', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Commentaires sur le paiement..."
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">💰 Récapitulatif</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-orange-600">Montant:</span>
                        <span className="font-medium ml-1">{formatGNF(formData.payment.amount)}</span>
                      </div>
                      <div>
                        <span className="text-orange-600">Fréquence:</span>
                        <span className="font-medium ml-1">{formData.payment.frequency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Finalisation */}
              {currentSection === 'finalize' && (
                <div className="p-6 animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${currentSectionData?.color} text-white flex items-center justify-center`}>
                        <Camera className="w-5 h-5" />
                      </div>
                      Photo & Notes
                    </h2>
                    <p className="text-gray-600">Finalisation de {mode === 'edit' ? 'la modification' : "l\'inscription"}</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Photo de l'élève (optionnelle)
                    </label>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 transition-all hover:border-gray-400">
                      {formData.photo_preview ? (
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <img
                              src={formData.photo_preview}
                              alt="Aperçu"
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                photo: undefined, 
                                photo_preview: undefined 
                              }))}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="mt-3 text-sm font-medium text-gray-900">Photo sélectionnée ✓</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all text-sm"
                          >
                            {mode === 'edit' && formData.photo_preview ? 'Changer la photo' : 'Choisir une photo'}
                          </button>
                          <p className="mt-2 text-xs text-gray-500">
                            JPG, PNG • Max 5MB
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes et observations (optionnel)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Allergies, besoins particuliers..."
                    />
                  </div>

                  {/* Résumé final */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Résumé de {mode === 'edit' ? 'la modification' : "l\'inscription"}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Étudiant:</span>
                          <span className="font-medium">{formData.first_name} {formData.last_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Âge:</span>
                          <span>{age ? `${age} ans` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Statut:</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            formData.status === 'interne' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {formData.status === 'interne' ? '🏠 Interne' : '🚶 Externe'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Classe coranique:</span>
                          <span className="font-medium text-emerald-700">
                            {formData.coranic_class_id 
                              ? classes.coranic.find(c => c.id === formData.coranic_class_id)?.name || 'Sélectionnée'
                              : formData.coranic_level
                                ? formData.coranic_level
                                : 'Non renseignée'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tuteur:</span>
                          <span className="font-medium">
                            {formData.guardian.first_name} {formData.guardian.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Téléphone:</span>
                          <span>{formData.guardian.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frais:</span>
                          <span className="font-medium text-orange-600">
                            {formatGNF(formData.payment.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Classe française:</span>
                          <span className="font-medium text-blue-700">
                            {formData.french_class_id 
                              ? classes.french.find(c => c.id === formData.french_class_id)?.name || 'Sélectionnée'
                              : formData.french_level
                                ? formData.french_level
                                : 'Non renseignée'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bouton final d'enregistrement */}
                    <div className="mt-6 text-center">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{mode === 'edit' ? 'Modification...' : 'Enregistrement...'}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>{mode === 'edit' ? 'Enregistrer les modifications' : 'Enregistrer l\'inscription'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevSection}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  disabled={sections.findIndex(s => s.id === currentSection) === 0}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:block">Précédent</span>
                </button>

                <div className="text-center">
                  <div className="text-xs text-gray-500">
                    Étape {sections.findIndex(s => s.id === currentSection) + 1} sur {sections.length}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sections.findIndex(s => s.id === currentSection) < sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextSection}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                    >
                      <span>Suivant</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentWizard;