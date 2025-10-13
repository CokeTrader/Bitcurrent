/**
 * Frontend Security Checks
 * Ensure no secrets in client-side code
 */

/**
 * Check if string looks like a secret
 */
export function looksLikeSecret(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Patterns that look like secrets
  const secretPatterns = [
    /sk_live_[a-zA-Z0-9]+/, // Stripe live secret key
    /pk_live_[a-zA-Z0-9]+/, // Stripe live public key (less critical)
    /[a-zA-Z0-9]{32,}/, // Long random strings
    /[A-Z0-9]{20,}/, // AWS-style keys
    /ghp_[a-zA-Z0-9]+/, // GitHub personal access token
    /gho_[a-zA-Z0-9]+/, // GitHub OAuth token
  ];
  
  return secretPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate that we're only using public/test keys on client
 */
export function validateClientKeys() {
  // Check all environment variables exposed to client
  const clientEnv = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  };
  
  const warnings: string[] = [];
  
  Object.entries(clientEnv).forEach(([key, value]) => {
    if (!value) return;
    
    // Check for live Stripe secret keys
    if (value.startsWith('sk_live_')) {
      warnings.push(`🚨 CRITICAL: Live Stripe SECRET key in ${key}!`);
    }
    
    // Check for any suspicious patterns
    if (looksLikeSecret(value) && !value.startsWith('pk_')) {
      warnings.push(`⚠️  WARNING: ${key} looks like a secret`);
    }
  });
  
  return warnings;
}

/**
 * Runtime security check (development only)
 */
export function runSecurityChecks() {
  if (process.env.NODE_ENV === 'production') {
    // Don't run in production to avoid performance impact
    return;
  }
  
  const warnings = validateClientKeys();
  
  if (warnings.length > 0) {
    console.error('🚨 SECURITY WARNINGS:');
    warnings.forEach(w => console.error(w));
    console.error('\n⚠️  Fix these issues before deploying to production!');
  } else {
    console.log('✅ Client-side security checks passed');
  }
}

/**
 * Safe environment variable getter
 */
export function getPublicEnv(key: string): string | undefined {
  // Only allow NEXT_PUBLIC_ prefixed vars
  if (!key.startsWith('NEXT_PUBLIC_')) {
    console.error(`❌ Attempted to access non-public env var: ${key}`);
    return undefined;
  }
  
  return process.env[key];
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Safe API URL getter
 */
export function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL not configured');
  }
  
  // Validate URL format
  try {
    new URL(apiUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL is not a valid URL');
  }
  
  return apiUrl;
}

/**
 * Safe Stripe public key getter
 */
export function getStripePublicKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_KEY;
  
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_KEY not configured');
  }
  
  // Ensure it's a public key
  if (!key.startsWith('pk_')) {
    throw new Error('Stripe key must be a public key (pk_...)');
  }
  
  return key;
}

// Run checks on import (development only)
if (typeof window !== 'undefined') {
  runSecurityChecks();
}

