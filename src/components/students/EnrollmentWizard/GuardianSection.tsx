// src/components/students/EnrollmentWizard/GuardianSection.tsx
import React from 'react';
import { Users, Phone, Mail, MapPin, AlertTriangle, Heart, UserCheck } from 'lucide-react';

interface GuardianSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  errors: any;
  relationshipTypes: Array<{ value: string; label: string; icon: string }>;
}

const GuardianSection: React.FC<GuardianSectionProps> = ({ 
  formData, 
  updateFormData, 
  errors, 
  relationshipTypes 
}) => {
  const emergencyContactTypes = [
    { id: 'same', label: 'Même personne que le tuteur principal', icon: '👤' },
    { id: 'different', label: 'Contact d\'urgence différent', icon: '🚨' }
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tuteur & Contacts</h2>
          <p className="text-gray-600">Responsable légal et contacts d'urgence</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Tuteur Principal */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Tuteur Principal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom du tuteur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.guardian.first_name}
                onChange={(e) => updateFormData('guardian.first_name', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors['guardian.first_name'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Prénom"
              />
              {errors['guardian.first_name'] && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors['guardian.first_name']}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du tuteur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.guardian.last_name}
                onChange={(e) => updateFormData('guardian.last_name', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors['guardian.last_name'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Nom"
              />
              {errors['guardian.last_name'] && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors['guardian.last_name']}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lien de parenté <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {relationshipTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('guardian.relationship_type', type.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      formData.guardian.relationship_type === type.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.guardian.relationship_type === 'autre' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Précisez la parenté <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.guardian.custom_relationship}
                  onChange={(e) => updateFormData('guardian.custom_relationship', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors['guardian.custom_relationship'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: cousin, voisin, ami de famille..."
                />
                {errors['guardian.custom_relationship'] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors['guardian.custom_relationship']}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone (Guinée) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.guardian.phone}
                  onChange={(e) => updateFormData('guardian.phone', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors['guardian.phone'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="623 45 67 89"
                />
              </div>
              {errors['guardian.phone'] && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors['guardian.phone']}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optionnel)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.guardian.email}
                  onChange={(e) => updateFormData('guardian.email', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors['guardian.email'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="email@exemple.com"
                />
              </div>
              {errors['guardian.email'] && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors['guardian.email']}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète (optionnel)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.guardian.address}
                  onChange={(e) => updateFormData('guardian.address', e.target.value)}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Quartier, commune, ville, région..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact d'urgence */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🚨</span>
            Contact d'Urgence
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emergencyContactTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateFormData('emergency_contact_type', type.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                    formData.emergency_contact_type === type.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                      : 'border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  {type.label}
                </button>
              ))}
            </div>

            {formData.emergency_contact_type === 'different' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-white rounded-xl border border-orange-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name || ''}
                    onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nom et prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone d'urgence
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone || ''}
                    onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Numéro d'urgence"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relation avec l'étudiant
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_relationship || ''}
                    onChange={(e) => updateFormData('emergency_contact_relationship', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: Grand-mère, ami de famille..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
            <p className="text-sm text-orange-800 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Ce contact sera sollicité uniquement en cas d'urgence médicale ou de problème grave.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianSection;