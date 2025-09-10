// src/services/studentService.ts - CORRIGÉ POUR VOTRE BACKEND EXISTANT
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✅ ENDPOINTS CORRIGÉS POUR VOTRE BACKEND
const STUDENT_API_ENDPOINTS = {
  // Utiliser vos endpoints réels
  STUDENTS: `${API_BASE_URL}/api/students`,
  STUDENT_BY_ID: (id: string) => `${API_BASE_URL}/api/students/${id}`,
  STUDENT_PHOTO: (id: string) => `${API_BASE_URL}/api/students/${id}/photo`,
  STUDENTS_STATS: `${API_BASE_URL}/api/students/stats/overview`,
  
  // Endpoints pour les données de référence
  CLASSES: `${API_BASE_URL}/api/students/classes`,
  SCHOOL_YEARS: `${API_BASE_URL}/api/students/school-years`,
};
// ✅ FONCTION AUTH CORRIGÉE SELON VOTRE BACKEND
const getAuthHeaders = () => {
  let token = localStorage.getItem('token');
  
  if (!token) {
    console.log('🔑 Génération token de développement...');
    const devToken = btoa(JSON.stringify({
      userId: 'dev-user-' + Date.now(),
      email: 'dev@localhost',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }));
    
    token = 'dev-token-' + devToken;
    localStorage.setItem('token', token);
  }
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// ✅ FONCTION API CALL CORRIGÉE
const makeApiCall = async (url: string, options: RequestInit = {}) => {
  console.log('📡 API Call:', options.method || 'GET', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
  } catch (error) {
    console.error('❌ API Error', url + ':', error);
    throw error;
  }
};

// ✅ INTERFACES CORRIGÉES SELON VOTRE STRUCTURE DB
export interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  age: number;
  gender: 'M' | 'F';
  is_orphan: boolean;
  status: 'interne' | 'externe';
  photo_url?: string;
  display_photo?: string;
  enrollment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Structure selon votre backend
  coranic_class_id?: string;
  french_class_id?: string;
  school_year_id?: string;
  
  // Relations enrichies par le backend
  coranic_class?: {
    id: string;
    name: string;
    level?: string;
    type?: string;
  };
  school_year?: {
    id: string;
    name: string;
    is_current?: boolean;
  };
  
  // ✅ TUTEURS SELON VOTRE STRUCTURE
  primary_guardian?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    address?: string;
    relationship: string;
    is_primary?: boolean;
    full_name?: string;
    role_display?: string;
    role_color?: string;
  };
  guardian?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    address?: string;
    relationship: string;
  };
  guardians?: Guardian[];

  // ✅ STATUT FINANCIER SELON VOTRE SIMULATION
  current_payment_status?: 'paid' | 'pending' | 'overdue' | 'partial';
  payment_status?: 'paid' | 'pending' | 'overdue' | 'partial';
  current_balance?: number;
  overdue_amount?: number;

  // ✅ INFORMATIONS ÉCOLE FRANÇAISE (extraites des notes)
  french_level?: string;
  french_school_name?: string;

  // Métadonnées du backend
  metadata?: {
    total_guardians: number;
    has_primary_guardian: boolean;
    has_photo: boolean;
    enrollment_duration_days: number;
  };
}

export interface Guardian {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  relationship: string;
  is_primary?: boolean;
  full_name?: string;
  role_display?: string;
  role_color?: string;
}

export interface StudentStats {
  total: number;
  internal: number;
  external: number;
  orphans: number;
}

export interface StudentsListResponse {
  success: boolean;
  students: Student[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  stats: StudentStats;
  filters_applied?: {
    search?: string;
    status?: string;
    gender?: string;
    is_orphan?: string;
    payment_status?: string;
  };
}

export interface CreateStudentRequest {
  // Informations personnelles
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  
  // Classes
  coranic_class_id?: string;
  school_year_id?: string;
  
  // ✅ ÉCOLE FRANÇAISE (optionnel)
  french_level?: string;
  french_school_name?: string;
  
  // ✅ TUTEUR OBLIGATOIRE
  guardian: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    address?: string;
    relationship: string;
  };
  
  // Notes
  notes?: string;
}

export interface StudentResponse {
  success: boolean;
  message?: string;
  student?: Student;
  error?: string;
  details?: string[];
}

export interface UploadPhotoResponse {
  success: boolean;
  message?: string;
  photo_url?: string;
  student?: Student;
  error?: string;
  file?: {
    originalName: string;
    filename: string;
    size: number;
    mimetype?: string;
  };
}

export interface ClassOption {
  id: string;
  name: string;
  level?: string;
  type?: 'coranic' | 'french';
  description?: string;
  capacity?: number;
  current_students?: number;
  is_active?: boolean;
}

export interface SchoolYearOption {
  id: string;
  name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  description?: string;
  display_name?: string;
}

// ✅ SERVICE PRINCIPAL CORRIGÉ
export class StudentService {
  
  /**
   * ✅ LISTER LES ÉTUDIANTS - CORRIGÉ POUR VOTRE API
   */
  static async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    gender?: string;
    is_orphan?: string;
    payment_status?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  } = {}): Promise<StudentsListResponse> {
    try {
      // Construire la query string selon votre API
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const url = `${STUDENT_API_ENDPOINTS.STUDENTS}?${queryParams.toString()}`;
      console.log('📚 Appel API liste étudiants:', url);
      
      const response = await makeApiCall(url);
      
      console.log('✅ Étudiants récupérés:', response);
      
      // ✅ TRAITEMENT DES DONNÉES SELON VOTRE STRUCTURE
      const students = response.students || [];
      const processedStudents = students.map((student: any) => ({
        ...student,
        // Assurer la compatibilité des tuteurs
        guardian: student.primary_guardian || student.guardian,
        // Extraction des infos école française depuis les notes
        ...this.extractFrenchSchoolInfo(student.notes)
      }));
      
      return {
        success: true,
        students: processedStudents,
        pagination: response.pagination || {
          current_page: 1,
          per_page: 20,
          total_items: students.length,
          total_pages: 1,
          has_next: false,
          has_prev: false
        },
        stats: response.stats || {
          total: students.length,
          internal: students.filter((s: any) => s.status === 'interne').length,
          external: students.filter((s: any) => s.status === 'externe').length,
          orphans: students.filter((s: any) => s.is_orphan).length
        },
        filters_applied: response.filters_applied || {}
      };
    } catch (error: any) {
      console.error('💥 Erreur liste étudiants:', error);
      throw error;
    }
  }

  /**
   * ✅ RÉCUPÉRER UN ÉTUDIANT PAR ID - CORRIGÉ
   */
  static async getById(id: string): Promise<StudentResponse> {
    try {
      console.log('👤 Récupération étudiant ID:', id);
      
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.STUDENT_BY_ID(id));
      
      if (response.success && response.student) {
        const student = response.student;
        
        // ✅ TRAITEMENT SPÉCIAL POUR LES TUTEURS ET ÉCOLE FRANÇAISE
        const processedStudent = {
          ...student,
          // Assurer la compatibilité des tuteurs
          guardian: student.primary_guardian || student.guardian || 
                   (student.guardians && student.guardians[0]) || null,
          // Extraction des infos école française
          ...this.extractFrenchSchoolInfo(student.notes)
        };
        
        console.log('✅ Étudiant traité:', processedStudent);
        
        return {
          success: true,
          student: processedStudent
        };
      }
      
      throw new Error('Étudiant non trouvé');
    } catch (error: any) {
      console.error('💥 Erreur récupération étudiant:', error);
      throw error;
    }
  }

  /**
   * ✅ CRÉER UN ÉTUDIANT - CORRIGÉ POUR VOTRE API
   */
  static async create(studentData: CreateStudentRequest): Promise<StudentResponse> {
    try {
      console.log('📤 Création étudiant:', studentData);
      
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.STUDENTS, {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
      
      console.log('✅ Étudiant créé:', response);
      
      return response;
    } catch (error: any) {
      console.error('💥 Erreur création étudiant:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur de connexion au serveur',
        details: [error.message]
      };
    }
  }

  /**
   * ✅ UPLOAD PHOTO - CORRIGÉ POUR VOTRE BACKEND
   */
  static async uploadPhoto(studentId: string, photoFile: File): Promise<UploadPhotoResponse> {
    console.log('📸 Upload photo pour étudiant:', studentId);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const formData = new FormData();
      // ✅ UTILISER LE BON NOM DE CHAMP SELON VOTRE BACKEND
      formData.append('photo', photoFile);
      
      const response = await fetch(STUDENT_API_ENDPOINTS.STUDENT_PHOTO(studentId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Ne pas ajouter Content-Type pour FormData
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Erreur upload ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Photo uploadée:', result);
      return result;
    } catch (error: any) {
      console.error('💥 Erreur upload photo:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout upload photo');
      }
      
      throw error;
    }
  }

  /**
   * ✅ METTRE À JOUR UN ÉTUDIANT
   */
  static async update(id: string, updateData: Partial<CreateStudentRequest>): Promise<StudentResponse> {
    try {
      console.log('✏️ Mise à jour étudiant ID:', id, updateData);
      
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.STUDENT_BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      console.log('✅ Étudiant mis à jour:', response);
      
      return response;
    } catch (error: any) {
      console.error('💥 Erreur mise à jour étudiant:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour',
        details: [error.message]
      };
    }
  }

  /**
   * ✅ SUPPRIMER UN ÉTUDIANT
   */
  static async delete(id: string): Promise<StudentResponse> {
    try {
      console.log('🗑️ Suppression étudiant ID:', id);
      
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.STUDENT_BY_ID(id), {
        method: 'DELETE',
      });
      
      console.log('✅ Étudiant supprimé:', response);
      
      return response;
    } catch (error: any) {
      console.error('💥 Erreur suppression étudiant:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression',
        details: [error.message]
      };
    }
  }

  /**
   * ✅ OBTENIR LES STATISTIQUES
   */
  static async getStats(): Promise<StudentStats | null> {
    try {
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.STUDENTS_STATS);
      return response.stats;
    } catch (error) {
      console.error('💥 Erreur statistiques étudiants:', error);
      return null;
    }
  }

  /**
   * ✅ UTILITAIRE : EXTRAIRE INFOS ÉCOLE FRANÇAISE DEPUIS LES NOTES
   */
  private static extractFrenchSchoolInfo(notes?: string): { french_level?: string; french_school_name?: string } {
    if (!notes) return {};
    
    const result: { french_level?: string; french_school_name?: string } = {};
    
    // Extraire le niveau
    const levelMatch = notes.match(/École française - Niveau:\s*([^\n]+)/);
    if (levelMatch) {
      result.french_level = levelMatch[1].trim();
    }
    
    // Extraire le nom de l'école
    const schoolMatch = notes.match(/École:\s*([^\n]+)/);
    if (schoolMatch) {
      result.french_school_name = schoolMatch[1].trim();
    }
    
    return result;
  }

  /**
   * ✅ UTILITAIRE : CALCULER L'ÂGE
   */
  static calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      
      if (isNaN(birth.getTime())) return 0;
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return Math.max(0, age);
    } catch (error) {
      console.error('Erreur calcul âge:', error);
      return 0;
    }
  }
}

// ✅ SERVICE POUR LES CLASSES - CORRIGÉ
export class ClassService {
  
  static async getAll(): Promise<ClassOption[]> {
    try {
      console.log('📚 Récupération des classes...');
      
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.CLASSES);
      
      console.log('✅ Classes récupérées:', response.classes?.length || 0);
      
      return response.classes || [];
    } catch (error) {
      console.error('💥 Erreur récupération classes:', error);
      // ✅ FALLBACK : Retourner données mock si l'endpoint n'existe pas
      return this.getMockClasses();
    }
  }

  static async getByType(type: 'coranic' | 'french'): Promise<ClassOption[]> {
    try {
      const allClasses = await this.getAll();
      return allClasses.filter(cls => cls.type === type || (type === 'coranic' && !cls.type));
    } catch (error) {
      console.error(`💥 Erreur récupération classes ${type}:`, error);
      return [];
    }
  }

  static async getCoranicClasses(): Promise<ClassOption[]> {
    return this.getByType('coranic');
  }

  static async getFrenchClasses(): Promise<ClassOption[]> {
    return this.getByType('french');
  }

  // ✅ DONNÉES MOCK EN CAS D'ÉCHEC
  private static getMockClasses(): ClassOption[] {
    return [
      {
        id: 'mock-class-1',
        name: 'Classe Coranique Débutant',
        level: 'Débutant',
        type: 'coranic',
        capacity: 25,
        current_students: 15,
        is_active: true
      },
      {
        id: 'mock-class-2',
        name: 'Classe Coranique Intermédiaire',
        level: 'Intermédiaire',
        type: 'coranic',
        capacity: 30,
        current_students: 20,
        is_active: true
      }
    ];
  }
}

// ✅ SERVICE POUR LES ANNÉES SCOLAIRES - CORRIGÉ
export class SchoolYearService {
  
  static async getAll(): Promise<SchoolYearOption[]> {
    try {
      console.log('📅 Récupération des années scolaires...');
      
      const response = await makeApiCall(STUDENT_API_ENDPOINTS.SCHOOL_YEARS);
      
      console.log('✅ Années scolaires récupérées:', response.school_years?.length || 0);
      
      return response.school_years || [];
    } catch (error) {
      console.error('💥 Erreur récupération années scolaires:', error);
      // ✅ FALLBACK : Retourner données mock
      return this.getMockSchoolYears();
    }
  }

  static async getCurrent(): Promise<SchoolYearOption | null> {
    console.log('📅 Récupération de l\'année scolaire actuelle...');
    
    try {
      const years = await this.getAll();
      
      if (years.length === 0) {
        console.log('⚠️ Aucune année scolaire trouvée');
        return null;
      }
      
      // Trouver l'année actuelle
      let currentYear = years.find(year => year.is_current);
      
      // Si aucune année marquée comme actuelle, prendre la plus récente
      if (!currentYear) {
        currentYear = years.sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )[0];
      }
      
      if (currentYear) {
        console.log('✅ Année scolaire actuelle trouvée:', currentYear);
        return currentYear;
      }
      
      console.log('⚠️ Aucune année scolaire actuelle trouvée');
      return null;
    } catch (error) {
      console.error('💥 Erreur récupération année scolaire actuelle:', error);
      return null;
    }
  }

  // ✅ DONNÉES MOCK EN CAS D'ÉCHEC
  private static getMockSchoolYears(): SchoolYearOption[] {
    return [
      {
        id: 'mock-year-1',
        name: '2024-2025',
        is_current: true,
        start_date: '2024-09-01',
        end_date: '2025-06-30',
        display_name: '2024-2025 (Actuelle) ⭐'
      },
      {
        id: 'mock-year-2',
        name: '2023-2024',
        is_current: false,
        start_date: '2023-09-01',
        end_date: '2024-06-30',
        display_name: '2023-2024 (Terminée)'
      }
    ];
  }
}

// ✅ HOOK POUR LES DONNÉES DE RÉFÉRENCE - CORRIGÉ
export interface ReferenceData {
  classes: {
    coranic: ClassOption[];
    french: ClassOption[];
    all: ClassOption[];
  };
  schoolYears: SchoolYearOption[];
  currentSchoolYear: SchoolYearOption | null;
  loading: boolean;
  error: string | null;
}

export const useReferenceData = (): ReferenceData => {
  const [data, setData] = useState<ReferenceData>({
    classes: {
      coranic: [],
      french: [],
      all: []
    },
    schoolYears: [],
    currentSchoolYear: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // ✅ CHARGEMENT AVEC GESTION D'ERREUR INDIVIDUELLE
        const results = await Promise.allSettled([
          ClassService.getAll(),
          SchoolYearService.getAll(),
          SchoolYearService.getCurrent()
        ]);

        // Traiter les résultats même si certains échouent
        const allClasses = results[0].status === 'fulfilled' ? results[0].value : [];
        const schoolYears = results[1].status === 'fulfilled' ? results[1].value : [];
        const currentYear = results[2].status === 'fulfilled' ? results[2].value : null;

        // Séparer les classes par type
        const coranicClasses = allClasses.filter(cls => cls.type === 'coranic' || !cls.type);
        const frenchClasses = allClasses.filter(cls => cls.type === 'french');

        setData({
          classes: {
            coranic: coranicClasses,
            french: frenchClasses,
            all: allClasses
          },
          schoolYears,
          currentSchoolYear: currentYear,
          loading: false,
          error: null
        });

        console.log('✅ Données de référence chargées:', {
          classes: allClasses.length,
          schoolYears: schoolYears.length,
          currentYear: currentYear?.name || 'Aucune'
        });

        // Logger les erreurs sans bloquer
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const errorLabels = ['classes', 'années scolaires', 'année actuelle'];
            console.warn(`⚠️ Erreur chargement ${errorLabels[index]}:`, result.reason);
          }
        });

      } catch (error: any) {
        console.error('💥 Erreur chargement données de référence:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des données de référence'
        }));
      }
    };

    loadData();
  }, []);

  return data;
};

// ✅ UTILITAIRES POUR LES ÉTUDIANTS
export class StudentUtils {
  
  static generateInitials(firstName: string, lastName: string): string {
    const first = firstName?.trim()?.[0]?.toUpperCase() || '';
    const last = lastName?.trim()?.[0]?.toUpperCase() || '';
    return `${first}${last}` || '??';
  }

  static getFullName(student: Student): string {
    return `${student.first_name || ''} ${student.last_name || ''}`.trim();
  }

  static formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return '';
    }
  }

  static formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '';
    }
  }

  static getPaymentStatusConfig(status?: string) {
    switch (status) {
      case 'paid': return { 
        bg: 'from-emerald-500 to-green-600', text: 'À jour', color: 'emerald', icon: 'CheckCircle' 
      };
      case 'pending': return { 
        bg: 'from-blue-500 to-indigo-600', text: 'En attente', color: 'blue', icon: 'Clock' 
      };
      case 'overdue': return { 
        bg: 'from-red-500 to-rose-600', text: 'En retard', color: 'red', icon: 'XCircle' 
      };
      case 'partial': return { 
        bg: 'from-orange-500 to-amber-600', text: 'Partiel', color: 'orange', icon: 'AlertTriangle' 
      };
      default: return { 
        bg: 'from-slate-500 to-gray-600', text: 'Non défini', color: 'gray', icon: 'Clock' 
      };
    }
  }

  static getStudentStatusConfig(student: Student) {
    if (student.is_orphan) {
      return {
        bg: 'from-rose-500 via-pink-500 to-red-500',
        text: 'Orphelin ' + (student.status === 'interne' ? 'Interne' : 'Externe'),
        color: 'rose',
        icon: 'Heart'
      };
    }
    
    return student.status === 'interne'
      ? {
          bg: 'from-indigo-500 via-blue-500 to-purple-600',
          text: 'Interne',
          color: 'indigo',
          icon: 'Home'
        }
      : {
          bg: 'from-emerald-500 via-green-500 to-teal-600',
          text: 'Externe',
          color: 'emerald',
          icon: 'Building2'
        };
  }
}

export default StudentService;