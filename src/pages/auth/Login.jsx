import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { loginSchema } from '../../utils/validators'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { HUB_NAME } from '../../config'

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/audit')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Incorrect email or password.'
        : err.message || 'Login failed. Please try again.'
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
          <p className="text-hub-text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-hub-card border border-hub-border rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-hub-blue hover:text-hub-blue-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-hub-text-muted text-xs mt-4">
            Don't have an account? Contact your ReBoost representative.
          </p>
        </div>
      </div>
    </div>
  )
}
