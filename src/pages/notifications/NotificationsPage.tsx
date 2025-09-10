import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Plus, 
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  X,
  Send,
  Users,
  Eye,
  TrendingUp,
  Zap,
  Trash2,
  AlertCircle,
  Loader2,
  CalendarDays,
  Timer,
  RefreshCw,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ===== TYPES COMPLETS =====
interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'reminder' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  is_read: boolean;
  is_active: boolean;
  user_id?: number;
  due_date?: string;
  reminder_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  created_at_formatted?: string;
  due_date_formatted?: string;
  reminder_date_formatted?: string;
  priority_color?: string;
  type_icon?: string;
  type_color?: string;
  target_user_name?: string;
  created_by_name?: string;
  hours_remaining?: number;
  deadline_status?: string;
  can_delete?: boolean;
  can_read?: boolean;
}

interface NotificationCounts {
  total_unread: number;
  urgent_unread: number;
  high_unread: number;
  medium_unread: number;
  low_unread: number;
  error_unread: number;
  warning_unread: number;
  reminder_unread: number;
  due_soon: number;
  overdue: number;
}

interface CreateNotificationData {
  title: string;
  message?: string;
  type: string;
  priority: string;
  category: string;
  user_id?: number | null;
  due_date?: string | null;
  reminder_date?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  metadata?: any;
}

// ===== HOOK D'AUTHENTIFICATION =====
const useAuth = () => {
  const navigate = useNavigate();

  const getValidToken = (): string | null => {
    try {
      // Chercher dans toutes les sources possibles avec la même logique que le backend
      const sources = [
        localStorage.getItem('auth_token'),
        localStorage.getItem('token'),
        localStorage.getItem('authToken'),
        localStorage.getItem('accessToken'),
        sessionStorage.getItem('auth_token'),
        sessionStorage.getItem('token'),
        sessionStorage.getItem('authToken')
      ];

      console.log('🔍 [Auth] Recherche token dans les sources disponibles...');
      
      for (let i = 0; i < sources.length; i++) {
        const token = sources[i];
        if (token && typeof token === 'string' && token.trim() && 
            token !== 'undefined' && token !== 'null' && token.length > 10) {
          
          console.log(`✅ [Auth] Token valide trouvé dans source ${i}, longueur: ${token.length}`);
          return token.trim();
        }
      }

      console.warn('⚠️ [Auth] Aucun token valide trouvé');
      return null;
    } catch (error) {
      console.error('💥 [Auth] Erreur récupération token:', error);
      return null;
    }
  };

  const isAuthenticated = (): boolean => {
    const token = getValidToken();
    const isValid = !!token;
    console.log('🔐 [Auth] Statut authentification:', isValid);
    return isValid;
  };

  const logout = () => {
    console.log('🚪 [Auth] Déconnexion...');
    
    // Nettoyer tous les tokens
    const keys = ['auth_token', 'token', 'authToken', 'accessToken', 'user'];
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    navigate('/login', { replace: true });
  };

  const getApiHeaders = (): Record<string, string> => {
    const token = getValidToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
      headers['X-Auth-Token'] = token;
    }

    return headers;
  };

  return {
    getValidToken,
    isAuthenticated,
    logout,
    getApiHeaders
  };
};

// ===== COMPOSANT PRINCIPAL =====
export function NotificationsPage() {
  const { isAuthenticated, logout, getApiHeaders } = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    total_unread: 0,
    urgent_unread: 0,
    high_unread: 0,
    medium_unread: 0,
    low_unread: 0,
    error_unread: 0,
    warning_unread: 0,
    reminder_unread: 0,
    due_soon: 0,
    overdue: 0
  });
  
  // États UI
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // ===== VÉRIFICATION AUTH AU DÉBUT =====
  useEffect(() => {
    if (!isAuthenticated()) {
      console.warn('❌ [NotificationsPage] Non authentifié, redirection...');
      logout();
      return;
    }
  }, [isAuthenticated, logout]);

  // ===== CONFIGURATION =====
  const notificationTypes = [
    { value: 'all', label: 'Tous types', icon: Bell, color: '#6B7280' },
    { value: 'info', label: 'Information', icon: Info, color: '#3B82F6' },
    { value: 'warning', label: 'Avertissement', icon: AlertCircle, color: '#F59E0B' },
    { value: 'error', label: 'Erreur', icon: AlertTriangle, color: '#DC2626' },
    { value: 'success', label: 'Succès', icon: CheckCircle, color: '#059669' },
    { value: 'reminder', label: 'Rappel', icon: Clock, color: '#7C3AED' },
    { value: 'alert', label: 'Alerte', icon: Bell, color: '#DC2626' }
  ];

  const priorityLevels = [
    { value: 'all', label: 'Toutes priorités', color: '#6B7280' },
    { value: 'urgent', label: 'Urgente', color: '#DC2626' },
    { value: 'high', label: 'Haute', color: '#EA580C' },
    { value: 'medium', label: 'Moyenne', color: '#D97706' },
    { value: 'low', label: 'Faible', color: '#059669' }
  ];

  // Configuration API
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ===== GESTION DES ERREURS D'AUTH =====
  const handleAuthError = (error: any) => {
    console.error('💥 [NotificationsPage] Erreur auth:', error);
    
    const isAuthRelated = 
      error.message?.includes('401') ||
      error.message?.includes('Unauthorized') ||
      error.message?.includes('Token') ||
      error.message?.includes('Session') ||
      error.status === 401;

    if (isAuthRelated) {
      setAuthError(true);
      setGlobalMessage({
        type: 'error',
        text: 'Session expirée. Veuillez vous reconnecter.'
      });
      
      // Délai avant redirection pour permettre à l'utilisateur de voir le message
      setTimeout(() => {
        logout();
      }, 2000);
      
      return true;
    }
    
    return false;
  };

  // ===== FONCTIONS API CORRIGÉES =====
  
  // Charger les notifications avec gestion d'erreur complète
  const loadNotifications = async () => {
    if (!isAuthenticated()) {
      console.warn('❌ [NotificationsPage] Non authentifié pour charger notifications');
      return;
    }

    setLoading(true);
    setAuthError(false);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm || '',
        type: filterType === 'all' ? '' : filterType,
        priority: filterPriority === 'all' ? '' : filterPriority,
        is_read: filterStatus === 'all' ? '' : filterStatus === 'read' ? 'true' : 'false',
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      const url = `${API_BASE}/api/notifications?${params}`;
      console.log('📡 [NotificationsPage] Requête:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders()
      });

      console.log('📥 [NotificationsPage] Réponse status:', response.status);

      if (response.status === 401) {
        handleAuthError({ status: 401, message: 'Unauthorized' });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => `HTTP ${response.status}`);
        throw new Error(errorText);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setPagination(data.pagination || pagination);
        console.log('✅ [NotificationsPage] Notifications chargées:', data.notifications?.length || 0);
        
        // Reset auth error si succès
        if (authError) setAuthError(false);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('💥 [NotificationsPage] Erreur chargement notifications:', error);
      
      if (!handleAuthError(error)) {
        setGlobalMessage({
          type: 'error',
          text: `Erreur de chargement: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les compteurs
  const loadCounts = async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/count`, {
        method: 'GET',
        headers: getApiHeaders()
      });

      if (response.status === 401) {
        handleAuthError({ status: 401 });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCounts(data.counts || counts);
          console.log('📊 [NotificationsPage] Compteurs mis à jour:', data.counts);
        }
      }
    } catch (error) {
      console.warn('⚠️ [NotificationsPage] Erreur chargement compteurs:', error);
      if (!handleAuthError(error)) {
        // Ignore silencieusement les erreurs de compteurs pour ne pas perturber l'UX
      }
    }
  };

  // Test de connexion API
  const testApiConnection = async () => {
    if (!isAuthenticated()) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/test/api`, {
        method: 'GET',
        headers: getApiHeaders()
      });

      if (response.status === 401) {
        handleAuthError({ status: 401 });
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [NotificationsPage] Test API réussi');
        setAuthError(false);
        setGlobalMessage({
          type: 'success',
          text: 'Connexion API rétablie'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('💥 [NotificationsPage] Test API échoué:', error);
      handleAuthError(error);
      return false;
    }
  };

  // Créer notification avec validation
  const createNotification = async (notificationData: CreateNotificationData) => {
    if (!isAuthenticated()) {
      return { success: false, error: 'Non authentifié' };
    }

    try {
      console.log('📤 [NotificationsPage] Création notification:', notificationData);

      const response = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(notificationData)
      });

      if (response.status === 401) {
        handleAuthError({ status: 401 });
        return { success: false, error: 'Session expirée' };
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Erreur ${response.status}`);
      }

      if (data.success) {
        console.log('✅ [NotificationsPage] Notification créée:', data.notification?.title);
        
        setGlobalMessage({
          type: 'success',
          text: data.message || 'Notification créée avec succès'
        });

        // Recharger les données
        await Promise.all([loadNotifications(), loadCounts()]);
        return { success: true };
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('💥 [NotificationsPage] Erreur création notification:', error);
      
      if (!handleAuthError(error)) {
        const errorMessage = error.message || 'Erreur lors de la création';
        setGlobalMessage({
          type: 'error',
          text: errorMessage
        });
      }
      
      return { success: false, error: error.message };
    }
  };

  // Marquer comme lu
  const markAsRead = async (id: string) => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      console.log('📖 [NotificationsPage] Marquage comme lu:', id);
      
      const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getApiHeaders(),
        body: JSON.stringify({ is_read: true })
      });

      if (response.status === 401) {
        handleAuthError({ status: 401 });
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ [NotificationsPage] Notification marquée comme lue');
        
        // Mise à jour locale immédiate
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        
        // Recharger les compteurs
        await loadCounts();
      } else {
        throw new Error(data.error || 'Erreur marquage lecture');
      }
    } catch (error: any) {
      console.error('💥 [NotificationsPage] Erreur marquage lu:', error);
      
      if (!handleAuthError(error)) {
        setGlobalMessage({
          type: 'error',
          text: `Erreur: ${error.message}`
        });
      }
    }
  };

  // Supprimer notification
  const deleteNotification = async (id: string) => {
    if (!isAuthenticated()) {
      return;
    }

    if (!window.confirm('Voulez-vous vraiment supprimer cette notification ?')) {
      return;
    }

    try {
      console.log('🗑️ [NotificationsPage] Suppression notification:', id);
      
      const response = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: getApiHeaders()
      });

      if (response.status === 401) {
        handleAuthError({ status: 401 });
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ [NotificationsPage] Notification supprimée');
        
        setGlobalMessage({
          type: 'success',
          text: data.message || 'Notification supprimée'
        });

        // Recharger les données
        await Promise.all([loadNotifications(), loadCounts()]);
      } else {
        throw new Error(data.error || 'Erreur suppression');
      }
    } catch (error: any) {
      console.error('💥 [NotificationsPage] Erreur suppression:', error);
      
      if (!handleAuthError(error)) {
        setGlobalMessage({
          type: 'error',
          text: `Erreur: ${error.message}`
        });
      }
    }
  };

  // ===== EFFETS =====
  
  // Chargement initial et lors des changements de filtres
  useEffect(() => {
    if (isAuthenticated() && !authError) {
      const timeoutId = setTimeout(() => {
        loadNotifications();
        loadCounts();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filterType, filterStatus, filterPriority, pagination.page, authError]);

  // Refresh automatique des compteurs
  useEffect(() => {
    if (!isAuthenticated() || authError) return;

    const interval = setInterval(() => {
      loadCounts();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [authError]);

  // Masquer les messages automatiquement
  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => {
        setGlobalMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // ===== HANDLERS =====
  
  const handleSaveNotification = async (notificationData: CreateNotificationData) => {
    const result = await createNotification(notificationData);
    if (result.success) {
      setShowAddForm(false);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedNotif(expandedNotif === id ? null : id);
  };

  const handleChangePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRetryConnection = async () => {
    console.log('🔄 [NotificationsPage] Tentative de reconnexion...');
    
    const success = await testApiConnection();
    if (success) {
      await Promise.all([loadNotifications(), loadCounts()]);
    }
  };

  // ===== UTILITAIRES =====
  
  const getTypeConfig = (type: string) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[1];
  };

  const getPriorityColor = (priority: string) => {
    return priorityLevels.find(p => p.value === priority)?.color || '#6B7280';
  };

  const getTypeIcon = (type: string) => {
    const config = getTypeConfig(type);
    return config.icon;
  };

  const getTypeBadge = (type: string) => {
    const config = getTypeConfig(type);
    return (
      <Badge 
        className="border-0 text-xs"
        style={{
          backgroundColor: `${config.color}15`,
          color: config.color
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isRead: boolean) => {
    return isRead ? (
      <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
        Lu
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
        Non lu
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const color = getPriorityColor(priority);
    const label = priorityLevels.find(p => p.value === priority)?.label || priority;
    
    return (
      <Badge 
        className="text-white border-0 text-xs"
        style={{ backgroundColor: color }}
      >
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return 'À l\'instant';
      } else if (diffHours < 24) {
        return `Il y a ${Math.floor(diffHours)}h`;
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = counts.total_unread;
    const urgent = counts.urgent_unread;
    const overdue = counts.overdue;
    const dueSoon = counts.due_soon;

    return {
      total,
      urgent,
      overdue,
      dueSoon,
      healthScore: Math.max(0, 100 - (urgent * 20) - (overdue * 15) - (dueSoon * 5))
    };
  }, [counts]);

  // ===== AFFICHAGE D'ERREUR AUTH =====
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="max-w-lg w-full border-red-200 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-800">Session expirée</h2>
            <p className="text-gray-600">
              Votre session a expiré. Veuillez vous reconnecter pour continuer.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleRetryConnection}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tester la connexion
              </Button>
              <Button 
                onClick={logout}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                Se reconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== RENDU PRINCIPAL =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Messages globaux */}
        {globalMessage && (
          <Alert className={`border-l-4 ${
            globalMessage.type === 'success' 
              ? 'border-l-green-500 bg-green-50' 
              : 'border-l-red-500 bg-red-50'
          }`}>
            <AlertDescription className={
              globalMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }>
              {globalMessage.text}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100 rounded-xl border border-cyan-200 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-600" />
              Centre de Notifications
            </h1>
            <p className="text-gray-700 mt-1">Gestion des communications et alertes en temps réel</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleRetryConnection}
              variant="outline"
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Notification
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Non lues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl text-white shadow-lg">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{stats.urgent}</p>
                  <p className="text-sm text-gray-600">Urgentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white shadow-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{stats.overdue}</p>
                  <p className="text-sm text-gray-600">En retard</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-indigo-600">{stats.dueSoon}</p>
                  <p className="text-sm text-gray-600">À traiter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.healthScore}%</p>
                  <p className="text-sm text-gray-600">Santé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par titre ou contenu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  />
                </div>
              </div>
              
              {/* Filtres */}
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px] border-blue-400 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-blue-100 text-blue-800 font-medium">
                    <SelectValue placeholder="Tous types" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200 shadow-lg">
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[150px] border-purple-400 focus:ring-purple-600 focus:border-purple-600 shadow-sm bg-purple-100 text-purple-800 font-medium">
                    <SelectValue placeholder="Toutes priorités" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-purple-200 shadow-lg">
                    {priorityLevels.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px] border-indigo-400 focus:ring-indigo-600 focus:border-indigo-600 shadow-sm bg-indigo-100 text-indigo-800 font-medium">
                    <SelectValue placeholder="Tous statuts" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-indigo-200 shadow-lg">
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="unread">Non lues</SelectItem>
                    <SelectItem value="read">Lues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des notifications */}
        <Card className="bg-white shadow-lg border-blue-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Notifications ({pagination.total})
              </CardTitle>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </div>
              )}
            </div>
          </CardHeader>

          <div className="max-h-[600px] overflow-y-auto">
            {notifications.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucune notification trouvée</p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 border-blue-500"
                  >
                    Effacer la recherche
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const TypeIcon = getTypeIcon(notification.type);
                  const isExpanded = expandedNotif === notification.id;
                  const typeConfig = getTypeConfig(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={`border-b border-gray-100 last:border-0 transition-all duration-200 ${
                        !notification.is_read ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          
                          {/* Icône et indicateur */}
                          <div className="flex-shrink-0 relative">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${typeConfig.color}15` }}
                            >
                              <TypeIcon 
                                className="w-5 h-5" 
                                style={{ color: typeConfig.color }}
                              />
                            </div>
                            {!notification.is_read && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              
                              <div className="flex-1">
                                {/* Titre et badges */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className={`font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>
                                    {notification.title}
                                  </h3>
                                  {getPriorityBadge(notification.priority)}
                                  {getTypeBadge(notification.type)}
                                  {getStatusBadge(notification.is_read)}
                                </div>

                                {/* Message (si développé) */}
                                {isExpanded && notification.message && (
                                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {notification.message}
                                    </p>
                                  </div>
                                )}

                                {/* Métadonnées */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(notification.created_at)}</span>
                                  </div>
                                  
                                  {notification.target_user_name && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>{notification.target_user_name}</span>
                                    </div>
                                  )}
                                  
                                  {notification.created_by_name && (
                                    <div className="flex items-center gap-1">
                                      <Send className="w-3 h-3" />
                                      <span>Par {notification.created_by_name}</span>
                                    </div>
                                  )}

                                  {notification.due_date && (
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3" />
                                      <span>Échéance: {formatDate(notification.due_date)}</span>
                                    </div>
                                  )}

                                  {notification.reminder_date && (
                                    <div className="flex items-center gap-1">
                                      <Timer className="w-3 h-3" />
                                      <span>Rappel: {formatDate(notification.reminder_date)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {notification.message && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleExpand(notification.id)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                                    title={isExpanded ? "Réduire" : "Voir détails"}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-8 w-8 p-0 hover:bg-green-100 text-green-600"
                                    title="Marquer comme lu"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                {notification.can_delete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} notifications)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1 || loading}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages || loading}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de création */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Nouvelle notification</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <NotificationFormContent 
                onSave={handleSaveNotification}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COMPOSANT FORMULAIRE CORRIGÉ =====
function NotificationFormContent({ 
  onSave, 
  onCancel 
}: { 
  onSave: (data: CreateNotificationData) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    category: 'general',
    due_date: '',
    reminder_date: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // ===== VALIDATION DES DATES =====
  const validateDates = () => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];
    
    if (!formData.due_date && !formData.reminder_date) {
      return { errors: newErrors, warnings: newWarnings };
    }

    const now = new Date();
    const dueDate = formData.due_date ? new Date(formData.due_date) : null;
    const reminderDate = formData.reminder_date ? new Date(formData.reminder_date) : null;

    if (formData.due_date && (!dueDate || isNaN(dueDate.getTime()))) {
      newErrors.push('Format de date d\'échéance invalide');
    }
    
    if (formData.reminder_date && (!reminderDate || isNaN(reminderDate.getTime()))) {
      newErrors.push('Format de date de rappel invalide');
    }

    if (newErrors.length > 0) return { errors: newErrors, warnings: newWarnings };

    if (dueDate && dueDate <= now) {
      newErrors.push('La date d\'échéance doit être dans le futur');
    }

    if (reminderDate && reminderDate <= now) {
      newWarnings.push('La date de rappel sera automatiquement ajustée si elle est dans le passé');
    }

    if (dueDate && reminderDate && reminderDate >= dueDate) {
      newErrors.push('La date de rappel doit être antérieure à la date d\'échéance');
    }

    if (dueDate && reminderDate) {
      const diffHours = (dueDate.getTime() - reminderDate.getTime()) / (1000 * 60 * 60);
      if (diffHours < 1) {
        newWarnings.push('Le rappel et l\'échéance sont très proches (moins d\'1 heure)');
      }
    }

    return { errors: newErrors, warnings: newWarnings };
  };

  useEffect(() => {
    const { errors: dateErrors, warnings: dateWarnings } = validateDates();
    setErrors(dateErrors);
    setWarnings(dateWarnings);
  }, [formData.due_date, formData.reminder_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.title.trim()) {
        setErrors(['Le titre est obligatoire']);
        return;
      }

      if (formData.title.length > 255) {
        setErrors(['Le titre ne peut pas dépasser 255 caractères']);
        return;
      }

      const { errors: dateErrors } = validateDates();
      if (dateErrors.length > 0) {
        setErrors(dateErrors);
        return;
      }

      const notificationData: CreateNotificationData = {
        title: formData.title.trim(),
        message: formData.message.trim() || undefined,
        type: formData.type,
        priority: formData.priority,
        category: formData.category,
        user_id: null,
        due_date: formData.due_date || null,
        reminder_date: formData.reminder_date || null,
        related_entity_type: null,
        related_entity_id: null,
        metadata: {}
      };

      await onSave(notificationData);
      
    } catch (error) {
      console.error('💥 Erreur soumission formulaire:', error);
      setErrors(['Erreur lors de la création de la notification']);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field: 'due_date' | 'reminder_date', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'due_date' && value && !formData.reminder_date) {
      const dueDate = new Date(value);
      const reminderDate = new Date(dueDate.getTime() - (24 * 60 * 60 * 1000));
      
      if (reminderDate > new Date()) {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          reminder_date: reminderDate.toISOString().slice(0, 16)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Messages d'erreur */}
      {errors.length > 0 && (
        <Alert className="border-l-4 border-l-red-500 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-800">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages d'avertissement */}
      {warnings.length > 0 && (
        <Alert className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre * <span className="text-xs text-gray-500">(max 255 caractères)</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Titre de la notification"
          required
          maxLength={255}
          className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        <div className="text-xs text-gray-500 mt-1">
          {formData.title.length}/255 caractères
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Contenu détaillé du message..."
          rows={4}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
        />
      </div>

      {/* Type et Priorité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-blue-200 shadow-lg">
              <SelectItem value="info">Information</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="reminder">Rappel</SelectItem>
              <SelectItem value="alert">Alerte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorité
          </label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-200 shadow-lg">
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégorie
        </label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger className="border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-indigo-200 shadow-lg">
            <SelectItem value="general">Général</SelectItem>
            <SelectItem value="expense">Dépenses</SelectItem>
            <SelectItem value="payment">Paiements</SelectItem>
            <SelectItem value="salary">Salaires</SelectItem>
            <SelectItem value="system">Système</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'échéance
          </label>
          <Input
            type="datetime-local"
            value={formData.due_date}
            onChange={(e) => handleDateChange('due_date', e.target.value)}
            className="border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
            min={new Date().toISOString().slice(0, 16)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Doit être dans le futur
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de rappel
          </label>
          <Input
            type="datetime-local"
            value={formData.reminder_date}
            onChange={(e) => handleDateChange('reminder_date', e.target.value)}
            className="border-teal-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            min={new Date().toISOString().slice(0, 16)}
            max={formData.due_date || undefined}
          />
          <div className="text-xs text-gray-500 mt-1">
            Sera ajustée automatiquement si nécessaire
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title.trim() || errors.length > 0}
          className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            'Créer la notification'
          )}
        </Button>
      </div>
    </form>
  );
}

export default NotificationsPage;