// src/components/academic-progress/EvaluationDetailsModal.tsx - MODAL DÉTAILS AVEC Z-INDEX CORRIGÉ

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  BookOpen, 
  Star, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Award,
  BookmarkCheck,
  Users,
  School,
  RefreshCw
} from 'lucide-react';

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

interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: AcademicEvaluation;
  onEdit: (evaluation: AcademicEvaluation) => void;
  onDownload: (evaluation: AcademicEvaluation) => void;
  onDelete: (evaluation: AcademicEvaluation) => void;
}

const EvaluationDetailsModal: React.FC<EvaluationDetailsModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  onEdit,
  onDownload,
  onDelete
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Fonctions utilitaires
  const formatGrade = (grade: number | string | undefined | null): string => {
    if (grade === null || grade === undefined || grade === '') return 'N/A';
    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : Number(grade);
    return isNaN(numericGrade) ? 'N/A' : numericGrade.toFixed(1);
  };

  const getGradeColor = (grade: number | string | undefined | null) => {
    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : Number(grade);
    if (!numericGrade || isNaN(numericGrade)) return 'text-gray-500';
    
    if (numericGrade >= 16) return 'text-green-600';
    if (numericGrade >= 14) return 'text-blue-600';
    if (numericGrade >= 12) return 'text-orange-600';
    if (numericGrade >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMentionColor = (mention: string) => {
    switch (mention) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Très Bien': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Bien': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Assez bien': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Passable': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Insuffisant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine':
      case 'perfectionne': return 'bg-green-100 text-green-700 border-green-200';
      case 'memorise': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'en_cours': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'non_commence': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'a_reviser': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'termine': return 'Terminé';
      case 'memorise': return 'Mémorisé';
      case 'perfectionne': return 'Perfectionné';
      case 'en_cours': return 'En cours';
      case 'non_commence': return 'Non commencé';
      case 'a_reviser': return 'À réviser';
      default: return 'Statut inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // GESTION DE L'ESCAPE ET DU SCROLL - TOUJOURS APPELÉ
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  // RETURN CONDITIONNEL APRÈS TOUS LES HOOKS
  if (!isOpen || !evaluation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* En-tête du modal */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            disabled={isLoading}
            title="Fermer (Echap)"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {evaluation.student_name || 'Nom non disponible'}
              </h2>
              <div className="flex items-center gap-4 text-sm text-white/90 mt-1">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {evaluation.class_name || 'Non assigné'}
                </span>
                {evaluation.age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {evaluation.age} ans
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <School className="w-4 h-4" />
                  {evaluation.student_number || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Date et validation */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Informations d'évaluation
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date d'évaluation:</span>
                  <span className="font-medium">
                    {evaluation.evaluation_date_formatted || formatDate(evaluation.evaluation_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Année scolaire:</span>
                  <span className="font-medium">{evaluation.school_year_name || 'Non définie'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Statut:</span>
                  {evaluation.is_validated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Validé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      <AlertCircle className="w-3 h-3" />
                      En attente
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progression coranique */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Progression coranique
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sourate actuelle:</span>
                  <span className="font-medium">{evaluation.current_sourate || 'Non spécifié'}</span>
                </div>
                {evaluation.sourate_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro:</span>
                    <span className="font-medium">#{evaluation.sourate_number}</span>
                  </div>
                )}
                {evaluation.current_jouzou && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jouzou:</span>
                    <span className="font-medium">{evaluation.current_jouzou}/30</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages mémorisées:</span>
                  <span className="font-medium flex items-center gap-1">
                    <BookmarkCheck className="w-3 h-3 text-green-600" />
                    {evaluation.pages_memorized || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Versets mémorisés:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Target className="w-3 h-3 text-blue-600" />
                    {evaluation.verses_memorized || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statut de mémorisation et présence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Statut de progression
              </h3>
              {evaluation.memorization_status && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(evaluation.memorization_status)}`}>
                  {getStatusLabel(evaluation.memorization_status)}
                </span>
              )}
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Présence et comportement
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de présence:</span>
                  <span className="font-medium">{evaluation.attendance_rate || 100}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Comportement:</span>
                  <span className="font-medium capitalize">{evaluation.student_behavior || 'Bon'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes détaillées */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Évaluation détaillée
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatGrade(evaluation.memorization_grade)}
                  <span className="text-sm text-gray-500">/20</span>
                </div>
                <div className="text-xs text-gray-600">Mémorisation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatGrade(evaluation.recitation_grade)}
                  <span className="text-sm text-gray-500">/20</span>
                </div>
                <div className="text-xs text-gray-600">Récitation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatGrade(evaluation.tajwid_grade)}
                  <span className="text-sm text-gray-500">/20</span>
                </div>
                <div className="text-xs text-gray-600">Tajwid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatGrade(evaluation.behavior_grade)}
                  <span className="text-sm text-gray-500">/20</span>
                </div>
                <div className="text-xs text-gray-600">Comportement</div>
              </div>
            </div>

            {/* Note globale */}
            <div className="border-t border-orange-200 pt-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getGradeColor(evaluation.overall_grade)}`}>
                    {formatGrade(evaluation.overall_grade)}
                    <span className="text-lg text-gray-500">/20</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Note globale</div>
                  {evaluation.grade_mention && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getMentionColor(evaluation.grade_mention)}`}>
                      <Star className="w-3 h-3 mr-1" />
                      {evaluation.grade_mention}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Commentaires */}
          {(evaluation.teacher_comment || evaluation.strengths || evaluation.difficulties || evaluation.next_month_objective) && (
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                Observations et commentaires
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {evaluation.teacher_comment && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Commentaire du professeur</h4>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                      {evaluation.teacher_comment}
                    </p>
                  </div>
                )}
                
                {evaluation.strengths && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Points forts</h4>
                    <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                      {evaluation.strengths}
                    </p>
                  </div>
                )}
                
                {evaluation.difficulties && (
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">Difficultés</h4>
                    <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                      {evaluation.difficulties}
                    </p>
                  </div>
                )}
                
                {evaluation.next_month_objective && (
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Objectifs du mois prochain</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {evaluation.next_month_objective}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions du modal */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Fermer
            </button>
            
            <button
              onClick={() => handleAction(() => onDownload(evaluation))}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger PDF
            </button>
            
            <button
              onClick={() => handleAction(() => onEdit(evaluation))}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            
            <button
              onClick={() => handleAction(() => onDelete(evaluation))}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetailsModal;