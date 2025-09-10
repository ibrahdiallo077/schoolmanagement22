// src/pages/student-payments/PaymentTable.tsx
import React from 'react';
import { 
  FileText, Plus, Download, Eye, Edit, Trash2, Receipt, Heart,
  CreditCard, Calendar, BookOpen, UserCheck, MapPin, AlertTriangle, 
  TrendingUp, DollarSign
} from 'lucide-react';

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  status: 'interne' | 'externe';
  is_orphan: boolean;
  age: number;
  photo_url?: string;
  coranic_class?: {
    id: string;
    name: string;
    level?: string;
  };
  guardian_name?: string;
  guardian_phone?: string;
}

interface Payment {
  id: string;
  receipt_number: string;
  student: Student;
  amount: number;
  amount_due: number;
  formatted_amount: string;
  payment_date: string;
  payment_type: string;
  custom_payment_type?: string;
  payment_method: string;
  status: string;
  period: string;
  payment_month: number;
  payment_year: number;
  number_of_months: number;
  paid_by: string;
  notes?: string;
  created_at: string;
  completion_rate: number;
  is_complete: boolean;
  difference: number;
}

interface PaymentTableProps {
  payments: Payment[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  onViewDetails: (payment: Payment) => void;
  onShowReceipt: (payment: Payment) => void;
  onDownloadReceipt: (payment: Payment) => void;
  onNewPayment: () => void;
  totalItems: number;
  itemsPerPage: number;
}

const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  totalPages,
  currentPage,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  onEdit,
  onDelete,
  onViewDetails,
  onShowReceipt,
  onDownloadReceipt,
  onNewPayment,
  totalItems,
  itemsPerPage
}) => {
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

  const getStudentInitials = (student: Student | undefined | null): string => {
    if (!student) return 'UN';
    const firstName = student.first_name?.trim() || 'U';
    const lastName = student.last_name?.trim() || 'N';
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  const getStatusStyle = (status: string): string => {
    const styles: Record<string, string> = {
      'Payé': 'bg-green-100 text-green-800 border-green-200',
      'Partiel': 'bg-orange-100 text-orange-800 border-orange-200',
      'En attente': 'bg-blue-100 text-blue-800 border-blue-200',
      'En retard': 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentMethodIcon = (method: string): string => {
    const methodData = paymentMethods.find(pm => pm.value === method);
    return methodData?.icon || '💰';
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Historique des Paiements ({payments.length})
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                onSortChange(field, order as 'asc' | 'desc');
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="payment_date-desc">Plus récent</option>
              <option value="payment_date-asc">Plus ancien</option>
              <option value="amount-desc">Montant ↓</option>
              <option value="amount-asc">Montant ↑</option>
              <option value="student.full_name-asc">Nom A-Z</option>
              <option value="student.full_name-desc">Nom Z-A</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table ou message vide */}
      {payments.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun paiement trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            Aucun paiement ne correspond aux critères de recherche.
          </p>
          <button
            onClick={onNewPayment}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Nouveau Paiement
          </button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reçu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {payments.map((payment) => {
                  if (!payment || !payment.id) return null;
                  
                  return (
                    <tr key={payment.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => onShowReceipt(payment)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                          >
                            <Receipt className="w-4 h-4" />
                            {payment.receipt_number || 'N/A'}
                          </button>
                          <p className="text-xs text-gray-500">
                            {payment.created_at ? new Date(payment.created_at).toLocaleString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {getStudentInitials(payment.student)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {payment.student?.full_name || 'N/A'}
                              {payment.student?.is_orphan && (
                                <Heart className="w-3 h-3 text-orange-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span>#{payment.student?.student_number || 'N/A'}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                payment.student?.status === 'interne' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {payment.student?.status || 'externe'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{formatGNF(payment.amount)}</span>
                          {!payment.is_complete && (
                            <div className="text-xs text-orange-600">
                              Sur {formatGNF(payment.amount_due)}
                            </div>
                          )}
                          {payment.is_complete && payment.difference > 0 && (
                            <div className="text-xs text-green-600">
                              +{formatGNF(payment.difference)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-700">
                            {payment.payment_type === 'other' 
                              ? (payment.custom_payment_type || 'Autres')
                              : (paymentTypes.find(pt => pt.value === payment.payment_type)?.label || 'N/A')
                            }
                          </p>
                          <p className="text-xs text-gray-500">{payment.period || 'N/A'}</p>
                          {(payment.number_of_months || 0) > 1 && (
                            <p className="text-xs text-blue-600">{payment.number_of_months} mois</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPaymentMethodIcon(payment.payment_method)}</span>
                          <div>
                            <p className="text-sm text-gray-700">
                              {paymentMethods.find(pm => pm.value === payment.payment_method)?.label || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">Par: {payment.paid_by || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(payment.status)}`}>
                            {payment.status}
                          </span>
                          {!payment.is_complete && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-orange-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(100, payment.completion_rate || 0)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => onDownloadReceipt(payment)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Télécharger le reçu PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onViewDetails(payment)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onEdit(payment)}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Modifier le paiement"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(payment.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Supprimer le paiement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200/60 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} paiements
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white' 
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentTable;