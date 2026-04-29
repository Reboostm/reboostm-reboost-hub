import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { signupStep1Schema, signupStep2Schema, signupStep3Schema } from '../../utils/validators'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { HUB_NAME, NICHES, US_STATES } from '../../config'

const STEPS = ['Account', 'Business', 'Finish']

export default function Signup() {
  const { signup } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)

  const schemas = [null, signupStep1Schema, signupStep2Schema, signupStep3Schema]
  const form = useForm({ resolver: zodResolver(schemas[step]), mode: 'onTouched' })
  const { register, handleSubmit, formState: { errors }, reset } = form

  const next = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
    if (step < 3) {
      setStep(s => s + 1)
      reset()
    }
  }

  const back = () => {
    setStep(s => s - 1)
    reset()
  }

  const onStep3Submit = async (data) => {
    const all = { ...formData, ...data }
    setLoading(true)
    try {
      await signup(all.email, all.password, {
        displayName: all.displayName,
        businessName: all.businessName,
        phone: all.phone,
        website: all.website || '',
        address: all.address || '',
        city: all.city,
        state: all.state,
        zip: all.zip,
        niche: all.niche,
        tagline: all.tagline || '',
        currentOffer: all.currentOffer || '',
      })
      toast(`Welcome to ${HUB_NAME}!`, 'success')
      navigate('/audit')
    } catch (err) {
      console.error('Signup error:', err)
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err.message || 'Signup failed. Please try again.'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 bg-hub-blue rounded-xl flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-hub-text">{HUB_NAME}</h1>
          <p className="text-hub-text-muted text-sm mt-1">Create your account</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    done ? 'bg-hub-green text-white' :
                    active ? 'bg-hub-blue text-white' :
                    'bg-hub-card border border-hub-border text-hub-text-muted'
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-hub-text' : 'text-hub-text-muted'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${step > n ? 'bg-hub-green' : 'bg-hub-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-hub-card border border-hub-border rounded-2xl p-8">
          {step === 1 && (
            <form onSubmit={handleSubmit(next)} className="space-y-4">
              <Input
                label="Full name"
                placeholder="Jane Smith"
                autoComplete="name"
                error={errors.displayName?.message}
                {...register('displayName')}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" className="w-full mt-2" size="lg">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(next)} className="space-y-4">
              <Input
                label="Business name"
                placeholder="Smith Plumbing LLC"
                error={errors.businessName?.message}
                {...register('businessName')}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="(801) 555-0100"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Website (optional)"
                type="url"
                placeholder="https://yoursite.com"
                error={errors.website?.message}
                {...register('website')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  placeholder="Salt Lake City"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Select
                  label="State"
                  options={US_STATES}
                  placeholder="State"
                  error={errors.state?.message}
                  {...register('state')}
                />
              </div>
              <Input
                label="ZIP code"
                placeholder="84101"
                error={errors.zip?.message}
                {...register('zip')}
              />
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="secondary" className="flex-1" size="lg" onClick={back}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit(onStep3Submit)} className="space-y-4">
              <Select
                label="Business type / niche"
                options={NICHES}
                placeholder="Select your niche…"
                error={errors.niche?.message}
                {...register('niche')}
              />
              <Input
                label='Tagline (optional)'
                placeholder="&quot;SLC's Most Trusted Plumber&quot;"
                error={errors.tagline?.message}
                {...register('tagline')}
              />
              <Input
                label="Current offer (optional)"
                placeholder='"10% off this month"'
                error={errors.currentOffer?.message}
                {...register('currentOffer')}
              />
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="secondary" className="flex-1" size="lg" onClick={back}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button type="submit" className="flex-1" size="lg" loading={loading}>
                  Create Account
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-hub-text-muted text-xs mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-hub-blue hover:text-hub-blue-hover transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
