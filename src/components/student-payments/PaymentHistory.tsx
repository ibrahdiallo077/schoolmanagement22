import React, { useState, useEffect } from 'react';
import { 
  History, CheckCircle, Calendar, DollarSign, 
  CreditCard, FileText, Clock, Eye
} from 'lucide-react';

interface PaymentHistory {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_method: string;
  receipt_number: string;
  notes?: string;
  status?: string;
}

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface PaymentHistoryProps {
  student: Student | null;
  className?: string;
  limit?: number;
  showTitle?: boolean;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  student,
  className = "",
  limit = 5,
  showTitle = true
}) => {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Types de paiement avec leurs labels
  const paymentTypes = [
    { value: 'tuition_monthly', label: 'Frais mensuels' },
    { value: 'registration', label: 'Inscription' },
    { value: 'exam_fee', label: 'Examens' },
    { value: 'book_fee', label: 'Livres' },
    { value: 'uniform_fee', label: 'Uniforme' },
    { value: 'transport_fee', label: 'Transport' },
    { value: 'meal_fee', label: 'Repas' },
    { value: 'penalty', label: 'Pénalité' },
    { value: 'advance_payment', label: 'Avance' },
    { value: 'other', label: 'Autres' }
  ];

  // Méthodes de paiement avec leurs labels
  const paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank_transfer', label: 'Virement' },
    { value: 'card', label: 'Carte' },
    { value: 'check', label: 'Chèque' }
  ];

  const formatGNF = (amount: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentTypeLabel = (type: string) => {
    return paymentTypes.find(pt => pt.value === type)?.label || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    return paymentMethods.find(pm => pm.value === method)?.label || method;
  };

  // Chargement de l'historique des paiements
  const loadPaymentHistory = async (studentId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Essayer plusieurs endpoints possibles
      const endpoints = [
        `${baseUrl}/api/payments/students/${studentId}/history?limit=${limit}`,
        `${baseUrl}/api/payments/students/${studentId}/payments?limit=${limit}`,
        `${baseUrl}/api/students/${studentId}/payments?limit=${limit}`,
        `${baseUrl}/api/payments?student_id=${studentId}&limit=${limit}`
      ];

      let success = false;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log('Tentative de chargement depuis:', endpoint);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer dev-token',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          console.log('Réponse API status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Données historique reçues:', data);
            
            let paymentsData = [];
            
            // Adapter selon la structure de réponse
            if (Array.isArray(data)) {
              paymentsData = data;
            } else if (data.payments && Array.isArray(data.payments)) {
              paymentsData = data.payments;
            } else if (data.data && Array.isArray(data.data)) {
              paymentsData = data.data;
            } else if (data.success && Array.isArray(data.results)) {
              paymentsData = data.results;
            } else if (data.success && Array.isArray(data.history)) {
              paymentsData = data.history;
            }

            const adaptedPayments = paymentsData.map((payment: any) => ({
              id: payment.id || payment._id,
              amount: payment.amount || payment.montant || 0,
              payment_date: payment.payment_date || payment.date_paiement || payment.date,
              payment_type: payment.payment_type || payment.type_paiement || payment.type || 'tuition_monthly',
              payment_method: payment.payment_method || payment.methode_paiement || payment.methode || 'cash',
              receipt_number: payment.receipt_number || payment.numero_recu || payment.reference || 'N/A',
              notes: payment.notes || payment.commentaires || payment.note,
              status: payment.status || payment.statut || 'completed'
            }));

            setPayments(adaptedPayments);
            success = true;
            break;
            
          } else {
            const errorText = await response.text();
            lastError = `${response.status}: ${errorText}`;
            console.warn(`Échec endpoint ${endpoint}:`, lastError);
          }
        } catch (endpointError) {
          lastError = endpointError;
          console.warn(`Erreur endpoint ${endpoint}:`, endpointError);
        }
      }

      if (!success) {
        throw new Error(lastError || 'Aucun endpoint disponible');
      }
      
    } catch (error) {
      console.error('Erreur chargement historique paiements:', error);
      setError('Impossible de charger l\'historique des paiements');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.id) {
      loadPaymentHistory(student.id);
    } else {
      setPayments([]);
    }
  }, [student?.id, limit]);

  if (!student) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {showTitle && (
        <div className="p-3 border-b bg-gray-50">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <History className="w-4 h-4 text-blue-600" />
            Historique des paiements
            {payments.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {payments.length}
              </span>
            )}
          </h4>
        </div>
      )}

      <div className="p-3">
        {loading ? (
          <div className="text-center py-6">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Chargement de l'historique...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-600 text-sm font-medium mb-1">Erreur de chargement</p>
            <p className="text-red-500 text-xs">{error}</p>
            <button
              onClick={() => student?.id && loadPaymentHistory(student.id)}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm mb-1">Aucun paiement trouvé</p>
            <p className="text-gray-500 text-xs">
              Cet étudiant n'a encore effectué aucun paiement
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.slice(0, limit).map((payment, index) => (
              <div 
                key={payment.id || index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </p>
                      {payment.status && payment.status !== 'completed' && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {payment.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        #{payment.receipt_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {getPaymentMethodLabel(payment.payment_method)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-green-600 text-sm">
                    {formatGNF(payment.amount)}
                  </p>
                  {payment.notes && (
                    <p className="text-xs text-gray-500 mt-0.5 max-w-24 truncate" title={payment.notes}>
                      {payment.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {payments.length > limit && (
              <div className="text-center pt-2">
                <p className="text-xs text-blue-600 font-medium">
                  +{payments.length - limit} autres paiements
                </p>
                <button
                  onClick={() => student?.id && loadPaymentHistory(student.id)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Voir tout l'historique
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Résumé rapide */}
      {payments.length > 0 && (
        <div className="px-3 py-2 bg-blue-50 border-t text-xs">
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">
              Total des paiements récents:
            </span>
            <span className="font-bold text-blue-800">
              {formatGNF(payments.slice(0, limit).reduce((sum, payment) => sum + payment.amount, 0))}
            </span>
          </div>
          {payments.length > 1 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-blue-600">
                Dernier paiement:
              </span>
              <span className="text-blue-700">
                {new Date(payments[0].payment_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;