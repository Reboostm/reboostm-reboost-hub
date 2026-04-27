import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (userProfile) reset(userProfile)
  }, [userProfile, reset])

  const onSubmit = async (data) => {
    try {
      await updateProfile(data)
      toast('Profile saved.', 'success')
    } catch {
      toast('Failed to save profile. Please try again.', 'error')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Profile Settings</h1>

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
