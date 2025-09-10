// src/components/students/EnrollmentWizard/FormNavigation.tsx
import React from 'react';
import { User, GraduationCap, UserCheck, Camera, FileCheck, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface FormSection {
  id: string;
  title: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

interface FormNavigationProps {
  currentSection: string;
  sections: FormSection[];
  hasErrors?: (sectionId: string) => boolean;
  onSectionChange?: (sectionId: string) => void;
  completedSections?: string[];
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  currentSection,
  sections,
  hasErrors = () => false,
  onSectionChange,
  completedSections = []
}) => {
  // Mapping des icônes modernes
  const iconMap = {
    'user': User,
    'graduation-cap': GraduationCap,
    'user-check': UserCheck,
    'camera': Camera,
    'file-check': FileCheck,
    'check-circle': CheckCircle
  };

  // Configuration des couleurs et styles pour chaque section
  const sectionStyles = {
    personal: {
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      shadow: 'shadow-blue-200/50'
    },
    schooling: {
      gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      shadow: 'shadow-emerald-200/50'
    },
    guardian: {
      gradient: 'from-purple-500 via-violet-600 to-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      shadow: 'shadow-purple-200/50'
    },
    finalize: {
      gradient: 'from-pink-500 via-rose-600 to-pink-700',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      shadow: 'shadow-pink-200/50'
    }
  };

  const getStepStatus = (section: FormSection, index: number) => {
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    
    if (completedSections.includes(section.id)) {
      return hasErrors(section.id) ? 'error' : 'completed';
    } else if (index === currentIndex) {
      return hasErrors(section.id) ? 'current-error' : 'current';
    } else if (index < currentIndex) {
      return hasErrors(section.id) ? 'error' : 'pending';
    } else {
      return 'pending';
    }
  };

  const getStepClasses = (status: string, section: FormSection) => {
    const style = sectionStyles[section.id as keyof typeof sectionStyles] || sectionStyles.personal;
    const baseClasses = "group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-102";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-800 shadow-lg ${style.shadow} hover:shadow-xl hover:from-green-100 hover:to-emerald-100`;
      case 'current':
        return `${baseClasses} bg-gradient-to-r ${style.gradient} text-white border-transparent shadow-2xl scale-105 z-10 hover:scale-110`;
      case 'current-error':
        return `${baseClasses} bg-gradient-to-br from-red-50 to-pink-50 border-red-300 text-red-800 shadow-xl scale-105 z-10 ring-2 ring-red-200`;
      case 'error':
        return `${baseClasses} bg-gradient-to-br from-red-50 to-pink-50 border-red-200 text-red-600 shadow-lg hover:shadow-xl hover:from-red-100 hover:to-pink-100`;
      default:
        return `${baseClasses} ${style.bg} border-gray-200 ${style.text} opacity-60 hover:opacity-80 hover:shadow-lg`;
    }
  };

  const getStepIcon = (section: FormSection, status: string) => {
    const IconComponent = iconMap[section.icon as keyof typeof iconMap] || User;
    const iconSize = "w-6 h-6";
    
    if (status === 'completed') {
      return <CheckCircle className={`${iconSize} text-green-600`} />;
    }
    
    if (status === 'error' || status === 'current-error') {
      return <AlertCircle className={`${iconSize} text-red-600`} />;
    }
    
    if (status === 'current') {
      return <IconComponent className={`${iconSize} text-white`} />;
    }
    
    return <IconComponent className={iconSize} />;
  };

  const handleSectionClick = (section: FormSection, index: number) => {
    const currentIndex = sections.findIndex(s => s.id === currentSection);
    
    // Permettre la navigation vers les sections précédentes ou adjacentes
    if (index <= currentIndex + 1 && onSectionChange) {
      onSectionChange(section.id);
    }
  };

  const currentIndex = sections.findIndex(s => s.id === currentSection);
  const progress = ((currentIndex + 1) / sections.length) * 100;

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Header avec titre */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Assistant d'inscription moderne</span>
          </div>
        </div>

        {/* Navigation cards flottantes */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {sections.map((section, index) => {
            const IconComponent = iconMap[section.icon as keyof typeof iconMap] || User;
            const status = getStepStatus(section, index);
            const stepClasses = getStepClasses(status, section);
            const isClickable = index <= currentIndex + 1;
            
            return (
              <div
                key={section.id}
                className={`${stepClasses} ${!isClickable ? 'cursor-not-allowed opacity-40' : ''}`}
                onClick={() => isClickable && handleSectionClick(section, index)}
              >
                <div className="flex flex-col items-center space-y-3 min-w-[140px]">
                  
                  {/* Badge étape */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      status === 'current' 
                        ? 'bg-white/20 text-white' 
                        : status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : status.includes('error')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-white/50 text-gray-600'
                    }`}>
                      Étape {index + 1}
                    </span>
                    
                    {/* Indicateurs de statut */}
                    {status === 'completed' && !hasErrors(section.id) && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {(status === 'error' || status === 'current-error') && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  
                  {/* Icône principale */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    status === 'current' 
                      ? 'bg-white/20 shadow-lg' 
                      : status === 'completed'
                        ? 'bg-green-100 shadow-md' 
                        : status.includes('error')
                          ? 'bg-red-100 shadow-md'
                          : 'bg-white/50 group-hover:bg-white/70'
                  }`}>
                    {getStepIcon(section, status)}
                  </div>
                  
                  {/* Contenu textuel */}
                  <div className="text-center">
                    <p className="text-sm font-bold mb-1">
                      {section.label}
                    </p>
                    <p className="text-xs opacity-80 leading-tight">
                      {section.title}
                    </p>
                  </div>
                </div>
                
                {/* Indicateur de progression active */}
                {status === 'current' && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full animate-pulse shadow-lg" />
                )}
                
                {/* Effet de brillance pour les sections complétées */}
                {status === 'completed' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Barre de progression globale moderne */}
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="font-semibold">Progression de l'inscription</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/70 px-3 py-1 rounded-full font-medium">
                {currentIndex + 1} sur {sections.length}
              </span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Barre de progression avec glass effect */}
          <div className="relative w-full bg-gray-200/50 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-700 ease-out shadow-lg relative"
              style={{ width: `${progress}%` }}
            >
              {/* Effet de brillance animé */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full"></div>
              
              {/* Reflet glass */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-full"></div>
            </div>
            
            {/* Points de jalons */}
            {sections.map((_, index) => (
              <div
                key={index}
                className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-all ${
                  index <= currentIndex 
                    ? 'bg-blue-600 shadow-lg' 
                    : 'bg-gray-300'
                }`}
                style={{ left: `${((index + 1) / sections.length) * 100}%`, marginLeft: '-6px' }}
              />
            ))}
          </div>
          
          {/* Texte de statut */}
          <div className="text-center mt-3">
            <span className="text-xs text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-gray-200">
              ✨ Interface moderne et intuitive • Sauvegarde automatique
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormNavigation;