import { useState, useMemo } from 'react'
import { Search, Filter, Download } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { MASTER_DIRECTORIES, AGGREGATORS } from '../../config/citations'
import { cn } from '../../utils/cn'

export default function CitationsDirectoriesManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTier, setFilterTier] = useState('all')

  // Aggregator mapping
  const aggregatorMap = {
    'Neustar Localeze': 75,
    'Infogroup / Data Axle': 100,
    'Dun & Bradstreet': 80,
    'Acxiom': 70,
    'Express Update': 60,
    'YellowMoxie': 50,
    'Factual': 60,
  }

  // Tier assignments (first N directories go to each tier)
  const tierAssignments = {
    starter: { count: 100, label: 'Starter Foundation' },
    pro: { count: 200, label: 'Builder Pro' },
    premium: { count: 300, label: 'Local Dominator Premium' },
  }

  // Enrich directories with tier info
  const enrichedDirs = MASTER_DIRECTORIES.map((dir, idx) => ({
    ...dir,
    aggregatorReach: aggregatorMap[dir.name] || 0,
    isAggregator: !!aggregatorMap[dir.name],
    tier: idx < 100 ? 'starter' : idx < 200 ? 'pro' : 'premium',
    index: idx + 1,
  }))

  // Filter directories
  const filtered = useMemo(() => {
    return enrichedDirs.filter(dir => {
      const matchesSearch = dir.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dir.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPriority = filterPriority === 'all' || dir.priority === parseInt(filterPriority)
      const matchesCategory = filterCategory === 'all' || dir.category === filterCategory
      const matchesTier = filterTier === 'all' || dir.tier === filterTier
      return matchesSearch && matchesPriority && matchesCategory && matchesTier
    })
  }, [searchTerm, filterPriority, filterCategory, filterTier])

  // Calculate statistics
  const stats = useMemo(() => {
    const byTier = {
      starter: enrichedDirs.slice(0, 100),
      pro: enrichedDirs.slice(0, 200),
      premium: enrichedDirs.slice(0, 300),
    }

    const calcStats = (dirs) => {
      const aggregators = dirs.filter(d => d.isAggregator)
      const topTier = dirs.filter(d => d.priority === 1)
      const reach = aggregators.reduce((sum, d) => sum + d.aggregatorReach, 0)
      return {
        total: dirs.length,
        aggregators: aggregators.length,
        reach,
        topTier: topTier.length,
        byCategory: dirs.reduce((acc, d) => {
          acc[d.category] = (acc[d.category] || 0) + 1
          return acc
        }, {}),
      }
    }

    return {
      starter: calcStats(byTier.starter),
      pro: calcStats(byTier.pro),
      premium: calcStats(byTier.premium),
    }
  }, [])

  const categories = [...new Set(enrichedDirs.map(d => d.category))].sort()

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-hub-text mb-2">Citations Directories</h1>
        <p className="text-hub-text-secondary">Manage 300 citation directories across 3 package tiers</p>
      </div>

      {/* Package Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {['starter', 'pro', 'premium'].map((tier) => {
          const s = stats[tier]
          const tierInfo = tierAssignments[tier]
          return (
            <Card key={tier} className={cn(
              'p-4',
              tier === 'pro' && 'border-hub-orange ring-1 ring-hub-orange/20'
            )}>
              <h3 className="font-bold text-hub-text mb-3">{tierInfo.label}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-hub-text-muted">Direct Submissions</span>
                  <span className="font-bold text-hub-blue">{s.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hub-text-muted">Top-Tier Sites</span>
                  <span className="font-bold text-hub-orange">{s.topTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hub-text-muted">Aggregators</span>
                  <span className="font-bold text-hub-green">{s.aggregators}</span>
                </div>
                <div className="border-t border-hub-input pt-2 mt-2 flex justify-between">
                  <span className="text-hub-text-muted font-semibold">Total Reach</span>
                  <span className="font-bold text-hub-blue">{s.total + s.reach}+</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            placeholder="Search directory name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
          <Select
            label="Priority"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: '1', label: 'Priority 1 (Top)' },
              { value: '2', label: 'Priority 2 (Mid)' },
              { value: '3', label: 'Priority 3 (Extended)' },
            ]}
          />
          <Select
            label="Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat, label: cat })),
            ]}
          />
          <Select
            label="Tier"
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            options={[
              { value: 'all', label: 'All Tiers' },
              { value: 'starter', label: 'Starter (1-100)' },
              { value: 'pro', label: 'Pro (101-200)' },
              { value: 'premium', label: 'Premium (201-300)' },
            ]}
          />
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hub-text-muted">
          Showing {filtered.length} of {MASTER_DIRECTORIES.length} directories
        </p>
        <Button variant="secondary" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Directory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hub-input border-b border-hub-input">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">#</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">Directory</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">Category</th>
                <th className="px-4 py-3 text-center font-semibold text-hub-text">Priority</th>
                <th className="px-4 py-3 text-center font-semibold text-hub-text">Tier</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">Email</th>
                <th className="px-4 py-3 text-center font-semibold text-hub-text">Aggregator Reach</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dir, idx) => (
                <tr key={dir.name} className="border-b border-hub-input hover:bg-hub-input/30 transition-colors">
                  <td className="px-4 py-3 text-hub-text-muted font-mono text-xs">{dir.index}</td>
                  <td className="px-4 py-3">
                    <a
                      href={dir.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-hub-blue hover:underline font-semibold"
                    >
                      {dir.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-hub-text-secondary text-xs">{dir.category}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={dir.priority === 1 ? 'success' : dir.priority === 2 ? 'info' : 'gray'}
                      className="text-xs"
                    >
                      P{dir.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={dir.tier === 'starter' ? 'info' : dir.tier === 'pro' ? 'paid' : 'orange'}
                      className="text-xs"
                    >
                      {dir.tier === 'starter' ? 'Starter' : dir.tier === 'pro' ? 'Pro' : 'Premium'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={dir.priority === 1 ? 'warning' : 'success'}
                      className="text-xs"
                    >
                      {dir.priority === 1 ? 'Real Email' : 'System Email'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {dir.isAggregator ? (
                      <span className="text-hub-green font-semibold">+{dir.aggregatorReach}</span>
                    ) : (
                      <span className="text-hub-text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Marketing copy suggestions */}
      <Card className="mt-6 p-6">
        <CardTitle className="mb-4">Package Marketing Copy</CardTitle>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-hub-text mb-2">Starter Foundation (100 sites)</h4>
            <p className="text-hub-text-secondary text-sm">
              100 high-impact direct submissions across top local search directories and premium review sites.
              Total reach: <span className="font-bold text-hub-blue">{stats.starter.total} direct listings</span>
            </p>
          </div>
          <div className="p-3 bg-hub-orange/10 border border-hub-orange/20 rounded-lg">
            <h4 className="font-bold text-hub-text mb-2">⭐ Builder Pro (200 sites) — BEST VALUE</h4>
            <p className="text-hub-text-secondary text-sm mb-2">
              200 direct submissions + <span className="font-bold text-hub-green">{stats.pro.aggregators} aggregators</span> that
              auto-distribute to 300+ additional sites. Includes major data aggregators: Neustar
              Localeze, Infogroup, Dun & Bradstreet. <span className="font-bold text-hub-blue">Total reach: {stats.pro.total + stats.pro.reach}+ listings</span>
            </p>
            <p className="text-xs text-hub-text-muted">
              User value: 1 submission = {stats.pro.total + stats.pro.reach}+ total listings across the web
            </p>
          </div>
          <div>
            <h4 className="font-bold text-hub-text mb-2">Local Dominator Premium (300 sites)</h4>
            <p className="text-hub-text-secondary text-sm">
              Complete directory dominance: 300 direct submissions + <span className="font-bold text-hub-green">{stats.premium.aggregators} aggregators</span> with 500+ aggregator
              reach. Includes all major platforms + every significant local search directory.
              <span className="font-bold text-hub-blue"> Total reach: {stats.premium.total + stats.premium.reach}+ listings</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Category breakdown */}
      <Card className="mt-6 p-6">
        <CardTitle className="mb-4">Category Breakdown (All Tiers)</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(stats.premium.byCategory).sort((a, b) => b[1] - a[1]).map(([category, count]) => (
            <div key={category} className="p-3 rounded-lg bg-hub-input">
              <p className="text-xs text-hub-text-muted mb-1">{category}</p>
              <p className="text-lg font-bold text-hub-text">{count}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

const Button = ({ children, variant = 'primary', size = 'md', className, ...props }) => (
  <button
    className={cn(
      'font-semibold rounded-lg transition-colors',
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-sm',
      variant === 'primary' && 'bg-hub-blue text-white hover:bg-hub-blue/90',
      variant === 'secondary' && 'bg-hub-input text-hub-text hover:bg-hub-input/80',
      className
    )}
    {...props}
  >
    {children}
  </button>
)
