/**
 * App Wrapper Component
 * Provides network resilience, and initialization logic
 */

import { useEffect, useState } from 'react'
import App from '../App'
import { setupNetworkRecovery, onNetworkStatusChange, isOnline } from '../lib/network-resilience'
import { LoadingOverlay } from './LoadingStates'

export function AppWrapper() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline())
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      // Setup network recovery on mount
      const unsubscribe = setupNetworkRecovery()

      // Listen to network status changes
      const unsubscribeStatus = onNetworkStatusChange(status => {
        setIsOnlineStatus(status)
        if (status) {
          console.log('Network connection restored')
        } else {
          console.log('Network connection lost - working in offline mode')
        }
      })

      // Mark as initialized after a short delay
      const timer = requestAnimationFrame(() => {
        setIsInitialized(true)
      })

      return () => {
        clearTimeout(timer)
        unsubscribe()
        unsubscribeStatus()
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize'))
    }
  }, [])

  if (error) {
    return (
      <div className="error-page" role="alert">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h1>Application Error</h1>
          <p className="error-message">{error.message}</p>
          <div className="error-actions">
            <button className="primary-button" onClick={() => window.location.reload()}>
              Reload Page →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <App />
      <NetworkStatusIndicator isOnline={isOnlineStatus} />
      {!isInitialized && <LoadingOverlay isVisible label="Initializing..." />}
    </>
  )
}

/**
 * Network Status Indicator
 * Shows when app is offline
 */
function NetworkStatusIndicator({ isOnline }: { isOnline: boolean }) {
  return (
    <div
      className={`network-status-indicator ${isOnline ? 'online' : 'offline'}`}
      role="status"
      aria-live="polite"
    >
      <span className="status-dot" />
      {isOnline ? 'Online' : 'Offline - Changes will sync when back online'}
    </div>
  )
}
