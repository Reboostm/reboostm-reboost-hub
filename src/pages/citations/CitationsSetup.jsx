import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, ChevronDown, ChevronUp, FileImage, Info } from 'lucide-react'
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

const BUSINESS_CATEGORIES = [
  { value: '', label: 'Select a category...' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Attorney', label: 'Attorney / Law Firm' },
  { value: 'Auto Repair Shop', label: 'Auto Repair Shop' },
  { value: 'Chiropractor', label: 'Chiropractor' },
  { value: 'Cleaning Service', label: 'Cleaning Service' },
  { value: 'Dentist', label: 'Dentist' },
  { value: 'Electrician', label: 'Electrician' },
  { value: 'Flooring Contractor', label: 'Flooring Contractor' },
  { value: 'General Contractor', label: 'General Contractor' },
  { value: 'Home Inspector', label: 'Home Inspector' },
  { value: 'HVAC Contractor', label: 'HVAC Contractor' },
  { value: 'Insurance Agency', label: 'Insurance Agency' },
  { value: 'Landscaping Service', label: 'Landscaping Service' },
  { value: 'Locksmith', label: 'Locksmith' },
  { value: 'Moving Company', label: 'Moving Company' },
  { value: 'Painter', label: 'Painter' },
  { value: 'Pest Control Service', label: 'Pest Control Service' },
  { value: 'Physical Therapist', label: 'Physical Therapist' },
  { value: 'Plumber', label: 'Plumber' },
  { value: 'Property Management', label: 'Property Management' },
  { value: 'Real Estate Agency', label: 'Real Estate Agency' },
  { value: 'Roofing Contractor', label: 'Roofing Contractor' },
  { value: 'Tax Preparation Service', label: 'Tax Preparation Service' },
  { value: 'Tree Service', label: 'Tree Service' },
  { value: 'Veterinarian', label: 'Veterinarian' },
  { value: 'Other', label: 'Other Local Business' },
]

export default function CitationsSetup() {
  const navigate = useNavigate()
  const { userProfile, updateProfile } = useAuth()
  const { toast } = useToast()

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [expandedStep, setExpandedStep] = useState(1)

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
      category: userProfile?.category || '',
      description: userProfile?.description || '',
      shortDesc: userProfile?.shortDesc || '',
      longDesc: userProfile?.longDesc || '',
      contactEmail: userProfile?.contactEmail || '',
      facebook: userProfile?.facebook || '',
      instagram: userProfile?.instagram || '',
      linkedin: userProfile?.linkedin || '',
      twitter: userProfile?.twitter || '',
      youtube: userProfile?.youtube || '',
      tiktok: userProfile?.tiktok || '',
      serviceAreas: userProfile?.serviceAreas || '',
      yearEstablished: userProfile?.yearEstablished || new Date().getFullYear().toString(),
      licenseNumber: userProfile?.licenseNumber || '',
      licenseState: userProfile?.licenseState || '',
      certifications: userProfile?.certifications || '',
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
        category: userProfile.category || '',
        description: userProfile.description || '',
        shortDesc: userProfile.shortDesc || '',
        longDesc: userProfile.longDesc || '',
        contactEmail: userProfile.contactEmail || '',
        facebook: userProfile.facebook || '',
        instagram: userProfile.instagram || '',
        linkedin: userProfile.linkedin || '',
        twitter: userProfile.twitter || '',
        youtube: userProfile.youtube || '',
        tiktok: userProfile.tiktok || '',
        serviceAreas: userProfile.serviceAreas || '',
        yearEstablished: userProfile.yearEstablished || new Date().getFullYear().toString(),
        licenseNumber: userProfile.licenseNumber || '',
        licenseState: userProfile.licenseState || '',
        certifications: userProfile.certifications || '',
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
      const payload = {
        ...data,
        citationsSetupCompleted: true,
        paymentMethods: watch('paymentMethods') || [],
      }
      await updateProfile(payload)
      toast('Business submission info saved! Ready to start submissions.', 'success')
      setTimeout(() => navigate('/citations'), 1500)
    } catch (err) {
      console.error('Error saving citations setup:', err)
      toast(err.message || 'Failed to save setup', 'error')
    }
  }

  const StepSection = ({ step, title, description, required, children }) => {
    const isExpanded = expandedStep === step
    const variantMap = { 1: 'success', 2: 'info', 3: 'orange' }
    return (
      <Card className="mb-4">
        <button
          type="button"
          onClick={() => setExpandedStep(isExpanded ? null : step)}
          className="w-full flex items-center justify-between p-4 hover:bg-hub-card/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Badge variant={variantMap[step]}>Step {step}</Badge>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-hub-text text-sm">{title}</p>
                {required && (
                  <span className="text-xs font-medium text-hub-red bg-hub-red/10 px-1.5 py-0.5 rounded">Required</span>
                )}
              </div>
              <p className="text-xs text-hub-text-muted">{description}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-hub-text-muted flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-hub-text-muted flex-shrink-0" />
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
        <h1 className="text-2xl font-semibold text-hub-text mb-2">Business Submission Info</h1>
        <p className="text-hub-text-secondary text-sm">
          Fill in your business details below. This information is used to submit your business to hundreds of directories.
          The more you fill out, the more directories we can submit to.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Upload */}
        <Card>
          <h2 className="text-sm font-semibold text-hub-text mb-4 block">Business Logo <span className="text-hub-text-muted font-normal">(used in Step 2 submissions)</span></h2>
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

        {/* Step 1 — Required */}
        <StepSection
          step={1}
          title="NAP & Essential Info"
          description="Your Name, Address, and Phone — required for all submissions"
          required
        >
          {/* NAP Explanation Banner */}
          <div className="flex gap-3 bg-hub-blue/8 border border-hub-blue/25 rounded-xl p-3.5">
            <Info className="w-4 h-4 text-hub-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-hub-blue mb-1">Why NAP consistency matters</p>
              <p className="text-xs text-hub-text-secondary leading-relaxed">
                NAP = <strong>Name, Address, Phone.</strong> Every directory must show
                your information <strong>exactly the same way</strong> — even small differences
                like "St." vs "Street" or a missing suite number can hurt your local Google rankings.
                Fill this in exactly as it appears on your Google Business Profile.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Business Name *"
              placeholder="Desert Shield Pest Control"
              error={errors.businessName?.message}
              {...register('businessName')}
            />
            <Select
              label="Business Category *"
              options={BUSINESS_CATEGORIES}
              error={errors.category?.message}
              {...register('category')}
            />
            <Input
              label="Phone *"
              placeholder="(602) 555-0182"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Website"
              type="url"
              placeholder="https://desertshieldpest.com"
              error={errors.website?.message}
              {...register('website')}
            />
            <Input
              label="Street Address *"
              placeholder="4820 N 16th St"
              error={errors.address?.message}
              {...register('address')}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City *"
                placeholder="Phoenix"
                error={errors.city?.message}
                {...register('city')}
              />
              <Select
                label="State *"
                options={US_STATES}
                error={errors.state?.message}
                {...register('state')}
              />
              <Input
                label="ZIP *"
                placeholder="85016"
                error={errors.zip?.message}
                {...register('zip')}
              />
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
                  placeholder="E.g. Mon–Fri 8am–6pm, Sat 9am–2pm, Closed Sun"
                  className="mt-2"
                  error={errors.businessHoursCustom?.message}
                  {...register('businessHours')}
                />
              )}
            </div>

            <Textarea
              label="Business Description *"
              placeholder="Desert Shield Pest Control is a family-owned company serving the Phoenix metro area since 2008. We specialize in scorpion treatment, termite prevention, rodent control, and year-round pest protection plans for homes and businesses. Licensed, bonded, and insured."
              rows={4}
              error={errors.description?.message}
              {...register('description')}
            />
            <p className="text-xs text-hub-text-muted -mt-2">
              2–4 sentences. This is saved to your Hub profile and used across the platform. Write it in full — what you do, where you serve, and what makes you different.
            </p>
          </div>
        </StepSection>

        {/* Step 2 — Social & Marketing */}
        <StepSection
          step={2}
          title="Descriptions & Social"
          description="Optional — improves approval rate on premium directories"
        >
          <div className="space-y-4">
            <div>
              <Textarea
                label="Short Description"
                placeholder="Phoenix's trusted pest control experts — scorpions, termites, rodents & more. Family-owned since 2008. Free quotes!"
                rows={2}
                error={errors.shortDesc?.message}
                {...register('shortDesc')}
              />
              <p className="text-xs text-hub-text-muted mt-1">
                160 characters max. Used as a tagline on directory listing cards — keep it punchy.
              </p>
            </div>

            <div>
              <Textarea
                label="Long Description"
                placeholder="Desert Shield Pest Control has protected Phoenix-area homes and businesses since 2008. Our licensed technicians specialize in scorpion treatment and barrier installation, termite inspections, rodent exclusion, cockroach elimination, and quarterly protection plans. We use eco-friendly, pet-safe products backed by a 30-day satisfaction guarantee. Serving Phoenix, Scottsdale, Tempe, Mesa, Gilbert, Chandler, and surrounding communities."
                rows={5}
                error={errors.longDesc?.message}
                {...register('longDesc')}
              />
              <p className="text-xs text-hub-text-muted mt-1">
                Full business description for directories that give you more space. Cover your main services, service area, and what makes you unique.
              </p>
            </div>

            <div>
              <Input
                label="Business Contact Email"
                type="email"
                placeholder="contact@desertshieldpest.com"
                error={errors.contactEmail?.message}
                {...register('contactEmail')}
              />
              <p className="text-xs text-hub-text-muted mt-1">
                The email shown publicly on your directory listings. Use a business email — not a personal one.
              </p>
            </div>

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
        </StepSection>

        {/* Step 3 — Advanced */}
        <StepSection
          step={3}
          title="Advanced Options"
          description="Optional — for specialized directory submissions"
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Service Areas"
                placeholder="Phoenix, Scottsdale, Tempe, Mesa, Gilbert, Chandler"
                error={errors.serviceAreas?.message}
                {...register('serviceAreas')}
              />
              <p className="text-xs text-hub-text-muted mt-1">Cities or regions you serve, comma-separated.</p>
            </div>
            <Input
              label="Year Established"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="2008"
              error={errors.yearEstablished?.message}
              {...register('yearEstablished')}
            />
            <Input
              label="License Number"
              placeholder="PCO-12345 (if applicable)"
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
              placeholder="BBB Accredited, NPMA Member, QualityPro Certified"
              rows={2}
              error={errors.certifications?.message}
              {...register('certifications')}
            />
          </div>
        </StepSection>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/citations')}>
            Skip for Now
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
