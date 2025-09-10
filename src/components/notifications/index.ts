// src/pages/notifications/index.ts - Export centralisé CORRIGÉ

// Export de la page principale
export { NotificationsPage, default as NotificationsPage } from './NotificationsPage';

// Types réexportés pour faciliter l'usage
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationFilters,
  NotificationCounts,
  CreateNotificationData
} from '../../services/notificationService';

console.log('✅ [notifications/index] Exports corrigés - NotificationsPage nommé et par défaut');