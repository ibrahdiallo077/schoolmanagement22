import React, { useState, useEffect } from 'react';
import { 
  Save, X, DollarSign, Calendar, CreditCard, 
  CheckCircle, AlertTriangle, ArrowRight, ArrowLeft,
  Eye, User, Receipt, Plus, Calculator, FileText,
  Edit3, PieChart, Wallet, AlertCircle
} from 'lucide-react';
import StudentSearchPayment from './StudentSearchPayment';
import PaymentHistory from './PaymentHistory';
import { useStudentFees } from '../../hooks/useStudentFees';
import { paymentService } from '../../services/paymentService';
import { 
  PaymentStudent, 
  CreatePaymentData, 
  PaymentMethod, 
  PaymentType,
  PAYMENT_TYPES,
  PAYMENT_METHODS
} from '../../types/payment.types';

interface PaymentFormProps {
  onSuccess?: (paymentData: any) => void;
  onCancel?: () => void;
  className?: string;
  editingPayment?: any;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  onSuccess, 
  onCancel, 
  className = "",
  editingPayment = null 
}) => {
  const [selectedStudent, setSelectedStudent] = useState<PaymentStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('student');

  // Utiliser le hook personnalisé pour les frais
  const { 
    studentFees, 
    loading: feesLoading, 
    error: feesError,
    refetch: refetchFees 
  } = useStudentFees(selectedStudent?.id || null);

  // Générer automatiquement le numéro de référence
  const generateReceiptNumber = () => {
    return paymentService.generateReceiptNumber();
  };

  const [formData, setFormData] = useState({
    amount_due: '',
    amount_paid: '',
    payment_method: 'cash' as PaymentMethod,
    payment_type: 'tuition_monthly' as PaymentType,
    custom_payment_type: '',
    paid_by: '',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_month: new Date().getMonth() + 1,
    payment_year: new Date().getFullYear(),
    number_of_months: 1,
    receipt_number: generateReceiptNumber()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fonction utilitaire pour obtenir le nom complet
  const getStudentDisplayName = (student: PaymentStudent): string => {
    if (student.full_name && student.full_name.trim()) {
      return student.full_name.trim();
    }
    const firstName = student.first_name?.trim() || 'Prénom';
    const lastName = student.last_name?.trim() || 'Nom';
    return `${firstName} ${lastName}`;
  };

  // Étapes du wizard
  const steps = [
    { id: 'student', label: 'Étudiant', icon: User },
    { id: 'payment', label: 'Paiement', icon: DollarSign },
    { id: 'review', label: 'Validation', icon: Eye }
  ];

  // Mois de l'année
  const months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ];

  // Si on édite un paiement, pré-remplir les données
  useEffect(() => {
    if (editingPayment) {
      setFormData({
        amount_due: editingPayment.amount_due?.toString() || '',
        amount_paid: editingPayment.amount?.toString() || '',
        payment_method: editingPayment.payment_method || 'cash',
        payment_type: editingPayment.payment_type || 'tuition_monthly',
        custom_payment_type: editingPayment.custom_payment_type || '',
        paid_by: editingPayment.paid_by || '',
        notes: editingPayment.notes || '',
        payment_date: editingPayment.payment_date || new Date().toISOString().split('T')[0],
        payment_month: editingPayment.payment_month || new Date().getMonth() + 1,
        payment_year: editingPayment.payment_year || new Date().getFullYear(),
        number_of_months: editingPayment.number_of_months || 1,
        receipt_number: editingPayment.receipt_number || generateReceiptNumber()
      });

      if (editingPayment.student) {
        setSelectedStudent(editingPayment.student);
        setSearchQuery(getStudentDisplayName(editingPayment.student));
      }
    }
  }, [editingPayment]);

  // Sélection d'étudiant
  const handleStudentSelect = async (student: PaymentStudent) => {
    console.log('🎯 Étudiant sélectionné:', student);
    setSelectedStudent(student);
    
    const displayName = getStudentDisplayName(student);
    const payerName = student.guardian_name || displayName;
    setFormData(prev => ({
      ...prev,
      paid_by: payerName
    }));
  };

  // Calcul automatique du montant total basé sur les frais récupérés
  useEffect(() => {
    if (formData.payment_type === 'tuition_monthly' && studentFees?.fees?.monthly_amount) {
      const monthlyAmount = studentFees.fees.monthly_amount;
      const totalAmount = monthlyAmount * formData.number_of_months;
      setFormData(prev => ({
        ...prev,
        amount_due: totalAmount.toString()
      }));
    }
  }, [formData.number_of_months, formData.payment_type, studentFees]);

  const nextStep = () => {
    if (currentStep === 'student' && !selectedStudent) {
      setErrors({ student: 'Veuillez sélectionner un étudiant' });
      return;
    }
    
    if (currentStep === 'payment') {
      const newErrors: Record<string, string> = {};
      
      if (!formData.amount_due || parseFloat(formData.amount_due) <= 0) {
        newErrors.amount_due = 'Montant dû requis';
      }
      if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
        newErrors.amount_paid = 'Montant payé requis';
      }
      if (!formData.paid_by?.trim()) {
        newErrors.paid_by = 'Nom du payeur requis';
      }
      if (formData.payment_type === 'other' && !formData.custom_payment_type?.trim()) {
        newErrors.custom_payment_type = 'Veuillez préciser le type de paiement';
      }
      if (formData.number_of_months < 1 || formData.number_of_months > 12) {
        newErrors.number_of_months = 'Nombre de mois invalide (1-12)';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    
    setErrors({});
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const formatGNF = (amount: number) => {
    return paymentService.formatGNF(amount);
  };

  const calculateDifference = () => {
    const amountDue = parseFloat(formData.amount_due) || 0;
    const amountPaid = parseFloat(formData.amount_paid) || 0;
    const difference = amountPaid - amountDue;
    
    return {
      amount_due: amountDue,
      amount_paid: amountPaid,
      difference: difference,
      is_complete: difference >= 0,
      is_excess: difference > 0,
      is_insufficient: difference < 0,
      completion_rate: amountDue > 0 ? Math.min(100, (amountPaid / amountDue) * 100) : 0
    };
  };

  const paymentCalc = calculateDifference();

  // Fonction principale de soumission utilisant le service
  const handleSubmit = async () => {
    if (!selectedStudent) {
      console.error('❌ Aucun étudiant sélectionné');
      return;
    }

    console.log('🚀 === DÉBUT SOUMISSION PAIEMENT ===');
    console.log('👤 Étudiant:', selectedStudent.id, getStudentDisplayName(selectedStudent));
    
    setSubmitting(true);
    setErrors({});
    
    try {
      // Préparer les données pour l'API avec tous les champs requis
      const paymentData: CreatePaymentData = {
        student_id: selectedStudent.id,
        amount: parseFloat(formData.amount_paid),
        amount_due: parseFloat(formData.amount_due),
        payment_method: formData.payment_method,
        payment_type: formData.payment_type,
        custom_payment_type: formData.payment_type === 'other' ? formData.custom_payment_type : undefined,
        receipt_number: formData.receipt_number,
        reference_number: formData.receipt_number,
        transaction_id: `TXN-${Date.now()}`, // Générer un ID de transaction
        notes: formData.notes || undefined,
        paid_by: formData.paid_by,
        payment_date: formData.payment_date, // Déjà au bon format YYYY-MM-DD
        payment_month: formData.payment_month,
        payment_year: formData.payment_year,
        number_of_months: formData.number_of_months
      };

      console.log('📋 Données de paiement préparées:', {
        ...paymentData,
        // Masquer les données sensibles dans les logs
        student_id: paymentData.student_id.substring(0, 8) + '...',
        debug_info: {
          all_required_fields_present: !!(
            paymentData.student_id &&
            paymentData.amount &&
            paymentData.payment_method &&
            paymentData.payment_type &&
            paymentData.paid_by &&
            paymentData.payment_date &&
            paymentData.payment_month &&
            paymentData.payment_year
          ),
          form_data_state: {
            amount_paid: formData.amount_paid,
            amount_due: formData.amount_due,
            payment_date: formData.payment_date,
            payment_month: formData.payment_month,
            payment_year: formData.payment_year
          }
        }
      });

      let result;
      if (editingPayment) {
        result = await paymentService.updatePayment(editingPayment.id, paymentData);
      } else {
        result = await paymentService.createPayment(paymentData);
      }

      if (result.success) {
        console.log('🎉 Paiement enregistré avec succès!');
        
        const receiptNumber = result.payment?.receipt_number || 
                             result.receipt_number || 
                             formData.receipt_number;
        
        // Préparer les données complètes du paiement pour le parent
        const completePaymentData = {
          ...result.payment || result.data || result,
          student: selectedStudent,
          receipt_number: receiptNumber,
          student_name: getStudentDisplayName(selectedStudent),
          formatted_amount: formatGNF(parseFloat(formData.amount_paid)),
          payment_calc: paymentCalc,
          success_message: `${editingPayment ? 'Paiement modifié' : 'Paiement enregistré'} avec succès!

📧 Reçu N°: ${receiptNumber}
👤 Étudiant: ${getStudentDisplayName(selectedStudent)}
📅 Période: ${months.find(m => m.value === formData.payment_month)?.label} ${formData.payment_year}
${formData.number_of_months > 1 ? `🗓️ Nombre de mois: ${formData.number_of_months}` : ''}
💰 Montant dû: ${formatGNF(paymentCalc.amount_due)}
💸 Montant payé: ${formatGNF(paymentCalc.amount_paid)}
👥 Payé par: ${formData.paid_by}

${paymentCalc.is_complete ? 
  paymentCalc.is_excess ? 
    `✅ Paiement complet avec excédent de ${formatGNF(Math.abs(paymentCalc.difference))}` :
    '✅ Paiement complet' :
  `⚠️ Paiement partiel - Reste: ${formatGNF(Math.abs(paymentCalc.difference))}`
}`
        };

        console.log('📤 Données complètes préparées pour onSuccess');

        if (onSuccess) {
          onSuccess(completePaymentData);
        }
        
      } else {
        console.error('💥 Échec enregistrement:', result.error);
        setErrors({ 
          submit: result.error || 'Erreur lors de l\'enregistrement du paiement' 
        });
      }
      
    } catch (error) {
      console.error('💥 Erreur critique:', error);
      setErrors({ 
        submit: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      });
    } finally {
      setSubmitting(false);
      console.log('🏁 === FIN SOUMISSION PAIEMENT ===');
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement'}
              </h1>
              <p className="text-gray-600 text-sm">
                {editingPayment ? 'Modification du paiement' : 'Gestion des paiements étudiants'} - Processus en 3 étapes
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              )}
              <div className="text-sm text-gray-500">
                Étape {steps.findIndex(s => s.id === currentStep) + 1}/{steps.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Barre de progression */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ 
                    width: `${((steps.findIndex(s => s.id === currentStep)) / (steps.length - 1)) * 100}%` 
                  }}
                />
              </div>
              
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = index < steps.findIndex(s => s.id === currentStep);
                
                return (
                  <div key={step.id} className="flex flex-col items-center relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                      isActive ? 'bg-blue-500 ring-4 ring-blue-200' : 
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6">
            
            {/* ÉTAPE 1: Sélection étudiant */}
            {currentStep === 'student' && (
              <div>
                <StudentSearchPayment
                  selectedStudent={selectedStudent}
                  onStudentSelect={handleStudentSelect}
                  onStudentClear={() => {
                    setSelectedStudent(null);
                    setSearchQuery('');
                  }}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                />
                
                {errors.student && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{errors.student}</p>
                  </div>
                )}

                {/* Informations des frais */}
                {selectedStudent && studentFees && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      Frais et solde de l'étudiant
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Frais mensuel</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatGNF(studentFees.fees?.monthly_amount || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Total payé</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatGNF(studentFees.payments?.total_paid || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Solde restant</p>
                        <p className={`text-lg font-bold ${
                          (studentFees.payments?.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatGNF(studentFees.payments?.balance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historique des paiements */}
                {selectedStudent && (
                  <div className="mt-6">
                    <PaymentHistory 
                      student={selectedStudent}
                      limit={3}
                      showTitle={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 2: Détails du paiement */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Détails du paiement</h2>
                  <p className="text-gray-600">Configuration pour {selectedStudent ? getStudentDisplayName(selectedStudent) : 'N/A'}</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                  
                  {/* Numéro de reçu */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-green-600" />
                      Numéro de reçu
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de reçu automatique *
                        </label>
                        <input
                          type="text"
                          value={formData.receipt_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-green-50 font-mono text-lg font-bold"
                          placeholder="REC-2025-001"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, receipt_number: generateReceiptNumber() }))}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Générer nouveau
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Période de paiement */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Période de paiement
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mois concerné *
                        </label>
                        <select
                          value={formData.payment_month}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_month: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        >
                          {months.map(month => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Année *
                        </label>
                        <select
                          value={formData.payment_year}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_year: parseInt(e.target.value) }))}  
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de mois *
                        </label>
                        <select
                          value={formData.number_of_months}
                          onChange={(e) => setFormData(prev => ({ ...prev, number_of_months: parseInt(e.target.value) }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                            errors.number_of_months ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                              {num} mois
                            </option>
                          ))}
                        </select>
                        {errors.number_of_months && (
                          <p className="text-red-600 text-sm mt-1">{errors.number_of_months}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Montants */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-green-600" />
                      Montants
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant dû (GNF) *
                        </label>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={formData.amount_due}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount_due: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                            errors.amount_due ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="500000"
                        />
                        {errors.amount_due && (
                          <p className="text-red-600 text-sm mt-1">{errors.amount_due}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant payé (GNF) *
                        </label>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={formData.amount_paid}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount_paid: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                            errors.amount_paid ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="500000"
                        />
                        {errors.amount_paid && (
                          <p className="text-red-600 text-sm mt-1">{errors.amount_paid}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payé par *
                        </label>
                        <input
                          type="text"
                          value={formData.paid_by}
                          onChange={(e) => setFormData(prev => ({ ...prev, paid_by: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                            errors.paid_by ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Nom du payeur"
                        />
                        {errors.paid_by && (
                          <p className="text-red-600 text-sm mt-1">{errors.paid_by}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aperçu des calculs */}
                  {(formData.amount_due || formData.amount_paid) && (
                    <div className="bg-gray-50 rounded-lg p-6 border">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-600" />
                        Aperçu des calculs
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <DollarSign className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-red-600 text-sm font-medium mb-1">Montant dû</p>
                          <p className="text-red-900 font-bold text-lg">
                            {formData.amount_due ? formatGNF(parseFloat(formData.amount_due)) : '0 GNF'}
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <Wallet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-green-600 text-sm font-medium mb-1">Montant payé</p>
                          <p className="text-green-900 font-bold text-lg">
                            {formData.amount_paid ? formatGNF(parseFloat(formData.amount_paid)) : '0 GNF'}
                          </p>
                        </div>
                        
                        <div className={`border rounded-lg p-4 text-center ${
                          paymentCalc.is_complete ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                        }`}>
                          {paymentCalc.is_complete ? (
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          ) : (
                            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                          )}
                          <p className={`text-sm font-medium mb-1 ${
                            paymentCalc.is_complete ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {paymentCalc.is_complete ? 'Statut' : 'Reste à payer'}
                          </p>
                          <p className={`font-bold text-lg ${
                            paymentCalc.is_complete ? 'text-green-900' : 'text-orange-900'
                          }`}>
                            {paymentCalc.is_complete 
                              ? (paymentCalc.is_excess ? `Excédent: ${formatGNF(Math.abs(paymentCalc.difference))}` : 'Complet ✅')
                              : formatGNF(Math.abs(paymentCalc.difference))
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Barre de progression */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600">Progression du paiement</span>
                          <span className="text-sm font-bold text-gray-700">
                            {Math.round(paymentCalc.completion_rate)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              paymentCalc.is_complete ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, paymentCalc.completion_rate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type de paiement */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Type de paiement *
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {PAYMENT_TYPES.map(type => {
                        const isSelected = formData.payment_type === type.value;
                        
                        return (
                          <div
                            key={type.value}
                            onClick={() => setFormData(prev => ({ ...prev, payment_type: type.value }))}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`text-2xl mb-2 ${
                                isSelected ? 'opacity-100' : 'opacity-60'
                              }`}>
                                {type.icon}
                              </div>
                              <p className={`text-sm font-medium mb-1 ${
                                isSelected ? 'text-blue-900' : 'text-gray-700'
                              }`}>
                                {type.label}
                              </p>
                              <p className={`text-xs ${
                                isSelected ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {type.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Champ conditionnel pour "Autres" */}
                    {formData.payment_type === 'other' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Précisez le type de paiement *
                        </label>
                        <input
                          type="text"
                          value={formData.custom_payment_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_payment_type: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                            errors.custom_payment_type ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Ex: Frais de sortie pédagogique, Frais médicaux..."
                        />
                        {errors.custom_payment_type && (
                          <p className="text-red-600 text-sm mt-1">{errors.custom_payment_type}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Méthode de paiement */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Méthode de paiement *
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {PAYMENT_METHODS.map(method => {
                        const isSelected = formData.payment_method === method.value;
                        
                        return (
                          <div
                            key={method.value}
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value }))}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-purple-500 bg-purple-50 shadow-md' 
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`text-2xl mb-2 ${
                                isSelected ? 'opacity-100' : 'opacity-60'
                              }`}>
                                {method.icon}
                              </div>
                              <p className={`text-sm font-medium mb-1 ${
                                isSelected ? 'text-purple-900' : 'text-gray-700'
                              }`}>
                                {method.label}
                              </p>
                              <p className={`text-xs ${
                                isSelected ? 'text-purple-600' : 'text-gray-500'
                              }`}>
                                {method.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-gray-600" />
                      Informations complémentaires
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de paiement
                        </label>
                        <input
                          type="date"
                          value={formData.payment_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (optionnel)
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
                          placeholder="Observations ou commentaires sur ce paiement..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 3: Validation */}
            {currentStep === 'review' && selectedStudent && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Validation du paiement</h2>
                  <p className="text-gray-600">Vérifiez toutes les informations avant d'enregistrer</p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    
                    {/* Résumé complet */}
                    <div className="space-y-6">
                      
                      {/* Étudiant */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="w-6 h-6 text-blue-600" />
                          Étudiant concerné
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {selectedStudent.first_name?.charAt(0) || 'U'}{selectedStudent.last_name?.charAt(0) || 'N'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {getStudentDisplayName(selectedStudent)}
                            </h4>
                            <p className="text-gray-600">N° {selectedStudent.student_number} • {selectedStudent.age} ans</p>
                            {selectedStudent.coranic_class && (
                              <p className="text-blue-600 text-sm">Classe: {selectedStudent.coranic_class.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Détails paiement */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-green-600" />
                          Détails du paiement
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Reçu N°:</span>
                              <span className="font-bold font-mono">{formData.receipt_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Période:</span>
                              <span className="font-bold">
                                {months.find(m => m.value === formData.payment_month)?.label} {formData.payment_year}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-bold">
                                {formData.payment_type === 'other' 
                                  ? formData.custom_payment_type 
                                  : PAYMENT_TYPES.find(pt => pt.value === formData.payment_type)?.label}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Méthode:</span>
                              <span className="font-bold">
                                {PAYMENT_METHODS.find(pm => pm.value === formData.payment_method)?.label}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Montant dû:</span>
                              <span className="font-bold text-red-600">
                                {formatGNF(parseFloat(formData.amount_due) || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Montant payé:</span>
                              <span className="font-bold text-green-600">
                                {formatGNF(parseFloat(formData.amount_paid) || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payé par:</span>
                              <span className="font-bold">{formData.paid_by}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-bold">
                                {new Date(formData.payment_date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {formData.notes && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="font-medium text-gray-700 mb-2">Notes:</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                              {formData.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Statut final */}
                      <div className={`rounded-lg p-6 text-center text-white shadow-md ${
                        paymentCalc.is_complete ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                      }`}>
                        <div className="mb-3">
                          {paymentCalc.is_complete ? (
                            <CheckCircle className="w-12 h-12 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-12 h-12 mx-auto" />
                          )}
                        </div>
                        <h4 className="font-bold text-xl mb-2">
                          {paymentCalc.is_complete ? 'Paiement complet' : 'Paiement partiel'}
                        </h4>
                        {paymentCalc.is_excess && (
                          <p className="text-sm bg-white/20 rounded px-3 py-1 inline-block">
                            Excédent: {formatGNF(Math.abs(paymentCalc.difference))}
                          </p>
                        )}
                        {paymentCalc.is_insufficient && (
                          <p className="text-sm bg-white/20 rounded px-3 py-1 inline-block">
                            Reste à payer: {formatGNF(Math.abs(paymentCalc.difference))}
                          </p>
                        )}
                      </div>

                      {/* Avertissement */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-yellow-800 mb-1">Vérification finale</h4>
                            <p className="text-yellow-700 text-sm">
                              Assurez-vous que toutes les informations sont correctes. Une fois enregistré, 
                              ce paiement sera définitivement ajouté au système et un reçu sera généré.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bouton de validation */}
                    <div className="mt-8 text-center">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {submitting ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{editingPayment ? 'Modification...' : 'Enregistrement...'}</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-6 h-6" />
                            <span>{editingPayment ? 'Modifier le paiement' : 'Enregistrer le paiement'}</span>
                          </>
                        )}
                      </button>
                      
                      <p className="text-gray-600 mt-3 text-sm">
                        {editingPayment 
                          ? 'Le paiement sera modifié avec les nouvelles informations'
                          : 'Le paiement sera enregistré et un reçu sera généré automatiquement'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              disabled={steps.findIndex(s => s.id === currentStep) === 0 || submitting}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Étape précédente
            </button>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Progression</div>
                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index <= steps.findIndex(s => s.id === currentStep)
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {submitting && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Traitement en cours...
                </div>
              )}
            </div>

            {steps.findIndex(s => s.id === currentStep) < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                Étape suivante
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                <Eye className="w-4 h-4" />
                Prêt pour validation
              </div>
            )}
          </div>
        </div>

        {/* Messages d'erreur améliorés */}
        {errors.submit && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-red-800 font-bold text-lg mb-2">Erreur d'enregistrement</h4>
                <p className="text-red-600 mb-4">{errors.submit}</p>
                
                {/* Actions rapides */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setErrors({})}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      handleSubmit();
                    }}
                    disabled={submitting}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Réessayer
                  </button>
                </div>
                
                <details className="text-red-500 text-sm">
                  <summary className="cursor-pointer hover:text-red-700 font-medium mb-2">
                    🔧 Voir les détails techniques et solutions
                  </summary>
                  <div className="mt-2 p-4 bg-red-100 rounded border-l-4 border-red-400">
                    <div className="mb-3">
                      <strong>Erreur:</strong>
                      <p className="font-mono text-xs break-all bg-white p-2 rounded mt-1 border">
                        {errors.submit}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <strong>Solutions possibles:</strong>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Vérifiez votre connexion internet</li>
                        <li>Assurez-vous que tous les champs obligatoires sont remplis</li>
                        <li>Vérifiez que l'étudiant existe dans le système</li>
                        <li>Redémarrez le serveur backend si nécessaire</li>
                        <li>Contactez le support technique si le problème persiste</li>
                      </ol>
                    </div>
                    
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <strong className="text-yellow-800">URL utilisée:</strong>
                      <p className="text-xs font-mono text-yellow-700">
                        POST /api/payments/students/{selectedStudent?.id}/payments
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Indicateur de chargement des frais */}
        {feesLoading && selectedStudent && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-blue-700">Chargement des informations financières de l'étudiant...</p>
            </div>
          </div>
        )}

        {/* Erreur de chargement des frais */}
        {feesError && selectedStudent && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Impossible de charger les frais</h4>
                <p className="text-yellow-700 text-sm mb-2">{feesError}</p>
                <button
                  type="button"
                  onClick={() => refetchFees()}
                  className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug info en mode développement */}
        {process.env.NODE_ENV === 'development' && selectedStudent && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                🔧 Informations de débogage (dev seulement)
              </summary>
              <div className="space-y-2 text-xs font-mono bg-white p-3 rounded border">
                <p><strong>Étudiant sélectionné:</strong> {selectedStudent.id}</p>
                <p><strong>Service utilisé:</strong> paymentService.createPayment()</p>
                <p><strong>Hook utilisé:</strong> useStudentFees()</p>
                <p><strong>Types importés:</strong> PaymentStudent, CreatePaymentData, PAYMENT_TYPES, PAYMENT_METHODS</p>
                <p><strong>Données à envoyer:</strong></p>
                <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
{JSON.stringify({
  student_id: selectedStudent.id,
  amount: parseFloat(formData.amount_paid || '0'),
  amount_due: parseFloat(formData.amount_due || '0'),
  payment_method: formData.payment_method,
  payment_type: formData.payment_type,
  paid_by: formData.paid_by,
  receipt_number: formData.receipt_number
}, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;