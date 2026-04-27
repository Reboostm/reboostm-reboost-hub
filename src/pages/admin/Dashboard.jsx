import Card from '../../components/ui/Card'
import { Users, BookOpen, TrendingUp, DollarSign } from 'lucide-react'

const STATS = [
  { icon: Users, label: 'Total Clients', value: '—' },
  { icon: BookOpen, label: 'Active Citations Jobs', value: '—' },
  { icon: TrendingUp, label: 'Tracked Keywords', value: '—' },
  { icon: DollarSign, label: 'MRR', value: '—' },
]

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-hub-text-muted">{label}</p>
                <p className="text-2xl font-bold text-hub-text mt-1">{value}</p>
              </div>
              <Icon className="w-5 h-5 text-hub-blue" />
            </div>
          </Card>
        ))}
      </div>
      <p className="text-sm text-hub-text-secondary">Full admin dashboard metrics coming in next phase.</p>
    </div>
  )
}
