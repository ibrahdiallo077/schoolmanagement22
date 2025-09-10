import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Users, 
  GraduationCap, 
  DollarSign, 
  Calendar, 
  Award, 
  User, 
  School, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  RefreshCw,
  Download,
  Filter,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';

import { BadgeDollarSign } from 'lucide-react';

// ===== CONFIGURATION API =====
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// ===== INTERFACES =====
interface ClassStatsData {
  general: {
    total_classes: number;
    active_classes: number;
    inactive_classes: number;
    coranic_classes: number;
    french_classes: number;
    total_capacity: number;
    average_capacity: number;
    average_monthly_fee: number;
    classes_with_teacher: number;
  };
  by_type: Array<{
    type: 'coranic' | 'french';
    class_count: number;
    total_capacity: number;
    total_students: number;
    average_occupancy_rate: number;
  }>;
  top_classes: Array<{
    id: string;
    name: string;
    level: string;
    type: 'coranic' | 'french';
    capacity: number;
    current_students: number;
    occupancy_rate: number;
    teacher_name?: string;
  }>;
  by_level: Array<{
    level: string;
    type: 'coranic' | 'french';
    class_count: number;
    total_capacity: number;
  }>;
}

interface ClassStatsProps {
  className?: string;
  compact?: boolean;
  showTitle?: boolean;
  refreshInterval?: number;
}

// ===== COMPOSANTS UTILITAIRES =====
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isUp: boolean; period: string };
  size?: 'small' | 'medium' | 'large';
}> = ({ title, value, subtitle, icon, color, trend, size = 'medium' }) => {
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const valueSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${sizeClasses[size]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-semibold ${trend.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>
        <p className={`font-bold text-gray-900 mb-1 ${valueSizes[size]}`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {trend && <p className="text-xs text-gray-400 mt-1">{trend.period}</p>}
      </div>
    </div>
  );
};

const ProgressRing: React.FC<{
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  value: string;
}> = ({ percentage, size, strokeWidth, color, label, value }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`text-${color}-500 transition-all duration-300 ease-in-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-600 text-center">{label}</span>
      </div>
    </div>
  );
};

const TopClassItem: React.FC<{
  classData: any;
  rank: number;
  onClick?: () => void;
}> = ({ classData, rank, onClick }) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100';
    if (rank === 2) return 'text-gray-600 bg-gray-100';
    if (rank === 3) return 'text-orange-600 bg-orange-100';
    return 'text-gray-500 bg-gray-50';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Award className="w-4 h-4" />;
    return <span className="text-sm font-bold">{rank}</span>;
  };

  return (
    <div 
      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankColor(rank)}`}>
          {getRankIcon(rank)}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
              {classData.name}
            </h4>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
              classData.type === 'coranic' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {classData.type === 'coranic' ? '🕌' : '🇫🇷'} {classData.level}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {classData.current_students}/{classData.capacity}
            </span>
            {classData.teacher_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {classData.teacher_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-bold text-gray-900">{classData.occupancy_rate}%</div>
        <div className="text-xs text-gray-500">Occupation</div>
      </div>
    </div>
  );
};

// ===== COMPOSANT PRINCIPAL =====
const ClassStats: React.FC<ClassStatsProps> = ({
  className = '',
  compact = false,
  showTitle = true,
  refreshInterval = 30000
}) => {
  const [stats, setStats] = useState<ClassStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ===== UTILITAIRES API =====
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const makeApiCall = async (endpoint: string, options: any = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 Appel API ClassStats: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers
        }
      });
      
      console.log(`📊 Statut réponse: ${response.status}`);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } else {
          const textResponse = await response.text();
          console.error('❌ Réponse non-JSON:', textResponse.substring(0, 200));
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Réponse non-JSON:', textResponse.substring(0, 200));
        throw new Error('Le serveur a retourné du HTML au lieu de JSON');
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur dans la réponse API');
      }
      
      return data;
    } catch (error: any) {
      console.error(`💥 Erreur API ${endpoint}:`, error);
      throw error;
    }
  };

  // ===== CHARGEMENT DES DONNÉES RÉELLES =====
  const loadStats = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('🔄 Chargement des statistiques réelles...');
      
      const result = await makeApiCall('/api/classes/stats/overview');
      
      if (result.stats) {
        setStats(result.stats);
        setLastUpdated(new Date());
        console.log('✅ Statistiques chargées avec succès:', result.stats);
      } else {
        throw new Error('Aucune donnée statistique reçue');
      }

    } catch (err: any) {
      console.error('💥 Erreur chargement statistiques:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== EFFET DE CHARGEMENT INITIAL =====
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ===== AUTO-REFRESH =====
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      loadStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadStats]);

  // ===== CALCULS DÉRIVÉS =====
  const calculations = stats ? {
    totalStudents: stats.by_type.reduce((sum, type) => sum + type.total_students, 0),
    averageOccupancy: stats.by_type.length > 0 
      ? Math.round(stats.by_type.reduce((sum, type) => sum + type.average_occupancy_rate, 0) / stats.by_type.length)
      : 0,
    teacherCoverage: stats.general.total_classes > 0 
      ? Math.round((stats.general.classes_with_teacher / stats.general.total_classes) * 100)
      : 0,
    availableSpots: stats.general.total_capacity - stats.by_type.reduce((sum, type) => sum + type.total_students, 0),
    monthlyRevenue: stats.general.average_monthly_fee * stats.by_type.reduce((sum, type) => sum + type.total_students, 0),
    classesNeedingTeacher: stats.general.total_classes - stats.general.classes_with_teacher
  } : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-600 rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-white animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-xl font-bold text-gray-700 ml-6">Chargement des statistiques...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-red-200 p-6 ${className}`}>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-3">Erreur de chargement</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ===== CAS SPÉCIAL : AUCUNE CLASSE =====
  if (!stats || stats.general.total_classes === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune classe créée</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre première classe pour voir les statistiques.</p>
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  if (!calculations) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Erreur dans les calculs statistiques</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Statistiques des Classes</h2>
              <p className="text-sm text-gray-600">
                {lastUpdated && `Dernière mise à jour: ${formatRelativeTime(lastUpdated)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Désactiver actualisation auto' : 'Activer actualisation auto'}
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Refresh manuel */}
            <button
              onClick={loadStats}
              disabled={isLoading}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Actualiser maintenant"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Expand/Collapse */}
            {compact && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title={isExpanded ? 'Réduire' : 'Développer'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      <div className={`p-6 space-y-6 ${compact && !isExpanded ? 'hidden' : ''}`}>
        
        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Classes"
            value={stats.general.total_classes}
            subtitle={`${stats.general.active_classes} actives`}
            icon={<GraduationCap className="w-5 h-5" />}
            color="blue"
            size={compact ? 'small' : 'medium'}
          />
          
          <MetricCard
            title="Total Étudiants"
            value={calculations.totalStudents}
            subtitle={`${calculations.availableSpots} places libres`}
            icon={<Users className="w-5 h-5" />}
            color="green"
            size={compact ? 'small' : 'medium'}
          />
          
          <MetricCard
            title="Occupation Moyenne"
            value={`${calculations.averageOccupancy}%`}
            subtitle={`Capacité: ${stats.general.total_capacity}`}
            icon={<Target className="w-5 h-5" />}
            color="purple"
            size={compact ? 'small' : 'medium'}
          />
          
          <MetricCard
            title="Revenus Mensuels"
            value={`${calculations.monthlyRevenue.toLocaleString('fr-FR')} GNF`}
            subtitle={`Moy: ${stats.general.average_monthly_fee.toLocaleString('fr-FR')} GNF`}
            icon={<BadgeDollarSign className="w-5 h-5" />}
            color="orange"
            size={compact ? 'small' : 'medium'}
                      />
        </div>

        {/* Répartition par type - seulement si il y a des données */}
        {stats.by_type.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Statistiques par type */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-500" />
                Répartition par Type
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.by_type.map((typeData) => (
                  <div key={typeData.type} className="text-center">
                    <div className="mb-4">
                      <ProgressRing
                        percentage={typeData.average_occupancy_rate}
                        size={120}
                        strokeWidth={8}
                        color={typeData.type === 'coranic' ? 'emerald' : 'blue'}
                        label={typeData.type === 'coranic' ? '🕌 Coraniques' : '🇫🇷 Françaises'}
                        value={`${Math.round(typeData.average_occupancy_rate)}%`}
                      />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Classes:</span>
                        <span className="font-semibold">{typeData.class_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Étudiants:</span>
                        <span className="font-semibold">{typeData.total_students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacité:</span>
                        <span className="font-semibold">{typeData.total_capacity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métriques supplémentaires */}
            <div className="space-y-4">
              <MetricCard
                title="Couverture Enseignants"
                value={`${calculations.teacherCoverage}%`}
                subtitle={`${calculations.classesNeedingTeacher} sans enseignant`}
                icon={<User className="w-5 h-5" />}
                color="indigo"
                size="medium"
              />
              
              <MetricCard
                title="Capacité Moyenne"
                value={Math.round(stats.general.average_capacity)}
                subtitle="étudiants par classe"
                icon={<Award className="w-5 h-5" />}
                color="yellow"
                size="medium"
              />
            </div>
          </div>
        )}

        {/* Top 5 des classes - seulement si il y en a */}
        {stats.top_classes.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Top {Math.min(5, stats.top_classes.length)} - Classes les mieux occupées
            </h3>
            
            <div className="space-y-3">
              {stats.top_classes.slice(0, 5).map((classData, index) => (
                <TopClassItem
                  key={classData.id}
                  classData={classData}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Répartition par niveau - seulement si il y en a */}
        {stats.by_level.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Répartition par Niveau ({stats.by_level.length} niveaux)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.by_level.map((levelData, index) => (
                <div key={`${levelData.level}-${levelData.type}-${index}`} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 capitalize">{levelData.level}</h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      levelData.type === 'coranic' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {levelData.type === 'coranic' ? '🕌' : '🇫🇷'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Classes:</span>
                      <span className="font-semibold">{levelData.class_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacité:</span>
                      <span className="font-semibold">{levelData.total_capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer avec timestamp - version simplifiée */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Dernière actualisation: {lastUpdated?.toLocaleString('fr-FR')}</span>
            {autoRefresh && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Clock className="w-3 h-3" />
                Actualisation auto ({Math.round(refreshInterval / 1000)}s)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs">API: {API_BASE_URL}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassStats;