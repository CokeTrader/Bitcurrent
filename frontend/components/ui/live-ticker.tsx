"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AssetIcon } from "./asset-icon"
import { PriceChange } from "./price-change"
import { useTickerData } from "@/hooks/use-market-data"

export function LiveTicker() {
  const { data: markets, isLoading } = useTickerData()

  if (isLoading || !markets) {
    return (
      <div className="w-full bg-card border-b border-border py-2">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 min-w-[180px]">
                <div className="h-6 w-6 skeleton rounded-full" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Take top 10 markets for ticker and duplicate for infinite scroll
  const tickerMarkets = markets.slice(0, 10)
  const duplicatedMarkets = [...tickerMarkets, ...tickerMarkets, ...tickerMarkets]

  // Calculate animation duration based on number of items (slower = smoother)
  const animationDuration = tickerMarkets.length * 4 // 4 seconds per item

  return (
    <div className="w-full bg-gradient-to-r from-card via-card/95 to-card border-b border-border overflow-hidden relative">
      {/* Fade edges for smooth infinite feel */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-2 relative">
        <motion.div
          className="flex items-center gap-8"
          animate={{
            x: [0, -(tickerMarkets.length * 216)], // 200px width + 16px gap
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: animationDuration,
              ease: "linear",
            },
          }}
        >
          {duplicatedMarkets.map((market, index) => (
            <motion.div
              key={`${market.symbol}-${index}`}
              className="flex items-center gap-3 min-w-[200px] flex-shrink-0 cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <AssetIcon symbol={market.baseAsset} size="sm" />
              </motion.div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {market.baseAsset}
                </span>
                
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`price-${market.price}`}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-mono font-medium"
                  >
                    £{market.price.toLocaleString('en-GB', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </motion.span>
                </AnimatePresence>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`change-${market.change24h}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PriceChange 
                      value={market.change24h} 
                      type="percentage" 
                      size="sm"
                      showArrow={false}
                      animate
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}










