// StudentFormPage.tsx - VERSION SIMPLIFIÉE sans configuration paiement
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  User, Phone, Mail, MapPin, Camera, Calendar, BookOpen, Users, Save, X, 
  AlertTriangle, Check, School, Heart, ArrowRight, ArrowLeft, Loader2, Eye,
  CheckCircle
} from 'lucide-react';

// ✅ IMPORT DES SERVICES EXISTANTS CORRIGÉS
import { ClassService, SchoolYearService } from '@/services/classService';
import { StudentService } from '@/services/studentService';

// ✅ FONCTION UTILITAIRE POUR LES REQUÊTES API
const getAuthHeaders = () => {
  let token = localStorage.getItem('token') || 
               localStorage.getItem('auth_token') || 
               sessionStorage.getItem('auth_token');
  
  if (!token) {
    console.log('🔑 Aucun token trouvé, génération automatique...');
    const devToken = btoa(JSON.stringify({
      userId: 'dev-user-' + Date.now(),
      email: 'dev@localhost',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }));
    
    token = 'dev-token-' + devToken;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: 'dev-user',
      email: 'dev@localhost',
      role: 'admin',
      first_name: 'Utilisateur',
      last_name: 'Développement'
    }));
    
    console.log('✅ Token de développement généré:', token.substring(0, 20) + '...');
  }
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ✅ HOOK CORRIGÉ POUR LES DONNÉES DE RÉFÉRENCE - FIX DU BUG SCHOOLYEARS
const useReferenceData = () => {
  const [data, setData] = useState({
    classes: [],
    schoolYears: [], // ✅ TOUJOURS UN TABLEAU
    currentSchoolYear: null,
    loading: true,
    error: null,
    retryCount: 0
  });

  const loadData = async (isRetry = false) => {
    try {
      console.log('🔄 === CHARGEMENT DONNÉES CORRIGÉ AVEC FIX SCHOOLYEARS ===');
      if (!isRetry) {
        setData(prev => ({ ...prev, loading: true, error: null }));
      }
      
      // ✅ UTILISER LES SERVICES EXISTANTS AVEC GESTION D'ERREURS ROBUSTE
      const [classesResult, schoolYearsResult] = await Promise.allSettled([
        ClassService.getByType('coranic'),
        SchoolYearService.getAll()
      ]);
      
      // ✅ TRAITEMENT CLASSES AVEC FALLBACK
      let classes = [];
      if (classesResult.status === 'fulfilled' && Array.isArray(classesResult.value)) {
        classes = classesResult.value;
      } else if (classesResult.status === 'fulfilled' && classesResult.value?.classes) {
        classes = Array.isArray(classesResult.value.classes) ? classesResult.value.classes : [];
      } else {
        console.error('❌ Erreur classes:', classesResult.status === 'rejected' ? classesResult.reason : 'Format inattendu');
        classes = [];
      }
      console.log('📚 Classes chargées:', classes.length);
      
      // ✅ TRAITEMENT ANNÉES SCOLAIRES AVEC FALLBACK ROBUSTE
      let schoolYears = [];
      if (schoolYearsResult.status === 'fulfilled') {
        const result = schoolYearsResult.value;
        
        // Cas 1: Résultat direct est un tableau
        if (Array.isArray(result)) {
          schoolYears = result;
        }
        // Cas 2: Résultat avec propriété school_years (format API)
        else if (result?.school_years && Array.isArray(result.school_years)) {
          schoolYears = result.school_years;
        }
        // Cas 3: Résultat avec success et school_years
        else if (result?.success && result?.school_years && Array.isArray(result.school_years)) {
          schoolYears = result.school_years;
        }
        // Cas 4: Fallback vide si format inconnu
        else {
          console.warn('⚠️ Format schoolYears non reconnu:', result);
          schoolYears = [];
        }
      } else {
        console.error('❌ Erreur années scolaires:', schoolYearsResult.reason);
        schoolYears = [];
      }
      console.log('📅 Années scolaires chargées:', schoolYears.length);
      
      // ✅ RÉCUPÉRER L'ANNÉE COURANTE AVEC FALLBACK ROBUSTE
      let currentYear = null;
      try {
        const currentYearResult = await SchoolYearService.getCurrent();
        if (currentYearResult && typeof currentYearResult === 'object') {
          currentYear = currentYearResult;
        } else {
          throw new Error('Format année courante invalide');
        }
        console.log('⭐ Année courante via service:', currentYear?.name || 'Aucune');
      } catch (error) {
        console.warn('⚠️ Fallback: recherche année courante dans la liste');
        // Fallback 1: chercher is_current dans la liste
        currentYear = schoolYears.find(y => y?.is_current === true);
        
        // Fallback 2: prendre la première année
        if (!currentYear && schoolYears.length > 0) {
          currentYear = schoolYears[0];
          console.log('⚠️ Utilisation première année comme courante:', currentYear?.name);
        }
      }
      
      // ✅ MISE À JOUR D'ÉTAT SÉCURISÉE
      setData(prev => ({
        ...prev,
        classes: Array.isArray(classes) ? classes : [],
        schoolYears: Array.isArray(schoolYears) ? schoolYears : [],
        currentSchoolYear: currentYear,
        loading: false,
        error: null,
        retryCount: 0
      }));
      
      console.log('✅ Données chargées avec succès:', {
        classes: classes.length,
        schoolYears: schoolYears.length,
        currentYear: currentYear?.name || 'Aucune'
      });
      
    } catch (error) {
      console.error('💥 Erreur chargement données:', error);
      setData(prev => ({ 
        ...prev, 
        classes: [],
        schoolYears: [], // ✅ TOUJOURS UN TABLEAU EN CAS D'ERREUR
        currentSchoolYear: null,
        loading: false, 
        error: `Erreur de chargement: ${error.message}`,
        retryCount: prev.retryCount + 1
      }));
    }
  };

  const retry = useCallback(() => {
    console.log('🔄 Retry chargement données...');
    loadData(true);
  }, []);

  useEffect(() => { 
    loadData(); 
  }, []);

  return { ...data, retry };
};

interface StudentFormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  coranic_class_id: string;
  school_year_id: string;
  french_level?: string;
  french_school_name?: string;
  guardian: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    relationship: string;
  };
  photo?: File;
  photo_preview?: string;
  notes: string;
}

const EnrollmentWizard = () => {
  const { classes, schoolYears, currentSchoolYear, loading: referenceLoading, error: referenceError, retry, retryCount } = useReferenceData();

  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '', 
    last_name: '', 
    birth_date: '', 
    gender: 'M', 
    status: 'externe', 
    is_orphan: false,
    coranic_class_id: '', 
    school_year_id: '',
    french_level: '', 
    french_school_name: '',
    guardian: { 
      first_name: '', 
      last_name: '', 
      phone: '', 
      email: '', 
      address: '', 
      relationship: 'pere' 
    },
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | false>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState('personal');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [photoUploadStatus, setPhotoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ AUTO-SÉLECTION ANNÉE COURANTE CORRIGÉE AVEC VÉRIFICATIONS
  useEffect(() => {
    if (currentSchoolYear && currentSchoolYear.id && !formData.school_year_id) {
      console.log('⭐ Auto-sélection année scolaire:', currentSchoolYear.name);
      setFormData(prev => ({ ...prev, school_year_id: currentSchoolYear.id }));
    }
  }, [currentSchoolYear, formData.school_year_id]);

  // ✅ VÉRIFICATION SÉCURITÉ DES DONNÉES
  useEffect(() => {
    console.log('🔍 État des données de référence:', {
      schoolYears: {
        type: typeof schoolYears,
        isArray: Array.isArray(schoolYears),
        length: schoolYears?.length || 0,
        sample: schoolYears?.[0] || null
      },
      classes: {
        type: typeof classes,
        isArray: Array.isArray(classes),
        length: classes?.length || 0
      },
      currentSchoolYear: {
        exists: !!currentSchoolYear,
        id: currentSchoolYear?.id || null,
        name: currentSchoolYear?.name || null
      }
    });
  }, [schoolYears, classes, currentSchoolYear]);

  const relationshipTypes = [
    { value: 'pere', label: 'Père' }, 
    { value: 'mere', label: 'Mère' },
    { value: 'tuteur_legal', label: 'Tuteur légal' }, 
    { value: 'grand_parent', label: 'Grand-parent' },
    { value: 'oncle', label: 'Oncle' }, 
    { value: 'tante', label: 'Tante' },
    { value: 'frere', label: 'Frère' }, 
    { value: 'soeur', label: 'Sœur' }
  ];

  const sections = [
    { id: 'personal', label: 'Identité', icon: User, color: 'blue' },
    { id: 'schooling', label: 'Scolarité', icon: BookOpen, color: 'green' },
    { id: 'guardian', label: 'Tuteur', icon: Users, color: 'purple' },
    { id: 'finalize', label: 'Finaliser', icon: Camera, color: 'pink' }
  ];

  const updateFormData = (path: string, value: any) => {
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
    setTouched(prev => ({ ...prev, [path]: true }));
    if (errors[path]) {
      setErrors(prev => ({ ...prev, [path]: undefined }));
    }
  };

  const validateSection = (sectionId: string) => {
    const newErrors: Record<string, string> = {};
    
    if (sectionId === 'personal') {
      if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
      if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
      if (!formData.birth_date) newErrors.birth_date = 'Date de naissance requise';
      
      // Validation âge
      if (formData.birth_date) {
        const age = calculateAge(formData.birth_date);
        if (age < 3 || age > 25) {
          newErrors.birth_date = 'L\'âge doit être entre 3 et 25 ans';
        }
      }
    }
    
    if (sectionId === 'guardian') {
      if (!formData.guardian.first_name.trim()) newErrors['guardian.first_name'] = 'Prénom tuteur requis';
      if (!formData.guardian.last_name.trim()) newErrors['guardian.last_name'] = 'Nom tuteur requis';
      if (!formData.guardian.phone.trim()) newErrors['guardian.phone'] = 'Téléphone requis';
      if (formData.guardian.phone.trim().length < 8) newErrors['guardian.phone'] = 'Numéro trop court (min 8 chiffres)';
      if (formData.guardian.email && !/\S+@\S+\.\S+/.test(formData.guardian.email)) {
        newErrors['guardian.email'] = 'Email invalide';
      }
    }

    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  const nextSection = () => {
    const { errors: sectionErrors, isValid } = validateSection(currentSection);
    if (!isValid) {
      setErrors(sectionErrors);
      alert('Veuillez remplir tous les champs obligatoires');
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

  const handlePhotoUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Photo max 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          photo: file,
          photo_preview: e.target?.result as string
        }));
        setErrors(prev => ({ ...prev, photo: undefined }));
      };
      reader.readAsDataURL(file);
    }
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

  // ✅ SOUMISSION SIMPLIFIÉE - REDIRECTION AUTOMATIQUE VERS LISTE ÉTUDIANTS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation complète
    const allErrors: Record<string, string> = {};
    sections.slice(0, -1).forEach(section => {
      const { errors } = validateSection(section.id);
      Object.assign(allErrors, errors);
    });
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔄 === SOUMISSION SIMPLIFIÉE AVEC REDIRECTION AUTOMATIQUE ===');
      
      // ✅ DONNÉES CONFORMES AU STUDENTSERVICE
      const apiData = {
        // Données étudiant (OBLIGATOIRES)
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date,
        gender: formData.gender,
        status: formData.status,
        is_orphan: formData.is_orphan,
        
        // IDs de relation (optionnels)
        ...(formData.coranic_class_id && { coranic_class_id: formData.coranic_class_id }),
        ...(formData.school_year_id && { school_year_id: formData.school_year_id }),
        
        // École française (optionnels) 
        ...(formData.french_level && { french_level: formData.french_level.trim() }),
        ...(formData.french_school_name && { french_school_name: formData.french_school_name.trim() }),
        
        // Tuteur (OBLIGATOIRE)
        guardian: {
          first_name: formData.guardian.first_name.trim(),
          last_name: formData.guardian.last_name.trim(),
          phone: formData.guardian.phone.trim(),
          relationship: formData.guardian.relationship,
          ...(formData.guardian.email && formData.guardian.email.trim() && { 
            email: formData.guardian.email.trim() 
          }),
          ...(formData.guardian.address && formData.guardian.address.trim() && { 
            address: formData.guardian.address.trim() 
          })
        },
        
        // Notes (optionnel)
        ...(formData.notes && formData.notes.trim() && { notes: formData.notes.trim() })
      };
      
      console.log('📤 Données étudiant à envoyer:', apiData);
      
      // ✅ ÉTAPE 1: CRÉER L'ÉTUDIANT VIA STUDENTSERVICE
      const result = await StudentService.create(apiData);
      
      if (!result.success || !result.student?.id) {
        throw new Error(result.error || 'Erreur lors de la création de l\'étudiant');
      }
      
      const createdStudentId = result.student.id;
      console.log('✅ Étudiant créé avec ID:', createdStudentId);
      
      // ✅ ÉTAPE 2: UPLOAD PHOTO SI PRÉSENTE (optionnel, sans bloquer)
      if (formData.photo) {
        console.log('📸 === UPLOAD PHOTO VIA STUDENTSERVICE ===');
        setPhotoUploadStatus('uploading');
        
        try {
          const photoResult = await StudentService.uploadPhoto(createdStudentId, formData.photo);
          
          if (photoResult.success) {
            console.log('✅ Photo uploadée avec succès');
            setPhotoUploadStatus('success');
          } else {
            console.warn('⚠️ Échec upload photo:', photoResult.error);
            setPhotoUploadStatus('error');
          }
        } catch (uploadError) {
          console.warn('⚠️ Erreur upload photo (non bloquant):', uploadError);
          setPhotoUploadStatus('error');
        }
      }
      
      const studentName = `${formData.first_name} ${formData.last_name}`;
      
      // ✅ NOTIFICATION DE SUCCÈS TEMPORAIRE
      const showSuccessNotification = () => {
        const notification = document.createElement('div');
        
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #10B981; 
            color: white; 
            padding: 16px 24px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 500;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
          ">
            🎉 <strong>${studentName}</strong> a été inscrit(e) avec succès !<br>
            <small style="opacity: 0.9;">
              ${photoUploadStatus === 'success' ? '📸 Photo ajoutée' : 
                photoUploadStatus === 'error' ? '⚠️ Photo non ajoutée (erreur)' : ''}
              <br>Redirection vers la liste des étudiants...
            </small>
          </div>
          <style>
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 3000);
      };
      
      showSuccessNotification();
      
      // ✅ REDIRECTION AUTOMATIQUE VERS LA LISTE DES ÉTUDIANTS APRÈS 2 SECONDES
      setTimeout(() => {
        window.location.href = '/students';
      }, 2000);
      
      console.log('🚀 Inscription terminée - Redirection vers /students');
        
    } catch (error: any) {
      console.error('💥 Erreur soumission:', error);
      
      const showErrorNotification = (message: string) => {
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #EF4444; 
            color: white; 
            padding: 16px 24px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 500;
            max-width: 400px;
          ">
            ❌ <strong>Erreur d'inscription</strong><br>
            <small style="opacity: 0.9;">${message}</small>
          </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 6000);
      };
      
      showErrorNotification(error.message);
    } finally {
      setLoading(false);
    }
  };

  const age = calculateAge(formData.birth_date);

  // ✅ PAS D'ÉCRAN DE SUCCÈS - REDIRECTION DIRECTE
  // L'interface reste dans le formulaire pendant le chargement et redirige automatiquement

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                if (window.history && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/students';
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                Inscription Étudiant
              </h1>
              <p className="text-sm text-gray-500">Haramain</p>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Étape {sections.findIndex(s => s.id === currentSection) + 1}/{sections.length}</span>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* Navigation avec barres de progression */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center relative">
                {/* Ligne de progression */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ 
                      width: `${((sections.findIndex(s => s.id === currentSection)) / (sections.length - 1)) * 100}%` 
                    }}
                  />
                </div>
                
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;
                  const isCompleted = validateSection(section.id).isValid && index < sections.findIndex(s => s.id === currentSection);
                  const currentIndex = sections.findIndex(s => s.id === currentSection);
                  
                  return (
                    <div key={section.id} className="flex flex-col items-center relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                        isActive ? `bg-${section.color}-600 ring-4 ring-${section.color}-200` : 
                        isCompleted ? 'bg-green-500' : 
                        index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {(isCompleted || index < currentIndex) ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs mt-2 text-center max-w-16 ${
                        isActive ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {section.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status panels */}
            {referenceError && (
              <div className="px-6 py-3 bg-red-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      Erreur chargement données: {referenceError}
                      {retryCount > 0 && ` (Tentative ${retryCount})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={retry}
                    disabled={referenceLoading}
                    className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded disabled:opacity-50"
                  >
                    {referenceLoading ? 'Chargement...' : 'Réessayer'}
                  </button>
                </div>
              </div>
            )}

            {referenceLoading && (
              <div className="px-6 py-3 bg-blue-50 border-b">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Chargement des données de référence via services existants...</span>
                </div>
              </div>
            )}

            {!referenceLoading && !referenceError && Array.isArray(schoolYears) && Array.isArray(classes) && (
              <div className="px-6 py-2 bg-green-50 border-b">
                <div className="flex items-center gap-4 text-green-700 text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Classes: {classes.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Années: {schoolYears.length}
                  </span>
                  {currentSchoolYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Actuelle: {currentSchoolYear.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contenu des sections */}
            <div className="p-6">
              
              {/* Section Identité */}
              {currentSection === 'personal' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Informations personnelles
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Renseignez les informations de base de l'étudiant
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => updateFormData('first_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Entrez le prénom"
                      />
                      {errors.first_name && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.first_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => updateFormData('last_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Entrez le nom"
                      />
                      {errors.last_name && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.last_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de naissance <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => updateFormData('birth_date', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.birth_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {age > 0 && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Âge calculé: {age} ans
                        </p>
                      )}
                      {errors.birth_date && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.birth_date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Genre <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateFormData('gender', 'M')}
                          className={`py-2 px-3 rounded-md border-2 transition-all duration-200 font-medium ${
                            formData.gender === 'M' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          Masculin
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFormData('gender', 'F')}
                          className={`py-2 px-3 rounded-md border-2 transition-all duration-200 font-medium ${
                            formData.gender === 'F' 
                              ? 'border-pink-500 bg-pink-50 text-pink-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          Féminin
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateFormData('status', 'externe')}
                          className={`py-2 px-3 rounded-md border-2 transition-all duration-200 font-medium ${
                            formData.status === 'externe' 
                              ? 'border-green-500 bg-green-50 text-green-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          Externe
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFormData('status', 'interne')}
                          className={`py-2 px-3 rounded-md border-2 transition-all duration-200 font-medium ${
                            formData.status === 'interne' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          Interne
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_orphan}
                          onChange={(e) => updateFormData('is_orphan', e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        <Heart className="w-4 h-4 text-orange-500" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Orphelin</span>
                          <p className="text-xs text-gray-500">Bénéficie de dispositions spéciales</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Scolarité */}
              {currentSection === 'schooling' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      Informations scolaires
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configurez l'inscription dans l'établissement
                    </p>
                  </div>
                  
                  {/* Année scolaire */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Année Scolaire
                    </h3>
                    
                    {!referenceLoading && Array.isArray(schoolYears) && schoolYears.length > 0 ? (
                      <select
                        value={formData.school_year_id}
                        onChange={(e) => updateFormData('school_year_id', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Sélectionner une année scolaire</option>
                        {schoolYears.map((year: any) => (
                          <option key={year.id} value={year.id}>
                            {year.display_name || year.name} {year.is_current && '⭐'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Chargement des années scolaires...</span>
                      </div>
                    )}
                    
                    {currentSchoolYear && (
                      <p className="text-xs text-blue-700 mt-2">
                        L'année courante ({currentSchoolYear.name}) est pré-sélectionnée
                      </p>
                    )}
                  </div>
                  
                  {/* Classes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        Enseignement Coranique
                      </h3>
                      
                      {!referenceLoading && Array.isArray(classes) && classes.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={formData.coranic_class_id}
                            onChange={(e) => updateFormData('coranic_class_id', e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          >
                            <option value="">Choisir une classe (optionnel)</option>
                            {classes.map((cls: any) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} - {cls.level}
                                {cls.capacity && ` (${cls.current_students || 0}/${cls.capacity})`}
                              </option>
                            ))}
                          </select>
                          
                          {formData.coranic_class_id && (
                            <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                              Classe sélectionnée: {classes.find((c: any) => c.id === formData.coranic_class_id)?.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Chargement des classes...</span>
                        </div>
                      )}
                      
                      <p className="text-xs text-green-700 mt-2">
                        L'élève peut être inscrit sans classe initialement
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        École Française (optionnel)
                      </h3>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Niveau (ex: CP, CE1, 6ème...)"
                          value={formData.french_level || ''}
                          onChange={(e) => updateFormData('french_level', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Nom de l'école"
                          value={formData.french_school_name || ''}
                          onChange={(e) => updateFormData('french_school_name', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <p className="text-xs text-blue-700 mt-2">
                        Ces informations sont à titre informatif uniquement
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Tuteur */}
              {currentSection === 'guardian' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Tuteur Principal
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Informations de contact du responsable légal
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.guardian.first_name}
                        onChange={(e) => updateFormData('guardian.first_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          errors['guardian.first_name'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Prénom du tuteur"
                      />
                      {errors['guardian.first_name'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.first_name']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.guardian.last_name}
                        onChange={(e) => updateFormData('guardian.last_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          errors['guardian.last_name'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Nom du tuteur"
                      />
                      {errors['guardian.last_name'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.last_name']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lien de parenté <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.guardian.relationship}
                        onChange={(e) => updateFormData('guardian.relationship', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {relationshipTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.guardian.phone}
                          onChange={(e) => updateFormData('guardian.phone', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            errors['guardian.phone'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="623 45 67 89"
                        />
                      </div>
                      {errors['guardian.phone'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.phone']}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (optionnel)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={formData.guardian.email}
                          onChange={(e) => updateFormData('guardian.email', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            errors['guardian.email'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="email@exemple.com"
                        />
                      </div>
                      {errors['guardian.email'] && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors['guardian.email']}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse (optionnel)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <textarea
                          value={formData.guardian.address}
                          onChange={(e) => updateFormData('guardian.address', e.target.value)}
                          rows={3}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Adresse complète du tuteur"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Finalisation */}
              {currentSection === 'finalize' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-pink-600" />
                      Photo & Finalisation
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Ajoutez une photo et vérifiez les informations
                    </p>
                  </div>

                  {/* Upload photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Photo de l'élève (optionnelle)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      {formData.photo_preview ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <img
                              src={formData.photo_preview}
                              alt="Aperçu photo"
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                photo: undefined, 
                                photo_preview: undefined 
                              }))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">Photo sélectionnée</p>
                            <p className="text-xs text-gray-500">{formData.photo?.name}</p>
                            <p className="text-xs text-gray-400">
                              Taille: {formData.photo ? Math.round(formData.photo.size / 1024) : 0} KB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Camera className="mx-auto h-12 w-12 text-gray-400" />
                          <div>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm hover:bg-pink-600 transition-colors font-medium"
                            >
                              Choisir une photo
                            </button>
                            <p className="mt-2 text-xs text-gray-500">
                              JPG, PNG, GIF • Maximum 5MB
                            </p>
                          </div>
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
                    {errors.photo && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.photo}
                      </p>
                    )}
                    
                    {photoUploadStatus === 'uploading' && (
                      <div className="mt-3 flex items-center gap-2 text-pink-600 text-sm bg-pink-50 p-2 rounded">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Upload de la photo en cours...
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes et observations (optionnel)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Allergies, besoins particuliers, remarques importantes..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ces informations seront visibles dans le profil de l'étudiant
                    </p>
                  </div>

                  {/* Résumé de l'inscription */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Résumé de l'inscription
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                          <h5 className="font-medium text-gray-900 mb-2">Étudiant</h5>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Nom complet:</span> {formData.first_name} {formData.last_name}</p>
                            <p><span className="font-medium">Âge:</span> {age ? `${age} ans` : 'Non calculé'}</p>
                            <p><span className="font-medium">Genre:</span> {formData.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
                            <p><span className="font-medium">Statut:</span> 
                              {formData.status === 'interne' ? 'Interne' : 'Externe'}
                              {formData.is_orphan && ' • Orphelin'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded border-l-4 border-green-500">
                          <h5 className="font-medium text-gray-900 mb-2">Scolarité</h5>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Année scolaire:</span> {
                              formData.school_year_id && Array.isArray(schoolYears)
                                ? schoolYears.find((y: any) => y.id === formData.school_year_id)?.name || 'Sélectionnée'
                                : 'Non renseignée'
                            }</p>
                            <p><span className="font-medium">Classe coranique:</span> {
                              formData.coranic_class_id && Array.isArray(classes)
                                ? classes.find((c: any) => c.id === formData.coranic_class_id)?.name || 'Sélectionnée'
                                : 'Non assignée'
                            }</p>
                            {(formData.french_level || formData.french_school_name) && (
                              <p><span className="font-medium">École française:</span> {
                                [formData.french_level, formData.french_school_name].filter(Boolean).join(' - ')
                              }</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                          <h5 className="font-medium text-gray-900 mb-2">Tuteur</h5>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Nom:</span> {formData.guardian.first_name} {formData.guardian.last_name}</p>
                            <p><span className="font-medium">Relation:</span> {
                              relationshipTypes.find(r => r.value === formData.guardian.relationship)?.label
                            }</p>
                            <p><span className="font-medium">Téléphone:</span> {formData.guardian.phone}</p>
                            {formData.guardian.email && (
                              <p><span className="font-medium">Email:</span> {formData.guardian.email}</p>
                            )}
                          </div>
                        </div>

                        {formData.photo && (
                          <div className="bg-white p-3 rounded border-l-4 border-pink-500">
                            <h5 className="font-medium text-gray-900 mb-2">Photo</h5>
                            <p className="text-sm">Photo ajoutée ({formData.photo.name})</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.is_orphan && (
                      <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800 flex items-center gap-2 font-medium">
                          <Heart className="w-4 h-4" />
                          Statut orphelin - Bénéficie de dispositions spéciales et d'un accompagnement renforcé
                        </p>
                      </div>
                    )}

                    <div className="mt-6 text-center">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {photoUploadStatus === 'uploading' ? 'Upload photo en cours...' : 'Enregistrement en cours...'}
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Enregistrer l'inscription
                          </>
                        )}
                      </button>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Après enregistrement, redirection automatique vers la liste des étudiants
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
              <button
                type="button"
                onClick={prevSection}
                disabled={sections.findIndex(s => s.id === currentSection) === 0 || loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Étape {sections.findIndex(s => s.id === currentSection) + 1} sur {sections.length}
                </span>
                
                {loading && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </div>
                )}
              </div>

              {sections.findIndex(s => s.id === currentSection) < sections.length - 1 && (
                <button
                  type="button"
                  onClick={nextSection}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              
              {sections.findIndex(s => s.id === currentSection) === sections.length - 1 && (
                <div className="text-sm text-green-600 font-medium">
                  Prêt pour l'inscription
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentWizard;