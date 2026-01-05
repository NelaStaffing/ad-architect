import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'draft' | 'in_review' | 'approved' | 'exported';
  className?: string;
}

const statusLabels = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  exported: 'Exported',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        `status-${status}`,
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
