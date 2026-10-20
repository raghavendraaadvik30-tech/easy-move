/**
 * Error Fallback UI Component
 */

export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="error-page" role="alert">
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h1>Something Went Wrong</h1>
        <p className="error-message">{error.message}</p>
        {error.stack && <pre className="error-details">{error.stack}</pre>}
        <div className="error-actions">
          <button className="primary-button" onClick={resetError}>
            Try Again →
          </button>
          <button
            className="text-button"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundaryContent({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="error-boundary-fallback" role="alert">
      <div className="error-boundary-content">
        <h2>Something went wrong</h2>
        <p>{error.message || 'An unexpected error occurred'}</p>
        <button className="primary-button" onClick={retry}>
          Try again →
        </button>
      </div>
    </div>
  )
}
