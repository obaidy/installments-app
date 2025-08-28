import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatIQD } from '@/lib/format';

export function KpiCard({ title, value, spark, delta, locale = 'en-IQ' }: { title: string; value: number; spark?: React.ReactNode; delta?: number; locale?: string }) {
  return (
    <Card className="min-w-[200px]">
      <CardHeader>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold flex items-center gap-2">
          {formatIQD(value, locale)}
          {typeof delta === 'number' ? (
            <span className={"text-xs px-2 py-0.5 rounded-full border " + (delta >= 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200')}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
            </span>
          ) : null}
        </div>
      {spark ? <div className="mt-2">{spark}</div> : null}
      </CardContent>
    </Card>
  );
}

