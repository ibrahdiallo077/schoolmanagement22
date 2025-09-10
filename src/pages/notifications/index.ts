// src/pages/notifications/index.ts - Export centralisé des pages CORRIGÉ

// Export de la page principale (seulement celle qui existe)
export { NotificationsPage } from './NotificationsPage';
export { default } from './NotificationsPage';

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
