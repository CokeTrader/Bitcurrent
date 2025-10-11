// Analytics and monitoring setup

interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export function trackEvent({ event, category, action, label, value }: AnalyticsEvent) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
  
  // Also log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', { event, category, action, label, value })
  }
}

// Predefined event trackers
export const analytics = {
  // Authentication events
  signup: () => trackEvent({
    event: 'signup',
    category: 'Auth',
    action: 'signup_completed',
  }),
  
  login: () => trackEvent({
    event: 'login',
    category: 'Auth',
    action: 'login_completed',
  }),
  
  logout: () => trackEvent({
    event: 'logout',
    category: 'Auth',
    action: 'logout',
  }),

  // Trading events
  tradeInitiated: (symbol: string, side: 'buy' | 'sell', amount: number) => trackEvent({
    event: 'trade_initiated',
    category: 'Trading',
    action: `trade_${side}`,
    label: symbol,
    value: amount,
  }),
  
  orderPlaced: (symbol: string, type: string) => trackEvent({
    event: 'order_placed',
    category: 'Trading',
    action: 'order_placed',
    label: `${symbol}_${type}`,
  }),

  // Staking events
  stakeInitiated: (asset: string, amount: number) => trackEvent({
    event: 'stake_initiated',
    category: 'Staking',
    action: 'stake',
    label: asset,
    value: amount,
  }),
  
  rewardsClaimed: (asset: string, amount: number) => trackEvent({
    event: 'rewards_claimed',
    category: 'Staking',
    action: 'claim_rewards',
    label: asset,
    value: amount,
  }),

  // Web3 events
  walletConnected: (walletType: string) => trackEvent({
    event: 'wallet_connected',
    category: 'Web3',
    action: 'wallet_connected',
    label: walletType,
  }),
  
  chainSwitched: (chainId: number) => trackEvent({
    event: 'chain_switched',
    category: 'Web3',
    action: 'chain_switched',
    label: `chain_${chainId}`,
  }),

  // User engagement
  pageView: (page: string) => {
    trackPageView(page)
    trackEvent({
      event: 'page_view',
      category: 'Engagement',
      action: 'page_view',
      label: page,
    })
  },
  
  featureUsed: (feature: string) => trackEvent({
    event: 'feature_used',
    category: 'Engagement',
    action: 'feature_used',
    label: feature,
  }),

  // Conversion funnel
  signupStarted: () => trackEvent({
    event: 'signup_started',
    category: 'Conversion',
    action: 'signup_started',
  }),
  
  signupStep: (step: number) => trackEvent({
    event: 'signup_step',
    category: 'Conversion',
    action: 'signup_step',
    label: `step_${step}`,
  }),

  firstTradeCompleted: () => trackEvent({
    event: 'first_trade',
    category: 'Conversion',
    action: 'first_trade_completed',
  }),
}

// Error tracking (would integrate with Sentry in production)
export function trackError(error: Error, context?: Record<string, any>) {
  console.error('Error tracked:', error, context)
  
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      extra: context,
    })
  }
}






