// src/components/notifications/NotificationItem.tsx - Item avec édition inline

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Eye, 
  EyeOff,
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Clock, 
  Bell,
  Edit2,
  Save,
  Cancel,
  Trash2,
  MoreVertical,
  Calendar,
  User,
  Tag,
  Zap,
  Archive
} from 'lucide-react';
import notificationService, { 
  type Notification, 
  type NotificationType, 
  type NotificationPriority 
} from '../../services/notificationService';

interface NotificationItemProps {
  /** Notification à afficher */
  notification: Notification;
  /** Callback appelé après une action (pour rafraîchir la liste) */
  onUpdate?: (notification: Notification) => void;
  /** Callback appelé après suppression */
  onDelete?: (id: string) => void;
  /** Mode compact (pour dropdown par exemple) */
  compact?: boolean;
  /** Afficher les actions d'édition */
  showEditActions?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onUpdate,
  onDelete,
  compact = false,
  showEditActions = true,
  className = ''
}) => {
  // États
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // États d'édition
  const [editTitle, setEditTitle] = useState(notification.title);
  const [editPriority, setEditPriority] = useState(notification.priority);
  const [editType, setEditType] = useState(notification.type);
  
  const actionsRef = useRef<HTMLDivElement>(null);

  // Configuration des types et priorités
  const typeConfigs = {
    info: { icon: Info, color: '#3B82F6', label: 'Information' },
    warning: { icon: AlertCircle, color: '#F59E0B', label: 'Avertissement' },
    error: { icon: AlertTriangle, color: '#DC2626', label: 'Erreur' },
    success: { icon: CheckCircle, color: '#059669', label: 'Succès' },
    reminder: { icon: Clock, color: '#7C3AED', label: 'Rappel' },
    alert: { icon: Bell, color: '#DC2626', label: 'Alerte' }
  };

  const priorityConfigs = {
    low: { color: '#059669', label: 'Faible' },
    medium: { color: '#D97706', label: 'Moyenne' },
    high: { color: '#EA580C', label: 'Haute' },
    urgent: { color: '#DC2626', label: 'Urgente' }
  };

  const typeConfig = typeConfigs[notification.type];
  const TypeIcon = typeConfig.icon;

  // Fermer le menu actions si clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleToggleRead = async () => {
    setLoading(true);
    try {
      await notificationService.markAsRead(notification.id, !notification.is_read);
      const updatedNotification = { ...notification, is_read: !notification.is_read };
      onUpdate?.(updatedNotification);
    } catch (error) {
      console.error('Erreur toggle lecture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous supprimer cette notification ?')) {
      setLoading(true);
      try {
        await notificationService.deleteNotification(notification.id);
        onDelete?.(notification.id);
      } catch (error) {
        console.error('Erreur suppression:', error);
        setLoading(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    
    setLoading(true);
    try {
      // Simuler la mise à jour (le backend n'a pas d'endpoint update)
      // Dans un vrai cas, on ferait un PUT vers /api/notifications/:id
      const updatedNotification = {
        ...notification,
        title: editTitle.trim(),
        priority: editPriority,
        type: editType
      };
      
      setIsEditing(false);
      onUpdate?.(updatedNotification);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(notification.title);
    setEditPriority(notification.priority);
    setEditType(notification.type);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (compact) {
      if (diffHours < 1) return 'Maintenant';
      if (diffHours < 24) return `${Math.floor(diffHours)}h`;
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${Math.floor(diffHours)}h`;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeadlineStatus = () => {
    if (!notification.due_date) return null;
    
    const dueDate = new Date(notification.due_date);
    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours <= 0) return { status: 'overdue', color: '#DC2626', label: 'En retard' };
    if (diffHours <= 24) return { status: 'due_soon', color: '#F59E0B', label: 'Urgent' };
    return { status: 'on_time', color: '#059669', label: 'À temps' };
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className={`
      group relative transition-all duration-200
      ${!notification.is_read ? 'bg-blue-50/50' : 'bg-white'}
      ${compact ? 'p-3' : 'p-4'}
      border border-gray-100 rounded-lg hover:shadow-md
      ${notification.priority === 'urgent' ? 'border-l-4 border-l-red-500' : ''}
      ${className}
    `}>
      
      {/* Contenu principal */}
      <div className="flex items-start gap-3">
        
        {/* Icône et indicateur */}
        <div className="flex-shrink-0 relative">
          <div 
            className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg`}
            style={{ backgroundColor: `${typeConfig.color}15` }}
          >
            <TypeIcon 
              className={compact ? 'w-4 h-4' : 'w-5 h-5'} 
              style={{ color: typeConfig.color }}
            />
          </div>
          
          {/* Indicateur non lu */}
          {!notification.is_read && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
          )}
          
          {/* Indicateur urgent */}
          {notification.priority === 'urgent' && (
            <Zap className="absolute -bottom-1 -left-1 w-3 h-3 text-red-500" />
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          
          {/* Header avec titre et actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              
              {/* Titre (éditable ou non) */}
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Titre de la notification"
                  autoFocus
                />
              ) : (
                <h3 
                  className={`
                    ${compact ? 'text-sm' : 'text-base'} text-gray-900 leading-tight
                    ${!notification.is_read ? 'font-semibold' : 'font-medium'}
                    ${showEditActions ? 'cursor-pointer hover:text-blue-600' : ''}
                  `}
                  onClick={() => showEditActions && setIsEditing(true)}
                  title={showEditActions ? 'Cliquer pour éditer' : undefined}
                >
                  {notification.title}
                </h3>
              )}

              {/* Métadonnées en mode édition */}
              {isEditing && (
                <div className="flex gap-2 mt-2">
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as NotificationType)}
                    className="text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    {Object.entries(typeConfigs).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as NotificationPriority)}
                    className="text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    {Object.entries(priorityConfigs).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Badges et métadonnées */}
              {!isEditing && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Badge priorité */}
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${priorityConfigs[notification.priority].color}15`,
                      color: priorityConfigs[notification.priority].color
                    }}
                  >
                    {priorityConfigs[notification.priority].label}
                  </span>

                  {/* Badge échéance */}
                  {deadlineStatus && (
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1"
                      style={{
                        backgroundColor: `${deadlineStatus.color}15`,
                        color: deadlineStatus.color
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      {deadlineStatus.label}
                    </span>
                  )}

                  {/* Badge catégorie */}
                  {notification.category && (
                    <span className="px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded-full capitalize">
                      {notification.category}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isEditing ? (
                // Actions d'édition
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading || !editTitle.trim()}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Sauvegarder"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                // Actions normales
                <>
                  {notification.message && !compact && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title={isExpanded ? "Réduire" : "Voir détails"}
                    >
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  
                  <button
                    onClick={handleToggleRead}
                    disabled={loading}
                    className={`
                      p-1.5 rounded-lg transition-colors disabled:opacity-50
                      ${notification.is_read 
                        ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
                        : 'text-green-600 hover:bg-green-50'
                      }
                    `}
                    title={notification.is_read ? "Marquer comme non lu" : "Marquer comme lu"}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  
                  {showEditActions && (
                    <div className="relative" ref={actionsRef}>
                      <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Plus d'actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Menu actions */}
                      {showActions && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setShowActions(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Modifier
                            </button>
                            
                            {notification.due_date && (
                              <button
                                onClick={() => setShowActions(false)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Calendar className="w-4 h-4" />
                                Voir échéance
                              </button>
                            )}
                            
                            <div className="border-t border-gray-100 my-1"></div>
                            
                            <button
                              onClick={() => {
                                handleDelete();
                                setShowActions(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!showEditActions && (
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Message développé */}
          {isExpanded && notification.message && !isEditing && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {notification.message}
              </p>
            </div>
          )}

          {/* Métadonnées détaillées */}
          {!compact && !isEditing && (
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(notification.created_at)}
              </span>
              
              {notification.created_by_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {notification.created_by_name}
                </span>
              )}
              
              {notification.target_user_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Pour: {notification.target_user_name}
                </span>
              )}
              
              {notification.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Échéance: {formatDate(notification.due_date)}
                </span>
              )}
            </div>
          )}

          {/* Indicateur de progression pour échéance */}
          {notification.due_date && !compact && !isEditing && (
            <div className="mt-2">
              {(() => {
                const dueDate = new Date(notification.due_date);
                const now = new Date();
                const created = new Date(notification.created_at);
                const total = dueDate.getTime() - created.getTime();
                const elapsed = now.getTime() - created.getTime();
                const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
                
                let barColor = '#059669'; // Vert par défaut
                if (progress > 80) barColor = '#F59E0B'; // Orange
                if (progress >= 100) barColor = '#DC2626'; // Rouge
                
                return (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: barColor
                      }}
                    ></div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Effet de survol pour interaction */}
      <div className="absolute inset-0 rounded-lg transition-all duration-200 pointer-events-none group-hover:ring-1 group-hover:ring-blue-200"></div>
    </div>
  );
};

export default NotificationItem;