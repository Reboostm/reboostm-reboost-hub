import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Filter, Download, Save, Plus, Trash2 } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { MASTER_DIRECTORIES, AGGREGATORS } from '../../config/citations'
import { cn } from '../../utils/cn'
import { db } from '../../services/firebase'
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore'
import { useToast } from '../../hooks/useToast'
import { initializeCitationPackages } from '../../services/functions'

export default function CitationsDirectoriesManager() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [packages, setPackages] = useState([])
  const [offers, setOffers] = useState([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedSites, setSelectedSites] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const loadedForPackageRef = useRef(null)
  const hasAutoSelectedRef = useRef(false)

  // Load offers from citations, then load packages
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all active citation offers (admin can assign any active offer)
        const offersQuery = query(
          collection(db, 'offers'),
          where('unlocksFeature', '==', 'citations'),
          where('active', '==', true)
        )
        const offersSnap = await getDocs(offersQuery)

        const allCitationOffers = offersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Upgrade offers reuse an existing package — exclude them from directory
        // assignment since their directories are managed via the base offer.
        const baseOffers = allCitationOffers.filter(o => !o.isUpgrade)
        setOffers(baseOffers)

        // Load packages — filter by offerId pointing to an active base offer.
        // We use the offerId (package→offer) direction instead of offer.tier
        // (offer→package) because offer.tier gets set only after the first save.
        const allPkgsSnap = await getDocs(collection(db, 'citation_packages'))
        const activeOfferIds = new Set(baseOffers.map(o => o.id))

        const pkgs = allPkgsSnap.docs
          .filter(doc => activeOfferIds.has(doc.data().offerId) || !doc.data().offerId)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        setPackages(pkgs)

        // Auto-select first offer exactly once. The interval's closure always
        // sees selectedPackage=null (stale), so we use a ref to gate this.
        if (baseOffers.length > 0 && !hasAutoSelectedRef.current) {
          hasAutoSelectedRef.current = true
          setSelectedPackage(baseOffers[0].id)
        }
      } catch (err) {
        console.error('Error loading offers/packages:', err)
        toast('Error loading offers: ' + err.message, 'error')
      } finally {
        setPackagesLoading(false)
      }
    }

    loadData()
    // Reload every 2 seconds to catch new offers
    const interval = setInterval(loadData, 2000)
    return () => clearInterval(interval)
  }, [toast])

  // Load selected sites for current package + auto-switch if offer was deleted
  useEffect(() => {
    if (!selectedPackage) return

    // Auto-switch if selected offer was deleted
    if (offers.length > 0 && !offers.some(o => o.id === selectedPackage)) {
      setSelectedPackage(offers[0].id)
      return
    }

    // Only reset selectedSites when selectedPackage actually changes, not on every
    // polling cycle. The ref tracks which package we've already loaded for.
    if (!packages.length || loadedForPackageRef.current === selectedPackage) return
    loadedForPackageRef.current = selectedPackage

    const pkg = packages.find(p => p.offerId === selectedPackage)
    setSelectedSites(new Set(pkg?.directoryNames || []))
  }, [selectedPackage, packages, offers])

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

  const currentPkg = packages.find(p => p.offerId === selectedPackage)

  // Use offer price to establish tier order (cheaper = lower tier).
  // We can't rely on saved package.count because packages may have equal counts
  // before being properly configured. Price is always distinct per tier.
  const offersSortedByPrice = useMemo(
    () => [...offers].sort((a, b) => (a.price || 0) - (b.price || 0)),
    [offers]
  )
  const currentOfferIndex = offersSortedByPrice.findIndex(o => o.id === selectedPackage)

  // Collect all directory names from packages whose offer sits at a LOWER price
  // tier than the currently selected one — those are locked (already submitted on upgrade).
  const lowerTierDirNames = useMemo(() => {
    if (currentOfferIndex <= 0) return new Set()
    const locked = new Set()
    offersSortedByPrice.slice(0, currentOfferIndex).forEach(offer => {
      const pkg = packages.find(p => p.offerId === offer.id)
      if (pkg) (pkg.directoryNames || []).forEach(n => locked.add(n))
    })
    return locked
  }, [packages, offersSortedByPrice, currentOfferIndex])

  const toggleSite = (dirName) => {
    if (lowerTierDirNames.has(dirName)) return
    const newSet = new Set(selectedSites)
    if (newSet.has(dirName)) newSet.delete(dirName)
    else newSet.add(dirName)
    setSelectedSites(newSet)
  }

  const selectableDirs = filtered.filter(d => !lowerTierDirNames.has(d.name))

  const toggleSelectAll = () => {
    const allSelected = selectableDirs.length > 0 && selectableDirs.every(d => selectedSites.has(d.name))
    const newSet = new Set(selectedSites)
    if (allSelected) selectableDirs.forEach(d => newSet.delete(d.name))
    else selectableDirs.forEach(d => newSet.add(d.name))
    setSelectedSites(newSet)
  }

  const allSelectableSelected = selectableDirs.length > 0 &&
    selectableDirs.every(dir => selectedSites.has(dir.name))

  const handleSavePackage = async () => {
    if (!selectedPackage) {
      toast('Select a package first', 'error')
      return
    }

    const offer = offers.find(o => o.id === selectedPackage)
    if (!offer) {
      toast('Offer not found', 'error')
      return
    }

    setSaving(true)
    try {
      // Find existing package doc or create new one
      const existingPkg = packages.find(p => p.offerId === selectedPackage)
      const docId = existingPkg?.id || `pkg_${Date.now()}`

      const dirNames = Array.from(selectedSites)
      const aggregatorReach = dirNames.reduce((sum, n) => sum + (AGGREGATORS[n] || 0), 0)

      await setDoc(doc(db, 'citation_packages', docId), {
        offerId: selectedPackage,
        name: offer.name,
        price: offer.price,
        directoryNames: dirNames,
        count: dirNames.length,
        aggregatorReach,
        totalReach: dirNames.length + aggregatorReach,
        isUpgrade: offer.isUpgrade || false,
        updatedAt: new Date(),
      }, { merge: true })

      // Keep offer.tier in sync so CitationsPackageBar can find directory count
      // via packages.find(p => p.id === offer.tier)
      if (offer.tier !== docId) {
        await updateDoc(doc(db, 'offers', selectedPackage), { tier: docId })
      }

      toast(`Saved ${selectedSites.size} sites to "${offer.name}"`, 'success')

      // Refresh packages
      const refreshSnap = await getDocs(collection(db, 'citation_packages'))
      const refreshPkgs = refreshSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPackages(refreshPkgs)
    } catch (err) {
      toast('Error saving package: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

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
          {packagesLoading ? (
            <p className="text-sm text-hub-text-muted">Loading offers...</p>
          ) : offers.length === 0 ? (
            <p className="text-sm text-hub-text-muted">No citation offers created yet. Create your first offer in the Offers admin.</p>
          ) : (
            <>
              <p className="text-sm text-hub-text-muted mb-3">Select offer to customize:</p>
              <div className="flex flex-wrap gap-2">
                {offers.map((offer) => (
                  <button
                    key={offer.id}
                    onClick={() => setSelectedPackage(offer.id)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-semibold text-sm transition-colors',
                      selectedPackage === offer.id
                        ? 'bg-hub-blue text-white'
                        : 'bg-hub-input text-hub-text hover:bg-hub-input/80'
                    )}
                  >
                    {offer.name}
                    {selectedPackage === offer.id && currentPkg && (
                      <span className="ml-2 text-xs opacity-90">({currentPkg.count} sites)</span>
                    )}
                  </button>
                ))}
              </div>

              {!packagesLoading && currentPkg && (
                <div className="mt-4 p-3 bg-hub-input rounded-lg">
                  <p className="text-sm text-hub-text">
                    <strong>{currentPkg.name || 'Package'}:</strong> {currentPkg.count} sites selected
                  </p>
                  {currentPkg.isUpgrade && (
                    <p className="text-xs text-hub-text-muted mt-1">✓ Upgrade offer</p>
                  )}
                </div>
              )}
            </>
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

      {/* Locked-dirs notice */}
      {lowerTierDirNames.size > 0 && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-hub-input border border-hub-border text-sm text-hub-text-secondary">
          <strong className="text-hub-text">{lowerTierDirNames.size} directories locked</strong> — already assigned to a lower-tier package. When a customer upgrades, those are skipped (already submitted). Only select the <em>new</em> directories for this package.
        </div>
      )}

      {/* Results count + quick actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hub-text-muted">
          Showing {filtered.length} of {MASTER_DIRECTORIES.length} directories
          {selectedSites.size > 0 && ` — ${selectedSites.size} selected`}
        </p>
        <div className="flex gap-2">
          {selectedSites.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedSites(new Set())}
              className="text-xs"
            >
              Uncheck All
            </Button>
          )}
          {filtered.some(dir => !selectedSites.has(dir.name)) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs"
            >
              Select All
            </Button>
          )}
          <Button variant="secondary" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Directory Table with Checkboxes */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hub-input border-b border-hub-input">
              <tr>
                <th className="px-4 py-3 text-center font-semibold text-hub-text w-12">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleSelectAll}
                    title="Select all visible directories"
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
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
                const isLocked = lowerTierDirNames.has(dir.name)
                const isSelected = selectedSites.has(dir.name)
                return (
                  <tr
                    key={dir.name}
                    onClick={() => !isLocked && toggleSite(dir.name)}
                    className={cn(
                      'border-b border-hub-input transition-colors',
                      isLocked
                        ? 'opacity-35 cursor-not-allowed'
                        : isSelected
                        ? 'bg-hub-blue/10 cursor-pointer'
                        : 'hover:bg-hub-input/30 cursor-pointer'
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={() => !isLocked && toggleSite(dir.name)}
                        className="w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
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
