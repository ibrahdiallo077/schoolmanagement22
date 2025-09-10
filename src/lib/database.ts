// src/lib/database.ts - Version Frontend API (sans PostgreSQL)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types TypeScript (gardés pour compatibilité)
export interface SchoolYear {
  id: number;
  label: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Student {
  id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  birth_date: Date;
  age: number;
  gender?: string;
  is_orphan: boolean;
  is_needy: boolean;
  status: 'nouveau' | 'ancien';
  coranic_class_id?: number;
  french_class_id?: number;
  enrollment_date: Date;
  school_year_id: number;
  photo_url?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Guardian {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  relationship?: string;
  student_id: number;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Staff {
  id: number;
  staff_number: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  address?: string;
  hire_date?: Date;
  status: 'active' | 'inactive' | 'on_leave';
  photo_url?: string;
  qualifications?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Class {
  id: number;
  school_year_id: number;
  name: string;
  level?: string;
  type: 'coranic' | 'french';
  schedule?: string;
  teacher_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'accountant';
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// Service API Frontend (remplace DatabaseService)
export class DatabaseService {
  
  // Utilitaire pour les appels API
  private static async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || `Erreur HTTP ${response.status}`);
    }

    return response.json();
  }

  // === GESTION DES ANNÉES SCOLAIRES ===
  static async getSchoolYears(): Promise<SchoolYear[]> {
    console.log('📅 API: getSchoolYears');
    const response = await this.apiCall<{ success: boolean; data: SchoolYear[] }>('/api/school-years');
    return response.data;
  }

  static async getActiveSchoolYear(): Promise<SchoolYear | null> {
    console.log('📅 API: getActiveSchoolYear');
    const response = await this.apiCall<{ success: boolean; data: SchoolYear | null }>('/api/school-years/active');
    return response.data;
  }

  // === GESTION DES ÉTUDIANTS ===
  static async getStudents(schoolYearId?: number): Promise<Student[]> {
    console.log('👨‍🎓 API: getStudents', schoolYearId);
    const params = schoolYearId ? `?schoolYearId=${schoolYearId}` : '';
    const response = await this.apiCall<{ success: boolean; data: Student[] }>(`/api/students${params}`);
    return response.data;
  }

  static async getStudentById(id: number): Promise<Student | null> {
    console.log('👨‍🎓 API: getStudentById', id);
    try {
      const response = await this.apiCall<{ success: boolean; data: Student }>(`/api/students/${id}`);
      return response.data;
    } catch (error) {
      console.error('Étudiant non trouvé:', error);
      return null;
    }
  }

  static async getStudentByNumber(studentNumber: string): Promise<Student | null> {
    console.log('🔍 API: getStudentByNumber', studentNumber);
    try {
      const response = await this.apiCall<{ success: boolean; data: Student }>(`/api/students/number/${studentNumber}`);
      return response.data;
    } catch (error) {
      console.error('Étudiant non trouvé:', error);
      return null;
    }
  }

  static async createStudent(data: {
    first_name: string;
    last_name: string;
    birth_date: string;
    gender?: string;
    is_orphan?: boolean;
    is_needy?: boolean;
    status?: 'nouveau' | 'ancien';
    coranic_class_id?: number;
    french_class_id?: number;
    enrollment_date: string;
    school_year_id: number;
    photo_url?: string;
    notes?: string;
  }): Promise<Student> {
    console.log('➕ API: createStudent', data);
    const response = await this.apiCall<{ success: boolean; data: Student }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    console.log('✏️ API: updateStudent', id, data);
    const response = await this.apiCall<{ success: boolean; data: Student }>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteStudent(id: number): Promise<boolean> {
    console.log('🗑️ API: deleteStudent', id);
    await this.apiCall(`/api/students/${id}`, { method: 'DELETE' });
    return true;
  }

  // === GESTION DU PERSONNEL ===
  static async getStaff(): Promise<Staff[]> {
    console.log('👥 API: getStaff');
    const response = await this.apiCall<{ success: boolean; data: Staff[] }>('/api/staff');
    return response.data;
  }

  static async createStaff(data: {
    first_name: string;
    last_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    address?: string;
    hire_date?: string;
    status?: 'active' | 'inactive' | 'on_leave';
    photo_url?: string;
    qualifications?: string;
    notes?: string;
  }): Promise<Staff> {
    console.log('➕ API: createStaff', data);
    const response = await this.apiCall<{ success: boolean; data: Staff }>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async updateStaff(id: number, data: Partial<Staff>): Promise<Staff> {
    console.log('✏️ API: updateStaff', id, data);
    const response = await this.apiCall<{ success: boolean; data: Staff }>(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteStaff(id: number): Promise<boolean> {
    console.log('🗑️ API: deleteStaff', id);
    await this.apiCall(`/api/staff/${id}`, { method: 'DELETE' });
    return true;
  }

  // === GESTION DES UTILISATEURS ADMIN ===
  static async getAdminUserByEmail(email: string): Promise<AdminUser | null> {
    console.log('👤 API: getAdminUserByEmail - Cette méthode est gérée par le service auth');
    // Cette méthode est maintenant gérée par le service d'authentification
    return null;
  }

  static async getAdminUserById(id: number): Promise<AdminUser | null> {
    console.log('👤 API: getAdminUserById - Cette méthode est gérée par le service auth');
    // Cette méthode est maintenant gérée par le service d'authentification
    return null;
  }

  static async updateAdminUserLastLogin(id: number): Promise<void> {
    console.log('👤 API: updateAdminUserLastLogin - Cette méthode est gérée par le service auth');
    // Cette méthode est maintenant gérée par le service d'authentification
  }

  static async createAdminUser(data: {
    username: string;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    role?: 'super_admin' | 'admin' | 'teacher' | 'accountant';
  }): Promise<AdminUser> {
    console.log('👤 API: createAdminUser - Cette méthode est gérée par le service auth');
    throw new Error('Utilisez le service d\'authentification pour créer des utilisateurs');
  }

  // === RECHERCHE ===
  static async searchStudents(searchTerm: string, schoolYearId?: number): Promise<Student[]> {
    console.log('🔍 API: searchStudents', searchTerm);
    const params = new URLSearchParams({ search: searchTerm });
    if (schoolYearId) params.append('schoolYearId', schoolYearId.toString());
    
    const response = await this.apiCall<{ success: boolean; data: Student[] }>(`/api/students/search?${params}`);
    return response.data;
  }

  static async searchStaff(searchTerm: string): Promise<Staff[]> {
    console.log('🔍 API: searchStaff', searchTerm);
    const response = await this.apiCall<{ success: boolean; data: Staff[] }>(`/api/staff/search?search=${searchTerm}`);
    return response.data;
  }

  // === UTILITAIRES ===
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 API: testConnection');
      await this.apiCall('/api/health');
      console.log('✅ Connexion API réussie');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion API:', error);
      return false;
    }
  }

  static async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    console.warn('⚠️ executeQuery n\'est plus supporté côté frontend. Utilisez les méthodes API spécifiques.');
    throw new Error('executeQuery n\'est plus supporté côté frontend');
  }
}

// Fonctions utilitaires
export function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// === EXPORTS DE COMPATIBILITÉ ===

// Export de la fonction generateStudentNumber pour compatibilité
export function generateStudentNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999);
  return `ET${year}${randomNum.toString().padStart(4, '0')}`;
}

// Export de la fonction generateStaffNumber pour compatibilité
export function generateStaffNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9999);
  return `EMP${year}${randomNum.toString().padStart(4, '0')}`;
}

// Classe LocalStorageService pour compatibilité avec les anciens composants
export class LocalStorageService {
  // === GESTION DES ÉTUDIANTS ===
  static async getStudents(): Promise<Student[]> {
    console.log('📚 LocalStorageService.getStudents -> API');
    return await DatabaseService.getStudents();
  }

  static async saveStudent(studentData: any): Promise<void> {
    console.log('💾 LocalStorageService.saveStudent -> API', studentData);
    
    // Adapter les données pour l'API
    const apiStudentData = {
      first_name: studentData.firstName || studentData.first_name,
      last_name: studentData.lastName || studentData.last_name,
      birth_date: studentData.birthDate || studentData.birth_date,
      gender: studentData.gender,
      is_orphan: studentData.isOrphan || studentData.is_orphan || false,
      is_needy: studentData.isNeedy || studentData.is_needy || false,
      status: (studentData.status || 'nouveau') as 'nouveau' | 'ancien',
      enrollment_date: studentData.enrollmentDate || studentData.enrollment_date || new Date().toISOString().split('T')[0],
      school_year_id: studentData.schoolYearId || studentData.school_year_id || 1,
      notes: studentData.notes,
      coranic_class_id: studentData.coranic_class_id,
      french_class_id: studentData.french_class_id,
      photo_url: studentData.photoUrl || studentData.photo_url
    };

    if (studentData.id) {
      // Mise à jour
      await DatabaseService.updateStudent(studentData.id, apiStudentData);
    } else {
      // Création
      await DatabaseService.createStudent(apiStudentData);
    }
  }

  static async deleteStudent(id: number): Promise<void> {
    console.log('🗑️ LocalStorageService.deleteStudent -> API', id);
    await DatabaseService.deleteStudent(id);
  }

  // === GESTION DU PERSONNEL ===
  static async getStaff(): Promise<Staff[]> {
    console.log('👥 LocalStorageService.getStaff -> API');
    return await DatabaseService.getStaff();
  }

  static async saveStaff(staffData: any): Promise<void> {
    console.log('💾 LocalStorageService.saveStaff -> API', staffData);
    
    // Adapter les données pour l'API
    const apiStaffData = {
      first_name: staffData.firstName || staffData.first_name,
      last_name: staffData.lastName || staffData.last_name,
      position: staffData.position,
      department: staffData.department,
      email: staffData.email,
      phone: staffData.phone,
      address: staffData.address,
      hire_date: staffData.hireDate || staffData.hire_date,
      status: (staffData.status || 'active') as 'active' | 'inactive' | 'on_leave',
      qualifications: staffData.qualifications,
      notes: staffData.notes,
      photo_url: staffData.photoUrl || staffData.photo_url
    };

    if (staffData.id) {
      // Mise à jour
      await DatabaseService.updateStaff(staffData.id, apiStaffData);
    } else {
      // Création
      await DatabaseService.createStaff(apiStaffData);
    }
  }

  static async deleteStaff(id: number): Promise<void> {
    console.log('🗑️ LocalStorageService.deleteStaff -> API', id);
    await DatabaseService.deleteStaff(id);
  }

  // === RECHERCHE ===
  static async searchStudentByNumber(studentNumber: string): Promise<Student | null> {
    console.log('🔍 LocalStorageService.searchStudentByNumber -> API', studentNumber);
    return await DatabaseService.getStudentByNumber(studentNumber);
  }

  static async getStudentsBySchoolYear(schoolYearId: number): Promise<Student[]> {
    console.log('📅 LocalStorageService.getStudentsBySchoolYear -> API', schoolYearId);
    return await DatabaseService.getStudents(schoolYearId);
  }

  // === ANNÉES SCOLAIRES ===
  static async getActiveSchoolYear(): Promise<SchoolYear | null> {
    console.log('📅 LocalStorageService.getActiveSchoolYear -> API');
    return await DatabaseService.getActiveSchoolYear();
  }

  // Méthode synchrone pour compatibilité (à éviter - utilisez la version async)
  static getActiveSchoolYearSync(): any {
    console.warn('⚠️ getActiveSchoolYearSync est dépréciée, utilisez getActiveSchoolYear() async');
    return {
      id: 1,
      label: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-07-15',
      isActive: true,
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-07-15'),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
  }
}

// Alias pour compatibilité
export { LocalStorageService as LocalStorage };

// Export des types pour compatibilité
export type { Student as DatabaseStudent };
export type { Staff as DatabaseStaff };
export type { SchoolYear as DatabaseSchoolYear };

export default DatabaseService;