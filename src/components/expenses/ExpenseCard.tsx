// src/components/expenses/ExpenseCard.tsx - Carte moderne avec affichage responsable corrigé

import React, { useState } from 'react';
import {
  Calendar,
  User,
  Tag,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Building,
  AlertTriangle,
  Sparkles,
  MapPin,
  Shield
} from 'lucide-react';
import { 
  Expense, 
  ExpenseCategory, 
  ExpenseStatus, 
  ExpenseResponsible 
} from '@/types/expense.types';
import { useExpenses } from '@/hooks/useExpense';
import { formatCurrency, getPaymentMethodLabel } from '@/services/expenseService';
import { toast } from 'react-hot-toast';

interface ExpenseCardProps {
  expense: Expense & {
    // Support pour les données enrichies du backend
    category_name?: string;
    category_color?: string;
    status_name?: string;
    status_color?: string;
    responsible_name?: string;
    responsible_role?: string;
    responsible_badge?: string;
    responsible_badge_color?: string;
    montant_formate?: string;
    is_own_expense?: boolean;
  };
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  responsibles: ExpenseResponsible[];
  onEdit?: (expense: Expense) => void;
  onView?: (expense: Expense) => void;
  userPermissions?: {
    role: string;
    canDelete?: boolean;
  };
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  categories,
  statuses,
  responsibles,
  onEdit,
  onView,
  userPermissions
}) => {
  const { deleteExpense, updateExpenseStatus } = useExpenses({ autoLoad: false });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // ==================== Computed Values ====================
  const category = categories.find(cat => cat.id === expense.category_id) || 
                   categories.find(cat => cat.name === expense.category_name);
  
  const status = statuses.find(stat => stat.id === expense.status_id) || 
                 statuses.find(stat => stat.name === expense.status_name);
  
  const responsible = responsibles.find(resp => resp.id === expense.responsible_id) || 
                     responsibles.find(resp => resp.name === expense.responsible_name);

  // 🔥 AMÉLIORATION: Responsable avec données enrichies du backend
  const responsibleInfo = {
    name: expense.responsible_name || responsible?.name || 'Non assigné',
    role: expense.responsible_role || 'unknown',
    badge: expense.responsible_badge || 'Utilisateur',
    badgeColor: expense.responsible_badge_color || '#6B7280'
  };

  // 🔥 NOUVEAU: Badge court selon le rôle
  const getShortRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'user': return 'User';
      default: return 'User';
    }
  };

  // 🔥 NOUVEAU: Couleur du badge selon le rôle
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 🔥 NOUVEAU: Vérifier si la dépense peut être supprimée
  const canDeleteExpense = () => {
    // Seules les dépenses "En attente" et "Rejeté" peuvent être supprimées
    const statusName = expense.status_name || status?.name || '';
    const canDelete = statusName === 'En attente' || statusName === 'Rejeté';
    const hasPermission = userPermissions?.role === 'super_admin';
    
    return {
      canDelete: canDelete && hasPermission,
      reason: !hasPermission ? 'Seuls les Super Administrateurs peuvent supprimer' :
              statusName === 'Payé' ? 'Dépense payée - suppression interdite' :
              !canDelete ? `Statut "${statusName}" ne permet pas la suppression` : ''
    };
  };

  // Format de date
  const formattedDate = (() => {
    try {
      const date = new Date(expense.expense_date);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  })();

  // Montant formaté
  const formattedAmount = (() => {
    if (expense.montant_formate) {
      return expense.montant_formate;
    }
    if (expense.amount) {
      return formatCurrency(expense.amount);
    }
    return '0 FG';
  })();

  // Mode de paiement avec icônes et couleurs
  const getPaymentMethodDisplay = (paymentMethod?: string) => {
    if (!paymentMethod || !paymentMethod.trim()) return null;
    
    const methods = {
      'cash': { label: 'Espèces', icon: '💵', color: 'bg-green-50 text-green-700 border-green-200' },
      'bank_transfer': { label: 'Virement', icon: '🏦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'mobile_money': { label: 'Mobile Money', icon: '📱', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      'check': { label: 'Chèque', icon: '📄', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      'card': { label: 'Carte', icon: '💳', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    };
    
    return methods[paymentMethod as keyof typeof methods] || 
           { label: paymentMethod, icon: '💳', color: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const paymentMethodInfo = getPaymentMethodDisplay(expense.payment_method);

  // ==================== Event Handlers ====================
  const handleDelete = async () => {
    const { canDelete, reason } = canDeleteExpense();
    
    if (!canDelete) {
      toast.error(reason);
      return;
    }

    const statusName = expense.status_name || status?.name || '';
    let confirmMessage = '';
    
    if (statusName === 'Rejeté') {
      confirmMessage = `Supprimer cette dépense rejetée ?\n\nDescription: ${expense.description}\nMontant: ${formattedAmount}\n\nCette action est irréversible.`;
    } else {
      confirmMessage = `Supprimer cette dépense en attente ?\n\nDescription: ${expense.description}\nMontant: ${formattedAmount}\n\nCette action est irréversible.`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteExpense(expense.id);
      if (success) {
        toast.success('🗑️ Dépense supprimée avec succès');
      }
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      
      let errorMessage = 'Erreur lors de la suppression';
      if (error.message?.includes('Statut') || error.message?.includes('statut')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Payé')) {
        errorMessage = 'Cette dépense a été payée et ne peut plus être supprimée';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    setIsUpdatingStatus(true);
    try {
      const success = await updateExpenseStatus(expense.id, newStatusId);
      if (success) {
        toast.success('✅ Statut mis à jour avec succès');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingStatus(false);
      setShowStatusMenu(false);
    }
  };

  const handleView = () => {
    if (onView) onView(expense);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(expense);
  };

  // ==================== Helper Functions ====================
  const getStatusIcon = (statusName?: string) => {
    const name = (statusName || status?.name || '').toLowerCase();
    
    if (name.includes('payé') || name.includes('paid')) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (name.includes('attente') || name.includes('pending')) {
      return <Clock className="w-4 h-4 text-orange-600" />;
    }
    if (name.includes('rejeté') || name.includes('canceled') || name.includes('rejected')) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (statusName?: string) => {
    const name = (statusName || status?.name || '').toLowerCase();
    
    if (name.includes('payé') || name.includes('paid')) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (name.includes('attente') || name.includes('pending')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (name.includes('rejeté') || name.includes('canceled') || name.includes('rejected')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getCategoryColor = (categoryName?: string) => {
    const name = (categoryName || category?.name || '').toLowerCase();
    
    if (name.includes('transport')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (name.includes('alimentation') || name.includes('food')) return 'bg-green-50 text-green-700 border-green-200';
    if (name.includes('matériel') || name.includes('material')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (name.includes('bureau') || name.includes('office')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (name.includes('formation')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (name.includes('électricité') || name.includes('electricity')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (name.includes('eau') || name.includes('water')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (name.includes('communication')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (name.includes('maintenance')) return 'bg-gray-50 text-gray-700 border-gray-200';
    
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getCategoryGradient = (categoryName?: string) => {
    const name = (categoryName || category?.name || '').toLowerCase();
    
    if (name.includes('transport')) return 'from-blue-500 to-blue-600';
    if (name.includes('alimentation')) return 'from-green-500 to-green-600';
    if (name.includes('matériel')) return 'from-purple-500 to-purple-600';
    if (name.includes('bureau')) return 'from-indigo-500 to-indigo-600';
    if (name.includes('formation')) return 'from-pink-500 to-pink-600';
    if (name.includes('électricité')) return 'from-yellow-500 to-yellow-600';
    if (name.includes('eau')) return 'from-cyan-500 to-cyan-600';
    if (name.includes('communication')) return 'from-emerald-500 to-emerald-600';
    if (name.includes('maintenance')) return 'from-gray-500 to-gray-600';
    
    return 'from-gray-500 to-gray-600';
  };

  const deleteInfo = canDeleteExpense();

  // ==================== Render ====================
  return (
    <div className={`bg-white rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-lg hover:border-gray-300 relative ${
      isDeleting || isUpdatingStatus ? 'opacity-75' : ''
    }`}>
      
      {/* Header compact */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-3">
          {/* Info principale */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar avec initiales ou icône catégorie */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getCategoryGradient(expense.category_name || category?.name)} flex items-center justify-center flex-shrink-0`}>
              <Tag className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate mb-0.5">
                {expense.description || 'Sans description'}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="truncate">{expense.reference || formattedDate}</span>
                {expense.is_own_expense && (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                    Ma dépense
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Age badge */}
          <div className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
            <Calendar className="w-3 h-3" />
            {(() => {
              const days = Math.floor((new Date().getTime() - new Date(expense.expense_date).getTime()) / (1000 * 60 * 60 * 24));
              return days === 0 ? "Aujourd'hui" : `${days}j`;
            })()}
          </div>
        </div>

        {/* Badges statut et catégorie */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border cursor-pointer hover:scale-105 transition-transform ${
                getStatusColor(expense.status_name || status?.name)
              }`}
              disabled={isUpdatingStatus}
            >
              {getStatusIcon(expense.status_name || status?.name)}
              <span className="truncate max-w-16">{(expense.status_name || status?.name || 'Non défini').split(' ')[0]}</span>
            </button>

            {showStatusMenu && (
              <div className="absolute left-0 top-8 z-20 w-40 bg-white rounded-lg shadow-xl border py-1 animate-in slide-in-from-top-2 duration-200">
                {statuses.map(statusOption => (
                  <button
                    key={statusOption.id}
                    onClick={() => handleStatusChange(statusOption.id)}
                    disabled={statusOption.id === status?.id || isUpdatingStatus}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                      statusOption.id === status?.id ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                    }`}
                  >
                    {getStatusIcon(statusOption.name)}
                    {statusOption.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(expense.category_name || category) && (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(expense.category_name || category?.name)}`}>
              {(expense.category_name || category?.name || '').split(' ')[0]}
            </span>
          )}
        </div>

        {/* Montant */}
        <div className="mb-3">
          <p className="text-xl font-bold text-gray-900">
            {formattedAmount}
          </p>
        </div>

        {/* 🔥 CORRECTION: Détails compacts avec responsable mieux formaté */}
        <div className="space-y-2 text-xs text-gray-600 mb-4">
          {/* Responsable avec badge séparé */}
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate font-medium text-gray-900">{responsibleInfo.name}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(responsibleInfo.role)} flex-shrink-0`}>
                {responsibleInfo.role === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                {getShortRoleBadge(responsibleInfo.role)}
              </span>
            </div>
          </div>
          
          {/* Mode de paiement avec style amélioré */}
          {paymentMethodInfo && (
            <div className="flex items-center gap-2">
              <CreditCard className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${paymentMethodInfo.color}`}>
                <span>{paymentMethodInfo.icon}</span>
                <span className="truncate">{paymentMethodInfo.label}</span>
              </span>
            </div>
          )}
          
          {expense.supplier_name && (
            <div className="flex items-center gap-2">
              <Building className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{expense.supplier_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer avec boutons d'actions */}
      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
        <div className="flex justify-center gap-3">
          {onView && (
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
              disabled={isDeleting || isUpdatingStatus}
              title="Voir les détails"
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Voir</span>
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-105"
              disabled={isDeleting || isUpdatingStatus}
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-xs font-medium">Modifier</span>
            </button>
          )}
          
          {/* 🔥 CORRECTION: Bouton suppression avec logique améliorée */}
          {deleteInfo.canDelete ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting || isUpdatingStatus}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                (expense.status_name || status?.name) === 'Rejeté' 
                  ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
              title={(expense.status_name || status?.name) === 'Rejeté' ? 'Supprimer (dépense rejetée)' : 'Supprimer (Super Admin)'}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-medium">Supprimer</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 p-2 text-gray-400 cursor-not-allowed rounded-lg"
              title={deleteInfo.reason}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-medium">Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* Overlay de chargement */}
      {(isDeleting || isUpdatingStatus) && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-xs text-gray-600">
              {isDeleting ? 'Suppression...' : 'Mise à jour...'}
            </span>
          </div>
        </div>
      )}

      {/* Click outside pour fermer le menu statut */}
      {showStatusMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </div>
  );
};

export default ExpenseCard;