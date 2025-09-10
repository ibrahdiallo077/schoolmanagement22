// src/pages/student-payments/PaymentModals.tsx
import React from 'react';
import { 
  X, Eye, Download, Edit, Receipt, Printer,
  Calendar, BookOpen, UserCheck, MapPin, Heart, 
  AlertTriangle, TrendingUp, DollarSign, FileText
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

interface PaymentModalsProps {
  selectedPayment: Payment | null;
  showDetailsModal: boolean;
  showReceiptModal: boolean;
  onCloseDetails: () => void;
  onCloseReceipt: () => void;
  onEdit: (payment: Payment) => void;
  onDownloadReceipt: (payment: Payment) => void;
}

const PaymentModals: React.FC<PaymentModalsProps> = ({
  selectedPayment,
  showDetailsModal,
  showReceiptModal,
  onCloseDetails,
  onCloseReceipt,
  onEdit,
  onDownloadReceipt
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

  if (!selectedPayment) return null;

  return (
    <>
      {/* Modal de détails */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <div className="flex items-center justify-between text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  Détails du paiement
                </h2>
                <button
                  onClick={onCloseDetails}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Étudiant</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nom complet:</span>
                      <p className="font-medium">{selectedPayment.student?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">N° Étudiant:</span>
                      <p className="font-medium">{selectedPayment.student?.student_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut:</span>
                      <p className="font-medium capitalize">{selectedPayment.student?.status || 'N/A'}</p>
                    </div>
                    {selectedPayment.student?.coranic_class?.name && (
                      <div>
                        <span className="text-gray-600">Classe:</span>
                        <p className="font-medium">{selectedPayment.student.coranic_class.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">Paiement</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">N° Reçu:</span>
                      <p className="font-medium font-mono">{selectedPayment.receipt_number}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">
                        {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Montant dû:</span>
                      <p className="font-medium text-red-600">{formatGNF(selectedPayment.amount_due)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Montant payé:</span>
                      <p className="font-medium text-green-600">{formatGNF(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium">
                        {selectedPayment.payment_type === 'other' 
                          ? (selectedPayment.custom_payment_type || 'Autres')
                          : (paymentTypes.find(pt => pt.value === selectedPayment.payment_type)?.label || 'N/A')
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Méthode:</span>
                      <p className="font-medium">
                        {paymentMethods.find(pm => pm.value === selectedPayment.payment_method)?.label || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Période:</span>
                      <p className="font-medium">{selectedPayment.period}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Payé par:</span>
                      <p className="font-medium">{selectedPayment.paid_by}</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${
                  selectedPayment.is_complete ? 'bg-green-50' : 'bg-orange-50'
                }`}>
                  <h3 className={`font-semibold mb-3 ${
                    selectedPayment.is_complete ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    Statut du paiement
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Progression:</span>
                      <span className="font-bold">{Math.round(selectedPayment.completion_rate || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          selectedPayment.is_complete ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(100, selectedPayment.completion_rate || 0)}%` }}
                      ></div>
                    </div>
                    <div className="text-center">
                      {selectedPayment.is_complete ? (
                        selectedPayment.difference > 0 ? (
                          <p className="text-green-600 font-medium">
                            ✅ Paiement complet avec excédent de {formatGNF(selectedPayment.difference)}
                          </p>
                        ) : (
                          <p className="text-green-600 font-medium">✅ Paiement complet</p>
                        )
                      ) : (
                        <p className="text-orange-600 font-medium">
                          ⚠️ Reste à payer: {formatGNF(Math.abs(selectedPayment.difference || 0))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => onDownloadReceipt(selectedPayment)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger reçu PDF
                </button>
                <button
                  onClick={() => {
                    onCloseDetails();
                    onEdit(selectedPayment);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reçu */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
              <div className="flex items-center justify-between text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Receipt className="w-6 h-6" />
                  Reçu de paiement
                </h2>
                <button
                  onClick={onCloseReceipt}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4 text-sm">
                <div className="text-center border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-900">REÇU DE PAIEMENT</h3>
                  <p className="text-gray-600">École Coranique</p>
                  <p className="font-mono text-lg font-bold text-blue-600 mt-2">
                    {selectedPayment.receipt_number}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium">
                      {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Heure:</span>
                    <p className="font-medium">
                      {selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleTimeString('fr-FR') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">ÉTUDIANT</h4>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Nom:</span> <span className="font-medium">{selectedPayment.student?.full_name || 'N/A'}</span></p>
                    <p><span className="text-gray-600">N° Étudiant:</span> <span className="font-medium">{selectedPayment.student?.student_number || 'N/A'}</span></p>
                    {selectedPayment.student?.coranic_class?.name && (
                      <p><span className="text-gray-600">Classe:</span> <span className="font-medium">{selectedPayment.student.coranic_class.name}</span></p>
                    )}
                    <p><span className="text-gray-600">Statut:</span> <span className="font-medium capitalize">{selectedPayment.student?.status || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">PAIEMENT</h4>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Type:</span> <span className="font-medium">
                      {selectedPayment.payment_type === 'other' 
                        ? (selectedPayment.custom_payment_type || 'Autres')
                        : (paymentTypes.find(pt => pt.value === selectedPayment.payment_type)?.label || 'N/A')
                      }
                    </span></p>
                    <p><span className="text-gray-600">Période:</span> <span className="font-medium">{selectedPayment.period || 'N/A'}</span></p>
                    {(selectedPayment.number_of_months || 0) > 1 && (
                      <p><span className="text-gray-600">Nombre de mois:</span> <span className="font-medium">{selectedPayment.number_of_months}</span></p>
                    )}
                    <p><span className="text-gray-600">Montant dû:</span> <span className="font-medium text-red-600">{formatGNF(selectedPayment.amount_due)}</span></p>
                    <p><span className="text-gray-600">Montant payé:</span> <span className="font-medium text-green-600">{formatGNF(selectedPayment.amount)}</span></p>
                    <p><span className="text-gray-600">Méthode:</span> <span className="font-medium">
                      {paymentMethods.find(pm => pm.value === selectedPayment.payment_method)?.label || 'N/A'}
                    </span></p>
                    <p><span className="text-gray-600">Payé par:</span> <span className="font-medium">{selectedPayment.paid_by || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className={`text-center p-3 rounded-lg ${
                    selectedPayment.is_complete ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'
                  }`}>
                    {selectedPayment.is_complete ? (
                      selectedPayment.difference > 0 ? (
                        <div>
                          <p className="font-bold">✅ PAIEMENT COMPLET</p>
                          <p className="text-sm">Excédent: {formatGNF(selectedPayment.difference)}</p>
                        </div>
                      ) : (
                        <p className="font-bold">✅ PAIEMENT COMPLET</p>
                      )
                    ) : (
                      <div>
                        <p className="font-bold">⚠️ PAIEMENT PARTIEL</p>
                        <p className="text-sm">Reste: {formatGNF(Math.abs(selectedPayment.difference || 0))}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">NOTES</h4>
                    <p className="text-gray-700 bg-gray-50 p-2 rounded">{selectedPayment.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4 text-center">
                  <p className="text-xs text-gray-500">Merci pour votre confiance</p>
                  <div className="mt-4 border-t border-gray-300 pt-2">
                    <p className="text-xs text-gray-400">Signature: ___________________</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => onDownloadReceipt(selectedPayment)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentModals;