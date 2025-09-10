// src/components/staff/StaffDetails.tsx - Détails complets d'un employé

import React, { useState, useEffect } from 'react';

// === INTERFACES ===

interface StaffClass {
  id: string;
  name: string;
  type: string;
  level: string;
  capacity: number;
  is_active: boolean;
}

interface StaffDetailsType {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  initials?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'on_leave';
  photo_url?: string;
  qualifications?: string;
  notes?: string;
  assigned_classes?: StaffClass[];
  created_at?: string;
  updated_at?: string;
}

interface Staff {
  id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive' | 'on_leave';
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
}

interface StaffDetailsProps {
  staffId?: string;
  staff?: StaffDetailsType; // Permettre de passer directement les données
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  onBack?: () => void;
  showActions?: boolean;
}

interface InfoCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}

interface ClassCardProps {
  classData: StaffClass;
}

// === CONSTANTES ===

const STAFF_STATUS_LABELS = {
  active: 'Actif',
  inactive: 'Inactif',
  on_leave: 'En congé'
};

// === COMPOSANTS UTILITAIRES ===

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center mb-4">
      <span className="text-2xl mr-3">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string | null | undefined; type?: 'text' | 'email' | 'tel' | 'date' }> = ({ 
  label, 
  value, 
  type = 'text' 
}) => {
  if (!value) return null;

  const renderValue = () => {
    switch (type) {
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800 break-all">
            {value}
          </a>
        );
      case 'tel':
        return (
          <a href={`tel:${value}`} className="text-blue-600 hover:text-blue-800">
            {value}
          </a>
        );
      case 'date':
        try {
          return new Date(value).toLocaleDateString('fr-FR');
        } catch {
          return value; // Fallback si la date est invalide
        }
      default:
        return value;
    }
  };

  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900 text-right max-w-xs">{renderValue()}</span>
    </div>
  );
};

const ClassCard: React.FC<ClassCardProps> = ({ classData }) => {
  const getClassTypeIcon = (type: string) => {
    return type === 'coranic' ? '🕌' : '🇫🇷';
  };

  const getClassTypeLabel = (type: string) => {
    return type === 'coranic' ? 'Coranique' : 'Française';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className="text-xl mr-2">{getClassTypeIcon(classData.type)}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{classData.name}</h4>
            <p className="text-sm text-gray-600">
              {getClassTypeLabel(classData.type)} - Niveau {classData.level}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(classData.is_active)}`}>
          {classData.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Capacité:</span>
          <span className="font-medium">{classData.capacity} élèves</span>
        </div>
      </div>
    </div>
  );
};

// === SERVICE IMPORT ===
// Remplacer par votre vrai service
import { staffService } from '../../services/staffService';

// === COMPOSANT PRINCIPAL ===

const StaffDetails: React.FC<StaffDetailsProps> = ({
  staffId,
  staff: initialStaff,
  onEdit,
  onDelete,
  onBack,
  showActions = true
}) => {
  // États
  const [staff, setStaff] = useState<StaffDetailsType | null>(initialStaff || null);
  const [loading, setLoading] = useState(!initialStaff);
  const [error, setError] = useState<string | null>(null);

  // Charger les données si pas fournies directement
  useEffect(() => {
    if (initialStaff) {
      setStaff(initialStaff);
      setLoading(false);
      return;
    }

    if (!staffId) {
      setError('ID employé manquant');
      setLoading(false);
      return;
    }

    const fetchStaffDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 Chargement des détails pour l\'employé ID:', staffId);
        const response = await staffService.getStaffById(staffId);

        if (response.success && response.employee) {
          console.log('✅ Données employé chargées:', response.employee);
          setStaff(response.employee);
        } else {
          console.error('❌ Erreur API:', response.error);
          setError(response.error || 'Employé non trouvé');
        }
      } catch (err) {
        console.error('❌ Erreur réseau:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [staffId, initialStaff]);

  // Gestionnaires d'événements
  const handleEdit = () => {
    console.log('✏️ Édition demandée pour:', staff?.first_name, staff?.last_name);
    if (staff && onEdit) {
      onEdit(staff as Staff);
    }
  };

  const handleDelete = () => {
    console.log('🗑️ Suppression demandée pour:', staff?.first_name, staff?.last_name);
    if (staff && onDelete) {
      onDelete(staff as Staff);
    }
  };

  const handleBack = () => {
    console.log('⬅️ Retour demandé');
    if (onBack) {
      onBack();
    }
  };

  // Helper pour obtenir l'icône du poste
  const getPositionIcon = (position?: string) => {
    const icons: Record<string, string> = {
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
    return icons[position || ''] || '👤';
  };

  // Helper pour formater la position
  const getPositionLabel = (position?: string) => {
    const labels: Record<string, string> = {
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
    return labels[position || ''] || position;
  };

  // Helper pour formater le département
  const getDepartmentLabel = (department?: string) => {
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
    return labels[department || ''] || department;
  };

  // Helper pour calculer l'ancienneté
  const calculateYearsOfService = (hireDate?: string) => {
    if (!hireDate) return null;
    const years = Math.floor((Date.now() - new Date(hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(0, years); // Éviter les valeurs négatives
  };

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Chargement des détails...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-600 mr-2 text-xl">⚠️</span>
          <div>
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
          <div>
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            {onBack && (
              <button
                onClick={handleBack}
                className="mt-3 px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
              >
                ← Retour
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-medium text-gray-900">Employé non trouvé</h3>
        {onBack && (
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
          >
            ← Retour à la liste
          </button>
        )}
      </div>
    );
  }

  const yearsOfService = calculateYearsOfService(staff.hire_date);

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Informations principales */}
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                {staff.photo_url ? (
                  <img
                    src={staff.photo_url}
                    alt={staff.full_name || `${staff.first_name} ${staff.last_name}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
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
                  className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-semibold ${staff.photo_url ? 'hidden' : ''}`}
                >
                  {staff.initials || `${staff.first_name?.[0] || ''}${staff.last_name?.[0] || ''}`}
                </div>
                
                <div className="absolute -bottom-1 -right-1 text-2xl">
                  {getPositionIcon(staff.position)}
                </div>
              </div>

              {/* Nom et infos */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {staff.full_name || `${staff.first_name} ${staff.last_name}`}
                </h1>
                <p className="text-lg text-gray-600">{staff.staff_number}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {staff.position && (
                    <span className="text-sm text-gray-500">
                      {getPositionLabel(staff.position)}
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    staff.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                    staff.status === 'inactive' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  } border`}>
                    {STAFF_STATUS_LABELS[staff.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex space-x-2">
                {onBack && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ← Retour
                  </button>
                )}
                
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                )}
                
                {onDelete && staff.status === 'active' && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    ❌ Désactiver
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille des informations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <InfoCard title="Informations personnelles" icon="👤">
          <div className="space-y-1">
            <InfoRow label="Nom complet" value={`${staff.first_name} ${staff.last_name}`} />
            <InfoRow label="Email" value={staff.email} type="email" />
            <InfoRow label="Téléphone" value={staff.phone} type="tel" />
            <InfoRow label="Adresse" value={staff.address} />
          </div>
        </InfoCard>

        {/* Informations professionnelles */}
        <InfoCard title="Informations professionnelles" icon="💼">
          <div className="space-y-1">
            <InfoRow label="Numéro employé" value={staff.staff_number} />
            <InfoRow label="Poste" value={getPositionLabel(staff.position)} />
            <InfoRow label="Département" value={getDepartmentLabel(staff.department)} />
            <InfoRow label="Date d'embauche" value={staff.hire_date} type="date" />
            {yearsOfService !== null && yearsOfService >= 0 && (
              <InfoRow 
                label="Ancienneté" 
                value={`${yearsOfService} an${yearsOfService !== 1 ? 's' : ''}`} 
              />
            )}
            <InfoRow label="Statut" value={STAFF_STATUS_LABELS[staff.status]} />
          </div>
        </InfoCard>

        {/* Qualifications */}
        {staff.qualifications && (
          <InfoCard title="Qualifications et compétences" icon="🎓" className="lg:col-span-2">
            <p className="text-gray-700 whitespace-pre-wrap">{staff.qualifications}</p>
          </InfoCard>
        )}

        {/* Classes assignées (pour enseignants) */}
        {staff.position === 'teacher' && staff.assigned_classes && staff.assigned_classes.length > 0 && (
          <InfoCard 
            title={`Classes assignées (${staff.assigned_classes.length})`} 
            icon="📚" 
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.assigned_classes.map((classData) => (
                <ClassCard key={classData.id} classData={classData} />
              ))}
            </div>
          </InfoCard>
        )}

        {/* Notes */}
        {staff.notes && (
          <InfoCard title="Notes et remarques" icon="📝" className="lg:col-span-2">
            <p className="text-gray-700 whitespace-pre-wrap">{staff.notes}</p>
          </InfoCard>
        )}

        {/* Métadonnées */}
        <InfoCard title="Informations système" icon="ℹ️">
          <div className="space-y-1">
            <InfoRow label="Créé le" value={staff.created_at} type="date" />
            <InfoRow label="Modifié le" value={staff.updated_at} type="date" />
          </div>
        </InfoCard>
      </div>
    </div>
  );
};

export default StaffDetails;