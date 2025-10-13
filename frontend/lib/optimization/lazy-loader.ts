/**
 * Lazy Loading Utilities
 * 
 * Optimize frontend performance through lazy loading:
 * - Dynamic component imports
 * - Image lazy loading
 * - Route-based code splitting
 * - Intersection Observer for visibility
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Lazy load component with loading state
 */
export function lazyLoadComponent<T = any>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  LoadingComponent?: ComponentType
) {
  return dynamic(importFunc, {
    loading: LoadingComponent 
      ? () => <LoadingComponent />
      : () => <div>Loading...</div>,
    ssr: false // Disable SSR for heavy components
  });
}

/**
 * Lazy load route component
 */
export function lazyLoadRoute(
  importFunc: () => Promise<{ default: ComponentType }>,
  options: {
    preload?: boolean;
    ssr?: boolean;
  } = {}
) {
  return dynamic(importFunc, {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: options.ssr !== false
  });
}

/**
 * Image lazy loader with intersection observer
 */
export class LazyImage {
  private observer: IntersectionObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              
              if (src) {
                img.src = src;
                img.classList.add('loaded');
                this.observer?.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px' // Start loading 50px before visible
        }
      );
    }
  }

  /**
   * Observe image for lazy loading
   */
  observe(img: HTMLImageElement) {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: 'script' | 'style' | 'font' | 'image') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch next route
 */
export function prefetchRoute(href: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun >= limitMs) {
      func(...args);
      lastRun = now;
    }
  };
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

export default {
  lazyLoadComponent,
  lazyLoadRoute,
  LazyImage,
  preloadResource,
  prefetchRoute,
  debounce,
  throttle,
  memoize
};

