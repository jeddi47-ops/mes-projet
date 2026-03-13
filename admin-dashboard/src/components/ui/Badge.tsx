import { OrderStatus } from '@/types';

const config: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  payment_discussion: { label: 'En discussion', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Payé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-600 border-red-200' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantMap = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-blue-50 text-blue-700',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${variantMap[variant]}`}>
      {children}
    </span>
  );
}
