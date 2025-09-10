// src/components/notifications/NotificationList.tsx - Liste complète avec filtres

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  X, 
  RefreshCw,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Tag,
  Zap,
  Grid,
  List,
  Download
} from 'lucide-react';
import NotificationItem from './NotificationItem';
import useNotification from '../../hooks/useNotification';
import notificationService, { 
  type Notification, 
  type NotificationFilters, 
  type NotificationType, 
  type NotificationPriority,
  type CreateNotificationData 
} from '../../services/notificationService';

interface NotificationListProps {
  /** Filtres initiaux */
  initialFilters?: Partial<NotificationFilters>;
  /** Afficher la barre de création rapide */
  showQuickCreate?: boolean;
  /** Afficher les filtres avancés */
  showAdvancedFilters?: boolean;
  /** Afficher les actions bulk */
  showBulkActions?: boolean;
  /** Mode d'affichage */
  viewMode?: 'list' | 'grid';
  /** Hauteur maximale de la liste */
  maxHeight?: string;
  /** Callback lors de la sélection d'une notification */
  onNotificationSelect?: (notification: Notification) => void;
  /** Classe CSS personnalisée */
  className?: string;
}

const NotificationList: React.FC<NotificationListProps> = ({
  initialFilters = {},
  showQuickCreate = true,
  showAdvancedFilters = true,
  showBulkActions = true,
  viewMode: initialViewMode = 'list',
  maxHeight = '600px',
  onNotificationSelect,
  className = ''
}) => {
  // États locaux
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>(
    (initialFilters.type as NotificationType) || 'all'
  );
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>(
    (initialFilters.priority as NotificationPriority) || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<'read' | 'unread' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'due_date' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // États pour la création rapide
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<NotificationType>('info');
  const [quickPriority, setQuickPriority] = useState<NotificationPriority>('medium');
  const [isCreating, setIsCreating] = useState(false);

  // Hook notifications
  const [{ notifications, loading, pagination, userInfo }, {
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultipleNotifications,
    createNotification,
    updateFilters,
    setPage
  }] = useNotification({
    autoLoad: true,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  });

  // Configuration des options
  const typeOptions = [
    { value: 'all', label: 'Tous types', color: '#6B7280' },
    { value: 'info', label: 'Information', color: '#3B82F6' },
    { value: 'warning', label: 'Avertissement', color: '#F59E0B' },
    { value: 'error', label: 'Erreur', color: '#DC2626' },
    { value: 'success', label: 'Succès', color: '#059669' },
    { value: 'reminder', label: 'Rappel', color: '#7C3AED' },
    { value: 'alert', label: 'Alerte', color: '#DC2626' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'Toutes priorités', color: '#6B7280' },
    { value: 'urgent', label: 'Urgente', color: '#DC2626' },
    { value: 'high', label: 'Haute', color: '#EA580C' },
    { value: 'medium', label: 'Moyenne', color: '#D97706' },
    { value: 'low', label: 'Faible', color: '#059669' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date de création' },
    { value: 'priority', label: 'Priorité' },
    { value: 'due_date', label: 'Échéance' },
    { value: 'title', label: 'Titre' }
  ];

  // Filtres mémorisés
  const filters = useMemo((): NotificationFilters => ({
    search: searchTerm,
    type: selectedType === 'all' ? '' : selectedType,
    priority: selectedPriority === 'all' ? '' : selectedPriority,
    is_read: selectedStatus === 'all' ? '' : selectedStatus === 'read' ? 'true' : 'false',
    sort_by: sortBy,
    sort_order: sortOrder,
    page: pagination?.page || 1,
    limit: 20,
    ...initialFilters
  }), [searchTerm, selectedType, selectedPriority, selectedStatus, sortBy, sortOrder, pagination?.page, initialFilters]);

  // Appliquer les filtres
  useEffect(() => {
    updateFilters(filters);
  }, [filters, updateFilters]);

  // Handlers
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsCreating(true);
    try {
      const data: CreateNotificationData = {
        title: quickTitle.trim(),
        type: quickType,
        priority: quickPriority,
        category: 'general'
      };

      await createNotification(data);
      setQuickTitle('');
      setQuickType('info');
      setQuickPriority('medium');
    } catch (error) {
      console.error('Erreur création rapide:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectNotification = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedNotifications);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleBulkMarkAsRead = async () => {
    const unreadSelected = notifications
      .filter(n => selectedNotifications.has(n.id) && !n.is_read)
      .map(n => n.id);

    for (const id of unreadSelected) {
      try {
        await markAsRead(id, true);
      } catch (error) {
        console.error('Erreur marquage bulk:', error);
      }
    }
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (window.confirm(`Voulez-vous supprimer ${selectedNotifications.size} notification(s) ?`)) {
      try {
        await deleteMultipleNotifications(Array.from(selectedNotifications));
        setSelectedNotifications(new Set());
      } catch (error) {
        console.error('Erreur suppression bulk:', error);
      }
    }
  };

  const handleExport = () => {
    const csv = notificationService.exportToCSV(notifications);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getQuickStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const urgent = notifications.filter(n => n.priority === 'urgent').length;
    const overdue = notifications.filter(n => 
      n.due_date && new Date(n.due_date) < new Date()
    ).length;

    return { total, unread, urgent, overdue };
  };

  const stats = getQuickStats();

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      
      {/* Header avec statistiques rapides */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Titre et stats */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications ({pagination?.total || 0})
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{stats.unread} non lues</span>
              {stats.urgent > 0 && <span className="text-red-600">{stats.urgent} urgentes</span>}
              {stats.overdue > 0 && <span className="text-orange-600">{stats.overdue} en retard</span>}
            </div>
          </div>

          {/* Actions et mode d'affichage */}
          <div className="flex items-center gap-2">
            {showBulkActions && selectedNotifications.size > 0 && (
              <>
                <button
                  onClick={handleBulkMarkAsRead}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marquer lu ({selectedNotifications.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer ({selectedNotifications.size})
                </button>
              </>
            )}

            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Basculer en vue ${viewMode === 'list' ? 'grille' : 'liste'}`}
            >
              {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Filtres"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={handleExport}
              disabled={notifications.length === 0}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Exporter CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => loadNotifications()}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Création rapide */}
      {showQuickCreate && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleQuickCreate} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Créer une notification rapide..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={quickType}
              onChange={(e) => setQuickType(e.target.value as NotificationType)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.slice(1).map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as NotificationPriority)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityOptions.slice(1).map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!quickTitle.trim() || isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Créer
            </button>
          </form>
        </div>
      )}

      {/* Filtres avancés */}
      {showFilters && showAdvancedFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            
            {/* Recherche */}
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {typeOptions.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* Priorité */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {priorityOptions.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>

            {/* Statut */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'read' | 'unread' | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Tous statuts</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>

            {/* Tri */}
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                title={`Tri ${sortOrder === 'asc' ? 'croissant' : 'décroissant'}`}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions bulk header */}
      {showBulkActions && notifications.length > 0 && (
        <div className="p-3 bg-blue-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Sélectionner tout ({notifications.length})
            </label>
            
            {notifications.length > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      )}

      {/* Liste des notifications */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Aucune notification trouvée</p>
            {(searchTerm || selectedType !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedPriority('all');
                  setSelectedStatus('all');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Effacer tous les filtres
              </button>
            )}
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4' 
              : 'space-y-0'
            }
          `}>
            {notifications.map((notification, index) => (
              <div key={notification.id} className={viewMode === 'list' ? 'border-b border-gray-100 last:border-0' : ''}>
                {showBulkActions && (
                  <div className="flex items-start gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <NotificationItem
                        notification={notification}
                        compact={viewMode === 'grid'}
                        showEditActions={userInfo?.canCreate || false}
                        onUpdate={(updated) => onNotificationSelect?.(updated)}
                        onDelete={() => {
                          setSelectedNotifications(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(notification.id);
                            return newSet;
                          });
                        }}
                        className={viewMode === 'grid' ? 'border border-gray-200 rounded-lg' : 'border-0'}
                      />
                    </div>
                  </div>
                )}
                {!showBulkActions && (
                  <NotificationItem
                    notification={notification}
                    compact={viewMode === 'grid'}
                    showEditActions={userInfo?.canCreate || false}
                    onUpdate={(updated) => onNotificationSelect?.(updated)}
                    className={`
                      ${viewMode === 'list' ? 'border-0 rounded-none' : 'border border-gray-200 rounded-lg'}
                      ${viewMode === 'list' && index === 0 ? 'rounded-t-none' : ''}
                      ${viewMode === 'list' && index === notifications.length - 1 ? 'rounded-b-none' : ''}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.pages} 
              ({pagination.total} notification{pagination.total > 1 ? 's' : ''})
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                {pagination.page}
              </span>
              
              <button
                onClick={() => setPage(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page >= pagination.pages || loading}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;