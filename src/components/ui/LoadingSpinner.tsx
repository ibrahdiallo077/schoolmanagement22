// src/components/ui/LoadingSpinner.tsx
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-6 w-6';
      case 'lg': return 'h-8 w-8';
      case 'xl': return 'h-12 w-12';
      default: return 'h-6 w-6';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'text-indigo-600';
      case 'white': return 'text-white';
      case 'gray': return 'text-gray-600';
      default: return 'text-indigo-600';
    }
  };

  return (
    <Loader className={`animate-spin ${getSizeClass()} ${getColorClass()} ${className}`} />
  );
};

export default LoadingSpinner;