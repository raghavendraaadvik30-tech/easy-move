/**
 * Loading State Components
 * Skeleton loaders, spinners, and loading indicators
 */

import { animationClasses } from '../lib/animations'

/**
 * Generic skeleton loader with shimmer effect
 */
export function SkeletonLoader({ width = '100%', height = '20px', className = '' }: any) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
      aria-busy="true"
    />
  )
}

/**
 * Chapter list skeleton
 */
export function ChapterListSkeleton() {
  return (
    <div className="skeleton-container">
      {[1, 2, 3, 4, 5].map((i: number) => (
        <div key={i} className="skeleton-row">
          <SkeletonLoader width="40px" height="40px" className="skeleton-avatar" />
          <div style={{ flex: 1 }}>
            <SkeletonLoader width="70%" height="16px" className="skeleton-text" />
            <SkeletonLoader width="90%" height="12px" className="skeleton-text-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Question card skeleton
 */
export function QuestionCardSkeleton() {
  return (
    <div className="skeleton-question">
      <SkeletonLoader width="100%" height="80px" className="skeleton-text-block" />
      <div className="skeleton-options">
        {[1, 2, 3, 4].map((i: number) => (
          <SkeletonLoader key={i} width="100%" height="40px" className="skeleton-option" />
        ))}
      </div>
    </div>
  )
}

/**
 * Dashboard overview skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-header">
        <SkeletonLoader width="200px" height="32px" className="skeleton-title" />
        <SkeletonLoader width="150px" height="24px" className="skeleton-subtitle" />
      </div>
      <div className="skeleton-cards">
        {[1, 2, 3, 4].map((i: number) => (
          <div key={i} className="skeleton-card">
            <SkeletonLoader width="80px" height="40px" className="skeleton-icon" />
            <SkeletonLoader width="100%" height="16px" className="skeleton-text" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Spinning loader indicator
 */
export function SpinnerLoader({ size = 'md', label = 'Loading...' }: any) {
  const sizeClasses: any = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg'
  }
  const sizeClass = sizeClasses[size] || 'spinner-md'

  return (
    <div className={`spinner-container ${sizeClass}`} role="status" aria-label={label}>
      <div className={`spinner ${animationClasses.spin}`} />
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Loading overlay for async operations
 */
export function LoadingOverlay({ isVisible = false, label = 'Processing...' }: any) {
  if (!isVisible) return null

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-overlay-content">
        <SpinnerLoader label={label} />
        <p>{label}</p>
      </div>
    </div>
  )
}

/**
 * Inline loading indicator (smaller, inline)
 */
export function InlineLoader({ label = '' }: any) {
  return (
    <span className="inline-loader" role="status" aria-label={label}>
      <span className={`inline-spinner ${animationClasses.spin}`} />
      {label && <span className="inline-loader-text">{label}</span>}
    </span>
  )
}

/**
 * Animated progress bar
 */
export function ProgressBar({ value = 0, max = 100, animated = true, showLabel = false }: any) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="progress-bar-container">
      <div className={`progress-bar ${animated ? 'animated' : ''}`}>
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
      {showLabel && <span className="progress-label">{Math.round(percentage)}%</span>}
    </div>
  )
}

/**
 * Pulsing dot loader (for ongoing tasks)
 */
export function DotLoader() {
  return (
    <div className={`dot-loader ${animationClasses.pulse}`}>
      <span />
      <span />
      <span />
    </div>
  )
}
