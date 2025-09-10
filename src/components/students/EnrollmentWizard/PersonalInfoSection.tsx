// src/components/students/EnrollmentWizard/PersonalInfoSection.tsx
import React from 'react';
import { User, Calendar, AlertTriangle, Users, Home } from 'lucide-react';
import { SectionProps } from './types';

const PersonalInfoSection: React.FC<SectionProps> = ({ 
  formData, 
  updateFormData, 
  errors 
}) => {
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
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informations personnelles</h2>
          <p className="text-gray-600">Identité et situation de l'étudiant</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Nom et Prénom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => updateFormData('first_name', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Prénom de l'étudiant"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.first_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => updateFormData('last_name', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Nom de famille"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.last_name}
              </p>
            )}
          </div>
        </div>

        {/* Date de naissance et Genre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de naissance <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => updateFormData('birth_date', e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.birth_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {age > 0 && (
              <p className="mt-1 text-sm text-blue-600">📅 Âge: {age} ans</p>
            )}
            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.birth_date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateFormData('gender', 'M')}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                  formData.gender === 'M'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                👨 Masculin
              </button>
              <button
                type="button"
                onClick={() => updateFormData('gender', 'F')}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                  formData.gender === 'F'
                    ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md'
                    : 'border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                }`}
              >
                👩 Féminin
              </button>
            </div>
          </div>
        </div>

        {/* Statut et situation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Statut de l'étudiant
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => updateFormData('status', 'externe')}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  formData.status === 'externe'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Externe</div>
                    <div className="text-sm text-gray-600">Cours uniquement</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData('status', 'interne')}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  formData.status === 'interne'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Interne</div>
                    <div className="text-sm text-gray-600">Cours + hébergement</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Situation familiale
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_orphan}
                  onChange={(e) => updateFormData('is_orphan', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-xl">💔</span>
                <span className="text-sm font-medium text-gray-700">Orphelin(e)</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_needy || false}
                  onChange={(e) => updateFormData('is_needy', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-xl">🤲</span>
                <span className="text-sm font-medium text-gray-700">Famille nécessiteuse</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes personnelles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes personnelles (optionnel)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => updateFormData('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Allergies, besoins particuliers, remarques..."
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;