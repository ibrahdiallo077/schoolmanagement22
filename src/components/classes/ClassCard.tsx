import React from 'react';
import { 
  GraduationCap, 
  Users, 
  DollarSign, 
  Calendar, 
  User, 
  Star, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';

// ===== INTERFACES =====
interface ClassData {
  id: string;
  name: string;
  level: string;
  type: 'coranic' | 'french';
  description?: string;
  capacity: number;
  teacher_id?: string;
  teacher_name?: string;
  monthly_fee: number;
  is_active: boolean;
  school_year_id?: string;
  created_at: string;
  updated_at?: string;
  
  // Données calculées
  current_students?: number;
  available_spots?: number;
  occupancy_rate?: number;
  male_students?: number;
  female_students?: number;
  status_display?: string;
  status_color?: string;
  type_display?: string;
  
  // Relations
  school_year?: {
    id: string;
    name: string;
    is_current: boolean;
  };
  teacher?: {
    id: string;
    staff_number: string;
    first_name: string;
    last_name: string;
    position: string;
  };
}

interface ClassCardProps {
  classData: ClassData;
  onEdit?: (classData: ClassData) => void;
  onDelete?: (classData: ClassData) => void;
  onView?: (classData: ClassData) => void;
  onDuplicate?: (classData: ClassData) => void;
  compact?: boolean;
  showActions?: boolean;
  className?: string;
}

// ===== COMPOSANTS UTILITAIRES =====
const StatusBadge: React.FC<{ status: string; color: string }> = ({ status, color }) => {
  const configs = {
    'success': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'warning': 'bg-amber-100 text-amber-700 border-amber-200',
    'danger': 'bg-red-100 text-red-700 border-red-200',
    'secondary': 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const statusIcons = {
    'Disponible': <CheckCircle className="w-3 h-3" />,
    'Complète': <AlertCircle className="w-3 h-3" />,
    'Fermée': <XCircle className="w-3 h-3" />,
    'Inactive': <XCircle className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${configs[color as keyof typeof configs] || configs.secondary}`}>
      {statusIcons[status as keyof typeof statusIcons]}
      {status}
    </span>
  );
};

const TypeBadge: React.FC<{ type: 'coranic' | 'french' }> = ({ type }) => {
  const configs = {
    coranic: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: '🕌',
      label: 'Coranique'
    },
    french: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: '🇫🇷',
      label: 'Française'
    }
  };

  const config = configs[type];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

const ProgressBar: React.FC<{ percentage: number; className?: string }> = ({ percentage, className = '' }) => {
  const getColor = (percent: number) => {
    if (percent >= 90) return 'from-red-400 to-red-600';
    if (percent >= 75) return 'from-amber-400 to-orange-600';
    if (percent >= 50) return 'from-blue-400 to-blue-600';
    return 'from-emerald-400 to-teal-600';
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div 
        className={`h-full bg-gradient-to-r ${getColor(percentage)} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
      />
    </div>
  );
};

// ===== COMPOSANT PRINCIPAL =====
const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  compact = false,
  showActions = true,
  className = ''
}) => {
  const {
    id,
    name,
    level,
    type,
    description,
    capacity,
    teacher_name,
    monthly_fee,
    is_active,
    current_students = 0,
    available_spots = capacity,
    occupancy_rate = 0,
    male_students = 0,
    female_students = 0,
    status_display = 'Disponible',
    status_color = 'success',
    school_year,
    teacher,
    created_at
  } = classData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (compact) {
    // Version compacte pour les listes
    return (
      <div className={`group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 ${!is_active ? 'opacity-60' : ''} ${className}`}>
        <div className="flex items-center justify-between">
          
          {/* Informations principales */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
              type === 'coranic' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'
            }`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                <TypeBadge type={type} />
                <StatusBadge status={status_display} color={status_color} />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {level}
                </span>
                
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {current_students}/{capacity}
                </span>
                
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(monthly_fee)}
                </span>
                
                {teacher_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {teacher_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onView && (
                <button
                  onClick={() => onView(classData)}
                  className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Voir détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => onEdit(classData)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              
              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(classData)}
                  className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  title="Dupliquer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => onDelete(classData)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Version carte complète
  return (
    <div className={`group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${!is_active ? 'opacity-75' : ''} ${className}`}>
      
      {/* Badge année scolaire courante */}
      {school_year?.is_current && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-xl font-bold text-xs shadow-lg border border-yellow-300">
          <Star className="w-3 h-3 inline mr-1" />
          Année Courante
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
          type === 'coranic' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'
        }`}>
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex gap-2">
          <TypeBadge type={type} />
          <StatusBadge status={status_display} color={status_color} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="space-y-4">
        
        {/* Titre et niveau */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="w-4 h-4" />
            <span className="font-medium">{level}</span>
            {school_year && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm">{school_year.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-700 text-sm line-clamp-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            {description}
          </p>
        )}

        {/* Enseignant */}
        {(teacher_name || teacher) && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-blue-900 text-sm">
                {teacher ? `${teacher.first_name} ${teacher.last_name}` : teacher_name}
              </div>
              {teacher && (
                <div className="text-xs text-blue-600">
                  {teacher.staff_number} • {teacher.position}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistiques étudiants */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{current_students}</div>
            <div className="text-xs text-gray-600">Étudiants</div>
          </div>
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{capacity}</div>
            <div className="text-xs text-gray-600">Capacité</div>
          </div>
        </div>

        {/* Répartition par genre */}
        {(male_students > 0 || female_students > 0) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center bg-blue-50 rounded-lg p-2 border border-blue-100">
              <div className="text-lg font-bold text-blue-900">{male_students}</div>
              <div className="text-xs text-blue-600">👦 Garçons</div>
            </div>
            <div className="text-center bg-pink-50 rounded-lg p-2 border border-pink-100">
              <div className="text-lg font-bold text-pink-900">{female_students}</div>
              <div className="text-xs text-pink-600">👧 Filles</div>
            </div>
          </div>
        )}

        {/* Barre de progression occupation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Occupation</span>
            <span className="text-sm font-bold text-gray-900">{occupancy_rate}%</span>
          </div>
          <ProgressBar percentage={occupancy_rate} />
          <div className="text-xs text-gray-500 mt-1">
            {available_spots} place(s) disponible(s)
          </div>
        </div>

        {/* Paiement mensuel */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Paiement mensuel</span>
          </div>
          <span className="text-lg font-bold text-green-900">{formatCurrency(monthly_fee)}</span>
        </div>

        {/* Informations supplémentaires */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>Créée le {formatDate(created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>ID: {id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            {onView && (
              <button
                onClick={() => onView(classData)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold text-sm"
              >
                <Eye className="w-4 h-4" />
                Voir
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={() => onEdit(classData)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 font-semibold text-sm"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            )}
            
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(classData)}
                className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all duration-200"
                title="Dupliquer"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(classData)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassCard;