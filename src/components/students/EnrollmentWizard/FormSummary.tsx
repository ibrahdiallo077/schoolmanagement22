// src/components/students/EnrollmentWizard/FormSummary.tsx
import React from 'react';
import { CheckCircle, User, BookOpen, Users, CreditCard, Save } from 'lucide-react';
import { SectionProps } from './types';

const FormSummary: React.FC<SectionProps> = ({ 
  formData, 
  updateFormData, 
  errors 
}) => {
  const formatGNF = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount).replace('GNF', 'GNF');
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.birth_date);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Récapitulatif de l'inscription</h2>
          <p className="text-gray-600">Vérifiez les informations avant finalisation</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations personnelles */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Nom complet:</span>
              <span className="ml-2 font-medium">{formData.first_name} {formData.last_name}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Âge:</span>
              <span className="ml-2">{age ? `${age} ans` : '-'}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Genre:</span>
              <span className="ml-2">{formData.gender === 'M' ? '👨 Masculin' : '👩 Féminin'}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Statut:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                formData.status === 'interne' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {formData.status === 'interne' ? '🏠 Interne' : '🚶 Externe'}
              </span>
            </div>
            {formData.is_orphan && (
              <div className="md:col-span-2">
                <span className="text-orange-600 font-medium">💔 Orphelin(e)</span>
              </div>
            )}
          </div>
        </div>

        {/* Scolarité */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Scolarité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-emerald-600 font-medium">Niveau coranique:</span>
              <span className="ml-2">{formData.coranic_class_id || 'Non spécifié'}</span>
            </div>
            <div>
              <span className="text-emerald-600 font-medium">Classe française:</span>
              <span className="ml-2">{formData.french_class_id || 'Non spécifié'}</span>
            </div>
            {formData.french_school_name && (
              <div className="md:col-span-2">
                <span className="text-emerald-600 font-medium">École française:</span>
                <span className="ml-2">{formData.french_school_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tuteur */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tuteur principal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-purple-600 font-medium">Nom:</span>
              <span className="ml-2 font-medium">
                {formData.guardian.first_name} {formData.guardian.last_name}
              </span>
            </div>
            <div>
              <span className="text-purple-600 font-medium">Téléphone:</span>
              <span className="ml-2">{formData.guardian.phone}</span>
            </div>
            {formData.guardian.email && (
              <div>
                <span className="text-purple-600 font-medium">Email:</span>
                <span className="ml-2">{formData.guardian.email}</span>
              </div>
            )}
            <div>
              <span className="text-purple-600 font-medium">Parenté:</span>
              <span className="ml-2">{formData.guardian.relationship_type || formData.guardian.relationship}</span>
            </div>
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Paiement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-orange-600 font-medium">Montant:</span>
              <span className="ml-2 font-bold text-lg">
                {formatGNF(formData.payment?.amount || 0)}
              </span>
            </div>
            <div>
              <span className="text-orange-600 font-medium">Fréquence:</span>
              <span className="ml-2">{formData.payment?.frequency}</span>
            </div>
            <div>
              <span className="text-orange-600 font-medium">Méthode:</span>
              <span className="ml-2">{formData.payment?.payment_method}</span>
            </div>
            {formData.payment?.enrollment_date && (
              <div>
                <span className="text-orange-600 font-medium">Date inscription:</span>
                <span className="ml-2">{formData.payment?.enrollment_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {formData.notes && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Notes</h3>
            <p className="text-sm text-gray-700">{formData.notes}</p>
          </div>
        )}

        {/* Confirmation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Prêt pour l'inscription !
            </h3>
            <p className="text-green-700 mb-4">
              Toutes les informations sont complètes. Cliquez sur "Finaliser" pour confirmer l'inscription.
            </p>
            <button
              type="submit"
              className="flex items-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
            >
              <Save className="w-5 h-5" />
              Finaliser l'inscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSummary;