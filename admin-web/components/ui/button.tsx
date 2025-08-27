import { cn } from '@/components/ui/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-primary text-primaryForeground hover:opacity-95',
    ghost: 'hover:bg-muted text-foreground',
  } as const;
  return <button className={cn(base, variants[variant], className)} {...props} />
}

