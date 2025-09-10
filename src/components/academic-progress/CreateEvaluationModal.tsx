// src/components/CreateEvaluationModal.tsx - VERSION CORRIGÉE POUR LES ESPACES

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  User, 
  Search, 
  Calendar, 
  Star, 
  Users, 
  Save, 
  AlertCircle, 
  CheckCircle,
  GraduationCap,
  Edit3,
  ChevronDown,
  UserCheck,
  Hash,
  Sparkles
} from 'lucide-react';

// IMPORT DES TYPES EXTERNES
import type {
  CreateEvaluationData,
  StudentSelectOption,
  SchoolYearSelectOption
} from '../../types/academicProgress.types';

// INTERFACE DU COMPOSANT
interface CreateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEvaluationData) => Promise<void>;
  students?: StudentSelectOption[];
  schoolYears?: SchoolYearSelectOption[];
  currentSchoolYear?: SchoolYearSelectOption;
  loading?: boolean;
  error?: string;
  success?: string;
}

// INTERFACE POUR LES SOURATES
interface Sourate {
  number: number;
  name: string;
  arabicName?: string;
  meaning?: string;
  verses?: number;
}

const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  students = [],
  schoolYears = [],
  currentSchoolYear,
  loading = false,
  error = '',
  success = ''
}) => {
  // États du composant
  const [selectedStudent, setSelectedStudent] = useState<StudentSelectOption | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showSourateDropdown, setShowSourateDropdown] = useState(false);
  const [isEditingSchoolYear, setIsEditingSchoolYear] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // État du formulaire avec valeurs par défaut
  const [formData, setFormData] = useState<CreateEvaluationData>({
    student_id: '',
    evaluation_date: new Date().toISOString().split('T')[0],
    school_year_id: currentSchoolYear?.id || '',
    class_id: '',
    current_sourate: '',
    sourate_number: 0,
    current_jouzou: 0,
    current_hizb: 0,
    pages_memorized: 0,
    verses_memorized: 0,
    memorization_status: 'en_cours',
    memorization_grade: 0,
    recitation_grade: 0,
    tajwid_grade: 0,
    behavior_grade: 0,
    attendance_rate: 100,
    student_behavior: 'bon',
    teacher_comment: '',
    next_month_objective: '',
    difficulties: '',
    strengths: ''
  });

  // LISTE COMPLÈTE DES SOURATES
  const sourates = useMemo((): Sourate[] => [
    { number: 1, name: 'Al-Fatiha', arabicName: 'الفاتحة', meaning: 'L\'Ouverture', verses: 7 },
    { number: 2, name: 'Al-Baqara', arabicName: 'البقرة', meaning: 'La Vache', verses: 286 },
    { number: 3, name: 'Al-Imran', arabicName: 'آل عمران', meaning: 'La Famille d\'Imran', verses: 200 },
    { number: 4, name: 'An-Nisa', arabicName: 'النساء', meaning: 'Les Femmes', verses: 176 },
    { number: 5, name: 'Al-Maida', arabicName: 'المائدة', meaning: 'La Table Servie', verses: 120 },
    { number: 6, name: 'Al-Anam', arabicName: 'الأنعام', meaning: 'Les Bestiaux', verses: 165 },
    { number: 7, name: 'Al-Araf', arabicName: 'الأعراف', meaning: 'Al-Araf', verses: 206 },
    { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', meaning: 'Le Butin', verses: 75 },
    { number: 9, name: 'At-Tawba', arabicName: 'التوبة', meaning: 'Le Repentir', verses: 129 },
    { number: 10, name: 'Yunus', arabicName: 'يونس', meaning: 'Jonas', verses: 109 },
    { number: 11, name: 'Hud', arabicName: 'هود', meaning: 'Houd', verses: 123 },
    { number: 12, name: 'Yusuf', arabicName: 'يوسف', meaning: 'Joseph', verses: 111 },
    { number: 13, name: 'Ar-Rad', arabicName: 'الرعد', meaning: 'Le Tonnerre', verses: 43 },
    { number: 14, name: 'Ibrahim', arabicName: 'إبراهيم', meaning: 'Abraham', verses: 52 },
    { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', meaning: 'Al-Hijr', verses: 99 },
    { number: 16, name: 'An-Nahl', arabicName: 'النحل', meaning: 'Les Abeilles', verses: 128 },
    { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', meaning: 'Le Voyage Nocturne', verses: 111 },
    { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', meaning: 'La Caverne', verses: 110 },
    { number: 19, name: 'Maryam', arabicName: 'مريم', meaning: 'Marie', verses: 98 },
    { number: 20, name: 'Ta-Ha', arabicName: 'طه', meaning: 'Ta-Ha', verses: 135 }
  ], []);

  // RÉSULTATS DE RECHERCHE OPTIMISÉS
  const searchResults = useMemo(() => {
    if (studentSearch.length === 0) return students.slice(0, 8);
    
    const searchLower = studentSearch.toLowerCase().trim();
    return students.filter(student => {
      return (
        student.display_name?.toLowerCase().includes(searchLower) ||
        student.full_name?.toLowerCase().includes(searchLower) ||
        student.first_name?.toLowerCase().includes(searchLower) ||
        student.last_name?.toLowerCase().includes(searchLower) ||
        student.student_number?.toLowerCase().includes(searchLower) ||
        student.current_class?.name?.toLowerCase().includes(searchLower)
      );
    }).slice(0, 8);
  }, [studentSearch, students]);

  const filteredSourates = useMemo(() => {
    if (formData.current_sourate.length === 0) return sourates.slice(0, 8);
    
    const searchLower = formData.current_sourate.toLowerCase().trim();
    return sourates.filter(sourate =>
      sourate.name.toLowerCase().includes(searchLower) ||
      sourate.meaning?.toLowerCase().includes(searchLower) ||
      sourate.number.toString().includes(searchLower)
    ).slice(0, 8);
  }, [formData.current_sourate, sourates]);

  // CALCUL AUTOMATIQUE DE LA NOTE GLOBALE
  const calculateOverallGrade = useMemo(() => {
    const grades = [
      formData.memorization_grade,
      formData.recitation_grade,
      formData.tajwid_grade,
      formData.behavior_grade
    ].filter(grade => grade !== null && grade !== undefined && grade > 0 && !isNaN(Number(grade)));

    if (grades.length === 0) return '0.0';
    const sum = grades.reduce((acc, grade) => acc + Number(grade), 0);
    return (sum / grades.length).toFixed(1);
  }, [formData.memorization_grade, formData.recitation_grade, formData.tajwid_grade, formData.behavior_grade]);

  // VALIDATION DU FORMULAIRE
  const validationErrors = useMemo(() => {
    const errors = [];
    
    if (!formData.student_id?.trim()) {
      errors.push('Veuillez sélectionner un étudiant');
    }
    
    if (!formData.current_sourate?.trim()) {
      errors.push('Veuillez indiquer la sourate actuelle');
    } else if (formData.current_sourate.trim().length < 2) {
      errors.push('Le nom de la sourate doit faire au moins 2 caractères');
    }
    
    // Validation des numéros avec gestion des 0
    if (formData.sourate_number && (formData.sourate_number < 1 || formData.sourate_number > 114)) {
      errors.push('Numéro de sourate invalide (1-114)');
    }
    if (formData.current_jouzou && (formData.current_jouzou < 1 || formData.current_jouzou > 30)) {
      errors.push('Jouzou invalide (1-30)');
    }
    if (formData.current_hizb && (formData.current_hizb < 1 || formData.current_hizb > 60)) {
      errors.push('Hizb invalide (1-60)');
    }
    
    // Validation des notes (0-20)
    const gradeFields = [
      { field: 'memorization_grade', label: 'Note de mémorisation' },
      { field: 'recitation_grade', label: 'Note de récitation' },
      { field: 'tajwid_grade', label: 'Note de tajwid' },
      { field: 'behavior_grade', label: 'Note de comportement' }
    ];
    
    gradeFields.forEach(({ field, label }) => {
      const value = formData[field as keyof CreateEvaluationData] as number;
      if (value !== null && value !== undefined && (value < 0 || value > 20)) {
        errors.push(`${label} doit être entre 0 et 20`);
      }
    });
    
    // Validation taux de présence
    if (formData.attendance_rate !== undefined && 
        (formData.attendance_rate < 0 || formData.attendance_rate > 100)) {
      errors.push('Taux de présence invalide (0-100%)');
    }
    
    return errors;
  }, [formData]);

  const isValid = validationErrors.length === 0 && formData.student_id.trim() !== '' && formData.current_sourate.trim() !== '';

  // *** CORRECTION PRINCIPALE : GESTIONNAIRES POUR TEXTAREAS SANS TRIM ***
  const handleTextareaChange = useCallback((field: keyof CreateEvaluationData) => {
    return (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      console.log(`MODAL: Changement textarea ${field}:`, value);
      
      // *** FIX MAJEUR : NE PAS TRIMMER LES TEXTAREAS ***
      // Garder la valeur exacte avec espaces et sauts de ligne
      setFormData(prev => ({ 
        ...prev, 
        [field]: value // Valeur brute sans modification
      }));
    };
  }, []);

  // GESTIONNAIRES OPTIMISÉS
  const handleSelectStudent = useCallback((student: StudentSelectOption) => {
    console.log('MODAL: Étudiant sélectionné:', student);
    
    setSelectedStudent(student);
    setStudentSearch(student.display_name || student.full_name || `${student.first_name} ${student.last_name}`);
    setFormData(prev => ({ 
      ...prev, 
      student_id: student.id,
      class_id: student.current_class?.id || ''
    }));
    setShowStudentDropdown(false);
  }, []);

  const handleSelectSourate = useCallback((sourate: Sourate) => {
    console.log('MODAL: Sourate sélectionnée:', sourate);
    
    setFormData(prev => ({
      ...prev,
      current_sourate: sourate.name,
      sourate_number: sourate.number,
      verses_memorized: sourate.verses || 0
    }));
    setShowSourateDropdown(false);
  }, []);

  const handleSourateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      current_sourate: value,
      // Réinitialiser le numéro si on tape manuellement
      sourate_number: value === '' ? 0 : prev.sourate_number
    }));
  }, []);

  const handleSchoolYearChange = useCallback((schoolYearId: string) => {
    setFormData(prev => ({ ...prev, school_year_id: schoolYearId }));
    setIsEditingSchoolYear(false);
  }, []);

  // *** CORRECTION MAJEURE : GESTIONNAIRE D'INPUT CORRIGÉ POUR NE PAS TRIMMER LES COMMENTAIRES ***
  const handleInputChange = useCallback((field: keyof CreateEvaluationData, value: any) => {
    console.log(`MODAL: Changement ${field}:`, value);
    
    let processedValue = value;
    
    // Traitement spécial pour les champs numériques
    if (['sourate_number', 'current_jouzou', 'current_hizb', 'pages_memorized', 'verses_memorized', 
         'memorization_grade', 'recitation_grade', 'tajwid_grade', 'behavior_grade', 'attendance_rate'].includes(field)) {
      
      if (value === '' || value === null || value === undefined) {
        processedValue = 0; // Valeur par défaut au lieu d'undefined
      } else {
        const numValue = Number(value);
        processedValue = isNaN(numValue) ? 0 : numValue;
      }
    }
    
    // *** FIX CRITIQUE : NE PAS TRIMMER LES CHAMPS DE COMMENTAIRES ***
    // Pour les champs texte normaux (pas les commentaires/textareas)
    if (['current_sourate', 'memorization_status', 'student_behavior'].includes(field)) {
      processedValue = String(value || '').trim();
    }
    
    // *** NOUVEAU : Pour les commentaires, garder la valeur brute ***
    if (['teacher_comment', 'next_month_objective', 'difficulties', 'strengths'].includes(field)) {
      processedValue = String(value || ''); // PAS DE TRIM !
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  }, []);

  const handleStudentSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStudentSearch(value);
    
    // Si on efface, réinitialiser la sélection
    if (value === '') {
      setSelectedStudent(null);
      setFormData(prev => ({ ...prev, student_id: '', class_id: '' }));
    }
  }, []);

  // *** GESTIONNAIRE DE SOUMISSION CORRIGÉ POUR PRÉSERVER LES ESPACES ***
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || loading || !isValid) {
      console.log('MODAL: Soumission bloquée:', { submitting, loading, isValid });
      return;
    }
    
    setSubmitting(true);
    
    try {
      console.log('MODAL: Préparation des données pour soumission...');
      console.log('MODAL: FormData brut:', formData);
      
      // *** FIX MAJEUR : NETTOYAGE SÉLECTIF - PRÉSERVER LES ESPACES DANS LES COMMENTAIRES ***
      const cleanedData: CreateEvaluationData = {
        student_id: formData.student_id.trim(),
        evaluation_date: formData.evaluation_date || new Date().toISOString().split('T')[0],
        school_year_id: formData.school_year_id?.trim() || currentSchoolYear?.id || '',
        class_id: formData.class_id?.trim() || selectedStudent?.current_class?.id || '',
        current_sourate: formData.current_sourate.trim(),
        
        // Gestion des nombres - éviter les undefined
        sourate_number: formData.sourate_number && formData.sourate_number > 0 ? Number(formData.sourate_number) : undefined,
        current_jouzou: formData.current_jouzou && formData.current_jouzou > 0 ? Number(formData.current_jouzou) : undefined,
        current_hizb: formData.current_hizb && formData.current_hizb > 0 ? Number(formData.current_hizb) : undefined,
        pages_memorized: Number(formData.pages_memorized) || 0,
        verses_memorized: Number(formData.verses_memorized) || 0,
        
        // Notes - seulement si > 0
        memorization_grade: formData.memorization_grade && formData.memorization_grade > 0 ? Number(formData.memorization_grade) : undefined,
        recitation_grade: formData.recitation_grade && formData.recitation_grade > 0 ? Number(formData.recitation_grade) : undefined,
        tajwid_grade: formData.tajwid_grade && formData.tajwid_grade > 0 ? Number(formData.tajwid_grade) : undefined,
        behavior_grade: formData.behavior_grade && formData.behavior_grade > 0 ? Number(formData.behavior_grade) : undefined,
        
        // Autres champs
        memorization_status: formData.memorization_status || 'en_cours',
        attendance_rate: Number(formData.attendance_rate) || 100,
        student_behavior: formData.student_behavior || 'bon',
        
        // *** CORRECTION CRITIQUE : COMMENTAIRES - PRÉSERVER LES ESPACES ***
        // Ne trimmer que si la chaîne n'est que des espaces, sinon garder les espaces significatifs
        teacher_comment: formData.teacher_comment && formData.teacher_comment.trim() !== '' ? formData.teacher_comment : undefined,
        next_month_objective: formData.next_month_objective && formData.next_month_objective.trim() !== '' ? formData.next_month_objective : undefined,
        difficulties: formData.difficulties && formData.difficulties.trim() !== '' ? formData.difficulties : undefined,
        strengths: formData.strengths && formData.strengths.trim() !== '' ? formData.strengths : undefined
      };
      
      // VALIDATION FINALE AVANT ENVOI
      if (!cleanedData.student_id) {
        throw new Error('ID étudiant manquant');
      }
      
      if (!cleanedData.current_sourate) {
        throw new Error('Nom de la sourate manquant');
      }
      
      if (!cleanedData.school_year_id) {
        throw new Error('Année scolaire manquante');
      }
      
      // Supprimer les propriétés undefined pour éviter les erreurs JSON
      const finalData = Object.fromEntries(
        Object.entries(cleanedData).filter(([_, value]) => value !== undefined)
      ) as CreateEvaluationData;
      
      console.log('MODAL: Données finales nettoyées:', finalData);
      console.log('MODAL: Commentaires préservés:', {
        teacher_comment: finalData.teacher_comment,
        next_month_objective: finalData.next_month_objective,
        difficulties: finalData.difficulties,
        strengths: finalData.strengths
      });
      
      // APPEL DE L'API
      await onSubmit(finalData);
      
      console.log('MODAL: Soumission réussie');
      
    } catch (error) {
      console.error('MODAL: Erreur lors de la soumission:', error);
      throw error; // Laisser le parent gérer l'erreur
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSubmit, submitting, loading, isValid, currentSchoolYear, selectedStudent]);

  // RÉINITIALISATION DU FORMULAIRE
  const resetForm = useCallback(() => {
    console.log('MODAL: Réinitialisation du formulaire');
    
    setSelectedStudent(null);
    setStudentSearch('');
    setShowStudentDropdown(false);
    setShowSourateDropdown(false);
    setIsEditingSchoolYear(false);
    setSubmitting(false);
    
    setFormData({
      student_id: '',
      evaluation_date: new Date().toISOString().split('T')[0],
      school_year_id: currentSchoolYear?.id || '',
      class_id: '',
      current_sourate: '',
      sourate_number: 0,
      current_jouzou: 0,
      current_hizb: 0,
      pages_memorized: 0,
      verses_memorized: 0,
      memorization_status: 'en_cours',
      memorization_grade: 0,
      recitation_grade: 0,
      tajwid_grade: 0,
      behavior_grade: 0,
      attendance_rate: 100,
      student_behavior: 'bon',
      teacher_comment: '',
      next_month_objective: '',
      difficulties: '',
      strengths: ''
    });
  }, [currentSchoolYear]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  }, [resetForm, onClose, submitting]);

  // GESTION DES DROPDOWNS
  useEffect(() => {
    setShowStudentDropdown(searchResults.length > 0 && studentSearch.length > 0 && !selectedStudent);
  }, [searchResults.length, studentSearch.length, selectedStudent]);

  useEffect(() => {
    setShowSourateDropdown(filteredSourates.length > 0 && formData.current_sourate.length > 0);
  }, [filteredSourates.length, formData.current_sourate.length]);

  // Mise à jour de l'année scolaire courante
  useEffect(() => {
    if (currentSchoolYear && !formData.school_year_id) {
      setFormData(prev => ({ ...prev, school_year_id: currentSchoolYear.id }));
    }
  }, [currentSchoolYear, formData.school_year_id]);

  // Effet de nettoyage au succès
  useEffect(() => {
    if (success && !submitting && !loading) {
      const timeoutId = setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [success, submitting, loading, resetForm, onClose]);

  // Fermeture des dropdowns lors du clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowStudentDropdown(false);
        setShowSourateDropdown(false);
      }
    };

    if (showStudentDropdown || showSourateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStudentDropdown, showSourateDropdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nouvelle Évaluation</h2>
              <p className="text-sm text-gray-600">
                Créer une évaluation académique • {students.length} étudiants disponibles
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages de feedback */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Erreur lors de la création</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-green-700 font-medium">Évaluation créée avec succès</p>
              <p className="text-green-600 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Contenu scrollable */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Section: Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Informations Générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date d'évaluation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'évaluation *
                  </label>
                  <input
                    type="date"
                    value={formData.evaluation_date}
                    onChange={(e) => handleInputChange('evaluation_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Année scolaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année scolaire *
                  </label>
                  {isEditingSchoolYear ? (
                    <select
                      value={formData.school_year_id}
                      onChange={(e) => handleSchoolYearChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onBlur={() => setIsEditingSchoolYear(false)}
                      autoFocus
                      disabled={submitting}
                    >
                      <option value="">Sélectionnez une année</option>
                      {schoolYears.map(year => (
                        <option key={year.id} value={year.id}>{year.display_name}</option>
                      ))}
                    </select>
                  ) : (
                    <div 
                      className={`flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg transition-colors ${
                        submitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-blue-100'
                      }`}
                      onClick={() => !submitting && setIsEditingSchoolYear(true)}
                    >
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700 font-medium flex-1">
                        {schoolYears.find(y => y.id === formData.school_year_id)?.display_name || 'Cliquez pour sélectionner'}
                      </span>
                      {currentSchoolYear?.id === formData.school_year_id && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          Actuelle
                        </span>
                      )}
                      {!submitting && <Edit3 className="w-4 h-4 text-blue-500" />}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Sélection de l'étudiant */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Sélection de l'Étudiant *
              </h3>
              
              <div className="relative dropdown-container">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un étudiant par nom ou numéro..."
                    value={studentSearch}
                    onChange={handleStudentSearchChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg transition-all duration-200 ${
                      selectedStudent
                        ? 'border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    required
                    disabled={submitting}
                  />
                  {selectedStudent && (
                    <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  )}
                  {!selectedStudent && showStudentDropdown && (
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  )}
                </div>

                {/* Dropdown étudiants amélioré */}
                {showStudentDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-20 max-h-72 overflow-hidden">
                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map((student, index) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className={`w-full px-4 py-4 text-left hover:bg-blue-50 flex items-center gap-3 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                            index === 0 ? 'bg-blue-25' : ''
                          }`}
                          disabled={submitting}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {student.first_name?.charAt(0) || 'E'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {student.display_name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Hash className="w-3 h-3" />
                              <span className="font-medium">{student.student_number}</span>
                              {student.current_class?.name && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    {student.current_class.name}
                                  </span>
                                </>
                              )}
                              {student.age && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">{student.age} ans</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Étudiant sélectionné */}
                {selectedStudent && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                        {selectedStudent.first_name?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {selectedStudent.display_name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          <span className="font-medium">{selectedStudent.student_number}</span>
                          {selectedStudent.current_class?.name && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {selectedStudent.current_class.name}
                              </span>
                            </>
                          )}
                          {selectedStudent.age && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{selectedStudent.age} ans</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Sélectionné
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message si aucun étudiant */}
                {students.length === 0 && (
                  <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800 text-sm font-medium">
                        Aucun étudiant disponible
                      </p>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Veuillez vérifier que des étudiants sont enregistrés dans le système.
                    </p>
                  </div>
                )}

                {/* Message si aucun résultat de recherche */}
                {students.length > 0 && searchResults.length === 0 && studentSearch.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-600 text-sm">
                        Aucun étudiant trouvé pour "<span className="font-medium">{studentSearch}</span>"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Progression coranique */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Progression Coranique
              </h3>

              {/* Sourate actuelle avec dropdown amélioré */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sourate actuelle *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Al-Fatiha, Ya-Sin..."
                    value={formData.current_sourate}
                    onChange={handleSourateChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg transition-all duration-200 ${
                      formData.sourate_number && formData.sourate_number > 0
                        ? 'border-green-300 bg-green-50 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    required
                    disabled={submitting}
                  />
                  {formData.sourate_number && formData.sourate_number > 0 ? (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        #{formData.sourate_number}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ) : showSourateDropdown ? (
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  ) : (
                    <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  )}
                </div>
                
                {/* Dropdown sourates amélioré */}
                {showSourateDropdown && filteredSourates.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-20 max-h-64 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSourates.map((sourate, index) => (
                        <button
                          key={sourate.number}
                          type="button"
                          onClick={() => handleSelectSourate(sourate)}
                          className={`w-full px-4 py-3 text-left hover:bg-green-50 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                            index === 0 ? 'bg-green-25' : ''
                          }`}
                          disabled={submitting}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {sourate.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {sourate.name}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="font-medium text-green-600">{sourate.arabicName}</span>
                                {sourate.meaning && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="italic">{sourate.meaning}</span>
                                  </>
                                )}
                                {sourate.verses && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      {sourate.verses} versets
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de sourate
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="114"
                    placeholder="1-114"
                    value={formData.sourate_number && formData.sourate_number > 0 ? formData.sourate_number : ''}
                    onChange={(e) => handleInputChange('sourate_number', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jouzou actuel
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="1-30"
                    value={formData.current_jouzou && formData.current_jouzou > 0 ? formData.current_jouzou : ''}
                    onChange={(e) => handleInputChange('current_jouzou', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hizb actuel
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="1-60"
                    value={formData.current_hizb && formData.current_hizb > 0 ? formData.current_hizb : ''}
                    onChange={(e) => handleInputChange('current_hizb', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pages mémorisées
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.pages_memorized || 0}
                    onChange={(e) => handleInputChange('pages_memorized', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versets mémorisés
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.verses_memorized || 0}
                    onChange={(e) => handleInputChange('verses_memorized', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de mémorisation
                </label>
                <select
                  value={formData.memorization_status}
                  onChange={(e) => handleInputChange('memorization_status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="non_commence">Non commencé</option>
                  <option value="en_cours">En cours</option>
                  <option value="memorise">Mémorisé</option>
                  <option value="perfectionne">Perfectionné</option>
                  <option value="a_reviser">À réviser</option>
                </select>
              </div>
            </div>

            {/* Section: Notes d'évaluation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Notes d'Évaluation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mémorisation (/20)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="0-20"
                    value={formData.memorization_grade && formData.memorization_grade > 0 ? formData.memorization_grade : ''}
                    onChange={(e) => handleInputChange('memorization_grade', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Récitation (/20)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="0-20"
                    value={formData.recitation_grade && formData.recitation_grade > 0 ? formData.recitation_grade : ''}
                    onChange={(e) => handleInputChange('recitation_grade', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tajwid (/20)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="0-20"
                    value={formData.tajwid_grade && formData.tajwid_grade > 0 ? formData.tajwid_grade : ''}
                    onChange={(e) => handleInputChange('tajwid_grade', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comportement (/20)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="0-20"
                    value={formData.behavior_grade && formData.behavior_grade > 0 ? formData.behavior_grade : ''}
                    onChange={(e) => handleInputChange('behavior_grade', e.target.value ? Number(e.target.value) : 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Note globale calculée */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Note globale calculée :</span>
                  <span className="text-xl font-bold text-blue-600">
                    {calculateOverallGrade}/20
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Moyenne automatique des notes saisies
                </div>
              </div>
            </div>

            {/* Section: Informations complémentaires */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Informations Complémentaires
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux de présence (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.attendance_rate || 100}
                    onChange={(e) => handleInputChange('attendance_rate', e.target.value ? Number(e.target.value) : 100)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comportement général
                  </label>
                  <select
                    value={formData.student_behavior}
                    onChange={(e) => handleInputChange('student_behavior', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="tres_bon">Très bon</option>
                    <option value="bon">Bon</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
              </div>

              {/* *** SECTION COMMENTAIRES CORRIGÉE - ACCEPTE LES ESPACES *** */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire de l'enseignant
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Observations générales sur les progrès de l'étudiant..."
                    value={formData.teacher_comment || ''}
                    onChange={handleTextareaChange('teacher_comment')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif mois prochain
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Objectifs à atteindre..."
                      value={formData.next_month_objective || ''}
                      onChange={handleTextareaChange('next_month_objective')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficultés observées
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Points à améliorer..."
                      value={formData.difficulties || ''}
                      onChange={handleTextareaChange('difficulties')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points forts
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Qualités et réussites..."
                      value={formData.strengths || ''}
                      onChange={handleTextareaChange('strengths')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section de validation et résumé */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Résumé de l'Évaluation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Étudiant sélectionné</div>
                  <div className="text-sm text-gray-600">
                    {selectedStudent ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="truncate">{selectedStudent.display_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Aucun étudiant sélectionné
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Année scolaire</div>
                  <div className="text-sm text-gray-600">
                    {formData.school_year_id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="truncate">
                          {schoolYears.find(y => y.id === formData.school_year_id)?.display_name || 'Année définie'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Année scolaire manquante
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Progression</div>
                  <div className="text-sm text-gray-600">
                    {formData.current_sourate ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="truncate">{formData.current_sourate}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Sourate requise
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation des erreurs */}
              {!isValid && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Corrections nécessaires :
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Debug info pour vérifier les espaces */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-medium text-blue-700 mb-2">🐛 Debug - Commentaires avec espaces :</div>
                  <div className="space-y-1 text-xs text-blue-600">
                    <div>Teacher comment: "{formData.teacher_comment}" (longueur: {(formData.teacher_comment || '').length})</div>
                    <div>Objectifs: "{formData.next_month_objective}" (longueur: {(formData.next_month_objective || '').length})</div>
                    <div>Difficultés: "{formData.difficulties}" (longueur: {(formData.difficulties || '').length})</div>
                    <div>Points forts: "{formData.strengths}" (longueur: {(formData.strengths || '').length})</div>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer avec boutons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {isValid ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Prêt à soumettre
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.length} erreur(s) à corriger
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || submitting || !isValid}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                       flex items-center gap-2 font-medium"
            >
              {submitting || loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Créer l'Évaluation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvaluationModal;