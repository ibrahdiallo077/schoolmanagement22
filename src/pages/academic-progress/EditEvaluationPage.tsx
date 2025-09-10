// src/pages/academic-progress/EditEvaluationPage.tsx - VERSION CORRIGÉE COMPLÈTE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  BookOpen,
  User,
  Calendar
} from 'lucide-react';
import { academicProgressService } from '../../services/academicProgressService';

interface EditEvaluationData {
  current_sourate?: string;
  sourate_number?: number;
  current_jouzou?: number;
  current_hizb?: number;
  pages_memorized?: number;
  verses_memorized?: number;
  memorization_status?: string;
  memorization_grade?: number;
  recitation_grade?: number;
  tajwid_grade?: number;
  behavior_grade?: number;
  attendance_rate?: number;
  teacher_comment?: string;
  student_behavior?: string;
  next_month_objective?: string;
  difficulties?: string;
  strengths?: string;
}

interface AcademicEvaluation {
  id: string;
  student_id?: string;
  student_name?: string;
  student_number?: string;
  current_sourate?: string;
  sourate_number?: number;
  current_jouzou?: number;
  current_hizb?: number;
  pages_memorized?: number;
  verses_memorized?: number;
  overall_grade?: number | string;
  memorization_grade?: number | string;
  recitation_grade?: number | string;
  tajwid_grade?: number | string;
  behavior_grade?: number | string;
  grade_mention?: string;
  memorization_status?: string;
  attendance_rate?: number;
  evaluation_date: string;
  evaluation_date_formatted?: string;
  class_name?: string;
  school_year_name?: string;
  age?: number;
  is_validated?: boolean;
  teacher_comment?: string;
  next_month_objective?: string;
  difficulties?: string;
  strengths?: string;
  student_behavior?: string;
}

const EditEvaluationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [evaluation, setEvaluation] = useState<AcademicEvaluation | null>(null);
  const [originalData, setOriginalData] = useState<EditEvaluationData>({});
  const [formData, setFormData] = useState<EditEvaluationData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Fonction utilitaire pour nettoyer et convertir les grades
  const parseGrade = (grade: any): number | undefined => {
    if (grade === null || grade === undefined || grade === '') return undefined;
    const parsed = parseFloat(String(grade));
    return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  };

  // Fonction utilitaire pour nettoyer les strings
  const cleanString = (value: any): string => {
    if (!value) return '';
    return String(value).trim();
  };

  // Fonction utilitaire pour nettoyer les nombres entiers
  const parseInteger = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = parseInt(String(value));
    return isNaN(parsed) ? undefined : parsed;
  };

  // Charger les données de l'évaluation
  useEffect(() => {
    const loadEvaluation = async () => {
      if (!id) {
        setError('ID évaluation manquant');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Chargement évaluation pour ID:', id);

        // Essayer de récupérer depuis sessionStorage d'abord
        const storedData = sessionStorage.getItem('editEvaluation');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            if (parsedData.id === id) {
              console.log('Données chargées depuis sessionStorage:', parsedData);
              setEvaluation(parsedData);
              initializeFormData(parsedData);
              sessionStorage.removeItem('editEvaluation');
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Erreur parsing sessionStorage:', e);
          }
        }

        // Sinon récupérer depuis l'API
        console.log('Récupération depuis API pour ID:', id);
        const response = await academicProgressService.getEvaluation(id);
        
        if (response.success && response.evaluation) {
          console.log('Évaluation récupérée depuis API:', response.evaluation);
          setEvaluation(response.evaluation);
          initializeFormData(response.evaluation);
        } else {
          throw new Error(response.error || 'Évaluation non trouvée');
        }
        
      } catch (err) {
        console.error('Erreur chargement évaluation:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, [id]);

  // CORRECTION MAJEURE : Remplacer 'eval' par 'evaluationData'
  const initializeFormData = (evaluationData: AcademicEvaluation) => {
    console.log('Initialisation formulaire avec:', evaluationData);
    
    const initialData: EditEvaluationData = {
      current_sourate: cleanString(evaluationData.current_sourate),
      sourate_number: parseInteger(evaluationData.sourate_number),
      current_jouzou: parseInteger(evaluationData.current_jouzou),
      current_hizb: parseInteger(evaluationData.current_hizb),
      pages_memorized: evaluationData.pages_memorized || 0,
      verses_memorized: evaluationData.verses_memorized || 0,
      memorization_status: evaluationData.memorization_status || 'en_cours',
      memorization_grade: parseGrade(evaluationData.memorization_grade),
      recitation_grade: parseGrade(evaluationData.recitation_grade),
      tajwid_grade: parseGrade(evaluationData.tajwid_grade),
      behavior_grade: parseGrade(evaluationData.behavior_grade),
      attendance_rate: evaluationData.attendance_rate || 100,
      teacher_comment: cleanString(evaluationData.teacher_comment),
      student_behavior: evaluationData.student_behavior || 'bon',
      next_month_objective: cleanString(evaluationData.next_month_objective),
      difficulties: cleanString(evaluationData.difficulties),
      strengths: cleanString(evaluationData.strengths)
    };
    
    console.log('FormData initialisé:', initialData);
    
    // Stocker une copie des données originales pour la comparaison
    setOriginalData({ ...initialData });
    setFormData(initialData);
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field: keyof EditEvaluationData, value: any) => {
    console.log(`Changement ${field}:`, value);
    
    let processedValue = value;
    
    // Traitement spécial selon le type de champ
    if (['memorization_grade', 'recitation_grade', 'tajwid_grade', 'behavior_grade'].includes(field)) {
      processedValue = value === '' || value === null || value === undefined ? undefined : parseFloat(value);
      if (processedValue !== undefined && (isNaN(processedValue) || processedValue <= 0)) {
        processedValue = undefined;
      }
    } else if (['sourate_number', 'current_jouzou', 'current_hizb', 'pages_memorized', 'verses_memorized', 'attendance_rate'].includes(field)) {
      processedValue = value === '' || value === null || value === undefined ? undefined : parseInt(value);
      if (processedValue !== undefined && isNaN(processedValue)) {
        processedValue = undefined;
      }
    } else if (typeof value === 'string') {
      processedValue = value.trim();
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Validation des données
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.current_sourate || formData.current_sourate.trim() === '') {
      errors.push('Le nom de la sourate est requis');
    }

    // Validation des notes (si définies)
    const gradeFields = ['memorization_grade', 'recitation_grade', 'tajwid_grade', 'behavior_grade'];
    gradeFields.forEach(field => {
      const value = formData[field as keyof EditEvaluationData];
      if (value !== undefined && value !== null) {
        const num = Number(value);
        if (isNaN(num) || num <= 0 || num > 20) {
          errors.push(`${field} doit être un nombre entre 0.1 et 20`);
        }
      }
    });

    // Validation des numéros
    if (formData.sourate_number !== undefined && (formData.sourate_number < 1 || formData.sourate_number > 114)) {
      errors.push('Le numéro de sourate doit être entre 1 et 114');
    }

    if (formData.current_jouzou !== undefined && (formData.current_jouzou < 1 || formData.current_jouzou > 30)) {
      errors.push('Le jouzou doit être entre 1 et 30');
    }

    if (formData.current_hizb !== undefined && (formData.current_hizb < 1 || formData.current_hizb > 60)) {
      errors.push('Le hizb doit être entre 1 et 60');
    }

    // Validation taux de présence
    if (formData.attendance_rate !== undefined) {
      const rate = Number(formData.attendance_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        errors.push('Le taux de présence doit être entre 0 et 100');
      }
    }

    return errors;
  };

  // Comparer deux valeurs en tenant compte des types
  const valuesAreEqual = (original: any, current: any): boolean => {
    // Si les deux sont undefined/null/empty, ils sont égaux
    if ((!original || original === '') && (!current || current === '')) {
      return true;
    }
    
    // Conversion pour comparaison
    let normalizedOriginal = original;
    let normalizedCurrent = current;
    
    // Pour les nombres, convertir en nombres pour comparaison
    if (typeof original === 'number' || typeof current === 'number') {
      normalizedOriginal = original || 0;
      normalizedCurrent = current || 0;
    }
    
    // Pour les strings, trim pour comparaison
    if (typeof original === 'string' || typeof current === 'string') {
      normalizedOriginal = String(original || '').trim();
      normalizedCurrent = String(current || '').trim();
    }
    
    return normalizedOriginal === normalizedCurrent;
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!id || !evaluation) return;

    try {
      setSaving(true);
      setError(null);
      console.log('Début sauvegarde pour ID:', id);

      // Validation
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Préparer seulement les données modifiées
      const updatedData: Partial<EditEvaluationData> = {};
      
      // Comparer chaque champ avec les données originales
      Object.entries(formData).forEach(([key, currentValue]) => {
        const originalValue = originalData[key as keyof EditEvaluationData];
        
        if (!valuesAreEqual(originalValue, currentValue)) {
          console.log(`Modification détectée ${key}:`, originalValue, '=>', currentValue);
          
          // Préparer la valeur finale à envoyer
          if (currentValue === '' || currentValue === null || currentValue === undefined) {
            updatedData[key as keyof EditEvaluationData] = undefined;
          } else {
            updatedData[key as keyof EditEvaluationData] = currentValue;
          }
        }
      });

      console.log('Données à sauvegarder:', updatedData);

      // Vérifier qu'il y a des modifications
      if (Object.keys(updatedData).length === 0) {
        setNotification({
          type: 'info',
          message: 'Aucune modification détectée'
        });
        return;
      }

      // Appel API
      console.log('Envoi vers API...');
      const response = await academicProgressService.updateEvaluation(id, updatedData);
      
      console.log('Réponse API:', response);
      
      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Évaluation modifiée avec succès'
        });

        // Mettre à jour les données originales pour éviter la détection de modifications fantômes
        setOriginalData({ ...formData });

        // Rediriger vers la liste après 2 secondes
        setTimeout(() => {
          navigate('/academic-progress', { replace: true });
        }, 2000);
      } else {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }

    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  // Auto-fermeture des notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Chargement de l'évaluation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-medium text-red-900">Erreur de chargement</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/academic-progress')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retour à la liste
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 lg:p-6">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
            {notification.type === 'info' && <AlertTriangle className="w-5 h-5 text-blue-600" />}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-900' :
              notification.type === 'error' ? 'text-red-900' :
              'text-blue-900'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/academic-progress')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Modifier l'évaluation
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <User className="w-4 h-4" />
                  <span>{evaluation.student_name}</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>{evaluation.evaluation_date_formatted || new Date(evaluation.evaluation_date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 overflow-hidden">
          <div className="p-6 space-y-8">
            
            {/* Progression coranique */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Progression coranique
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sourate actuelle *
                  </label>
                  <input
                    type="text"
                    value={formData.current_sourate || ''}
                    onChange={(e) => handleInputChange('current_sourate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom de la sourate"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de sourate (1-114)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="114"
                    value={formData.sourate_number || ''}
                    onChange={(e) => handleInputChange('sourate_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1-114"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jouzou actuel (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.current_jouzou || ''}
                    onChange={(e) => handleInputChange('current_jouzou', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1-30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hizb actuel (1-60)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.current_hizb || ''}
                    onChange={(e) => handleInputChange('current_hizb', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pages mémorisées
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pages_memorized || 0}
                    onChange={(e) => handleInputChange('pages_memorized', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Versets mémorisés
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.verses_memorized || 0}
                    onChange={(e) => handleInputChange('verses_memorized', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Statut et comportement */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut et comportement</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut de mémorisation
                  </label>
                  <select
                    value={formData.memorization_status || 'en_cours'}
                    onChange={(e) => handleInputChange('memorization_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="non_commence">Non commencé</option>
                    <option value="en_cours">En cours</option>
                    <option value="memorise">Mémorisé</option>
                    <option value="perfectionne">Perfectionné</option>
                    <option value="a_reviser">À réviser</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comportement étudiant
                  </label>
                  <select
                    value={formData.student_behavior || 'bon'}
                    onChange={(e) => handleInputChange('student_behavior', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="tres_bon">Très bon</option>
                    <option value="bon">Bon</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux de présence (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.attendance_rate || 100}
                    onChange={(e) => handleInputChange('attendance_rate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes (/20)</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mémorisation
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={formData.memorization_grade || ''}
                    onChange={(e) => handleInputChange('memorization_grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.1-20"
                  />
                </div>
              </div>
            </div>

            {/* Commentaires */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commentaires et observations</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaire du professeur
                  </label>
                  <textarea
                    rows={3}
                    value={formData.teacher_comment || ''}
                    onChange={(e) => handleInputChange('teacher_comment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Commentaires généraux sur l'évaluation..."
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points forts
                    </label>
                    <textarea
                      rows={3}
                      value={formData.strengths || ''}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Points positifs observés..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficultés rencontrées
                    </label>
                    <textarea
                      rows={3}
                      value={formData.difficulties || ''}
                      onChange={(e) => handleInputChange('difficulties', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Difficultés à travailler..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objectifs pour le mois prochain
                  </label>
                  <textarea
                    rows={3}
                    value={formData.next_month_objective || ''}
                    onChange={(e) => handleInputChange('next_month_objective', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Objectifs à atteindre..."
                  />
                </div>
              </div>
            </div>

            {/* Debug info - À supprimer en production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Debug (développement seulement)</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>ID Évaluation: {id}</div>
                  <div>Données originales chargées: {Object.keys(originalData).length > 0 ? 'Oui' : 'Non'}</div>
                </div>
              </div>
            )}

          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => navigate('/academic-progress')}
                disabled={saving}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.current_sourate?.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                title={!formData.current_sourate?.trim() ? 'Le nom de la sourate est requis' : ''}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
            
            {/* Indicateur de modifications */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                {Object.keys(originalData).length === 0 ? 
                  'Chargement des données...' : 
                  'Modifiez les champs ci-dessus et cliquez sur Sauvegarder'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEvaluationPage;
               