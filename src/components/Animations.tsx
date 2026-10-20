/**
 * Reusable Animation Components
 * Wraps common animation patterns
 */

import React, { useEffect, useState } from 'react'
import { animationClasses } from '../lib/animations'

interface PageTransitionProps {
  children: any
  isVisible?: boolean
  delay?: number
}

/**
 * Fade-in animation on mount
 */
export function FadeIn({ children, isVisible = true, delay = 0 }: PageTransitionProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={show && isVisible ? animationClasses.fadeIn : ''} style={{ opacity: show && isVisible ? 1 : 0 }}>
      {children}
    </div>
  )
}

/**
 * Slide-down animation on mount
 */
export function SlideDown({ children, isVisible = true, delay = 0 }: PageTransitionProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={show && isVisible ? animationClasses.slideInDown : ''}>
      {children}
    </div>
  )
}

/**
 * Bounce animation on success
 */
export function BounceEffect({
  children,
  trigger = false,
  onComplete
}: {
  children: any
  trigger?: boolean
  onComplete?: () => void
}) {
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (trigger) {
      setBounce(true)
      const timer = setTimeout(() => {
        setBounce(false)
        onComplete?.()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  return (
    <div className={bounce ? animationClasses.bounce : ''}>
      {children}
    </div>
  )
}

/**
 * Shake animation for errors
 */
export function ShakeEffect({ children, trigger = false }: { children: any; trigger?: boolean }) {
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (trigger) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 400)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  return <div className={shake ? animationClasses.shake : ''}>{children}</div>
}

/**
 * Smooth height transition
 */
export function HeightTransition({
  isOpen = false,
  children
}: {
  isOpen: boolean
  children: any
}) {
  const [height, setHeight] = useState<number | 'auto'>(0)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [isOpen])

  return (
    <div
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        overflow: 'hidden',
        transition: 'height 300ms ease-in-out'
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

/**
 * Checkmark animation for correct answers
 */
export function CheckmarkAnimation({
  isCorrect = false,
  trigger = false
}: {
  isCorrect: boolean
  trigger: boolean
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  if (!show) return null

  return (
    <div className={`checkmark-animation ${animationClasses.checkmark} ${isCorrect ? 'correct' : 'incorrect'}`}>
      {isCorrect ? '✓' : '✗'}
    </div>
  )
}
