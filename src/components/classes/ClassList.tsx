import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  Users, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  BookOpen,
  School,
  TrendingUp,
  DollarSign,
  Loader2,
  RefreshCw,
  Target,
  Award,
  Sparkles,
  GraduationCap,
  XCircle
} from 'lucide-react';

// ===== CONFIGURATION API =====
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  teacher_first_name?: string;
  teacher_last_name?: string;
  monthly_fee: number;
  is_active: boolean;
  school_year_id?: string;
  school_year_name?: string;
  created_at: string;
  updated_at?: string;
  current_students?: number;
  available_spots?: number;
  occupancy_rate?: number;
  status_display?: string;
  status_color?: string;
  type_display?: string;
}

interface ClassListProps {
  onEdit: (classData: ClassData) => void;
  onDelete: (classData: ClassData) => void;
  onView: (classData: ClassData) => void;
  onDuplicate: (classData: ClassData) => void;
  onCreate: () => void;
  showActions?: boolean;
  compact?: boolean;
}

// ===== CARTE DE CLASSE =====
const ClassCard: React.FC<{
  classData: ClassData;
  onEdit: (classData: ClassData) => void;
  onDelete: (classData: ClassData) => void;
  onView: (classData: ClassData) => void;
  onDuplicate: (classData: ClassData) => void;
  showActions: boolean;
}> = ({ classData, onEdit, onDelete, onView, onDuplicate, showActions }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Suppression de classe
  const handleDelete = async () => {
    if (!window.confirm(`Supprimer la classe "${classData.name}" ?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur suppression');
      }

      onDelete(classData);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Duplication de classe
  const handleDuplicate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/classes/${classData.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_name: `${classData.name} (Copie)`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur duplication');
      }

      onDuplicate(classData);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const occupancyRate = classData.occupancy_rate || 0;
  const teacherName = classData.teacher_name || 
    (classData.teacher_first_name && classData.teacher_last_name 
      ? `${classData.teacher_first_name} ${classData.teacher_last_name}` 
      : null);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group relative">
      
      {/* Header avec icône et titre */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            classData.type === 'coranic' 
              ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
              : 'bg-gradient-to-br from-blue-400 to-indigo-600'
          }`}>
            {classData.type === 'coranic' ? (
              <School className="w-6 h-6 text-white" />
            ) : (
              <BookOpen className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{classData.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Award className="w-4 h-4" />
              <span>{classData.level}</span>
            </div>
          </div>
        </div>
        
        {/* Menu actions */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-10">
                <div className="p-2">
                  <button
                    onClick={() => { onView(classData); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                    Voir détails
                  </button>
                  <button
                    onClick={() => { onEdit(classData); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => { handleDuplicate(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Copy className="w-4 h-4" />
                    Dupliquer
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={() => { handleDelete(); setIsMenuOpen(false); }}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badges statut */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          classData.is_active 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {classData.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {classData.is_active ? 'Active' : 'Inactive'}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          classData.type === 'coranic'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {classData.type === 'coranic' ? '🕌 Coranique' : '🇫🇷 Française'}
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span>Occupation</span>
          </div>
          <div className="font-bold text-gray-900">
            {classData.current_students || 0}/{classData.capacity}
          </div>
          <div className="text-xs text-gray-500">{occupancyRate}% occupée</div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Frais/mois</span>
          </div>
          <div className="font-bold text-gray-900">
            {new Intl.NumberFormat('fr-FR').format(classData.monthly_fee)} XOF
          </div>
          <div className="text-xs text-gray-500">
            {classData.available_spots || 0} places libres
          </div>
        </div>
      </div>

      {/* Enseignant et année */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Enseignant:</span>
          <span className="font-medium text-gray-900">
            {teacherName || 'Non assigné'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Année:</span>
          <span className="font-medium text-gray-900">
            {classData.school_year_name || 'Non assignée'}
          </span>
        </div>
      </div>

      {/* Description */}
      {classData.description && (
        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-gray-700">{classData.description}</p>
        </div>
      )}

      {/* Actions rapides */}
      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => onView(classData)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Voir
          </button>
          <button
            onClick={() => onEdit(classData)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </button>
        </div>
      )}
    </div>
  );
};

// ===== ÉTAT VIDE =====
const EmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="text-center py-16">
    <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
      <GraduationCap className="w-16 h-16 text-emerald-500" />
    </div>
    
    <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune classe créée</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Commencez par créer votre première classe coranique ou française.
    </p>
    
    <button
      onClick={onCreate}
      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto"
    >
      <Plus className="w-5 h-5" />
      Créer ma première classe
    </button>
    
    <div className="mt-8">
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 max-w-md mx-auto">
        <div className="text-emerald-800 font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          Conseil
        </div>
        <div className="text-emerald-700 text-sm">
          Le système génère automatiquement des noms uniques pour vos classes.
        </div>
      </div>
    </div>
  </div>
);

// ===== ÉTAT D'ERREUR =====
const ErrorState: React.FC<{ error: string; onRetry: () => void; onCreate: () => void }> = ({ error, onRetry, onCreate }) => (
  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-red-800 mb-3">Erreur de chargement</h3>
    <p className="text-red-700 mb-6">{error}</p>
    
    <div className="space-y-2 text-sm text-red-600 mb-6">
      <p>• Vérifiez que le serveur est démarré sur {API_BASE_URL}</p>
      <p>• Testez l'API: <a href={`${API_BASE_URL}/api/classes/test`} target="_blank" rel="noopener noreferrer" className="underline">Test API</a></p>
    </div>
    
    <div className="flex gap-3 justify-center">
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        Réessayer
      </button>
      <button
        onClick={onCreate}
        className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Créer une classe
      </button>
    </div>
  </div>
);

// ===== COMPOSANT PRINCIPAL =====
const ClassList: React.FC<ClassListProps> = ({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onCreate,
  showActions = true,
  compact = false
}) => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // ===== CHARGEMENT DES CLASSES =====
  const loadClasses = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_BASE_URL}/api/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur API');
      }

      setClasses(data.classes || []);
      
    } catch (error: any) {
      console.error('Erreur chargement classes:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // ===== FILTRES =====
  const filteredClasses = classes.filter(classData => {
    const matchesSearch = classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classData.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classData.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && classData.is_active) ||
                         (filterActive === 'inactive' && !classData.is_active);
    
    return matchesSearch && matchesFilter;
  });

  // ===== GESTIONNAIRES =====
  const handleRefresh = () => {
    loadClasses();
  };

  const handleDelete = (classData: ClassData) => {
    setClasses(prev => prev.filter(c => c.id !== classData.id));
    onDelete(classData);
  };

  const handleDuplicate = (classData: ClassData) => {
    loadClasses();
    onDuplicate(classData);
  };

  // ===== RENDU =====
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-600 rounded-full animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-white animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xl font-bold text-gray-700 mt-6">Chargement des classes...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} onCreate={onCreate} />;
  }

  if (classes.length === 0) {
    return <EmptyState onCreate={onCreate} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all duration-300"
            >
              <option value="all">Toutes les classes</option>
              <option value="active">Classes actives</option>
              <option value="inactive">Classes inactives</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={onCreate}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle classe
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Total</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">{classes.length}</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Actives</span>
          </div>
          <div className="text-2xl font-bold text-green-800">
            {classes.filter(c => c.is_active).length}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Étudiants</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {classes.reduce((sum, c) => sum + (c.current_students || 0), 0)}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Capacité</span>
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {classes.reduce((sum, c) => sum + c.capacity, 0)}
          </div>
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Search className="w-5 h-5" />
            <span className="font-medium">
              {filteredClasses.length} classe(s) trouvée(s) pour "{searchTerm}"
            </span>
          </div>
        </div>
      )}

      {/* Liste des classes */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune classe trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? `Aucune classe ne correspond à "${searchTerm}"`
              : 'Aucune classe ne correspond aux filtres sélectionnés'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-6 ${compact ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {filteredClasses.map((classData) => (
            <ClassCard
              key={classData.id}
              classData={classData}
              onEdit={onEdit}
              onDelete={handleDelete}
              onView={onView}
              onDuplicate={handleDuplicate}
              showActions={showActions}
            />
          ))}
        </div>
      )}

      {/* Footer informatif */}
      <div className="mt-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
        <p className="font-medium">📊 Données en temps réel depuis la base de données</p>
        <p className="mt-1">
          {classes.length} classe(s) chargée(s) • API: {API_BASE_URL}
        </p>
        <p className="mt-1 text-xs">
          Dernière actualisation: {new Date().toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  );
};

export default ClassList;