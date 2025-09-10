// services/studentAPI.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Configuration axios avec intercepteurs
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types pour l'API
export interface CreateStudentRequest {
  // Informations personnelles
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  is_needy?: boolean;
  
  // Classes (IDs des classes existantes)
  coranic_class_id?: string;
  french_class_id?: string;
  school_year_id?: string;
  
  // Tuteur principal
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
  student?: any;
  error?: string;
  details?: string[];
}

export interface ClassOption {
  id: string;
  name: string;
  level: string;
  type: 'coranic' | 'french';
}

export interface SchoolYearOption {
  id: string;
  name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

// Service API
export class StudentAPI {
  
  // Créer un nouvel étudiant
  static async createStudent(studentData: CreateStudentRequest): Promise<StudentResponse> {
    try {
      console.log('📤 Envoi données étudiant:', studentData);
      
      const response = await apiClient.post('/students', studentData);
      
      console.log('✅ Réponse serveur:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('💥 Erreur création étudiant:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
        details: [error.message]
      };
    }
  }
  
  // Upload photo d'un étudiant
  static async uploadStudentPhoto(studentId: string, photoFile: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      
      const response = await apiClient.post(
        `/students/${studentId}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('💥 Erreur upload photo:', error);
      throw error;
    }
  }
  
  // Récupérer les classes disponibles
  static async getClasses(): Promise<ClassOption[]> {
    try {
      const response = await apiClient.get('/classes');
      return response.data.classes || [];
    } catch (error) {
      console.error('💥 Erreur récupération classes:', error);
      return [];
    }
  }
  
  // Récupérer les années scolaires
  static async getSchoolYears(): Promise<SchoolYearOption[]> {
    try {
      const response = await apiClient.get('/school-years');
      return response.data.school_years || [];
    } catch (error) {
      console.error('💥 Erreur récupération années scolaires:', error);
      return [];
    }
  }
  
  // Vérifier la disponibilité d'un numéro étudiant
  static async checkStudentNumber(number: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/students/check-number/${number}`);
      return response.data.is_available;
    } catch (error) {
      console.error('💥 Erreur vérification numéro:', error);
      return false;
    }
  }
  
  // Recherche rapide d'étudiants
  static async searchStudents(query: string, limit = 10): Promise<any[]> {
    try {
      const response = await apiClient.get('/students/search/quick', {
        params: { q: query, limit }
      });
      return response.data.students || [];
    } catch (error) {
      console.error('💥 Erreur recherche étudiants:', error);
      return [];
    }
  }
}

// Hook personnalisé pour les données de référence
export const useReferenceData = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoading(true);
        const [classesData, schoolYearsData] = await Promise.all([
          StudentAPI.getClasses(),
          StudentAPI.getSchoolYears()
        ]);
        
        setClasses(classesData);
        setSchoolYears(schoolYearsData);
      } catch (error) {
        console.error('💥 Erreur chargement données de référence:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadReferenceData();
  }, []);
  
  return {
    classes: {
      coranic: classes.filter(c => c.type === 'coranic'),
      french: classes.filter(c => c.type === 'french')
    },
    schoolYears,
    loading
  };
};

export default StudentAPI;