// src/components/salary-payments/SalaryPaymentsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, TrendingUp, Calendar, Receipt, User, Plus, Eye, RefreshCw, 
  CheckCircle, Clock, AlertCircle, CreditCard
} from 'lucide-react';

interface DashboardData {
  period: {
    year: number;
    month?: number;
    month_name?: string;
    school_year?: any;
  };
  main_cards: {
    total_receipts: {
      value: number;
      formatted_value: string;
      count: number;
    };
    completed: {
      value: number;
      formatted_value: string;
      count: number;
    };
    pending: {
      value: number;
      formatted_value: string;
      count: number;
    };
    average: {
      value: number;
      formatted_value: string;
    };
  };
  recent_payments: Array<{
    id: string;
    receipt_number: string;
    staff_name: string;
    staff_number: string;
    position: string;
    photo_url?: string;
    formatted_amount: string;
    payment_date_formatted: string;
    status_label: string;
    status_color: string;
    status_icon: string;
    method_label: string;
    method_icon: string;
  }>;
  statistics: {
    total_payments: number;
    completed_payments: number;
    pending_payments: number;
    completion_rate: number;
    formatted_total_amount: string;
    formatted_completed_amount: string;
    formatted_pending_amount: string;
  };
  staff_info: {
    total_active_staff: number;
    staff_with_salary_config: number;
    staff_paid_current_period: number;
  };
}

interface SalaryPaymentsDashboardProps {
  onNewPayment: () => void;
  onViewHistory: () => void;
  onViewPayment: (paymentId: string) => void;
}

const SalaryPaymentsDashboard: React.FC<SalaryPaymentsDashboardProps> = ({
  onNewPayment,
  onViewHistory,
  onViewPayment
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // ✅ Configuration API corrigée
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/salary-payments`;
    const url = `${baseUrl}${endpoint}`;
    
    console.log('🌍 Dashboard API Call:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });
    
    console.log('📡 Dashboard Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Dashboard API Response:', data);
    
    return data;
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement dashboard...');
      
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedMonth) {
        params.append('month', selectedMonth.toString());
      }
      
      const data = await apiCall(`/dashboard?${params.toString()}`);
      
      if (data.success && data.dashboard) {
        console.log('✅ Dashboard chargé:', data.dashboard);
        setDashboardData(data.dashboard);
      } else {
        console.error('❌ Erreur API ou pas de données dashboard');
        setDashboardData(createEmptyDashboard());
      }
    } catch (error) {
      console.error('💥 Erreur chargement dashboard:', error);
      setDashboardData(createEmptyDashboard());
    } finally {
      setLoading(false);
    }
  };

  // ✅ Création de données vides par défaut
  const createEmptyDashboard = (): DashboardData => ({
    period: {
      year: selectedYear,
      month: selectedMonth || undefined,
      month_name: selectedMonth ? new Date(2024, selectedMonth - 1).toLocaleDateString('fr-FR', { month: 'long' }) : undefined
    },
    main_cards: {
      total_receipts: { value: 0, formatted_value: '0 FG', count: 0 },
      completed: { value: 0, formatted_value: '0 FG', count: 0 },
      pending: { value: 0, formatted_value: '0 FG', count: 0 },
      average: { value: 0, formatted_value: '0 FG' }
    },
    recent_payments: [],
    statistics: {
      total_payments: 0,
      completed_payments: 0,
      pending_payments: 0,
      completion_rate: 0,
      formatted_total_amount: '0 FG',
      formatted_completed_amount: '0 FG',
      formatted_pending_amount: '0 FG'
    },
    staff_info: {
      total_active_staff: 0,
      staff_with_salary_config: 0,
      staff_paid_current_period: 0
    }
  });

  useEffect(() => {
    loadDashboard();
  }, [selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header simplifié */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <DollarSign className="h-8 w-8 mr-3 text-blue-600" />
                Tableau de Bord - Paiements Salaires
              </h1>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {dashboardData?.period.school_year?.name ? 
                  `Année scolaire: ${dashboardData.period.school_year.name}` : 
                  `Année ${selectedYear}${selectedMonth ? ` • ${dashboardData?.period.month_name}` : ''}`
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Sélecteur de période simplifié */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toute l'année</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={loadDashboard}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1 inline" />
                Actualiser
              </button>
              
              <button
                onClick={onNewPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1 inline" />
                Nouveau Paiement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes principales simplifiées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total des paiements */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Payé</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.main_cards.total_receipts.formatted_value || '0 FG'}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.main_cards.total_receipts.count || 0} paiements
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500 text-white">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Paiements terminés */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Terminés</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.main_cards.completed.formatted_value || '0 FG'}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.main_cards.completed.count || 0} paiements
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500 text-white">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* En attente */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">En Attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.main_cards.pending.formatted_value || '0 FG'}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData?.main_cards.pending.count || 0} paiements
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500 text-white">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Personnel</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.staff_info.staff_with_salary_config || 0}
              </p>
              <p className="text-sm text-gray-500">
                avec config salaire
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500 text-white">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      {dashboardData?.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Taux de Réussite</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {dashboardData.statistics.completion_rate}%
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardData.statistics.completed_payments} / {dashboardData.statistics.total_payments} paiements
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${dashboardData.statistics.completion_rate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total Encaissé</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {dashboardData.statistics.formatted_completed_amount}
                </p>
                <p className="text-sm text-gray-500">Montants payés</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">En Attente</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {dashboardData.statistics.formatted_pending_amount}
                </p>
                <p className="text-sm text-gray-500">Montants à payer</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paiements récents */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Paiements Récents ({dashboardData?.recent_payments?.length || 0})
            </h3>
            <button
              onClick={onViewHistory}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              Voir tout l'historique
              <Eye className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {dashboardData?.recent_payments?.length ? (
            <div className="space-y-4">
              {dashboardData.recent_payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {payment.photo_url ? (
                        <img className="w-10 h-10 rounded-full object-cover" src={payment.photo_url} alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600">{payment.receipt_number}</div>
                      <div className="text-sm text-gray-900">{payment.staff_name}</div>
                      <div className="text-sm text-gray-500">{payment.staff_number} • {payment.position}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{payment.formatted_amount}</div>
                    <div className="text-sm text-gray-500">{payment.payment_date_formatted}</div>
                  </div>
                  
                  <div className="text-center">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status_color === 'green' ? 'bg-green-100 text-green-800' :
                      payment.status_color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      payment.status_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status_icon} {payment.status_label}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm flex items-center justify-center">
                      <span className="mr-1">{payment.method_icon}</span>
                      <span className="text-xs text-gray-500">{payment.method_label}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onViewPayment(payment.id)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Voir détails"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun paiement récent</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedMonth ? 
                  `Aucun paiement pour ${dashboardData?.period.month_name} ${selectedYear}.` :
                  `Aucun paiement pour l'année ${selectedYear}.`
                }
              </p>
              <button
                onClick={onNewPayment}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le Premier Paiement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryPaymentsDashboard;