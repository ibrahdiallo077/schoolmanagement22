import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Wand2,
  Star,
  Clock,
  Info,
  BookOpen,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';

// ===== INTERFACES =====
interface SchoolYearFormData {
  name: string;
  start_date: string;
  end_date: string;
  description: string;
  is_current: boolean;
}

interface SchoolYearFormProps {
  schoolYear?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  mode?: 'create' | 'edit';
  title?: string;
  className?: string;
}

// ===== COMPOSANTS UTILITAIRES =====
const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  icon?: React.ReactNode;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
}> = ({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  required = false,
  rows,
  icon,
  help,
  value,
  onChange,
  error,
  disabled = false,
  maxLength
}) => {
  const Component = rows ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors z-10">
            {icon}
          </div>
        )}
        <Component
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all duration-300 resize-none disabled:bg-gray-100 font-medium placeholder-gray-400 ${
            error 
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-500' 
              : 'border-gray-200 bg-white hover:border-gray-300 group-focus-within:border-emerald-500'
          }`}
        />
        {maxLength && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      {help && !error && (
        <p className="text-sm text-gray-600 flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
          {help}
        </p>
      )}
      {error && (
        <p className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

// ===== COMPOSANT PRINCIPAL =====
const SchoolYearForm: React.FC<SchoolYearFormProps> = ({
  schoolYear,
  isOpen,
  onClose,
  onSave,
  mode = 'create',
  title,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState<SchoolYearFormData>({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ===== INITIALISATION =====
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && schoolYear) {
        setFormData({
          name: schoolYear.name || '',
          start_date: schoolYear.start_date?.split('T')[0] || '',
          end_date: schoolYear.end_date?.split('T')[0] || '',
          description: schoolYear.description || '',
          is_current: schoolYear.is_current || false
        });
      } else {
        // Valeurs par défaut pour nouvelle année
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        setFormData({
          name: `${currentYear}-${nextYear}`,
          start_date: `${currentYear}-09-01`,
          end_date: `${nextYear}-06-30`,
          description: '',
          is_current: false
        });
      }
      setErrors({});
      setShowPreview(false);
    }
  }, [isOpen, mode, schoolYear]);

  // ===== GESTIONNAIRES =====
  const updateField = (field: keyof SchoolYearFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateNextYear = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    updateField('name', `${currentYear}-${nextYear}`);
    updateField('start_date', `${currentYear}-09-01`);
    updateField('end_date', `${nextYear}-06-30`);
    updateField('description', `Année scolaire ${currentYear}-${nextYear} - Programme complet d'enseignement coranique et académique`);
  };

  const generateFollowingYear = () => {
    const currentYear = new Date().getFullYear();
    const followingYear = currentYear + 2;
    updateField('name', `${currentYear + 1}-${followingYear}`);
    updateField('start_date', `${currentYear + 1}-09-01`);
    updateField('end_date', `${followingYear}-06-30`);
    updateField('description', `Année scolaire ${currentYear + 1}-${followingYear} - Planification future`);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (!formData.name.match(/^\d{4}-\d{4}$/)) {
      newErrors.name = 'Le format doit être YYYY-YYYY (ex: 2024-2025)';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'La date de début est requise';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'La date de fin est requise';
    }
    
    if (formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'La date de fin doit être après la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description.trim(),
        is_current: formData.is_current
      };

      await onSave(submitData);
      onClose();
      
      // Toast de succès
      showToast('success', 
        mode === 'edit' ? '✏️ Année modifiée !' : '🎉 Année créée !',
        `L'année scolaire ${formData.name} a été ${mode === 'edit' ? 'modifiée' : 'créée'} avec succès.`
      );
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showToast('error', '❌ Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (type: string, title: string, description: string) => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md transform transition-all duration-300`;
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-2xl">${type === 'success' ? '✅' : '❌'}</span>
        <div>
          <div class="font-bold text-lg">${title}</div>
          <div class="text-sm opacity-90">${description}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  };

  const getDuration = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const weeks = Math.ceil(days / 7);
      const months = Math.ceil(days / 30);
      return { days, weeks, months };
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden ${className}`}>
        
        {/* Header avec dégradé moderne */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white p-6 relative overflow-hidden">
          {/* Motifs décoratifs */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group disabled:opacity-50"
              >
                <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {title || (mode === 'edit' ? 'Modifier l\'année scolaire' : 'Nouvelle année scolaire')}
                  </h1>
                  <p className="text-white/90 text-sm">
                    {mode === 'edit' 
                      ? 'Mettez à jour les informations de l\'année scolaire' 
                      : 'Créez une nouvelle année scolaire pour votre établissement'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold mb-1">École Moderne</div>
              <div className="text-white/80">Gestion des Années</div>
            </div>
          </div>
        </div>

        {/* Contenu principal avec scroll */}
        <div className="overflow-y-auto max-h-[70vh] p-6 bg-gradient-to-br from-white to-gray-50/30">
          <div className="space-y-6">
            
            {/* Génération automatique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="text-center mb-3">
                  <h4 className="text-lg font-bold text-blue-900 mb-1 flex items-center justify-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Année prochaine
                  </h4>
                  <p className="text-blue-700 text-sm">Générer l'année scolaire suivante</p>
                </div>
                <button
                  type="button"
                  onClick={generateNextYear}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  <span>Générer {new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="text-center mb-3">
                  <h4 className="text-lg font-bold text-purple-900 mb-1 flex items-center justify-center gap-2">
                    <Target className="w-5 h-5" />
                    Année suivante
                  </h4>
                  <p className="text-purple-700 text-sm">Planifier l'année d'après</p>
                </div>
                <button
                  type="button"
                  onClick={generateFollowingYear}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Générer {new Date().getFullYear() + 1}-{new Date().getFullYear() + 2}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <InputField
                label="Nom de l'année scolaire"
                name="name"
                placeholder="Ex: 2024-2025"
                required
                icon={<BookOpen className="w-5 h-5" />}
                help="Format requis: YYYY-YYYY (ex: 2024-2025)"
                value={formData.name}
                onChange={(value) => updateField('name', value)}
                error={errors.name}
                disabled={isSubmitting}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Date de début"
                  name="start_date"
                  type="date"
                  required
                  icon={<Calendar className="w-5 h-5" />}
                  value={formData.start_date}
                  onChange={(value) => updateField('start_date', value)}
                  error={errors.start_date}
                  disabled={isSubmitting}
                />

                <InputField
                  label="Date de fin"
                  name="end_date"
                  type="date"
                  required
                  icon={<Calendar className="w-5 h-5" />}
                  value={formData.end_date}
                  onChange={(value) => updateField('end_date', value)}
                  error={errors.end_date}
                  disabled={isSubmitting}
                />
              </div>

              {/* Durée calculée */}
              {getDuration() && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
                  <h4 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Durée calculée
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{getDuration()?.days}</div>
                      <div className="text-sm text-emerald-700">Jours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{getDuration()?.weeks}</div>
                      <div className="text-sm text-emerald-700">Semaines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{getDuration()?.months}</div>
                      <div className="text-sm text-emerald-700">Mois</div>
                    </div>
                  </div>
                </div>
              )}

              <InputField
                label="Description"
                name="description"
                placeholder="Description de l'année scolaire (optionnel)..."
                rows={3}
                icon={<Info className="w-5 h-5" />}
                help="Décrivez brièvement les objectifs et particularités de cette année"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                disabled={isSubmitting}
                maxLength={500}
              />

              {/* Toggle année courante */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-yellow-900 mb-2 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Année scolaire courante
                    </h4>
                    <p className="text-yellow-700 text-sm">Définir cette année comme l'année courante active</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('is_current', !formData.is_current)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      formData.is_current ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        formData.is_current ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {formData.is_current && (
                  <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                    <div className="flex items-center text-yellow-800 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Cette année remplacera l'année courante actuelle. Les nouvelles inscriptions utiliseront cette année par défaut.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec boutons */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-400 transition-all duration-300 disabled:opacity-50 shadow-lg transform hover:scale-105"
          >
            <X className="w-5 h-5 mr-2" />
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-emerald-200 transform hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-3" />
                {mode === 'edit' ? 'Mettre à jour' : 'Créer l\'année scolaire'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolYearForm;