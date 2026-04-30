import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, Download, Save, Plus, Trash2 } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { MASTER_DIRECTORIES, AGGREGATORS } from '../../config/citations'
import { cn } from '../../utils/cn'
import { db } from '../../services/firebase'
import { useToast } from '../../hooks/useToast'
import { initializeCitationPackages } from '../../services/functions'

export default function CitationsDirectoriesManager() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [packages, setPackages] = useState([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState('starter')
  const [selectedSites, setSelectedSites] = useState(new Set())
  const [saving, setSaving] = useState(false)

  // Load packages from Firestore (initialize if needed)
  useEffect(() => {
    const loadPackages = async () => {
      try {
        // Initialize default packages if they don't exist
        await initializeCitationPackages({})

        const snap = await db.collection('citation_packages').get()
        const pkgs = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPackages(pkgs)

        // Load selected sites for current package
        const pkg = pkgs.find(p => p.id === selectedPackage)
        if (pkg?.directoryNames) {
          setSelectedSites(new Set(pkg.directoryNames))
        } else {
          setSelectedSites(new Set())
        }
      } catch (err) {
        console.error('Error loading packages:', err)
        toast('Error loading packages: ' + err.message, 'error')
      } finally {
        setPackagesLoading(false)
      }
    }

    loadPackages()
  }, [selectedPackage, toast])

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

  const toggleSite = (dirName) => {
    const newSet = new Set(selectedSites)
    if (newSet.has(dirName)) {
      newSet.delete(dirName)
    } else {
      newSet.add(dirName)
    }
    setSelectedSites(newSet)
  }

  const handleSavePackage = async () => {
    if (!selectedPackage) {
      toast('Select a package first', 'error')
      return
    }

    setSaving(true)
    try {
      await db.collection('citation_packages').doc(selectedPackage).set({
        id: selectedPackage,
        name: packages.find(p => p.id === selectedPackage)?.name || selectedPackage,
        directoryNames: Array.from(selectedSites),
        count: selectedSites.size,
        updatedAt: new Date(),
      }, { merge: true })

      toast(`Saved ${selectedSites.size} sites to ${selectedPackage}`, 'success')
    } catch (err) {
      toast('Error saving package: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const currentPkg = packages.find(p => p.id === selectedPackage)

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-hub-text mb-2">Citations Directories</h1>
        <p className="text-hub-text-secondary">Customize which sites are in each package tier</p>
      </div>

      {/* Package Selector & Editor */}
      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Edit Package Assignments</CardTitle>
          <Button
            onClick={handleSavePackage}
            loading={saving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes ({selectedSites.size} sites)
          </Button>
        </CardHeader>

        <div className="p-4 border-t border-hub-input">
          <p className="text-sm text-hub-text-muted mb-3">Select package to edit:</p>
          <div className="flex gap-2">
            {['starter', 'pro', 'premium'].map((pkgId) => (
              <button
                key={pkgId}
                onClick={() => setSelectedPackage(pkgId)}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold text-sm transition-colors',
                  selectedPackage === pkgId
                    ? 'bg-hub-blue text-white'
                    : 'bg-hub-input text-hub-text hover:bg-hub-input/80'
                )}
              >
                {pkgId === 'starter' ? 'Starter' : pkgId === 'pro' ? 'Pro' : 'Premium'}
                {currentPkg?.count && selectedPackage === pkgId && (
                  <span className="ml-2 text-xs opacity-90">({currentPkg.count} sites)</span>
                )}
              </button>
            ))}
          </div>

          {!packagesLoading && currentPkg && (
            <div className="mt-4 p-3 bg-hub-input rounded-lg">
              <p className="text-sm text-hub-text">
                <strong>{selectedPackage}:</strong> {currentPkg.count} sites selected
              </p>
            </div>
          )}
        </div>
      </Card>

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

      {/* Directory Table with Checkboxes */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hub-input border-b border-hub-input">
              <tr>
                <th className="px-4 py-3 text-center font-semibold text-hub-text w-12">✓</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">#</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">Directory</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">Category</th>
                <th className="px-4 py-3 text-center font-semibold text-hub-text">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-hub-text">Email</th>
                <th className="px-4 py-3 text-center font-semibold text-hub-text">Aggregator Reach</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dir, idx) => {
                const isSelected = selectedSites.has(dir.name)
                return (
                  <tr
                    key={dir.name}
                    className={cn(
                      'border-b border-hub-input transition-colors cursor-pointer',
                      isSelected ? 'bg-hub-blue/10' : 'hover:bg-hub-input/30'
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSite(dir.name)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
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
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Package summary info */}
      {currentPkg && (
        <Card className="mt-6 p-6">
          <CardTitle className="mb-4">Package Summary: {selectedPackage}</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-hub-input">
              <p className="text-xs text-hub-text-muted mb-1">Total Sites</p>
              <p className="text-lg font-bold text-hub-blue">{currentPkg.count}</p>
            </div>
            <div className="p-3 rounded-lg bg-hub-input">
              <p className="text-xs text-hub-text-muted mb-1">Top-Tier (Real Email)</p>
              <p className="text-lg font-bold text-hub-orange">
                {enrichedDirs.filter(d => currentPkg.directoryNames?.includes(d.name) && d.priority === 1).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-hub-input">
              <p className="text-xs text-hub-text-muted mb-1">Aggregators</p>
              <p className="text-lg font-bold text-hub-green">
                {enrichedDirs.filter(d => currentPkg.directoryNames?.includes(d.name) && d.isAggregator).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-hub-input">
              <p className="text-xs text-hub-text-muted mb-1">Aggregator Reach</p>
              <p className="text-lg font-bold text-hub-blue">
                +{enrichedDirs.filter(d => currentPkg.directoryNames?.includes(d.name) && d.isAggregator).reduce((sum, d) => sum + d.aggregatorReach, 0)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

const Button = ({ children, variant = 'primary', size = 'md', className, loading, disabled, ...props }) => (
  <button
    disabled={loading || disabled}
    className={cn(
      'font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
      size === 'sm' && 'px-3 py-1.5 text-sm',
      size === 'md' && 'px-4 py-2 text-sm',
      variant === 'primary' && 'bg-hub-blue text-white hover:bg-hub-blue/90 disabled:hover:bg-hub-blue',
      variant === 'secondary' && 'bg-hub-input text-hub-text hover:bg-hub-input/80 disabled:hover:bg-hub-input',
      className
    )}
    {...props}
  >
    {loading ? (
      <span className="inline-flex items-center gap-2">
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        {children}
      </span>
    ) : (
      children
    )}
  </button>
)
