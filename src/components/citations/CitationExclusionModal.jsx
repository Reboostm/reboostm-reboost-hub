import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import Button from '../ui/Button'
import { db } from '../../services/firebase'

const TOP_20_DIRECTORIES = [
  'Yelp',
  'Google Business Profile',
  'Yellow Pages',
  'Manta',
  'Hotfrog',
  'Better Business Bureau',
  'Facebook Business',
  'Apple Maps Connect',
  'Superpages',
  'HomeAdvisor',
  'Angi',
  'Thumbtack',
  'Neustar Localeze',
  'Infogroup / Data Axle',
  'Dun & Bradstreet',
  'Zillow',
  'Realtor.com',
  'LinkedIn Company',
  'Foursquare',
  'Bing Places',
]

export default function CitationExclusionModal({ isOpen, onClose, userId }) {
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const toggleDirectory = (dir) => {
    const newSet = new Set(selected)
    if (newSet.has(dir)) {
      newSet.delete(dir)
    } else {
      newSet.add(dir)
    }
    setSelected(newSet)
  }

  const handleSave = async () => {
    if (!userId) return

    setSaving(true)
    try {
      await db.collection('users').doc(userId).update({
        citationExclusions: Array.from(selected),
        showCitationExclusionList: false,
      })
      onClose()
    } catch (err) {
      console.error('Error saving exclusions:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-hub-bg rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-hub-bg border-b border-hub-input p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-hub-text">Already Submitted?</h2>
            <p className="text-sm text-hub-text-secondary mt-1">
              Select sites you've already submitted to prevent duplicates
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-hub-text-muted hover:text-hub-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-hub-text-muted mb-4">
            Check any of these top directories you've already submitted to. We'll skip them
            during submission to save you money and prevent duplicate listings.
          </p>

          <div className="space-y-2 mb-6">
            {TOP_20_DIRECTORIES.map((dir) => (
              <button
                key={dir}
                onClick={() => toggleDirectory(dir)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-hub-input hover:border-hub-blue hover:bg-hub-input/50 transition-colors text-left"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected.has(dir)
                      ? 'bg-hub-blue border-hub-blue'
                      : 'border-hub-input'
                  }`}
                >
                  {selected.has(dir) && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm text-hub-text">{dir}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="flex-1"
            >
              {selected.size > 0
                ? `Exclude ${selected.size} Site${selected.size !== 1 ? 's' : ''}`
                : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
