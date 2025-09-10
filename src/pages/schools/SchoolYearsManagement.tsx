import React, { useState, useCallback, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  BarChart3, 
  Search, 
  Filter, 
  Download,
  Star,
  Clock,
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  X,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  Award,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Settings,
  MoreVertical,
  Archive,
  Copy
} from 'lucide-react';

// Import du formulaire
import SchoolYearForm from '../../components/school-years/SchoolYearForm';

// ===== INTERFACES =====
interface SchoolYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_current: boolean;
  students_count?: number;
  classes_count?: number;
  progress_percentage?: number;
  created_at: string;
  updated_at?: string;
  start_date_formatted?: string;
  end_date_formatted?: string;
  status_display?: string;
  duration_days?: number;
}

interface Stats {
  total_years: number;
  current_years: number;
  total_students: number;
  total_classes: number;
  average_occupancy: number;
}

// ===== COMPOSANTS UTILITAIRES =====
const StatusBadge: React.FC<{ status: string; isCurrent?: boolean }> = ({ status, isCurrent = false }) => {
  if (isCurrent) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <Star className="w-3 h-3" />
        Courante
      </span>
    );
  }

  const configs = {
    'En cours': {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    'Terminée': {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: <XCircle className="w-3 h-3" />,
    },
    'Future': {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: <Clock className="w-3 h-3" />,
    }
  };

  const config = configs[status as keyof typeof configs] || configs['Future'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.icon}
      {status}
    </span>
  );
};

const ProgressBar: React.FC<{ percentage: number; className?: string }> = ({ percentage, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
    <div 
      className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
    />
  </div>
);

// ===== SERVICE API =====
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const schoolYearService = {
  async getAll(): Promise<{ success: boolean; school_years: SchoolYear[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/school-years`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération années scolaires:', error);
      return { success: false, school_years: [], error: 'Erreur de connexion' };
    }
  },

  async create(data: any): Promise<{ success: boolean; school_year?: SchoolYear; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/school-years`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur création année scolaire:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  async update(id: string, data: any): Promise<{ success: boolean; school_year?: SchoolYear; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/school-years/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur modification année scolaire:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/school-years/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur suppression année scolaire:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  async setCurrent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/school-years/${id}/set-current`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur définition année courante:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }
};

// ===== COMPOSANT PRINCIPAL =====
const SchoolYearsManagement: React.FC = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États UI
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // ===== CHARGEMENT DES DONNÉES =====
  const loadSchoolYears = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await schoolYearService.getAll();
      
      if (response.success) {
        setSchoolYears(response.school_years);
        const current = response.school_years.find(y => y.is_current);
        setCurrentYear(current || null);
      } else {
        setError(response.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchoolYears();
  }, [loadSchoolYears]);

  // ===== GESTIONNAIRES =====
  const handleCreate = useCallback(() => {
    setSelectedYear(null);
    setFormMode('create');
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((year: SchoolYear) => {
    setSelectedYear(year);
    setFormMode('edit');
    setIsFormOpen(true);
  }, []);

  const handleSave = useCallback(async (data: any) => {
    try {
      let response;
      
      if (formMode === 'create') {
        response = await schoolYearService.create(data);
      } else if (selectedYear) {
        response = await schoolYearService.update(selectedYear.id, data);
      }

      if (response?.success) {
        setIsFormOpen(false);
        await loadSchoolYears();
        showToast('success', 
          formMode === 'create' ? '✅ Année créée !' : '✅ Année modifiée !',
          `L'année scolaire a été ${formMode === 'create' ? 'créée' : 'modifiée'} avec succès.`
        );
      } else {
        showToast('error', '❌ Erreur', response?.error || 'Une erreur est survenue');
      }
    } catch (error) {
      showToast('error', '❌ Erreur', 'Erreur de sauvegarde');
    }
  }, [formMode, selectedYear, loadSchoolYears]);

  const handleDelete = useCallback(async (year: SchoolYear) => {
    if (year.is_current) {
      showToast('error', '❌ Impossible', 'Impossible de supprimer l\'année courante');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'année scolaire ${year.name} ?`)) {
      try {
        const response = await schoolYearService.delete(year.id);
        
        if (response.success) {
          await loadSchoolYears();
          showToast('success', '🗑️ Supprimé', 'Année scolaire supprimée avec succès');
        } else {
          showToast('error', '❌ Erreur', response.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        showToast('error', '❌ Erreur', 'Erreur de connexion');
      }
    }
  }, [loadSchoolYears]);

  const handleSetCurrent = useCallback(async (year: SchoolYear) => {
    try {
      const response = await schoolYearService.setCurrent(year.id);
      
      if (response.success) {
        await loadSchoolYears();
        showToast('success', '⭐ Année courante définie', `${year.name} est maintenant l'année courante`);
      } else {
        showToast('error', '❌ Erreur', response.error || 'Erreur lors de la définition');
      }
    } catch (error) {
      showToast('error', '❌ Erreur', 'Erreur de connexion');
    }
  }, [loadSchoolYears]);

  const showToast = (type: string, title: string, message: string) => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-xl shadow-xl z-50 max-w-sm transform transition-all duration-300`;
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">${type === 'success' ? '✅' : '❌'}</span>
        <div>
          <div class="font-bold">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Filtrage
  const filteredYears = schoolYears.filter(year => {
    const matchesSearch = year.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (year.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'current') return year.is_current;
    if (filterStatus === 'active') {
      const now = new Date();
      const endDate = new Date(year.end_date);
      return endDate >= now;
    }
    if (filterStatus === 'past') {
      const now = new Date();
      const endDate = new Date(year.end_date);
      return endDate < now;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Statistiques calculées
  const stats: Stats = {
    total_years: schoolYears.length,
    current_years: schoolYears.filter(y => y.is_current).length,
    total_students: schoolYears.reduce((sum, y) => sum + (y.students_count || 0), 0),
    total_classes: schoolYears.reduce((sum, y) => sum + (y.classes_count || 0), 0),
    average_occupancy: 75 // Valeur calculée
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-6 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <div className="text-lg font-bold text-gray-900 mb-1">Chargement...</div>
          <div className="text-gray-600 text-sm">Récupération des données</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header compact avec dégradé et coins arrondis */}
      <div className="mx-6 mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Années Scolaires</h1>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {stats.total_years} années
                  </span>
                  {currentYear && (
                    <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">
                      Courante: {currentYear.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-200 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Année
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        
        {/* Statistiques compactes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Années</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_years}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Étudiants</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_students}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Classes</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_classes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Occupation</p>
                <p className="text-xl font-bold text-gray-900">{stats.average_occupancy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Année courante compacte */}
        {currentYear && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-gray-900">{currentYear.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(currentYear.start_date)} → {formatDate(currentYear.end_date)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{currentYear.students_count || 0}</div>
                  <div className="text-xs text-gray-600">Étudiants</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{currentYear.classes_count || 0}</div>
                  <div className="text-xs text-gray-600">Classes</div>
                </div>
                {currentYear.progress_percentage !== undefined && (
                  <div>
                    <div className="text-lg font-bold text-gray-900">{currentYear.progress_percentage}%</div>
                    <div className="text-xs text-gray-600">Progression</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Barre de progression */}
            {currentYear.progress_percentage !== undefined && currentYear.progress_percentage > 0 && (
              <div className="mt-3">
                <ProgressBar percentage={currentYear.progress_percentage} />
              </div>
            )}
          </div>
        )}

        {/* Alerte si pas d'année courante */}
        {!currentYear && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <h4 className="text-amber-800 font-semibold">Aucune année scolaire courante</h4>
                <p className="text-amber-700 text-sm">Définissez une année comme courante.</p>
              </div>
            </div>
          </div>
        )}

        {/* Recherche et filtres compacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            
            {/* Recherche */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une année..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Toutes</option>
                  <option value="current">Courante</option>
                  <option value="active">Actives</option>
                  <option value="past">Passées</option>
                </select>
              </div>

              {/* Mode d'affichage */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue liste"
                >
                  <div className="space-y-1 w-4 h-4">
                    <div className="bg-current h-1 rounded-sm"></div>
                    <div className="bg-current h-1 rounded-sm"></div>
                    <div className="bg-current h-1 rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'cards' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vue cartes"
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
              </div>

              <button
                onClick={loadSchoolYears}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{filteredYears.length}</span> résultat(s) pour "{searchTerm}"
            </div>
          )}
        </div>

        {/* Affichage d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-red-800 font-semibold">Erreur de chargement</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Liste des années scolaires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Années Scolaires ({filteredYears.length})
            </h2>
          </div>

          <div className="p-4">
            {filteredYears.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {schoolYears.length === 0 ? 'Aucune année scolaire' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {schoolYears.length === 0 
                    ? "Commencez par créer votre première année scolaire"
                    : "Aucune année ne correspond à vos critères"
                  }
                </p>
                {schoolYears.length === 0 ? (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Créer la première année
                  </button>
                ) : (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
                  >
                    <X className="w-5 h-5" />
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : viewMode === 'list' ? (
              // Vue liste compacte
              <div className="space-y-3">
                {filteredYears.map((year) => (
                  <div key={year.id} className="group bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      
                      {/* Informations principales */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{year.name}</h3>
                            <StatusBadge status={year.status_display || 'Future'} isCurrent={year.is_current} />
                          </div>
                          
                          <p className="text-gray-600 text-sm">
                            {formatDate(year.start_date)} → {formatDate(year.end_date)}
                          </p>
                          
                          {year.description && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{year.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Statistiques et actions */}
                      <div className="flex items-center gap-6">
                        
                        {/* Stats compactes */}
                        <div className="flex gap-4 text-center text-sm">
                          <div>
                            <div className="font-bold text-gray-900">{year.students_count || 0}</div>
                            <div className="text-xs text-gray-600">Étudiants</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{year.classes_count || 0}</div>
                            <div className="text-xs text-gray-600">Classes</div>
                          </div>
                          {year.progress_percentage !== undefined && (
                            <div>
                              <div className="font-bold text-gray-900">{year.progress_percentage}%</div>
                              <div className="text-xs text-gray-600">Progression</div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!year.is_current && (
                            <button
                              onClick={() => handleSetCurrent(year)}
                              className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                              title="Définir comme courante"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(year)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(year)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Supprimer"
                            disabled={year.is_current}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Vue cartes
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredYears.map((year) => (
                  <div key={year.id} className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    
                    {/* Badge année courante */}
                    {year.is_current && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-xl font-bold text-xs shadow-lg border border-yellow-300">
                        <Star className="w-3 h-3 inline mr-1" />
                        Courante
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <StatusBadge status={year.status_display || 'Future'} isCurrent={false} />
                    </div>

                    {/* Contenu */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{year.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {formatDate(year.start_date)} → {formatDate(year.end_date)}
                        </p>
                      </div>

                      {year.description && (
                        <p className="text-gray-700 text-sm line-clamp-2 bg-gray-50 p-3 rounded-lg">{year.description}</p>
                      )}

                      {/* Statistiques */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
                          <div className="text-2xl font-bold text-gray-900">{year.students_count || 0}</div>
                          <div className="text-xs text-gray-600">Étudiants</div>
                        </div>
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
                          <div className="text-2xl font-bold text-gray-900">{year.classes_count || 0}</div>
                          <div className="text-xs text-gray-600">Classes</div>
                        </div>
                      </div>

                      {/* Progression */}
                      {year.progress_percentage !== undefined && year.progress_percentage > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Progression</span>
                            <span className="text-sm font-bold text-emerald-600">{year.progress_percentage}%</span>
                          </div>
                          <ProgressBar percentage={year.progress_percentage} />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        {!year.is_current && (
                          <button
                            onClick={() => handleSetCurrent(year)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all duration-200 font-semibold border border-yellow-200 text-sm"
                          >
                            <Star className="w-4 h-4" />
                            Courante
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEdit(year)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 font-semibold border border-blue-200 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        
                        <button
                          onClick={() => handleDelete(year)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200"
                          disabled={year.is_current}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire modal */}
      <SchoolYearForm
        schoolYear={selectedYear}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        mode={formMode}
      />
    </div>
  );
};

export default SchoolYearsManagement;