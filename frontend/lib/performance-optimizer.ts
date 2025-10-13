/**
 * Frontend Performance Optimization Utilities
 */

/**
 * Lazy load images with IntersectionObserver
 */
export function lazyLoadImages() {
  if (typeof window === 'undefined') return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Debounce function for search/input handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Prefetch data for next page navigation
 */
export function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Measure and report Web Vitals
 */
export function reportWebVitals(metric: any) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric);
  }
}

/**
 * Optimize bundle size by code splitting
 */
export async function loadComponentDynamically<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  const module = await importFn();
  return module.default;
}

/**
 * Memory cleanup for unmounted components
 */
export function useMemoryCleanup(callback: () => void) {
  if (typeof window === 'undefined') return;

  return () => {
    callback();
    
    // Force garbage collection hint (not guaranteed)
    if ((global as any).gc) {
      (global as any).gc();
    }
  };
}

/**
 * Service Worker registration for offline support
 */
export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}

/**
 * Preconnect to external domains
 */
export function preconnectDomains(domains: string[]) {
  if (typeof window === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Resource hints for better loading
 */
export function addResourceHints() {
  preconnectDomains([
    'https://api.bitcurrent.com',
    'https://js.stripe.com',
    'https://s3.tradingview.com'
  ]);
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // Slower than 60fps
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  };
}

/**
 * Virtual scrolling helper for large lists
 */
export function calculateVisibleItems(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
): { start: number; end: number } {
  const start = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(start + visibleCount + 5, totalItems); // +5 for buffer
  
  return { start: Math.max(0, start - 5), end }; // -5 for buffer
}

