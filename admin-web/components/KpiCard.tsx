import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatIQD } from '@/lib/format';

export function KpiCard({ title, value, locale = 'en-IQ' }: { title: string; value: number; locale?: string }) {
  return (
    <Card className="min-w-[180px]">
      <CardHeader>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{formatIQD(value, locale)}</div>
      </CardContent>
    </Card>
  );
}

