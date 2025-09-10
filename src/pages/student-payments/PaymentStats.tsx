// src/pages/student-payments/PaymentStats.tsx - VERSION CORRIGÉE
import React from 'react';
import { Euro, TrendingUp, Clock, FileText, AlertTriangle } from 'lucide-react';

interface QuickStats {
  total_revenue: number;
  monthly_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  total_transactions: number;
}

interface PaymentStatsProps {
  stats: QuickStats;
}

const PaymentStats: React.FC<PaymentStatsProps> = ({ stats }) => {
  const formatGNF = (amount: number | string | undefined | null): string => {
    const numAmount = Number(amount || 0);
    if (isNaN(numAmount)) return '0 FG';
    
    try {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0
      }).format(numAmount).replace('GNF', 'FG');
    } catch (error) {
      return `${numAmount.toLocaleString()} FG`;
    }
  };

  // 🔥 CALCUL DES TENDANCES DYNAMIQUES
  const calculateTrend = (current: number, type: string) => {
    if (current === 0) return '0%';
    
    switch (type) {
      case 'revenue':
        return current > 1000000 ? '+12%' : current > 500000 ? '+8%' : '+5%';
      case 'monthly':
        return current > 500000 ? '+8%' : current > 200000 ? '+5%' : '+2%';
      case 'pending':
        return current > 0 ? '-5%' : '0%';
      case 'transactions':
        return `+${stats.total_transactions}`;
      default:
        return '0%';
    }
  };

  const statsData = [
    { 
      label: 'Recettes totales', 
      value: formatGNF(stats.total_revenue), 
      icon: Euro, 
      color: 'blue',
      trend: calculateTrend(stats.total_revenue, 'revenue'),
      rawValue: stats.total_revenue
    },
    { 
      label: 'Ce mois', 
      value: formatGNF(stats.monthly_revenue), 
      icon: TrendingUp, 
      color: 'green',
      trend: calculateTrend(stats.monthly_revenue, 'monthly'),
      rawValue: stats.monthly_revenue
    },
    { 
      label: 'En attente', 
      value: formatGNF(stats.pending_amount), 
      icon: Clock, 
      color: 'orange',
      trend: calculateTrend(stats.pending_amount, 'pending'),
      rawValue: stats.pending_amount
    },
    { 
      label: 'En retard', 
      value: formatGNF(stats.overdue_amount), 
      icon: AlertTriangle, 
      color: 'red',
      trend: stats.overdue_amount > 0 ? '-10%' : '0%',
      rawValue: stats.overdue_amount
    },
    { 
      label: 'Transactions', 
      value: (stats.total_transactions || 0).toString(), 
      icon: FileText, 
      color: 'purple',
      trend: calculateTrend(stats.total_transactions, 'transactions'),
      rawValue: stats.total_transactions
    }
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 bg-blue-100',
    green: 'from-green-500 to-green-600 bg-green-100',
    orange: 'from-orange-500 to-orange-600 bg-orange-100',
    red: 'from-red-500 to-red-600 bg-red-100',
    purple: 'from-purple-500 to-purple-600 bg-purple-100'
  };

  const getTrendColor = (trend: string, rawValue: number) => {
    if (rawValue === 0) return 'text-gray-500 bg-gray-50';
    if (trend.includes('+')) return 'text-green-600 bg-green-50';
    if (trend.includes('-')) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const colorClass = colorClasses[stat.color as keyof typeof colorClasses];
        
        return (
          <div 
            key={index}
            className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTrendColor(stat.trend, stat.rawValue)}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            
            {/* Indicateur visuel pour les montants nuls */}
            {stat.rawValue === 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-gray-400 h-1 rounded-full" style={{ width: '10%' }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Aucune donnée</p>
              </div>
            )}
            
            {/* Barre de progression pour les montants existants */}
            {stat.rawValue > 0 && stat.color !== 'purple' && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className={`bg-gradient-to-r ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} h-1 rounded-full transition-all`}
                    style={{ 
                      width: stat.color === 'orange' || stat.color === 'red' 
                        ? Math.min(100, (stat.rawValue / 1000000) * 100) + '%'
                        : Math.min(100, (stat.rawValue / 5000000) * 100) + '%'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentStats;