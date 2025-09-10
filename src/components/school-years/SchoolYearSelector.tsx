// src/components/school-years/SchoolYearSelector.tsx - Sélecteur d'année scolaire pour formulaires

import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Star, 
  AlertCircle, 
  RefreshCw,
  Plus
} from 'lucide-react';
import { SchoolYearOption } from '../../types/schoolyear.types';
import { useSchoolYearSelector } from '../../hooks/useSchool';

interface SchoolYearSelectorProps {
  value?: string | null;
  onChange: (schoolYearId: string | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showCurrent?: boolean;
  includePast?: boolean;
  allowEmpty?: boolean;
  className?: string;
  onCreateNew?: () => void;
}

const SchoolYearSelector: React.FC<SchoolYearSelectorProps> = ({
  value,
  onChange,
  placeholder = "Sélectionner une année scolaire",
  error,
  disabled = false,
  required = false,
  showCurrent = true,
  includePast = false,
  allowEmpty = true,
  className = '',
  onCreateNew
}) => {
  const { options, isLoading, refresh } = useSchoolYearSelector();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<SchoolYearOption[]>([]);

  // Filtrer les options selon les props
  useEffect(() => {
    let filtered = [...options];

    // Filtrer les années passées si nécessaire
    if (!includePast) {
      const now = new Date();
      filtered = filtered.filter(option => new Date(option.end_date) >= now);
    }

    // Trier : année courante en premier, puis par date de début décroissante
    filtered.sort((a, b) => {
      if (a.is_current && !b.is_current) return -1;
      if (!a.is_current && b.is_current) return 1;
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });

    setFilteredOptions(filtered);
  }, [options, includePast]);

  const selectedOption = filteredOptions.find(option => option.id === value);

  const handleSelect = (option: SchoolYearOption | null) => {
    onChange(option ? option.id : null);
    setIsOpen(false);
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refresh();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Sélecteur principal */}
      <div
        className={`
          relative w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-gray-500 text-sm">Chargement...</span>
              </div>
            ) : selectedOption ? (
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {selectedOption.is_current && (
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
                <span className="text-gray-900 truncate">{selectedOption.display_name}</span>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-2">
            {!disabled && (
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Actualiser la liste"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Menu déroulant */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Option vide si autorisée */}
          {allowEmpty && (
            <div
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onClick={() => handleSelect(null)}
            >
              <span className="text-gray-500">{placeholder}</span>
            </div>
          )}

          {/* Options d'années scolaires */}
          {filteredOptions.length > 0 ? (
            <>
              {/* Année courante d'abord */}
              {showCurrent && filteredOptions.filter(option => option.is_current).map(option => (
                <div
                  key={option.id}
                  className={`
                    px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between
                    ${value === option.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                  `}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{option.name}</span>
                    <span className="text-xs text-gray-500">(Actuelle)</span>
                  </div>
                  {value === option.id && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              ))}

              {/* Séparateur si il y a une année courante */}
              {showCurrent && filteredOptions.some(o => o.is_current) && filteredOptions.some(o => !o.is_current) && (
                <div className="border-t border-gray-200"></div>
              )}

              {/* Autres années */}
              {filteredOptions.filter(option => !option.is_current).map(option => (
                <div
                  key={option.id}
                  className={`
                    px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between
                    ${value === option.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                  `}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{option.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(option.end_date) < new Date() ? '(Terminée)' : 
                       new Date(option.start_date) > new Date() ? '(Future)' : ''}
                    </span>
                  </div>
                  {value === option.id && (
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-6 text-center text-gray-500">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Aucune année scolaire disponible</p>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateNew();
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Créer une année scolaire
                </button>
              )}
            </div>
          )}

          {/* Option pour créer une nouvelle année */}
          {onCreateNew && filteredOptions.length > 0 && (
            <>
              <div className="border-t border-gray-200"></div>
              <div
                className="px-3 py-2 hover:bg-green-50 cursor-pointer text-green-700 font-medium"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Créer une nouvelle année</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-1 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      {/* Indicateur requis */}
      {required && !value && (
        <div className="mt-1 text-xs text-gray-500">
          Champ obligatoire
        </div>
      )}

      {/* Informations sur l'année sélectionnée */}
      {selectedOption && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
          <div className="flex items-center justify-between">
            <span>
              {new Date(selectedOption.start_date).toLocaleDateString('fr-FR')} 
              {' → '}
              {new Date(selectedOption.end_date).toLocaleDateString('fr-FR')}
            </span>
            {selectedOption.is_current && (
              <span className="text-yellow-600 font-medium">Année courante</span>
            )}
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// === COMPOSANT SIMPLIFIÉ POUR CASES D'USAGE BASIQUES ===
interface SimpleSchoolYearSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export const SimpleSchoolYearSelector: React.FC<SimpleSchoolYearSelectorProps> = ({
  value,
  onChange,
  label,
  placeholder = "Choisir une année scolaire",
  required = false,
  error,
  className = ''
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <SchoolYearSelector
        value={value}
        onChange={(id) => onChange(id || '')}
        placeholder={placeholder}
        error={error}
        required={required}
        allowEmpty={!required}
      />
    </div>
  );
};

export default SchoolYearSelector;