import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  AlertCircle, 
  Users, 
  User, 
  BookOpen, 
  School,
  Loader2,
  DollarSign,
  CheckCircle
} from 'lucide-react';

// ===== CONFIGURATION API =====
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// ===== INTERFACES =====
interface ClassFormData {
  name: string;
  level: string;
  description: string;
  capacity: number;
  teacher_id: string;
  school_year_id: string;
  monthly_fee: number;
  is_active: boolean;
}

interface Teacher {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  position: string;
  status: string;
  email?: string;
  phone?: string;
}

interface SchoolYear {
  id: string;
  year_name: string;
  is_active: boolean;
}

interface ClassFormProps {
  classData?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  mode?: 'create' | 'edit';
}

// ===== COMPOSANT PRINCIPAL =====
const ClassForm: React.FC<ClassFormProps> = ({
  classData,
  isOpen,
  onClose,
  onSave,
  mode = 'create'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Données du formulaire
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    level: 'debutant',
    description: '',
    capacity: 25,
    teacher_id: '',
    school_year_id: '',
    monthly_fee: 25000,
    is_active: true
  });

  // Données de référence
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string>('');

  // ===== UTILITAIRES API =====
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const makeApiCall = async (endpoint: string, options: any = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
      console.log('📦 Data being sent:', options.body);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers
        }
      });
      
      const data = await response.json();
      
      console.log(`📡 Response ${endpoint}:`, {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (!response.ok) {
        console.error(`❌ HTTP Error ${response.status}:`, data);
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error: any) {
      console.error(`❌ API Error ${endpoint}:`, error);
      throw error;
    }
  };

  // ===== CHARGEMENT DES DONNÉES =====
  const loadFormData = async () => {
    setIsLoading(true);
    setLoadError('');
    
    try {
      console.log('🔄 Loading form data...');
      
      // Charger les enseignants
      try {
        const teachersResponse = await makeApiCall('/api/classes/staff/teachers');
        if (teachersResponse.success && teachersResponse.teachers) {
          setTeachers(teachersResponse.teachers);
          console.log(`✅ ${teachersResponse.teachers.length} teachers loaded`);
        } else {
          setTeachers([]);
        }
      } catch (error) {
        console.error('❌ Error loading teachers:', error);
        setTeachers([]);
      }
      
      // Charger les années scolaires
      try {
        let schoolYearsResponse;
        try {
          schoolYearsResponse = await makeApiCall('/api/classes/school-years');
        } catch (error) {
          schoolYearsResponse = await makeApiCall('/api/school-years');
        }
        
        if (schoolYearsResponse.success && schoolYearsResponse.school_years) {
          setSchoolYears(schoolYearsResponse.school_years);
          console.log(`✅ ${schoolYearsResponse.school_years.length} school years loaded`);
        } else if (schoolYearsResponse.data) {
          setSchoolYears(schoolYearsResponse.data);
        } else {
          // Créer une année par défaut
          const defaultYear = {
            id: 'default-2024-2025',
            year_name: '2024-2025',
            is_active: true
          };
          setSchoolYears([defaultYear]);
        }
      } catch (error) {
        console.error('❌ Error loading school years:', error);
        const defaultYear = {
          id: 'default-2024-2025',
          year_name: '2024-2025',
          is_active: true
        };
        setSchoolYears([defaultYear]);
      }
      
    } catch (error: any) {
      console.error('💥 General error:', error);
      setLoadError(`Connection error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== INITIALISATION =====
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setLoadError('');
      loadFormData();
      
      if (mode === 'edit' && classData) {
        setFormData({
          name: classData.name || '',
          level: classData.level || 'debutant',
          description: classData.description || '',
          capacity: classData.capacity || 25,
          teacher_id: classData.teacher_id || '',
          school_year_id: classData.school_year_id || '',
          monthly_fee: classData.monthly_fee || 25000,
          is_active: classData.is_active !== undefined ? classData.is_active : true
        });
      } else {
        // Reset pour nouvelle classe
        setFormData({
          name: '',
          level: 'debutant',
          description: '',
          capacity: 25,
          teacher_id: '',
          school_year_id: '',
          monthly_fee: 25000,
          is_active: true
        });
      }
    }
  }, [isOpen, mode, classData]);

  // ===== GESTIONNAIRES =====
  const updateField = (field: keyof ClassFormData, value: any) => {
    console.log(`🔄 Updating ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateUniqueName = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    const uniqueName = `Classe-${dateStr}-${timeStr}-${randomStr}`;
    updateField('name', uniqueName);
    
    if (errors.name) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    console.log('🔍 Form validation:', formData);
    
    // Validation du nom
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Le nom de la classe est requis';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }
    
    // Validation du niveau
    if (!formData.level || formData.level.trim() === '') {
      newErrors.level = 'Le niveau est requis';
    }
    
    // Validation de la capacité
    if (!formData.capacity || formData.capacity < 5 || formData.capacity > 50) {
      newErrors.capacity = 'La capacité doit être entre 5 et 50 étudiants';
    }
    
    // Validation des frais
    if (formData.monthly_fee < 0) {
      newErrors.monthly_fee = 'Le montant ne peut pas être négatif';
    }

    console.log('🔍 Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== SOUMISSION CORRIGÉE =====
  const handleSubmit = async () => {
    console.log('🚀 Form submission started');
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      // ✅ PRÉPARATION DES DONNÉES AVEC DEBUGGING
      const submitData = {
        name: formData.name.trim(),
        level: formData.level.trim(),
        type: 'coranic',
        description: formData.description.trim(),
        capacity: Number(formData.capacity),
        teacher_id: formData.teacher_id || null,
        school_year_id: formData.school_year_id || null,
        monthly_fee: Number(formData.monthly_fee),
        is_active: Boolean(formData.is_active)
      };

      console.log('📊 Data to save (detailed):');
      console.log('  Original formData:', formData);
      console.log('  Prepared submitData:', submitData);
      console.log('  JSON payload:', JSON.stringify(submitData, null, 2));
      
      // Vérifications individuelles
      console.log('🔍 Individual checks:');
      console.log(`  name: "${submitData.name}" (length: ${submitData.name.length}, type: ${typeof submitData.name})`);
      console.log(`  level: "${submitData.level}" (length: ${submitData.level?.length || 0}, type: ${typeof submitData.level})`);
      console.log(`  capacity: ${submitData.capacity} (type: ${typeof submitData.capacity})`);

      // ✅ VÉRIFICATIONS DE SÉCURITÉ
      if (!submitData.name || submitData.name.length === 0) {
        throw new Error('Le nom ne peut pas être vide');
      }
      if (!submitData.level || submitData.level.length === 0) {
        throw new Error('Le niveau ne peut pas être vide');
      }

      const endpoint = mode === 'edit' ? `/api/classes/${classData?.id}` : '/api/classes';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      console.log(`🌐 API Call: ${method} ${endpoint}`);

      // ✅ APPEL API UNIQUE
      const result = await makeApiCall(endpoint, {
        method: method,
        body: JSON.stringify(submitData)
      });

      console.log('✅ API Success:', result);

      // ✅ NOTIFIER LE PARENT ET FERMER
      await onSave(result);
      onClose();
      
    } catch (error: any) {
      console.error('💥 Save error:', error);
      
      const errorMessage = error.message || 'Erreur inconnue';
      console.log('🔍 Error analysis:', errorMessage);
      
      // ✅ GESTION D'ERREURS SIMPLIFIÉE
      if (errorMessage.includes('Le nom') && errorMessage.includes('requis')) {
        setErrors({ 
          name: `Erreur de validation: ${errorMessage}. Vérifiez que le nom est bien rempli.` 
        });
      } else if (errorMessage.includes('409') || errorMessage.toLowerCase().includes('existe déjà')) {
        setErrors({ 
          name: `Le nom "${formData.name}" existe déjà. Cliquez sur "Nom unique" pour en générer un nouveau.` 
        });
      } else if (errorMessage.includes('400')) {
        setErrors({ 
          name: 'Données invalides. Vérifiez tous les champs requis.' 
        });
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setErrors({ 
          name: 'Session expirée. Reconnectez-vous et réessayez.' 
        });
      } else {
        setErrors({ 
          name: `Erreur: ${errorMessage}` 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options pour les selects
  const levelOptions = [
    { value: 'debutant', label: '🌱 Débutant' },
    { value: 'intermediaire', label: '📚 Intermédiaire' },
    { value: 'avance', label: '⭐ Avancé' },
    { value: 'memorisation', label: '💎 Mémorisation' },
    { value: 'tajwid', label: '🎵 Tajwid' }
  ];

  const teacherOptions = teachers.map(teacher => ({
    value: teacher.id,
    label: `${teacher.first_name} ${teacher.last_name} (${teacher.staff_number})`,
    disabled: teacher.status !== 'active'
  }));

  const schoolYearOptions = schoolYears.map(year => ({
    value: year.id,
    label: year.is_active ? `${year.year_name} (Courante)` : year.year_name,
    disabled: false
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {mode === 'edit' ? 'Modifier la classe' : 'Nouvelle classe coranique'}
                </h1>
                <p className="text-emerald-100 text-sm">🕌 École coranique</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto max-h-[70vh] p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
              <span className="text-lg font-medium text-gray-700">Chargement des données...</span>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 text-red-800 mb-4">
                <AlertCircle className="w-6 h-6" />
                <span className="font-medium">Erreur de connexion</span>
              </div>
              <p className="text-red-700 mb-4">{loadError}</p>
              <button 
                onClick={loadFormData}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Réessayer
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  Informations de base
                </h3>
                
                {/* Nom */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom de la classe <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateUniqueName}
                      disabled={isSubmitting}
                      className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                    >
                      ✨ Nom unique
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Ex: Classe Coranique A1"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </div>
                      {errors.name.includes('existe déjà') && (
                        <button
                          type="button"
                          onClick={generateUniqueName}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                        >
                          ✨ Générer un nom unique automatiquement
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Niveau */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => updateField('level', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      errors.level ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    {levelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.level && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.level}
                    </div>
                  )}
                </div>

                {/* Capacité et Frais */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacité <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => updateField('capacity', parseInt(e.target.value) || 0)}
                        min={5}
                        max={50}
                        disabled={isSubmitting}
                        className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.capacity && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.capacity}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frais mensuels (GNF)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        value={formData.monthly_fee}
                        onChange={(e) => updateField('monthly_fee', parseInt(e.target.value) || 0)}
                        min={0}
                        step={1000}
                        disabled={isSubmitting}
                        className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          errors.monthly_fee ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.monthly_fee && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.monthly_fee}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Objectifs pédagogiques, méthodes d'enseignement..."
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Assignations */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-500" />
                  Assignations (optionnel)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Enseignant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enseignant
                    </label>
                    <select
                      value={formData.teacher_id}
                      onChange={(e) => updateField('teacher_id', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">
                        {teachers.length === 0 ? "Aucun enseignant disponible" : "Choisir un enseignant"}
                      </option>
                      {teacherOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Année scolaire */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année scolaire
                    </label>
                    <select
                      value={formData.school_year_id}
                      onChange={(e) => updateField('school_year_id', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">
                        {schoolYears.length === 0 ? "Aucune année disponible" : "Choisir l'année"}
                      </option>
                      {schoolYearOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Debug - Aperçu des données */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔍 Aperçu des données</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>Nom: "{formData.name}"</div>
                  <div>Niveau: "{formData.level}"</div>
                  <div>Capacité: {formData.capacity}</div>
                  <div>Frais: {formData.monthly_fee} GNF</div>
                  <div>Enseignant: {formData.teacher_id || 'Non sélectionné'}</div>
                  <div>Année: {formData.school_year_id || 'Non sélectionnée'}</div>
                  <div>Active: {formData.is_active ? 'Oui' : 'Non'}</div>
                </div>
              </div>
              
              {/* Statut */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-emerald-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Statut de la classe
                    </h4>
                    <p className="text-emerald-700 text-sm mt-1">
                      {formData.is_active ? 'Classe active et ouverte aux inscriptions' : 'Classe inactive'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('is_active', !formData.is_active)}
                    disabled={isSubmitting}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      formData.is_active ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white hover:border-gray-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 shadow-lg flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === 'edit' ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === 'edit' ? 'Mettre à jour' : 'Créer la classe'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassForm;