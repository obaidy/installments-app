import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StatsCard({ title, value, href }: { title: string; value: number | string; href?: string }) {
  const content = (
    <Card className="min-w-[200px] hover:shadow-md transition">
      <CardHeader>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
