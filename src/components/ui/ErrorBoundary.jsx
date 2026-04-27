import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ReBoost Hub] Uncaught error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0F1117',
          color: '#F0F4FF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48,
            background: '#EF4444',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 16,
          }}>⚠</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#A0AABF', fontSize: '0.875rem', marginBottom: 24, maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#4F8EF7', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '0.5rem 1.5rem', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            Reload Page
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: 24, padding: 16,
              background: '#1E2235', borderRadius: 8,
              fontSize: '0.75rem', color: '#8B9CC8',
              textAlign: 'left', maxWidth: 600, overflow: 'auto',
            }}>
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
