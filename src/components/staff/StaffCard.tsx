// src/components/staff/StaffCard.tsx - Carte individuelle pour un employé

import React from 'react';

// === INTERFACES ===

interface StaffStatus {
  active: 'active';
  inactive: 'inactive';
  on_leave: 'on_leave';
}

interface StaffPosition {
  teacher: 'teacher';
  admin: 'admin';
  secretary: 'secretary';
  accountant: 'accountant';
  guard: 'guard';
  cook: 'cook';
  cleaner: 'cleaner';
  driver: 'driver';
  nurse: 'nurse';
  librarian: 'librarian';
  it_support: 'it_support';
  maintenance: 'maintenance';
}

interface Staff {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  initials?: string;
  position?: keyof StaffPosition;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  status: keyof StaffStatus;
  photo_url?: string;
  qualifications?: string;
  notes?: string;
  assigned_classes_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface StaffCardProps {
  staff: Staff;
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  onView?: (staff: Staff) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

// === CONSTANTES ===

const STAFF_STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  on_leave: 'En congé'
};

// === COMPOSANT PRINCIPAL ===

const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
  className = ''
}) => {
  // Gestionnaires d'événements corrigés
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔧 Bouton Modifier cliqué pour:', staff.first_name, staff.last_name);
    if (onEdit) {
      onEdit(staff);
    } else {
      console.warn('⚠️ Fonction onEdit non définie');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🗑️ Bouton Désactiver cliqué pour:', staff.first_name, staff.last_name);
    if (onDelete) {
      onDelete(staff);
    } else {
      console.warn('⚠️ Fonction onDelete non définie');
    }
  };

  const handleView = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('👁️ Voir détails cliqué pour:', staff.first_name, staff.last_name);
    if (onView) {
      onView(staff);
    } else {
      console.warn('⚠️ Fonction onView non définie');
      // Fallback: afficher une alerte avec les infos
      alert(`Voir détails de ${staff.first_name} ${staff.last_name}\nID: ${staff.id}\nPoste: ${staff.position || 'Non spécifié'}`);
    }
  };

  const handleCardClick = () => {
    console.log('🖱️ Carte cliquée pour:', staff.first_name, staff.last_name);
    handleView();
  };

  const handleViewButtonClick = (e: React.MouseEvent) => {
    console.log('🔍 Bouton "Voir détails" cliqué');
    handleView(e);
  };

  // Helper pour obtenir la couleur du statut
  const getStatusColor = (status: keyof StaffStatus): string => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      on_leave: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Helper pour obtenir l'icône du poste
  const getPositionIcon = (position?: keyof StaffPosition): string => {
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

  // Helper pour obtenir le libellé du poste
  const getPositionLabel = (position?: keyof StaffPosition): string => {
    const labels = {
      teacher: 'Enseignant(e)',
      admin: 'Administrateur/trice',
      secretary: 'Secrétaire',
      accountant: 'Comptable',
      guard: 'Gardien(ne)',
      cook: 'Cuisinier(ère)',
      cleaner: 'Agent(e) d\'entretien',
      driver: 'Chauffeur',
      nurse: 'Infirmier(ère)',
      librarian: 'Bibliothécaire',
      it_support: 'Support informatique',
      maintenance: 'Maintenance'
    };
    return labels[position!] || position || 'Non spécifié';
  };

  // Helper pour obtenir le libellé du département
  const getDepartmentLabel = (department?: string): string => {
    const labels: Record<string, string> = {
      education: 'Éducation',
      administration: 'Administration',
      finance: 'Finance',
      security: 'Sécurité',
      food_service: 'Restauration',
      maintenance: 'Maintenance',
      transport: 'Transport',
      health: 'Santé',
      library: 'Bibliothèque',
      it: 'Informatique'
    };
    return labels[department!] || department || '';
  };

  // Helper pour calculer l'ancienneté
  const calculateYearsOfService = (hireDate?: string): number | null => {
    if (!hireDate) return null;
    const years = Math.floor((Date.now() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return years;
  };

  const yearsOfService = calculateYearsOfService(staff.hire_date);
  const fullName = staff.full_name || `${staff.first_name} ${staff.last_name}`;
  const initials = staff.initials || `${staff.first_name?.[0] || ''}${staff.last_name?.[0] || ''}`;

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Header avec photo et infos principales */}
      <div className={`p-${compact ? '4' : '6'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar ou initiales */}
            <div className="relative flex-shrink-0">
              {staff.photo_url ? (
                <img
                  src={staff.photo_url}
                  alt={fullName}
                  className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border-2 border-gray-100`}
                  onError={(e) => {
                    // Fallback si l'image ne charge pas
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback avatar avec initiales */}
              <div 
                className={`${compact ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm ${staff.photo_url ? 'hidden' : ''}`}
              >
                {initials}
              </div>
              
              {/* Badge position */}
              {!compact && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                  <span className="text-sm">{getPositionIcon(staff.position)}</span>
                </div>
              )}
            </div>

            {/* Nom et informations */}
            <div className="min-w-0 flex-1">
              <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors`}>
                {fullName}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {staff.staff_number}
              </p>
              {staff.position && (
                <p className="text-xs text-gray-500 truncate">
                  {getPositionLabel(staff.position)}
                </p>
              )}
            </div>
          </div>

          {/* Statut */}
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(staff.status)} flex-shrink-0`}>
            {STAFF_STATUS_LABELS[staff.status]}
          </span>
        </div>

        {/* Informations de contact et département */}
        {!compact && (
          <div className="space-y-2 mb-4">
            {staff.email && (
              <div className="flex items-center text-sm text-gray-600 group">
                <span className="mr-2 text-gray-400">📧</span>
                <a 
                  href={`mailto:${staff.email}`} 
                  className="hover:text-blue-600 truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {staff.email}
                </a>
              </div>
            )}
            
            {staff.phone && (
              <div className="flex items-center text-sm text-gray-600 group">
                <span className="mr-2 text-gray-400">📞</span>
                <a 
                  href={`tel:${staff.phone}`} 
                  className="hover:text-blue-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {staff.phone}
                </a>
              </div>
            )}

            {staff.department && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">🏢</span>
                <span className="truncate">{getDepartmentLabel(staff.department)}</span>
              </div>
            )}

            {yearsOfService !== null && yearsOfService > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">⏰</span>
                <span>{yearsOfService} an{yearsOfService > 1 ? 's' : ''} d'ancienneté</span>
              </div>
            )}
          </div>
        )}

        {/* Informations spéciales pour enseignants */}
        {staff.position === 'teacher' && staff.assigned_classes_count !== undefined && !compact && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-blue-700">
                <span className="mr-2">📚</span>
                <span className="font-medium">
                  {staff.assigned_classes_count} classe{staff.assigned_classes_count !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Indicateur de charge */}
              <div className="flex items-center space-x-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= (staff.assigned_classes_count || 0) 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions - CORRIGÉES */}
        {showActions && (
          <div className="flex space-x-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleViewButtonClick}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              👁️ Voir détails
            </button>
            
            {onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              >
                ✏️ Modifier
              </button>
            )}
            
            {onDelete && staff.status === 'active' && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                ❌ Désactiver
              </button>
            )}
          </div>
        )}
      </div>

      {/* Indicateur hover */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
};

export default StaffCard;