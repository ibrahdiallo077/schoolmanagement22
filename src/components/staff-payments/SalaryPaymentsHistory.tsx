// src/components/salary-payments/SalaryPaymentsHistory.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, Edit, Trash2, ChevronDown, 
  ChevronLeft, ChevronRight, User, Building, Calendar, CreditCard,
  Receipt, AlertTriangle, CheckCircle, Clock, DollarSign, RefreshCw
} from 'lucide-react';

interface Payment {
  id: string;
  receipt_number: string;
  staff_name: string;
  staff_number: string;
  position: string;
  department: string;
  photo_url?: string;
  amount: number;
  formatted_amount: string;
  gross_amount?: number;
  formatted_gross_amount?: string;
  net_amount?: number;
  formatted_net_amount?: string;
  payment_date: string;
  payment_date_formatted: string;
  payment_type: string;
  type_label: string;
  payment_method: string;
  method_label: string;
  method_icon: string;
  payment_status: string;
  status_label: string;
  status_color: string;
  status_icon: string;
  payment_year: number;
  payment_month?: number;
  period_display: string;
  notes?: string;
}

interface PaymentFilters {
  search: string;
  payment_type: string;
  payment_method: string;
  payment_status: string;
  payment_year: string;
  payment_month: string;
}

interface PaymentType {
  value: string;
  label: string;
}

interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
}

interface PaymentStatus {
  value: string;
  label: string;
  color: string;
  icon: string;
}

interface SalaryPaymentsHistoryProps {
  onNewPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onViewPayment: (payment: Payment) => void;
}

const SalaryPaymentsHistory: React.FC<SalaryPaymentsHistoryProps> = ({
  onNewPayment,
  onEditPayment,
  onViewPayment
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    payment_type: '',
    payment_method: '',
    payment_status: '',
    payment_year: new Date().getFullYear().toString(),
    payment_month: ''
  });

  // ✅ Configuration API corrigée
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/salary-payments`;
    const url = `${baseUrl}${endpoint}`;
    
    console.log('🌍 History API Call:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });
    
    console.log('📡 History Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ History API Response:', data);
    
    return data;
  };

  const loadPayments = async (page = 1) => {
    setLoading(true);
    try {
      console.log('🔄 Chargement historique paiements...');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });
      
      const data = await apiCall(`/history?${params.toString()}`);
      if (data.success) {
        console.log('✅ Paiements chargés:', data.payments?.length || 0);
        setPayments(data.payments || []);
        setCurrentPage(data.pagination?.current_page || 1);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalItems(data.pagination?.total_items || 0);
      } else {
        console.warn('⚠️ Aucun paiement trouvé');
        setPayments([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('💥 Erreur chargement paiements:', error);
      setPayments([]);
      setTotalItems(0);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      console.log('📡 Chargement configurations...');
      
      const [typesData, methodsData, statusesData] = await Promise.all([
        apiCall('/config/payment-types'),
        apiCall('/config/payment-methods'),
        apiCall('/config/payment-statuses')
      ]);
      
      if (typesData.success) {
        setPaymentTypes(typesData.payment_types || []);
        console.log('✅ Types de paiement chargés:', typesData.payment_types?.length);
      }
      if (methodsData.success) {
        setPaymentMethods(methodsData.payment_methods || []);
        console.log('✅ Méthodes de paiement chargées:', methodsData.payment_methods?.length);
      }
      if (statusesData.success) {
        setPaymentStatuses(statusesData.payment_statuses || []);
        console.log('✅ Statuts de paiement chargés:', statusesData.payment_statuses?.length);
      }
    } catch (error) {
      console.error('💥 Erreur chargement configurations:', error);
      
      // Fallback avec données par défaut
      setPaymentTypes([
        { value: 'monthly', label: 'Salaire mensuel' },
        { value: 'bonus', label: 'Prime/Bonus' },
        { value: 'advance', label: 'Avance sur salaire' },
        { value: 'custom', label: 'Paiement personnalisé' }
      ]);
      
      setPaymentMethods([
        { value: 'cash', label: 'Espèces', icon: '💵' },
        { value: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' },
        { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
        { value: 'check', label: 'Chèque', icon: '📄' }
      ]);
      
      setPaymentStatuses([
        { value: 'pending', label: 'En attente', color: 'orange', icon: '⏳' },
        { value: 'completed', label: 'Payé', color: 'green', icon: '✅' },
        { value: 'partial', label: 'Partiel', color: 'blue', icon: '📊' },
        { value: 'cancelled', label: 'Annulé', color: 'red', icon: '❌' }
      ]);
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;
    
    try {
      const data = await apiCall(`/payment/${paymentId}`, { method: 'DELETE' });
      if (data.success) {
        loadPayments(currentPage);
        alert('Paiement supprimé avec succès!');
      }
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const changePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const data = await apiCall(`/payment/${paymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: newStatus })
      });
      
      if (data.success) {
        loadPayments(currentPage);
        alert(`Statut changé vers "${data.new_status?.label || newStatus}" avec succès!`);
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams(filters);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // ✅ CORRECTION : Utiliser la bonne route d'export si elle existe
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/salary-payments/export/csv?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `paiements_salaires_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        alert('Export terminé avec succès!');
      } else {
        throw new Error('Erreur export');
      }
    } catch (error) {
      console.error('Erreur export CSV:', error);
      alert('Fonction d\'export en cours de développement');
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      payment_type: '',
      payment_method: '',
      payment_status: '',
      payment_year: new Date().getFullYear().toString(),
      payment_month: ''
    });
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    loadPayments(1);
  }, [filters]);

  const getStatusBadgeClass = (color: string) => {
    const colorMap = {
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Receipt className="h-6 w-6 mr-3 text-blue-600" />
                Historique des Paiements de Salaires
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gestion et suivi de tous les paiements de salaires • {totalItems} paiements
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  showFilters 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-1 inline" />
                Filtres
                <ChevronDown className={`h-4 w-4 ml-1 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={() => loadPayments(currentPage)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1 inline" />
                Actualiser
              </button>
              
              <button
                onClick={exportCSV}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-1 inline" />
                Export Excel
              </button>
            </div>
          </div>
        </div>
        
        {/* Filtres */}
        {showFilters && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                    placeholder="Nom, numéro, reçu..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.payment_type}
                  onChange={(e) => setFilters(prev => ({...prev, payment_type: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les types</option>
                  {paymentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
                <select
                  value={filters.payment_method}
                  onChange={(e) => setFilters(prev => ({...prev, payment_method: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes</option>
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>{method.icon} {method.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={filters.payment_status}
                  onChange={(e) => setFilters(prev => ({...prev, payment_status: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  {paymentStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.icon} {status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <select
                  value={filters.payment_year}
                  onChange={(e) => setFilters(prev => ({...prev, payment_year: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                <select
                  value={filters.payment_month}
                  onChange={(e) => setFilters(prev => ({...prev, payment_month: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les mois</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-3 flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-semibold text-gray-900">{totalItems}</div>
              <div className="text-sm text-gray-500">Total paiements</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-semibold text-gray-900">
                {payments.filter(p => p.payment_status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Payés</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-semibold text-gray-900">
                {payments.filter(p => p.payment_status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-100">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-semibold text-gray-900">
                {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} FG
              </div>
              <div className="text-sm text-gray-500">Montant total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table des paiements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Liste des Paiements
              {totalItems > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalItems)} sur {totalItems})
                </span>
              )}
            </h3>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadPayments(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                
                <button
                  onClick={() => loadPayments(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : payments.length ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    REÇU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMPLOYÉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MONTANT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MÉTHODE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {payment.receipt_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.period_display}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {payment.photo_url ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={payment.photo_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-indigo-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{payment.staff_name}</div>
                          <div className="text-sm text-gray-500">
                            {payment.staff_number} • {payment.position}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {payment.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.formatted_amount}</div>
                      {payment.net_amount && payment.net_amount !== payment.amount && (
                        <div className="text-sm text-gray-500">Net: {payment.formatted_net_amount}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.type_label}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <span className="mr-2">{payment.method_icon}</span>
                        {payment.method_label}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {payment.payment_date_formatted}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(payment.status_color)}`}>
                          {payment.status_icon} {payment.status_label}
                        </span>
                        
                        {payment.payment_status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => changePaymentStatus(payment.id, 'completed')}
                              className="text-xs text-green-600 hover:text-green-800 px-1 py-0.5 rounded"
                              title="Marquer comme payé"
                            >
                              ✓ Payé
                            </button>
                            <button
                              onClick={() => changePaymentStatus(payment.id, 'cancelled')}
                              className="text-xs text-red-600 hover:text-red-800 px-1 py-0.5 rounded"
                              title="Annuler"
                            >
                              ✗ Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewPayment(payment)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onEditPayment(payment)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun paiement trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucun paiement ne correspond aux critères de recherche.
              </p>
              <div className="mt-6">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Affichage de {((currentPage - 1) * 20) + 1} à {Math.min(currentPage * 20, totalItems)} sur {totalItems} résultats
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadPayments(1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Premier
                </button>
                <button
                  onClick={() => loadPayments(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => loadPayments(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
                <button
                  onClick={() => loadPayments(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Dernier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryPaymentsHistory;