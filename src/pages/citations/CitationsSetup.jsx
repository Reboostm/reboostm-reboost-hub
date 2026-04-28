import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, ChevronDown, ChevronUp, FileImage } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { citationsSetupSchema } from '../../utils/validators'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { US_STATES } from '../../config'

const HOURS_PRESETS = [
  { value: '9am-5pm', label: '9am - 5pm (Standard Business)' },
  { value: '24/7', label: '24/7 (Always Open)' },
  { value: 'custom', label: 'Custom Hours...' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'online', label: 'Online Payment' },
  { value: 'insurance', label: 'Insurance' },
]

export default function CitationsSetup() {
  const navigate = useNavigate()
  const { userProfile, updateProfile } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [expandedPhase, setExpandedPhase] = useState(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
    resolver: zodResolver(citationsSetupSchema),
    defaultValues: {
      businessName: userProfile?.businessName || '',
      phone: userProfile?.phone || '',
      website: userProfile?.website || '',
      address: userProfile?.address || '',
      city: userProfile?.city || '',
      state: userProfile?.state || '',
      zip: userProfile?.zip || '',
      businessHours: userProfile?.businessHours || '9am-5pm',
      description: userProfile?.description || '',
      shortDesc: '',
      longDesc: '',
      publicEmail: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      serviceAreas: '',
      yearEstablished: new Date().getFullYear().toString(),
      licenseNumber: '',
      licenseState: '',
      certifications: '',
    },
  })

  const hoursValue = watch('businessHours')

  useEffect(() => {
    if (userProfile) {
      reset({
        businessName: userProfile.businessName || '',
        phone: userProfile.phone || '',
        website: userProfile.website || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zip: userProfile.zip || '',
        businessHours: userProfile.businessHours || '9am-5pm',
        description: userProfile.description || '',
      })
    }
  }, [userProfile, reset])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast('Logo must be under 5MB', 'error')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data) => {
    try {
      // TODO: Upload logo to Firebase Storage if new file
      // const logoUrl = logoFile ? await uploadLogo(userProfile.id, logoFile) : null

      // Prepare payload
      const payload = {
        ...data,
        citationsSetupCompleted: true,
        // logo: logoUrl || logoPreview, // Add if logo upload implemented
        paymentMethods: watch('paymentMethods') || [],
      }

      // Update user profile with all citation data
      await updateProfile(payload)

      toast('Citations setup saved! Ready to start submissions.', 'success')
      setTimeout(() => navigate('/citations'), 1500)
    } catch (err) {
      console.error('Error saving citations setup:', err)
      toast(err.message || 'Failed to save setup', 'error')
    }
  }

  const PhaseSection = ({ phase, title, description, children }) => {
    const isExpanded = expandedPhase === phase
    return (
      <Card className="mb-4">
        <button
          type="button"
          onClick={() => setExpandedPhase(isExpanded ? null : phase)}
          className="w-full flex items-center justify-between p-4 hover:bg-hub-card/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Badge variant={phase === 1 ? 'success' : phase === 2 ? 'info' : 'orange'}>
              Phase {phase}
            </Badge>
            <div className="text-left">
              <p className="font-semibold text-hub-text text-sm">{title}</p>
              <p className="text-xs text-hub-text-muted">{description}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-hub-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-hub-text-muted" />
          )}
        </button>
        {isExpanded && <div className="px-4 pb-4 border-t border-hub-border pt-4 space-y-4">{children}</div>}
      </Card>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-hub-text mb-2">Citations Setup</h1>
        <p className="text-hub-text-secondary text-sm">
          Configure your business information for directory submissions. All fields help us get you approved faster.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 ? (
          <>
            {/* Logo Upload */}
            <Card>
              <h2 className="text-sm font-semibold text-hub-text mb-4 block">Business Logo (Phase 2)</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-hub-border flex items-center justify-center overflow-hidden bg-hub-input">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <FileImage className="w-6 h-6 text-hub-text-muted" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex">
                    <span className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-hub-blue rounded-lg hover:bg-hub-blue/5 text-hub-blue font-medium transition-colors">
                      <Upload className="w-4 h-4" /> Choose file
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                  <p className="text-xs text-hub-text-muted mt-2">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </Card>

            {/* Phase 1 - Required */}
            <PhaseSection
              phase={1}
              title="Essential Info"
              description="Required for all submissions"
            >
              <div className="space-y-4">
                <Input label="Business name *" error={errors.businessName?.message} {...register('businessName')} />
                <Input label="Phone *" error={errors.phone?.message} {...register('phone')} />
                <Input label="Website" type="url" error={errors.website?.message} {...register('website')} />
                <Input label="Address *" error={errors.address?.message} {...register('address')} />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="City *" error={errors.city?.message} {...register('city')} />
                  <Select label="State *" options={US_STATES} error={errors.state?.message} {...register('state')} />
                  <Input label="ZIP *" error={errors.zip?.message} {...register('zip')} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-hub-text-secondary mb-2">Business Hours *</label>
                  <Select
                    options={HOURS_PRESETS}
                    error={errors.businessHours?.message}
                    {...register('businessHours')}
                  />
                  {hoursValue === 'custom' && (
                    <Input
                      placeholder="E.g. 9am-5pm Mon-Fri, 10am-3pm Sat"
                      className="mt-2"
                      error={errors.businessHours?.message}
                      {...register('businessHours')}
                    />
                  )}
                </div>

                <Textarea
                  label="Business Description *"
                  placeholder="Describe your business, services, and specialties"
                  rows={3}
                  error={errors.description?.message}
                  {...register('description')}
                />
              </div>
            </PhaseSection>

            {/* Phase 2 - Full Submission */}
            <PhaseSection
              phase={2}
              title="Social & Marketing"
              description="Optional - improves approval chances"
            >
              <div className="space-y-4">
                <Textarea
                  label="Short Description (160 chars)"
                  placeholder="Brief description for directory listings"
                  rows={2}
                  error={errors.shortDesc?.message}
                  {...register('shortDesc')}
                />
                <Textarea
                  label="Long Description"
                  placeholder="Detailed description of your business"
                  rows={4}
                  error={errors.longDesc?.message}
                  {...register('longDesc')}
                />
                <Input
                  label="Public Email"
                  type="email"
                  placeholder="For high-value citation sites"
                  error={errors.publicEmail?.message}
                  {...register('publicEmail')}
                />

                <div className="border-t border-hub-border pt-4">
                  <p className="text-xs font-semibold text-hub-text mb-3">Social Media Profiles</p>
                  <div className="space-y-3">
                    {[
                      { key: 'facebook', label: 'Facebook URL' },
                      { key: 'instagram', label: 'Instagram URL' },
                      { key: 'linkedin', label: 'LinkedIn URL' },
                      { key: 'twitter', label: 'Twitter / X URL' },
                      { key: 'youtube', label: 'YouTube URL' },
                      { key: 'tiktok', label: 'TikTok URL' },
                    ].map(({ key, label }) => (
                      <Input
                        key={key}
                        label={label}
                        type="url"
                        placeholder="https://..."
                        error={errors[key]?.message}
                        {...register(key)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PhaseSection>

            {/* Phase 3 - Optimization */}
            <PhaseSection
              phase={3}
              title="Advanced Options"
              description="Optional - for specialized submissions"
            >
              <div className="space-y-4">
                <Input
                  label="Service Areas"
                  placeholder="Cities/regions you serve (comma-separated)"
                  error={errors.serviceAreas?.message}
                  {...register('serviceAreas')}
                />
                <Input
                  label="Year Established"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  error={errors.yearEstablished?.message}
                  {...register('yearEstablished')}
                />
                <Input
                  label="License Number"
                  placeholder="If applicable"
                  error={errors.licenseNumber?.message}
                  {...register('licenseNumber')}
                />
                <Select
                  label="License State"
                  options={US_STATES}
                  error={errors.licenseState?.message}
                  {...register('licenseState')}
                />
                <Textarea
                  label="Certifications & Accreditations"
                  placeholder="List any relevant certifications (comma-separated)"
                  rows={2}
                  error={errors.certifications?.message}
                  {...register('certifications')}
                />
              </div>
            </PhaseSection>

            {/* Next Button */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/citations')}>
                Skip for Now
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save & Continue
              </Button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  )
}
