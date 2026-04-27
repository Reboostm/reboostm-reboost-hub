import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { forgotPasswordSchema } from '../../utils/validators'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { HUB_NAME } from '../../config'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch {
      // Still show success to prevent email enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 bg-hub-blue rounded-xl flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-hub-text">{HUB_NAME}</h1>
        </div>

        <div className="bg-hub-card border border-hub-border rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-hub-green/10 border border-hub-green/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-hub-green" />
              </div>
              <h2 className="text-lg font-semibold text-hub-text mb-2">Check your inbox</h2>
              <p className="text-sm text-hub-text-secondary mb-6">
                If that email is in our system, you'll receive a reset link shortly.
              </p>
              <Link to="/login">
                <Button variant="secondary" className="w-full">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-hub-text mb-1">Reset your password</h2>
              <p className="text-sm text-hub-text-muted mb-6">
                Enter the email associated with your account and we'll send a reset link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 mt-5 text-sm text-hub-text-muted hover:text-hub-text transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
