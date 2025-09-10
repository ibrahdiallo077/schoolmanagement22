import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Calendar,
  DollarSign,
  FileText,
  User,
  Tag,
  CreditCard,
  Building,
  MessageSquare,
  AlertCircle,
  Check,
  Info
} from 'lucide-react';
import { 
  ExpenseCategory, 
  ExpenseStatus, 
  ExpenseResponsible,
  CreateExpenseDto,
  Expense
} from '@/types/expense.types';
import { useExpenses } from '@/hooks/useExpense';
import { getPaymentMethodLabel } from '@/services/expenseService';
import { toast } from 'react-hot-toast';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  expense?: Expense | null;
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  responsibles: ExpenseResponsible[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense,
  categories,
  statuses,
  responsibles
}) => {
  const { createExpense, updateExpense, creating, updating } = useExpenses({ autoLoad: false });
  
  // ==================== Form State ====================
  const [formData, setFormData] = useState<CreateExpenseDto>({
    description: '',
    amount: 0,
    category_id: '',
    // 🔥 SUPPRIMÉ: responsible_id - Plus nécessaire car géré automatiquement
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    supplier_name: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');

  const isEditing = !!expense;
  const isLoading = creating || updating;

  // Payment methods
  const paymentMethods = [
    { value: 'cash', label: 'Espèces', icon: '💵' },
    { value: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' },
    { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
    { value: 'check', label: 'Chèque', icon: '📄' },
    { value: 'card', label: 'Carte bancaire', icon: '💳' }
  ];

  // ==================== Effects ====================
  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || 0,
        category_id: expense.category_id || '',
        // 🔥 SUPPRIMÉ: responsible_id - Plus nécessaire
        expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: expense.payment_method || '',
        supplier_name: expense.supplier_name || '',
        notes: expense.notes || ''
      });
    } else if (isOpen) {
      setFormData({
        description: '',
        amount: 0,
        category_id: categories.length > 0 ? categories[0].id : '',
        // 🔥 SUPPRIMÉ: responsible_id - Plus nécessaire
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        supplier_name: '',
        notes: ''
      });
    }
    
    setErrors({});
    setShowNewCategoryForm(false);
    setNewCategoryName('');
  }, [expense, isOpen, categories]);

  // ==================== Validation ====================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'La catégorie est requise';
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'La date est requise';
    }

    const today = new Date();
    const expenseDate = new Date(formData.expense_date);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (expenseDate > tomorrow) {
      newErrors.expense_date = 'La date ne peut pas être dans le futur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== Event Handlers ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // 🔥 CORRECTION: Nettoyer les données sans responsible_id
      const cleanData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        description: formData.description.trim(),
        supplier_name: formData.supplier_name?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        payment_method: formData.payment_method || undefined
        // 🚫 PAS DE responsible_id - Le backend assigne automatiquement l'utilisateur connecté
      };

      console.log('📝 [Form] Données envoyées au backend:', cleanData);

      if (isEditing && expense) {
        const result = await updateExpense(expense.id, cleanData);
        if (result) {
          toast.success('Dépense modifiée avec succès');
          onSuccess?.();
          onClose();
        }
      } else {
        const result = await createExpense(cleanData);
        if (result) {
          toast.success('Dépense créée avec succès - Vous êtes automatiquement assigné comme responsable');
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleInputChange = (field: keyof CreateExpenseDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    toast.success('Fonctionnalité à implémenter: Ajouter une nouvelle catégorie');
    setShowNewCategoryForm(false);
    setNewCategoryName('');
  };

  // ==================== Render ====================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full min-h-[600px] max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="bg-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  {isEditing ? <Save className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {isEditing 
                      ? 'Modifiez les informations de cette dépense'
                      : 'Remplissez les informations - Vous serez automatiquement assigné comme responsable'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 🆕 Information sur le responsable automatique */}
          {!isEditing && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-6 rounded-r-lg">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Responsable automatique
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Vous serez automatiquement assigné comme responsable de cette dépense. 
                    Plus besoin de sélectionner un responsable manuellement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="p-6 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Description de la dépense *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Ex: Achat de fournitures de bureau"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Montant et Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Montant */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Montant (FG) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.amount || ''}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                      FG
                    </div>
                  </div>
                  {errors.amount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Date de dépense *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => handleInputChange('expense_date', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.expense_date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.expense_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.expense_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Catégorie *
                </label>
                <div className="flex gap-3">
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.category_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau
                  </button>
                </div>
                {errors.category_id && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category_id}
                  </p>
                )}

                {/* New Category Form */}
                {showNewCategoryForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Nouvelle catégorie</h4>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nom de la catégorie"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 🔥 SUPPRIMÉ: Section Responsable - Plus nécessaire */}
              {/* Le responsable est maintenant géré automatiquement par le backend */}

              {/* Mode de paiement et Fournisseur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mode de paiement */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Mode de paiement
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                  >
                    <option value="">Sélectionner un mode</option>
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.icon} {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fournisseur */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    Fournisseur / Bénéficiaire
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => handleInputChange('supplier_name', e.target.value)}
                    placeholder="Ex: Société ABC, Jean Dupont..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Notes / Commentaires
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Informations supplémentaires..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditing ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;