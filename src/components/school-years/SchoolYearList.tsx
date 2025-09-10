// src/components/school-years/SchoolYearList.tsx - Liste des années scolaires

import React, { useState, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Archive, 
  Users, 
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { SchoolYear } from '../../types/schoolyear.types';
import useSchoolYear from '../../hooks/useSchool';

interface SchoolYearListProps {
  onEdit?: (schoolYear: SchoolYear) => void;
  onDelete?: (schoolYear: SchoolYear) => void;
  onSetCurrent?: (schoolYear: SchoolYear) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const SchoolYearList: React.FC<SchoolYearListProps> = ({
  onEdit,
  onDelete,
  onSetCurrent,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const {
    schoolYears,
    currentYear,
    isLoading,
    error,
    setCurrentSchoolYear,
    deleteSchoolYear,
    archiveSchoolYear,
    refresh,
    clearError,
    utils
  } = useSchoolYear();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingCurrentId, setSettingCurrentId] = useState<string | null>(null);

  // Gérer la définition comme année courante
  const handleSetCurrent = useCallback(async (schoolYear: SchoolYear) => {
    try {
      setSettingCurrentId(schoolYear.id);
      await setCurrentSchoolYear(schoolYear.id);
      onSetCurrent?.(schoolYear);
    } catch (error) {
      console.error('Erreur définition année courante:', error);
    } finally {
      setSettingCurrentId(null);
    }
  }, [setCurrentSchoolYear, onSetCurrent]);

  // Gérer la suppression
  const handleDelete = useCallback(async (schoolYear: SchoolYear) => {
    const canDeleteResult = utils.canDelete(schoolYear);
    
    if (!canDeleteResult.canDelete) {
      alert(canDeleteResult.reason);
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'année scolaire "${schoolYear.name}" ?`)) {
      try {
        setDeletingId(schoolYear.id);
        await deleteSchoolYear(schoolYear.id);
        onDelete?.(schoolYear);
      } catch (error) {
        console.error('Erreur suppression:', error);
      } finally {
        setDeletingId(null);
      }
    }
  }, [deleteSchoolYear, onDelete, utils]);

  // Gérer l'archivage
  const handleArchive = useCallback(async (schoolYear: SchoolYear) => {
    if (window.confirm(`Êtes-vous sûr de vouloir archiver l'année scolaire "${schoolYear.name}" ?`)) {
      try {
        await archiveSchoolYear(schoolYear.id);
        refresh();
      } catch (error) {
        console.error('Erreur archivage:', error);
      }
    }
  }, [archiveSchoolYear, refresh]);

  // Obtenir l'icône du statut
  const getStatusIcon = (schoolYear: SchoolYear) => {
    const { status } = utils.getStatus(schoolYear);
    
    switch (status) {
      case 'En cours':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Future':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Terminée':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-purple-500" />;
    }
  };

  // Affichage du chargement
  if (isLoading && schoolYears.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Chargement des années scolaires...</span>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={refresh}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
          >
            Réessayer
          </button>
          <button
            onClick={clearError}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Liste vide
  if (schoolYears.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune année scolaire</h3>
        <p className="text-gray-600">Commencez par créer votre première année scolaire.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Année courante en premier si elle existe */}
      {currentYear && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            Année scolaire courante
          </h4>
          <SchoolYearCard
            schoolYear={currentYear}
            onEdit={onEdit}
            onDelete={handleDelete}
            onSetCurrent={handleSetCurrent}
            showActions={showActions}
            compact={compact}
            isDeleting={deletingId === currentYear.id}
            isSettingCurrent={settingCurrentId === currentYear.id}
            utils={utils}
            isCurrent={true}
          />
        </div>
      )}

      {/* Autres années scolaires */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Toutes les années scolaires ({schoolYears.length})
        </h4>
        <div className="space-y-3">
          {schoolYears
            .filter(sy => !sy.is_current) // Exclure l'année courante déjà affichée
            .map(schoolYear => (
              <SchoolYearCard
                key={schoolYear.id}
                schoolYear={schoolYear}
                onEdit={onEdit}
                onDelete={handleDelete}
                onSetCurrent={handleSetCurrent}
                showActions={showActions}
                compact={compact}
                isDeleting={deletingId === schoolYear.id}
                isSettingCurrent={settingCurrentId === schoolYear.id}
                utils={utils}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

// === COMPOSANT CARTE ANNÉE SCOLAIRE ===
interface SchoolYearCardProps {
  schoolYear: SchoolYear;
  onEdit?: (schoolYear: SchoolYear) => void;
  onDelete?: (schoolYear: SchoolYear) => void;
  onSetCurrent?: (schoolYear: SchoolYear) => void;
  showActions?: boolean;
  compact?: boolean;
  isDeleting?: boolean;
  isSettingCurrent?: boolean;
  isCurrent?: boolean;
  utils: any;
}

const SchoolYearCard: React.FC<SchoolYearCardProps> = ({
  schoolYear,
  onEdit,
  onDelete,
  onSetCurrent,
  showActions = true,
  compact = false,
  isDeleting = false,
  isSettingCurrent = false,
  isCurrent = false,
  utils
}) => {
  const { status, color } = utils.getStatus(schoolYear);
  const progress = utils.getProgress(schoolYear);
  const canDeleteResult = utils.canDelete(schoolYear);

  const statusColors = {
    'success': 'bg-green-100 text-green-800 border-green-200',
    'info': 'bg-blue-100 text-blue-800 border-blue-200',
    'secondary': 'bg-gray-100 text-gray-800 border-gray-200',
    'primary': 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className={`
      bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md
      ${isCurrent ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}
      ${compact ? 'p-3' : 'p-4'}
    `}>
      <div className="flex items-start justify-between">
        {/* Informations principales */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              {schoolYear.name}
            </h3>
            
            {isCurrent && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Actuelle
              </span>
            )}
            
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
              ${statusColors[color as keyof typeof statusColors] || statusColors.secondary}
            `}>
              {status}
            </span>
          </div>

          {/* Dates et progression */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {schoolYear.start_date_formatted} - {schoolYear.end_date_formatted}
            </span>
            
            {progress !== null && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {progress}% terminé
              </span>
            )}
          </div>

          {/* Barre de progression */}
          {progress !== null && !compact && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Statistiques */}
          {!compact && (schoolYear.total_students !== undefined || schoolYear.total_classes !== undefined) && (
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              {schoolYear.total_students !== undefined && (
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {schoolYear.total_students} étudiant{schoolYear.total_students !== 1 ? 's' : ''}
                </span>
              )}
              
              {schoolYear.total_classes !== undefined && (
                <span className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {schoolYear.total_classes} classe{schoolYear.total_classes !== 1 ? 's' : ''}
                </span>
              )}
              
              {schoolYear.occupancy_rate !== undefined && (
                <span className="text-gray-500">
                  Taux d'occupation: {schoolYear.occupancy_rate}%
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {schoolYear.description && !compact && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {schoolYear.description}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {!isCurrent && (
              <button
                onClick={() => onSetCurrent?.(schoolYear)}
                disabled={isSettingCurrent}
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                title="Définir comme année courante"
              >
                {isSettingCurrent ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                ) : (
                  <Star className="w-4 h-4" />
                )}
              </button>
            )}
            
            <button
              onClick={() => onEdit?.(schoolYear)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onDelete?.(schoolYear)}
              disabled={!canDeleteResult.canDelete || isDeleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={canDeleteResult.canDelete ? "Supprimer" : canDeleteResult.reason}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolYearList;