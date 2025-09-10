// src/components/staff/StaffList.tsx - Composant liste du personnel

import React, { useState, useEffect } from 'react';
import {
  Staff,
  StaffListParams,
  StaffStatus,
  StaffPosition,
  StaffDepartment,
  STAFF_STATUS_LABELS,
  STAFF_STATUS_COLORS
} from '../../types/staff.types';
import { staffService } from '../../services/staffService';

// === INTERFACES ===

interface StaffListProps {
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  showActions?: boolean;
}

interface StaffCardProps {
  staff: Staff;
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  showActions?: boolean;
}

// === COMPOSANT CARTE EMPLOYÉ ===

const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  onEdit,
  onDelete,
  onView,
  showActions = true
}) => {
  const handleEdit = () => onEdit?.(staff);
  const handleDelete = () => onDelete?.(staff);
  const handleView = () => onView?.(staff);

  const getStatusColor = (status: StaffStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPositionIcon = (position?: StaffPosition) => {
    const icons = {
      teacher: '👨‍🏫',
      admin: '👨‍💼',
      secretary: '📋',
      accountant: '💰',
      guard: '👮‍♂️',
      cook: '👨‍🍳',
      cleaner: '🧹',
      driver: '🚗',
      nurse: '👩‍⚕️',
      librarian: '📚',
      it_support: '💻',
      maintenance: '🔧'
    };
    return icons[position!] || '👤';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header avec photo et infos principales */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Avatar ou initiales */}
          <div className="relative">
            {staff.photo_url ? (
              <img
                src={staff.photo_url}
                alt={staff.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {staff.initials || `${staff.first_name[0]}${staff.last_name[0]}`}
              </div>
            )}
            
            {/* Icône position */}
            <div className="absolute -bottom-1 -right-1 text-lg">
              {getPositionIcon(staff.position)}
            </div>
          </div>

          {/* Nom et informations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {staff.full_name || `${staff.first_name} ${staff.last_name}`}
            </h3>
            <p className="text-sm text-gray-600">
              {staff.staff_number}
            </p>
            {staff.position && (
              <p className="text-sm text-gray-500 capitalize">
                {staff.position.replace('_', ' ')}
              </p>
            )}
          </div>
        </div>

        {/* Statut */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(staff.status)}`}>
          {STAFF_STATUS_LABELS[staff.status]}
        </span>
      </div>

      {/* Informations de contact */}
      <div className="space-y-2 mb-4">
        {staff.email && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📧</span>
            <a href={`mailto:${staff.email}`} className="hover:text-blue-600">
              {staff.email}
            </a>
          </div>
        )}
        
        {staff.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📞</span>
            <a href={`tel:${staff.phone}`} className="hover:text-blue-600">
              {staff.phone}
            </a>
          </div>
        )}

        {staff.department && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">🏢</span>
            <span className="capitalize">{staff.department.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Informations spéciales pour enseignants */}
      {staff.position === 'teacher' && staff.assigned_classes_count !== undefined && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-sm text-blue-700">
            <span className="mr-2">📚</span>
            <span>
              {staff.assigned_classes_count} classe{staff.assigned_classes_count !== 1 ? 's' : ''} assignée{staff.assigned_classes_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <button
            onClick={handleView}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            Voir détails
          </button>
          
          {onEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
            >
              Modifier
            </button>
          )}
          
          {onDelete && staff.status === 'active' && (
            <button
              onClick={handleDelete}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Désactiver
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// === COMPOSANT FILTRES ===

interface StaffFiltersProps {
  filters: StaffListParams;
  onFiltersChange: (filters: StaffListParams) => void;
  loading?: boolean;
}

const StaffFilters: React.FC<StaffFiltersProps> = ({
  filters,
  onFiltersChange,
  loading = false
}) => {
  const [positions, setPositions] = useState<Array<{value: string, label: string}>>([]);
  const [departments, setDepartments] = useState<Array<{value: string, label: string}>>([]);

  // Charger les listes pour les selects
  useEffect(() => {
    const loadOptions = async () => {
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
      }
    };

    loadOptions();
  }, []);

  const handleFilterChange = (key: keyof StaffListParams, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1 // Reset à la page 1 quand on change les filtres
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 20,
      search: '',
      position: '',
      department: '',
      status: ''
    });
  };

  const hasActiveFilters = filters.search || filters.position || filters.department || filters.status;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Recherche */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Rechercher par nom, numéro, email..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Position */}
        <div className="min-w-48">
          <select
            value={filters.position || ''}
            onChange={(e) => handleFilterChange('position', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
        <div className="min-w-48">
          <select
            value={filters.department || ''}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
        <div className="min-w-36">
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="on_leave">En congé</option>
          </select>
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
};

// === COMPOSANT PRINCIPAL LISTE ===

const StaffList: React.FC<StaffListProps> = ({
  onEdit,
  onDelete,
  onView,
  showActions = true
}) => {
  // États
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StaffListParams>({
    page: 1,
    limit: 20,
    search: '',
    position: '',
    department: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 0
  });

  // Charger les données
  const fetchStaff = async (newFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await staffService.getStaffList(newFilters);

      if (response.success) {
        setStaff(response.staff);
        setPagination(response.pagination);
      } else {
        setError(response.error);
        setStaff([]);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données au montage et lors des changements de filtres
  useEffect(() => {
    fetchStaff(filters);
  }, [filters]);

  // Gestionnaire changement de filtres
  const handleFiltersChange = (newFilters: StaffListParams) => {
    setFilters(newFilters);
  };

  // Gestionnaire pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Refetch après actions
  const refetch = () => {
    fetchStaff();
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <StaffFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Résultats */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header avec compteur */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Personnel
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({pagination.total_items} employé{pagination.total_items !== 1 ? 's' : ''})
                </span>
              )}
            </h2>

            {loading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Chargement...
              </div>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
                <button
                  onClick={refetch}
                  className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {!loading && !error && staff.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-gray-500">
                {filters.search || filters.position || filters.department || filters.status
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Commencez par ajouter des employés à votre équipe.'}
              </p>
            </div>
          )}

          {/* Grille des cartes */}
          {staff.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => (
                <StaffCard
                  key={member.id}
                  staff={member}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  showActions={showActions}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} sur{' '}
                {pagination.total_items} résultats
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1 || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>

                {/* Pages */}
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const page = i + Math.max(1, pagination.current_page - 2);
                  if (page > pagination.total_pages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === pagination.current_page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      } disabled:opacity-50`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.total_pages || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffList;