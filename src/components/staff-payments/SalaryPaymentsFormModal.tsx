import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  X, 
  User, 
  Search, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Calculator, 
  FileText, 
  Building, 
  AlertTriangle,
  ChevronDown,
  Loader,
  CheckCircle,
  Settings,
  Download
} from 'lucide-react';

// Types/Interfaces corrigés
interface Staff {
  staff_salary_id: string; // ID de la config salaire (pour staff_salary_id)
  staff_id: string;        // ID de l'employé
  display_name: string;
  staff_number: string;
  position: string;
  department: string;
  monthly_salary: number | null;
  net_salary: number | null;
  photo_url?: string;
  formatted_monthly_salary: string | null;
  formatted_net_salary: string | null;
  has_salary_config: boolean;
  salary_config_active: boolean;
}

interface PaymentType {
  value: string;
  label: string;
  description?: string;
}

interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
}

interface PaymentStatus {
  value: string;
  label: string;
  icon: string;
}

interface SchoolYear {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  current_year: number;
  is_current?: boolean;
}

interface PaymentFormData {
  staff_salary_id: string;
  payment_type: string;
  amount: number | null;
  payment_date: string;
  payment_method: string;
  payment_year: number;
  payment_month?: number;
  gross_amount?: number;
  net_amount?: number;
  notes: string;
  payment_status: string;
}

interface SalaryPaymentsFormModalProps {
  showPaymentForm: boolean;
  onClosePaymentForm: () => void;
  onSubmitPayment: (data: PaymentFormData) => void;
  editingPayment?: any;
  preselectedStaff?: Staff | null;
  loading?: boolean;
  showPaymentDetail?: boolean;
  selectedPayment?: any;
  onClosePaymentDetail?: () => void;
}

const SalaryPaymentsFormModal: React.FC<SalaryPaymentsFormModalProps> = ({
  showPaymentForm,
  onClosePaymentForm,
  onSubmitPayment,
  editingPayment = null,
  preselectedStaff = null,
  loading = false,
  showPaymentDetail = false,
  selectedPayment = null,
  onClosePaymentDetail
}) => {
  // États du composant
  const [formData, setFormData] = useState<PaymentFormData>({
    staff_salary_id: '',
    payment_type: 'monthly',
    amount: null,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    payment_year: new Date().getFullYear(),
    payment_month: new Date().getMonth() + 1,
    notes: '',
    payment_status: 'completed'
  });

  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStaffSearch, setShowStaffSearch] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<SchoolYear | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  // Configuration API
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  // Fonction d'appel API avec token d'authentification
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      console.log(`🌐 Appel API: ${API_BASE_URL}${endpoint}`);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      console.log(`📡 Statut réponse: ${response.status} pour ${endpoint}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Données reçues de ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`💥 Erreur API ${endpoint}:`, error);
      throw error;
    }
  };

  // Charger tous les employés actifs (avec/sans config salaire)
  const loadStaff = async () => {
    setLoadingData(true);
    setApiError('');
    
    try {
      console.log('📡 === CHARGEMENT EMPLOYÉS AVEC/SANS CONFIG SALAIRE ===');
      
      const data = await apiCall('/api/salary-payments/staff/available');
      
      if (data.success && data.staff && data.staff.length > 0) {
        console.log(`✅ ${data.staff.length} employés trouvés`);
        
        // Mapper les données selon la structure backend corrigée
        const transformedStaff: Staff[] = data.staff.map((emp: any) => ({
          staff_salary_id: emp.staff_salary_id,
          staff_id: emp.staff_id,
          display_name: emp.full_name,
          staff_number: emp.staff_number,
          position: emp.position || 'Non défini',
          department: emp.department || 'Non défini',
          monthly_salary: emp.monthly_salary || null,
          net_salary: emp.net_salary || null,
          photo_url: emp.photo_url,
          formatted_monthly_salary: emp.formatted_monthly_salary || null,
          formatted_net_salary: emp.formatted_net_salary || null,
          has_salary_config: emp.has_salary_config || false,
          salary_config_active: emp.salary_config_active || false
        }));

        setStaff(transformedStaff);
        setFilteredStaff(transformedStaff);
        
        console.log('✅ Employés transformés:', transformedStaff);
        
      } else {
        console.warn('⚠️ Aucun employé trouvé');
        setStaff([]);
        setFilteredStaff([]);
        setApiError('Aucun employé actif trouvé dans la base de données.');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement employés:', error);
      setStaff([]);
      setFilteredStaff([]);
      setApiError(`Erreur de connexion: ${error.message}. Vérifiez que le serveur fonctionne.`);
    } finally {
      setLoadingData(false);
    }
  };

  // Charger les années scolaires disponibles
  const loadSchoolYears = async () => {
    try {
      setLoadingYears(true);
      console.log('📅 === CHARGEMENT ANNÉES SCOLAIRES ===');
      
      const data = await apiCall('/api/school-years/');
      
      if (data.success && data.school_years && data.school_years.length > 0) {
        const years = data.school_years.flatMap((sy: any) => [
          sy.start_year,
          sy.end_year,
          sy.current_year
        ]).filter((year: number) => year && !isNaN(year));
        
        const uniqueYears = [...new Set(years)].sort((a: number, b: number) => b - a);
        setAvailableYears(uniqueYears);
        
        console.log('✅ Années scolaires chargées:', uniqueYears);
      } else {
        const currentYear = new Date().getFullYear();
        const fallbackYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
        setAvailableYears(fallbackYears);
        console.log('⚠️ Fallback années utilisées:', fallbackYears);
      }
    } catch (error) {
      console.error('❌ Erreur chargement années scolaires:', error);
      const currentYear = new Date().getFullYear();
      const fallbackYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
      setAvailableYears(fallbackYears);
    } finally {
      setLoadingYears(false);
    }
  };

  // Charger l'année scolaire courante
  const loadCurrentSchoolYear = async () => {
    try {
      console.log('📅 === CHARGEMENT ANNÉE SCOLAIRE COURANTE ===');
      
      const data = await apiCall('/api/salary-payments/current-school-year');
      
      if (data.success && data.current_school_year) {
        const schoolYear = data.current_school_year;
        setCurrentSchoolYear(schoolYear);
        
        setFormData(prev => ({
          ...prev,
          payment_year: schoolYear.current_year
        }));
        
        console.log('✅ Année scolaire courante:', schoolYear);
      }
    } catch (error) {
      console.error('❌ Erreur chargement année scolaire:', error);
    }
  };

  // Charger les configurations
  const loadConfigs = async () => {
    try {
      console.log('📡 === CHARGEMENT CONFIGURATIONS ===');
      
      const [typesData, methodsData, statusesData] = await Promise.all([
      apiCall('/api/salary-payments/config/payment-types'),
      apiCall('/api/salary-payments/config/payment-methods'),
      apiCall('/api/salary-payments/config/payment-statuses')
       ]);
      if (typesData.success && typesData.payment_types) {
        setPaymentTypes(typesData.payment_types);
        console.log('✅ Types de paiement chargés:', typesData.payment_types.length);
      }
      
      if (methodsData.success && methodsData.payment_methods) {
        setPaymentMethods(methodsData.payment_methods);
        console.log('✅ Méthodes de paiement chargées:', methodsData.payment_methods.length);
      }
      
      if (statusesData.success && statusesData.payment_statuses) {
        setPaymentStatuses(statusesData.payment_statuses);
        console.log('✅ Statuts de paiement chargés:', statusesData.payment_statuses.length);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement configurations:', error);
      
      console.log('🔄 Utilisation des configurations par défaut');
      
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
        { value: 'pending', label: 'En attente', icon: '⏳' },
        { value: 'completed', label: 'Payé', icon: '✅' },
        { value: 'partial', label: 'Partiel', icon: '📊' },
        { value: 'cancelled', label: 'Annulé', icon: '❌' }
      ]);
    }
  };

  const searchStaff = (query: string) => {
    if (query.length < 2) {
      setFilteredStaff(staff);
      return;
    }
    
    const filtered = staff.filter(s => 
      s.display_name?.toLowerCase().includes(query.toLowerCase()) ||
      s.staff_number?.toLowerCase().includes(query.toLowerCase()) ||
      s.position?.toLowerCase().includes(query.toLowerCase()) ||
      s.department?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStaff(filtered);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.staff_salary_id) {
      newErrors.staff_salary_id = 'Employé requis';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Montant requis et positif';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Date de paiement requise';
    }

    if (formData.payment_type === 'monthly' && (!formData.payment_month || formData.payment_month < 1 || formData.payment_month > 12)) {
      newErrors.payment_month = 'Mois requis pour paiement mensuel';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Sélection d'employé
    if (name === 'staff_salary_id') {
      const selectedStaffMember = staff.find(s => s.staff_salary_id === value);
      setSelectedStaff(selectedStaffMember || null);
      if (selectedStaffMember && selectedStaffMember.monthly_salary && selectedStaffMember.monthly_salary > 0) {
        setFormData(prev => ({
          ...prev,
          amount: selectedStaffMember.monthly_salary
        }));
      }
      if (selectedStaffMember) {
        setSearchTerm(selectedStaffMember.display_name);
      }
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchStaff(value);
  };

  const selectStaffFromSearch = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData(prev => ({
      ...prev,
      staff_salary_id: staffMember.staff_salary_id,
      ...(staffMember.monthly_salary && staffMember.monthly_salary > 0 && { amount: staffMember.monthly_salary })
    }));
    setSearchTerm(staffMember.display_name);
    setShowStaffSearch(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('🚀 Envoi du formulaire:', formData);
      
      // ✅ DONNÉES FINALES CORRIGÉES
      const finalData = {
        ...formData,
        staff_salary_id: formData.staff_salary_id,
        amount: formData.amount || 0,
        gross_amount: formData.amount || 0,
        net_amount: formData.amount || 0
      };
      
      console.log('📤 Données finales envoyées:', finalData);
      onSubmitPayment(finalData);
    } else {
      console.log('❌ Erreurs de validation:', errors);
    }
  };

  const months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ];

  // Chargement des données quand le modal s'ouvre
  useEffect(() => {
    if (showPaymentForm) {
      console.log('🔄 === MODAL OUVERT - CHARGEMENT DONNÉES ===');
      loadStaff();
      loadConfigs();
      loadCurrentSchoolYear();
      loadSchoolYears();
    }
  }, [showPaymentForm]);

  // Gestion employé présélectionné
  useEffect(() => {
    if (preselectedStaff) {
      console.log('👤 Employé présélectionné:', preselectedStaff.display_name);
      setSelectedStaff(preselectedStaff);
      setFormData(prev => ({
        ...prev,
        staff_salary_id: preselectedStaff.staff_salary_id,
        ...(preselectedStaff.monthly_salary && preselectedStaff.monthly_salary > 0 && { amount: preselectedStaff.monthly_salary })
      }));
      setSearchTerm(preselectedStaff.display_name);
    }
  }, [preselectedStaff]);

  // ✅ Initialisation avec données d'édition CORRIGÉE
  useEffect(() => {
    if (editingPayment) {
      console.log('✏️ Mode édition - Chargement données:', editingPayment);
      
      // ✅ Mapper les données du paiement vers le format du formulaire
      const mappedData = {
        staff_salary_id: editingPayment.staff_salary_id || '', 
        payment_type: editingPayment.payment_type || 'monthly',
        amount: editingPayment.amount || null,
        payment_date: editingPayment.payment_date || new Date().toISOString().split('T')[0],
        payment_method: editingPayment.payment_method || 'cash',
        payment_year: editingPayment.payment_year || new Date().getFullYear(),
        payment_month: editingPayment.payment_month || new Date().getMonth() + 1,
        notes: editingPayment.notes || '',
        payment_status: editingPayment.payment_status || editingPayment.status || 'completed'
      };
      
      console.log('✅ Données mappées pour édition:', mappedData);
      setFormData(mappedData);
      
      // ✅ Trouver et sélectionner l'employé correspondant
      if (editingPayment.staff_salary_id && staff.length > 0) {
        const matchingStaff = staff.find(s => s.staff_salary_id === editingPayment.staff_salary_id);
        if (matchingStaff) {
          console.log('✅ Employé trouvé pour édition:', matchingStaff.display_name);
          setSelectedStaff(matchingStaff);
          setSearchTerm(matchingStaff.display_name);
        } else {
          console.warn('⚠️ Employé non trouvé pour staff_salary_id:', editingPayment.staff_salary_id);
        }
      }
    } else {
      // ✅ Réinitialiser le formulaire quand on sort du mode édition
      setFormData({
        staff_salary_id: '',
        payment_type: 'monthly',
        amount: null,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        payment_year: new Date().getFullYear(),
        payment_month: new Date().getMonth() + 1,
        notes: '',
        payment_status: 'completed'
      });
      setSelectedStaff(null);
      setSearchTerm('');
    }
  }, [editingPayment, staff]); // ✅ Ajouter 'staff' comme dépendance

  // Modal de détails de paiement
  if (showPaymentDetail && selectedPayment) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block w-full max-w-2xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            
            {/* Header détails */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold flex items-center">
                    <Receipt className="h-6 w-6 mr-3" />
                    Détails du Paiement
                  </h3>
                  <p className="text-green-100 mt-1">
                    Reçu #{selectedPayment?.receipt_number}
                  </p>
                </div>
                <button
                  onClick={onClosePaymentDetail}
                  className="text-green-100 hover:text-white transition-colors p-2 rounded-full hover:bg-green-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu détails */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informations Employé
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Nom:</span>
                      <div className="font-semibold">{selectedPayment?.staff_name}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Numéro:</span>
                      <div className="font-semibold">{selectedPayment?.staff_number}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Poste:</span>
                      <div className="font-semibold">{selectedPayment?.position}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Détails Paiement
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Montant:</span>
                      <div className="font-bold text-green-600 text-lg">{selectedPayment?.formatted_amount}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Date:</span>
                      <div className="font-semibold">{selectedPayment?.payment_date_formatted}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Statut:</span>
                      <div className="font-semibold">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          selectedPayment?.status_color === 'green' ? 'bg-green-100 text-green-800' :
                          selectedPayment?.status_color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedPayment?.status_icon} {selectedPayment?.status_label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayment?.notes && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Notes
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedPayment.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200 mt-8">
                <button
                  onClick={() => {
                    if (selectedPayment?.downloadPDF) {
                      selectedPayment.downloadPDF();
                    }
                  }}
                  className="px-6 py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all"
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Télécharger le reçu
                </button>
                
                <button
                  onClick={onClosePaymentDetail}
                  className="px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
                >
                  <CheckCircle className="h-4 w-4 mr-2 inline" />
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showPaymentForm) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block w-full max-w-4xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold flex items-center">
                  <Receipt className="h-6 w-6 mr-3" />
                  {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement de Salaire'}
                </h3>
                <p className="text-blue-100 mt-1">
                  {currentSchoolYear ? `Année scolaire: ${currentSchoolYear.name}` : 'Enregistrer un paiement de salaire'}
                </p>
              </div>
              <button
                onClick={onClosePaymentForm}
                className="text-blue-100 hover:text-white transition-colors p-2 rounded-full hover:bg-blue-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Colonne gauche */}
                <div className="space-y-6">
                  
                  {/* SÉLECTION EMPLOYÉ */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      <User className="h-4 w-4 inline mr-2" />
                      Employé *
                    </label>
                    
                    {loadingData ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                        <div className="flex items-center">
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                          Chargement des employés...
                        </div>
                      </div>
                    ) : apiError && apiError.includes('Erreur') ? (
                      <div className="w-full px-4 py-3 border-2 border-red-200 rounded-xl bg-red-50 text-red-600">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold">Erreur de chargement</div>
                            <div className="text-sm mt-1">{apiError}</div>
                            <button
                              type="button"
                              onClick={loadStaff}
                              className="text-sm text-red-700 hover:text-red-900 underline font-medium mt-2"
                            >
                              🔄 Réessayer
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : staff.length === 0 ? (
                      <div className="w-full px-4 py-3 border-2 border-yellow-200 rounded-xl bg-yellow-50 text-yellow-700">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold">Aucun employé disponible</div>
                            <div className="text-sm mt-1">
                              Aucun employé actif trouvé dans la base de données.
                            </div>
                            <button
                              type="button"
                              onClick={loadStaff}
                              className="text-sm text-yellow-700 hover:text-yellow-900 underline font-medium mt-2"
                            >
                              🔄 Actualiser la liste
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <select
                          name="staff_salary_id"
                          value={formData.staff_salary_id}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                            errors.staff_salary_id ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                          disabled={!!preselectedStaff}
                        >
                          <option value="">Sélectionner un employé</option>
                          {staff.map(staffMember => (
                            <option key={staffMember.staff_salary_id} value={staffMember.staff_salary_id}>
                              {staffMember.display_name} - {staffMember.staff_number} ({staffMember.position})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {errors.staff_salary_id && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.staff_salary_id}
                      </p>
                    )}
                    
                    {/* INFORMATIONS EMPLOYÉ SÉLECTIONNÉ */}
                    {selectedStaff && (
                      <div className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Employé sélectionné
                        </h4>
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {selectedStaff.photo_url ? (
                              <img 
                                src={selectedStaff.photo_url} 
                                alt="" 
                                className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) nextElement.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl ${selectedStaff.photo_url ? 'hidden' : ''}`}>
                              {selectedStaff.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-xl text-blue-900">{selectedStaff.display_name}</div>
                            <div className="text-blue-700 flex items-center space-x-3 mt-1">
                              <span className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                                {selectedStaff.staff_number}
                              </span>
                              <span>{selectedStaff.position}</span>
                            </div>
                            <div className="text-blue-600 flex items-center mt-2">
                              <Building className="h-4 w-4 mr-1" />
                              {selectedStaff.department}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Type de paiement */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Type de paiement *
                    </label>
                    <select
                      name="payment_type"
                      value={formData.payment_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    >
                      {paymentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Montant */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <DollarSign className="h-4 w-4 inline mr-2" />
                      Montant (FG) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                        errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Ex: 700000"
                      min="0"
                      step="1000"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {errors.amount}
                      </p>
                    )}
                    
                    {/* Suggestion de salaire */}
                    {selectedStaff && selectedStaff.monthly_salary && selectedStaff.monthly_salary > 0 && selectedStaff.formatted_monthly_salary && formData.amount !== selectedStaff.monthly_salary && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-yellow-800">
                            💡 Salaire suggéré: <span className="font-semibold">{selectedStaff.formatted_monthly_salary}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, amount: selectedStaff.monthly_salary }))}
                            className="text-sm text-yellow-700 hover:text-yellow-900 underline font-medium"
                          >
                            Utiliser ce montant
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Affichage formaté du montant */}
                    {formData.amount && formData.amount > 0 && (
                      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formData.amount.toLocaleString()} FG
                          </div>
                          <div className="text-sm text-green-500">Montant net à payer</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-6">
                  
                  {/* Date et méthode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Date de paiement *
                      </label>
                      <input
                        type="date"
                        name="payment_date"
                        value={formData.payment_date}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                          errors.payment_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      {errors.payment_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.payment_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <CreditCard className="h-4 w-4 inline mr-2" />
                        Méthode *
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      >
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.icon} {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Période de paiement */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Période de paiement
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Année *</label>
                        {loadingYears ? (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                            <Loader className="animate-spin h-4 w-4 mr-2" />
                            <span className="text-sm text-gray-500">Chargement...</span>
                          </div>
                        ) : availableYears.length > 0 ? (
                          <select
                            name="payment_year"
                            value={formData.payment_year}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {availableYears.map(year => (
                              <option key={year} value={year}>
                                {year} {currentSchoolYear && year === currentSchoolYear.current_year ? '(Courante)' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            name="payment_year"
                            value={formData.payment_year}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="2020"
                            max="2030"
                            placeholder="Ex: 2024"
                          />
                        )}
                      </div>

                      {formData.payment_type === 'monthly' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mois *</label>
                          <select
                            name="payment_month"
                            value={formData.payment_month || ''}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.payment_month ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Sélectionner</option>
                            {months.map(month => (
                              <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                          </select>
                          {errors.payment_month && (
                            <p className="text-red-500 text-xs mt-1">{errors.payment_month}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statut du paiement */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Statut du paiement
                    </label>
                    <select
                      name="payment_status"
                      value={formData.payment_status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    >
                      {paymentStatuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.icon} {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Notes (optionnel)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none"
                  placeholder="Commentaires ou informations supplémentaires sur ce paiement..."
                />
              </div>

              {/* Résumé du paiement */}
              {selectedStaff && formData.amount && formData.amount > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Résumé du paiement
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-blue-700 font-medium">Employé:</span>
                          <div className="font-bold text-blue-900 text-lg">{selectedStaff.display_name}</div>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Numéro:</span>
                          <div className="font-bold text-blue-900">{selectedStaff.staff_number}</div>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Type:</span>
                          <div className="font-bold text-blue-900">
                            {paymentTypes.find(t => t.value === formData.payment_type)?.label}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-blue-700 font-medium">Montant:</span>
                          <div className="font-bold text-green-600 text-lg">{formData.amount.toLocaleString()} FG</div>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Période:</span>
                          <div className="font-bold text-blue-900">
                            {formData.payment_type === 'monthly' && formData.payment_month 
                              ? `${months.find(m => m.value === formData.payment_month)?.label} ${formData.payment_year}`
                              : `${paymentTypes.find(t => t.value === formData.payment_type)?.label} ${formData.payment_year}`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={onClosePaymentForm}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.staff_salary_id || !formData.amount}
                  className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-600 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      {editingPayment ? 'Modification...' : 'Enregistrement...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Receipt className="h-4 w-4 mr-2" />
                      {editingPayment ? 'Modifier le paiement' : 'Créer le paiement'}
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryPaymentsFormModal;