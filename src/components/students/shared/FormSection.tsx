// src/components/students/shared/FormSection.tsx
import React, { useState } from 'react';
import { 
  LucideIcon, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Star,
  Info,
  Zap,
  Shield,
  Award,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'modern' | 'glass' | 'gradient' | 'card';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  completed?: boolean;
  showProgress?: boolean;
  progressValue?: number;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = "from-blue-500 to-indigo-600",
  bgColor = "bg-blue-50",
  className = "",
  children,
  variant = 'modern',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  completed = false,
  showProgress = false,
  progressValue = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Configuration des variants
  const variantStyles = {
    default: {
      container: 'bg-white border border-gray-200 rounded-lg shadow-sm',
      header: 'bg-gray-50 border-b border-gray-200',
      content: 'p-6'
    },
    modern: {
      container: 'bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
      header: 'bg-gradient-to-r from-gray-50 to-white border-b border-gray-200/50',
      content: 'p-8'
    },
    glass: {
      container: 'bg-white/30 backdrop-blur-xl border-2 border-white/30 rounded-2xl shadow-2xl',
      header: 'bg-white/20 backdrop-blur-sm border-b border-white/30',
      content: 'p-8'
    },
    gradient: {
      container: `bg-gradient-to-br ${iconColor} rounded-2xl shadow-2xl text-white`,
      header: 'bg-white/10 backdrop-blur-sm border-b border-white/20',
      content: 'p-8'
    },
    card: {
      container: 'bg-white rounded-2xl shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-102',
      header: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200',
      content: 'p-8'
    }
  };

  const styles = variantStyles[variant];
  const isGradientVariant = variant === 'gradient';

  return (
    <div className={`group relative overflow-hidden ${styles.container} ${className}`}>
      
      {/* Header de section */}
      <div className={`${styles.header} transition-all duration-300`}>
        <div className="flex items-center justify-between p-6">
          
          {/* Contenu principal du header */}
          <div className="flex items-center gap-4 flex-1">
            
            {/* Icône avec effet moderne */}
            <div className="relative">
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110
                ${isGradientVariant 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : `bg-gradient-to-r ${iconColor}`
                }
              `}>
                <Icon className={`w-6 h-6 ${isGradientVariant ? 'text-white' : 'text-white'}`} />
              </div>
              
              {/* Badge de statut */}
              {completed && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
              
              {required && !completed && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Titre et description */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isGradientVariant ? 'text-white' : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  {title}
                </h2>
                
                {/* Badges d'état */}
                <div className="flex items-center gap-2">
                  {required && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                      <Star className="w-3 h-3" />
                      Requis
                    </span>
                  )}
                  
                  {completed && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Complété
                    </span>
                  )}
                </div>
              </div>
              
              {description && (
                <p className={`text-base mt-1 ${
                  isGradientVariant ? 'text-white/80' : 'text-gray-600'
                }`}>
                  {description}
                </p>
              )}
              
              {/* Barre de progression */}
              {showProgress && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={isGradientVariant ? 'text-white/80' : 'text-gray-600'}>
                      Progression
                    </span>
                    <span className={`font-semibold ${isGradientVariant ? 'text-white' : 'text-blue-600'}`}>
                      {Math.round(progressValue)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(Math.max(progressValue, 0), 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bouton de collapse */}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`
                p-2 rounded-lg transition-all duration-200 hover:scale-110
                ${isGradientVariant 
                  ? 'hover:bg-white/20 text-white' 
                  : 'hover:bg-gray-100 text-gray-600'
                }
              `}
            >
              {isCollapsed ? 
                <ChevronDown className="w-5 h-5" /> : 
                <ChevronUp className="w-5 h-5" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Contenu de la section */}
      {(!collapsible || !isCollapsed) && (
        <div className={`${styles.content} space-y-6`}>
          {children}
        </div>
      )}
      
      {/* Effet de brillance sur hover */}
      {variant === 'modern' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
};

interface FormGridProps {
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  responsive?: boolean;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

export const FormGrid: React.FC<FormGridProps> = ({
  cols = 2,
  gap = 'md',
  children,
  className = "",
  responsive = true,
  alignItems = 'start'
}) => {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const colClasses = responsive ? {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  } : {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${alignClasses[alignItems]} ${className}`}>
      {children}
    </div>
  );
};

interface InfoCardProps {
  title: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'modern' | 'glass' | 'outlined';
  clickable?: boolean;
  onClick?: () => void;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  color = "blue",
  children,
  className = "",
  variant = 'modern',
  clickable = false,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorStyles = {
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      title: 'text-blue-900'
    },
    green: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      title: 'text-green-900'
    },
    purple: {
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      icon: 'bg-purple-100 text-purple-600',
      title: 'text-purple-900'
    },
    orange: {
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      icon: 'bg-orange-100 text-orange-600',
      title: 'text-orange-900'
    },
    red: {
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      title: 'text-red-900'
    },
    gray: {
      bg: 'from-gray-50 to-slate-50',
      border: 'border-gray-200',
      icon: 'bg-gray-100 text-gray-600',
      title: 'text-gray-900'
    }
  };

  const variantStyles = {
    default: `border ${colorStyles[color].border} bg-gradient-to-br ${colorStyles[color].bg}`,
    modern: `border-2 ${colorStyles[color].border} bg-gradient-to-br ${colorStyles[color].bg} shadow-lg hover:shadow-xl`,
    glass: `border-2 border-white/30 bg-white/20 backdrop-blur-xl`,
    outlined: `border-2 ${colorStyles[color].border} bg-white hover:bg-gradient-to-br hover:${colorStyles[color].bg}`
  };

  const styles = colorStyles[color];

  return (
    <div 
      className={`
        group relative overflow-hidden rounded-2xl p-6 transition-all duration-300
        ${variantStyles[variant]}
        ${clickable ? 'cursor-pointer hover:scale-102' : ''}
        ${className}
      `}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Header de la card */}
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
            ${variant === 'glass' ? 'bg-white/20 text-white' : styles.icon}
            ${isHovered ? 'scale-110' : ''}
          `}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-5 h-5'
            })}
          </div>
        )}
        
        <h4 className={`
          text-lg font-bold transition-colors duration-300
          ${variant === 'glass' ? 'text-white' : styles.title}
        `}>
          {title}
        </h4>
        
        {clickable && (
          <div className="ml-auto">
            <ArrowRight className={`
              w-5 h-5 transition-all duration-300
              ${variant === 'glass' ? 'text-white/70' : 'text-gray-400'}
              ${isHovered ? 'translate-x-1 text-blue-500' : ''}
            `} />
          </div>
        )}
      </div>
      
      {/* Contenu */}
      <div className={variant === 'glass' ? 'text-white/90' : 'text-gray-700'}>
        {children}
      </div>
      
      {/* Effet de brillance au hover */}
      {variant === 'modern' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
};

interface RadioOptionProps {
  label: string;
  value: string;
  selectedValue: string;
  onChange: (value: string) => void;
  icon?: string;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'red';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'modern' | 'card';
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  label,
  value,
  selectedValue,
  onChange,
  icon,
  description,
  color = 'blue',
  disabled = false,
  size = 'md',
  variant = 'modern'
}) => {
  const isSelected = selectedValue === value;
  
  const colorClasses = {
    blue: {
      selected: 'border-blue-400 bg-blue-50 text-blue-800 ring-4 ring-blue-500/20',
      hover: 'hover:border-blue-300 hover:bg-blue-50/50'
    },
    green: {
      selected: 'border-green-400 bg-green-50 text-green-800 ring-4 ring-green-500/20',
      hover: 'hover:border-green-300 hover:bg-green-50/50'
    },
    purple: {
      selected: 'border-purple-400 bg-purple-50 text-purple-800 ring-4 ring-purple-500/20',
      hover: 'hover:border-purple-300 hover:bg-purple-50/50'
    },
    pink: {
      selected: 'border-pink-400 bg-pink-50 text-pink-800 ring-4 ring-pink-500/20',
      hover: 'hover:border-pink-300 hover:bg-pink-50/50'
    },
    orange: {
      selected: 'border-orange-400 bg-orange-50 text-orange-800 ring-4 ring-orange-500/20',
      hover: 'hover:border-orange-300 hover:bg-orange-50/50'
    },
    red: {
      selected: 'border-red-400 bg-red-50 text-red-800 ring-4 ring-red-500/20',
      hover: 'hover:border-red-300 hover:bg-red-50/50'
    }
  };

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  };

  const variantClasses = {
    default: 'border-2 rounded-lg',
    modern: 'border-2 rounded-xl shadow-md hover:shadow-lg',
    card: 'border-2 rounded-2xl shadow-lg hover:shadow-xl'
  };

  const styles = colorClasses[color];

  return (
    <label 
      className={`
        group relative flex items-center gap-4 cursor-pointer transition-all duration-300
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : `${styles.hover} hover:scale-102`}
        ${isSelected 
          ? `${styles.selected} scale-105 shadow-xl` 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      <input
        type="radio"
        value={value}
        checked={isSelected}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="sr-only"
      />
      
      {/* Indicateur radio custom */}
      <div className={`
        relative w-5 h-5 rounded-full border-2 transition-all duration-200
        ${isSelected ? `border-${color}-500 bg-${color}-500` : 'border-gray-300 bg-white'}
      `}>
        {isSelected && (
          <div className="absolute inset-1 rounded-full bg-white animate-pulse" />
        )}
      </div>
      
      {/* Icône optionnelle */}
      {icon && (
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
          ${isSelected ? `bg-${color}-100` : 'bg-gray-100'}
        `}>
          <span className="text-xl">{icon}</span>
        </div>
      )}
      
      {/* Contenu */}
      <div className="flex-1">
        <span className="font-semibold block">{label}</span>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      {/* Badge de sélection */}
      {isSelected && (
        <div className={`flex items-center gap-1 px-2 py-1 bg-${color}-100 text-${color}-700 rounded-full text-xs font-semibold`}>
          <CheckCircle className="w-3 h-3" />
          <span>Sélectionné</span>
        </div>
      )}
      
      {/* Effet de brillance au hover */}
      {variant === 'modern' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </label>
  );
};

export default FormSection;