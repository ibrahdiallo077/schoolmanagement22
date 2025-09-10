// src/components/ExpenseReceipt.tsx - Composant de Reçu de Validation avec PDF

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Calendar,
  User,
  DollarSign,
  FileText,
  Building,
  CreditCard,
  Tag,
  Download,
  Shield,
  Clock
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseStatus, ExpenseResponsible } from '@/types/expense.types';
import { formatCurrency } from '@/services/expenseService';

interface ExpenseReceiptProps {
  expense: Expense & {
    montant_formate?: string;
    date_formatee?: string;
    date_validation_formatee?: string;
    valide_par?: string;
    categorie_nom?: string;
    statut_nom?: string;
    responsable_nom?: string;
  };
  categories: ExpenseCategory[];
  statuses: ExpenseStatus[];
  responsibles: ExpenseResponsible[];
  showPrintButton?: boolean;
  className?: string;
}

const ExpenseReceipt: React.FC<ExpenseReceiptProps> = ({
  expense,
  categories,
  statuses,
  responsibles,
  showPrintButton = true,
  className = ''
}) => {
  
  // ==================== Computed Values ====================
  const category = categories.find(cat => cat.id === expense.category_id) || 
                   categories.find(cat => cat.name === expense.categorie_nom);
  const status = statuses.find(stat => stat.id === expense.status_id) || 
                 statuses.find(stat => stat.name === expense.statut_nom);
  const responsible = responsibles.find(resp => resp.id === expense.responsible_id) || 
                      responsibles.find(resp => resp.name === expense.responsable_nom);

  const isValidated = status?.name === 'Payé';
  const isRejected = status?.name === 'Rejeté';
  const isPending = status?.name === 'En attente';

  // ==================== Payment Method Display ====================
  const getPaymentMethodDisplay = (paymentMethod?: string) => {
    if (!paymentMethod) return null;
    
    const methods = {
      'cash': { label: 'Espèces', icon: '💵' },
      'bank_transfer': { label: 'Virement bancaire', icon: '🏦' },
      'mobile_money': { label: 'Mobile Money', icon: '📱' },
      'check': { label: 'Chèque', icon: '📄' },
      'card': { label: 'Carte bancaire', icon: '💳' }
    };
    
    return methods[paymentMethod as keyof typeof methods] || 
           { label: paymentMethod, icon: '💳' };
  };

  const paymentMethodInfo = getPaymentMethodDisplay(expense.payment_method);

  // ==================== PDF Generation ====================
  const generatePDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reçu de Dépense - ${expense.reference || expense.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: #f8fafc;
          }
          .receipt {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid ${isValidated ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B'}; 
            padding-bottom: 20px; 
          }
          .title { 
            color: ${isValidated ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B'}; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 8px;
          }
          .subtitle { 
            color: #6B7280; 
            font-size: 16px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 20px 0;
            background: ${isValidated ? '#D1FAE5' : isRejected ? '#FEE2E2' : '#FEF3C7'};
            color: ${isValidated ? '#065F46' : isRejected ? '#991B1B' : '#92400E'};
          }
          .section { 
            margin: 30px 0; 
            background: #F9FAFB;
            border-radius: 8px;
            padding: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 15px;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 8px;
          }
          .field { 
            margin: 12px 0; 
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .label { 
            font-weight: 600; 
            color: #374151; 
            flex: 1;
          }
          .value { 
            color: #1F2937;
            flex: 2;
            text-align: right;
          }
          .amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: ${isValidated ? '#059669' : '#1F2937'}; 
          }
          .validation-section {
            background: ${isValidated ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#FFFBEB'};
            border: 2px solid ${isValidated ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B'};
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
          }
          .validation-title {
            font-size: 18px;
            font-weight: bold;
            color: ${isValidated ? '#065F46' : isRejected ? '#991B1B' : '#92400E'};
            margin-bottom: 10px;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #6B7280; 
            font-size: 12px; 
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            font-weight: bold;
            color: ${isValidated ? 'rgba(16, 185, 129, 0.05)' : isRejected ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)'};
            z-index: -1;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="watermark">${isValidated ? 'VALIDÉ' : isRejected ? 'REJETÉ' : 'EN ATTENTE'}</div>
        
        <div class="receipt">
          <div class="header">
            <div class="title">
              ${isValidated ? '✅ REÇU DE DÉPENSE VALIDÉE' : isRejected ? '❌ DÉPENSE REJETÉE' : '⏳ DÉPENSE EN ATTENTE'}
            </div>
            <div class="subtitle">Référence: ${expense.reference || expense.id}</div>
            <div class="status-badge">
              ${status?.name || 'Statut inconnu'}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">📋 Informations Générales</div>
            <div class="field">
              <span class="label">Description:</span>
              <span class="value">${expense.description || 'Non spécifiée'}</span>
            </div>
            <div class="field">
              <span class="label">Montant:</span>
              <span class="value amount">${expense.montant_formate || formatCurrency(expense.amount)}</span>
            </div>
            <div class="field">
              <span class="label">Date de la dépense:</span>
              <span class="value">${expense.date_formatee || new Date(expense.expense_date).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🏷️ Classification</div>
            <div class="field">
              <span class="label">Catégorie:</span>
              <span class="value">${category?.name || expense.categorie_nom || 'Non définie'}</span>
            </div>
            <div class="field">
              <span class="label">Responsable:</span>
              <span class="value">${responsible?.name || expense.responsable_nom || 'Non assigné'}</span>
            </div>
            ${expense.supplier_name ? `
            <div class="field">
              <span class="label">Fournisseur:</span>
              <span class="value">${expense.supplier_name}</span>
            </div>
            ` : ''}
          </div>

          ${paymentMethodInfo ? `
          <div class="section">
            <div class="section-title">💳 Paiement</div>
            <div class="field">
              <span class="label">Mode de paiement:</span>
              <span class="value">${paymentMethodInfo.icon} ${paymentMethodInfo.label}</span>
            </div>
          </div>
          ` : ''}

          ${isValidated || isRejected ? `
          <div class="validation-section">
            <div class="validation-title">
              ${isValidated ? '✅ Validation et Paiement' : '❌ Rejet de la Dépense'}
            </div>
            <div class="field">
              <span class="label">${isValidated ? 'Validé' : 'Rejeté'} par:</span>
              <span class="value">${expense.valide_par || 'Système'}</span>
            </div>
            <div class="field">
              <span class="label">Date de ${isValidated ? 'validation' : 'rejet'}:</span>
              <span class="value">${expense.date_validation_formatee || new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            ${isValidated ? `
            <div class="field">
              <span class="label">Impact sur le capital:</span>
              <span class="value amount">-${expense.montant_formate || formatCurrency(expense.amount)}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${expense.notes ? `
          <div class="section">
            <div class="section-title">📝 Notes</div>
            <div style="color: #374151; line-height: 1.6;">${expense.notes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div>Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div style="margin-top: 8px;">Système de Gestion des Dépenses - École Moderne</div>
            ${isValidated ? '<div style="margin-top: 8px; font-weight: bold; color: #059669;">⚡ Ce montant a été déduit du capital disponible</div>' : ''}
            ${isRejected ? '<div style="margin-top: 8px; font-weight: bold; color: #DC2626;">❌ Cette dépense n\'impacte pas le capital</div>' : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        // Optionnel: fermer la fenêtre après impression
        // printWindow.close();
      }, 500);
    }
  };

  // ==================== Render ====================
  return (
    <div className={`bg-white rounded-2xl shadow-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6 pb-6 border-b-2 border-gray-200">
        <div className="flex items-center justify-center gap-3 mb-4">
          {isValidated && <CheckCircle className="w-8 h-8 text-green-600" />}
          {isRejected && <XCircle className="w-8 h-8 text-red-600" />}
          {isPending && <Clock className="w-8 h-8 text-orange-600" />}
          
          <h2 className={`text-2xl font-bold ${
            isValidated ? 'text-green-600' : 
            isRejected ? 'text-red-600' : 
            'text-orange-600'
          }`}>
            {isValidated ? 'Reçu de Dépense Validée' : 
             isRejected ? 'Dépense Rejetée' : 
             'Dépense en Attente'}
          </h2>
        </div>
        
        <p className="text-gray-600 mb-3">
          Référence: <span className="font-mono font-semibold">{expense.reference || expense.id}</span>
        </p>
        
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          isValidated ? 'bg-green-100 text-green-800 border border-green-300' :
          isRejected ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-orange-100 text-orange-800 border border-orange-300'
        }`}>
          {status?.name || 'Statut inconnu'}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {expense.description || 'Sans description'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Montant</label>
            <p className={`text-3xl font-bold mt-1 ${
              isValidated ? 'text-green-600' : 'text-gray-900'
            }`}>
              {expense.montant_formate || formatCurrency(expense.amount)}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Date de la dépense</label>
            <p className="text-lg text-gray-900 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {expense.date_formatee || new Date(expense.expense_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {category && (
            <div>
              <label className="text-sm font-medium text-gray-500">Catégorie</label>
              <div className="mt-1 flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-lg text-gray-900">{category.name}</span>
              </div>
            </div>
          )}
          
          {(responsible || expense.responsable_nom) && (
            <div>
              <label className="text-sm font-medium text-gray-500">Responsable</label>
              <div className="mt-1 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-lg text-gray-900">
                  {responsible?.name || expense.responsable_nom}
                </span>
              </div>
            </div>
          )}
          
          {expense.supplier_name && (
            <div>
              <label className="text-sm font-medium text-gray-500">Fournisseur</label>
              <div className="mt-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-lg text-gray-900">{expense.supplier_name}</span>
              </div>
            </div>
          )}
          
          {paymentMethodInfo && (
            <div>
              <label className="text-sm font-medium text-gray-500">Mode de paiement</label>
              <div className="mt-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-lg text-gray-900">
                  {paymentMethodInfo.icon} {paymentMethodInfo.label}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Info */}
      {(isValidated || isRejected) && (
        <div className={`rounded-xl p-6 mb-6 border-2 ${
          isValidated ? 'bg-green-50 border-green-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${
              isValidated ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Shield className={`w-5 h-5 ${
                isValidated ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              isValidated ? 'text-green-800' : 'text-red-800'
            }`}>
              {isValidated ? 'Validation et Paiement' : 'Rejet de la Dépense'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">
                {isValidated ? 'Validé' : 'Rejeté'} par:
              </span>
              <p className="mt-1 font-semibold">{expense.valide_par || 'Système'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">
                Date de {isValidated ? 'validation' : 'rejet'}:
              </span>
              <p className="mt-1 font-semibold">
                {expense.date_validation_formatee || new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          {isValidated && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium text-sm">
                ⚡ Impact sur le capital: <span className="font-bold">-{expense.montant_formate || formatCurrency(expense.amount)}</span>
              </p>
            </div>
          )}
          
          {isRejected && (
            <div className="mt-4 p-3 bg-red-100 rounded-lg">
              <p className="text-red-800 font-medium text-sm">
                ❌ Cette dépense n'impacte pas le capital disponible
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {expense.notes && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500 mb-2 block">Notes</label>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-gray-900 whitespace-pre-wrap">{expense.notes}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showPrintButton && (
        <div className="flex justify-center pt-6 border-t border-gray-200">
          <button
            onClick={generatePDF}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            Télécharger le Reçu PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseReceipt;