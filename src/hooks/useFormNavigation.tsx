// src/hooks/useFormNavigation.ts
import { useState, useCallback, useMemo } from 'react';

interface FormSection {
  id: string;
  title: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

interface UseFormNavigationOptions {
  sections: FormSection[];
  initialSection?: string;
  onSectionChange?: (sectionId: string, previousSection: string) => void;
}

export const useFormNavigation = (options: UseFormNavigationOptions) => {
  const { sections, initialSection, onSectionChange } = options;
  
  const [currentSection, setCurrentSection] = useState(initialSection || sections[0]?.id || '');

  // Index de la section actuelle
  const currentSectionIndex = useMemo(() => {
    return sections.findIndex(s => s.id === currentSection);
  }, [sections, currentSection]);

  // Section actuelle
  const currentSectionData = useMemo(() => {
    return sections.find(s => s.id === currentSection);
  }, [sections, currentSection]);

  // Vérifications de navigation
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sections.length - 1;
  const canGoNext = !isLastSection;
  const canGoPrevious = !isFirstSection;

  // Navigation vers une section spécifique
  const goToSection = useCallback((sectionId: string) => {
    const previousSection = currentSection;
    if (sections.some(s => s.id === sectionId)) {
      setCurrentSection(sectionId);
      onSectionChange?.(sectionId, previousSection);
    }
  }, [currentSection, sections, onSectionChange]);

  // Navigation vers la section suivante
  const goToNextSection = useCallback(() => {
    if (canGoNext) {
      const nextIndex = currentSectionIndex + 1;
      const nextSection = sections[nextIndex];
      if (nextSection) {
        goToSection(nextSection.id);
      }
    }
  }, [canGoNext, currentSectionIndex, sections, goToSection]);

  // Navigation vers la section précédente
  const goToPreviousSection = useCallback(() => {
    if (canGoPrevious) {
      const prevIndex = currentSectionIndex - 1;
      const prevSection = sections[prevIndex];
      if (prevSection) {
        goToSection(prevSection.id);
      }
    }
  }, [canGoPrevious, currentSectionIndex, sections, goToSection]);

  // Obtenir la section suivante
  const getNextSection = useCallback(() => {
    if (canGoNext) {
      return sections[currentSectionIndex + 1];
    }
    return null;
  }, [canGoNext, currentSectionIndex, sections]);

  // Obtenir la section précédente
  const getPreviousSection = useCallback(() => {
    if (canGoPrevious) {
      return sections[currentSectionIndex - 1];
    }
    return null;
  }, [canGoPrevious, currentSectionIndex, sections]);

  // Calculer le progrès (pourcentage)
  const progress = useMemo(() => {
    if (sections.length === 0) return 0;
    return Math.round(((currentSectionIndex + 1) / sections.length) * 100);
  }, [currentSectionIndex, sections.length]);

  // Obtenir toutes les sections avec leur statut
  const sectionsWithStatus = useMemo(() => {
    return sections.map((section, index) => ({
      ...section,
      status: index < currentSectionIndex ? 'completed' : 
              index === currentSectionIndex ? 'current' : 'pending',
      isAccessible: index <= currentSectionIndex, // On peut accéder aux sections précédentes et actuelle
    }));
  }, [sections, currentSectionIndex]);

  return {
    // État actuel
    currentSection,
    currentSectionIndex,
    currentSectionData,
    
    // Informations de navigation
    isFirstSection,
    isLastSection,
    canGoNext,
    canGoPrevious,
    progress,
    
    // Actions de navigation
    goToSection,
    goToNextSection,
    goToPreviousSection,
    
    // Utilitaires
    getNextSection,
    getPreviousSection,
    sectionsWithStatus,
    
    // Données
    sections
  };
};

export default useFormNavigation;