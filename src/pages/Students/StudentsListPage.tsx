// src/pages/Students/StudentsListPage.tsx - VERSION CORRIGÉE COMPLÈTE AVEC PHOTOS

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Eye, Edit, Trash2, RefreshCw,
  Heart, Home, Building2, CheckCircle, XCircle, AlertTriangle,
  UserPlus, Loader2, X, AlertCircle, Grid, List,
  Camera, Calendar, Phone, Mail, MapPin, School
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ✅ SERVICES API CORRIGÉS
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

// ✅ INTERFACES MISES À JOUR
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number?: string;
  birth_date: string;
  age: number;
  gender: 'M' | 'F';
  status: 'interne' | 'externe';
  is_orphan: boolean;
  photo_url?: string;
  display_photo?: string;
  current_payment_status?: string;
  current_balance?: number;
  enrollment_date: string;
  notes?: string;
  initials?: string;
  guardian_display_name?: string;
  guardian_phone?: string;
  
  coranic_class?: {
    id: string;
    name: string;
    level?: string;
  };
  school_year?: {
    id: string;
    name: string;
  };
  primary_guardian?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    address?: string;
    relationship: string;
  };
}

interface StudentStats {
  total: number;
  internal: number;
  external: number;
  orphans: number;
}

// ✅ SERVICE ÉTUDIANT CORRIGÉ
const StudentService = {
  async list(params: any = {}) {
    console.log('🔄 Récupération étudiants avec params:', params);
    try {
      const queryParams = new URLSearchParams();
      
      // ✅ PARAMÈTRES SELON L'API BACKEND
      if (params.search) queryParams.append('search', params.search);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.gender && params.gender !== 'all') queryParams.append('gender', params.gender);
      if (params.is_orphan && params.is_orphan !== 'all') queryParams.append('is_orphan', params.is_orphan);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const queryString = queryParams.toString();
      const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students${queryString ? '?' + queryString : ''}`;
      
      const data = await makeApiCall(fullUrl);
      
      if (data.success && data.students) {
        console.log('✅ Étudiants reçus:', data.students.length);
        return data;
      }
      
      throw new Error('Données invalides reçues de l\'API');
      
    } catch (error) {
      console.error('💥 Erreur service étudiants:', error);
      throw error;
    }
  },

  async delete(id: string) {
    console.log('🗑️ Suppression étudiant:', id);
    try {
      const data = await makeApiCall(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/students/${id}`,{
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('💥 Erreur suppression:', error);
      throw error;
    }
  }
};

// ✅ AVATAR ÉTUDIANT CORRIGÉ ET OPTIMISÉ - Version finale
const StudentAvatar = ({ student, size = 'md' }: { student: Student; size?: 'sm' | 'md' | 'lg' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  // ✅ CONSTRUCTION D'URL PHOTO SIMPLIFIÉE (sans logs excessifs)
  const getPhotoUrl = (student: Student): string | null => {
    // Priorité à display_photo puis photo_url
    const photoField = student.display_photo || student.photo_url;
    
    if (!photoField || photoField.trim() === '') {
      return null;
    }

    // ✅ CONSTRUCTION SIMPLE ET EFFICACE
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

  // ✅ HANDLERS SIMPLIFIÉS (logs seulement en cas d'erreur et en dev)
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: any) => {
    // ✅ LOG SEULEMENT EN CAS D'ERREUR ET EN MODE DEV
    if (process.env.NODE_ENV === 'development') {
      console.warn(`❌ Photo non accessible pour ${student.first_name} ${student.last_name}:`, {
        src: e.target?.src,
        photo_url: student.photo_url,
        display_photo: student.display_photo
      });
    }
    setImageError(true);
    setImageLoaded(false);
  };

  // ✅ AFFICHAGE AVEC FALLBACK OPTIMISÉ
  if (!photoUrl || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md`}
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
        className={`${sizeClasses[size]} rounded-full object-cover shadow-md border-2 border-white`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        title={`Photo de ${student.first_name} ${student.last_name}`}
      />
      
      {/* ✅ INDICATEUR DE CHARGEMENT SIMPLIFIÉ */}
      {!imageLoaded && !imageError && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse absolute inset-0 flex items-center justify-center`}>
          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
        </div>
      )}
      
      {/* ✅ INDICATEUR DEBUG SIMPLE EN DÉVELOPPEMENT */}
      {process.env.NODE_ENV === 'development' && photoUrl && (
        <div className="absolute -bottom-1 -right-1">
          <div 
            className={`w-3 h-3 rounded-full border ${
              imageError ? 'bg-red-500 border-red-600' : 
              imageLoaded ? 'bg-green-500 border-green-600' : 
              'bg-yellow-500 border-yellow-600'
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

// ✅ UTILITAIRE POUR AFFICHER LES NOTIFICATIONS
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

const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // ✅ ÉTATS CORRIGÉS
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  
  // ✅ FILTRES SELON L'API BACKEND
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'interne' | 'externe'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [orphanFilter, setOrphanFilter] = useState<'all' | 'true' | 'false'>('all');
  const [sortBy, setSortBy] = useState('first_name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  
  // États des modales et actions
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Mode d'affichage
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    loadStudents();
  }, []);

  // ✅ RECHERCHE AVEC DEBOUNCE - CORRIGÉE
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, genderFilter, orphanFilter, sortBy, sortOrder]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        is_orphan: orphanFilter !== 'all' ? orphanFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 50
      };
      
      const result = await StudentService.list(params);
      if (result.success) {
        console.log('📋 Étudiants chargés avec debug photos:');
        result.students.forEach((student: Student, index: number) => {
          console.log(`  ${index + 1}. ${student.first_name} ${student.last_name}:`, {
            id: student.id,
            photo_url: student.photo_url,
            display_photo: student.display_photo,
            has_photo: !!(student.photo_url || student.display_photo)
          });
        });
        
        setStudents(result.students || []);
        setStats(result.stats || null);
      }
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      showNotification(`Erreur: ${error.message || 'Impossible de charger les étudiants'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION DE DEBUG GLOBAL DES PHOTOS
  const debugAllPhotos = async () => {
    console.log('🐛 === DEBUG GLOBAL DES PHOTOS ===');
    
    for (const student of students) {
      const hasPhotoField = !!(student.photo_url || student.display_photo);
      console.log(`📸 ${student.first_name} ${student.last_name}:`, {
        id: student.id,
        student_number: student.student_number,
        photo_url: student.photo_url,
        display_photo: student.display_photo,
        has_photo_field: hasPhotoField
      });
      
      if (hasPhotoField) {
        const photoField = student.display_photo || student.photo_url;
        let testUrl: string;
        
        if (photoField!.startsWith('http')) {
          testUrl = photoField!;
        } else if (photoField!.startsWith('/')) {
          testUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${photoField}`;
        } else {
          
          testUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/avatars/${photoField}`;
        }
        
        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          console.log(`  ${response.ok ? '✅' : '❌'} ${testUrl} - Status: ${response.status}`);
        } catch (error: any) {
          console.log(`  ❌ ${testUrl} - Erreur: ${error.message}`);
        }
      }
    }
    
    console.log('🐛 === FIN DEBUG GLOBAL ===');
  };

  // ✅ SUPPRIMER UN ÉTUDIANT - CORRIGÉ
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    setDeleteLoading(true);
    try {
      const result = await StudentService.delete(selectedStudent.id);
      if (result.success) {
        await loadStudents();
        setShowDeleteModal(false);
        setSelectedStudent(null);
        showNotification(`${selectedStudent.first_name} ${selectedStudent.last_name} supprimé(e)`);
      }
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      showNotification(`Erreur suppression: ${error.message}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ UTILITAIRES D'AFFICHAGE
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

  const getPaymentConfig = (status?: string) => {
    switch (status) {
      case 'paid': return { 
        bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', 
        icon: CheckCircle, label: 'À jour' 
      };
      case 'pending': return { 
        bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', 
        icon: AlertTriangle, label: 'En attente' 
      };
      case 'overdue': return { 
        bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', 
        icon: XCircle, label: 'En retard' 
      };
      default: return { 
        bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', 
        icon: AlertTriangle, label: 'Non défini' 
      };
    }
  };

  // ✅ COMPOSANTS BADGE CORRIGÉS
  const StatusBadge = ({ student }: { student: Student }) => {
    const config = getStatusConfig(student);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const PaymentBadge = ({ student }: { student: Student }) => {
    const config = getPaymentConfig(student.current_payment_status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // ✅ FONCTION DE NETTOYAGE DES FILTRES
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setGenderFilter('all');
    setOrphanFilter('all');
    setSortBy('first_name');
    setSortOrder('ASC');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || genderFilter !== 'all' || orphanFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ HEADER MODERNE */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-7 h-7 text-indigo-600" />
                Étudiants {stats && `(${stats.total})`}
              </h1>
              <p className="text-gray-600 mt-1">Gérez vos étudiants efficacement</p>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ BOUTON DEBUG EN DÉVELOPPEMENT */}
              <button 
                onClick={() => navigate('/students/new')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Nouvel Étudiant
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ✅ STATISTIQUES */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.orphans || 0}</p>
                  <p className="text-sm text-gray-600">Orphelins</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.internal || 0}</p>
                  <p className="text-sm text-gray-600">Internes</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.external || 0}</p>
                  <p className="text-sm text-gray-600">Externes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ FILTRES AMÉLIORÉS AVEC TRI */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, numéro ou tuteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Filtres */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous statuts</option>
              <option value="interne">Interne</option>
              <option value="externe">Externe</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous genres</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>

            <select
              value={orphanFilter}
              onChange={(e) => setOrphanFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous élèves</option>
              <option value="true">Orphelins</option>
              <option value="false">Non orphelins</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="first_name">Trier par prénom</option>
              <option value="last_name">Trier par nom</option>
              <option value="age">Trier par âge</option>
              <option value="created_at">Trier par date d'inscription</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
              title={`Tri ${sortOrder === 'ASC' ? 'croissant' : 'décroissant'}`}
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={loadStudents}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-200 transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              {/* Toggle vue */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vue cartes"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Indicateur de filtres actifs */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Filtres actifs:</span>
                {searchTerm && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">"{searchTerm}"</span>}
                {statusFilter !== 'all' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{statusFilter}</span>}
                {genderFilter !== 'all' && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{genderFilter === 'M' ? 'Masculin' : 'Féminin'}</span>}
                {orphanFilter !== 'all' && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">{orphanFilter === 'true' ? 'Orphelins' : 'Non orphelins'}</span>}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Effacer tout
              </button>
            </div>
          )}
        </div>

        {/* ✅ AFFICHAGE PRINCIPAL */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <p className="text-gray-600">Chargement des étudiants...</p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                {hasActiveFilters ? 'Aucun étudiant trouvé avec ces filtres' : 'Aucun étudiant inscrit'}
              </p>
              {hasActiveFilters ? (
                <button 
                  onClick={clearFilters}
                  className="text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Effacer les filtres
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/students/new')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Inscrire le premier étudiant
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ✅ VUE CARTES */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {students.map((student) => (
                    <div key={student.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                      {/* Header de la carte */}
                      <div className="flex items-center gap-3 mb-3">
                        <StudentAvatar student={student} size="md" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">#{student.student_number}</p>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium">
                          {student.age}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <StatusBadge student={student} />
                        <PaymentBadge student={student} />
                      </div>

                      {/* Informations */}
                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        {student.coranic_class && (
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4" />
                            <span className="truncate">{student.coranic_class.name}</span>
                          </div>
                        )}
                        {student.guardian_display_name && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span className="truncate">{student.guardian_display_name}</span>
                          </div>
                        )}
                        {student.guardian_phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">📞</span>
                            <span className="truncate text-xs">{student.guardian_phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="flex items-center gap-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                        <button
                          onClick={() => navigate(`/students/${student.id}/edit`)}
                          className="flex items-center gap-1 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ VUE LISTE */}
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Étudiant</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Âge</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Classe</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tuteur</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Paiement</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <StudentAvatar student={student} size="sm" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-sm text-gray-500">#{student.student_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium">
                              {student.age}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge student={student} />
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              {student.coranic_class ? (
                                <div>
                                  <p className="font-medium text-gray-900">{student.coranic_class.name}</p>
                                  {student.coranic_class.level && (
                                    <p className="text-gray-500">{student.coranic_class.level}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Non assigné</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              {student.guardian_display_name ? (
                                <div>
                                  <p className="font-medium text-gray-900">{student.guardian_display_name}</p>
                                  {student.guardian_phone && (
                                    <p className="text-gray-500">{student.guardian_phone}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">Non renseigné</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <PaymentBadge student={student} />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/students/${student.id}/edit`)}
                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ MODALE DE SUPPRESSION */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                  <p className="text-gray-600 text-sm">Cette action est irréversible</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <StudentAvatar student={selectedStudent} size="sm" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                    <p className="text-sm text-gray-600">#{selectedStudent.student_number}</p>
                  </div>
                </div>
                <p className="text-sm text-red-800">
                  Toutes les données de cet étudiant seront définitivement supprimées.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedStudent(null);
                  }}
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
                      Supprimer
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

export default StudentsListPage;