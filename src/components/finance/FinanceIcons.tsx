// src/components/finance/FinanceIcons.tsx - Encodage Corrigé
import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  Activity,
  Target,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Save,
  Edit,
  Trash2,
  FileText,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Settings,
  Filter,
  Search,
  BarChart,
  PieChart,
  LineChart
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// Composants d'icônes financières avec props personnalisées
export const FinanceIcons = {
  // Icônes monétaires
  Currency: ({ className, size = 24, color }: IconProps) => (
    <DollarSign className={className} size={size} color={color} />
  ),
  
  // Tendances
  TrendUp: ({ className, size = 24, color }: IconProps) => (
    <TrendingUp className={className} size={size} color={color} />
  ),
  
  TrendDown: ({ className, size = 24, color }: IconProps) => (
    <TrendingDown className={className} size={size} color={color} />
  ),
  
  ArrowUp: ({ className, size = 24, color }: IconProps) => (
    <ArrowUpRight className={className} size={size} color={color} />
  ),
  
  ArrowDown: ({ className, size = 24, color }: IconProps) => (
    <ArrowDownRight className={className} size={size} color={color} />
  ),
  
  Stable: ({ className, size = 24, color }: IconProps) => (
    <Minus className={className} size={size} color={color} />
  ),
  
  // Métriques et analyses
  Activity: ({ className, size = 24, color }: IconProps) => (
    <Activity className={className} size={size} color={color} />
  ),
  
  Target: ({ className, size = 24, color }: IconProps) => (
    <Target className={className} size={size} color={color} />
  ),
  
  // Entités
  Users: ({ className, size = 24, color }: IconProps) => (
    <Users className={className} size={size} color={color} />
  ),
  
  User: ({ className, size = 24, color }: IconProps) => (
    <User className={className} size={size} color={color} />
  ),
  
  Building: ({ className, size = 24, color }: IconProps) => (
    <Building className={className} size={size} color={color} />
  ),
  
  // Paiements
  CreditCard: ({ className, size = 24, color }: IconProps) => (
    <CreditCard className={className} size={size} color={color} />
  ),
  
  // Dates et temps
  Calendar: ({ className, size = 24, color }: IconProps) => (
    <Calendar className={className} size={size} color={color} />
  ),
  
  Clock: ({ className, size = 24, color }: IconProps) => (
    <Clock className={className} size={size} color={color} />
  ),
  
  // États et alertes
  AlertTriangle: ({ className, size = 24, color }: IconProps) => (
    <AlertTriangle className={className} size={size} color={color} />
  ),
  
  CheckCircle: ({ className, size = 24, color }: IconProps) => (
    <CheckCircle className={className} size={size} color={color} />
  ),
  
  XCircle: ({ className, size = 24, color }: IconProps) => (
    <XCircle className={className} size={size} color={color} />
  ),
  
  // Actions
  Eye: ({ className, size = 24, color }: IconProps) => (
    <Eye className={className} size={size} color={color} />
  ),
  
  Download: ({ className, size = 24, color }: IconProps) => (
    <Download className={className} size={size} color={color} />
  ),
  
  Upload: ({ className, size = 24, color }: IconProps) => (
    <Upload className={className} size={size} color={color} />
  ),
  
  RefreshCw: ({ className, size = 24, color }: IconProps) => (
    <RefreshCw className={className} size={size} color={color} />
  ),
  
  Plus: ({ className, size = 24, color }: IconProps) => (
    <Plus className={className} size={size} color={color} />
  ),
  
  Save: ({ className, size = 24, color }: IconProps) => (
    <Save className={className} size={size} color={color} />
  ),
  
  Edit: ({ className, size = 24, color }: IconProps) => (
    <Edit className={className} size={size} color={color} />
  ),
  
  Trash: ({ className, size = 24, color }: IconProps) => (
    <Trash2 className={className} size={size} color={color} />
  ),
  
  // Documents
  FileText: ({ className, size = 24, color }: IconProps) => (
    <FileText className={className} size={size} color={color} />
  ),
  
  // Contact
  Phone: ({ className, size = 24, color }: IconProps) => (
    <Phone className={className} size={size} color={color} />
  ),
  
  Mail: ({ className, size = 24, color }: IconProps) => (
    <Mail className={className} size={size} color={color} />
  ),
  
  MapPin: ({ className, size = 24, color }: IconProps) => (
    <MapPin className={className} size={size} color={color} />
  ),
  
  // Utilitaires
  Settings: ({ className, size = 24, color }: IconProps) => (
    <Settings className={className} size={size} color={color} />
  ),
  
  Filter: ({ className, size = 24, color }: IconProps) => (
    <Filter className={className} size={size} color={color} />
  ),
  
  Search: ({ className, size = 24, color }: IconProps) => (
    <Search className={className} size={size} color={color} />
  ),
  
  // Graphiques
  BarChart: ({ className, size = 24, color }: IconProps) => (
    <BarChart className={className} size={size} color={color} />
  ),
  
  PieChart: ({ className, size = 24, color }: IconProps) => (
    <PieChart className={className} size={size} color={color} />
  ),
  
  LineChart: ({ className, size = 24, color }: IconProps) => (
    <LineChart className={className} size={size} color={color} />
  )
};

// Composant pour afficher une icône de statut colorée
export const StatusIcon: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  size?: number;
  className?: string;
}> = ({ status, size = 24, className = '' }) => {
  const getIconAndColor = () => {
    switch (status) {
      case 'success':
        return { icon: CheckCircle, color: '#10B981' };
      case 'warning':
        return { icon: AlertTriangle, color: '#F59E0B' };
      case 'error':
        return { icon: XCircle, color: '#EF4444' };
      case 'info':
      default:
        return { icon: Activity, color: '#3B82F6' };
    }
  };
  
  const { icon: Icon, color } = getIconAndColor();
  
  return <Icon className={className} size={size} color={color} />;
};

// Composant pour afficher une icône de tendance
export const TrendIcon: React.FC<{
  direction: 'up' | 'down' | 'stable';
  size?: number;
  className?: string;
}> = ({ direction, size = 16, className = '' }) => {
  switch (direction) {
    case 'up':
      return <ArrowUpRight className={`${className} text-green-500`} size={size} />;
    case 'down':
      return <ArrowDownRight className={`${className} text-red-500`} size={size} />;
    case 'stable':
    default:
      return <Minus className={`${className} text-gray-500`} size={size} />;
  }
};

// Composant pour afficher une icône de type de transaction
export const TransactionTypeIcon: React.FC<{
  type: 'INCOME' | 'EXPENSE';
  size?: number;
  className?: string;
}> = ({ type, size = 20, className = '' }) => {
  if (type === 'INCOME') {
    return <TrendingUp className={`${className} text-green-500`} size={size} />;
  } else {
    return <TrendingDown className={`${className} text-red-500`} size={size} />;
  }
};

// Composant pour afficher une icône de santé financière
export const HealthIcon: React.FC<{
  level: 'excellent' | 'good' | 'warning' | 'critical';
  size?: number;
  className?: string;
}> = ({ level, size = 24, className = '' }) => {
  const getIconAndColor = () => {
    switch (level) {
      case 'excellent':
        return { icon: CheckCircle, color: '#10B981' };
      case 'good':
        return { icon: Activity, color: '#3B82F6' };
      case 'warning':
        return { icon: AlertTriangle, color: '#F59E0B' };
      case 'critical':
        return { icon: XCircle, color: '#EF4444' };
      default:
        return { icon: Activity, color: '#6B7280' };
    }
  };
  
  const { icon: Icon, color } = getIconAndColor();
  
  return <Icon className={className} size={size} color={color} />;
};

// Composant pour l'avatar de méthode de paiement
export const PaymentMethodIcon: React.FC<{
  method: string;
  size?: number;
  className?: string;
}> = ({ method, size = 20, className = '' }) => {
  const getIcon = () => {
    switch (method.toLowerCase()) {
      case 'cash':
      case 'especes':
        return '💵';
      case 'bank_transfer':
      case 'virement':
        return '🏦';
      case 'mobile_money':
      case 'mobile':
        return '📱';
      case 'check':
      case 'cheque':
        return '📄';
      case 'card':
      case 'carte':
        return '💳';
      default:
        return '💼';
    }
  };
  
  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ fontSize: size }}
    >
      {getIcon()}
    </span>
  );
};

export default FinanceIcons;