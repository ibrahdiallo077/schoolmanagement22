// src/components/students/shared/FormButtons.tsx
import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Check, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  Rocket,
  Star,
  Play,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface FormButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'modern' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  progress?: number; // Pour afficher la progression (0-100)
}

// Composant Button moderne réutilisable
const ModernButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit';
}> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button'
}) => {
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 
      text-white border-2 border-transparent
      hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700
      focus:ring-4 focus:ring-blue-500/30
      shadow-lg hover:shadow-xl hover:shadow-blue-500/25
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 
      text-gray-800 border-2 border-gray-300
      hover:from-gray-200 hover:to-gray-300 hover:border-gray-400
      focus:ring-4 focus:ring-gray-400/30
      shadow-md hover:shadow-lg
    `,
    success: `
      bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 
      text-white border-2 border-transparent
      hover:from-green-700 hover:via-emerald-700 hover:to-teal-700
      focus:ring-4 focus:ring-green-500/30
      shadow-lg hover:shadow-xl hover:shadow-green-500/25
    `,
    danger: `
      bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 
      text-white border-2 border-transparent
      hover:from-red-700 hover:via-pink-700 hover:to-rose-700
      focus:ring-4 focus:ring-red-500/30
      shadow-lg hover:shadow-xl hover:shadow-red-500/25
    `,
    glass: `
      bg-white/20 backdrop-blur-xl 
      text-gray-800 border-2 border-white/30
      hover:bg-white/30 hover:border-white/50
      focus:ring-4 focus:ring-white/20
      shadow-xl hover:shadow-2xl
    `
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        group relative overflow-hidden
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-xl font-semibold
        transition-all duration-300 ease-out
        transform hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        flex items-center gap-2 justify-center
        ${className}
      `}
    >
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
      
      {/* Contenu du bouton */}
      <div className="relative flex items-center gap-2">
        {loading ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : Icon && iconPosition === 'left' ? (
          <Icon className={`${iconSize} group-hover:scale-110 transition-transform`} />
        ) : null}
        
        <span className="font-semibold">{children}</span>
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={`${iconSize} group-hover:scale-110 transition-transform`} />
        )}
      </div>
      
      {/* Particules d'effet au hover (optionnel pour certains boutons) */}
      {variant === 'success' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" />
          <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          <div className="absolute bottom-2 left-3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </button>
  );
};

// Composant Progress Bar moderne
const ProgressBar: React.FC<{
  progress: number;
  className?: string;
}> = ({ progress, className = '' }) => (
  <div className={`relative w-full h-2 bg-gray-200/50 rounded-full overflow-hidden ${className}`}>
    <div 
      className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-700 ease-out relative"
      style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 animate-pulse" />
    </div>
  </div>
);

export const FormButtons: React.FC<FormButtonsProps> = ({
  onPrevious,
  onNext,
  onSubmit,
  previousLabel = 'Précédent',
  nextLabel = 'Suivant',
  submitLabel = 'Finaliser l\'inscription',
  showPrevious = true,
  showNext = true,
  showSubmit = false,
  loading = false,
  disabled = false,
  className = '',
  variant = 'modern',
  size = 'md',
  progress = 0
}) => {

  // Gestion responsive
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={`relative ${className}`}>
      
      {/* Barre de progression si fournie */}
      {progress > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Progression du formulaire</span>
            <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <ProgressBar progress={progress} />
        </div>
      )}

      {/* Container principal des boutons */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Zone gauche - Bouton Précédent */}
        <div className="flex-shrink-0">
          {showPrevious && onPrevious ? (
            <ModernButton
              onClick={onPrevious}
              variant="secondary"
              size={size}
              disabled={loading}
              icon={ArrowLeft}
              iconPosition="left"
              className="min-w-[120px]"
            >
              {isMobile ? 'Retour' : previousLabel}
            </ModernButton>
          ) : (
            <div className="w-[120px]" /> // Espace réservé pour l'alignement
          )}
        </div>

        {/* Zone centre - Indicateurs ou infos */}
        <div className="flex-1 flex items-center justify-center">
          {progress > 0 && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      step <= (progress / 20) 
                        ? 'bg-blue-600 scale-110' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-600 ml-2">
                Étapes complétées
              </span>
            </div>
          )}
        </div>

        {/* Zone droite - Boutons d'action */}
        <div className="flex-shrink-0 flex items-center gap-3">
          
          {/* Bouton Suivant */}
          {showNext && onNext && (
            <ModernButton
              onClick={onNext}
              variant="primary"
              size={size}
              disabled={loading || disabled}
              icon={ArrowRight}
              iconPosition="right"
              className="min-w-[120px]"
            >
              {isMobile ? 'Suivant' : nextLabel}
            </ModernButton>
          )}

          {/* Bouton Soumettre */}
          {showSubmit && onSubmit && (
            <ModernButton
              onClick={onSubmit}
              variant="success"
              size={size}
              disabled={loading || disabled}
              loading={loading}
              icon={loading ? undefined : CheckCircle}
              iconPosition="left"
              className="min-w-[160px] relative"
            >
              {loading ? (
                <span>Enregistrement...</span>
              ) : (
                <span>{isMobile ? 'Finaliser' : submitLabel}</span>
              )}
            </ModernButton>
          )}
        </div>
      </div>

      {/* Footer informatif pour mobile */}
      {isMobile && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
            <Sparkles className="w-3 h-3" />
            <span>Interface optimisée mobile</span>
          </div>
        </div>
      )}

      {/* Messages contextuels */}
      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Traitement en cours, veuillez patienter...</span>
        </div>
      )}

      {disabled && !loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
          <Shield className="w-4 h-4" />
          <span>Veuillez compléter les champs requis pour continuer</span>
        </div>
      )}
    </div>
  );
};

// Composants boutons spécialisés pour différents contextes
export const NavigationButtons: React.FC<{
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  loading?: boolean;
  currentStep?: number;
  totalSteps?: number;
}> = ({
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  loading = false,
  currentStep = 1,
  totalSteps = 5
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <FormButtons
      onPrevious={onPrevious}
      onNext={onNext}
      showPrevious={!!onPrevious}
      showNext={!!onNext}
      showSubmit={false}
      disabled={nextDisabled}
      loading={loading}
      progress={progress}
      size="md"
    />
  );
};

export const SubmissionButtons: React.FC<{
  onPrevious?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  disabled?: boolean;
  submitLabel?: string;
}> = ({
  onPrevious,
  onSubmit,
  loading = false,
  disabled = false,
  submitLabel = "Finaliser l'inscription"
}) => (
  <FormButtons
    onPrevious={onPrevious}
    onSubmit={onSubmit}
    showPrevious={!!onPrevious}
    showNext={false}
    showSubmit={!!onSubmit}
    loading={loading}
    disabled={disabled}
    submitLabel={submitLabel}
    progress={100}
    size="lg"
  />
);

// Export du composant Button pour usage externe
export const Button = ModernButton;

export default FormButtons;