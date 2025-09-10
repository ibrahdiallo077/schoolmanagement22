// src/components/ui/FormAlert.tsx
import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface FormAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const FormAlert: React.FC<FormAlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = ""
}) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600" />,
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: <Info className="h-5 w-5 text-gray-600" />,
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {styles.icon}
        </div>
        
        <div className="flex-1">
          {title && (
            <h3 className={`text-sm font-semibold mb-1 ${styles.titleColor}`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${styles.messageColor}`}>
            {message}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ml-3 p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-600 transition-colors ${styles.titleColor}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FormAlert;