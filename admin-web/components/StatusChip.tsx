import { Badge } from '@/components/ui/badge';
import type { Status } from '@/lib/format';

export function StatusChip({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
  };
  return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
}

