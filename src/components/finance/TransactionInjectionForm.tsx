// src/components/finance/TransactionInjectionForm.tsx - Version Corrigée et Adaptée
import React, { useState, useEffect } from 'react';
import { 
  X, Save, Plus, Minus, DollarSign, Calendar, FileText, User, 
  CreditCard, AlertCircle, CheckCircle, Eye, Calculator,
  TrendingUp, TrendingDown, Banknote, Building2, Smartphone,
  Receipt, CreditCard as CardIcon, Gift, TrendingUp as Investment,
  Zap, Package, BookOpen, Wrench, Car
} from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';

// ================================================================
// 🎯 TYPES POUR LE FORMULAIRE
// ================================================================

export interface TransactionInjectionData {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category?: string;
  description: string;
  entity_name?: string;
  transaction_date?: string;
  payment_method?: string;
  notes?: string;
  impact_capital?: boolean;
}

interface TransactionInjectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'INCOME' | 'EXPENSE';
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

// ================================================================
// 🎨 CONFIGURATION DES CATÉGORIES
// ================================================================

const INCOME_CATEGORIES = [
  { 
    id: 'frais_scolarite', 
    name: 'Frais de Scolarité', 
    icon: BookOpen, 
    emoji: '🎓',
    description: 'Paiements écolage étudiant',
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  { 
    id: 'frais_inscription', 
    name: 'Frais d\'Inscription', 
    icon: User, 
    emoji: '📝',
    description: 'Nouveaux étudiants',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  { 
    id: 'subventions', 
    name: 'Subventions & Donations', 
    icon: Gift, 
    emoji: '🎁',
    description: 'Aides extérieures',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  { 
    id: 'services_annexes', 
    name: 'Services Annexes', 
    icon: Package, 
    emoji: '📦',
    description: 'Cantines, transport, etc.',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  { 
    id: 'capital_initial', 
    name: 'Capital Initial', 
    icon: Investment, 
    emoji: '💰',
    description: 'Mise de fonds initiale',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  { 
    id: 'autres_revenus', 
    name: 'Autres Revenus', 
    icon: TrendingUp, 
    emoji: '📈',
    description: 'Revenus divers',
    color: 'bg-violet-50 text-violet-700 border-violet-200'
  }
];

const EXPENSE_CATEGORIES = [
  { 
    id: 'salaires_personnel', 
    name: 'Salaires Personnel', 
    icon: User, 
    emoji: '👥',
    description: 'Rémunération équipe',
    color: 'bg-red-50 text-red-700 border-red-200'
  },
  { 
    id: 'charges_fixes', 
    name: 'Charges Fixes', 
    icon: Zap, 
    emoji: '⚡',
    description: 'Électricité, eau, internet',
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  { 
    id: 'fournitures_pedagogiques', 
    name: 'Fournitures Pédagogiques', 
    icon: BookOpen, 
    emoji: '📚',
    description: 'Livres, matériel didactique',
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  { 
    id: 'maintenance', 
    name: 'Maintenance & Réparations', 
    icon: Wrench, 
    emoji: '🔧',
    description: 'Entretien bâtiments',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  { 
    id: 'transport', 
    name: 'Transport', 
    icon: Car, 
    emoji: '🚗',
    description: 'Déplacements, carburant',
    color: 'bg-lime-50 text-lime-700 border-lime-200'
  },
  { 
    id: 'autres_depenses', 
    name: 'Autres Dépenses', 
    icon: Package, 
    emoji: '📦',
    description: 'Dépenses diverses',
    color: 'bg-pink-50 text-pink-700 border-pink-200'
  }
];

// Méthodes de paiement avec icônes
const PAYMENT_METHODS = [
  { 
    id: 'cash', 
    name: 'Espèces', 
    icon: Banknote, 
    emoji: '💵',
    description: 'Paiement en liquide',
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  { 
    id: 'bank_transfer', 
    name: 'Virement bancaire', 
    icon: Building2, 
    emoji: '🏦',
    description: 'Transfert bancaire',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  { 
    id: 'mobile_money', 
    name: 'Mobile Money', 
    icon: Smartphone, 
    emoji: '📱',
    description: 'Orange Money, MTN, Moov',
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  { 
    id: 'check', 
    name: 'Chèque', 
    icon: Receipt, 
    emoji: '📄',
    description: 'Paiement par chèque',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  { 
    id: 'card', 
    name: 'Carte bancaire', 
    icon: CardIcon, 
    emoji: '💳',
    description: 'Visa, Mastercard',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  { 
    id: 'donation', 
    name: 'Donation', 
    icon: Gift, 
    emoji: '🎁',
    description: 'Don ou subvention',
    color: 'bg-pink-50 text-pink-700 border-pink-200'
  },
  { 
    id: 'investment', 
    name: 'Investissement', 
    icon: Investment, 
    emoji: '📈',
    description: 'Retour sur investissement',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
];

// ================================================================
// 🎯 COMPOSANT PRINCIPAL
// ================================================================

const TransactionInjectionForm: React.FC<TransactionInjectionFormProps> = ({
  isOpen,
  onClose,
  initialType = 'INCOME',
  onSuccess,
  onError
}) => {
  const {
    injectTransaction,
    isInjecting,
    currentBalance,
    formattedBalance,
    refreshAll
  } = useFinance();

  // Fonction formatGNF locale pour gérer les gros montants
  const formatGNFLocal = (amount: number): string => {
    const num = Number(amount || 0);
    if (isNaN(num)) return '0 FG';
    
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(1)}T FG`;
    } else if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B FG`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M FG`;
    } else if (num >= 100000) {
      return `${(num / 1000).toFixed(0)}K FG`;
    } else {
      return `${num.toLocaleString('en-US')} FG`;
    }
  };

  // 📋 État du formulaire
  const [formData, setFormData] = useState({
    type: initialType,
    amount: '',
    category: '',
    description: '',
    entity_name: '',
    payment_method: 'cash',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
    impact_capital: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // 🔄 Réinitialiser le formulaire quand le type initial change
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        type: initialType,
        category: '' // Reset category when type changes
      }));
      setErrors({});
    }
  }, [initialType, isOpen]);

  // ✅ Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du montant
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Le montant doit être positif';
    } else if (amount > 100000000) {
      newErrors.amount = 'Montant trop élevé (max: 100M FG)';
    }

    // Validation de la description
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      newErrors.description = 'Description requise (minimum 5 caractères)';
    }

    // Validation de l'entité (optionnelle mais si fournie, minimum 2 caractères)
    if (formData.entity_name.trim().length > 0 && formData.entity_name.trim().length < 2) {
      newErrors.entity_name = 'Nom trop court (minimum 2 caractères)';
    }

    // Validation de la date
    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Date requise';
    }

    // Validation de la catégorie
    if (!formData.category) {
      newErrors.category = 'Catégorie requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 📝 Mise à jour des champs
  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 💰 Calcul de l'impact sur le capital
  const calculateNewBalance = (): number => {
    const amount = parseFloat(formData.amount) || 0;
    return formData.type === 'INCOME' ? currentBalance + amount : currentBalance - amount;
  };

  // 📤 Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const transactionData: TransactionInjectionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        entity_name: formData.entity_name.trim() || 'Manuel',
        payment_method: formData.payment_method,
        notes: formData.notes.trim(),
        transaction_date: formData.transaction_date,
        impact_capital: formData.impact_capital
      };

      console.log('🚀 Envoi de la transaction:', transactionData);

      const response = await injectTransaction(transactionData);
      
      console.log('✅ Réponse du serveur:', response);
      
      // ✅ Succès
      if (onSuccess) {
        onSuccess(response);
      }
      
      // 🔄 Réinitialiser le formulaire
      resetForm();
      onClose();
      
      // Rafraîchir les données après un délai
      setTimeout(() => {
        refreshAll(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur injection:', error);
      
      if (onError) {
        onError(error);
      }
      
      // Afficher l'erreur dans le formulaire
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Erreur lors de l\'injection'
      }));
    }
  };

  // 🔄 Réinitialisation du formulaire
  const resetForm = () => {
    setFormData({
      type: 'INCOME',
      amount: '',
      category: '',
      description: '',
      entity_name: '',
      payment_method: 'cash',
      notes: '',
      transaction_date: new Date().toISOString().split('T')[0],
      impact_capital: true
    });
    setErrors({});
    setShowPreview(false);
  };

  // 🚪 Fermeture du modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // 🎨 Données calculées pour l'affichage
  const categories = formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCategory = categories.find(c => c.id === formData.category);
  const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.id === formData.payment_method);
  const newBalance = calculateNewBalance();
  const isNegativeResult = newBalance < 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* 📋 Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                {formData.type === 'INCOME' ? (
                  <Plus className="w-8 h-8 text-green-600 mr-3" />
                ) : (
                  <Minus className="w-8 h-8 text-red-600 mr-3" />
                )}
                {formData.type === 'INCOME' ? 'Ajouter de l\'Argent' : 'Retirer de l\'Argent'}
              </h2>
              <p className="text-gray-600 mt-2">
                {formData.type === 'INCOME' 
                  ? '💰 Augmenter le capital de l\'école (entrée positive)' 
                  : '💸 Diminuer le capital de l\'école (sortie négative)'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          {/* 💡 Indicateur du capital actuel */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Capital actuel de l'école :</span>
              </div>
              <span className={`text-xl font-bold ${currentBalance >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                {formattedBalance}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 📝 Colonne principale - Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* 📘 Sélection du type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type d'opération *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => updateField('type', 'INCOME')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      formData.type === 'INCOME'
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                    }`}
                  >
                    <Plus className="w-12 h-12 mx-auto mb-3" />
                    <div className="font-bold text-lg">ENTRÉE D'ARGENT</div>
                    <p className="text-sm opacity-80 mt-1">➕ Augmente le capital</p>
                    <p className="text-xs opacity-60 mt-2">Donations, subventions, revenus</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => updateField('type', 'EXPENSE')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      formData.type === 'EXPENSE'
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-25'
                    }`}
                  >
                    <Minus className="w-12 h-12 mx-auto mb-3" />
                    <div className="font-bold text-lg">SORTIE D'ARGENT</div>
                    <p className="text-sm opacity-80 mt-1">➖ Diminue le capital</p>
                    <p className="text-xs opacity-60 mt-2">Dépenses, retraits, achats</p>
                  </button>
                </div>
              </div>

              {/* 🏷️ Sélection de la catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Package className="w-4 h-4 inline mr-1" />
                  Catégorie *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => updateField('category', category.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        formData.category === category.id
                          ? `${category.color} shadow-md scale-105`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <category.icon className="w-5 h-5 mr-2" />
                        <span className="text-lg">{category.emoji}</span>
                      </div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <p className="text-xs opacity-80 mt-1">{category.description}</p>
                    </button>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 💵 Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Montant (Francs Guinéens) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.amount}
                      onChange={(e) => updateField('amount', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-lg font-medium ${
                        errors.amount 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="Ex: 1000000"
                    />
                    {formData.amount && !errors.amount && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.amount && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.amount}
                    </p>
                  )}
                  {formData.amount && !errors.amount && (
                    <p className="text-gray-500 text-sm mt-1">
                      💰 {formatGNFLocal(parseFloat(formData.amount) || 0)}
                    </p>
                  )}
                </div>

                {/* 📅 Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date de la transaction *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => updateField('transaction_date', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                      errors.transaction_date 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.transaction_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.transaction_date}</p>
                  )}
                </div>
              </div>

              {/* 📝 Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description de la transaction *
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                    errors.description 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                  placeholder={
                    formData.type === 'INCOME' 
                      ? 'Ex: Donation de la fondation XYZ' 
                      : 'Ex: Achat équipement informatique'
                  }
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 👤 Entité/Personne */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Par qui / Entité
                  </label>
                  <input
                    type="text"
                    value={formData.entity_name}
                    onChange={(e) => updateField('entity_name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${
                      errors.entity_name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                    placeholder={
                      formData.type === 'INCOME'
                        ? 'Nom du donateur ou organisation'
                        : 'Bénéficiaire ou fournisseur'
                    }
                  />
                  {errors.entity_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.entity_name}</p>
                  )}
                </div>

                {/* 💳 Méthode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Méthode de paiement
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => updateField('payment_method', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.emoji} {method.name}
                      </option>
                    ))}
                  </select>
                  {selectedPaymentMethod && (
                    <p className="text-gray-500 text-sm mt-1">
                      {selectedPaymentMethod.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 📝 Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Notes supplémentaires
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Informations complémentaires, contexte, référence..."
                />
              </div>

              {/* ⚙️ Impact sur le capital */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="impact_capital"
                  checked={formData.impact_capital}
                  onChange={(e) => updateField('impact_capital', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="impact_capital" className="text-sm font-medium text-gray-700">
                  ⚡ Impact sur le capital de l'école
                </label>
              </div>

              {/* ❌ Erreur de soumission */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.submit}
                  </p>
                </div>
              )}
            </div>

            {/* 📊 Colonne latérale - Aperçu */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* 💡 Aperçu de l'impact */}
                {formData.amount && !errors.amount && formData.impact_capital && (
                  <div className={`p-6 rounded-xl border-2 ${
                    formData.type === 'INCOME' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Impact sur le Capital
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Capital actuel :</span>
                        <span className={`font-medium ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formattedBalance}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">
                          {formData.type === 'INCOME' ? 'Ajout' : 'Retrait'} :
                        </span>
                        <span className={`font-medium ${
                          formData.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formData.type === 'INCOME' ? '+' : '-'}{formatGNFLocal(parseFloat(formData.amount) || 0)}
                        </span>
                      </div>
                      
                      <hr className="border-gray-300" />
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-900">Nouveau capital :</span>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            isNegativeResult ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatGNFLocal(newBalance)}
                          </span>
                          {isNegativeResult && (
                            <p className="text-xs text-red-500 mt-1">⚠️ Capital négatif</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 📈 Graphique visuel simple */}
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Évolution :</span>
                        {formData.type === 'INCOME' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            formData.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.abs((parseFloat(formData.amount) || 0) / 10000000) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🏷️ Catégorie sélectionnée */}
                {selectedCategory && (
                  <div className={`p-4 rounded-xl border ${selectedCategory.color}`}>
                    <div className="flex items-center space-x-3">
                      <selectedCategory.icon className="w-6 h-6" />
                      <div>
                        <p className="font-medium">
                          {selectedCategory.emoji} {selectedCategory.name}
                        </p>
                        <p className="text-sm opacity-80">{selectedCategory.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 💳 Méthode de paiement sélectionnée */}
                {selectedPaymentMethod && (
                  <div className={`p-4 rounded-xl border ${selectedPaymentMethod.color}`}>
                    <div className="flex items-center space-x-3">
                      <selectedPaymentMethod.icon className="w-6 h-6" />
                      <div>
                        <p className="font-medium">
                          {selectedPaymentMethod.emoji} {selectedPaymentMethod.name}
                        </p>
                        <p className="text-sm opacity-80">{selectedPaymentMethod.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ Bouton de soumission */}
                <button
                  type="submit"
                  disabled={isInjecting || Object.keys(errors).length > 0 || !formData.amount || !formData.description || !formData.category}
                  className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                    formData.type === 'INCOME'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } ${(isInjecting || Object.keys(errors).length > 0 || !formData.amount || !formData.description || !formData.category) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {isInjecting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>
                        {formData.type === 'INCOME' ? '💰 Ajouter l\'Argent' : '💸 Retirer l\'Argent'}
                      </span>
                    </>
                  )}
                </button>

                {/* 🚪 Bouton d'annulation */}
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isInjecting}
                  className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                  Annuler
                </button>

                {/* 📊 Récapitulatif transaction */}
                {formData.amount && formData.description && formData.category && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Récapitulatif
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className={`font-medium ${
                          formData.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formData.type === 'INCOME' ? '📈 Entrée' : '📉 Sortie'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Catégorie:</span>
                        <span className="font-medium text-gray-900">
                          {selectedCategory?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant:</span>
                        <span className="font-bold text-gray-900">
                          {formatGNFLocal(parseFloat(formData.amount) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(formData.transaction_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {formData.entity_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Entité:</span>
                          <span className="font-medium text-gray-900">
                            {formData.entity_name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Impact capital:</span>
                        <span className={`font-medium ${
                          formData.impact_capital ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {formData.impact_capital ? '✅ Oui' : '❌ Non'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 💡 Conseils contextuels */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                    💡 Conseil
                  </h5>
                  <p className="text-sm text-blue-800">
                    {formData.type === 'INCOME' 
                      ? "Assurez-vous que tous les revenus sont correctement catégorisés pour un suivi optimal des performances financières de l'école."
                      : "Vérifiez que cette dépense est nécessaire et conforme au budget prévu pour maintenir l'équilibre financier."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionInjectionForm;