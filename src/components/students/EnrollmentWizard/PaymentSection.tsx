// src/components/students/EnrollmentWizard/PaymentSection.tsx
import React from 'react';
import { 
  CreditCard, 
  Calendar,
  Camera,
  Upload,
  X,
  AlertTriangle
} from 'lucide-react';
import { SectionProps } from './types';

interface PaymentSectionProps extends SectionProps {
  formatGNF: (amount: number) => string;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ 
  formData, 
  updateFormData, 
  errors,
  formatGNF 
}) => {
  // Gestion de l'upload de photo
  const handlePhotoUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        // Gérer l'erreur de taille
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        updateFormData('profile_photo', file);
        updateFormData('photo_preview', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateFormData('profile_photo', null);
    updateFormData('photo_preview', '');
  };

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paiement d'Inscription</h2>
          <p className="text-gray-600">Frais en Francs Guinéens (GNF)</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Upload de photo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo de l'étudiant (optionnel)
          </h3>
          
          <div className="flex flex-col items-center">
            {formData.photo_preview ? (
              <div className="relative mb-4">
                <img
                  src={formData.photo_preview}
                  alt="Photo de l'étudiant"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-blue-300 rounded-full flex items-center justify-center mb-4 bg-blue-50">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
            >
              <Upload className="w-4 h-4" />
              {formData.photo_preview ? 'Changer la photo' : 'Ajouter une photo'}
            </label>
            <p className="text-xs text-blue-600 mt-2">JPG, PNG • Max 5MB</p>
          </div>
        </div>

        {/* Formulaire de paiement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (GNF) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.payment?.amount || ''}
                onChange={(e) => updateFormData('payment.amount', parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-3 text-right border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none ${
                  errors['payment.amount'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                style={{
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                  margin: 0
                }}
                placeholder="50000"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                GNF
              </span>
            </div>
            {errors['payment.amount'] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors['payment.amount']}
              </p>
            )}
          </div>

          {/* Fréquence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence
            </label>
            <div className="relative">
              <select
                value={formData.payment?.frequency || 'annuel'}
                onChange={(e) => updateFormData('payment.frequency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="annuel">📅 Annuel</option>
                <option value="trimestriel">📅 Trimestriel</option>
                <option value="mensuel">📅 Mensuel</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode
            </label>
            <div className="relative">
              <select
                value={formData.payment?.payment_method || 'cash'}
                onChange={(e) => updateFormData('payment.payment_method', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="cash">💵 Espèces</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="bank_transfer">🏦 Virement bancaire</option>
                <option value="check">📄 Chèque</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Date d'inscription */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date inscription
            </label>
            <input
              type="date"
              value={formData.payment?.enrollment_date || ''}
              onChange={(e) => updateFormData('payment.enrollment_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.payment?.notes || ''}
            onChange={(e) => updateFormData('payment.notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            placeholder="Commentaires sur le paiement..."
          />
        </div>

        {/* Récapitulatif */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-600">⚠️</span>
            <h4 className="text-sm font-semibold text-orange-800">Récapitulatif</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-orange-600">Montant:</span>
              <span className="font-medium ml-2">
                {formData.payment?.amount ? formatGNF(formData.payment.amount) : '0 FG'}
              </span>
            </div>
            <div>
              <span className="text-orange-600">Fréquence:</span>
              <span className="font-medium ml-2">{formData.payment?.frequency || 'annuel'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;