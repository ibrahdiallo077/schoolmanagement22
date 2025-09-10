// src/components/students/EnrollmentWizard/PhotoUploadSection.tsx
import React, { useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  FileText,
  Image,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Eye,
  RotateCcw,
  Download,
  Star,
  Zap,
  Shield,
  Heart,
  Users
} from 'lucide-react';

interface PhotoUploadSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  errors: Record<string, string>;
  photoUpload?: {
    preview?: string;
    uploading?: boolean;
    error?: string;
    handleDrop?: (files: FileList | File[]) => void;
    handleRemove?: () => void;
  };
}

// Composant ModernCard réutilisable
const ModernCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  gradient: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, icon: Icon, gradient, children, className = "" }) => (
  <div className={`group relative overflow-hidden ${className}`}>
    <div className={`h-full p-6 bg-gradient-to-br ${gradient} border-2 border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-102 backdrop-blur-sm`}>
      {/* Header avec icône */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-white/80 text-sm">{subtitle}</p>
        </div>
      </div>
      
      {/* Contenu */}
      {children}
      
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  </div>
);

// Composant ModernTextarea
const ModernTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ComponentType<any>;
  description?: string;
  rows?: number;
}> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  icon: Icon,
  description,
  rows = 4
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-white/90">
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-4 z-10">
            <Icon className="w-5 h-5 text-white/60" />
          </div>
        )}
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-4 py-3 text-white bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl
            focus:ring-4 focus:ring-white/20 focus:border-white/60 transition-all duration-300
            placeholder:text-white/50 text-base resize-none
            ${Icon ? 'pl-12' : ''}
            ${error ? 'border-red-300 bg-red-50/20' : ''}
            ${isFocused ? 'shadow-xl scale-102' : ''}
          `}
        />
        
        {/* Effet de focus */}
        {isFocused && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
        )}
      </div>
      
      {description && (
        <p className="text-xs text-white/70 flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          {description}
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-300 flex items-center gap-2 bg-red-500/20 px-3 py-2 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  formData,
  updateFormData,
  errors,
  photoUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(
    formData.photo_preview || photoUpload?.preview || ''
  );
  const [uploadError, setUploadError] = useState<string>('');

  // Gestion de l'upload de photo avec amélioration
  const handlePhotoUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Vérification de la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('La photo doit faire moins de 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setPhotoPreview(preview);
        setUploadError('');
        
        // Mise à jour des données du formulaire
        updateFormData('photo', file);
        updateFormData('photo_preview', preview);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadError('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP)');
    }
  }, [updateFormData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handlePhotoUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handlePhotoUpload(files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setUploadError('');
    updateFormData('photo', undefined);
    updateFormData('photo_preview', undefined);
    
    // Reset de l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header de section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-200 rounded-full shadow-lg">
          <Camera className="w-5 h-5 text-pink-600" />
          <span className="text-sm font-bold text-pink-800">Photo et Finalisation</span>
          <Sparkles className="w-4 h-4 text-pink-600" />
        </div>
        <p className="text-gray-600 mt-3 text-lg">
          Ajoutez une photo et complétez les dernières informations
        </p>
      </div>

      {/* Grid layout responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card Upload Photo */}
        <ModernCard
          title="Photo de l'étudiant"
          subtitle="Portrait récent et visible"
          icon={Camera}
          gradient="from-pink-500 via-rose-600 to-pink-700"
        >
          <div className="space-y-6">
            
            {/* Zone de drop moderne */}
            <div
              className={`
                relative border-4 border-dashed rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer
                ${dragActive ? 'border-white/80 bg-white/20 scale-105' : 'border-white/40 hover:border-white/60 hover:bg-white/10'}
                ${photoPreview ? 'border-green-300 bg-green-500/20' : ''}
                ${uploadError ? 'border-red-300 bg-red-500/20' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {photoPreview ? (
                // Aperçu de l'image avec contrôles
                <div className="space-y-4">
                  <div className="relative inline-block group">
                    <img
                      src={photoPreview}
                      alt="Photo de l'étudiant"
                      className="w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-white/50"
                    />
                    
                    {/* Overlay avec actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFileDialog();
                          }}
                          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                          title="Changer la photo"
                        >
                          <RotateCcw className="w-5 h-5 text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto();
                          }}
                          className="w-10 h-10 bg-red-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-red-600/80 transition-colors"
                          title="Supprimer la photo"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Badge de confirmation */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-green-300 font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Photo ajoutée avec succès !
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileDialog();
                      }}
                      className="mt-2 text-xs text-white/80 hover:text-white underline flex items-center gap-1 justify-center"
                    >
                      <Camera className="w-3 h-3" />
                      Changer la photo
                    </button>
                  </div>
                </div>
              ) : (
                // Zone de drop vide
                <div className="space-y-4">
                  <div className={`mx-auto w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center transition-all ${dragActive ? 'scale-110' : ''}`}>
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <p className="text-lg font-bold text-white mb-2">
                      {dragActive ? 'Déposez votre photo ici' : 'Ajoutez une photo'}
                    </p>
                    <p className="text-sm text-white/80 mb-4">
                      Glissez-déposez ou cliquez pour sélectionner
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">Parcourir les fichiers</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-white/70 space-y-1">
                    <p>📸 Formats: JPG, PNG, WEBP</p>
                    <p>📏 Taille max: 5MB</p>
                    <p>✨ Recommandé: photo récente et nette</p>
                  </div>
                </div>
              )}

              {/* Erreur d'upload */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-400/50 rounded-xl">
                  <p className="text-sm text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {uploadError}
                  </p>
                </div>
              )}
            </div>

            {/* Conseils pour la photo */}
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
              <h4 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Conseils pour une bonne photo
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📸</span>
                  <span>Photo récente et de bonne qualité</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <span>Visage bien visible et centré</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>Éclairage naturel de préférence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚫</span>
                  <span>Éviter les photos floues ou sombres</span>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Card Notes et Observations */}
        <ModernCard
          title="Informations complémentaires"
          subtitle="Notes et observations importantes"
          icon={FileText}
          gradient="from-indigo-500 via-purple-600 to-violet-700"
        >
          <div className="space-y-6">
            
            <ModernTextarea
              label="Notes et observations"
              value={formData.notes || ''}
              onChange={(value) => updateFormData('notes', value)}
              placeholder="Informations importantes: allergies, besoins particuliers, objectifs pédagogiques, observations médicales, talents spéciaux..."
              error={errors.notes}
              icon={FileText}
              description="Ces informations aideront l'équipe pédagogique"
              rows={6}
            />

            {/* Suggestions d'informations */}
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
              <h4 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Suggestions d'informations utiles
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs text-white/80">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🏥</span>
                  <span>Allergies alimentaires ou médicamenteuses</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">📚</span>
                  <span>Difficultés d'apprentissage particulières</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎯</span>
                  <span>Objectifs spirituels et académiques</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">👨‍👩‍👧‍👦</span>
                  <span>Contraintes familiales à considérer</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">⭐</span>
                  <span>Talents ou compétences spéciales</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">💊</span>
                  <span>Traitements médicaux en cours</span>
                </div>
              </div>
            </div>

            {/* Statistiques du texte */}
            {formData.notes && (
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Caractères: {formData.notes.length}</span>
                  <span>Mots: {formData.notes.split(' ').filter(word => word.length > 0).length}</span>
                </div>
              </div>
            )}
          </div>
        </ModernCard>
      </div>

      {/* Message d'importance sur la photo */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-lg mb-2">
              📷 Importance de la photo d'identité
            </h4>
            <p className="text-blue-800 mb-4">
              La photo permet une identification rapide de l'étudiant et facilite 
              le suivi personnalisé au sein du Markaz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Shield className="w-4 h-4" />
                <span>Sécurité et identification</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="w-4 h-4" />
                <span>Suivi pédagogique personnalisé</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Heart className="w-4 h-4" />
                <span>Création du lien éducatif</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Star className="w-4 h-4" />
                <span>Dossier administratif complet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé final si données complètes */}
      {photoPreview && formData.notes && (
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-green-900 text-lg mb-2">
                ✅ Section complétée avec succès !
              </h4>
              <p className="text-green-700">
                Photo ajoutée et informations complémentaires renseignées. 
                Vous pouvez maintenant finaliser l'inscription.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadSection;