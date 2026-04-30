import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { profileSchema } from '../../utils/validators'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { NICHES, US_STATES } from '../../config'

export default function Profile() {
  const { userProfile, updateProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (userProfile) reset(userProfile)
  }, [userProfile, reset])

  const isFirstTime = !userProfile?.businessName

  const onSubmit = async (data) => {
    try {
      await updateProfile(data)
      if (isFirstTime) {
        setSaved(true)
      } else {
        toast('Profile saved.', 'success')
      }
    } catch (err) {
      console.error('Profile save error:', err)
      toast(err?.message || 'Failed to save profile. Please try again.', 'error')
    }
  }

  if (saved) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-hub-green/10 border border-hub-green/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-hub-green" />
        </div>
        <h2 className="text-2xl font-semibold text-hub-text mb-2">You're all set!</h2>
        <p className="text-hub-text-secondary text-sm max-w-sm mb-6">
          Your dashboard is now personalized for your business. Everything you need to grow your local presence is ready to go.
        </p>
        <Button onClick={() => navigate('/audit')}>Go to My Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        {isFirstTime ? (
          <>
            <h1 className="text-2xl font-semibold text-hub-text">Welcome to ReBoost Marketing HUB!</h1>
            <p className="text-hub-text-secondary text-sm mt-2">
              Before you dive in, take 60 seconds to tell us about your business. This personalizes everything in your dashboard — your content, your reports, and your marketing materials — so it all speaks directly to your customers.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-hub-text">Business Profile</h1>
            <p className="text-hub-text-secondary text-sm mt-2">
              This information is used on your content, reviews, and marketing materials.
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-hub-text mb-4">Personal</h2>
          <div className="space-y-4">
            <Input label="Full name" error={errors.displayName?.message} {...register('displayName')} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-hub-text mb-4">Business Info</h2>
          <div className="space-y-4">
            <Input label="Business name" error={errors.businessName?.message} {...register('businessName')} />
            <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
            <Input label="Website" type="url" error={errors.website?.message} {...register('website')} />
            <Input label="Address" error={errors.address?.message} {...register('address')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" error={errors.city?.message} {...register('city')} />
              <Select label="State" options={US_STATES} placeholder="State" error={errors.state?.message} {...register('state')} />
            </div>
            <Input label="ZIP code" error={errors.zip?.message} {...register('zip')} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-hub-text mb-4">Brand & Niche</h2>
          <div className="space-y-4">
            <Select label="Business niche" options={NICHES} placeholder="Select niche…" error={errors.niche?.message} {...register('niche')} />
            <Input label="Tagline" placeholder="&quot;SLC's Most Trusted Plumber&quot;" error={errors.tagline?.message} {...register('tagline')} />
            <Input label="Current offer" placeholder='"10% off this month"' error={errors.currentOffer?.message} {...register('currentOffer')} />
          </div>
        </Card>

        <Button type="submit" size="lg" loading={isSubmitting}>Save Changes</Button>
      </form>
    </div>
  )
}
