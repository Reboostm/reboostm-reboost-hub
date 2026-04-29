import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleGmailOAuthCallback } from '../../services/functions'
import Spinner from '../../components/ui/Spinner'

export default function GmailCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const error = searchParams.get('error')
    const code   = searchParams.get('code')

    if (error || !code) {
      navigate('/settings/integrations?gmail=denied', { replace: true })
      return
    }

    handleGmailOAuthCallback({ code })
      .then(({ email }) => {
        navigate(`/settings/integrations?gmail=connected&email=${encodeURIComponent(email)}`, { replace: true })
      })
      .catch(err => {
        const msg = err?.message || 'failed'
        navigate(`/settings/integrations?gmail=error&msg=${encodeURIComponent(msg)}`, { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen bg-hub-bg flex flex-col items-center justify-center gap-4">
      <Spinner size="xl" />
      <p className="text-hub-text-secondary text-sm">Connecting your Gmail account…</p>
    </div>
  )
}
