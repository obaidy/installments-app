import { cn } from '@/components/ui/utils';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs', className)} {...props} />
}

