// src/components/staff/index.ts - Exports complets des composants staff

// Composants principaux
export { default as StaffList } from './StaffList';
export { default as StaffForm } from './StaffForm';
export { default as StaffDetails } from './StaffDetails';
export { default as StaffCard } from './StaffCard';
export { default as StaffFilters } from './StaffFilters';

// Re-export des types utiles pour les composants
export type {
  Staff,
  StaffFormData,
  StaffDetails as StaffDetailsType,
  StaffStatus,
  StaffPosition,
  StaffDepartment,
  StaffListParams,
  StaffListResponse,
  ActiveTeacher,
  PositionOption,
  DepartmentOption,
  StaffCardProps,
  StaffFormProps,
  StaffListProps
} from '../../types/staff.types';

// Re-export des constantes utiles
export {
  STAFF_STATUS_LABELS,
  STAFF_STATUS_COLORS
} from '../../types/staff.types';
export { default as StaffEnrollmentWizard } from './StaffEnrollmentWizard';

// Re-export du service pour faciliter l'utilisation
export { staffService } from '../../services/staffService';