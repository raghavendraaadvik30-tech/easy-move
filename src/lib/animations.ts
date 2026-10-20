/**
 * Animation utilities and keyframes
 * Pure CSS-based animations for better performance
 */

export const animationClasses = {
  // Page transitions
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInDown: 'animate-slide-in-down',
  slideInUp: 'animate-slide-in-up',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',

  // Micro-interactions
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  shake: 'animate-shake',
  checkmark: 'animate-checkmark',
  wiggle: 'animate-wiggle',

  // Loading states
  shimmer: 'animate-shimmer',
  skeleton: 'animate-skeleton',

  // List animations
  staggerContainer: 'animate-stagger-container',
  staggerItem: 'animate-stagger-item'
}

export type AnimationClass = keyof typeof animationClasses

/**
 * Delay utility for staggered animations
 */
export function getStaggerDelay(index: number): string {
  return `${index * 50}ms`
}

/**
 * Duration presets for consistent timing
 */
export const animationDurations = {
  instant: '0ms',
  micro: '100ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
  slowest: '1000ms'
}

/**
 * Easing functions for smooth animations
 */
export const easing = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  linear: 'linear'
}

/**
 * Transition helper for generating CSS transitions
 */
export function createTransition(
  properties: string[] = ['all'],
  duration: string = '300ms',
  easeFunc: string = 'ease-in-out',
  delay: string = '0ms'
): string {
  return properties.map(prop => `${prop} ${duration} ${easeFunc} ${delay}`).join(', ')
}
