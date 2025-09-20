// src/pages/student-payments/StudentPaymentsPage.tsx - VERSION CORRIGÉE AVEC FORMATAGE
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Plus, RefreshCw, Download, X
} from 'lucide-react';

// Import des composants modulaires
import PaymentStats from './PaymentStats';
import PaymentFilters from './PaymentFilters';
import PaymentTable from './PaymentTable';
import PaymentModals from './PaymentModals';
import { PaymentForm } from '../../components/student-payments';

interface QuickStats {
  total_revenue: number;
  monthly_revenue: number;
  pending_amount: number;
  overdue_amount: number;
  total_transactions: number;
}

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

const StudentPaymentsPage: React.FC = () => {
  // ÉTATS PRINCIPAUX - SÉPARATION DONNÉES BRUTES / FILTRÉES
  const [stats, setStats] = useState<QuickStats>({
    total_revenue: 0,
    monthly_revenue: 0,
    pending_amount: 0,
    overdue_amount: 0,
    total_transactions: 0
  });
  
  // DONNÉES BRUTES - CHARGÉES UNE SEULE FOIS
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // FILTRES - ÉTAT LOCAL UNIQUEMENT
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: 'all',
    periodFilter: 'all',
    paymentTypeFilter: 'all',
    paymentMethodFilter: 'all',
    dateRange: { start: '', end: '' }
  });
  
  // PAGINATION ET TRI - ÉTAT LOCAL
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // === FONCTION DE FORMATAGE CORRIGÉE ===
  const formatGNF = (amount: number | string | undefined | null): string => {
    const numAmount = Number(amount || 0);
    if (isNaN(numAmount)) return '0 FG';
    
    // Méthode manuelle pour garantir des espaces comme séparateurs
    const formatted = numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FG`;
  };

  const getMonthName = (month: number | string | undefined | null): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthNum = Number(month || 1);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return 'Mois inconnu';
    return months[monthNum - 1] || 'Mois inconnu';
  };

  // ADAPTATION DES DONNÉES
  const adaptPaymentData = (payment: any): Payment => {
    console.log('🔍 Données brutes reçues:', payment);
    
    const safePayment = {
      id: payment?.id || '',
      receipt_number: payment?.receipt_number || 'N/A',
      amount: Number(payment?.amount || 0),
      amount_due: Number(payment?.amount_due || 0),
      payment_date: payment?.payment_date || new Date().toISOString(),
      payment_type: payment?.payment_type || 'tuition_monthly',
      custom_payment_type: payment?.custom_payment_type || '',
      payment_method: payment?.payment_method || 'cash',
      payment_month: Number(payment?.payment_month || new Date().getMonth() + 1),
      payment_year: Number(payment?.payment_year || new Date().getFullYear()),
      number_of_months: Number(payment?.number_of_months || 1),
      paid_by: payment?.paid_by || 'N/A',
      notes: payment?.notes || '',
      created_at: payment?.created_at || new Date().toISOString(),
      student: {
        id: payment?.student?.id || '',
        student_number: payment?.student?.student_number || 'N/A',
        first_name: payment?.student?.first_name || 'Prénom',
        last_name: payment?.student?.last_name || 'Nom',
        full_name: payment?.student?.full_name || 
                  `${payment?.student?.first_name || 'Prénom'} ${payment?.student?.last_name || 'Nom'}`,
        status: (payment?.student?.status === 'interne' || payment?.student?.status === 'externe') 
          ? payment.student.status 
          : 'externe',
        is_orphan: Boolean(payment?.student?.is_orphan),
        age: Number(payment?.student?.age || 0),
        photo_url: payment?.student?.photo_url || undefined,
        coranic_class: payment?.student?.coranic_class || undefined,
        guardian_name: payment?.student?.guardian_name || undefined,
        guardian_phone: payment?.student?.guardian_phone || undefined,
      }
    };

    // Calculs sécurisés
    const amountPaid = safePayment.amount;
    const amountDue = safePayment.amount_due;
    const finalAmountDue = amountDue > 0 ? amountDue : amountPaid;
    
    const completionRate = finalAmountDue > 0 ? Math.min(100, (amountPaid / finalAmountDue) * 100) : 100;
    const isComplete = amountPaid >= finalAmountDue;
    const difference = amountPaid - finalAmountDue;

    return {
      ...safePayment,
      amount_due: finalAmountDue,
      formatted_amount: formatGNF(amountPaid),
      period: `${getMonthName(safePayment.payment_month)} ${safePayment.payment_year}`,
      completion_rate: completionRate,
      is_complete: isComplete,
      difference: difference,
      status: isComplete ? 'Payé' : amountPaid > 0 ? 'Partiel' : 'En attente'
    };
  };

  // CHARGEMENT OPTIMISÉ - UNE SEULE FOIS
  const loadData = async (forceReload = false) => {
    // Éviter les rechargements inutiles
    if (!forceReload && allPayments.length > 0) {
      console.log('🚫 Rechargement évité - données déjà présentes');
      return;
    }
    
    setLoading(true);
    
    try {
     const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // CHARGEMENT DES STATISTIQUES
      try {
        console.log('📊 Chargement des statistiques...');
        const statsResponse = await fetch(`${baseUrl}/api/payments/stats`, {
          headers: {
            'Authorization': 'Bearer dev-token',
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('📊 Réponse stats complète:', statsData);
          
          if (statsData?.success && statsData?.stats) {
            const newStats = {
              total_revenue: Number(statsData.stats.total_revenue || 0),
              monthly_revenue: Number(statsData.stats.monthly_revenue || 0),
              pending_amount: Number(statsData.stats.pending_amount || 0),
              overdue_amount: Number(statsData.stats.overdue_amount || 0),
              total_transactions: Number(statsData.stats.total_transactions || 0)
            };
            
            console.log('✅ Stats mises à jour:', newStats);
            setStats(newStats);
          }
        }
      } catch (statsError) {
        console.error('❌ Erreur chargement statistiques:', statsError);
      }

      // CHARGEMENT DE TOUS LES PAIEMENTS - SANS FILTRES
      console.log('📋 Chargement de TOUS les paiements...');
      const paymentEndpoints = [
        `${baseUrl}/api/payments?limit=1000`,
        `${baseUrl}/api/student-payments?limit=1000`,
        `${baseUrl}/api/payments/list?limit=1000`
      ];

      let paymentsLoaded = false;

      for (const endpoint of paymentEndpoints) {
        try {
          console.log('🌐 Tentative de chargement depuis:', endpoint);
          
          const paymentsResponse = await fetch(endpoint, {
            headers: {
              'Authorization': 'Bearer dev-token',
              'Content-Type': 'application/json'
            }
          });

          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            console.log('📦 Données paiements reçues:', {
              success: paymentsData?.success,
              paymentsCount: paymentsData?.payments?.length,
              total: paymentsData?.total
            });
            
            if (paymentsData?.success && Array.isArray(paymentsData.payments)) {
              const adaptedPayments = paymentsData.payments.map((payment: any) => {
                try {
                  return adaptPaymentData(payment);
                } catch (adaptError) {
                  console.error('❌ Erreur adaptation paiement:', adaptError, payment);
                  return null;
                }
              }).filter(Boolean);
              
              console.log('✅ Paiements adaptés:', {
                count: adaptedPayments.length,
                firstPayment: adaptedPayments[0] || 'Aucun'
              });
              
              // STOCKER TOUTES LES DONNÉES
              setAllPayments(adaptedPayments);
              paymentsLoaded = true;
              break;
            }
          }
        } catch (error) {
          console.warn(`❌ Erreur endpoint ${endpoint}:`, error);
        }
      }

      if (!paymentsLoaded) {
        console.warn('⚠️ Aucun endpoint de paiements disponible - liste vide');
        setAllPayments([]);
      }
      
    } catch (error) {
      console.error('💥 Erreur critique chargement données:', error);
      setStats({
        total_revenue: 0,
        monthly_revenue: 0,
        pending_amount: 0,
        overdue_amount: 0,
        total_transactions: 0
      });
      setAllPayments([]);
    } finally {
      setLoading(false);
      console.log('🏁 Chargement terminé');
    }
  };

  // FILTRAGE CÔTÉ CLIENT ULTRA-RAPIDE AVEC useMemo
  const filteredPayments = useMemo(() => {
    console.log('🔍 Filtrage côté client...', {
      totalPayments: allPayments.length,
      filters: filters
    });

    return allPayments.filter(payment => {
      if (!payment) return false;

      // Recherche textuelle
      const matchesSearch = filters.searchTerm ? (
        (payment.student?.full_name || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (payment.receipt_number || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (payment.student?.student_number || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (payment.paid_by || '').toLowerCase().includes(filters.searchTerm.toLowerCase())
      ) : true;
      
      // Filtres de statut
      const matchesStatus = filters.statusFilter === 'all' || payment.status === filters.statusFilter;
      const matchesPeriod = filters.periodFilter === 'all' || payment.period === filters.periodFilter;
      const matchesType = filters.paymentTypeFilter === 'all' || payment.payment_type === filters.paymentTypeFilter;
      const matchesMethod = filters.paymentMethodFilter === 'all' || payment.payment_method === filters.paymentMethodFilter;
      
      // Filtre de dates
      let matchesDateRange = true;
      if (filters.dateRange?.start && filters.dateRange?.end && payment.payment_date) {
        try {
          const paymentDate = new Date(payment.payment_date);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          matchesDateRange = paymentDate >= startDate && paymentDate <= endDate;
        } catch (error) {
          console.warn('Erreur comparaison dates:', error);
          matchesDateRange = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPeriod && matchesType && matchesMethod && matchesDateRange;
    });
  }, [allPayments, filters]);

  // TRI CÔTÉ CLIENT AVEC useMemo
  const sortedPayments = useMemo(() => {
    console.log('📊 Tri côté client...', { sortBy, sortOrder });
    
    return [...filteredPayments].sort((a, b) => {
      let aVal: any = a[sortBy as keyof Payment];
      let bVal: any = b[sortBy as keyof Payment];
      
      // Gestion des cas spéciaux
      if (sortBy === 'student') {
        aVal = a.student?.full_name || '';
        bVal = b.student?.full_name || '';
      } else if (sortBy === 'payment_date' || sortBy === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPayments, sortBy, sortOrder]);

  // PAGINATION CÔTÉ CLIENT AVEC useMemo
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    console.log('📄 Pagination côté client...', {
      currentPage,
      startIndex,
      endIndex,
      totalItems: sortedPayments.length
    });
    
    return sortedPayments.slice(startIndex, endIndex);
  }, [sortedPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);

  // EFFET DE CHARGEMENT INITIAL UNIQUEMENT
  useEffect(() => {
    console.log('🚀 Chargement initial des données...');
    loadData(true);
  }, []);

  // GESTIONNAIRES D'ÉVÉNEMENTS - OPTIMISÉS
  const handleNewPayment = () => {
    setEditingPayment(null);
    setShowPaymentForm(true);
  };
  
  const handleEditPayment = (payment: Payment) => {
    const editingData = {
      ...payment,
      amount: payment.amount,
      amount_due: payment.amount_due,
    };
    
    console.log('📝 Données d\'édition préparées:', editingData);
    setEditingPayment(editingData);
    setShowPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    loadData(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    
    if (paymentData?.success_message) {
      alert(paymentData.success_message);
    }
    
    loadData(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!paymentId || !window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer dev-token',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success) {
          alert('Paiement supprimé avec succès');
          loadData(true);
        } else {
          alert('Erreur lors de la suppression: ' + (result?.error || 'Erreur inconnue'));
        }
      } else {
        alert('Erreur de connexion lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du paiement');
    }
  };

  // GESTIONNAIRES POUR FILTRES ET PAGINATION - OPTIMISÉS
  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    console.log('🎯 Changement de filtres:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    console.log('📊 Changement de tri:', { field, order });
    setSortBy(field);
    setSortOrder(order);
  };

  // GESTIONNAIRES POUR MODALS
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleShowReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setSelectedPayment(null);
  };

  // === FONCTION PDF CORRIGÉE ===
  const generatePDFReceipt = async (payment: Payment) => {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;
      
      const addCenteredText = (text: string, y: number, fontSize = 12) => {
        doc.setFontSize(fontSize);
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
        return y + fontSize * 0.5;
      };
      
      // En-tête
      doc.setFont('helvetica', 'bold');
      yPosition = addCenteredText('Haramain', yPosition, 18);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      yPosition = addCenteredText('École Coranique', yPosition, 12);
      yPosition = addCenteredText('Conakry, République de Guinée', yPosition, 10);
      yPosition += 10;
      
      // Ligne de séparation
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Titre du reçu
      doc.setFont('helvetica', 'bold');
      yPosition = addCenteredText('REÇU DE PAIEMENT', yPosition, 16);
      yPosition += 10;
      
      // Informations du reçu
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // N° Reçu et Date
      doc.text(`Reçu N° : ${payment.receipt_number}`, margin, yPosition);
      doc.text(`Date : ${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}`, pageWidth - 80, yPosition);
      yPosition += 15;
      
      // Informations étudiant
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS ÉTUDIANT', margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Nom complet : ${payment.student?.full_name || 'N/A'}`, margin, yPosition);
      yPosition += 6;
      doc.text(`N° Étudiant : ${payment.student?.student_number || 'N/A'}`, margin, yPosition);
      yPosition += 6;
      
      if (payment.student?.coranic_class?.name) {
        doc.text(`Classe : ${payment.student.coranic_class.name}`, margin, yPosition);
        yPosition += 6;
      }
      
      doc.text(`Statut : ${payment.student?.status === 'interne' ? 'Interne' : 'Externe'}${payment.student?.is_orphan ? ' - Orphelin' : ''}`, margin, yPosition);
      yPosition += 15;
      
      // Ligne de séparation
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Détails du paiement
      doc.setFont('helvetica', 'bold');
      doc.text('DÉTAILS DU PAIEMENT', margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Description : ${payment.payment_type}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Période : ${payment.period}`, margin, yPosition);
      yPosition += 6;
      
      if ((payment.number_of_months || 0) > 1) {
        doc.text(`Nombre de mois : ${payment.number_of_months}`, margin, yPosition);
        yPosition += 6;
      }
      
      // FORMATAGE CORRIGÉ DES MONTANTS
      doc.text(`Montant dû : ${formatGNF(payment.amount_due)}`, margin, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Montant payé : ${formatGNF(payment.amount)}`, margin, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Mode de paiement : ${payment.payment_method}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Payé par : ${payment.paid_by}`, margin, yPosition);
      yPosition += 10;
      
      // Statut du paiement avec formatage corrigé
      doc.setFont('helvetica', 'bold');
      if (payment.is_complete) {
        if (payment.difference > 0) {
          doc.setTextColor(0, 128, 0);
          doc.text(`✓ PAIEMENT COMPLET - Excédent: ${formatGNF(payment.difference)}`, margin, yPosition);
        } else {
          doc.setTextColor(0, 128, 0);
          doc.text('✓ PAIEMENT COMPLET', margin, yPosition);
        }
      } else {
        doc.setTextColor(255, 140, 0);
        doc.text(`⚠ PAIEMENT PARTIEL - Reste: ${formatGNF(Math.abs(payment.difference))}`, margin, yPosition);
      }
      yPosition += 15;
      
      // Notes
      if (payment.notes) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text('Notes :', margin, yPosition);
        yPosition += 6;
        
        const notesLines = doc.splitTextToSize(payment.notes, pageWidth - 2 * margin);
        doc.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 6 + 10;
      }
      
      // Signature
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPosition += 20;
      doc.text('Reçu par : Administration', margin, yPosition);
      yPosition += 15;
      doc.text('Signature : _________________', margin, yPosition);
      
      // Pied de page
      yPosition = doc.internal.pageSize.height - 30;
      doc.setFontSize(8);
      addCenteredText('Ce reçu est généré électroniquement et fait foi de paiement.', yPosition);
      addCenteredText('Conservez ce reçu comme preuve de paiement.', yPosition + 8);
      
      doc.save(`recu_${payment.receipt_number || 'paiement'}.pdf`);
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  // TÉLÉCHARGEMENT PDF
  const handleDownloadReceipt = async (payment: Payment) => {
    if (!payment?.id) return;

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/payments/receipts/${payment.id}`, {
        headers: {
          'Authorization': 'Bearer dev-token'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recu_${payment.receipt_number || 'paiement'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        await generatePDFReceipt(payment);
      }
    } catch (error) {
      console.error('Erreur téléchargement reçu:', error);
      await generatePDFReceipt(payment);
    }
  };

  // ÉCRAN DE CHARGEMENT
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des données de paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header moderne */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                Gestion des Paiements
              </h1>
              <p className="text-gray-600 mt-1">
                Suivi intelligent des recettes et paiements étudiants • {sortedPayments.length} paiements
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => loadData(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
                Actualiser
              </button>
            
              <button
                onClick={handleNewPayment}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                Nouveau Paiement
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques */}
        <PaymentStats stats={stats} />

        {/* Filtres */}
        <PaymentFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          resultCount={sortedPayments.length}
        />

        {/* Table */}
        <PaymentTable
          payments={paginatedPayments}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onEdit={handleEditPayment}
          onDelete={handleDeletePayment}
          onViewDetails={handleViewDetails}
          onShowReceipt={handleShowReceipt}
          onDownloadReceipt={handleDownloadReceipt}
          onNewPayment={handleNewPayment}
          totalItems={sortedPayments.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Modal du formulaire de paiement */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200/60">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center justify-between text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  {editingPayment ? 'Modifier le paiement' : 'Nouveau paiement'}
                </h2>
                <button
                  onClick={handleClosePaymentForm}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onCancel={handleClosePaymentForm}
                editingPayment={editingPayment}
                className="border-0 shadow-none rounded-none bg-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals de détails et reçus */}
      <PaymentModals
        selectedPayment={selectedPayment}
        showDetailsModal={showDetailsModal}
        showReceiptModal={showReceiptModal}
        onCloseDetails={handleCloseDetails}
        onCloseReceipt={handleCloseReceipt}
        onEdit={handleEditPayment}
        onDownloadReceipt={handleDownloadReceipt}
      />
    </div>
  );
};

export default StudentPaymentsPage;