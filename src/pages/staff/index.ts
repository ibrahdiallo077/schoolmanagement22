// src/pages/staff/index.ts - Export de toutes les pages du module staff

// Pages principales
export { default as StaffPage } from './StaffPage';
export { default as StaffCreatePage } from './StaffCreatePage';
export { default as StaffEditPage } from './StaffEditPage';
export { default as StaffDetailPage } from './StaffDetailPage';

// Routeur principal
export { default as StaffMainRouter } from './StaffMainRouter';

// Hooks personnalisés depuis useStaff.ts
export {
  useStaff,
  useStaffList,
  useStaffDetail,
  useStaffActions
} from '../../hooks/useStaff';

// Hook pour les formulaires depuis useStaffForm.ts
export { useStaffForm } from '../../hooks/useStaffForm';

// Types et utilitaires
export type {
  Staff,
  StaffFormData,
  StaffListParams,
  StaffListResponse,
  StaffStats,
  StaffDetails,
  StaffClass,
  PerformanceReview,
  StaffDocument,
  StaffStatus,
  StaffPosition,
  StaffDepartment,
  PositionOption,
  DepartmentOption,
  StaffCardProps,
  StaffFormProps,
  StaffListProps,
  UseStaffListReturn,
  UseStaffReturn,
  CreateStaffRequest,
  UpdateStaffRequest,
  StaffApiResponse,
  StaffListApiResponse
} from '../../types/staff.types';

// Constantes et utilitaires
export {
  STAFF_STATUS_LABELS,
  STAFF_STATUS_COLORS,
  STAFF_POSITION_LABELS,
  STAFF_DEPARTMENT_LABELS,
  POSITION_OPTIONS,
  DEPARTMENT_OPTIONS,
  formatStaffName,
  getPositionLabel,
  getDepartmentLabel,
  getStatusLabel,
  calculateSeniority
} from '../../types/staff.types';