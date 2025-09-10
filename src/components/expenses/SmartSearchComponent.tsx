// components/expenses/SmartSearchComponent.tsx - RECHERCHE INTELLIGENTE CORRIGÉE

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, Calendar, DollarSign, FileText, Layers, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ExpenseFilters, FilterOptions, SearchSuggestion } from '@/types/expense.types';
import { ExpenseService } from '@/services/expenseService';

interface SmartSearchProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: Partial<ExpenseFilters>) => void;
  isLoading?: boolean;
  filterOptions?: FilterOptions | null;
  categories?: Array<{ id: string; name: string; color: string; icon: string }>;
  statuses?: Array<{ id: string; name: string; color: string; icon: string }>;
}

// Hook de debounce personnalisé optimisé
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export function SmartSearchComponent({ 
  filters, 
  onFiltersChange, 
  isLoading = false,
  filterOptions,
  categories = [],
  statuses = []
}: SmartSearchProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [internalFilterOptions, setInternalFilterOptions] = useState<FilterOptions | null>(filterOptions || null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Valeur de recherche debounced
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // Charger les options de filtrage si pas fournies
  useEffect(() => {
    if (!filterOptions && !internalFilterOptions) {
      loadFilterOptions();
    } else if (filterOptions) {
      setInternalFilterOptions(filterOptions);
    }
  }, [filterOptions]);

  // Déclencher la recherche automatique quand la valeur debounced change
  useEffect(() => {
    if (debouncedSearchValue !== (filters.search || '')) {
      onFiltersChange({
        ...filters,
        search: debouncedSearchValue,
        page: 1
      });
    }
  }, [debouncedSearchValue]);

  // Fonction de chargement des options (mémorisée)
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await ExpenseService.getFilterOptions();
      if (response.success && response.data) {
        setInternalFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement options:', error);
    }
  }, []);

  // Fonction de récupération des suggestions (mémorisée)
  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await ExpenseService.getSearchSuggestions(query);
      if (response.success && response.data) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erreur suggestions:', error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  // Debounce pour les suggestions (différent de la recherche)
  const debouncedGetSuggestions = useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => getSuggestions(query), 300);
      };
    },
    [getSuggestions]
  );

  // Gestion du changement de recherche
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    
    if (value.trim()) {
      debouncedGetSuggestions(value.trim());
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Appliquer une suggestion
  const applySuggestion = (suggestion: SearchSuggestion) => {
    setSearchValue(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
    onFiltersChange({
      ...filters,
      search: suggestion.value,
      page: 1
    });
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    onFiltersChange({
      ...filters,
      search: '',
      page: 1
    });
  };

  // Changer de catégorie
  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category_id: categoryId === 'all' ? '' : categoryId,
      page: 1
    });
  };

  // Changer de statut
  const handleStatusChange = (statusId: string) => {
    onFiltersChange({
      ...filters,
      status_id: statusId === 'all' ? '' : statusId,
      page: 1
    });
  };

  // Effacer tous les filtres
  const clearAllFilters = () => {
    setSearchValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order
    });
  };

  // Déterminer le type de recherche
  const getSearchType = (value: string) => {
    if (/^\d{4}$/.test(value)) return 'year';
    if (/^\d+([.,]\d+)?$/.test(value)) return 'amount';
    return 'text';
  };

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'year': return Calendar;
      case 'amount': return DollarSign;
      default: return FileText;
    }
  };

  // Utiliser les options internes ou les props pour les filtres
  const availableCategories = internalFilterOptions?.categories || categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    icon: cat.icon
  }));

  const availableStatuses = internalFilterOptions?.statuses || statuses.map(status => ({
    id: status.id,
    name: status.name,
    color: status.color,
    icon: status.icon
  }));

  // S'assurer que "Toutes" est inclus
  const categoriesWithAll = availableCategories.some(cat => cat.id === 'all') 
    ? availableCategories 
    : [{ id: 'all', name: 'Toutes les catégories', color: '#6B7280', icon: 'Layers' }, ...availableCategories];

  const statusesWithAll = availableStatuses.some(status => status.id === 'all')
    ? availableStatuses
    : [{ id: 'all', name: 'Tous les statuts', color: '#6B7280', icon: 'List' }, ...availableStatuses];

  // Compter les filtres actifs
  const activeFiltersCount = [
    filters.search,
    filters.category_id,
    filters.status_id
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par description, montant, année, fournisseur..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            disabled={isLoading}
          />
          
          {/* Indicateur de type de recherche */}
          {searchValue && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {React.createElement(getSearchIcon(getSearchType(searchValue)), { className: "h-3 w-3 mr-1" })}
                {getSearchType(searchValue) === 'year' && 'Année'}
                {getSearchType(searchValue) === 'amount' && 'Montant'}
                {getSearchType(searchValue) === 'text' && 'Texte'}
              </span>
            </div>
          )}
          
          {/* Bouton effacer */}
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Suggestions de recherche */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 transition-all duration-200"
              >
                {React.createElement(getSearchIcon(suggestion.type), { className: "h-4 w-4 text-gray-400" })}
                <span className="flex-1 text-gray-900">{suggestion.value}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {suggestion.type === 'description' && 'Description'}
                  {suggestion.type === 'supplier' && 'Fournisseur'}
                  {suggestion.type === 'amount' && 'Montant'}
                  {suggestion.type === 'year' && 'Année'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Indicateur de chargement des suggestions */}
        {suggestionsLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>Recherche de suggestions...</span>
            </div>
          </div>
        )}
      </div>

      {/* Filtres et Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtre Catégorie */}
        <div className="relative">
          <select
            value={filters.category_id || 'all'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={isLoading}
            className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            {categoriesWithAll.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Layers className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtre Statut */}
        <div className="relative">
          <select
            value={filters.status_id || 'all'}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isLoading}
            className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            {statusesWithAll.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Bouton effacer filtres */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer ({activeFiltersCount})
          </button>
        )}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span>Recherche...</span>
          </div>
        )}
      </div>

      {/* Badges des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <Search className="h-3 w-3 mr-1" />
              "{filters.search}"
              <button
                onClick={() => handleSearchChange('')}
                className="ml-2 h-4 w-4 rounded-full hover:bg-blue-200 transition-all duration-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          
          {filters.category_id && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <Layers className="h-3 w-3 mr-1" />
              {categoriesWithAll.find(c => c.id === filters.category_id)?.name || 'Catégorie'}
              <button
                onClick={() => handleCategoryChange('all')}
                className="ml-2 h-4 w-4 rounded-full hover:bg-purple-200 transition-all duration-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          
          {filters.status_id && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <Filter className="h-3 w-3 mr-1" />
              {statusesWithAll.find(s => s.id === filters.status_id)?.name || 'Statut'}
              <button
                onClick={() => handleStatusChange('all')}
                className="ml-2 h-4 w-4 rounded-full hover:bg-green-200 transition-all duration-200"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Indicateurs de recherche */}
      {filters.search && (
        <div className="text-xs text-gray-500 flex items-center space-x-4">
          <span>💡 Conseils de recherche :</span>
          <span>• Tapez "2024" pour chercher par année</span>
          <span>• Tapez "1000" pour chercher par montant</span>
          <span>• Tapez "bureau" pour chercher dans les descriptions</span>
        </div>
      )}
    </div>
  );
}

export default SmartSearchComponent;