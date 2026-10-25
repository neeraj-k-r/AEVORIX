export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    verification: 'bg-verification-bg text-verification-text',
    alert: 'bg-alert-bg text-alert-text',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    danger: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    active: { label: 'Active', variant: 'verification' },
    inactive: { label: 'Inactive', variant: 'default' },
    revoked: { label: 'Revoked', variant: 'alert' },
    pending: { label: 'Pending', variant: 'warning' },
    verified: { label: 'Verified', variant: 'success' },
    failed: { label: 'Failed', variant: 'danger' },
  };

  const config = statusConfig[status?.toLowerCase()] || { label: status, variant: 'default' };

  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}

export function RoleBadge({ role, className = '' }) {
  const roleColors = {
    Doctor: 'primary',
    Nurse: 'success',
    Lab: 'warning',
    Pharmacist: 'verification',
    Admin: 'danger',
  };

  return <Badge variant={roleColors[role] || 'default'} className={className}>{role}</Badge>;
}