// src/components/students/shared/FormField.tsx
import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Calendar,
  ChevronDown,
  Sparkles,
  Info,
  Star,
  Zap,
  ArrowDown
} from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'password' | 'select' | 'textarea' | 'checkbox';
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  description?: string;
  options?: SelectOption[];
  rows?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'modern' | 'glass' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showSuccess?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  icon,
  description,
  options,
  rows = 4,
  disabled = false,
  className = "",
  variant = 'modern',
  size = 'md',
  showSuccess = false,
  min,
  max,
  step
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Configuration des tailles
  const sizeConfig = {
    sm: {
      input: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      iconContainer: 'left-3 top-2.5',
      label: 'text-xs',
      description: 'text-xs'
    },
    md: {
      input: 'px-4 py-3 text-base',
      icon: 'w-5 h-5',
      iconContainer: 'left-4 top-3.5',
      label: 'text-sm',
      description: 'text-xs'
    },
    lg: {
      input: 'px-5 py-4 text-lg',
      icon: 'w-6 h-6',
      iconContainer: 'left-5 top-4.5',
      label: 'text-base',
      description: 'text-sm'
    }
  };

  // Configuration des variants
  const variantConfig = {
    default: {
      container: 'bg-white border-2 border-gray-200',
      focused: 'border-blue-500 ring-4 ring-blue-500/20',
      error: 'border-red-400 bg-red-50/50 ring-4 ring-red-500/20',
      success: 'border-green-400 bg-green-50/50 ring-4 ring-green-500/20',
      disabled: 'bg-gray-100 border-gray-200'
    },
    modern: {
      container: 'bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200/50 shadow-sm',
      focused: 'border-blue-400 ring-4 ring-blue-500/20 shadow-lg scale-102',
      error: 'border-red-400 bg-red-50/50 ring-4 ring-red-500/20 shadow-lg',
      success: 'border-green-400 bg-green-50/50 ring-4 ring-green-500/20 shadow-lg',
      disabled: 'bg-gray-100/50 border-gray-200'
    },
    glass: {
      container: 'bg-white/20 backdrop-blur-xl border-2 border-white/30',
      focused: 'border-white/60 ring-4 ring-white/20 shadow-2xl scale-102',
      error: 'border-red-400/60 bg-red-500/20 ring-4 ring-red-500/20',
      success: 'border-green-400/60 bg-green-500/20 ring-4 ring-green-500/20',
      disabled: 'bg-gray-500/20 border-gray-400/30'
    },
    minimal: {
      container: 'bg-transparent border-0 border-b-2 border-gray-300',
      focused: 'border-blue-500 bg-blue-50/30',
      error: 'border-red-500 bg-red-50/30',
      success: 'border-green-500 bg-green-50/30',
      disabled: 'border-gray-200 bg-gray-50/30'
    }
  };

  const config = sizeConfig[size];
  const styles = variantConfig[variant];

  // Déterminer l'état du champ
  const getFieldState = () => {
    if (error) return 'error';
    if (showSuccess && value && !error) return 'success';
    if (isFocused) return 'focused';
    if (disabled) return 'disabled';
    return 'default';
  };

  const fieldState = getFieldState();
  const isValid = showSuccess && value && !error;

  // Classes de base
  const baseClasses = `
    w-full transition-all duration-300 ease-out rounded-xl
    ${config.input}
    ${styles.container}
    ${styles[fieldState]}
    ${icon ? (type === 'textarea' ? 'pl-12' : 'pl-12') : ''}
    ${type === 'password' ? 'pr-12' : ''}
    ${variant === 'minimal' ? 'rounded-none' : ''}
    disabled:cursor-not-allowed disabled:opacity-60
    placeholder:text-gray-400
  `;

  // Rendu des différents types de champs
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <div className="relative">
            <select
              id={name}
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              className={`${baseClasses} appearance-none cursor-pointer`}
            >
              <option value="" disabled className="text-gray-400">
                {placeholder || `Sélectionnez ${label.toLowerCase()}`}
              </option>
              {options?.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className="text-gray-900 bg-white py-2"
                >
                  {option.icon && `${option.icon} `}{option.label}
                </option>
              ))}
            </select>
            
            {/* Flèche custom */}
            <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-200 ${isFocused ? 'rotate-180' : ''}`}>
              <ChevronDown className={`${config.icon} text-gray-400`} />
            </div>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            id={name}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={rows}
            disabled={disabled}
            placeholder={placeholder}
            className={`${baseClasses} resize-none`}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                id={name}
                checked={value as boolean}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="sr-only"
              />
              <div className={`
                w-6 h-6 rounded-lg border-2 transition-all duration-200
                flex items-center justify-center
                ${(value as boolean) 
                  ? 'bg-blue-600 border-blue-600 shadow-lg' 
                  : 'border-gray-300 bg-white group-hover:border-blue-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}>
                {(value as boolean) && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <span className={`${config.label} font-medium text-gray-700 group-hover:text-gray-900 transition-colors`}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id={name}
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder={placeholder}
              className={baseClasses}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${config.icon} text-gray-400 hover:text-gray-600 transition-colors`}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={name}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className={baseClasses}
          />
        );

      default:
        return (
          <input
            type={type}
            id={name}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      
      {/* Label */}
      {type !== 'checkbox' && (
        <label 
          htmlFor={name} 
          className={`block font-semibold text-gray-700 ${config.label} transition-colors duration-200 ${isFocused ? 'text-blue-600' : ''}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          
          {/* Badge pour champs requis */}
          {required && (
            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md text-xs">
              <Star className="w-2.5 h-2.5" />
              Requis
            </span>
          )}
        </label>
      )}
      
      {/* Container du champ */}
      <div className="relative group">
        
        {/* Icône */}
        {icon && type !== 'checkbox' && (
          <div className={`absolute ${config.iconContainer} transition-colors duration-200 z-10 ${isFocused ? 'text-blue-500' : 'text-gray-400'}`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: config.icon
            })}
          </div>
        )}
        
        {/* Champ de saisie */}
        {renderInput()}
        
        {/* Indicateur de validation */}
        {(isValid || error) && type !== 'checkbox' && (
          <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${config.icon}`}>
            {isValid ? (
              <CheckCircle className={`${config.icon} text-green-500`} />
            ) : error ? (
              <AlertTriangle className={`${config.icon} text-red-500`} />
            ) : null}
          </div>
        )}
        
        {/* Effet de focus animé */}
        {isFocused && variant === 'modern' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 rounded-xl pointer-events-none animate-pulse" />
        )}
      </div>
      
      {/* Description */}
      {description && (
        <div className={`flex items-start gap-2 ${config.description} text-gray-500`}>
          <Info className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
          <p>{description}</p>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className={`flex items-start gap-2 ${config.description} text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200`}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {/* Message de succès */}
      {isValid && !error && (
        <div className={`flex items-start gap-2 ${config.description} text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200`}>
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="font-medium">Champ valide ✓</p>
        </div>
      )}
      
      {/* Aide contextuelle pour certains types */}
      {type === 'date' && !description && (
        <div className={`flex items-center gap-2 ${config.description} text-gray-400`}>
          <Calendar className="w-3 h-3" />
          <span>Format: JJ/MM/AAAA</span>
        </div>
      )}
      
      {type === 'tel' && !description && (
        <div className={`flex items-center gap-2 ${config.description} text-gray-400`}>
          <Sparkles className="w-3 h-3" />
          <span>Ex: 623 45 67 89</span>
        </div>
      )}
      
      {type === 'email' && !description && (
        <div className={`flex items-center gap-2 ${config.description} text-gray-400`}>
          <Zap className="w-3 h-3" />
          <span>Ex: nom@domaine.com</span>
        </div>
      )}
    </div>
  );
};

// Composants spécialisés pour des cas d'usage courants
export const TextInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="text" />
);

export const EmailInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="email" />
);

export const PhoneInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="tel" />
);

export const DateInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="date" />
);

export const NumberInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="number" />
);

export const PasswordInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="password" />
);

export const SelectInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="select" />
);

export const TextareaInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="textarea" />
);

export const CheckboxInput: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField {...props} type="checkbox" />
);

export default FormField;