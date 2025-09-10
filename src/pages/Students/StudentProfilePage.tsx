// src/pages/Students/StudentProfilePage.tsx - VERSION CORRIGÉE COMPLÈTE AVEC EN-TÊTE AMÉLIORÉ

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Trash2, Camera, Phone, Mail, MapPin, Calendar, 
  Heart, Home, Building2, School, User, Users, BookOpen, Clock,
  AlertTriangle, CheckCircle, Loader2, Eye, X, Upload, Download
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

// SERVICES API CORRIGÉS
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

// INTERFACES MISES À JOUR
interface Guardian {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  relationship: string;
  is_primary?: boolean;
  full_name?: string;
  relationship_formatted?: string;
  role_display?: string;
}

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  birth_date_formatted: string;
  age: number;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  photo_url?: string;
  display_photo?: string;
  initials?: string;
  enrollment_date: string;
  enrollment_date_formatted: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  status_display?: string;
  status_color?: string;
  age_category?: string;
  enrollment_duration_days?: number;
  is_recent_enrollment?: boolean;
  
  coranic_class?: {
    id: string;
    name: string;
    level?: string;
    type?: string;
    description?: string;
    capacity?: number;
    monthly_fee?: number;
  };
  
  school_year?: {
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  };
  
  guardians?: Guardian[];
  primary_guardian?: Guardian;
  
  metadata?: {
    total_guardians: number;
    has_primary_guardian: boolean;
    has_photo: boolean;
    enrollment_duration_days: number;
    enrollment_duration_years: number;
    is_recent_enrollment: boolean;
    age_category: string;
    has_notes: boolean;
  };
}

// SERVICE ÉTUDIANT CORRIGÉ
const StudentService = {
  async getById(id: string) {
    console.log('📄 Récupération étudiant:', id);
    try {
      const data = await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}`);
      
      if (data.success && data.student) {
        console.log('✅ Étudiant reçu:', data.student);
        return data;
      }
      
      throw new Error('Données invalides reçues de l\'API');
      
    } catch (error) {
      console.error('💥 Erreur service étudiant:', error);
      throw error;
    }
  },

  async delete(id: string) {
    console.log('🗑️ Suppression étudiant:', id);
    try {
      const data = await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('💥 Erreur suppression:', error);
      throw error;
    }
  },

  async uploadPhoto(id: string, file: File) {
    console.log('📸 Upload photo étudiant:', id);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Ligne 179 - ajoutez la virgule manquante :
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur upload ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('💥 Erreur upload photo:', error);
      throw error;
    }
  },

  async deletePhoto(id: string) {
    console.log('🗑️ Suppression photo étudiant:', id);
    try {
      const data = await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}/photo`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('💥 Erreur suppression photo:', error);
      throw error;
    }
  }
};

// AVATAR ÉTUDIANT OPTIMISÉ POUR LE PROFIL
const StudentProfileAvatar = ({ student, size = 'xl' }: { student: Student; size?: 'lg' | 'xl' | '2xl' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    lg: 'w-24 h-24 text-lg',
    xl: 'w-32 h-32 text-xl',
    '2xl': 'w-40 h-40 text-2xl'
  };

  // CONSTRUCTION D'URL PHOTO OPTIMISÉE
  const getPhotoUrl = (student: Student): string | null => {
    const photoField = student.display_photo || student.photo_url;
    
    if (!photoField || photoField.trim() === '') {
      return null;
    }

    console.log('📸 Construction URL photo pour profil:', {
      student_id: student.id,
      photo_field: photoField,
      display_photo: student.display_photo,
      photo_url: student.photo_url
    });

    if (photoField.startsWith('http://') || photoField.startsWith('https://')) {
      return photoField;
    } 
    else if (photoField.startsWith('/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${photoField}`;
    }
    else {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/avatars/${photoField}`;
    }
  };

  const photoUrl = getPhotoUrl(student);
  const initials = student.initials || `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`.toUpperCase();

  // HANDLERS OPTIMISÉS
  const handleImageLoad = () => {
    console.log('✅ Photo profil chargée avec succès');
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: any) => {
    console.warn(`❌ Erreur chargement photo profil pour ${student.first_name} ${student.last_name}:`, {
      src: e.target?.src,
      photo_url: student.photo_url,
      display_photo: student.display_photo
    });
    setImageError(true);
    setImageLoaded(false);
  };

  // AFFICHAGE AVEC FALLBACK ÉLÉGANT
  if (!photoUrl || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-xl border-4 border-white`}
        title={imageError ? 'Photo non accessible' : 'Photo non disponible'}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={photoUrl}
        alt={`Photo de ${student.first_name} ${student.last_name}`}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-xl border-4 border-white`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        title={`Photo de ${student.first_name} ${student.last_name}`}
      />
      
      {/* Indicateur de chargement */}
      {!imageLoaded && !imageError && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse absolute inset-0 flex items-center justify-center border-4 border-white`}>
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* Indicateur de statut en développement */}
      {process.env.NODE_ENV === 'development' && photoUrl && (
        <div className="absolute -bottom-2 -right-2">
          <div 
            className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
              imageError ? 'bg-red-500' : 
              imageLoaded ? 'bg-green-500' : 
              'bg-yellow-500'
            }`}
            title={
              imageError ? 'Photo non accessible' : 
              imageLoaded ? 'Photo chargée' : 
              'Chargement en cours'
            }
          />
        </div>
      )}
    </div>
  );
};

// UTILITAIRE POUR AFFICHER LES NOTIFICATIONS
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  const notification = document.createElement('div');
  const backgroundColor = type === 'success' ? '#10B981' : '#EF4444';
  const icon = type === 'success' ? '✅' : '❌';
  
  notification.innerHTML = `
    <div style="
      position: fixed; 
      top: 20px; 
      right: 20px; 
      background: ${backgroundColor}; 
      color: white; 
      padding: 16px 24px; 
      border-radius: 8px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000; 
      font-family: system-ui; 
      font-weight: 500;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
    ">
      ${icon} ${message}
    </div>
    <style>
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, type === 'success' ? 3000 : 5000);
};

const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // ÉTATS PRINCIPAUX
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la gestion de photo
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // États pour la suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // CHARGEMENT INITIAL
  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await StudentService.getById(id);
      if (result.success && result.student) {
        console.log('📋 Étudiant chargé pour profil:', {
          id: result.student.id,
          name: result.student.full_name,
          photo_url: result.student.photo_url,
          display_photo: result.student.display_photo,
          has_photo: result.student.metadata?.has_photo
        });
        setStudent(result.student);
      } else {
        throw new Error('Étudiant non trouvé');
      }
    } catch (error: any) {
      console.error('Erreur chargement étudiant:', error);
      setError(error.message);
      showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // GESTION PHOTO
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Veuillez sélectionner une image', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('La photo doit faire moins de 5MB', 'error');
      return;
    }

    setSelectedPhoto(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !student) return;

    setPhotoUploading(true);
    try {
      const result = await StudentService.uploadPhoto(student.id, selectedPhoto);
      if (result.success) {
        showNotification('Photo mise à jour avec succès');
        setShowPhotoModal(false);
        setSelectedPhoto(null);
        setPhotoPreview(null);
        await loadStudent();
      } else {
        throw new Error(result.error || 'Erreur upload photo');
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      showNotification(`Erreur upload: ${error.message}`, 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!student) return;

    try {
      const result = await StudentService.deletePhoto(student.id);
      if (result.success) {
        showNotification('Photo supprimée avec succès');
        await loadStudent();
      } else {
        throw new Error(result.error || 'Erreur suppression photo');
      }
    } catch (error: any) {
      console.error('Erreur suppression photo:', error);
      showNotification(`Erreur suppression: ${error.message}`, 'error');
    }
  };

  // SUPPRESSION ÉTUDIANT
  const handleDeleteStudent = async () => {
    if (!student) return;
    
    setDeleteLoading(true);
    try {
      const result = await StudentService.delete(student.id);
      if (result.success) {
        showNotification(`${student.first_name} ${student.last_name} supprimé(e)`);
        navigate('/students');
      } else {
        throw new Error(result.error || 'Erreur suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // UTILITAIRES D'AFFICHAGE
  const getStatusConfig = (student: Student) => {
    if (student.is_orphan) {
      return {
        bg: 'bg-gradient-to-r from-rose-100 to-pink-100',
        text: 'text-rose-800',
        border: 'border-rose-200',
        icon: Heart,
        label: 'Orphelin'
      };
    }
    
    if (student.status === 'interne') {
      return {
        bg: 'bg-gradient-to-r from-indigo-100 to-purple-100',
        text: 'text-indigo-800',
        border: 'border-indigo-200',
        icon: Home,
        label: 'Interne'
      };
    }
    
    return {
      bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: Building2,
      label: 'Externe'
    };
  };

  const StatusBadge = ({ student }: { student: Student }) => {
    const config = getStatusConfig(student);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // AFFICHAGE CONDITIONNEL
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-gray-600 text-lg">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Étudiant non trouvé</h2>
          <p className="text-gray-600 mb-6">{error || 'Cet étudiant n\'existe pas ou a été supprimé'}</p>
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/students')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la liste
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/students/${student.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* EN-TÊTE DU PROFIL CORRIGÉ */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="px-8 pt-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Photo de profil */}
              <div className="relative">
                <StudentProfileAvatar student={student} size="2xl" />
                
                {/* Bouton modifier photo */}
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border-2 border-gray-200"
                  title="Modifier la photo"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              
              {/* Informations principales */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    {/* Nom parfaitement lisible */}
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                      {student.full_name}
                    </h1>
                    
                    {/* Badges informatifs avec couleurs distinctes */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm font-medium">
                        <User className="w-4 h-4" />
                        #{student.student_number}
                      </span>
                      
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm font-medium">
                        <Calendar className="w-4 h-4" />
                        {student.age} ans
                      </span>
                      
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Inscrit le {student.enrollment_date_formatted}
                      </span>
                    </div>
                    
                    <StatusBadge student={student} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE PRINCIPALE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informations personnelles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Informations personnelles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                  <p className="text-gray-900 font-medium">{student.first_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                  <p className="text-gray-900 font-medium">{student.last_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date de naissance</label>
                  <p className="text-gray-900">{student.birth_date_formatted}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Genre</label>
                  <p className="text-gray-900">{student.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Statut</label>
                  <p className="text-gray-900 capitalize">{student.status}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Situation familiale</label>
                  <p className="text-gray-900">{student.is_orphan ? 'Orphelin' : 'Famille complète'}</p>
                </div>
              </div>
            </div>

            {/* Scolarité */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Scolarité
              </h2>
              
              <div className="space-y-6">
                {/* Année scolaire */}
                {student.school_year && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Année Scolaire
                    </h3>
                    <p className="text-blue-800">{student.school_year.name}</p>
                    {student.school_year.is_current && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mt-2">
                        <CheckCircle className="w-3 h-3" />
                        Année actuelle
                      </span>
                    )}
                  </div>
                )}
                
                {/* Classe coranique */}
                {student.coranic_class ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <School className="w-4 h-4" />
                      Classe Coranique
                    </h3>
                    <p className="text-green-800 font-medium">{student.coranic_class.name}</p>
                    {student.coranic_class.level && (
                      <p className="text-green-700 text-sm">Niveau: {student.coranic_class.level}</p>
                    )}
                    {student.coranic_class.description && (
                      <p className="text-green-600 text-sm mt-1">{student.coranic_class.description}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                      <School className="w-4 h-4" />
                      Classe Coranique
                    </h3>
                    <p className="text-gray-500">Non assigné à une classe</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes et observations */}
            {student.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Notes et observations
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{student.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* COLONNE LATÉRALE */}
          <div className="space-y-6">
            
            {/* Tuteurs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Tuteurs
              </h2>
              
              {student.guardians && student.guardians.length > 0 ? (
                <div className="space-y-4">
                  {student.guardians.map((guardian) => (
                    <div 
                      key={guardian.id} 
                      className={`p-4 rounded-lg border ${
                        guardian.is_primary 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {guardian.full_name || `${guardian.first_name} ${guardian.last_name}`}
                        </h3>
                        {guardian.is_primary && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Principal
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Relation:</span> {guardian.relationship_formatted || guardian.relationship}
                        </p>
                        
                        {guardian.phone && (
                          <p className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {guardian.phone}
                          </p>
                        )}
                        
                        {guardian.email && (
                          <p className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            {guardian.email}
                          </p>
                        )}
                        
                        {guardian.address && (
                          <p className="flex items-start gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{guardian.address}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun tuteur renseigné</p>
              )}
            </div>

            {/* Métadonnées */}
            {student.metadata && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  Informations système
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tuteurs:</span>
                    <span className="font-medium text-gray-900">{student.metadata.total_guardians}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Photo:</span>
                    <span className={`font-medium ${student.metadata.has_photo ? 'text-green-600' : 'text-gray-400'}`}>
                      {student.metadata.has_photo ? 'Disponible' : 'Non disponible'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Durée inscription:</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(student.metadata.enrollment_duration_days)} jours
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Catégorie d'âge:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {student.metadata.age_category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {student.metadata.is_recent_enrollment && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Inscription récente
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALE PHOTO */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Modifier la photo</h3>
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prévisualisation */}
              <div className="mb-6 text-center">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Choisir une photo
                  </label>
                </div>

                {selectedPhoto && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={photoUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {photoUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Enregistrer
                      </>
                    )}
                  </button>
                )}

                {student.photo_url && (
                  <button
                    onClick={handlePhotoDelete}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer la photo actuelle
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Formats acceptés: JPG, PNG • Taille max: 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                  <p className="text-gray-600 text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <StudentProfileAvatar student={student} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-900">{student.full_name}</p>
                    <p className="text-sm text-gray-600">#{student.student_number}</p>
                  </div>
                </div>
                <p className="text-sm text-red-800">
                  Toutes les données de cet étudiant seront définitivement supprimées.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={deleteLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Supprimer définitivement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;