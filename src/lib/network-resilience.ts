/**
 * Network Resilience & Retry Logic
 * Handles offline mode and automatic retry of failed requests
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  backoffMultiplier?: number
  timeoutMs?: number
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  timeoutMs: 10000
}

/**
 * Execute a function with exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= (opts.maxRetries || 3); attempt++) {
    try {
      return await executeWithTimeout(fn, opts.timeoutMs || 10000)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < (opts.maxRetries || 3)) {
        const delayMs = (opts.initialDelayMs || 500) * Math.pow(opts.backoffMultiplier || 2, attempt)
        await sleep(delayMs)
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}

/**
 * Execute a function with timeout
 */
function executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs))
  ])
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Detect if browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/**
 * Listen to online/offline events
 */
export function onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Queue for storing requests when offline
 */
export interface QueuedRequest {
  id: string
  fn: () => Promise<void>
  timestamp: number
  retries: number
}

class RequestQueue {
  private queue: QueuedRequest[] = []
  private processing = false

  add(id: string, fn: () => Promise<void>): void {
    const existing = this.queue.find(r => r.id === id)
    if (existing) return

    this.queue.push({
      id,
      fn,
      timestamp: Date.now(),
      retries: 0
    })
  }

  async process(): Promise<void> {
    if (this.processing || !isOnline()) return

    this.processing = true

    while (this.queue.length > 0) {
      const request = this.queue[0]

      try {
        await request.fn()
        this.queue.shift() // Success: remove from queue
      } catch (error) {
        request.retries++

        if (request.retries >= 3) {
          console.error(`Request ${request.id} failed after 3 retries:`, error)
          this.queue.shift() // Give up
        } else {
          break // Stop processing on first failure, will retry later
        }
      }
    }

    this.processing = false
  }

  clear(): void {
    this.queue = []
  }

  size(): number {
    return this.queue.length
  }
}

export const requestQueue = new RequestQueue()

/**
 * Setup automatic queue processing on network recovery
 */
export function setupNetworkRecovery(): () => void {
  return onNetworkStatusChange(isOnline => {
    if (isOnline) {
      console.log('Network restored, processing queued requests...')
      requestQueue.process()
    }
  })
}

/**
 * Validate Supabase response
 */
export function validateResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
