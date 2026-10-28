import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'var(--bg-deep)',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-primary)',
        }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              We encountered an unexpected error. Please refresh the page to try again.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px',
                maxHeight: '300px',
                overflow: 'auto',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                  Error Details (Dev Only)
                </summary>
                <p style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--red)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '10px 0 0 0',
                }}>
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <p style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: '10px 0 0 0',
                  }}>
                    {this.state.errorInfo.componentStack}
                  </p>
                )}
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 32px',
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--brand-light)'
                e.target.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--brand)'
                e.target.style.transform = 'scale(1)'
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
