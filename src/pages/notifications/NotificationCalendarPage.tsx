// src/pages/notifications/NotificationCalendarPage.tsx - Calendrier avec alertes

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Info,
  List,
  Grid
} from 'lucide-react';
import { NotificationItem, NotificationBadge } from '../../components/notifications';
import useNotification from '../../hooks/useNotification';
import notificationService, { type Notification, type NotificationAlert } from '../../services/notificationService';

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  notifications: Notification[];
  urgentCount: number;
  overdueCount: number;
  totalCount: number;
  status: 'empty' | 'normal' | 'has_unread' | 'urgent' | 'overdue';
}

const NotificationCalendarPage: React.FC = () => {
  // États
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'alerts' | 'stats'>('calendar');
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'urgent' | 'high'>('all');

  // Hook notifications
  const [{ notifications }, { loadNotifications }] = useNotification({
    autoLoad: true,
    autoRefresh: true,
    refreshInterval: 60000
  });

  // Mémorisations
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

  // Charger les données du calendrier
  useEffect(() => {
    loadCalendarData();
    loadAlerts();
  }, [currentMonth, currentYear]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Générer les jours du calendrier
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const startCalendar = new Date(firstDay);
      startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());
      
      const days: CalendarDay[] = [];
      const today = new Date();
      
      // Générer 42 jours (6 semaines)
      for (let i = 0; i < 42; i++) {
        const date = new Date(startCalendar);
        date.setDate(startCalendar.getDate() + i);
        
        const dateString = date.toISOString().split('T')[0];
        const dayNotifications = notifications.filter(n => {
          const notifDate = new Date(n.due_date || n.created_at).toISOString().split('T')[0];
          return notifDate === dateString;
        });

        const urgentCount = dayNotifications.filter(n => n.priority === 'urgent').length;
        const overdueCount = dayNotifications.filter(n => {
          const dueDate = n.due_date ? new Date(n.due_date) : null;
          return dueDate && dueDate < today;
        }).length;

        let status: CalendarDay['status'] = 'empty';
        if (urgentCount > 0) status = 'urgent';
        else if (overdueCount > 0) status = 'overdue';
        else if (dayNotifications.some(n => !n.is_read)) status = 'has_unread';
        else if (dayNotifications.length > 0) status = 'normal';

        days.push({
          date: dateString,
          day: date.getDate(),
          isCurrentMonth: date.getMonth() === currentMonth,
          isToday: dateString === today.toISOString().split('T')[0],
          notifications: dayNotifications,
          urgentCount,
          overdueCount,
          totalCount: dayNotifications.length,
          status
        });
      }
      
      setCalendarData(days);
    } catch (error) {
      console.error('Erreur chargement calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const result = await notificationService.getAlerts();
      setAlerts(result.alerts);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    }
  };

  // Navigation mois
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentMonth + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Gestionnaires
  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(selectedDate === day.date ? null : day.date);
  };

  const getStatusColor = (status: CalendarDay['status']) => {
    switch (status) {
      case 'urgent': return 'bg-red-500';
      case 'overdue': return 'bg-orange-500';
      case 'has_unread': return 'bg-blue-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return AlertTriangle;
      case 'due_soon': return Clock;
      case 'urgent_unread': return Zap;
      default: return AlertCircle;
    }
  };

  // Statistiques du mois
  const monthStats = useMemo(() => {
    const monthDays = calendarData.filter(day => day.isCurrentMonth);
    const totalNotifs = monthDays.reduce((sum, day) => sum + day.totalCount, 0);
    const urgentNotifs = monthDays.reduce((sum, day) => sum + day.urgentCount, 0);
    const overdueNotifs = monthDays.reduce((sum, day) => sum + day.overdueCount, 0);
    const daysWithEvents = monthDays.filter(day => day.totalCount > 0).length;

    return {
      totalNotifs,
      urgentNotifs,
      overdueNotifs,
      daysWithEvents,
      avgPerDay: daysWithEvents > 0 ? (totalNotifs / daysWithEvents).toFixed(1) : '0'
    };
  }, [calendarData]);

  // Notifications du jour sélectionné
  const selectedDayNotifications = useMemo(() => {
    if (!selectedDate) return [];
    const day = calendarData.find(d => d.date === selectedDate);
    return day?.notifications.filter(n => {
      if (selectedPriority === 'all') return true;
      return n.priority === selectedPriority;
    }) || [];
  }, [selectedDate, calendarData, selectedPriority]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Calendrier des Notifications
              </h1>
              <p className="text-gray-600 text-sm">
                Visualisez vos notifications et échéances
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                viewMode === 'calendar' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('alerts')}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                viewMode === 'alerts' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                viewMode === 'stats' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total ce mois</p>
                <p className="text-2xl font-bold text-gray-900">{monthStats.totalNotifs}</p>
              </div>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{monthStats.urgentNotifs}</p>
              </div>
              <Zap className="w-5 h-5 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-orange-600">{monthStats.overdueNotifs}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jours actifs</p>
                <p className="text-2xl font-bold text-green-600">{monthStats.daysWithEvents}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Vue Calendrier */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Calendrier principal */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              
              {/* Header calendrier */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {monthName}
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToToday}
                      className="px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Aujourd'hui
                    </button>
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grille calendrier */}
              <div className="p-4">
                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Jours du mois */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarData.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`
                        relative p-2 h-16 rounded-lg transition-all duration-200 text-left
                        ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${day.isToday ? 'ring-2 ring-purple-500 bg-purple-50' : ''}
                        ${selectedDate === day.date ? 'bg-purple-100 ring-2 ring-purple-300' : 'hover:bg-gray-50'}
                        ${day.totalCount > 0 ? 'font-medium' : ''}
                      `}
                    >
                      <span className="text-sm">{day.day}</span>
                      
                      {/* Indicateurs */}
                      {day.totalCount > 0 && (
                        <div className="absolute bottom-1 right-1 flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(day.status)}`}></div>
                          {day.totalCount > 1 && (
                            <span className="text-xs text-gray-600">{day.totalCount}</span>
                          )}
                        </div>
                      )}

                      {/* Badge urgent */}
                      {day.urgentCount > 0 && (
                        <div className="absolute top-1 right-1">
                          <Zap className="w-3 h-3 text-red-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Légende */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Urgent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>En retard</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Non lues</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Normal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails du jour sélectionné */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  {selectedDate ? (
                    new Date(selectedDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })
                  ) : 'Sélectionnez une date'}
                </h3>
                
                {selectedDate && selectedDayNotifications.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value as any)}
                      className="text-sm border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="all">Toutes priorités</option>
                      <option value="urgent">Urgentes</option>
                      <option value="high">Hautes</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {selectedDate ? (
                  selectedDayNotifications.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {selectedDayNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          compact={true}
                          showEditActions={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune notification ce jour</p>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cliquez sur une date pour voir les détails</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vue Alertes */}
        {viewMode === 'alerts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.alert_type);
                return (
                  <div key={alert.alert_type} className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${alert.color}15` }}
                        >
                          <AlertIcon className="w-5 h-5" style={{ color: alert.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{alert.alert_title}</h3>
                          <p className="text-sm text-gray-600">{alert.count} notification{alert.count > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {alert.notifications.slice(0, 5).map((notif, index) => (
                        <div key={index} className="p-3 border-b border-gray-50 last:border-0">
                          <h4 className="text-sm font-medium text-gray-900">{notif.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            {notif.due_date && (
                              <span>Échéance: {new Date(notif.due_date).toLocaleDateString('fr-FR')}</span>
                            )}
                            {notif.hours_remaining !== undefined && (
                              <span>
                                {notif.hours_remaining > 0 
                                  ? `${Math.floor(notif.hours_remaining)}h restantes`
                                  : `${Math.floor(Math.abs(notif.hours_remaining))}h de retard`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {alert.count > 5 && (
                        <div className="p-3 text-center text-sm text-gray-500">
                          Et {alert.count - 5} autre{alert.count - 5 > 1 ? 's' : ''}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune alerte</h3>
                <p className="text-gray-600">Toutes vos notifications sont à jour !</p>
              </div>
            )}
          </div>
        )}

        {/* Vue Statistiques */}
        {viewMode === 'stats' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistiques détaillées</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Ce mois</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total notifications:</span>
                    <span className="font-medium">{monthStats.totalNotifs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moyenne par jour:</span>
                    <span className="font-medium">{monthStats.avgPerDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jours avec événements:</span>
                    <span className="font-medium">{monthStats.daysWithEvents}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Par priorité</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-600">Urgentes:</span>
                    <span className="font-medium">{monthStats.urgentNotifs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">En retard:</span>
                    <span className="font-medium">{monthStats.overdueNotifs}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Tendances</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Taux urgence:</span>
                    <span className="font-medium">
                      {monthStats.totalNotifs > 0 
                        ? Math.round((monthStats.urgentNotifs / monthStats.totalNotifs) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux retard:</span>
                    <span className="font-medium">
                      {monthStats.totalNotifs > 0 
                        ? Math.round((monthStats.overdueNotifs / monthStats.totalNotifs) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Performance</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Score santé:</span>
                    <span className="font-medium text-green-600">
                      {Math.max(0, 100 - (monthStats.urgentNotifs * 10) - (monthStats.overdueNotifs * 5))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCalendarPage;