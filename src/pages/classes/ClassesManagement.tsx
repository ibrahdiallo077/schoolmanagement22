import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download,
  Eye,
  School,
  Users,
  Award,
  User,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash2,
  DollarSign,
  UserCheck,
  X,
  Loader2
} from 'lucide-react';

// Import du formulaire
import { ClassForm } from '../../components/classes';

// ===== CONFIGURATION API =====
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ===== INTERFACES =====
interface ClassData {
  id: string;
  name: string;
  level: string;
  type: 'coranic';
  description?: string;
  capacity: number;
  teacher_id?: string;
  teacher_name?: string;
  monthly_fee: number;
  is_active: boolean;
  school_year_id?: string;
  created_at: string;
  updated_at?: string;
  current_students?: number;
}

// ===== FONCTIONS API SIMPLIFIÉES =====
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || 'mock-token';
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const makeApiCall = async (endpoint: string, options: any = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`📡 API: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ API Success: ${endpoint}`);
      return data;
    }
    
    console.error(`❌ API Error ${response.status}:`, data);
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
    
  } catch (error: any) {
    console.error('❌ Network Error:', error.message);
    throw error;
  }
};

// ===== COMPOSANT STATISTIQUES SIMPLIFIÉ =====
const ClassStats: React.FC<{ classes: ClassData[] }> = ({ classes }) => {
  const stats = {
    total: classes.length,
    active: classes.filter(c => c.is_active).length,
    totalStudents: classes.reduce((sum, c) => sum + (c.current_students || 0), 0),
    totalCapacity: classes.reduce((sum, c) => sum + c.capacity, 0),
    totalRevenue: classes.reduce((sum, c) => sum + (c.monthly_fee * (c.current_students || 0)), 0),
    withTeacher: classes.filter(c => c.teacher_name && c.teacher_name.trim() !== '').length,
  };

  const averageOccupancy = stats.totalCapacity > 0 ? Math.round((stats.totalStudents / stats.totalCapacity) * 100) : 0;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-emerald-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      indigo: 'from-indigo-500 to-indigo-600',
    };

    return (
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center shadow-lg`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <School className="w-5 h-5 text-emerald-500" />
          Tableau de bord
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Classes"
          value={stats.total}
          subtitle={`${stats.active} actives`}
          icon={<School className="w-5 h-5" />}
          color="green"
        />
        
        <StatCard
          title="Étudiants"
          value={stats.totalStudents}
          subtitle={`/${stats.totalCapacity} places`}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        
        <StatCard
          title="Occupation"
          value={`${averageOccupancy}%`}
          subtitle="Moyenne"
          icon={<Award className="w-5 h-5" />}
          color="purple"
        />
        
        <StatCard
          title="Revenus"
          value={`${Math.round(stats.totalRevenue / 1000000)}M`}
          subtitle={`${stats.totalRevenue.toLocaleString()} GNF`}
          icon={<DollarSign className="w-5 h-5" />}
          color="orange"
        />
        
        <StatCard
          title="Enseignants"
          value={`${stats.withTeacher}/${stats.total}`}
          subtitle="Assignés"
          icon={<UserCheck className="w-5 h-5" />}
          color="indigo"
        />

        <StatCard
          title="Non assignées"
          value={stats.total - stats.withTeacher}
          subtitle="Sans enseignant"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
        />
      </div>
    </div>
  );
};

// ===== TABLEAU DES CLASSES SIMPLIFIÉ =====
const ClassesTable: React.FC<{
  classes: ClassData[];
  onView: (classData: ClassData) => void;
  onEdit: (classData: ClassData) => void;
  onDelete: (classData: ClassData) => void;
}> = ({ classes, onView, onEdit, onDelete }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getOccupancyRate = (current: number = 0, capacity: number) => {
    return capacity > 0 ? Math.round((current / capacity) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-50 to-green-100 border-b border-emerald-200">
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Classe Coranique</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Niveau</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Occupation</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Frais Mensuel</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Enseignant</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classes.map((classData) => {
              const occupancyRate = getOccupancyRate(classData.current_students, classData.capacity);
              
              return (
                <tr key={classData.id} className="hover:bg-emerald-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
                        <School className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{classData.name}</div>
                        <div className="text-sm text-gray-500">ID: {classData.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 capitalize">{classData.level}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {classData.current_students || 0}/{classData.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              occupancyRate >= 80 ? 'bg-emerald-500' : 
                              occupancyRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        occupancyRate >= 80 ? 'text-emerald-600 bg-emerald-50' :
                        occupancyRate >= 60 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {occupancyRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {formatCurrency(classData.monthly_fee)} GNF
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {classData.teacher_name ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-900 font-medium">
                          {classData.teacher_name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600">Non assigné</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView(classData)}
                        className="p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(classData)}
                        className="p-2 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(classData)}
                        className="p-2 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== MODAL DÉTAILS SIMPLIFIÉE =====
const ClassDetailsModal: React.FC<{
  classData: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (classData: ClassData) => void;
  onDelete: (classData: ClassData) => void;
}> = ({ classData, isOpen, onClose, onEdit, onDelete }) => {
  if (!isOpen || !classData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const occupancyRate = classData.capacity > 0 ? Math.round(((classData.current_students || 0) / classData.capacity) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{classData.name}</h2>
              <p className="text-gray-600">Classe d'enseignement coranique</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center bg-emerald-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-800">{occupancyRate}%</div>
            <div className="text-sm text-emerald-600">Taux d'occupation</div>
          </div>
          <div className="text-center bg-blue-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-800">{classData.capacity - (classData.current_students || 0)}</div>
            <div className="text-sm text-blue-600">Places disponibles</div>
          </div>
          <div className="text-center bg-purple-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-800">{classData.current_students || 0}</div>
            <div className="text-sm text-purple-600">Étudiants inscrits</div>
          </div>
        </div>

        {/* Informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3">Informations Générales</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Niveau:</span>
                <span className="font-medium capitalize">{classData.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacité:</span>
                <span className="font-medium">{classData.capacity} élèves</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais mensuel:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(classData.monthly_fee)} GNF</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3">Assignations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Enseignant:</span>
                <span className="font-medium">{classData.teacher_name || 'Non assigné'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créée le:</span>
                <span className="font-medium">{formatDate(classData.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {classData.description && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 text-sm">{classData.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onEdit(classData)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={() => onDelete(classData)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== COMPOSANT PRINCIPAL SIMPLIFIÉ =====
const ClassesManagement: React.FC = () => {
  // États simplifiés
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');

  // ===== CHARGEMENT DES CLASSES SIMPLIFIÉ =====
  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Loading classes...');
      const result = await makeApiCall('/api/classes');
      
      // Récupérer les enseignants pour enrichir les données
      let teachers: any[] = [];
      try {
        const teachersResult = await makeApiCall('/api/classes/staff/teachers');
        teachers = teachersResult.teachers || [];
      } catch (error) {
        console.warn('⚠️ Could not load teachers:', error);
      }
      
      // Mapper les enseignants
      const teachersMap = new Map();
      teachers.forEach(teacher => {
        teachersMap.set(teacher.id, `${teacher.first_name} ${teacher.last_name}`);
      });
      
      const rawClasses = result.classes || result.data || result || [];
      
      const enrichedClasses = rawClasses
        .filter((classe: ClassData) => classe.type === 'coranic')
        .map((classe: ClassData) => ({
          ...classe,
          current_students: classe.current_students || 0,
          teacher_name: classe.teacher_id ? teachersMap.get(classe.teacher_id) : null
        }));
      
      setClasses(enrichedClasses);
      console.log(`✅ ${enrichedClasses.length} classes loaded`);
      
    } catch (error: any) {
      console.error('❌ Error loading classes:', error);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== GESTIONNAIRES SIMPLIFIÉS =====
  const handleCreate = useCallback(() => {
    setSelectedClass(null);
    setFormMode('create');
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((classData: ClassData) => {
    setSelectedClass(classData);
    setFormMode('edit');
    setIsFormOpen(true);
    setIsDetailsOpen(false);
  }, []);

  const handleView = useCallback((classData: ClassData) => {
    setSelectedClass(classData);
    setIsDetailsOpen(true);
  }, []);

  const handleDelete = useCallback(async (classData: ClassData) => {
    if (!window.confirm(`Supprimer la classe "${classData.name}" ?`)) {
      return;
    }

    try {
      await makeApiCall(`/api/classes/${classData.id}`, { method: 'DELETE' });
      setClasses(prev => prev.filter(c => c.id !== classData.id));
      setIsDetailsOpen(false);
      console.log(`✅ Class deleted: ${classData.name}`);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  }, []);

  // ===== FONCTION SAVE CORRIGÉE - PAS DE DOUBLE APPEL API =====
  const handleSave = useCallback(async (result: any) => {
    try {
      console.log('🚀 HandleSave called with result:', result);
      
      // ✅ IMPORTANT: Ne pas refaire d'appel API ici !
      // Le ClassForm a déjà fait l'appel API et nous passe le résultat
      
      // Extraire la classe créée/modifiée du résultat
      const savedClass = result.class || result.data || result;
      
      console.log('📋 Saved class data:', savedClass);
      
      if (formMode === 'create') {
        // Ajouter la nouvelle classe à la liste
        setClasses(prev => [...prev, { 
          ...savedClass, 
          current_students: 0,
          teacher_name: null // Sera enrichi lors du prochain loadClasses()
        }]);
        console.log('✅ New class added to list');
      } else {
        // Mettre à jour la classe existante
        setClasses(prev => prev.map(c => 
          c.id === savedClass.id ? { 
            ...savedClass, 
            current_students: c.current_students, // Garder le nombre d'étudiants
            teacher_name: c.teacher_name // Garder le nom de l'enseignant temporairement
          } : c
        ));
        console.log('✅ Class updated in list');
      }

      // Fermer le formulaire
      setIsFormOpen(false);
      setSelectedClass(null);
      
      // Recharger les classes pour avoir les données enrichies (noms d'enseignants, etc.)
      // Utiliser un petit délai pour éviter les conflits
      setTimeout(() => {
        loadClasses();
      }, 500);

      console.log('✅ Save process completed successfully');

    } catch (error: any) {
      console.error('💥 Error in handleSave:', error);
      // Laisser l'erreur remonter au ClassForm pour qu'il l'affiche
      throw error;
    }
  }, [formMode, loadClasses]);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedClass(null);
  }, []);

  // ===== EFFECTS =====
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // ===== FILTRES SIMPLIFIÉS =====
  const filteredClasses = classes.filter((classData) => {
    const matchesSearch = classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classData.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (classData.teacher_name && classData.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = filterLevel === 'all' || classData.level === filterLevel;
    
    const matchesTeacher = filterTeacher === 'all' || 
                          (filterTeacher === 'assigned' && classData.teacher_name) ||
                          (filterTeacher === 'unassigned' && !classData.teacher_name);
    
    return matchesSearch && matchesLevel && matchesTeacher;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      
      {/* Header */}
      <div className="mx-6 mt-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">🕌 Classes Coraniques</h1>
                <p className="text-emerald-100">Gestion de l'enseignement islamique</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={loadClasses}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Classe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Statistiques */}
        <ClassStats classes={classes} />
        
        {/* Filtres simplifiés */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher classe, niveau, enseignant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none bg-white text-sm"
              >
                <option value="all">📚 Tous niveaux</option>
                <option value="debutant">🌱 Débutant</option>
                <option value="intermediaire">📚 Intermédiaire</option>
                <option value="avance">⭐ Avancé</option>
                <option value="memorisation">💎 Mémorisation</option>
                <option value="tajwid">🎵 Tajwid</option>
              </select>
              
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none bg-white text-sm"
              >
                <option value="all">👨‍🏫 Tous enseignants</option>
                <option value="assigned">✅ Avec enseignant</option>
                <option value="unassigned">❌ Sans enseignant</option>
              </select>
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterLevel('all');
                  setFilterTeacher('all');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                🔄 Effacer
              </button>
            </div>
            
            <div className="text-sm px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 whitespace-nowrap">
              {filteredClasses.length} classe{filteredClasses.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des classes */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-500" />
              Classes Coraniques ({filteredClasses.length})
            </h2>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mr-3" />
                <span className="text-lg text-gray-700">Chargement...</span>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-12">
                <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm || filterLevel !== 'all' || filterTeacher !== 'all' 
                    ? 'Aucune classe trouvée' 
                    : 'Aucune classe créée'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterLevel !== 'all' || filterTeacher !== 'all'
                    ? 'Modifiez vos critères de recherche'
                    : 'Créez votre première classe coranique'
                  }
                </p>
                {!(searchTerm || filterLevel !== 'all' || filterTeacher !== 'all') && (
                  <button
                    onClick={handleCreate}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Créer ma première classe
                  </button>
                )}
              </div>
            ) : (
              <ClassesTable
                classes={filteredClasses}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ClassDetailsModal
        classData={selectedClass}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ClassForm
        classData={selectedClass}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        mode={formMode}
      />
    </div>
  );
};

export default ClassesManagement;