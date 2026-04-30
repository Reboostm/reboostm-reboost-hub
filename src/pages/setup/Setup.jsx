import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { claimAdminRole } from '../../services/functions'
import { useAuth } from '../../hooks/useAuth'

export default function Setup() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleClaim = async () => {
    setStatus('loading')
    try {
      await claimAdminRole({})
      setStatus('success')
      setTimeout(() => navigate('/admin'), 1800)
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="text-center py-10 px-8">
          <div className="w-16 h-16 rounded-2xl bg-hub-blue/10 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-hub-blue" />
          </div>

          <h1 className="text-2xl font-bold text-hub-text mb-2">Admin Setup</h1>
          <p className="text-hub-text-secondary text-sm mb-8 leading-relaxed">
            This one-time action grants your account <strong className="text-hub-text">admin access</strong>.
            Once claimed, this page can no longer be used.
          </p>

          {status === 'idle' && (
            <>
              <div className="bg-hub-input rounded-lg p-4 mb-6 text-left space-y-1.5">
                <p className="text-xs text-hub-text-muted">
                  <span className="font-medium text-hub-text">Account:</span>{' '}
                  {userProfile?.email || '—'}
                </p>
                <p className="text-xs text-hub-text-muted">
                  <span className="font-medium text-hub-text">Current role:</span>{' '}
                  {userProfile?.role || 'client'}
                </p>
              </div>
              <Button onClick={handleClaim} className="w-full" size="lg">
                <ShieldCheck className="w-4 h-4" />
                Claim Admin Access
              </Button>
            </>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center gap-3 text-hub-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Granting admin role…</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-10 h-10 text-hub-green" />
              <p className="text-hub-green font-semibold">Admin access granted!</p>
              <p className="text-hub-text-muted text-xs">Redirecting to Admin Panel…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 bg-hub-red/10 border border-hub-red/20 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-hub-red flex-shrink-0" />
                <p className="text-xs text-hub-red">{errorMsg}</p>
              </div>
              <Button variant="secondary" onClick={() => setStatus('idle')} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
