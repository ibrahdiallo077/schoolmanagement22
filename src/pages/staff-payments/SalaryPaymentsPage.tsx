// src/pages/staff-payments/SalaryPaymentsPage.tsx - VERSION CORRIGÉE AVEC PDF
import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, X, Search, Filter, Download, Eye, Edit, Trash2, 
  ChevronDown, ChevronLeft, ChevronRight, User, Building, Calendar, CreditCard,
  Receipt, Clock, DollarSign, RefreshCw, Plus, Users, TrendingUp, FileText
} from 'lucide-react';
import SalaryPaymentsFormModal from '../../components/staff-payments/SalaryPaymentsFormModal';

import jsPDF from 'jspdf';



// ✅ TYPES UNIFIÉS ET CORRIGÉS
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
  payment_status: string; // ✅ Compatible avec les deux champs status/payment_status
  status?: string; // ✅ Champ alternatif
  status_label: string;
  status_color: string;
  status_icon: string;
  payment_year: number;
  payment_month?: number;
  period_display: string;
  notes?: string;
  staff_salary_id?: string; // ✅ Ajouté pour éviter les erreurs
}

interface DashboardStats {
  total_payments: number;
  total_amount: number;
  formatted_total_amount: string;
  completed_payments: number;
  completed_amount: number;
  formatted_completed_amount: string;
  pending_payments: number;
  pending_amount: number;
  formatted_pending_amount: string;
  completion_rate: number;
  staff_paid_current_period: number;
}

interface PaymentFilters {
  search: string;
  payment_type: string;
  payment_method: string;
  payment_status: string;
  payment_year: string;
  payment_month: string;
}

const SalaryPaymentsPage: React.FC = () => {
  // ✅ ÉTATS PRINCIPAUX
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // ✅ ÉTATS MODALS ET MESSAGES
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  
  // ✅ FILTRES CORRIGÉS - Année courante par défaut
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    payment_type: '',
    payment_method: '',
    payment_status: '',
    payment_year: '',
    payment_month: ''
  });

  // ✅ CONFIGURATION API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/salary-payments`;
    const url = `${baseUrl}${endpoint}`;
    
    console.log('🌍 API Call:', url);
    console.log('📝 Options:', options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    return data;
  };

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // === FONCTION DE FORMATAGE CORRIGÉE POUR LE CLIENT ===
const formatCurrencyForPDF = (amount: number | string): string => {
  if (!amount || isNaN(Number(amount))) return '0 FG';
  
  const numAmount = Number(amount);
  // Utiliser une méthode qui garantit des espaces comme séparateurs
  const formatted = numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FG`;
};

// === FONCTION DE GÉNÉRATION PDF CORRIGÉE ===
const generateReceiptPDF = (payment: Payment) => {
  const doc = new jsPDF();
  
  // Configuration des polices et couleurs
  const primaryColor: [number, number, number] = [0, 123, 255]; // Bleu
  const textColor: [number, number, number] = [51, 51, 51]; // Gris foncé
  const lightGray: [number, number, number] = [248, 249, 250]; // Gris clair pour fond
  
  // HEADER AVEC LE NOM CORRIGÉ
  doc.setFillColor(...lightGray);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Nom de l'école en français
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Haramain', 105, 15, { align: 'center' });
  
  // Titre du reçu
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Reçu de Paiement de Salaire', 105, 35, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  let yPos = 60;
  
  // INFORMATIONS DU REÇU
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Informations du Reçu', 20, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  
  // Première colonne
  doc.text('Numéro de reçu:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.receipt_number, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Date de paiement:', 110, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.payment_date_formatted, 150, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 8;
  doc.text('Type de paiement:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.type_label, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Période:', 110, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.period_display, 150, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 8;
  doc.text('Méthode:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.method_label, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Statut:', 110, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.status_label, 150, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 20;
  
  // INFORMATIONS DE L'EMPLOYÉ
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Informations de l\'Employé', 20, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  
  doc.text('Nom complet:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.staff_name, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Numéro d\'employé:', 110, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.staff_number, 150, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 8;
  doc.text('Poste:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.position, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Département:', 110, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.department, 150, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 20;
  
  // MONTANT - SECTION MISE EN VALEUR AVEC FORMATAGE CORRIGÉ
  doc.setFillColor(231, 243, 255); // Bleu très clair
  doc.rect(20, yPos - 5, 170, 25, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Montant Payé', 105, yPos + 5, { align: 'center' });
  
  doc.setFontSize(18);
  // CORRECTION: Utiliser la fonction de formatage corrigée
  const formattedAmount = formatCurrencyForPDF(payment.amount || payment.formatted_amount);
  doc.text(formattedAmount, 105, yPos + 15, { align: 'center' });
  
  // Montant net si différent
  if (payment.net_amount && payment.net_amount !== payment.amount) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const formattedNetAmount = formatCurrencyForPDF(payment.net_amount);
    doc.text(`Montant net: ${formattedNetAmount}`, 105, yPos + 22, { align: 'center' });
  }
  
  yPos += 35;
  
  // NOTES SI PRÉSENTES
  if (payment.notes) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Notes', 20, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    
    // Découper les notes en lignes si elles sont longues
    const splitNotes = doc.splitTextToSize(payment.notes, 170);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 5 + 10;
  }
  
  // SIGNATURES
  yPos = Math.max(yPos, 220); // Position minimum pour les signatures
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  
  // Lignes de signature
  doc.line(30, yPos, 80, yPos);
  doc.line(130, yPos, 180, yPos);
  
  doc.text('Signature de l\'employé', 55, yPos + 8, { align: 'center' });
  doc.text('Signature du responsable', 155, yPos + 8, { align: 'center' });
  
  // FOOTER
  yPos += 25;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128); // Gris
  
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('fr-FR');
  const timeStr = currentDate.toLocaleTimeString('fr-FR');
  
  doc.text(`Ce reçu a été généré automatiquement le ${dateStr} à ${timeStr}`, 105, yPos, { align: 'center' });
  doc.text('Haramain - الحرمين - Système de Gestion des Paiements', 105, yPos + 5, { align: 'center' });
  
  // TÉLÉCHARGER LE PDF
  doc.save(`recu_${payment.receipt_number}.pdf`);
};

// === FONCTION ALTERNATIVE SI VOUS PRÉFÉREZ UTILISER toLocaleString ===
const formatCurrencyWithLocale = (amount: number | string): string => {
  if (!amount || isNaN(Number(amount))) return '0 FG';
  
  const numAmount = Number(amount);
  return `${numAmount.toLocaleString('fr-FR', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FG`;
};


  // ✅ TÉLÉCHARGEMENT PDF AMÉLIORÉ
  const downloadReceiptPDF = async (payment: Payment) => {
    setDownloading(payment.id);
    try {
      // Simuler un petit délai pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 500));
      generateReceiptPDF(payment);
      setSuccessMessage('Reçu PDF téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      setErrorMessage('Erreur lors du téléchargement du reçu PDF');
    } finally {
      setDownloading(null);
    }
  };

  // ✅ CHARGEMENT DES DONNÉES CORRIGÉ AVEC RAFRAÎCHISSEMENT AUTO
  const loadPayments = async (page = 1, forceRefresh = false) => {
    setLoading(true);
    try {
      console.log('🔄 Chargement paiements avec filtres:', filters);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });
      
      console.log('📋 Paramètres requête:', params.toString());
      
      const data = await apiCall(`/history?${params.toString()}`);
      if (data.success) {
        console.log('✅ Paiements reçus:', data.payments?.length || 0);
        setPayments(data.payments || []);
        setCurrentPage(data.pagination?.current_page || 1);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalItems(data.pagination?.total_items || 0);
        
        // ✅ FORCE LA RE-RENDER DE L'INTERFACE
        if (forceRefresh) {
          console.log('🔄 Rafraîchissement forcé de l\'interface');
        }
      }
    } catch (error) {
      console.error('💥 Erreur chargement paiements:', error);
      setPayments([]);
      setTotalItems(0);
      setErrorMessage('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiCall('/dashboard');
      if (data.success && data.dashboard?.statistics) {
        setStats(data.dashboard.statistics);
      }
    } catch (error) {
      console.error('💥 Erreur chargement stats:', error);
      setStats({
        total_payments: 0,
        total_amount: 0,
        formatted_total_amount: '0 FG',
        completed_payments: 0,
        completed_amount: 0,
        formatted_completed_amount: '0 FG',
        pending_payments: 0,
        pending_amount: 0,
        formatted_pending_amount: '0 FG',
        completion_rate: 0,
        staff_paid_current_period: 0
      });
    }
  };

  const loadConfigs = async () => {
    try {
      const [typesData, methodsData, statusesData] = await Promise.all([
        apiCall('/config/payment-types'),
        apiCall('/config/payment-methods'),
        apiCall('/config/payment-statuses')
      ]);
      
      setPaymentTypes(typesData.payment_types || []);
      setPaymentMethods(methodsData.payment_methods || []);
      setPaymentStatuses(statusesData.payment_statuses || []);
    } catch (error) {
      console.error('💥 Erreur chargement configurations');
      // Fallback données par défaut
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

  // ✅ ACTIONS CRUD CORRIGÉES AVEC RAFRAÎCHISSEMENT AUTO
  const createPayment = async (formData: any) => {
    setCreating(true);
    try {
      console.log('📤 Création paiement avec données:', formData);
      
      const data = await apiCall('/create', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (data.success) {
        setSuccessMessage('Paiement créé avec succès !');
        setShowPaymentForm(false);
        
        // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE ET IMMÉDIAT
        console.log('🔄 Rafraîchissement automatique après création...');
        await refreshAfterAction();
        
        // ✅ PETIT DÉLAI POUR S'ASSURER QUE L'INTERFACE SE MET À JOUR
        setTimeout(() => {
          console.log('✅ Interface mise à jour après création');
        }, 100);
      }
    } catch (error) {
      console.error('Erreur création paiement:', error);
      setErrorMessage('Erreur lors de la création du paiement');
    } finally {
      setCreating(false);
    }
  };

  const updatePayment = async (paymentId: string, formData: any) => {
    setUpdating(true);
    try {
      const data = await apiCall(`/payment/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      if (data.success) {
        setSuccessMessage('Paiement modifié avec succès !');
        setShowPaymentForm(false);
        setEditingPayment(null);
        
        // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE APRÈS MODIFICATION
        await refreshAfterAction();
      }
    } catch (error) {
      console.error('Erreur modification paiement:', error);
      setErrorMessage('Erreur lors de la modification du paiement');
    } finally {
      setUpdating(false);
    }
  };

  const deletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;
    
    try {
      const data = await apiCall(`/payment/${paymentId}`, { method: 'DELETE' });
      if (data.success) {
        setSuccessMessage('Paiement supprimé avec succès !');
        
        // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE APRÈS SUPPRESSION
        await refreshAfterAction();
      }
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
      setErrorMessage('Erreur lors de la suppression');
    }
  };

  // ✅ CORRECTION DU CHANGEMENT DE STATUT AVEC INDICATEUR VISUEL
  const changePaymentStatus = async (paymentId: string, newStatus: string) => {
    setChangingStatus(paymentId);
    try {
      console.log('🔄 Changement statut:', { paymentId, newStatus });
      
      // ✅ DONNÉES CORRIGÉES POUR LE BACKEND
      const requestData = { 
        payment_status: newStatus,
        status: newStatus // ✅ Ajouter aussi le champ 'status' pour compatibilité
      };
      
      console.log('📤 Envoi données changement statut:', requestData);
      
      const data = await apiCall(`/payment/${paymentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(requestData)
      });
      
      if (data.success) {
        setSuccessMessage(`Statut changé avec succès !`);
        
        // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE APRÈS CHANGEMENT STATUT
        console.log('🔄 Rafraîchissement après changement de statut...');
        await refreshAfterAction();
      } else {
        console.error('❌ Échec changement statut:', data);
        setErrorMessage('Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('💥 Erreur changement statut:', error);
      setErrorMessage('Erreur lors du changement de statut');
    } finally {
      setChangingStatus(null);
    }
  };

  // ✅ GESTIONNAIRES D'ÉVÉNEMENTS
  const handleNewPayment = () => {
    setEditingPayment(null);
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: Payment) => {
    console.log('✏️ Ouverture édition pour:', payment);
    
    // ✅ Enrichir les données du paiement avec toutes les informations nécessaires
    const enrichedPayment = {
      ...payment,
      // ✅ S'assurer que les champs essentiels sont présents
      staff_salary_id: payment.staff_salary_id || '', // ID de la config salaire
      payment_status: payment.payment_status || payment.status || 'completed',
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
    };
    
    console.log('✅ Données enrichies pour édition:', enrichedPayment);
    setEditingPayment(enrichedPayment);
    setShowPaymentForm(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetail(true);
  };

  const handleSubmitPayment = async (formData: any) => {
    if (editingPayment) {
      await updatePayment(editingPayment.id, formData);
    } else {
      await createPayment(formData);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      payment_type: '',
      payment_method: '',
      payment_status: '',
      payment_year: '',
      payment_month: ''
    });
  };

  // ✅ FONCTION DE TEST API
  const testAPI = async () => {
    try {
      console.log('🧪 Test de l\'API...');
      const data = await apiCall('/test');
      console.log('✅ Résultat test API:', data);
      setSuccessMessage('API fonctionnelle ! ' + data.database_status?.total_payments + ' paiements trouvés');
    } catch (error: any) {
      console.error('💥 Erreur test API:', error);
      setErrorMessage('Erreur test API: ' + error.message);
    }
  };

  // ✅ CHARGEMENT INITIAL ET GESTION DES CHANGEMENTS
  useEffect(() => {
    loadConfigs();
    loadStats();
  }, []);

  // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE QUAND LES FILTRES CHANGENT
  useEffect(() => {
    console.log('🔄 Filtres changés, rechargement...', filters);
    loadPayments(1, false); // Pas de force refresh pour les changements de filtres
  }, [filters]);

  // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE APRÈS ACTIONS
  const refreshAfterAction = async () => {
    console.log('🔄 Rafraîchissement après action...');
    try {
      await Promise.all([
        loadPayments(currentPage, true),
        loadStats()
      ]);
      console.log('✅ Rafraîchissement terminé');
    } catch (error) {
      console.error('💥 Erreur lors du rafraîchissement:', error);
    }
  };

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

  // ✅ FONCTION POUR OBTENIR LE STATUT UNIFIÉ
  const getPaymentStatus = (payment: Payment) => {
    return payment.payment_status || payment.status || 'unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ MESSAGES DE NOTIFICATION */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-2 shadow-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
                <button onClick={clearMessages} className="ml-3 text-green-600 hover:text-green-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-2 shadow-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                </div>
                <button onClick={clearMessages} className="ml-3 text-red-600 hover:text-red-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* ✅ HEADER PRINCIPAL */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Receipt className="h-6 w-6 mr-3 text-blue-600" />
                  Gestion des Paiements de Salaires
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Suivi et gestion de tous les paiements de salaires • {totalItems} paiements
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {loadPayments(currentPage); loadStats();}}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-1 inline" />
                  Actualiser
                </button>
                
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
                      <ChevronDown
                        className={`h-4 w-4 ml-1 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                    />
                </button>


                <button
                  onClick={handleNewPayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1 inline" />
                  Nouveau Paiement
                </button>
              </div>
            </div>
          </div>
          
          {/* ✅ FILTRES */}
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
                    <option value="">Tous types</option>
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
                        <option value="">Toutes les années</option>
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                  <select
                    value={filters.payment_month}
                    onChange={(e) => setFilters(prev => ({...prev, payment_month: e.target.value}))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous mois</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ✅ STATISTIQUES RAPIDES */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payé</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.formatted_total_amount}</p>
                  <p className="text-sm text-gray-500">{stats.total_payments} paiements</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500 text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.formatted_completed_amount}</p>
                  <p className="text-sm text-gray-500">{stats.completed_payments} paiements</p>
                </div>
                <div className="p-3 rounded-full bg-green-500 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.formatted_pending_amount}</p>
                  <p className="text-sm text-gray-500">{stats.pending_payments} paiements</p>
                </div>
                <div className="p-3 rounded-full bg-orange-500 text-white">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux Réussite</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completion_rate}%</p>
                  <p className="text-sm text-gray-500">{stats.staff_paid_current_period} employés payés</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TABLE PRINCIPALE DES PAIEMENTS AVEC TÉLÉCHARGEMENT PDF */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REÇU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMPLOYÉ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MONTANT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MÉTHODE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => {
                    const currentStatus = getPaymentStatus(payment);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">{payment.receipt_number}</div>
                          <div className="text-sm text-gray-500">{payment.period_display}</div>
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
                              <div className="text-sm text-gray-500">{payment.staff_number} • {payment.position}</div>
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
                            
                            {currentStatus === 'pending' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => changePaymentStatus(payment.id, 'completed')}
                                  disabled={changingStatus === payment.id}
                                  className="text-xs text-green-600 hover:text-green-800 px-1 py-0.5 rounded disabled:opacity-50"
                                  title="Marquer comme payé"
                                >
                                  {changingStatus === payment.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
                                  ) : (
                                    '✓ Payé'
                                  )}
                                </button>
                                <button
                                  onClick={() => changePaymentStatus(payment.id, 'cancelled')}
                                  disabled={changingStatus === payment.id}
                                  className="text-xs text-red-600 hover:text-red-800 px-1 py-0.5 rounded disabled:opacity-50"
                                  title="Annuler"
                                >
                                  {changingStatus === payment.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                                  ) : (
                                    '✗ Annuler'
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {/* ✅ BOUTON TÉLÉCHARGER PDF */}
                            <button
                              onClick={() => downloadReceiptPDF(payment)}
                              disabled={downloading === payment.id}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded"
                              title="Télécharger le reçu PDF"
                            >
                              {downloading === payment.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleViewPayment(payment)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEditPayment(payment)}
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
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun paiement trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search || filters.payment_type || filters.payment_method || filters.payment_status ? 
                    'Aucun paiement ne correspond aux critères de recherche.' :
                    'Aucun paiement enregistré. Commencez par créer votre premier paiement.'
                  }
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                  {filters.search || filters.payment_type || filters.payment_method || filters.payment_status ? (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Réinitialiser les filtres
                    </button>
                  ) : null}
                  
                  <button
                    onClick={handleNewPayment}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Paiement
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* ✅ PAGINATION */}
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

      {/* ✅ MODALS AVEC TÉLÉCHARGEMENT PDF DANS LES DÉTAILS */}
      <SalaryPaymentsFormModal
        showPaymentForm={showPaymentForm}
        onClosePaymentForm={() => setShowPaymentForm(false)}
        onSubmitPayment={handleSubmitPayment}
        editingPayment={editingPayment}
        preselectedStaff={null}
        loading={creating || updating}
        showPaymentDetail={showPaymentDetail}
        selectedPayment={selectedPayment ? {
          ...selectedPayment,
          // ✅ Ajouter bouton téléchargement dans les détails
          downloadPDF: () => downloadReceiptPDF(selectedPayment)
        } : null}
        onClosePaymentDetail={() => setShowPaymentDetail(false)}
      />

      {/* ✅ OVERLAY DE CHARGEMENT */}
      {(creating || updating) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 font-medium">
              {creating && 'Création du paiement...'}
              {updating && 'Modification du paiement...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPaymentsPage;