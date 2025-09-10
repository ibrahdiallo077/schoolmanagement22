// src/components/students/EnrollmentWizard/SchoolingSection.tsx
import React from 'react';
import { BookOpen, GraduationCap, School, Star } from 'lucide-react';
import { SectionProps } from './types';

const SchoolingSection: React.FC<SectionProps> = ({ 
  formData, 
  updateFormData, 
  errors 
}) => {
  const coranicLevels = [
    { id: 'debutant', name: 'Débutant', description: 'Alphabet arabe et premières sourates', color: 'green' },
    { id: 'intermediaire', name: 'Intermédiaire', description: 'Lecture courante et mémorisation', color: 'blue' },
    { id: 'avance', name: 'Avancé', description: 'Tahfiz et perfectionnement', color: 'purple' },
    { id: 'hafiz', name: 'Hafiz', description: 'Mémorisation complète du Coran', color: 'gold' }
  ];

  const frenchLevels = [
    { category: 'Primaire', classes: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] },
    { category: 'Collège', classes: ['6ème', '5ème', '4ème', '3ème'] },
    { category: 'Lycée', classes: ['2nde', '1ère', 'Terminale'] }
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Double Scolarité</h2>
          <p className="text-gray-600">Enseignement coranique et cursus académique français</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enseignement Coranique */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🕌</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-800">Enseignement Coranique</h3>
              <p className="text-sm text-emerald-600">Mémorisation et récitation du Coran</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {coranicLevels.map((level) => (
              <div
                key={level.id}
                onClick={() => updateFormData('coranic_class_id', level.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                  formData.coranic_class_id === level.id
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.coranic_class_id === level.id
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.coranic_class_id === level.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{level.name}</h4>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                  </div>
                  {level.id === 'hafiz' && <Star className="w-5 h-5 text-yellow-500" />}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau spécifique (optionnel)
            </label>
            <input
              type="text"
              value={formData.coranic_class_details || ''}
              onChange={(e) => updateFormData('coranic_class_details', e.target.value)}
              placeholder="Ex: Sourate Al-Baqarah, Juz 5..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* École Française */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🇫🇷</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">École Française</h3>
              <p className="text-sm text-blue-600">Cursus académique classique</p>
            </div>
          </div>

          <div className="space-y-4">
            {frenchLevels.map((category) => (
              <div key={category.category} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {category.category}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {category.classes.map((classe) => (
                    <button
                      key={classe}
                      type="button"
                      onClick={() => updateFormData('french_class_id', classe)}
                      className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                        formData.french_class_id === classe
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                          : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {classe}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <School className="w-4 h-4 inline mr-1" />
              Nom de l'école française
            </label>
            <input
              type="text"
              value={formData.french_school_name || ''}
              onChange={(e) => updateFormData('french_school_name', e.target.value)}
              placeholder="Ex: École Sainte-Marie, Collège Moderne..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <span className="text-lg">📚</span>
              Double Scolarité
            </h4>
            <p className="text-sm text-blue-700">
              L'étudiant suivra les deux cursus en parallèle pour une formation complète alliant 
              enseignement religieux et académique moderne.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolingSection;