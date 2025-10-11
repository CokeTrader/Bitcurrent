/**
 * Technical Indicators Calculations
 * RSI, MACD, Bollinger Bands, SMA, EMA
 */

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN)
      continue
    }
    
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    sma.push(sum / period)
  }
  
  return sma
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)
  
  // First EMA is SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  ema[period - 1] = sum / period
  
  // Calculate EMA for rest
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
  }
  
  // Fill initial NaN values
  for (let i = 0; i < period - 1; i++) {
    ema[i] = NaN
  }
  
  return ema
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  // Calculate price changes
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  // Calculate average gains and losses
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  // First RSI
  rsi.push(NaN) // First candle has no RSI
  for (let i = 0; i < period; i++) {
    rsi.push(NaN)
  }
  
  // Calculate RSI
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi.push(100 - (100 / (1 + rs)))
  }
  
  return rsi
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(candles: Candle[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const closes = candles.map(c => c.close)
  
  // Calculate EMAs
  const fastEMA = calculateEMA(closes, fastPeriod)
  const slowEMA = calculateEMA(closes, slowPeriod)
  
  // MACD line = fast EMA - slow EMA
  const macdLine: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN)
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }
  }
  
  // Signal line = EMA of MACD line
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod)
  
  // Histogram = MACD - Signal
  const histogram: number[] = []
  let signalIndex = 0
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      histogram.push(NaN)
    } else {
      const signal = signalLine[signalIndex]
      histogram.push(isNaN(signal) ? NaN : macdLine[i] - signal)
      signalIndex++
    }
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  }
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(candles: Candle[], period = 20, stdDev = 2) {
  const closes = candles.map(c => c.close)
  const sma = calculateSMA(closes, period)
  
  const upper: number[] = []
  const lower: number[] = []
  
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(sma[i]) || i < period - 1) {
      upper.push(NaN)
      lower.push(NaN)
      continue
    }
    
    // Calculate standard deviation
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += Math.pow(closes[i - j] - sma[i], 2)
    }
    const std = Math.sqrt(sum / period)
    
    upper.push(sma[i] + (std * stdDev))
    lower.push(sma[i] - (std * stdDev))
  }
  
  return {
    upper,
    middle: sma,
    lower
  }
}

/**
 * Average True Range (ATR) - Volatility indicator
 */
export function calculateATR(candles: Candle[], period = 14): number[] {
  const atr: number[] = []
  const trueRanges: number[] = []
  
  // Calculate True Range for each candle
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high
    const low = candles[i].low
    const prevClose = candles[i - 1].close
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    
    trueRanges.push(tr)
  }
  
  // Calculate ATR (SMA of True Range)
  const atrValues = calculateSMA(trueRanges, period)
  
  // Add NaN for first candle
  return [NaN, ...atrValues]
}

/**
 * Volume-Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = []
  let cumulativePriceVolume = 0
  let cumulativeVolume = 0
  
  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3
    const volume = candles[i].volume || 0
    
    cumulativePriceVolume += typicalPrice * volume
    cumulativeVolume += volume
    
    vwap.push(cumulativeVolume === 0 ? NaN : cumulativePriceVolume / cumulativeVolume)
  }
  
  return vwap
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3) {
  const k: number[] = []
  
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN)
      continue
    }
    
    // Get highest high and lowest low in period
    let highest = -Infinity
    let lowest = Infinity
    
    for (let j = 0; j < kPeriod; j++) {
      const idx = i - j
      highest = Math.max(highest, candles[idx].high)
      lowest = Math.min(lowest, candles[idx].low)
    }
    
    const close = candles[i].close
    const kValue = ((close - lowest) / (highest - lowest)) * 100
    k.push(isNaN(kValue) ? 50 : kValue)
  }
  
  // %D is SMA of %K
  const d = calculateSMA(k.filter(v => !isNaN(v)), dPeriod)
  
  return { k, d }
}

/**
 * Format indicator data for charting
 */
export function formatIndicatorForChart(
  candles: Candle[],
  indicator: number[],
  indicatorName: string
) {
  return candles.map((candle, i) => ({
    time: candle.time,
    value: indicator[i]
  })).filter(d => !isNaN(d.value))
}

