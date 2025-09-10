// src/components/academic-progress/EvaluationFilters.tsx - VERSION SIMPLIFIÉE ET CORRIGÉE

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Calendar, X, Filter, ChevronDown, Users, BookOpen, Star } from 'lucide-react';

// Types simplifiés pour les filtres
interface EvaluationFilters {
  student_id?: string;
  student_name?: string;
  school_year_id?: string;
  class_id?: string;
  sourate_name?: string;
  grade_min?: number;
  grade_max?: number;
  memorization_status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

interface StudentOption {
  id: string;
  display_name: string;
}

interface ClassOption {
  id: string;
  display_name: string;
}

interface SchoolYearOption {
  id: string;
  display_name: string;
}

interface EvaluationFiltersProps {
  filters: EvaluationFilters;
  onUpdateFilter: (key: keyof EvaluationFilters, value: any) => void;
  onUpdateFilters: (filters: Partial<EvaluationFilters>) => void;
  onResetFilters: () => void;
  resultCount: number;
  students?: StudentOption[];
  classes?: ClassOption[];
  schoolYears?: SchoolYearOption[];
  loading?: boolean;
}

const EvaluationFiltersComponent: React.FC<EvaluationFiltersProps> = ({
  filters,
  onUpdateFilter,
  onUpdateFilters,
  onResetFilters,
  resultCount,
  students = [],
  classes = [],
  schoolYears = [],
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // États locaux pour les recherches avec debounce
  const [localStudentSearch, setLocalStudentSearch] = useState(filters.student_name || '');
  const [localSourateSearch, setLocalSourateSearch] = useState(filters.sourate_name || '');
  
  // Refs pour les timeouts de debounce
  const studentSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sourateSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce pour la recherche d'étudiant
  const debouncedStudentSearch = useCallback((value: string) => {
    if (studentSearchTimeoutRef.current) {
      clearTimeout(studentSearchTimeoutRef.current);
    }
    
    studentSearchTimeoutRef.current = setTimeout(() => {
      handleFilterChange('student_name', value.trim() || undefined);
    }, 500); // 500ms de délai
  }, []);

  // Debounce pour la recherche de sourate
  const debouncedSourateSearch = useCallback((value: string) => {
    if (sourateSearchTimeoutRef.current) {
      clearTimeout(sourateSearchTimeoutRef.current);
    }
    
    sourateSearchTimeoutRef.current = setTimeout(() => {
      handleFilterChange('sourate_name', value.trim() || undefined);
    }, 500); // 500ms de délai
  }, []);

  // Gestionnaires de changement optimisés
  const handleStudentSearchChange = useCallback((value: string) => {
    setLocalStudentSearch(value);
    debouncedStudentSearch(value);
  }, [debouncedStudentSearch]);

  const handleSourateSearchChange = useCallback((value: string) => {
    setLocalSourateSearch(value);
    debouncedSourateSearch(value);
  }, [debouncedSourateSearch]);

  // Nettoyage des timeouts
  React.useEffect(() => {
    return () => {
      if (studentSearchTimeoutRef.current) {
        clearTimeout(studentSearchTimeoutRef.current);
      }
      if (sourateSearchTimeoutRef.current) {
        clearTimeout(sourateSearchTimeoutRef.current);
      }
    };
  }, []);

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      // Ignorer pagination et tri par défaut
      if (['page', 'limit'].includes(key)) return false;
      if (key === 'sort_by' && value === 'evaluation_date') return false;
      if (key === 'sort_order' && value === 'DESC') return false;
      
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  // Réinitialiser la page quand on change les filtres
  const handleFilterChange = (key: keyof EvaluationFilters, value: any) => {
    const updates: Partial<EvaluationFilters> = { [key]: value };
    if (key !== 'page') {
      updates.page = 1; // Reset à la page 1 quand on change un filtre
    }
    onUpdateFilters(updates);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 p-6 mb-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Filtres de recherche</h3>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mt-1 inline-block">
                {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50"
        >
          Avancé
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Recherches principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Recherche étudiant */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Rechercher un étudiant
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Nom, prénom, numéro..."
              value={localStudentSearch}
              onChange={(e) => handleStudentSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm bg-white/80"
            />
            {localStudentSearch && (
              <button
                onClick={() => {
                  setLocalStudentSearch('');
                  handleFilterChange('student_name', undefined);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recherche sourate */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Rechercher une sourate
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Nom de la sourate..."
              value={localSourateSearch}
              onChange={(e) => handleSourateSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm bg-white/80"
            />
            {localSourateSearch && (
              <button
                onClick={() => {
                  setLocalSourateSearch('');
                  handleFilterChange('sourate_name', undefined);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtres de base - VERSION SIMPLIFIÉE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Étudiant spécifique */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Étudiant spécifique
          </label>
          <div className="relative">
            <select
              value={filters.student_id || ''}
              onChange={(e) => handleFilterChange('student_id', e.target.value || undefined)}
              disabled={loading || students.length === 0}
              className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 pr-10"
            >
              <option value="">Tous les étudiants</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Classe */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Classe
          </label>
          <div className="relative">
            <select
              value={filters.class_id || ''}
              onChange={(e) => handleFilterChange('class_id', e.target.value || undefined)}
              disabled={loading}
              className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 pr-10"
            >
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Tri */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Tri
          </label>
          <div className="relative">
            <select
              value={`${filters.sort_by || 'evaluation_date'}_${filters.sort_order || 'DESC'}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('_');
                onUpdateFilters({
                  sort_by: sort_by as any,
                  sort_order: sort_order as 'ASC' | 'DESC'
                });
              }}
              className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10"
            >
              <option value="evaluation_date_DESC">Plus récent</option>
              <option value="evaluation_date_ASC">Plus ancien</option>
              <option value="overall_grade_DESC">Meilleure note</option>
              <option value="overall_grade_ASC">Note la plus faible</option>
              <option value="student_name_ASC">Nom A-Z</option>
              <option value="student_name_DESC">Nom Z-A</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filtres avancés - VERSION SIMPLIFIÉE */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres avancés
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Année scolaire */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Année scolaire
              </label>
              <div className="relative">
                <select
                  value={filters.school_year_id || ''}
                  onChange={(e) => handleFilterChange('school_year_id', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-50 pr-10"
                >
                  <option value="">Toutes les années</option>
                  {schoolYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.display_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Statut de mémorisation */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Statut de mémorisation
              </label>
              <div className="relative">
                <select
                  value={filters.memorization_status || ''}
                  onChange={(e) => handleFilterChange('memorization_status', e.target.value || undefined)}
                  className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10"
                >
                  <option value="">Tous les statuts</option>
                  <option value="non_commence">Non commencé</option>
                  <option value="en_cours">En cours</option>
                  <option value="memorise">Mémorisé</option>
                  <option value="perfectionne">Perfectionné</option>
                  <option value="a_reviser">À réviser</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Nombre par page */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Éléments par page
              </label>
              <div className="relative">
                <select
                  value={filters.limit || 8}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10"
                >
                  <option value={5}>5 par page</option>
                  <option value={8}>8 par page</option>
                  <option value={12}>12 par page</option>
                  <option value={20}>20 par page</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Filtres par notes - SIMPLIFIÉS */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-600 mb-3">
              Niveau de performance
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onUpdateFilters({ grade_min: 16, grade_max: 20 })}
                className={`px-3 py-2 text-sm rounded-lg transition-colors border ${
                  filters.grade_min === 16 && filters.grade_max === 20
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1 text-green-500" />
                Excellent (16-20)
              </button>
              
              <button
                onClick={() => onUpdateFilters({ grade_min: 14, grade_max: 15.99 })}
                className={`px-3 py-2 text-sm rounded-lg transition-colors border ${
                  filters.grade_min === 14 && filters.grade_max === 15.99
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1 text-blue-500" />
                Bien (14-16)
              </button>
              
              <button
                onClick={() => onUpdateFilters({ grade_min: 0, grade_max: 11.99 })}
                className={`px-3 py-2 text-sm rounded-lg transition-colors border ${
                  filters.grade_min === 0 && filters.grade_max === 11.99
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1 text-red-500" />
                À améliorer (&lt;12)
              </button>

              {(filters.grade_min !== undefined || filters.grade_max !== undefined) && (
                <button
                  onClick={() => onUpdateFilters({ grade_min: undefined, grade_max: undefined })}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Effacer filtre notes
                </button>
              )}
            </div>
          </div>

          {/* Filtres de dates - SIMPLIFIÉS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Boutons rapides pour les dates */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                onUpdateFilters({
                  date_from: start.toISOString().split('T')[0],
                  date_to: end.toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Ce mois
            </button>
            
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setDate(now.getDate() - 30);
                onUpdateFilters({
                  date_from: start.toISOString().split('T')[0],
                  date_to: now.toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              30 derniers jours
            </button>

            {(filters.date_from || filters.date_to) && (
              <button
                onClick={() => onUpdateFilters({ date_from: undefined, date_to: undefined })}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                Effacer dates
              </button>
            )}
          </div>
        </div>
      )}

      {/* Résumé et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">
              {resultCount.toLocaleString('fr-FR')} résultat{resultCount !== 1 ? 's' : ''}
            </span>
          </div>
          {activeFiltersCount > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-blue-600 font-medium">
                {activeFiltersCount} filtre{activeFiltersCount !== 1 ? 's' : ''} actif{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-blue-50"
          >
            <X className="w-4 h-4" />
            Effacer tous les filtres
          </button>
        )}
      </div>
    </div>
  );
};

export default EvaluationFiltersComponent;