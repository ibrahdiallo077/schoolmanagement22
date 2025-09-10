// src/components/notifications/NotificationBadge.tsx - Badge + Dropdown CORRIGÉ

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Clock, 
  ExternalLink,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { useNotificationCounts } from '../../hooks/useNotification'; // Import direct corrigé
import notificationService, { 
  type Notification, 
  type NotificationType 
} from '../../services/notificationService';

interface NotificationBadgeProps {
  /** Taille du badge */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher le dropdown au clic */
  showDropdown?: boolean;
  /** Callback quand on clique sur "Voir tout" */
  onViewAll?: () => void;
  /** Position du dropdown */
  dropdownPosition?: 'left' | 'right';
  /** Classe CSS personnalisée */
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 'md',
  showDropdown = true,
  onViewAll,
  dropdownPosition = 'right',
  className = ''
}) => {
  // États
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hook pour les compteurs avec gestion d'erreur
  const { 
    counts, 
    unreadCount, 
    refresh, 
    authError,
    loading: countsLoading
  } = useNotificationCounts();

  // Si erreur d'auth, ne pas afficher
  if (authError) {
    return null;
  }

  // Tailles selon la prop
  const sizeConfig = {
    sm: { 
      icon: 'w-4 h-4', 
      badge: 'text-xs px-1.5 py-0.5 min-w-[18px] h-[18px]',
      button: 'p-1.5'
    },
    md: { 
      icon: 'w-5 h-5', 
      badge: 'text-xs px-2 py-1 min-w-[20px] h-[20px]',
      button: 'p-2'
    },
    lg: { 
      icon: 'w-6 h-6', 
      badge: 'text-sm px-2.5 py-1 min-w-[24px] h-[24px]',
      button: 'p-2.5'
    }
  };

  const config = sizeConfig[size];

  // Fermer le dropdown si clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les notifications récentes quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && showDropdown) {
      loadRecentNotifications();
    }
  }, [isOpen, showDropdown]);

  const loadRecentNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        limit: 8,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      if (result.success) {
        setRecentNotifications(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement notifications récentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeClick = () => {
    if (showDropdown) {
      setIsOpen(!isOpen);
    } else if (onViewAll) {
      onViewAll();
    }
  };

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const result = await notificationService.markAsRead(id, true);
      if (result.success) {
        // Mettre à jour localement
        setRecentNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        refresh(); // Rafraîchir les compteurs
      }
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const result = await notificationService.deleteNotification(id);
      if (result.success) {
        // Supprimer localement
        setRecentNotifications(prev => prev.filter(n => n.id !== id));
        refresh(); // Rafraîchir les compteurs
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setRecentNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        refresh();
      }
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    const icons = {
      info: Info,
      warning: AlertCircle,
      error: AlertTriangle,
      success: CheckCircle,
      reminder: Clock,
      alert: Bell
    };
    return icons[type] || Bell;
  };

  const getTypeColor = (type: NotificationType) => {
    const colors = {
      info: '#3B82F6',
      warning: '#F59E0B',
      error: '#DC2626',
      success: '#059669',
      reminder: '#7C3AED',
      alert: '#DC2626'
    };
    return colors[type] || '#6B7280';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}j`;
  };

  // Déterminer la couleur du badge selon l'urgence
  const getBadgeColor = () => {
    if (counts?.urgent_unread && counts.urgent_unread > 0) return 'bg-red-500';
    if (counts?.overdue && counts.overdue > 0) return 'bg-orange-500';
    if (unreadCount > 0) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton Badge */}
      <button
        onClick={handleBadgeClick}
        disabled={countsLoading}
        className={`
          relative ${config.button} rounded-lg transition-all duration-200
          ${isOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50
        `}
        title={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
      >
        <Bell className={`${config.icon} ${countsLoading ? 'animate-pulse' : ''}`} />
        
        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className={`
            absolute -top-1 -right-1 ${config.badge} ${getBadgeColor()}
            text-white font-medium rounded-full flex items-center justify-center
            transform transition-transform duration-200
            ${isOpen ? 'scale-110' : 'scale-100'}
          `}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Indicateur urgent */}
        {counts?.urgent_unread && counts.urgent_unread > 0 && (
          <Zap className="absolute -bottom-0.5 -left-0.5 w-3 h-3 text-red-500 animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && showDropdown && (
        <div className={`
          absolute top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50
          ${dropdownPosition === 'left' ? 'right-0' : 'left-0'}
          transform transition-all duration-200 origin-top
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}>
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  {counts?.urgent_unread && counts.urgent_unread > 0 && (
                    <span className="text-red-600 font-medium ml-1">
                      · {counts.urgent_unread} urgente{counts.urgent_unread > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                    title="Marquer tout comme lu"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const TypeIcon = getTypeIcon(notification.type);
                const typeColor = getTypeColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`
                      p-3 border-b border-gray-50 last:border-0 transition-colors
                      ${!notification.is_read ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      
                      {/* Icône */}
                      <div className="flex-shrink-0 relative">
                        <div 
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${typeColor}15` }}
                        >
                          <TypeIcon 
                            className="w-4 h-4" 
                            style={{ color: typeColor }}
                          />
                        </div>
                        {!notification.is_read && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`text-sm text-gray-900 ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </h4>
                            {notification.message && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {notification.priority === 'urgent' && (
                                <span className="text-xs text-red-600 font-medium">
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 transition-colors"
                                title="Marquer comme lu"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewAll?.();
                }}
                className="w-full p-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Voir toutes les notifications
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;