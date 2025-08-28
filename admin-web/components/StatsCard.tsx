import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StatsCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="min-w-[200px]">
      <CardHeader>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

