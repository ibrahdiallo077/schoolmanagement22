// src/components/dashboard/StatCard.tsx - CARTE STATISTIQUE MODERNE

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  blue: {
    gradient: 'from-blue-500/10 to-cyan-500/5',
    border: 'border-blue-200/50',
    icon: 'text-blue-600 bg-blue-50',
    accent: 'text-blue-700',
    glow: 'hover:shadow-blue-100',
  },
  green: {
    gradient: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-200/50',
    icon: 'text-green-600 bg-green-50',
    accent: 'text-green-700',
    glow: 'hover:shadow-green-100',
  },
  purple: {
    gradient: 'from-purple-500/10 to-violet-500/5',
    border: 'border-purple-200/50',
    icon: 'text-purple-600 bg-purple-50',
    accent: 'text-purple-700',
    glow: 'hover:shadow-purple-100',
  },
  orange: {
    gradient: 'from-orange-500/10 to-amber-500/5',
    border: 'border-orange-200/50',
    icon: 'text-orange-600 bg-orange-50',
    accent: 'text-orange-700',
    glow: 'hover:shadow-orange-100',
  },
  red: {
    gradient: 'from-red-500/10 to-rose-500/5',
    border: 'border-red-200/50',
    icon: 'text-red-600 bg-red-50',
    accent: 'text-red-700',
    glow: 'hover:shadow-red-100',
  },
  teal: {
    gradient: 'from-teal-500/10 to-cyan-500/5',
    border: 'border-teal-200/50',
    icon: 'text-teal-600 bg-teal-50',
    accent: 'text-teal-700',
    glow: 'hover:shadow-teal-100',
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue', 
  isLoading = false,
  className,
  onClick 
}: StatCardProps) {
  const variant = colorVariants[color];
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString('fr-FR');
    }
    return val;
  };

  const TrendIcon = trend?.isPositive ? TrendingUp : trend?.isPositive === false ? TrendingDown : Minus;

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:scale-[1.02]',
        'border shadow-sm bg-gradient-to-br from-white to-gray-50/30',
        variant.border,
        variant.glow,
        'hover:shadow-lg cursor-pointer',
        onClick && 'hover:shadow-xl',
        className
      )}
      onClick={onClick}
    >
      {/* Gradient d'arrière-plan */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', variant.gradient)} />
      
      {/* Effet de brillance */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
      
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            {/* Titre */}
            <p className="text-sm font-medium text-gray-600 tracking-wide">
              {title}
            </p>
            
            {/* Valeur principale */}
            <div className="space-y-1">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className={cn('text-3xl font-bold tracking-tight', variant.accent)}>
                  {formatValue(value)}
                </p>
              )}
              
              {/* Tendance */}
              {trend && !isLoading && (
                <div className="flex items-center gap-1">
                  <TrendIcon className={cn(
                    'w-3 h-3',
                    trend.isPositive ? 'text-green-600' : 
                    trend.isPositive === false ? 'text-red-600' : 'text-gray-400'
                  )} />
                  <span className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 
                    trend.isPositive === false ? 'text-red-600' : 'text-gray-500'
                  )}>
                    {Math.abs(trend.value)}% {trend.label || 'ce mois'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Icône */}
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'shadow-sm border border-white/20',
            variant.icon
          )}>
            {isLoading ? (
              <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </div>
        </div>
        
        {/* Badge de statut (optionnel) */}
        {trend && trend.isPositive !== undefined && !isLoading && (
          <div className="mt-4 flex justify-end">
            <Badge 
              variant="secondary" 
              className={cn(
                'text-xs',
                trend.isPositive ? 'bg-green-50 text-green-700 border-green-200' :
                trend.isPositive === false ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
              )}
            >
              {trend.isPositive ? 'En hausse' : trend.isPositive === false ? 'En baisse' : 'Stable'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Variante compacte pour les widgets
export function CompactStatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  isLoading = false,
  className 
}: Omit<StatCardProps, 'trend'>) {
  const variant = colorVariants[color];
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg border',
      'bg-gradient-to-r from-white to-gray-50/50',
      variant.border,
      className
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', variant.icon)}>
        {isLoading ? (
          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-600 truncate">{title}</p>
        {isLoading ? (
          <div className="h-5 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className={cn('text-lg font-semibold', variant.accent)}>
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </p>
        )}
      </div>
    </div>
  );
}

// Grid de cartes statistiques
interface StatGridProps {
  stats: Array<StatCardProps>;
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  compact?: boolean;
  className?: string;
}

export function StatGrid({ 
  stats, 
  isLoading = false, 
  columns = 4, 
  compact = false,
  className 
}: StatGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  
  const StatComponent = compact ? CompactStatCard : StatCard;
  
  return (
    <div className={cn(
      'grid gap-4 lg:gap-6',
      gridCols[columns],
      className
    )}>
      {stats.map((stat, index) => (
        <StatComponent
          key={index}
          {...stat}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}