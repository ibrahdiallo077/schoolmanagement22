// src/pages/Students/StudentEditPage.tsx - VERSION COMPLÈTE ET SIMPLIFIÉE

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  User, Phone, Mail, MapPin, Camera, Calendar, BookOpen, Users, Save, X, 
  AlertTriangle, Check, School, Heart, ArrowRight, ArrowLeft, Loader2, Eye,
  RefreshCw, Edit
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

// ✅ SERVICES API SIMPLIFIÉS
const getAuthHeaders = () => {
  let token = localStorage.getItem('token');
  if (!token) {
    token = 'dev-token-' + Date.now();
    localStorage.setItem('token', token);
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const makeApiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return await response.json();
};

// ✅ SERVICES CORRIGÉS
const StudentService = {
  async getById(id: string) {
    return await  makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}`);
  },

  async update(id: string, data: any) {
    return await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // ✅ FONCTION UPLOAD PHOTO CORRIGÉE
  async uploadPhoto(id: string, file: File) {
    console.log('📸 Upload photo pour:', id, file.name);
    
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      throw new Error('Fichier invalide ou trop volumineux (max 5MB)');
    }
    
    // ✅ CORRECTION: FormData avec champ "photo"
    const formData = new FormData();
    formData.append('photo', file); // ✅ OBLIGATOIRE: nom "photo"
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}/photo`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        // ✅ PAS de Content-Type défini manuellement
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload échoué: ${error}`);
    }
    
    return await response.json();
  }
};

const ClassService = {
  async getAll() {
    try {
      const data = await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/classes?type=coranic&active=true`);
      return data.success ? data.classes : [];
    } catch (error) {
      return [
        { id: 'mock-1', name: 'Classe Coranique 1', level: 'Débutant' },
        { id: 'mock-2', name: 'Classe Coranique 2', level: 'Intermédiaire' }
      ];
    }
  }
};

const SchoolYearService = {
  async getAll() {
    try {
      const data = await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/school-years/options/select`);
      return data.success ? data.school_years : [];
    } catch (error) {
      return [
        { id: 'mock-year-1', name: '2024-2025', is_current: true, display_name: '2024-2025 (Actuelle) ⭐' }
      ];
    }
  }
};

// ✅ INTERFACE FORMULAIRE
interface FormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  coranic_class_id: string;
  school_year_id: string;
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
  current_photo_url?: string;
  notes: string;
}

const StudentEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ ÉTATS
  const [student, setStudent] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: '', last_name: '', birth_date: '', gender: 'M', status: 'externe', is_orphan: false,
    coranic_class_id: '', school_year_id: '',
    guardian: { first_name: '', last_name: '', phone: '', email: '', address: '', relationship: 'pere' },
    notes: ''
  });

  const relationshipTypes = [
    { value: 'pere', label: 'Père' }, { value: 'mere', label: 'Mère' },
    { value: 'tuteur_legal', label: 'Tuteur légal' }, { value: 'grand_parent', label: 'Grand-parent' },
    { value: 'oncle', label: 'Oncle' }, { value: 'tante', label: 'Tante' }
  ];

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const [studentResult, classesResult, schoolYearsResult] = await Promise.all([
          StudentService.getById(id),
          ClassService.getAll(),
          SchoolYearService.getAll()
        ]);

        if (studentResult.success && studentResult.student) {
          const studentData = studentResult.student;
          setStudent(studentData);
          
          const primaryGuardian = studentData.guardians?.[0] || studentData.primary_guardian || studentData.guardian;
          
          setFormData({
            first_name: studentData.first_name || '',
            last_name: studentData.last_name || '',
            birth_date: studentData.birth_date ? studentData.birth_date.split('T')[0] : '',
            gender: studentData.gender || 'M',
            status: studentData.status || 'externe',
            is_orphan: studentData.is_orphan || false,
            coranic_class_id: studentData.coranic_class?.id || '',
            school_year_id: studentData.school_year?.id || '',
            guardian: {
              first_name: primaryGuardian?.first_name || '',
              last_name: primaryGuardian?.last_name || '',
              phone: primaryGuardian?.phone || '',
              email: primaryGuardian?.email || '',
              address: primaryGuardian?.address || '',
              relationship: primaryGuardian?.relationship || 'pere'
            },
            current_photo_url: studentData.photo_url || '',
            notes: studentData.notes || ''
          });
        }

        setClasses(classesResult);
        setSchoolYears(schoolYearsResult);
        
      } catch (error: any) {
        console.error('Erreur chargement:', error);
        setErrors({ general: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // ✅ MISE À JOUR FORMULAIRE
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
    setHasChanges(true);
    if (errors[path]) {
      setErrors(prev => ({ ...prev, [path]: undefined }));
    }
  };

  // ✅ UPLOAD PHOTO
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
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ CALCUL ÂGE
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

  // ✅ VALIDATION
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
    if (!formData.birth_date) newErrors.birth_date = 'Date de naissance requise';
    if (!formData.guardian.first_name.trim()) newErrors['guardian.first_name'] = 'Prénom tuteur requis';
    if (!formData.guardian.last_name.trim()) newErrors['guardian.last_name'] = 'Nom tuteur requis';
    if (!formData.guardian.phone.trim()) newErrors['guardian.phone'] = 'Téléphone requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ SOUMISSION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student || !id || !validateForm()) return;
    
    setSaving(true);
    
    try {
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date,
        gender: formData.gender,
        status: formData.status,
        is_orphan: formData.is_orphan,
        ...(formData.coranic_class_id && { coranic_class_id: formData.coranic_class_id }),
        ...(formData.school_year_id && { school_year_id: formData.school_year_id }),
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
      
      const result = await StudentService.update(id, updateData);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur mise à jour');
      }
      
      // Upload photo si nouvelle
      if (formData.photo) {
        try {
          await StudentService.uploadPhoto(id, formData.photo);
          console.log('✅ Photo uploadée');
        } catch (photoError: any) {
          console.warn('⚠️ Photo non uploadée:', photoError.message);
        }
      }
      
      setSuccess(true);
      setHasChanges(false);
      
      setTimeout(() => {
        navigate(`/students/${id}`, { replace: true });
      }, 2000);
        
    } catch (error: any) {
      console.error('Erreur:', error);
      setErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };

  const age = calculateAge(formData.birth_date);

  // ✅ ÉCRANS SPÉCIAUX
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Chargement...</h2>
          <p className="text-gray-600">Récupération des données...</p>
        </div>
      </div>
    );
  }

  if (errors.general || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{errors.general || 'Étudiant non trouvé'}</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/students')}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Retour à la liste
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <Check className="h-8 w-8 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">🎉 Mise à jour réussie !</h2>
          <p className="text-gray-600 mb-6">
            <strong>{formData.first_name} {formData.last_name}</strong> a été mis(e) à jour.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Redirection vers le profil...
          </div>
          <button
            onClick={() => navigate(`/students/${id}`)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voir le profil
          </button>
        </div>
      </div>
    );
  }

  // ✅ INTERFACE PRINCIPALE
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                if (hasChanges && !confirm('Modifications non sauvegardées. Quitter ?')) return;
                navigate(`/students/${id}`);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Modifier l'Étudiant
              </h1>
              <p className="text-sm text-gray-500">
                {student?.first_name} {student?.last_name}
              </p>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              {hasChanges && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            {/* Erreur générale */}
            {errors.general && (
              <div className="px-6 py-3 bg-red-50 border-b">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{errors.general}</span>
                </div>
              </div>
            )}

            <div className="p-6 space-y-8">
              
              {/* Section Identité */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informations personnelles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => updateFormData('first_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.first_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Prénom"
                    />
                    {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => updateFormData('last_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.last_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nom"
                    />
                    {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date de naissance <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => updateFormData('birth_date', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.birth_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {age > 0 && <p className="text-xs text-blue-600 mt-1">Âge: {age} ans</p>}
                    {errors.birth_date && <p className="text-xs text-red-600 mt-1">{errors.birth_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Genre</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateFormData('gender', 'M')}
                        className={`py-2 px-3 rounded-md border-2 transition-colors ${
                          formData.gender === 'M' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        Masculin
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData('gender', 'F')}
                        className={`py-2 px-3 rounded-md border-2 transition-colors ${
                          formData.gender === 'F' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                        }`}
                      >
                        Féminin
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Statut</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateFormData('status', 'externe')}
                        className={`py-2 px-3 rounded-md border-2 transition-colors ${
                          formData.status === 'externe' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        Externe
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData('status', 'interne')}
                        className={`py-2 px-3 rounded-md border-2 transition-colors ${
                          formData.status === 'interne' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        Interne
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_orphan}
                        onChange={(e) => updateFormData('is_orphan', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Heart className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Orphelin</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section Scolarité */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Scolarité
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Année Scolaire
                    </h3>
                    
                    <select
                      value={formData.school_year_id}
                      onChange={(e) => updateFormData('school_year_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Choisir une année</option>
                      {schoolYears.map((year: any) => (
                        <option key={year.id} value={year.id}>
                          {year.display_name || year.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold mb-2">🕌 Classe Coranique</h3>
                    
                    <select
                      value={formData.coranic_class_id}
                      onChange={(e) => updateFormData('coranic_class_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Choisir une classe (optionnel)</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Tuteur */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Tuteur Principal
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.guardian.first_name}
                      onChange={(e) => updateFormData('guardian.first_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors['guardian.first_name'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors['guardian.first_name'] && (
                      <p className="text-xs text-red-600 mt-1">{errors['guardian.first_name']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.guardian.last_name}
                      onChange={(e) => updateFormData('guardian.last_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors['guardian.last_name'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors['guardian.last_name'] && (
                      <p className="text-xs text-red-600 mt-1">{errors['guardian.last_name']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Parenté</label>
                    <select
                      value={formData.guardian.relationship}
                      onChange={(e) => updateFormData('guardian.relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {relationshipTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.guardian.phone}
                      onChange={(e) => updateFormData('guardian.phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors['guardian.phone'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="623 45 67 89"
                    />
                    {errors['guardian.phone'] && (
                      <p className="text-xs text-red-600 mt-1">{errors['guardian.phone']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email (optionnel)</label>
                    <input
                      type="email"
                      value={formData.guardian.email}
                      onChange={(e) => updateFormData('guardian.email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Adresse (optionnel)</label>
                    <textarea
                      value={formData.guardian.address}
                      onChange={(e) => updateFormData('guardian.address', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </div>

              {/* Section Photo & Notes */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  Photo & Notes
                </h2>

                {/* Photo actuelle */}
                {formData.current_photo_url && !formData.photo_preview && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Photo actuelle</label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                      <img
                        src={formData.current_photo_url.startsWith('http') ? 
                          formData.current_photo_url : 
                          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${formData.current_photo_url}`}
                        alt="Photo actuelle"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">Photo existante</p>
                        <p className="text-xs text-gray-500">Choisissez une nouvelle photo pour la remplacer</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upload nouvelle photo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    {formData.current_photo_url ? 'Nouvelle photo (optionnelle)' : 'Photo (optionnelle)'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {formData.photo_preview ? (
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <img
                            src={formData.photo_preview}
                            alt="Aperçu"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              photo: undefined, 
                              photo_preview: undefined 
                            }))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Nouvelle photo sélectionnée</p>
                      </div>
                    ) : (
                      <div>
                        <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          {formData.current_photo_url ? 'Changer la photo' : 'Choisir une photo'}
                        </button>
                        <p className="mt-1 text-xs text-gray-500">JPG, PNG • Max 5MB</p>
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
                  {errors.photo && <p className="text-xs text-red-600 mt-1">{errors.photo}</p>}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Allergies, besoins particuliers, remarques..."
                  />
                </div>

                {/* Résumé */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Résumé des modifications
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p><strong>Étudiant:</strong> {formData.first_name} {formData.last_name}</p>
                      <p><strong>Âge:</strong> {age ? `${age} ans` : '-'}</p>
                      <p><strong>Genre:</strong> {formData.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
                      <p><strong>Statut:</strong> {formData.status} {formData.is_orphan && '• Orphelin'}</p>
                    </div>
                    
                    <div>
                      <p><strong>Tuteur:</strong> {formData.guardian.first_name} {formData.guardian.last_name}</p>
                      <p><strong>Téléphone:</strong> {formData.guardian.phone}</p>
                      <p><strong>Classe:</strong> {
                        formData.coranic_class_id 
                          ? classes.find((c: any) => c.id === formData.coranic_class_id)?.name || 'Sélectionnée'
                          : 'Non assignée'
                      }</p>
                      {formData.photo && <p><strong>Nouvelle photo:</strong> ✅ Sélectionnée</p>}
                    </div>
                  </div>

                  {formData.is_orphan && (
                    <div className="mt-3 p-2 bg-orange-100 rounded">
                      <p className="text-sm text-orange-800 flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        Étudiant orphelin
                      </p>
                    </div>
                  )}

                  {hasChanges && (
                    <div className="mt-3 p-2 bg-yellow-100 rounded">
                      <p className="text-sm text-yellow-800 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Modifications détectées
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (hasChanges && !confirm('Modifications non sauvegardées. Quitter ?')) return;
                  navigate(`/students/${id}`);
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Annuler
              </button>

              <div className="flex items-center gap-3">
                {hasChanges && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Modifications non sauvegardées
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {hasChanges ? 'Sauvegarder' : 'Aucune modification'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditPage;