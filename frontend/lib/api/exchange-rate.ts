/**
 * Live GBP/USD Exchange Rate Service
 * Uses multiple fallback sources for reliability
 */

interface ExchangeRateResponse {
  rate: number
  source: string
  timestamp: number
}

// Cache exchange rate for 1 hour
let cachedRate: ExchangeRateResponse | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Fetch live GBP/USD exchange rate from multiple sources
 */
export async function getLiveGBPUSDRate(): Promise<number> {
  // Return cached rate if still valid
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate
  }

  try {
    // Primary source: ExchangeRate-API (free tier: 1,500 requests/month)
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (response.ok) {
      const data = await response.json()
      const usdToGbp = data.rates?.GBP
      
      if (usdToGbp && typeof usdToGbp === 'number') {
        cachedRate = {
          rate: usdToGbp,
          source: 'ExchangeRate-API',
          timestamp: Date.now()
        }
        return usdToGbp
      }
    }
  } catch (error) {
    console.warn('Primary exchange rate API failed, trying fallback:', error)
  }

  try {
    // Fallback source: Frankfurter API (free, no API key needed)
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=GBP')
    
    if (response.ok) {
      const data = await response.json()
      const usdToGbp = data.rates?.GBP
      
      if (usdToGbp && typeof usdToGbp === 'number') {
        cachedRate = {
          rate: usdToGbp,
          source: 'Frankfurter',
          timestamp: Date.now()
        }
        return usdToGbp
      }
    }
  } catch (error) {
    console.warn('Fallback exchange rate API failed:', error)
  }

  // Ultimate fallback: use a reasonable default (updated monthly)
  console.warn('All exchange rate APIs failed, using fallback rate')
  const fallbackRate = 0.750285 // As of Oct 2024: 1 USD ≈ 0.750285 GBP (updated to current rate)
  
  cachedRate = {
    rate: fallbackRate,
    source: 'fallback',
    timestamp: Date.now()
  }
  
  return fallbackRate
}

/**
 * Get the current cached exchange rate info
 */
export function getCachedExchangeRateInfo(): ExchangeRateResponse | null {
  return cachedRate
}

/**
 * Force refresh the exchange rate
 */
export async function refreshExchangeRate(): Promise<number> {
  cachedRate = null
  return getLiveGBPUSDRate()
}

