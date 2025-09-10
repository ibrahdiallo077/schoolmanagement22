import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Tag,
  User,
  Grid3X3,
  List,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  Building,
  Sparkles,
  BarChart3,
  PieChart,
  Shield,
  FileText
} from 'lucide-react';
import { useExpenses } from '@/hooks/useExpense';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseReceipt from '@/components/expenses/ExpenseReceipt';
import { formatCurrency, ExpenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense.types';
import { toast } from 'react-hot-toast';

const ExpensesDashboard: React.FC = () => {
  // ==================== Hooks ====================
  const {
    expenses,
    categories,
    statuses,
    responsibles,
    loading,
    configLoading,
    filters,
    pagination,
    selectedIds,
    error,
    isReady,
    setFilters,
    clearFilters,
    selectExpense,
    selectAll,
    clearSelection,
    refreshAll,
    deleteMultipleExpenses
  } = useExpenses();

  // ==================== State ====================
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'validation'>('cards');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptExpense, setReceiptExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject'>('approve');
  const [validationNotes, setValidationNotes] = useState('');
  const [selectedForValidation, setSelectedForValidation] = useState<string[]>([]);

  // Filtres
  const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status_id || '');
  const [selectedResponsible, setSelectedResponsible] = useState(filters.responsible_id || '');
  const [selectedYear, setSelectedYear] = useState(filters.year || '');
  const [selectedMonth, setSelectedMonth] = useState(filters.month || '');

  // ==================== Helper Functions ====================
  const getCategoryById = (id: string) => categories.find(cat => cat.id === id);
  const getStatusById = (id: string) => statuses.find(stat => stat.id === id);
  const getResponsibleById = (id: string) => responsibles.find(resp => resp.id === id);

  // ==================== Enrichir les dépenses avec les vraies données ====================
  const enrichedExpenses = useMemo(() => {
    if (!expenses.length || !categories.length || !statuses.length) {
      return [];
    }

    return expenses.map(expense => {
      const category = getCategoryById(expense.category_id);
      const status = getStatusById(expense.status_id);
      const responsible = getResponsibleById(expense.responsible_id);

      return {
        ...expense,
        // Informations enrichies depuis les vraies données
        category_name: category?.name || 'Catégorie inconnue',
        category_color: category?.color || '#3B82F6',
        category_icon: category?.icon || 'FileText',
        
        status_name: status?.name || 'Statut inconnu',
        status_color: status?.color || '#6B7280',
        status_icon: status?.icon || 'Clock',
        status_final: status?.is_final || false,
        
        responsible_name: responsible?.name || 'Non assigné',
        responsible_department: responsible?.department || '',
        
        // Formatage du montant si pas déjà fait
        montant_formate: expense.montant_formate || formatCurrency(expense.amount)
      };
    });
  }, [expenses, categories, statuses, responsibles]);

  // ==================== Dépenses en attente pour validation ====================
  const pendingExpenses = useMemo(() => {
    return enrichedExpenses.filter(expense => 
      expense.status_name === 'En attente' || 
      expense.status_name.toLowerCase().includes('attente')
    );
  }, [enrichedExpenses]);

  // ==================== Statistiques calculées avec vraies données ====================
  const dashboardStats = useMemo(() => {
    const total = enrichedExpenses.length;
    const totalAmount = enrichedExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) || 0), 0);
    
    const pending = enrichedExpenses.filter(exp => exp.status_name === 'En attente');
    const paid = enrichedExpenses.filter(exp => exp.status_name === 'Payé');
    const rejected = enrichedExpenses.filter(exp => exp.status_name === 'Rejeté');

    const now = new Date();
    const thisMonth = enrichedExpenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });

    return {
      total,
      totalAmount: formatCurrency(totalAmount),
      pending: pending.length,
      pendingAmount: formatCurrency(pending.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) || 0), 0)),
      paid: paid.length,
      paidAmount: formatCurrency(paid.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) || 0), 0)),
      rejected: rejected.length,
      rejectedAmount: formatCurrency(rejected.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) || 0), 0)),
      thisMonth: thisMonth.length,
      thisMonthAmount: formatCurrency(thisMonth.reduce((sum, exp) => sum + (parseFloat(exp.amount.toString()) || 0), 0))
    };
  }, [enrichedExpenses]);

  // Années disponibles depuis les vraies données
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    enrichedExpenses.forEach(expense => {
      yearSet.add(new Date(expense.expense_date).getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [enrichedExpenses]);

  const months = [
    { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' }, { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' }, { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' }, { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' }, { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

  // ==================== Validation Functions avec vraies APIs ====================
  const validateExpenses = async (expenseIds: string[], action: 'approve' | 'reject', notes?: string) => {
    try {
      setValidationLoading(true);
      
      // Utiliser l'API bulk validation du backend
      const response = await fetch('/api/expenses/workflow/bulk-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expense_ids: expenseIds,
          action: action, // 'approve' ou 'reject'
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }
      
      toast.success(result.message || `${expenseIds.length} dépense${expenseIds.length > 1 ? 's' : ''} ${
        action === 'approve' ? 'validée(s)' : 'rejetée(s)'
      } avec succès`);
      
      await refreshAll();
      setSelectedForValidation([]);
      setShowValidationModal(false);
      setValidationNotes('');
      
    } catch (error: any) {
      console.error('Erreur validation:', error);
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setValidationLoading(false);
    }
  };

  // ==================== Event Handlers ====================
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters({ search: term, page: 1 });
  };

  const handleFilterChange = () => {
    setFilters({
      category_id: selectedCategory,
      status_id: selectedStatus,
      responsible_id: selectedResponsible,
      year: selectedYear,
      month: selectedMonth,
      page: 1
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedResponsible('');
    setSelectedYear('');
    setSelectedMonth('');
    setSearchTerm('');
    clearFilters();
  };

  const handleSelectForValidation = (expenseId: string) => {
    setSelectedForValidation(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAllForValidation = () => {
    if (selectedForValidation.length === pendingExpenses.length) {
      setSelectedForValidation([]);
    } else {
      setSelectedForValidation(pendingExpenses.map(exp => exp.id));
    }
  };

  const handleValidateSelected = (action: 'approve' | 'reject') => {
    if (selectedForValidation.length === 0) {
      toast.error('Veuillez sélectionner au moins une dépense');
      return;
    }
    
    setValidationAction(action);
    setShowValidationModal(true);
  };

  const handleSingleValidation = async (expenseId: string, action: 'approve' | 'reject') => {
    await validateExpenses([expenseId], action);
  };

  const handleViewExpense = (expense: Expense) => {
    setReceiptExpense(expense);
    setShowReceipt(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      await deleteMultipleExpenses([expenseId]);
    }
  };

  const handleExportPDF = (expense: any) => {
    const category = getCategoryById(expense.category_id);
    const status = getStatusById(expense.status_id);
    const responsible = getResponsibleById(expense.responsible_id);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Dépense - ${expense.reference || expense.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f8fafc; }
          .receipt { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
          .title { color: #3B82F6; font-size: 24px; font-weight: bold; margin-bottom: 8px; }
          .section { margin: 20px 0; background: #F9FAFB; border-radius: 8px; padding: 20px; }
          .field { margin: 10px 0; display: flex; justify-content: space-between; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #1F2937; }
          .amount { font-size: 20px; font-weight: bold; color: #059669; }
          .footer { margin-top: 50px; text-align: center; color: #6B7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">REÇU DE DÉPENSE</div>
            <div>Référence: ${expense.reference || expense.id}</div>
          </div>
          
          <div class="section">
            <div class="field">
              <span class="label">Description:</span>
              <span class="value">${expense.description}</span>
            </div>
            <div class="field">
              <span class="label">Montant:</span>
              <span class="value amount">${expense.montant_formate}</span>
            </div>
            <div class="field">
              <span class="label">Date:</span>
              <span class="value">${new Date(expense.expense_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="field">
              <span class="label">Catégorie:</span>
              <span class="value">${category?.name || 'Non définie'}</span>
            </div>
            <div class="field">
              <span class="label">Statut:</span>
              <span class="value">${status?.name || 'En attente'}</span>
            </div>
            <div class="field">
              <span class="label">Responsable:</span>
              <span class="value">${responsible?.name || 'Non assigné'}</span>
            </div>
          </div>

          <div class="footer">
            Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // Helper functions pour les styles
  const getStatusIcon = (statusName: string) => {
    switch (statusName) {
      case 'Payé': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Rejeté': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'En attente': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case 'Payé': return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejeté': return 'bg-red-50 text-red-700 border-red-200';
      case 'En attente': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (categoryColor: string) => {
    // Utiliser directement la couleur de la base de données
    return `bg-blue-50 text-blue-700 border-blue-200`;
  };

  // ==================== Loading States ====================
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargement des données</h3>
          <p className="text-gray-600">Connexion à la base de données...</p>
        </div>
      </div>
    );
  }

  if (error && !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshAll}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si pas de données de configuration, afficher un message d'erreur
  if (!categories.length && !statuses.length && !responsibles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration manquante</h2>
          <p className="text-gray-600 mb-6">
            Les données de configuration (catégories, statuts, responsables) ne sont pas initialisées.
          </p>
          <button
            onClick={refreshAll}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Initialiser les données
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépenses</h1>
                <p className="text-gray-600 mt-1">Dashboard avec données réelles PostgreSQL</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={refreshAll}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                disabled={loading}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleNewExpense}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nouvelle Dépense
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards avec vraies données */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.total}</p>
                <p className="text-xs text-blue-600 font-medium">{dashboardStats.totalAmount}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-600">En Attente</p>
                </div>
                <p className="text-2xl font-bold text-orange-600 mb-1">{dashboardStats.pending}</p>
                <p className="text-xs text-orange-600 font-medium">{dashboardStats.pendingAmount}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-600">Payées</p>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">{dashboardStats.paid}</p>
                <p className="text-xs text-green-600 font-medium">{dashboardStats.paidAmount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-600">Rejetées</p>
                </div>
                <p className="text-2xl font-bold text-red-600 mb-1">{dashboardStats.rejected}</p>
                <p className="text-xs text-red-600 font-medium">{dashboardStats.rejectedAmount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-600">Ce Mois</p>
                </div>
                <p className="text-2xl font-bold text-purple-600 mb-1">{dashboardStats.thisMonth}</p>
                <p className="text-xs text-purple-600 font-medium">{dashboardStats.thisMonthAmount}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-600">Validation</p>
                </div>
                <p className="text-2xl font-bold text-indigo-600 mb-1">{pendingExpenses.length}</p>
                <p className="text-xs text-indigo-600 font-medium">À traiter</p>
              </div>
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une dépense..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Cartes
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('validation')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'validation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Validation ({pendingExpenses.length})
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 ${
                    showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Toutes les catégories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tous les statuts</option>
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label>
                    <select
                      value={selectedResponsible}
                      onChange={(e) => setSelectedResponsible(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tous les responsables</option>
                      {responsibles.map(responsible => (
                        <option key={responsible.id} value={responsible.id}>{responsible.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Toutes les années</option>
                      {years.map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tous les mois</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleFilterChange}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200"
                  >
                    Appliquer les filtres
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {viewMode === 'validation' ? (
                    <>
                      <Shield className="w-5 h-5 text-orange-600" />
                      Validation des Dépenses
                      <span className="ml-2 text-sm text-gray-500 bg-orange-100 px-3 py-1 rounded-full">
                        {pendingExpenses.length} en attente
                      </span>
                    </>
                  ) : (
                    <>
                      <PieChart className="w-5 h-5 text-blue-600" />
                      Liste des Dépenses
                      <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {enrichedExpenses.length} dépense{enrichedExpenses.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </h2>
              </div>
              
              {viewMode === 'validation' && pendingExpenses.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAllForValidation}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                  >
                    {selectedForValidation.length === pendingExpenses.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                  </button>
                  
                  {selectedForValidation.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValidateSelected('approve')}
                        disabled={validationLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Valider ({selectedForValidation.length})
                      </button>
                      <button
                        onClick={() => handleValidateSelected('reject')}
                        disabled={validationLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter ({selectedForValidation.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Vue Validation */}
            {viewMode === 'validation' && (
              <>
                {pendingExpenses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune dépense en attente</h3>
                    <p className="text-gray-600">Toutes les dépenses ont été traitées. Excellent travail ! 🎉</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-2">
                            <input
                              type="checkbox"
                              checked={selectedForValidation.length === pendingExpenses.length && pendingExpenses.length > 0}
                              onChange={handleSelectAllForValidation}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Description</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Montant</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Catégorie</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Responsable</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Date</th>
                          <th className="text-right py-4 px-4 font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingExpenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="py-4 px-2">
                              <input
                                type="checkbox"
                                checked={selectedForValidation.includes(expense.id)}
                                onChange={() => handleSelectForValidation(expense.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{expense.description}</div>
                                {expense.reference && (
                                  <div className="text-sm text-gray-500">Réf: {expense.reference}</div>
                                )}
                                {expense.supplier_name && (
                                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Building className="w-3 h-3" />
                                    {expense.supplier_name}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-lg text-gray-900">{expense.montant_formate}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border`}
                                    style={{backgroundColor: expense.category_color + '20', color: expense.category_color, borderColor: expense.category_color + '40'}}>
                                <Tag className="w-3 h-3 mr-1" />
                                {expense.category_name}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-gray-900">{expense.responsible_name}</div>
                              {expense.responsible_department && (
                                <div className="text-xs text-gray-500">{expense.responsible_department}</div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-900">
                                {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => handleSingleValidation(expense.id, 'approve')}
                                  disabled={validationLoading}
                                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                  title="Valider et payer"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSingleValidation(expense.id, 'reject')}
                                  disabled={validationLoading}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                  title="Rejeter"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleViewExpense(expense)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Voir le reçu"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Vue normale (cartes et table) */}
            {viewMode !== 'validation' && (
              <>
                {loading && enrichedExpenses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-6 relative">
                      <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                      <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-gray-600 text-lg">Chargement des dépenses...</p>
                  </div>
                ) : enrichedExpenses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <DollarSign className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune dépense trouvée</h3>
                    <p className="text-gray-600 mb-8">Commencez par créer votre première dépense</p>
                    <button
                      onClick={handleNewExpense}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Créer une dépense
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Vue Cartes */}
                    {viewMode === 'cards' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrichedExpenses.map(expense => (
                          <div key={expense.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 line-clamp-2">{expense.description}</h3>
                                {expense.reference && (
                                  <p className="text-sm text-gray-500 mt-1">Réf: {expense.reference}</p>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(expense.id)}
                                onChange={() => selectExpense(expense.id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            </div>

                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Montant</span>
                                <span className="font-bold text-lg text-gray-900">{expense.montant_formate}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Catégorie</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`}
                                      style={{backgroundColor: expense.category_color + '20', color: expense.category_color}}>
                                  {expense.category_name}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Statut</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(expense.status_name)}`}>
                                  {getStatusIcon(expense.status_name)}
                                  <span className="ml-1">{expense.status_name}</span>
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Responsable</span>
                                <span className="text-sm text-gray-900">{expense.responsible_name}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Date</span>
                                <span className="text-sm text-gray-900">
                                  {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleViewExpense(expense)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExportPDF(expense)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vue Table */}
                    {viewMode === 'table' && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-4 px-2">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.length === enrichedExpenses.length && enrichedExpenses.length > 0}
                                  onChange={() => selectedIds.length === enrichedExpenses.length ? clearSelection() : selectAll()}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                              </th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-900">Description</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-900">Montant</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-900">Catégorie</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-900">Statut</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-900">Responsable</th>
                              <th className="text-left py-4 px-4 font-semibold text-gray-900">Date</th>
                              <th className="text-right py-4 px-4 font-semibold text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {enrichedExpenses.map((expense) => (
                              <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="py-4 px-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(expense.id)}
                                    onChange={() => selectExpense(expense.id)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="py-4 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">{expense.description}</div>
                                    {expense.reference && (
                                      <div className="text-sm text-gray-500">Réf: {expense.reference}</div>
                                    )}
                                    {expense.supplier_name && (
                                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <Building className="w-3 h-3" />
                                        {expense.supplier_name}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-semibold text-gray-900">{expense.montant_formate}</div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border`}
                                        style={{backgroundColor: expense.category_color + '20', color: expense.category_color, borderColor: expense.category_color + '40'}}>
                                    <Tag className="w-3 h-3 mr-1" />
                                    {expense.category_name}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(expense.status_name)}`}>
                                    {getStatusIcon(expense.status_name)}
                                    <span className="ml-1">{expense.status_name}</span>
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-sm font-medium text-gray-900">{expense.responsible_name}</div>
                                  {expense.responsible_department && (
                                    <div className="text-xs text-gray-500">{expense.responsible_department}</div>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-sm text-gray-900">
                                    {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1 justify-end">
                                    <button
                                      onClick={() => handleViewExpense(expense)}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                      title="Voir"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditExpense(expense)}
                                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                      title="Modifier"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleExportPDF(expense)}
                                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                                      title="PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <ExpenseForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refreshAll(); }}
          expense={editingExpense}
          categories={categories}
          statuses={statuses}
          responsibles={responsibles}
        />
      )}

      {showReceipt && receiptExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Reçu de Dépense</h3>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <ExpenseReceipt
                expense={receiptExpense}
                categories={categories}
                statuses={statuses}
                responsibles={responsibles}
                showPrintButton={true}
                className="border-0 shadow-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                validationAction === 'approve' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {validationAction === 'approve' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {validationAction === 'approve' ? 'Valider les dépenses' : 'Rejeter les dépenses'}
              </h3>
              <p className="text-gray-600">
                Vous êtes sur le point de {validationAction === 'approve' ? 'valider et marquer comme payées' : 'rejeter'} {selectedForValidation.length} dépense{selectedForValidation.length > 1 ? 's' : ''}.
              </p>
              {validationAction === 'approve' && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ⚡ Ces montants impacteront directement le capital disponible.
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes de validation (optionnel)
              </label>
              <textarea
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder={`Ajoutez une note pour expliquer votre ${validationAction === 'approve' ? 'validation' : 'rejet'}...`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowValidationModal(false)}
                disabled={validationLoading}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => validateExpenses(selectedForValidation, validationAction, validationNotes)}
                disabled={validationLoading}
                className={`flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 disabled:opacity-50 ${
                  validationAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {validationLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Traitement...
                  </div>
                ) : (
                  validationAction === 'approve' ? 'Valider' : 'Rejeter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {validationLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Traitement en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesDashboard;