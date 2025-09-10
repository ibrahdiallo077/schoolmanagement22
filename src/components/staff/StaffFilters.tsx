// src/components/staff/StaffFilters.tsx - Composant filtres de recherche pour le personnel

import React, { useState, useEffect } from 'react';
import { StaffListParams, PositionOption, DepartmentOption } from '../../types/staff.types';
import { staffService } from '../../services/staffService';

// === INTERFACES ===

interface StaffFiltersProps {
  filters: StaffListParams;
  onFiltersChange: (filters: StaffListParams) => void;
  loading?: boolean;
  showAdvancedFilters?: boolean;
}

// === COMPOSANT PRINCIPAL ===

const StaffFilters: React.FC<StaffFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false,
  showAdvancedFilters = true
}) => {
  // États pour les options des selects
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Charger les options pour les selects
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [positionsRes, departmentsRes] = await Promise.all([
          staffService.getPositions(),
          staffService.getDepartments()
        ]);

        if (positionsRes.success) {
          setPositions(positionsRes.positions);
        }

        if (departmentsRes.success) {
          setDepartments(departmentsRes.departments);
        }
      } catch (error) {
        console.error('Erreur chargement options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Gestionnaire de changement des filtres
  const handleFilterChange = (key: keyof StaffListParams, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
      page: 1 // Reset à la page 1 quand on change les filtres
    });
  };

  // Reset des filtres
  const resetFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit || 20,
      search: '',
      position: '',
      department: '',
      status: ''
    });
    setShowAdvanced(false);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = Boolean(
    filters.search || 
    filters.position || 
    filters.department || 
    filters.status
  );

  // Vérifier si des filtres avancés sont actifs
  const hasAdvancedFilters = Boolean(
    filters.position || 
    filters.department || 
    filters.status
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header avec titre et toggle avancé */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Filtres de recherche</h3>
          
          <div className="flex items-center space-x-3">
            {/* Compteur filtres actifs */}
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {[filters.search, filters.position, filters.department, filters.status]
                  .filter(Boolean).length} filtre{[filters.search, filters.position, filters.department, filters.status]
                  .filter(Boolean).length > 1 ? 's' : ''} actif{[filters.search, filters.position, filters.department, filters.status]
                  .filter(Boolean).length > 1 ? 's' : ''}
              </span>
            )}

            {/* Toggle filtres avancés */}
            {showAdvancedFilters && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${
                  showAdvanced || hasAdvancedFilters
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {showAdvanced ? 'Masquer' : 'Filtres avancés'}
                <span className="ml-1">
                  {showAdvanced ? '▲' : '▼'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu des filtres */}
      <div className="p-6">
        {/* Recherche principale - toujours visible */}
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Rechercher par nom, numéro, email, téléphone..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            
            {/* Bouton clear pour la recherche */}
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtres avancés */}
        {(showAdvanced || hasAdvancedFilters) && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Poste */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Poste
                </label>
                <select
                  id="position"
                  value={filters.position || ''}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                  disabled={loading || loadingOptions}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                >
                  <option value="">Tous les postes</option>
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Département */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Département
                </label>
                <select
                  id="department"
                  value={filters.department || ''}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  disabled={loading || loadingOptions}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                >
                  <option value="">Tous les départements</option>
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  id="status"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="on_leave">En congé</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            {loadingOptions ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                Chargement des options...
              </span>
            ) : (
              `${positions.length} postes • ${departments.length} départements disponibles`
            )}
          </div>

          {/* Bouton reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex items-center"
            >
              <span className="mr-2">🔄</span>
              Réinitialiser
            </button>
          )}
        </div>

        {/* Raccourcis filtres rapides */}
        {!hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200 mt-4">
            <p className="text-sm text-gray-600 mb-3">Filtres rapides :</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('position', 'teacher')}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              >
                👨‍🏫 Enseignants
              </button>
              <button
                onClick={() => handleFilterChange('status', 'active')}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
              >
                ✅ Actifs seulement
              </button>
              <button
                onClick={() => handleFilterChange('department', 'education')}
                className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
              >
                🎓 Éducation
              </button>
              <button
                onClick={() => handleFilterChange('position', 'admin')}
                className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-full transition-colors"
              >
                👨‍💼 Administration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffFilters;