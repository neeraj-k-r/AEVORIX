// Layout Components
export { default as Navbar } from './Navbar';
export { default as ErrorBoundary } from './ErrorBoundary';

// UI Components
export { default as Button } from './Button';
export { default as Input } from './Input';
export { Badge, StatusBadge, RoleBadge } from './Badge';
export { Card, CardHeader, CardBody, CardFooter, CardGrid } from './Card';
export { Modal, ConfirmModal } from './Modal';
export { Table, Column } from './Table';
export { default as LoadingSpinner, PageLoader, InlineLoader } from './LoadingSpinner';
export { ToastProvider, useToast } from './Toast';
export { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Data Display Components
export { default as PatientCard, PatientList } from './PatientCard';
export { RecordCard, RecordList } from './RecordCard';
export { default as BlockchainVerificationModal } from './BlockchainVerificationModal';

// Dashboard Components
export { default as PatientSidebar } from './dashboard/PatientSidebar';
export { RecordCard as DashboardRecordCard, RecordRow } from './dashboard/RecordCard';
export { default as AddRecordModal } from './dashboard/AddRecordModal';
export { default as TamperDemoModal } from './dashboard/TamperDemoModal';