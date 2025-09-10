import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { 
  BookOpen, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  Sparkles,
  Calendar,
  Trophy,
  Users,
  CheckCircle,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
import {
  useAcademicEvaluations,
  useAcademicStats,
  useEvaluationFilters,
  useFormData,
  useCreateEvaluation
} from '../../hooks/useAcademicProgress';
import CreateEvaluationModal from '../../components/academic-progress/CreateEvaluationModal';
import AcademicStatsCards from '../../components/academic-progress/AcademicStatsCards';
import EvaluationFilters from '../../components/academic-progress/EvaluationFilters';
import EvaluationsList from '../../components/academic-progress/EvaluationsList';
import EvaluationDetailsModal from '../../components/academic-progress/EvaluationDetailsModal';
import { academicProgressService } from '../../services/academicProgressService';
import type { CreateEvaluationData } from '../../types/academicProgress.types';

// Interface pour les évaluations
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

const AcademicProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // ÉTAT UNIQUE POUR LE MODAL DE DÉTAILS - GÉRÉ ICI SEULEMENT
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    evaluation: AcademicEvaluation | null;
  }>({
    isOpen: false,
    evaluation: null
  });

  // État pour les notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Refs pour éviter les re-renders inutiles
  const handlersRef = useRef({});
  const stableDataRef = useRef({});

  // Hook pour les données de formulaire - STABLE
  const {
    students,
    classes,
    schoolYears,
    currentSchoolYear,
    loading: formDataLoading,
    error: formDataError,
    refetchStudents,
    hasStudents
  } = useFormData();

  // Hook pour les filtres
  const {
    filters,
    updateFilter,
    updateFilters,
    resetFilters
  } = useEvaluationFilters();

  // Hook pour les évaluations - SEULEMENT CETTE PARTIE CHANGE
  const {
    evaluations,
    loading: evaluationsLoading,
    error: evaluationsError,
    pagination,
    refetch: refetchEvaluations
  } = useAcademicEvaluations(filters);

  // Hook pour les statistiques - STABLE
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useAcademicStats();

  // Hook de création d'évaluation
  const {
    createEvaluation,
    loading: createLoading,
    error: createError,
    success: createSuccess,
    clearMessages
  } = useCreateEvaluation();

  // FONCTIONS UTILITAIRES - MÉMORISÉES POUR ÉVITER RE-CRÉATION
  const validateAndCleanNumber = useCallback((value: any, min?: number, max?: number): number | undefined => {
    if (value === undefined || value === null || value === '' || value === 0) {
      return undefined;
    }
    
    const num = Number(value);
    if (isNaN(num)) return undefined;
    if (min !== undefined && num < min) return undefined;
    if (max !== undefined && num > max) return undefined;
    
    return num;
  }, []);

  const validateAndCleanGrade = useCallback((value: any): number | undefined => {
    if (value === undefined || value === null || value === '' || value === 0) {
      return undefined;
    }
    
    const grade = Number(value);
    if (isNaN(grade) || grade <= 0 || grade > 20) {
      return undefined;
    }
    
    return grade;
  }, []);

  const cleanStringField = useCallback((value: any): string | undefined => {
    if (!value) return undefined;
    const cleaned = String(value).trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }, []);

  // FONCTION PDF COMPLÈTE AVEC JSPDF - STABLE
  const generatePDF = useCallback((evaluation: AcademicEvaluation, pdfData?: any) => {
    const doc = new jsPDF();
    let yPosition = 20;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(40, 120, 40);
    doc.text('ÉVALUATION ACADÉMIQUE', 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Informations étudiant
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('INFORMATIONS ÉTUDIANT', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const studentName = pdfData?.student.name || evaluation.student_name || 'N/A';
    const studentNumber = pdfData?.student.student_number || evaluation.student_number || 'N/A';
    const className = pdfData?.student.class || evaluation.class_name || 'Non assigné';
    const age = pdfData?.student.age || evaluation.age || 'N/A';

    doc.text(`Nom: ${studentName}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Numéro: ${studentNumber}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Classe: ${className}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Âge: ${age} ans`, 20, yPosition);
    yPosition += 15;

    // Détails évaluation
    doc.setFontSize(14);
    doc.text('DÉTAILS ÉVALUATION', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const evalDate = pdfData?.evaluation.date || evaluation.evaluation_date_formatted || 
                    new Date(evaluation.evaluation_date).toLocaleDateString('fr-FR');
    const schoolYear = pdfData?.evaluation.school_year || evaluation.school_year_name || 'Non définie';
    
    doc.text(`Date: ${evalDate}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Année scolaire: ${schoolYear}`, 20, yPosition);
    yPosition += 15;

    // Progression coranique
    doc.setFontSize(14);
    doc.setTextColor(120, 40, 120);
    doc.text('PROGRESSION CORANIQUE', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const currentSourate = pdfData?.progress.current_sourate || evaluation.current_sourate || 'Non spécifié';
    const pages = pdfData?.progress.pages_memorized || evaluation.pages_memorized || 0;
    const verses = pdfData?.progress.verses_memorized || evaluation.verses_memorized || 0;
    
    doc.text(`Sourate actuelle: ${currentSourate}`, 20, yPosition);
    yPosition += 6;
    if (evaluation.sourate_number || pdfData?.progress.sourate_number) {
      doc.text(`Numéro sourate: ${evaluation.sourate_number || pdfData?.progress.sourate_number}`, 20, yPosition);
      yPosition += 6;
    }
    if (evaluation.current_jouzou || pdfData?.progress.jouzou) {
      doc.text(`Jouzou: ${evaluation.current_jouzou || pdfData?.progress.jouzou}`, 20, yPosition);
      yPosition += 6;
    }
    doc.text(`Pages mémorisées: ${pages}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Versets mémorisés: ${verses}`, 20, yPosition);
    yPosition += 15;

    // Notes
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 120);
    doc.text('NOTES ET ÉVALUATION', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const formatGradePdf = (grade: any) => {
      if (!grade) return 'N/A';
      const numGrade = parseFloat(grade);
      return isNaN(numGrade) ? 'N/A' : `${numGrade.toFixed(1)}/20`;
    };
    
    const memGrade = pdfData?.grades.memorization || evaluation.memorization_grade;
    const recGrade = pdfData?.grades.recitation || evaluation.recitation_grade;
    const tajGrade = pdfData?.grades.tajwid || evaluation.tajwid_grade;
    const behGrade = pdfData?.grades.behavior || evaluation.behavior_grade;
    const overallGrade = pdfData?.grades.overall || evaluation.overall_grade;
    const mention = pdfData?.grades.mention || evaluation.grade_mention || 'N/A';
    
    doc.text(`Mémorisation: ${formatGradePdf(memGrade)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Récitation: ${formatGradePdf(recGrade)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Tajwid: ${formatGradePdf(tajGrade)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Comportement: ${formatGradePdf(behGrade)}`, 20, yPosition);
    yPosition += 10;

    // Note globale (en évidence)
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0);
    doc.text(`NOTE GLOBALE: ${formatGradePdf(overallGrade)} - ${mention}`, 20, yPosition);
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
    const attendance = pdfData?.attendance.rate || evaluation.attendance_rate || 100;
    doc.text(`Taux de présence: ${attendance}%`, 20, yPosition);
    yPosition += 15;

    // Commentaires (si présents)
    const teacherComment = pdfData?.comments.teacher || evaluation.teacher_comment;
    const strengths = pdfData?.comments.strengths || evaluation.strengths;
    const difficulties = pdfData?.comments.difficulties || evaluation.difficulties;
    const objectives = pdfData?.comments.objectives || evaluation.next_month_objective;

    if (teacherComment || strengths || difficulties || objectives) {
      doc.setFontSize(14);
      doc.setTextColor(180, 140, 40);
      doc.text('COMMENTAIRES', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      if (teacherComment) {
        doc.text('Commentaire professeur:', 20, yPosition);
        yPosition += 6;
        const splitText = doc.splitTextToSize(teacherComment, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4 + 5;
      }

      if (strengths) {
        doc.text('Points forts:', 20, yPosition);
        yPosition += 6;
        const splitText = doc.splitTextToSize(strengths, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4 + 5;
      }

      if (difficulties) {
        doc.text('Difficultés:', 20, yPosition);
        yPosition += 6;
        const splitText = doc.splitTextToSize(difficulties, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4 + 5;
      }

      if (objectives) {
        doc.text('Objectif mois prochain:', 20, yPosition);
        yPosition += 6;
        const splitText = doc.splitTextToSize(objectives, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4;
      }
    }

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - Haramain`, 105, 280, { align: 'center' });

    return doc;
  }, []);

  // HANDLERS POUR LES ACTIONS SUR LES ÉVALUATIONS - STABLES
  const stableHandlers = useMemo(() => ({
    handleViewDetails: (evaluation: AcademicEvaluation) => {
      console.log('📋 PAGE - Affichage des détails pour:', evaluation.id);
      setDetailsModal({
        isOpen: true,
        evaluation
      });
    },

    handleEditEvaluation: (evaluation: AcademicEvaluation) => {
      console.log('✏️ PAGE PRINCIPALE - Clic Modifier:', evaluation.id, evaluation.student_name);
      
      try {
        if (!evaluation.id) {
          console.error('❌ ID évaluation manquant:', evaluation);
          setNotification({
            type: 'error',
            message: 'Impossible de modifier: ID évaluation manquant'
          });
          return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(evaluation.id)) {
          console.error('❌ Format ID invalide:', evaluation.id);
          setNotification({
            type: 'error',
            message: 'Format d\'ID évaluation invalide'
          });
          return;
        }

        console.log('💾 Stockage données dans sessionStorage...');
        const dataToStore = {
          id: evaluation.id,
          student_id: evaluation.student_id,
          student_name: evaluation.student_name,
          student_number: evaluation.student_number,
          current_sourate: evaluation.current_sourate,
          sourate_number: evaluation.sourate_number,
          current_jouzou: evaluation.current_jouzou,
          current_hizb: evaluation.current_hizb,
          pages_memorized: evaluation.pages_memorized,
          verses_memorized: evaluation.verses_memorized,
          overall_grade: evaluation.overall_grade,
          memorization_grade: evaluation.memorization_grade,
          recitation_grade: evaluation.recitation_grade,
          tajwid_grade: evaluation.tajwid_grade,
          behavior_grade: evaluation.behavior_grade,
          grade_mention: evaluation.grade_mention,
          memorization_status: evaluation.memorization_status,
          attendance_rate: evaluation.attendance_rate,
          evaluation_date: evaluation.evaluation_date,
          evaluation_date_formatted: evaluation.evaluation_date_formatted,
          class_name: evaluation.class_name,
          school_year_name: evaluation.school_year_name,
          age: evaluation.age,
          is_validated: evaluation.is_validated,
          teacher_comment: evaluation.teacher_comment,
          next_month_objective: evaluation.next_month_objective,
          difficulties: evaluation.difficulties,
          strengths: evaluation.strengths,
          student_behavior: evaluation.student_behavior
        };

        try {
          sessionStorage.setItem('editEvaluation', JSON.stringify(dataToStore));
          console.log('✅ Données stockées avec succès:', dataToStore);
        } catch (storageError) {
          console.error('❌ Erreur stockage sessionStorage:', storageError);
          setNotification({
            type: 'error',
            message: 'Erreur de sauvegarde temporaire des données'
          });
          return;
        }
        
        setDetailsModal({ isOpen: false, evaluation: null });
        
        const targetPath = `/academic-progress/edit/${evaluation.id}`;
        console.log('🚀 Navigation vers:', targetPath);
        
        if (typeof navigate !== 'function') {
          console.error('❌ navigate n\'est pas une fonction:', typeof navigate);
          setNotification({
            type: 'error',
            message: 'Erreur de navigation: fonction navigate non disponible'
          });
          return;
        }

        navigate(targetPath);
        console.log('✅ Navigation déclenchée vers:', targetPath);
        
        setNotification({
          type: 'info',
          message: 'Redirection vers le formulaire de modification...'
        });
        
      } catch (error) {
        console.error('❌ PAGE PRINCIPALE - Erreur lors de la redirection:', error);
        setNotification({
          type: 'error',
          message: 'Erreur lors de l\'ouverture du formulaire de modification'
        });
      }
    },

    handleDownloadPDF: async (evaluation: AcademicEvaluation) => {
      try {
        console.log('Page principale - Téléchargement PDF pour:', evaluation.id);
        
        let pdfData = null;
        
        try {
          const response = await academicProgressService.getPdfData(evaluation.id);
          if (response.success && response.pdf_data) {
            pdfData = response.pdf_data;
            console.log('Données PDF récupérées du serveur');
          }
        } catch (serverError) {
          console.warn('Impossible de récupérer les données du serveur, génération locale:', serverError);
        }
        
        const doc = generatePDF(evaluation, pdfData);
        
        const studentName = pdfData?.student.name || evaluation.student_name || 'etudiant';
        const filename = `evaluation_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        setNotification({
          type: 'success',
          message: 'PDF généré avec succès'
        });
        
      } catch (error) {
        console.error('Erreur téléchargement PDF:', error);
        setNotification({
          type: 'error',
          message: error instanceof Error ? error.message : 'Erreur téléchargement PDF'
        });
      }
    },

    handleDeleteEvaluation: async (evaluation: AcademicEvaluation) => {
      try {
        console.log('Page principale - Suppression évaluation:', evaluation.id);
        
        const response = await academicProgressService.deleteEvaluation(evaluation.id);
        
        if (response.success) {
          setNotification({
            type: 'success',
            message: 'Évaluation supprimée avec succès'
          });
          
          setDetailsModal({ isOpen: false, evaluation: null });
          
          await Promise.all([
            refetchEvaluations(),
            refetchStats()
          ]);
          
        } else {
          throw new Error(response.error || 'Erreur suppression');
        }
      } catch (error) {
        console.error('Erreur suppression évaluation:', error);
        setNotification({
          type: 'error',
          message: error instanceof Error ? error.message : 'Erreur lors de la suppression'
        });
      }
    }
  }), [navigate, generatePDF, refetchEvaluations, refetchStats]);

  // Stockage des handlers stables
  handlersRef.current = stableHandlers;

  // FONCTION DE CRÉATION D'ÉVALUATION - STABLE
  const handleCreateEvaluation = useCallback(async (formData: CreateEvaluationData) => {
    try {
      console.log('Début création évaluation avec données:', formData);
      
      if (!formData.student_id || String(formData.student_id).trim() === '') {
        throw new Error('Veuillez sélectionner un étudiant');
      }
      
      if (!formData.current_sourate || String(formData.current_sourate).trim() === '') {
        throw new Error('Veuillez saisir le nom de la sourate');
      }
      
      if (!formData.evaluation_date) {
        throw new Error('Veuillez saisir la date d\'évaluation');
      }

      const studentId = String(formData.student_id).trim();
      if (!/^[a-f0-9-]{36}$/i.test(studentId)) {
        throw new Error('Format d\'ID étudiant invalide');
      }

      const evaluationData: CreateEvaluationData = {
        student_id: studentId,
        evaluation_date: formData.evaluation_date,
        current_sourate: String(formData.current_sourate).trim(),
        school_year_id: formData.school_year_id?.trim() || currentSchoolYear?.id,
        class_id: formData.class_id?.trim() || undefined,
        sourate_number: validateAndCleanNumber(formData.sourate_number, 1, 114),
        current_jouzou: validateAndCleanNumber(formData.current_jouzou, 1, 30),
        current_hizb: validateAndCleanNumber(formData.current_hizb, 1, 60),
        pages_memorized: Math.max(0, parseInt(String(formData.pages_memorized || 0))),
        verses_memorized: Math.max(0, parseInt(String(formData.verses_memorized || 0))),
        attendance_rate: Math.min(100, Math.max(0, parseInt(String(formData.attendance_rate || 100)))),
        memorization_status: formData.memorization_status || 'en_cours',
        student_behavior: formData.student_behavior || 'bon',
        memorization_grade: validateAndCleanGrade(formData.memorization_grade),
        recitation_grade: validateAndCleanGrade(formData.recitation_grade),
        tajwid_grade: validateAndCleanGrade(formData.tajwid_grade),
        behavior_grade: validateAndCleanGrade(formData.behavior_grade),
        teacher_comment: cleanStringField(formData.teacher_comment),
        next_month_objective: cleanStringField(formData.next_month_objective),
        difficulties: cleanStringField(formData.difficulties),
        strengths: cleanStringField(formData.strengths)
      };
      
      if (!evaluationData.student_id) {
        throw new Error('ID étudiant manquant après nettoyage');
      }
      
      if (!evaluationData.current_sourate) {
        throw new Error('Nom de la sourate manquant après nettoyage');
      }
      
      if (!evaluationData.school_year_id) {
        throw new Error('Année scolaire manquante. Veuillez vérifier qu\'une année scolaire est définie dans le système.');
      }
      
      console.log('Données finales préparées:', evaluationData);
      
      await createEvaluation(evaluationData);
      console.log('Évaluation créée avec succès');
      
      await Promise.all([
        refetchEvaluations(),
        refetchStats()
      ]);
      
      setNotification({
        type: 'success',
        message: 'Évaluation créée avec succès'
      });
      
      setTimeout(() => {
        setIsCreateModalOpen(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de la création'
      });
    }
  }, [
    createEvaluation, 
    refetchEvaluations, 
    refetchStats, 
    currentSchoolYear,
    validateAndCleanNumber,
    validateAndCleanGrade,
    cleanStringField
  ]);

  // GESTIONNAIRES DE MODAL - STABLES
  const stableModalHandlers = useMemo(() => ({
    handleOpenCreateModal: () => {
      if (formDataLoading) return;
      
      if (!hasStudents) {
        setNotification({
          type: 'error',
          message: 'Aucun étudiant disponible. Veuillez d\'abord enregistrer des étudiants.'
        });
        return;
      }
      
      if (students.length === 0) return;
      
      clearMessages();
      setIsCreateModalOpen(true);
    },

    handleCloseCreateModal: () => {
      clearMessages();
      setIsCreateModalOpen(false);
    },

    handleCloseDetailsModal: () => {
      console.log('Fermeture du modal de détails');
      setDetailsModal({ isOpen: false, evaluation: null });
    }
  }), [clearMessages, hasStudents, students.length, formDataLoading]);

  // ACTUALISER TOUTES LES DONNÉES - STABLE
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchEvaluations(),
        refetchStats(),
        refetchStudents()
      ]);
      
      setNotification({
        type: 'success',
        message: 'Données actualisées avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      setNotification({
        type: 'error',
        message: 'Erreur lors de l\'actualisation des données'
      });
    }
  }, [refetchEvaluations, refetchStats, refetchStudents]);

  // GESTION DE LA PAGINATION - STABLE
  const handlePageChange = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  // CALLBACK APRÈS MODIFICATION/SUPPRESSION D'ÉVALUATION - STABLE
  const handleEvaluationUpdated = useCallback(async () => {
    try {
      await Promise.all([
        refetchEvaluations(),
        refetchStats()
      ]);
      
      setNotification({
        type: 'success',
        message: 'Liste d\'évaluations actualisée'
      });
    } catch (error) {
      console.error('Erreur actualisation:', error);
      setNotification({
        type: 'error',
        message: 'Erreur lors de l\'actualisation'
      });
    }
  }, [refetchEvaluations, refetchStats]);

  // Auto-fermeture des notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // CALCULS POUR LES STATISTIQUES - STABLES
  const stableStats = useMemo(() => ({
    totalEvaluations: pagination?.total_items || evaluations.length || 0,
    studentsEvaluated: stats?.general?.students_evaluated || 0
  }), [pagination?.total_items, evaluations.length, stats?.general?.students_evaluated]);

  // ÉTATS DE CHARGEMENT GLOBAUX - STABLES
  const stableLoadingStates = useMemo(() => ({
    isLoading: formDataLoading || evaluationsLoading || statsLoading,
    hasData: hasStudents && schoolYears.length > 0,
    canCreateEvaluation: hasStudents && schoolYears.length > 0 && !formDataLoading && !evaluationsLoading && !statsLoading && !createLoading
  }), [formDataLoading, evaluationsLoading, statsLoading, hasStudents, schoolYears.length, createLoading]);

  // MÉMORISATION DES COMPOSANTS STABLES - NE CHANGENT PAS LORS DES FILTRES
  const memoizedHeader = useMemo(() => (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Évolution Académique
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
              <span className="text-gray-600">Suivi intelligent des progrès coraniques</span>
              {stableStats.totalEvaluations > 0 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {stableStats.totalEvaluations} évaluations
                  </span>
                </>
              )}
              {students.length > 0 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-green-400"></div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {students.length} étudiants
                  </span>
                </>
              )}
              {stableLoadingStates.hasData && (
                <>
                  <div className="w-1 h-1 rounded-full bg-green-400"></div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Système prêt
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={handleRefresh}
            disabled={stableLoadingStates.isLoading}
            className="group px-3 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl 
                     hover:bg-white hover:shadow-md transition-all duration-300 
                     flex items-center gap-2 border border-white/50 text-sm"
            title="Actualiser toutes les données"
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-300 ${
              stableLoadingStates.isLoading ? 'animate-spin' : 'group-hover:rotate-45'
            }`} />
            <span className="hidden lg:inline">Actualiser</span>
          </button>

          <button
            onClick={stableModalHandlers.handleOpenCreateModal}
            disabled={!stableLoadingStates.canCreateEvaluation}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                     rounded-xl hover:from-blue-700 hover:to-purple-700 
                     disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed
                     transition-all duration-300 flex items-center gap-2 
                     shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
            title={
              !hasStudents ? 'Aucun étudiant disponible' :
              stableLoadingStates.isLoading ? 'Chargement des données...' :
              'Créer une nouvelle évaluation'
            }
          >
            {stableLoadingStates.isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {stableLoadingStates.isLoading ? 'Chargement...' : 'Nouvelle'}
            </span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>
    </div>
  ), [stableStats.totalEvaluations, students.length, stableLoadingStates, hasStudents, handleRefresh, stableModalHandlers.handleOpenCreateModal]);

  const memoizedStatsCards = useMemo(() => (
    <AcademicStatsCards
      stats={stats}
      loading={statsLoading}
      error={statsError}
    />
  ), [stats, statsLoading, statsError]);

  const memoizedErrorMessages = useMemo(() => (
    <>
      {/* MESSAGES D'ERREUR */}
      {formDataError && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Problème de chargement des données</p>
              <p className="text-red-600 text-sm mt-1">{formDataError}</p>
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={refetchStudents}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Réessayer
                </button>
                <span className="text-red-500 text-xs">
                  Vérifiez la connexion au serveur et que des étudiants sont enregistrés
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {evaluationsError && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Erreur de chargement des évaluations</p>
              <p className="text-red-600 text-sm mt-1">{evaluationsError}</p>
              <button 
                onClick={refetchEvaluations}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucun étudiant disponible */}
      {!hasStudents && !formDataLoading && !formDataError && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">Aucun étudiant disponible</p>
              <p className="text-yellow-600 text-sm mt-1">
                Vous devez avoir des étudiants enregistrés pour créer des évaluations.
              </p>
              <p className="text-yellow-500 text-xs mt-2">
                Rendez-vous dans le module "Gestion des Étudiants" pour ajouter des étudiants.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  ), [formDataError, evaluationsError, hasStudents, formDataLoading, refetchStudents, refetchEvaluations]);

  // COMPOSANT FILTRES STABLE - données de référence ne changent pas
  const memoizedFilters = useMemo(() => (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 overflow-hidden mb-6">
      <EvaluationFilters
        filters={filters}
        onUpdateFilter={updateFilter}
        onUpdateFilters={updateFilters}
        onResetFilters={resetFilters}
        resultCount={stableStats.totalEvaluations}
        students={students}
        classes={classes}
        schoolYears={schoolYears}
        loading={formDataLoading}
      />
    </div>
  ), [filters, updateFilter, updateFilters, resetFilters, stableStats.totalEvaluations, students, classes, schoolYears, formDataLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 lg:p-6">
      {/* Notifications globales */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] max-w-md p-4 rounded-lg shadow-lg border ${
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

      {/* Header STABLE - MÉMORISÉ */}
      {memoizedHeader}

      {/* Messages d'erreur STABLES - MÉMORISÉS */}
      {memoizedErrorMessages}

      {/* Cartes statistiques STABLES - MÉMORISÉES */}
      <div className="mb-6">
        {memoizedStatsCards}
      </div>

      {/* Filtres STABLES - MÉMORISÉS */}
      {memoizedFilters}

      {/* SECTION LISTE - SEULEMENT CETTE PARTIE SE RECHARGE LORS DES FILTRES */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 overflow-hidden">
        <div className="p-4 lg:p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-blue-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Historique des Évaluations
                </h2>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {stableStats.studentsEvaluated} étudiants évalués
                  </span>
                  {pagination && pagination.total_pages > 1 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs">
                        Page {pagination.current_page}/{pagination.total_pages}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Indicateurs de statut */}
            <div className="flex items-center gap-2">
              {evaluationsLoading && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Chargement...
                </div>
              )}
              
              {stableLoadingStates.hasData && !evaluationsLoading && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Données à jour
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COMPOSANT LISTE - SEULEMENT CETTE PARTIE CHANGE LORS DES FILTRES */}
        <EvaluationsList
          evaluations={evaluations}
          loading={evaluationsLoading}
          error={evaluationsError}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={refetchEvaluations}
          onEvaluationUpdated={handleEvaluationUpdated}
          // HANDLERS STABLES POUR ÉVITER LA DUPLICATION
          onViewDetails={handlersRef.current.handleViewDetails}
          onEditEvaluation={handlersRef.current.handleEditEvaluation}
          onDownloadPDF={handlersRef.current.handleDownloadPDF}
          onDeleteEvaluation={handlersRef.current.handleDeleteEvaluation}
        />
      </div>

      {/* Modal de création d'évaluation */}
      {isCreateModalOpen && (
        <CreateEvaluationModal
          isOpen={isCreateModalOpen}
          onClose={stableModalHandlers.handleCloseCreateModal}
          onSubmit={handleCreateEvaluation}
          students={students}
          schoolYears={schoolYears}
          currentSchoolYear={currentSchoolYear}
          loading={createLoading}
          error={createError}
          success={createSuccess}
        />
      )}

      {/* MODAL DE DÉTAILS UNIQUE - GÉRÉ ICI SEULEMENT AVEC Z-INDEX ÉLEVÉ */}
      <EvaluationDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={stableModalHandlers.handleCloseDetailsModal}
        evaluation={detailsModal.evaluation!}
        onEdit={handlersRef.current.handleEditEvaluation}
        onDownload={handlersRef.current.handleDownloadPDF}
        onDelete={handlersRef.current.handleDeleteEvaluation}
      />
    </div>
  );
};

export default AcademicProgressPage;
          