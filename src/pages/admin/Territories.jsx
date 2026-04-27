import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { MapPin, Plus } from 'lucide-react'
import { getTerritories } from '../../services/firestore'

export default function AdminTerritories() {
  const [territories, setTerritories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTerritories().then(setTerritories).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Territories</h1>
        <Button size="sm"><Plus className="w-4 h-4" /> Add Territory</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : territories.length === 0 ? (
        <EmptyState icon={MapPin} title="No territories yet" description="Add territories to control which areas are available or taken." />
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {territories.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <MapPin className="w-4 h-4 text-hub-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-hub-text">{t.city}, {t.state}</p>
                  <p className="text-xs text-hub-text-muted capitalize">{t.niche} {t.clientName ? `· ${t.clientName}` : ''}</p>
                </div>
                <Badge variant={t.status === 'available' ? 'success' : 'error'} className="capitalize shrink-0">
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
