// src/pages/staff/StaffEditPage.tsx - Page modification personnel moderne CORRIGÉE

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, Phone, Mail, MapPin, Camera, Calendar, BookOpen, Users, Save, X, 
  AlertTriangle, Check, School, Heart, ArrowRight, ArrowLeft, Loader2, Eye,
  ArrowDown, RefreshCw, Edit  // ✅ Ajouter Edit ici
} from 'lucide-react';

// ✅ CORRECTION : Types et interfaces définies localement
interface Staff {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'on_leave';
  qualifications?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface StaffFormData {
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  email: string;
  phone: string;
  address: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  qualifications: string;
  notes: string;
}

interface PositionOption {
  value: string;
  label: string;
}

interface DepartmentOption {
  value: string;
  label: string;
}

// ✅ CORRECTION : Service staff mockée
const staffService = {
  async getStaff(id: string) {
    // Simulation des données
    const mockStaff: Staff = {
      id,
      staff_number: `STAFF-${id}`,
      first_name: 'Ahmed',
      last_name: 'Ben Ali',
      position: 'teacher',
      department: 'education_coranique',
      email: 'ahmed.benali@markaz.ma',
      phone: '+212 661 234 567',
      address: '123 Rue des Écoles, Casablanca',
      hire_date: '2020-09-01',
      status: 'active' as const,
      qualifications: 'Master en Sciences Islamiques',
      notes: 'Excellent enseignant',
      created_at: '2020-09-01T00:00:00.000Z',
      updated_at: '2024-01-15T10:30:00.000Z'
    };

    return {
      success: true,
      staff: mockStaff
    };
  },

  async updateStaff(id: string, data: Partial<StaffFormData>) {
    console.log('Mise à jour employé:', id, data);
    return {
      success: true,
      staff: { id, ...data }
    };
  },

  async getPositions() {
    return {
      success: true,
      positions: [
        { value: 'teacher', label: 'Enseignant' },
        { value: 'administrator', label: 'Administrateur' },
        { value: 'secretary', label: 'Secrétaire' },
        { value: 'guard', label: 'Gardien' },
        { value: 'cook', label: 'Cuisinier' }
      ]
    };
  },

  async getDepartments() {
    return {
      success: true,
      departments: [
        { value: 'administration', label: 'Administration' },
        { value: 'education_coranique', label: 'Éducation Coranique' },
        { value: 'education_francaise', label: 'Éducation Française' },
        { value: 'security', label: 'Sécurité' },
        { value: 'services', label: 'Services Généraux' }
      ]
    };
  }
};

// ✅ CORRECTION : Fonctions utilitaires 
const validateStaffData = (data: StaffFormData) => {
  const errors: string[] = [];
  
  if (!data.first_name.trim()) errors.push('Le prénom est requis');
  if (!data.last_name.trim()) errors.push('Le nom est requis');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Format d\'email invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const formatStaffDataForApi = (data: StaffFormData) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    const value = cleaned[key as keyof StaffFormData];
    if (value === '' || value === undefined || value === null) {
      delete cleaned[key as keyof StaffFormData];
    }
  });
  return cleaned;
};

// === INTERFACES ===

interface FormSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  fields: (keyof StaffFormData)[];
}

interface FormErrors {
  [key: string]: string;
}

interface EditHistory {
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: Date;
}

// === CONFIGURATION DES SECTIONS ===

const FORM_SECTIONS: FormSection[] = [
  {
    id: 'personal',
    title: 'Informations Personnelles',
    subtitle: 'Identité et coordonnées',
    icon: '👤',
    fields: ['first_name', 'last_name', 'email', 'phone', 'address']
  },
  {
    id: 'professional',
    title: 'Informations Professionnelles',
    subtitle: 'Poste et département',
    icon: '💼',
    fields: ['position', 'department', 'hire_date', 'status']
  },
  {
    id: 'additional',
    title: 'Informations Complémentaires',
    subtitle: 'Qualifications et notes',
    icon: '📋',
    fields: ['qualifications', 'notes']
  }
];

// === COMPOSANTS UTILITAIRES ===

const SectionTabs: React.FC<{
  sections: FormSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  hasErrors: Record<string, boolean>;
}> = ({ sections, activeSection, onSectionChange, hasErrors }) => (
  <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
    {sections.map((section) => {
      const isActive = activeSection === section.id;
      const hasError = hasErrors[section.id];

      return (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
            isActive
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
              : hasError
              ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">{section.icon}</span>
          <div className="text-left">
            <div className="font-bold text-sm">{section.title}</div>
            <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
              {section.subtitle}
            </div>
          </div>
          {hasError && (
            <span className="text-red-500 text-lg">⚠️</span>
          )}
        </button>
      );
    })}
  </div>
);

const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  originalValue?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  icon?: string;
  rows?: number;
}> = ({ label, name, type = 'text', value, originalValue, onChange, error, required, placeholder, icon, rows }) => {
  const isModified = originalValue !== undefined && value !== originalValue;
  const InputComponent = rows ? 'textarea' : 'input';
  
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-bold text-gray-700">
        <span className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isModified && (
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              Modifié
            </span>
          )}
        </span>
      </label>
      
      <div className="relative">
        <InputComponent
          id={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium ${
            error 
              ? 'border-red-300 bg-red-50' 
              : isModified
              ? 'border-orange-300 bg-orange-50 focus:bg-white'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
          }`}
        />
        
        {error && (
          <div className="absolute top-full left-0 mt-1 flex items-center text-red-600 text-sm">
            <span className="mr-1">⚠️</span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

const SelectField: React.FC<{
  label: string;
  name: string;
  value: string;
  originalValue?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  required?: boolean;
  icon?: string;
  loading?: boolean;
}> = ({ label, name, value, originalValue, onChange, options, error, required, icon, loading }) => {
  const isModified = originalValue !== undefined && value !== originalValue;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-bold text-gray-700">
        <span className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isModified && (
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              Modifié
            </span>
          )}
        </span>
      </label>
      
      <div className="relative">
        <select
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium appearance-none ${
            error 
              ? 'border-red-300 bg-red-50' 
              : isModified
              ? 'border-orange-300 bg-orange-50 focus:bg-white'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">Sélectionner...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <span className="text-gray-400">▼</span>
        </div>
        
        {error && (
          <div className="absolute top-full left-0 mt-1 flex items-center text-red-600 text-sm">
            <span className="mr-1">⚠️</span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

const ChangesSummary: React.FC<{
  changes: EditHistory[];
  isVisible: boolean;
  onToggle: () => void;
}> = ({ changes, isVisible, onToggle }) => (
  <div className={`transition-all duration-300 ${isVisible ? 'mb-6' : ''}`}>
    <button
      onClick={onToggle}
      className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">📊</span>
          <div className="text-left">
            <div className="font-bold text-blue-900">
              Résumé des modifications ({changes.length})
            </div>
            <div className="text-sm text-blue-700">
              Cliquez pour {isVisible ? 'masquer' : 'voir'} les détails
            </div>
          </div>
        </div>
        <span className={`text-blue-600 transform transition-transform ${isVisible ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>
    </button>

    {isVisible && changes.length > 0 && (
      <div className="mt-4 space-y-3">
        {changes.map((change, index) => (
          <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900 capitalize">
                {change.field.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-500">
                {change.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 font-medium mb-1">Ancienne valeur:</div>
                <div className="text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                  {change.oldValue || 'Vide'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 font-medium mb-1">Nouvelle valeur:</div>
                <div className="text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  {change.newValue || 'Vide'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// === COMPOSANT PRINCIPAL ===

const StaffEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [originalData, setOriginalData] = useState<StaffFormData | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    position: undefined,
    department: undefined,
    email: '',
    phone: '',
    address: '',
    hire_date: '',
    status: 'active',
    qualifications: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [activeSection, setActiveSection] = useState('personal');
  const [changes, setChanges] = useState<EditHistory[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        navigate('/staff');
        return;
      }

      setLoading(true);
      try {
        const [staffRes, positionsRes, departmentsRes] = await Promise.all([
          staffService.getStaff(id),
          staffService.getPositions(),
          staffService.getDepartments()
        ]);

        if (staffRes.success && staffRes.staff) {
          setStaff(staffRes.staff);
          
          const data: StaffFormData = {
            first_name: staffRes.staff.first_name,
            last_name: staffRes.staff.last_name,
            position: staffRes.staff.position,
            department: staffRes.staff.department,
            email: staffRes.staff.email || '',
            phone: staffRes.staff.phone || '',
            address: staffRes.staff.address || '',
            hire_date: staffRes.staff.hire_date || '',
            status: staffRes.staff.status,
            qualifications: staffRes.staff.qualifications || '',
            notes: staffRes.staff.notes || ''
          };
          
          setFormData(data);
          setOriginalData(data);
        } else {
          setErrors({ general: 'Employé non trouvé' });
        }

        if (positionsRes.success) {
          setPositions(positionsRes.positions);
        }

        if (departmentsRes.success) {
          setDepartments(departmentsRes.departments);
        }
      } catch (error) {
        setErrors({ general: 'Erreur de chargement des données' });
      } finally {
        setLoading(false);
        setLoadingOptions(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Gestionnaires
  const handleFieldChange = (field: keyof StaffFormData, value: string) => {
    const oldValue = formData[field]?.toString() || '';
    const newValue = value;

    // Mettre à jour les données
    setFormData(prev => ({
      ...prev,
      [field]: value || undefined
    }));

    // Tracker les changements
    if (originalData && oldValue !== newValue) {
      const existingChangeIndex = changes.findIndex(c => c.field === field);
      const newChange: EditHistory = {
        field,
        oldValue: originalData[field]?.toString() || '',
        newValue,
        timestamp: new Date()
      };

      if (existingChangeIndex >= 0) {
        const newChanges = [...changes];
        newChanges[existingChangeIndex] = newChange;
        setChanges(newChanges);
      } else {
        setChanges(prev => [...prev, newChange]);
      }
    }

    // Effacer l'erreur
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (formData.phone && formData.phone.trim().length < 8) {
      newErrors.phone = 'Numéro de téléphone trop court';
    }
    if (formData.hire_date && isNaN(Date.parse(formData.hire_date))) {
      newErrors.hire_date = 'Date d\'embauche invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !id) return;

    setSaving(true);
    
    try {
      const cleanedData = formatStaffDataForApi(formData);
      const response = await staffService.updateStaff(id, cleanedData);

      if (response.success) {
        // Notification de succès
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all';
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <span>✅</span>
            <div>
              <div class="font-bold">Employé modifié !</div>
              <div class="text-sm opacity-90">Les modifications ont été sauvegardées</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 4000);

        navigate('/staff');
      } else {
        setErrors({ general: response.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setErrors({ general: 'Erreur de connexion au serveur' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = changes.length > 0;
  const hasErrorsInSection = (sectionId: string): boolean => {
    const section = FORM_SECTIONS.find(s => s.id === sectionId);
    return section ? section.fields.some(field => errors[field]) : false;
  };

  const sectionErrors = FORM_SECTIONS.reduce((acc, section) => {
    acc[section.id] = hasErrorsInSection(section.id);
    return acc;
  }, {} as Record<string, boolean>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-bold text-gray-900">Chargement des données...</div>
          <div className="text-gray-600 mt-2">Veuillez patienter</div>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Employé non trouvé</h1>
          <p className="text-gray-600 mb-6">L'employé que vous recherchez n'existe pas.</p>
          <button
            onClick={() => navigate('/staff')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const currentSection = FORM_SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/staff')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <span className="text-2xl text-white">✏️</span>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Modifier le Personnel
                </h1>
                <p className="text-gray-600 mt-1">
                  {staff.first_name} {staff.last_name} - {staff.staff_number}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {hasChanges && (
                <div className="text-right">
                  <div className="text-sm text-orange-600 font-medium">
                    {changes.length} modification{changes.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500">Non sauvegardées</div>
                </div>
              )}
              
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {staff.first_name[0]}{staff.last_name[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Navigation par onglets */}
        <SectionTabs
          sections={FORM_SECTIONS}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          hasErrors={sectionErrors}
        />

        {/* Résumé des modifications */}
        {hasChanges && (
          <ChangesSummary
            changes={changes}
            isVisible={showChanges}
            onToggle={() => setShowChanges(!showChanges)}
          />
        )}

        {/* Formulaire */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          {/* Header de la section */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                  <span className="text-2xl text-white">{currentSection?.icon}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentSection?.title}</h2>
                  <p className="text-gray-600 mt-1">{currentSection?.subtitle}</p>
                </div>
              </div>

              {sectionErrors[activeSection] && (
                <div className="flex items-center text-red-600">
                  <span className="mr-2">⚠️</span>
                  <span className="font-medium">Erreurs dans cette section</span>
                </div>
              )}
            </div>
          </div>

          {/* Contenu du formulaire */}
          <div className="p-8">
            {/* Erreur générale */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center text-red-700">
                  <span className="mr-2 text-xl">⚠️</span>
                  <span className="font-medium">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Section Informations personnelles */}
            {activeSection === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Prénom"
                    name="first_name"
                    value={formData.first_name}
                    originalValue={originalData?.first_name}
                    onChange={(value) => handleFieldChange('first_name', value)}
                    error={errors.first_name}
                    required
                    placeholder="Prénom de l'employé"
                    icon="👤"
                  />
                  
                  <InputField
                    label="Nom"
                    name="last_name"
                    value={formData.last_name}
                    originalValue={originalData?.last_name}
                    onChange={(value) => handleFieldChange('last_name', value)}
                    error={errors.last_name}
                    required
                    placeholder="Nom de l'employé"
                    icon="👤"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    originalValue={originalData?.email}
                    onChange={(value) => handleFieldChange('email', value)}
                    error={errors.email}
                    placeholder="email@exemple.com"
                    icon="📧"
                  />
                  
                  <InputField
                    label="Téléphone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    originalValue={originalData?.phone}
                    onChange={(value) => handleFieldChange('phone', value)}
                    error={errors.phone}
                    placeholder="+33 6 12 34 56 78"
                    icon="📞"
                  />
                </div>

                <InputField
                  label="Adresse"
                  name="address"
                  value={formData.address}
                  originalValue={originalData?.address}
                  onChange={(value) => handleFieldChange('address', value)}
                  placeholder="Adresse complète..."
                  icon="🏠"
                  rows={3}
                />
              </div>
            )}

            {/* Section Informations professionnelles */}
            {activeSection === 'professional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectField
                    label="Poste"
                    name="position"
                    value={formData.position || ''}
                    originalValue={originalData?.position}
                    onChange={(value) => handleFieldChange('position', value)}
                    options={positions}
                    loading={loadingOptions}
                    icon="💼"
                  />
                  
                  <SelectField
                    label="Département"
                    name="department"
                    value={formData.department || ''}
                    originalValue={originalData?.department}
                    onChange={(value) => handleFieldChange('department', value)}
                    options={departments}
                    loading={loadingOptions}
                    icon="🏢"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Date d'embauche"
                    name="hire_date"
                    type="date"
                    value={formData.hire_date}
                    originalValue={originalData?.hire_date}
                    onChange={(value) => handleFieldChange('hire_date', value)}
                    error={errors.hire_date}
                    icon="📅"
                  />
                  
                  <SelectField
                    label="Statut"
                    name="status"
                    value={formData.status || 'active'}
                    originalValue={originalData?.status}
                    onChange={(value) => handleFieldChange('status', value)}
                    options={[
                      { value: 'active', label: 'Actif' },
                      { value: 'inactive', label: 'Inactif' },
                      { value: 'on_leave', label: 'En congé' }
                    ]}
                    icon="✅"
                  />
                </div>
              </div>
            )}

            {/* Section Informations complémentaires */}
            {activeSection === 'additional' && (
              <div className="space-y-6">
                <InputField
                  label="Qualifications et compétences"
                  name="qualifications"
                  value={formData.qualifications}
                  originalValue={originalData?.qualifications}
                  onChange={(value) => handleFieldChange('qualifications', value)}
                  placeholder="Diplômes, certifications, compétences particulières..."
                  icon="🎓"
                  rows={4}
                />
                
                <InputField
                  label="Notes et remarques"
                  name="notes"
                  value={formData.notes}
                  originalValue={originalData?.notes}
                  onChange={(value) => handleFieldChange('notes', value)}
                  placeholder="Notes internes, remarques particulières..."
                  icon="📝"
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/staff')}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Annuler
                </button>

                <button
                  onClick={() => navigate(`/staff/${id}`)}
                  className="px-6 py-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl font-medium hover:bg-blue-100 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>👁️</span>
                  <span>Voir les détails</span>
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {hasChanges && (
                  <div className="text-right text-sm">
                    <div className="text-orange-600 font-medium">
                      {changes.length} modification{changes.length !== 1 ? 's' : ''} en attente
                    </div>
                    <div className="text-gray-500">
                      Cliquez sur "Sauvegarder" pour confirmer
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={saving || !hasChanges}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 transform shadow-lg flex items-center space-x-2 ${
                    hasChanges
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:scale-105'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>💾</span>
                  <span>{saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}</span>
                </button>
              </div>
            </div>

            {/* Indicateur de modifications */}
            {hasChanges && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-orange-700">
                    <span className="mr-2">⚠️</span>
                    <span className="font-medium">
                      Vous avez des modifications non sauvegardées
                    </span>
                  </div>
                  <button
                    onClick={() => setShowChanges(!showChanges)}
                    className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                  >
                    {showChanges ? 'Masquer' : 'Voir'} les détails
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section informations employé */}
        {staff && (
          <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <span className="mr-2">📈</span>
                Informations de l'employé
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <span className="text-white">📋</span>
                    </div>
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Numéro Personnel</div>
                      <div className="text-lg font-bold text-blue-900">{staff.staff_number}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <span className="text-white">📅</span>
                    </div>
                    <div>
                      <div className="text-sm text-green-600 font-medium">Membre depuis</div>
                      <div className="text-lg font-bold text-green-900">
                        {staff.hire_date ? new Date(staff.hire_date).toLocaleDateString('fr-FR') : 'Non spécifié'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <span className="text-white">⏰</span>
                    </div>
                    <div>
                      <div className="text-sm text-purple-600 font-medium">Dernière modification</div>
                      <div className="text-lg font-bold text-purple-900">
                        {staff.updated_at ? new Date(staff.updated_at).toLocaleDateString('fr-FR') : 'Jamais'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">⚡</span>
                  Actions rapides
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate(`/staff/${id}`)}
                    className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <span className="text-xl">👁️</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Voir les détails</div>
                      <div className="text-sm text-gray-500">Vue complète</div>
                    </div>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <span className="text-xl">🖨️</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Imprimer</div>
                      <div className="text-sm text-gray-500">Fiche personnel</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const subject = `Informations - ${staff.first_name} ${staff.last_name}`;
                      const body = `Bonjour,\n\nConcernant ${staff.first_name} ${staff.last_name} (${staff.staff_number})...\n\nCordialement`;
                      window.location.href = `mailto:${staff.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                    disabled={!staff.email}
                    className={`p-3 border rounded-xl transition-colors flex items-center space-x-3 ${
                      staff.email
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="text-xl">📧</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Envoyer un email</div>
                      <div className="text-sm text-gray-500">
                        {staff.email ? 'Contact direct' : 'Email non renseigné'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffEditPage;