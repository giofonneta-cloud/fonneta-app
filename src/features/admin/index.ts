// Barrel exports para el módulo admin

// Types
export * from './types/admin.types';
export * from './types/permissions.types';

// Services
export * from './services/adminService';
export * from './services/userService';

// Hooks
export { useAdminStats } from './hooks/useAdminStats';
export { useUsers } from './hooks/useUsers';

// Components
export { AdminDashboard } from './components/AdminDashboard';
export { SystemHealthCard } from './components/SystemHealthCard';
export { FinancialSummaryCard } from './components/FinancialSummaryCard';
export { AlertsCard } from './components/AlertsCard';
export { AdoptionMetricsCard } from './components/AdoptionMetricsCard';
export { QuickActionsCard } from './components/QuickActionsCard';
