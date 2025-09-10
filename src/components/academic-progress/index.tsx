// src/components/academic-progress/index.ts - FICHIER D'EXPORTS CORRIGÉ

// Imports des composants corrigés
import AcademicStatsCards from './AcademicStatsCards';
import EvaluationFilters from './EvaluationFilters';
import EvaluationsList from './EvaluationsList';
import CreateEvaluationModal from './CreateEvaluationModal';

// Re-exports nommés pour compatibilité
export { default as AcademicStatsCards } from './AcademicStatsCards';
export { default as EvaluationFilters } from './EvaluationFilters';
export { default as EvaluationsList } from './EvaluationsList';
export { default as CreateEvaluationModal } from './CreateEvaluationModal';

// src/components/academic-progress/index.ts - FICHIER D'EXPORTS CORRIGÉ

// Imports des composants corrigés
import AcademicStatsCards from './AcademicStatsCards';
import EvaluationFilters from './EvaluationFilters';
import EvaluationsList from './EvaluationsList';
import CreateEvaluationModal from './CreateEvaluationModal';

// Re-exports nommés pour compatibilité
export { default as AcademicStatsCards } from './AcademicStatsCards';
export { default as EvaluationFilters } from './EvaluationFilters';
export { default as EvaluationsList } from './EvaluationsList';
export { default as CreateEvaluationModal } from './CreateEvaluationModal';

// Export par défaut d'un objet contenant tous les composants
const AcademicProgressComponents = {
  AcademicStatsCards,
  EvaluationFilters,
  EvaluationsList,
  CreateEvaluationModal
};

export default AcademicProgressComponents;

// Re-export des types utiles depuis le fichier types
export type {
  AcademicEvaluation,
  CreateEvaluationData,
  StudentSelectOption,
  ClassSelectOption,
  SchoolYearSelectOption,
  EvaluationSearchFilters,
  AcademicStats,
  StudentInfo,
  DiagnosticResult
} from '../../types/academicProgress.types';