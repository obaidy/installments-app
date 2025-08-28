import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { KpiCard } from '../components/KpiCard'
import { Sparkline } from '../components/Sparkline'
import { MoneyTable } from '../components/MoneyTable'
import { Shell } from '../components/Shell'

const mockRows = [
  { id: '1', unit: 'Apt 101', dueDate: '2025-09-01', amount: 250000, status: 'due' as const },
  { id: '2', unit: 'Apt 102', dueDate: '2025-09-05', amount: 350000, status: 'overdue' as const },
  { id: '3', unit: 'Apt 103', dueDate: '2025-09-20', amount: 200000, status: 'paid' as const },
]

export default function Page() {
  return (
    <Shell>
      <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <Card className="kpi-gradient text-white">
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Due Today" value={350000} delta={8} spark={<Sparkline values={[4,6,3,8,7,10,9]} />} />
            <KpiCard title="Next 30 Days" value={1250000} delta={12} spark={<Sparkline values={[10,9,11,12,10,8,9]} />} />
            <KpiCard title="Past Due" value={600000} delta={-5} spark={<Sparkline values={[7,6,7,9,8,7,6]} />} />
            <KpiCard title="Collected MTD" value={4200000} delta={4} spark={<Sparkline values={[5,7,9,12,14,13,15]} />} />
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
        <Button>All</Button>
        <Button variant="ghost">Due</Button>
        <Button variant="ghost">Past Due</Button>
      </div>
      <MoneyTable rows={mockRows} />
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground mb-2">Recent Activity</div>
          <ul className="space-y-2">
            <li className="flex items-center justify-between">
              <span>Payment from Apt 101</span>
              <span className="text-xs opacity-70">Today</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Reminder sent to Apt 202</span>
              <span className="text-xs opacity-70">1h ago</span>
            </li>
            <li className="flex items-center justify-between">
              <span>New complex added: Rose Gardens</span>
              <span className="text-xs opacity-70">Yesterday</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </main>
    </Shell>
  )
}
