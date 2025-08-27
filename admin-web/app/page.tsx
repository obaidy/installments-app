import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/KpiCard'
import { MoneyTable } from '@/components/MoneyTable'
import { useTheme } from '@/lib/theme'

const mockRows = [
  { id: '1', unit: 'Apt 101', dueDate: '2025-09-01', amount: 250000, status: 'due' as const },
  { id: '2', unit: 'Apt 102', dueDate: '2025-09-05', amount: 350000, status: 'overdue' as const },
  { id: '3', unit: 'Apt 103', dueDate: '2025-09-20', amount: 200000, status: 'paid' as const },
]

export default function Page() {
  const { dark, toggleDark, rtl, toggleRtl } = useTheme()
  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={toggleDark}>{dark ? 'Light' : 'Dark'}</Button>
          <Button variant="ghost" onClick={toggleRtl}>{rtl ? 'LTR' : 'RTL'}</Button>
        </div>
      </div>
      <Card className="kpi-gradient text-white">
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Due Today" value={350000} />
            <KpiCard title="Next 30 Days" value={1250000} />
            <KpiCard title="Past Due" value={600000} />
            <KpiCard title="Collected MTD" value={4200000} />
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
        <Button>All</Button>
        <Button variant="ghost">Due</Button>
        <Button variant="ghost">Past Due</Button>
      </div>
      <MoneyTable rows={mockRows} />
    </main>
  )
}

