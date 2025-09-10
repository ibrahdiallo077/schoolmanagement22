// src/components/academic-progress/EvaluationsList.tsx - VERSION CORRIGÉE COMPLÈTE SANS DUPLICATIONS
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Star,
  Calendar,
  User,
  BookmarkCheck,
  Target,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle
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

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
  has_prev: boolean;
  has_next: boolean;
}

interface EvaluationsListProps {
  evaluations: AcademicEvaluation[];
  loading: boolean;
  error: string | null;
  pagination?: Pagination;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onEvaluationUpdated?: () => void;
  // Actions gérées par le parent
  onViewDetails: (evaluation: AcademicEvaluation) => void;
  onEditEvaluation: (evaluation: AcademicEvaluation) => void;
  onDownloadPDF: (evaluation: AcademicEvaluation) => void;
  onDeleteEvaluation: (evaluation: AcademicEvaluation) => void;
}

// Modal de confirmation pour suppression UNIQUEMENT
const ConfirmDeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, studentName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Supprimer l'évaluation
            </h3>
            <p className="text-sm text-gray-600">
              Cette action ne peut pas être annulée
            </p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-6">
          Êtes-vous sûr de vouloir supprimer l'évaluation de <strong>{studentName}</strong> ?
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant principal
const EvaluationsList: React.FC<EvaluationsListProps> = ({
  evaluations,
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
  onEvaluationUpdated,
  // Actions déléguées au parent - DIRECTEMENT UTILISÉES
  onViewDetails,
  onEditEvaluation,
  onDownloadPDF,
  onDeleteEvaluation
}) => {
  
  // État local MINIMAL - uniquement pour la confirmation de suppression
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    evaluation: AcademicEvaluation | null;
    loading: boolean;
  }>({
    isOpen: false,
    evaluation: null,
    loading: false
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // === FONCTIONS UTILITAIRES ===
  const formatGrade = (grade: number | string | undefined | null): string => {
    if (grade === null || grade === undefined || grade === '') return 'N/A';
    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : Number(grade);
    return isNaN(numericGrade) ? 'N/A' : numericGrade.toFixed(1);
  };

  const getNumericGrade = (grade: number | string | undefined | null): number => {
    if (grade === null || grade === undefined || grade === '') return 0;
    const numericGrade = typeof grade === 'string' ? parseFloat(grade) : Number(grade);
    return isNaN(numericGrade) ? 0 : numericGrade;
  };

  const getGradeColor = (grade: number | string | undefined | null) => {
    const numericGrade = getNumericGrade(grade);
    
    if (numericGrade >= 16) return 'text-green-600';
    if (numericGrade >= 14) return 'text-blue-600';
    if (numericGrade >= 12) return 'text-orange-600';
    if (numericGrade >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMentionColor = (mention: string) => {
    switch (mention) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Très Bien': return 'bg-blue-100 text-blue-800';
      case 'Bien': return 'bg-orange-100 text-orange-800';
      case 'Assez bien': return 'bg-yellow-100 text-yellow-800';
      case 'Passable': return 'bg-amber-100 text-amber-800';
      case 'Insuffisant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine':
      case 'perfectionne': return 'bg-green-100 text-green-700';
      case 'memorise': return 'bg-blue-100 text-blue-700';
      case 'en_cours': return 'bg-orange-100 text-orange-700';
      case 'non_commence': return 'bg-gray-100 text-gray-700';
      case 'a_reviser': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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

  // === HANDLERS SIMPLIFIÉS - UTILISATION DIRECTE DES PROPS ===
  
  // CORRECTION MAJEURE: Utilisation directe des props parent avec logs de debug
  const handleViewDetailsClick = (evaluation: AcademicEvaluation) => {
    console.log('🔍 LISTE - Clic Voir détails:', evaluation.id, evaluation.student_name);
    try {
      onViewDetails(evaluation);
      console.log('✅ LISTE - Voir détails appelé avec succès');
    } catch (error) {
      console.error('❌ LISTE - Erreur lors de l\'appel Voir détails:', error);
    }
  };

  const handleEditClick = (evaluation: AcademicEvaluation) => {
    console.log('✏️ LISTE - Clic Modifier:', evaluation.id, evaluation.student_name);
    console.log('📝 LISTE - Données évaluation:', evaluation);
    
    try {
      // VÉRIFICATION CRITIQUE: la fonction parent existe-t-elle ?
      if (typeof onEditEvaluation !== 'function') {
        console.error('❌ LISTE - onEditEvaluation n\'est pas une fonction:', typeof onEditEvaluation);
        return;
      }
      
      console.log('🚀 LISTE - Appel de onEditEvaluation...');
      onEditEvaluation(evaluation);
      console.log('✅ LISTE - Modification appelée avec succès');
      
    } catch (error) {
      console.error('❌ LISTE - Erreur lors de l\'appel Modifier:', error);
      setNotification({
        type: 'error',
        message: 'Erreur lors de l\'ouverture du formulaire de modification'
      });
    }
  };

  const handleDownloadClick = (evaluation: AcademicEvaluation) => {
    console.log('📥 LISTE - Clic Télécharger PDF:', evaluation.id, evaluation.student_name);
    try {
      onDownloadPDF(evaluation);
      console.log('✅ LISTE - Téléchargement appelé avec succès');
    } catch (error) {
      console.error('❌ LISTE - Erreur lors du téléchargement:', error);
    }
  };

  // SEUL handler géré localement : préparation de la suppression
  const handleDeleteRequest = (evaluation: AcademicEvaluation) => {
    console.log('🗑️ LISTE - Préparation suppression:', evaluation.id);
    setDeleteModal({
      isOpen: true,
      evaluation,
      loading: false
    });
  };

  // Confirmation de suppression
  const confirmDelete = async () => {
    if (!deleteModal.evaluation) return;

    console.log('🗑️ LISTE - Confirmation suppression:', deleteModal.evaluation.id);
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      await onDeleteEvaluation(deleteModal.evaluation);
      
      console.log('✅ LISTE - Suppression réussie');
      
      setDeleteModal({
        isOpen: false,
        evaluation: null,
        loading: false
      });
      
      setNotification({
        type: 'success',
        message: 'Évaluation supprimée avec succès'
      });
      
    } catch (error) {
      console.error('❌ LISTE - Erreur suppression:', error);
      
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      });
      
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Auto-fermeture des notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // DEBUG: Vérifier les props au rendu
  useEffect(() => {
    console.log('🔍 DEBUG LISTE - Props reçues:');
    console.log('  - onViewDetails:', typeof onViewDetails);
    console.log('  - onEditEvaluation:', typeof onEditEvaluation);
    console.log('  - onDownloadPDF:', typeof onDownloadPDF);
    console.log('  - onDeleteEvaluation:', typeof onDeleteEvaluation);
    console.log('  - Évaluations:', evaluations.length);
  }, [onViewDetails, onEditEvaluation, onDownloadPDF, onDeleteEvaluation, evaluations.length]);

  // === ÉTATS DE RENDU ===
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-900">Erreur de chargement</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="p-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune évaluation trouvée
        </h3>
        <p className="text-gray-600 mb-4">
          Il n'y a pas d'évaluations correspondant aux critères de recherche.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Actualiser
        </button>
      </div>
    );
  }

  // === RENDU PRINCIPAL ===
  
  return (
    <div>
      {/* Notification locale */}
      {notification && (
        <div className={`fixed top-16 right-4 z-[80] max-w-md p-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-900' : 'text-red-900'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* En-têtes desktop */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
        <div className="col-span-1">ID</div>
        <div className="col-span-2">Étudiant</div>
        <div className="col-span-2">Sourate/Niveau</div>
        <div className="col-span-2">Notes</div>
        <div className="col-span-2">Progression</div>
        <div className="col-span-2">Date/Statut</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Liste des évaluations */}
      <div className="divide-y divide-gray-100">
        {evaluations.map((evaluation, index) => (
          <div key={evaluation.id || `eval-${index}`} 
               className="px-6 py-4 hover:bg-gray-50 transition-colors">
            
            {/* Version desktop */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-medium text-blue-600">
                    #
                  </div>
                  <span className="text-xs text-blue-600 font-mono">
                    {evaluation.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {evaluation.student_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {evaluation.student_name || 'Nom non disponible'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {evaluation.class_name && `${evaluation.class_name}`}
                      {evaluation.age && ` • ${evaluation.age} ans`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {evaluation.current_sourate || 'Non spécifié'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {evaluation.current_jouzou && `Jouzou ${evaluation.current_jouzou}`}
                      {evaluation.pages_memorized !== undefined && evaluation.pages_memorized > 0 && 
                        ` • ${evaluation.pages_memorized} pages`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className={`text-sm font-semibold ${getGradeColor(evaluation.overall_grade)}`}>
                      {formatGrade(evaluation.overall_grade)}/20
                    </span>
                  </div>
                  {evaluation.grade_mention && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMentionColor(evaluation.grade_mention)}`}>
                      {evaluation.grade_mention}
                    </span>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    {evaluation.pages_memorized !== undefined && (
                      <span className="flex items-center gap-1">
                        <BookmarkCheck className="w-3 h-3" />
                        {evaluation.pages_memorized} p.
                      </span>
                    )}
                    {evaluation.verses_memorized !== undefined && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {evaluation.verses_memorized} v.
                      </span>
                    )}
                    {evaluation.attendance_rate !== undefined && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {evaluation.attendance_rate}%
                      </span>
                    )}
                  </div>
                  {evaluation.memorization_status && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evaluation.memorization_status)}`}>
                      {getStatusLabel(evaluation.memorization_status)}
                    </span>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {evaluation.evaluation_date_formatted || formatDate(evaluation.evaluation_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {evaluation.is_validated ? (
                        <span className="text-green-600">✓ Validé</span>
                      ) : (
                        <span className="text-orange-600">⏳ En attente</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Voir les détails"
                    onClick={() => handleViewDetailsClick(evaluation)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Modifier"
                    onClick={() => handleEditClick(evaluation)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    title="Télécharger PDF"
                    onClick={() => handleDownloadClick(evaluation)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                    onClick={() => handleDeleteRequest(evaluation)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Version mobile */}
            <div className="lg:hidden">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {evaluation.student_name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {evaluation.student_name || 'Nom non disponible'}
                    </h3>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getGradeColor(evaluation.overall_grade)}`}>
                        {formatGrade(evaluation.overall_grade)}
                        <span className="text-xs text-gray-400">/20</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate">{evaluation.current_sourate || 'Non spécifié'}</span>
                    {evaluation.current_jouzou && (
                      <>
                        <span>•</span>
                        <span>J.{evaluation.current_jouzou}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {evaluation.evaluation_date_formatted || formatDate(evaluation.evaluation_date)}
                      </span>
                      {evaluation.class_name && (
                        <>
                          <span>•</span>
                          <span>{evaluation.class_name}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        onClick={() => handleViewDetailsClick(evaluation)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded transition-colors"
                        onClick={() => handleEditClick(evaluation)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-purple-600 rounded transition-colors"
                        onClick={() => handleDownloadClick(evaluation)}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                        onClick={() => handleDeleteRequest(evaluation)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {evaluation.grade_mention && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMentionColor(evaluation.grade_mention)}`}>
                        {evaluation.grade_mention}
                      </span>
                    )}
                    {evaluation.memorization_status && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evaluation.memorization_status)}`}>
                        {getStatusLabel(evaluation.memorization_status)}
                      </span>
                    )}
                    {evaluation.is_validated && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✓ Validé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à {' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} sur{' '}
            {pagination.total_items} résultats
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={!pagination.has_prev}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let page;
                if (pagination.total_pages <= 5) {
                  page = i + 1;
                } else {
                  const start = Math.max(1, Math.min(
                    pagination.current_page - 2,
                    pagination.total_pages - 4
                  ));
                  page = start + i;
                }
                
                if (page > pagination.total_pages) return null;
                
                const isActive = page === pagination.current_page;
                
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={!pagination.has_next}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression - UNIQUE */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, evaluation: null, loading: false })}
        onConfirm={confirmDelete}
        studentName={deleteModal.evaluation?.student_name || 'Étudiant'}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default EvaluationsList;
                    