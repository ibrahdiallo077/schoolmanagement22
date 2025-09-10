// src/hooks/useNotificationCounter.ts
import { useState, useEffect, useCallback } from 'react';

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

interface UseNotificationCounterReturn {
  unreadCount: number;
  urgentCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  counts: NotificationCounts | null;
  hasUrgent: boolean;
  hasUnread: boolean;
  badgeColor: string;
  badgeVariant: 'default' | 'urgent' | 'warning';
}

export const useNotificationCounter = (): UseNotificationCounterReturn => {
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration API
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fonction pour récupérer le token d'authentification
  const getAuthToken = (): string | null => {
    try {
      const sources = [
        localStorage.getItem('auth_token'),
        localStorage.getItem('token'),
        localStorage.getItem('accessToken'),
        sessionStorage.getItem('auth_token'),
        sessionStorage.getItem('token')
      ];

      for (const token of sources) {
        if (token && typeof token === 'string' && token.trim() && 
            token !== 'undefined' && token !== 'null' && token.length > 10) {
          return token.trim();
        }
      }

      return null;
    } catch (error) {
      console.error('Erreur récupération token:', error);
      return null;
    }
  };

  // Headers pour les requêtes API
  const getHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-auth-token'] = token;
    }

    return headers;
  };

  // Fonction pour charger les compteurs
  const loadCounts = useCallback(async () => {
    if (!getAuthToken()) {
      console.warn('Pas de token disponible pour charger les compteurs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/notifications/count`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (response.status === 401) {
        console.warn('Token expiré - ne pas mettre à jour les compteurs');
        setError('Session expirée');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.counts) {
        setCounts(data.counts);
        console.log('✅ Compteurs notifications mis à jour:', data.counts.total_unread);
      } else {
        throw new Error(data.error || 'Erreur réponse serveur');
      }
    } catch (err: any) {
      console.error('Erreur chargement compteurs notifications:', err);
      
      // En cas d'erreur, réinitialiser à zéro pour éviter des valeurs incorrectes
      setCounts({
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
      
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Chargement initial
  useEffect(() => {
    if (getAuthToken()) {
      loadCounts();
    }
  }, [loadCounts]);

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (getAuthToken()) {
        loadCounts();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [loadCounts]);

  // Valeurs calculées
  const unreadCount = counts?.total_unread || 0;
  const urgentCount = counts?.urgent_unread || 0;
  const hasUrgent = urgentCount > 0;
  const hasUnread = unreadCount > 0;

  // Déterminer la couleur et le variant du badge
  const getBadgeStyle = () => {
    if (urgentCount > 0) {
      return {
        color: '#DC2626', // Rouge
        variant: 'urgent' as const
      };
    } else if (counts?.overdue && counts.overdue > 0) {
      return {
        color: '#EA580C', // Orange
        variant: 'warning' as const
      };
    } else if (hasUnread) {
      return {
        color: '#2563EB', // Bleu
        variant: 'default' as const
      };
    } else {
      return {
        color: '#6B7280', // Gris
        variant: 'default' as const
      };
    }
  };

  const badgeStyle = getBadgeStyle();

  return {
    unreadCount,
    urgentCount,
    loading,
    error,
    refresh: loadCounts,
    counts,
    hasUrgent,
    hasUnread,
    badgeColor: badgeStyle.color,
    badgeVariant: badgeStyle.variant
  };
};