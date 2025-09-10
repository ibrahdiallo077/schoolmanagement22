// src/pages/student-payments/PaymentFilters.tsx
import React from 'react';
import { Search, Calendar, FileText, CreditCard, MapPin, Heart, AlertTriangle, TrendingUp, DollarSign, UserCheck, BookOpen } from 'lucide-react';

interface FilterState {
  searchTerm: string;
  statusFilter: string;
  periodFilter: string;
  paymentTypeFilter: string;
  paymentMethodFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface PaymentFiltersProps {
  filters: FilterState;
  onFiltersChange: (newFilters: Partial<FilterState>) => void;
  resultCount: number;
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  resultCount 
}) => {
  const paymentTypes = [
    { value: 'tuition_monthly', label: 'Frais mensuels', icon: Calendar },
    { value: 'registration', label: 'Inscription', icon: FileText },
    { value: 'exam_fee', label: 'Examens', icon: FileText },
    { value: 'book_fee', label: 'Livres', icon: BookOpen },
    { value: 'uniform_fee', label: 'Uniforme', icon: UserCheck },
    { value: 'transport_fee', label: 'Transport', icon: MapPin },
    { value: 'meal_fee', label: 'Repas', icon: Heart },
    { value: 'penalty', label: 'Pénalité', icon: AlertTriangle },
    { value: 'advance_payment', label: 'Avance', icon: TrendingUp },
    { value: 'other', label: 'Autres', icon: DollarSign }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Espèces', icon: '💵' },
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
    { value: 'bank_transfer', label: 'Virement', icon: '🏦' },
    { value: 'card', label: 'Carte', icon: '💳' },
    { value: 'check', label: 'Chèque', icon: '📄' }
  ];

  const handleInputChange = (field: keyof FilterState, value: any) => {
    onFiltersChange({ [field]: value });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const clearDateRange = () => {
    onFiltersChange({
      dateRange: { start: '', end: '' }
    });
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6 mb-8">
      {/* Filtres principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Recherche */}
        <div className="lg:col-span-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.searchTerm}
              onChange={(e) => handleInputChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80"
            />
          </div>
        </div>
        
        {/* Statut */}
        <select 
          value={filters.statusFilter}
          onChange={(e) => handleInputChange('statusFilter', e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
        >
          <option value="all">Tous statuts</option>
          <option value="Payé">Payé</option>
          <option value="Partiel">Partiel</option>
          <option value="En attente">En attente</option>
          <option value="En retard">En retard</option>
        </select>
        
        {/* Type de paiement */}
        <select 
          value={filters.paymentTypeFilter}
          onChange={(e) => handleInputChange('paymentTypeFilter', e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
        >
          <option value="all">Tous types</option>
          {paymentTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        
        {/* Méthode de paiement */}
        <select 
          value={filters.paymentMethodFilter}
          onChange={(e) => handleInputChange('paymentMethodFilter', e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
        >
          <option value="all">Toutes méthodes</option>
          {paymentMethods.map(method => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
        
        {/* Période */}
        <select 
          value={filters.periodFilter}
          onChange={(e) => handleInputChange('periodFilter', e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
        >
          <option value="all">Toutes périodes</option>
          <option value="Juillet 2025">Juillet 2025</option>
          <option value="Juin 2025">Juin 2025</option>
          <option value="Mai 2025">Mai 2025</option>
        </select>
      </div>
      
      {/* Filtres de date */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearDateRange}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Effacer dates
          </button>
        </div>
        <div className="flex items-end justify-end">
          <span className="text-sm text-gray-500">
            {resultCount} résultat{resultCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentFilters;