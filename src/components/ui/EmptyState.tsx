// src/components/ui/EmptyState.tsx
import React from 'react';
import { BookOpen, Search, Plus, Users } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'book' | 'search' | 'plus' | 'users' | React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'book',
  title,
  description,
  action,
  className = ""
}) => {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconProps = "h-12 w-12 text-gray-400 mx-auto mb-4";
    
    switch (icon) {
      case 'book':
        return <BookOpen className={iconProps} />;
      case 'search':
        return <Search className={iconProps} />;
      case 'plus':
        return <Plus className={iconProps} />;
      case 'users':
        return <Users className={iconProps} />;
      default:
        return <BookOpen className={iconProps} />;
    }
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        {getIcon()}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {description}
        </p>

        {action && (
          <div className="flex justify-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;