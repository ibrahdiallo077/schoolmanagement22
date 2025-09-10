import React, { useState, useMemo } from 'react';
import { 
  Users, CreditCard, TrendingUp, TrendingDown, BookOpen, 
  UserCheck, GraduationCap, Heart, MapPin,
  RefreshCw, Loader2, Star, Award, Activity,
  Building, Home, AlertTriangle, BarChart3,
  ArrowUpRight, ArrowDownRight, Wallet, DollarSign, CheckCircle,
  UserPlus, School, AlertCircle, 
  ChevronDown, ChevronUp, ChevronRight,
  Clock3, Zap, Database, Euro,
  TrendingUp as TrendUp, Eye, Plus,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon, 
  BarChart as BarChartIcon, 
  Calendar
} from 'lucide-react';

import { 
  useDashboardOverview, 
  useQuickStats, 
  useLiveMetrics, 
  useActivityStream,
  useDashboardHealth
} from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';

// Composant de graphique en barres
const CustomBarChart = ({ data, title, height = 200 }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3" style={{ height }}>
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-20 text-sm font-medium text-gray-700 text-right">
              {item.label}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 shadow-md relative overflow-hidden`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
              </div>
              <div className="w-16 text-sm font-bold text-gray-900 text-right">
                {item.displayValue || item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant de graphique en courbes
const CustomLineChart = ({ data, title, height = 250 }) => {
  const maxValue = Math.max(...data.map(point => point.value));
  const minValue = Math.min(...data.map(point => point.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="20" height="25" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 25" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <rect width="100" height="100" fill="url(#grid)" />
          
          <path
            d={`M 0,100 L ${points} L 100,100 Z`}
            fill="url(#areaGradient)"
          />
          
          <polyline
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            points={points}
            className="drop-shadow-md"
          />
          
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#3b82f6"
                className="drop-shadow-lg"
              >
                <title>{`${point.label}: ${point.displayValue || point.value}`}</title>
              </circle>
            );
          })}
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.map((point, index) => (
            index % Math.ceil(data.length / 5) === 0 && (
              <span key={index}>{point.label}</span>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant de graphique circulaire
const CustomPieChart = ({ data, title, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              const currentCumulative = cumulativePercentage;
              cumulativePercentage += percentage;

              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2 - 20}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                  style={{ 
                    transformOrigin: `${size / 2}px ${size / 2}px`,
                  }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full shadow-md"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-600">
                  {item.value} ({Math.round((item.value / total) * 100)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant de métrique principale moderne
const MetricCard = ({ title, value, change, changeType, subtitle, icon: Icon, gradient, progress, details, trend }) => {
  const [showDetails, setShowDetails] = useState(false);
  const TrendIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Activity;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer transform hover:scale-105`}
         onClick={() => setShowDetails(!showDetails)}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            {change && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                changeType === 'increase' ? 'bg-emerald-500/30 text-white border border-emerald-300/30' : 
                changeType === 'decrease' ? 'bg-red-500/30 text-white border border-red-300/30' :
                'bg-blue-500/30 text-white border border-blue-300/30'
              }`}>
                <TrendIcon className="w-3 h-3" />
                {change}
              </div>
            )}
            <ChevronDown className={`w-5 h-5 text-white/80 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        <div>
          <p className="text-white/90 text-sm font-medium mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-white text-3xl md:text-4xl font-black mb-2 tracking-tight">
            {value}
          </p>
          {subtitle && <p className="text-white/80 text-sm font-medium">{subtitle}</p>}
          
          {progress !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-xs font-medium">Taux d'occupation</span>
                <span className="text-white font-bold text-sm">{progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-white/80 to-white h-full rounded-full transition-all duration-1500 shadow-md"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {showDetails && details && (
            <div className="mt-4 pt-4 border-t border-white/20 animate-fadeIn">
              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <span className="text-white/80 text-sm font-medium">{detail.label}</span>
                    <span className="text-white font-bold text-sm">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant de distribution moderne
const StudentDistribution = ({ title, value, percentage, icon: Icon, color, gradient, details }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`} />
      
      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-700 text-sm font-semibold uppercase tracking-wide">{title}</p>
            <p className="text-gray-900 text-2xl font-black">{value}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-900 text-2xl font-black">{percentage}%</p>
            <div className="w-12 h-12 relative">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  strokeDasharray={`${percentage}, 100`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">{percentage}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner overflow-hidden">
            <div 
              className={`h-full rounded-full ${color} transition-all duration-1000 shadow-md relative overflow-hidden`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          
          {isHovered && details && (
            <div className="mt-4 p-3 bg-gray-50/80 rounded-xl border border-gray-200/50 animate-fadeIn">
              <div className="space-y-2">
                {details.map((detail, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{detail.label}</span>
                    <span className="text-gray-900 font-bold">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant de section moderne
const Section = ({ title, icon: Icon, children, subtitle, rightElement }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600 font-medium mt-1">{subtitle}</p>}
          </div>
        </div>
        {rightElement}
      </div>
      {children}
    </div>
  );
};

// Composant d'activité moderne
const ActivityItem = ({ activity }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'new_student': return <UserPlus className="w-4 h-4" />;
      case 'evaluation': return <BookOpen className="w-4 h-4" />;
      case 'financial': return <Wallet className="w-4 h-4" />;
      case 'system': return <Database className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'payment': return 'bg-emerald-500 text-white';
      case 'new_student': return 'bg-blue-500 text-white';
      case 'evaluation': return 'bg-purple-500 text-white';
      case 'financial': return 'bg-indigo-500 text-white';
      case 'system': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50/80 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200/50">
      <div className={`p-3 rounded-xl ${getColor(activity.type)} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
        {getIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{activity.title}</h4>
        <p className="text-xs text-gray-600 mt-1 font-medium">{activity.description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
        {activity.amount && (
          <p className="font-black text-sm text-gray-900 mt-1">{activity.amount}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
    </div>
  );
};

// Composant principal du dashboard moderne
export default function ModernDashboard() {
  const { user } = useAuth();
  
  // Hooks backend réels
  const { 
    overview, 
    loading: overviewLoading, 
    error: overviewError, 
    refetch: refetchOverview,
    servedFromCache
  } = useDashboardOverview(true);
  
  const { 
    stats: quickStats, 
    loading: quickLoading, 
    refetch: refetchQuick 
  } = useQuickStats(true);
  
  const { 
    metrics: liveMetrics, 
    loading: liveLoading, 
    refetch: refetchLive 
  } = useLiveMetrics(true);
  
  const { 
    activities, 
    loading: activitiesLoading, 
    refetch: refetchActivities 
  } = useActivityStream(true);

  const { 
    health, 
    isHealthy, 
    checkHealth 
  } = useDashboardHealth();

  // Gestion refresh global
  const handleRefresh = async () => {
    await Promise.all([
      refetchOverview(),
      refetchQuick(),
      refetchLive(),
      refetchActivities(),
      checkHealth()
    ]);
  };

  // États de chargement
  const isLoading = overviewLoading && !overview;
  const hasErrors = !!(overviewError && !overview);

  // Extraction des vraies données backend
  const coreMetrics = overview?.core_metrics;
  const financialOverview = overview?.financial_overview;

  // Données temps réel
  const todayMetrics = liveMetrics?.today;

  // Métriques principales avec vraies données
  const mainMetrics = useMemo(() => {
    if (!coreMetrics || !financialOverview) return [];

    return [
      {
        title: "Total Étudiants",
        value: coreMetrics.students.total.toLocaleString('fr-FR'),
        change: coreMetrics.students.new_this_week > 0 ? `+${coreMetrics.students.new_this_week} cette semaine` : null,
        changeType: 'increase',
        subtitle: `${coreMetrics.students.new_this_month} nouveaux ce mois`,
        icon: Users,
        gradient: "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600",
        progress: Math.round((coreMetrics.students.total / Math.max(coreMetrics.classes.total_capacity, 1)) * 100),
        details: [
          { label: 'Garçons', value: `${coreMetrics.students.male_percentage}%` },
          { label: 'Filles', value: `${coreMetrics.students.female_percentage}%` },
          { label: 'Internes', value: `${coreMetrics.students.internal_percentage}%` },
          { label: 'Orphelins', value: `${coreMetrics.students.orphan_percentage}%` }
        ]
      },
      {
        title: "Classes Actives",
        value: coreMetrics.classes.total.toLocaleString('fr-FR'),
        change: `${coreMetrics.classes.occupancy_rate}% occupation`,
        changeType: 'stable',
        subtitle: `Capacité: ${coreMetrics.classes.total_capacity}`,
        icon: School,
        gradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
        progress: coreMetrics.classes.occupancy_rate,
        details: [
          { label: 'Coraniques', value: coreMetrics.classes.coranic },
          { label: 'Françaises', value: coreMetrics.classes.french },
          { label: 'Capacité totale', value: coreMetrics.classes.total_capacity },
          { label: 'Moyenne/classe', value: coreMetrics.classes.average_capacity }
        ]
      },
      {
        title: "Capital Actuel",
        value: financialOverview.formatted_balance,
        change: financialOverview.balance_trend?.direction === 'up' ? `+${financialOverview.balance_trend.percentage}%` : 
                financialOverview.balance_trend?.direction === 'down' ? `-${financialOverview.balance_trend.percentage}%` : 'stable',
        changeType: financialOverview.balance_trend?.direction || 'stable',
        subtitle: "Solde disponible",
        icon: Wallet,
        gradient: "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600",
        details: [
          { label: 'Revenus totaux', value: financialOverview.income?.formatted_total_income || '0 FG' },
          { label: 'Dépenses totales', value: financialOverview.expenses?.formatted_total_expenses || '0 FG' },
          { label: 'Flux mensuel', value: financialOverview.formatted_monthly_flow || '0 FG' }
        ]
      },
      {
        title: "Personnel Actif",
        value: coreMetrics.staff.total.toLocaleString('fr-FR'),
        change: coreMetrics.staff.student_teacher_ratio ? `${coreMetrics.staff.student_teacher_ratio} étud./ens.` : null,
        changeType: 'stable',
        subtitle: `${coreMetrics.staff.teachers} enseignants`,
        icon: UserCheck,
        gradient: "bg-gradient-to-br from-pink-400 via-rose-500 to-red-500",
        details: [
          { label: 'Enseignants', value: coreMetrics.staff.teachers },
          { label: 'Administratif', value: coreMetrics.staff.admin },
          { label: 'Ratio étud/ens', value: coreMetrics.staff.student_teacher_ratio },
          { label: 'Nouveaux', value: coreMetrics.staff.new_this_week }
        ]
      }
    ];
  }, [coreMetrics, financialOverview]);

  // Distributions d'étudiants avec vraies données
  const studentDistributions = useMemo(() => {
    if (!coreMetrics) return [];

    const total = coreMetrics.students.total;
    
    return [
      {
        title: "Étudiants Orphelins",
        value: Math.round((coreMetrics.students.orphan_percentage / 100) * total),
        percentage: coreMetrics.students.orphan_percentage,
        icon: Heart,
        color: "bg-gradient-to-r from-pink-500 to-rose-600",
        gradient: "bg-gradient-to-br from-pink-500 to-rose-600",
        details: [
          { label: 'Pourcentage', value: `${coreMetrics.students.orphan_percentage}%` },
          { label: 'Total étudiants', value: total },
          { label: 'Âge moyen', value: `${coreMetrics.students.average_age} ans` }
        ]
      },
      {
        title: "Étudiants Internes",
        value: Math.round((coreMetrics.students.internal_percentage / 100) * total),
        percentage: coreMetrics.students.internal_percentage,
        icon: Building,
        color: "bg-gradient-to-r from-blue-500 to-indigo-600",
        gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
        details: [
          { label: 'Pourcentage', value: `${coreMetrics.students.internal_percentage}%` },
          { label: 'Logés à l\'école', value: Math.round((coreMetrics.students.internal_percentage / 100) * total) },
          { label: 'Capacité restante', value: Math.max(0, coreMetrics.classes.total_capacity - total) }
        ]
      },
      {
        title: "Étudiants Externes",
        value: Math.round((coreMetrics.students.external_percentage / 100) * total),
        percentage: coreMetrics.students.external_percentage,
        icon: Home,
        color: "bg-gradient-to-r from-emerald-500 to-teal-600",
        gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
        details: [
          { label: 'Pourcentage', value: `${coreMetrics.students.external_percentage}%` },
          { label: 'Viennent de l\'extérieur', value: Math.round((coreMetrics.students.external_percentage / 100) * total) },
          { label: 'Nouveaux ce mois', value: coreMetrics.students.new_this_month }
        ]
      }
    ];
  }, [coreMetrics]);

  // Données pour les graphiques
  const performanceData = useMemo(() => {
    if (!coreMetrics?.academic) return [];
    
    return [
      { 
        label: 'Excellence', 
        value: coreMetrics.academic.excellent_rate || 0,
        displayValue: `${coreMetrics.academic.excellent_rate || 0}%`,
        color: 'from-emerald-500 to-green-600'
      },
      { 
        label: 'Bien', 
        value: coreMetrics.academic.good_rate || 0,
        displayValue: `${coreMetrics.academic.good_rate || 0}%`,
        color: 'from-blue-500 to-cyan-600'
      },
      { 
        label: 'Passable', 
        value: 100 - (coreMetrics.academic.excellent_rate || 0) - (coreMetrics.academic.good_rate || 0) - (coreMetrics.academic.poor_rate || 0),
        displayValue: `${100 - (coreMetrics.academic.excellent_rate || 0) - (coreMetrics.academic.good_rate || 0) - (coreMetrics.academic.poor_rate || 0)}%`,
        color: 'from-yellow-500 to-orange-600'
      },
      { 
        label: 'Insuffisant', 
        value: coreMetrics.academic.poor_rate || 0,
        displayValue: `${coreMetrics.academic.poor_rate || 0}%`,
        color: 'from-red-500 to-rose-600'
      }
    ];
  }, [coreMetrics]);

  // Données comparatives financières
  const financialComparisonData = useMemo(() => {
    if (!financialOverview) return [];
    
    return [
      { 
        label: 'Revenus', 
        value: parseFloat(financialOverview.income?.total_income || 0),
        displayValue: financialOverview.income?.formatted_total_income || '0 FG',
        color: 'from-emerald-500 to-green-600'
      },
      { 
        label: 'Dépenses', 
        value: parseFloat(financialOverview.expenses?.total_expenses || 0),
        displayValue: financialOverview.expenses?.formatted_total_expenses || '0 FG',
        color: 'from-red-500 to-rose-600'
      },
      { 
        label: 'Salaires', 
        value: parseFloat(financialOverview.expenses?.salaries || 0),
        displayValue: financialOverview.expenses?.formatted_salaries || '0 FG',
        color: 'from-blue-500 to-indigo-600'
      }
    ];
  }, [financialOverview]);

  // Données d'évolution temporelle (simulation basée sur les données actuelles)
  const evolutionData = useMemo(() => {
    if (!coreMetrics) return [];
    
    const currentStudents = coreMetrics.students.total;
    const newThisWeek = coreMetrics.students.new_this_week;
    const newThisMonth = coreMetrics.students.new_this_month;
    
    // Simulation d'évolution sur 6 mois
    return [
      { label: 'Jan', value: Math.max(0, currentStudents - newThisMonth - 10), displayValue: Math.max(0, currentStudents - newThisMonth - 10) },
      { label: 'Fév', value: Math.max(0, currentStudents - newThisMonth - 5), displayValue: Math.max(0, currentStudents - newThisMonth - 5) },
      { label: 'Mar', value: Math.max(0, currentStudents - newThisMonth), displayValue: Math.max(0, currentStudents - newThisMonth) },
      { label: 'Avr', value: Math.max(0, currentStudents - newThisWeek), displayValue: Math.max(0, currentStudents - newThisWeek) },
      { label: 'Mai', value: currentStudents - Math.floor(newThisWeek/2), displayValue: currentStudents - Math.floor(newThisWeek/2) },
      { label: 'Juin', value: currentStudents, displayValue: currentStudents }
    ];
  }, [coreMetrics]);

  // Données pour graphique circulaire des étudiants
  const studentsPieData = useMemo(() => {
    if (!coreMetrics) return [];
    
    const total = coreMetrics.students.total;
    return [
      { 
        label: 'Orphelins', 
        value: Math.round((coreMetrics.students.orphan_percentage / 100) * total),
        color: '#ec4899'
      },
      { 
        label: 'Internes', 
        value: Math.round((coreMetrics.students.internal_percentage / 100) * total),
        color: '#3b82f6'
      },
      { 
        label: 'Externes', 
        value: Math.round((coreMetrics.students.external_percentage / 100) * total),
        color: '#10b981'
      }
    ];
  }, [coreMetrics]);

  // Affichage du chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-purple-600" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-gray-800">Chargement des Données</h3>
            <p className="text-gray-600 font-medium">Connexion au backend en cours...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Database className="w-4 h-4" />
              <span>Récupération des métriques temps réel</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (hasErrors) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Erreur de Connexion</h3>
            <p className="text-gray-600 mb-4">Impossible de charger les données du dashboard</p>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{overviewError}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Header moderne et épuré */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-gray-200/50 shadow-lg">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Données temps réel • {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-xs text-gray-500 font-medium">
                      {isHealthy ? 'Connecté' : 'Déconnecté'}
                    </span>
                  </div>
                  {servedFromCache && (
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-500 font-medium">Cache</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                disabled={overviewLoading}
                className="p-3 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all shadow-md group"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors ${overviewLoading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl px-4 py-3 shadow-md">
                <Clock3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Métriques principales */}
        {mainMetrics.length > 0 && (
          <Section title="Vue d'Ensemble" icon={BarChart3} subtitle="Métriques principales en temps réel">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mainMetrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>
          </Section>
        )}

        {/* Graphiques de données */}
        <Section title="Analyses et Tendances" icon={LineChartIcon} subtitle="Visualisation des données et évolutions">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Évolution des étudiants */}
            {evolutionData.length > 0 && (
              <div className="xl:col-span-2">
                <CustomLineChart 
                  data={evolutionData}
                  title="Évolution des Inscriptions (6 mois)"
                  height={300}
                />
              </div>
            )}

            {/* Répartition des étudiants */}
            {studentsPieData.length > 0 && (
              <CustomPieChart 
                data={studentsPieData}
                title="Répartition des Étudiants"
                size={250}
              />
            )}

            {/* Performance académique */}
            {performanceData.length > 0 && (
              <CustomBarChart 
                data={performanceData}
                title="Performance Académique"
                height={200}
              />
            )}

            {/* Comparaison financière */}
            {financialComparisonData.length > 0 && (
              <div className="xl:col-span-2">
                <CustomBarChart 
                  data={financialComparisonData}
                  title="Comparaison Financière"
                  height={250}
                />
              </div>
            )}
          </div>
        </Section>

        {/* Répartition des étudiants */}
        {studentDistributions.length > 0 && (
          <Section 
            title="Détail des Étudiants" 
            icon={Users}
            subtitle={`${coreMetrics?.students?.total || 0} étudiants actifs • ${coreMetrics?.students?.male_percentage || 0}% garçons, ${coreMetrics?.students?.female_percentage || 0}% filles`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentDistributions.map((dist, index) => (
                <StudentDistribution key={index} {...dist} />
              ))}
            </div>
          </Section>
        )}

        {/* Performance académique détaillée */}
        {coreMetrics?.academic && (
          <Section 
            title="Performance Académique" 
            icon={BookOpen}
            subtitle="Suivi des résultats et de l'assiduité des étudiants"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-gray-900 mb-2">{coreMetrics.academic.total_evaluations || 0}</div>
                    <p className="text-gray-700 text-sm font-bold mb-1">Évaluations Total</p>
                    <p className="text-xs text-gray-600 font-medium">+{coreMetrics.academic.evaluations_this_week || 0} cette semaine</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-gray-900 mb-2">{coreMetrics.academic.excellent_rate || 0}%</div>
                    <p className="text-gray-700 text-sm font-bold mb-1">Taux Excellence</p>
                    <p className="text-xs text-gray-600 font-medium">Moyenne: {coreMetrics.academic.average_grade || 0}/20</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-gray-900 mb-2">{coreMetrics.academic.total_pages_memorized || 0}</div>
                    <p className="text-gray-700 text-sm font-bold mb-1">Pages Mémorisées</p>
                    <p className="text-xs text-gray-600 font-medium">Total Coran</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-gray-900 mb-2">{coreMetrics.academic.average_attendance || 0}%</div>
                    <p className="text-gray-700 text-sm font-bold mb-1">Assiduité</p>
                    <p className="text-xs text-gray-600 font-medium">Moyenne mensuelle</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Overview financier détaillé */}
        {financialOverview && (
          <Section 
            title="Situation Financière" 
            icon={DollarSign}
            subtitle="Analyse complète des flux financiers"
            rightElement={
              <div className="text-right">
                <p className="text-sm text-gray-600">Solde actuel</p>
                <p className="text-xl font-black text-gray-900">{financialOverview.formatted_balance}</p>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Revenus Totaux"
                value={financialOverview.income?.formatted_total_income || '0 FG'}
                change={financialOverview.income?.income_trend?.percentage ? `${financialOverview.income.income_trend.direction === 'up' ? '+' : '-'}${financialOverview.income.income_trend.percentage}%` : null}
                changeType={financialOverview.income?.income_trend?.direction}
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                details={[
                  { label: 'Scolarité', value: financialOverview.income?.formatted_total || '0 FG' },
                  { label: 'Manuels', value: financialOverview.income?.formatted_manual_total || '0 FG' },
                  { label: 'Ce mois', value: financialOverview.income?.formatted_monthly || '0 FG' }
                ]}
              />
              
              <MetricCard
                title="Dépenses Totales"
                value={financialOverview.expenses?.formatted_total_expenses || '0 FG'}
                change={financialOverview.expenses?.expense_trend?.percentage ? `${financialOverview.expenses.expense_trend.direction === 'up' ? '+' : '-'}${financialOverview.expenses.expense_trend.percentage}%` : null}
                changeType={financialOverview.expenses?.expense_trend?.direction}
                icon={TrendingDown}
                gradient="bg-gradient-to-br from-red-500 to-rose-600"
                details={[
                  { label: 'Générales', value: financialOverview.expenses?.formatted_general || '0 FG' },
                  { label: 'Salaires', value: financialOverview.expenses?.formatted_salaires || '0 FG' },
                  { label: 'Manuelles', value: financialOverview.expenses?.formatted_manual_expenses || '0 FG' }
                ]}
              />
              
              <MetricCard
                title="Capital Actuel"
                value={financialOverview.formatted_balance || '0 FG'}
                change={financialOverview.balance_trend?.percentage ? `${financialOverview.balance_trend.direction === 'up' ? '+' : '-'}${financialOverview.balance_trend.percentage}%` : null}
                changeType={financialOverview.balance_trend?.direction || 'stable'}
                icon={Wallet}
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                details={[
                  { label: 'Solde', value: financialOverview.formatted_balance || '0 FG' },
                  { label: 'Flux mensuel', value: financialOverview.formatted_monthly_flow || '0 FG' },
                  { label: 'Évolution', value: financialOverview.balance_trend?.direction || 'stable' }
                ]}
              />
            </div>
          </Section>
        )}

        {/* Activités récentes */}
        {activities && activities.length > 0 && (
          <Section 
            title="Activités Récentes" 
            icon={Activity}
            subtitle="Événements et transactions récents"
            rightElement={
              <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
                Voir toutes
                <ChevronRight className="w-4 h-4" />
              </button>
            }
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 space-y-2">
              {activities.slice(0, 8).map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}