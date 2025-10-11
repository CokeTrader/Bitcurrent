"use client"

import * as React from "react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  LogOut
} from "lucide-react"
import { getChainInfo } from "@/lib/web3/config"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface WalletConnectProps {
  className?: string
  showBalance?: boolean
  variant?: "button" | "card"
}

export function WalletConnect({ 
  className, 
  showBalance = true,
  variant = "button" 
}: WalletConnectProps) {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = React.useState(false)

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success("Address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (value?: string, decimals: number = 4) => {
    if (!value) return "0.0000"
    const num = parseFloat(value)
    return num.toFixed(decimals)
  }

  const chainInfo = chain ? getChainInfo(chain.id) : null

  // Card variant - expanded view
  if (variant === "card" && isConnected && address) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Connected Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {chainInfo?.name || 'Unknown Chain'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="h-2 w-2 rounded-full bg-success mr-2" />
              Connected
            </Badge>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <code className="flex-1 text-sm font-mono">{formatAddress(address)}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="h-auto p-2"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-auto p-2"
            >
              <a
                href={`${chainInfo?.explorer}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Balance */}
          {showBalance && balance && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="text-2xl font-bold font-mono">
                {formatBalance(balance.formatted)} {balance.symbol}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ £{(parseFloat(balance.formatted) * 2000).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Chain Badge */}
          {chainInfo && (
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{chainInfo.icon}</span>
                <div>
                  <p className="text-sm font-medium">{chainInfo.name}</p>
                  <p className="text-xs text-muted-foreground">Chain ID: {chain?.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <ConnectButton.Custom>
              {({ openChainModal }) => (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={openChainModal}
                >
                  Switch Chain
                </Button>
              )}
            </ConnectButton.Custom>
            <Button
              variant="ghost"
              className="flex-1 text-danger hover:text-danger"
              onClick={() => disconnect()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Button variant - compact view
  return (
    <div className={cn("", className)}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted
          const connected = ready && account && chain

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button
                      onClick={openConnectModal}
                      size="lg"
                      className="gap-2"
                    >
                      <Wallet className="h-5 w-5" />
                      Connect Wallet
                    </Button>
                  )
                }

                if (chain.unsupported) {
                  return (
                    <Button
                      onClick={openChainModal}
                      variant="destructive"
                      size="lg"
                      className="gap-2"
                    >
                      <AlertCircle className="h-5 w-5" />
                      Wrong Network
                    </Button>
                  )
                }

                return (
                  <div className="flex items-center gap-2">
                    {/* Chain Button */}
                    <Button
                      onClick={openChainModal}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      {chain.hasIcon && (
                        <div
                          className="h-5 w-5 rounded-full overflow-hidden"
                          style={{ background: chain.iconBackground }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              className="h-5 w-5"
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    {/* Account Button */}
                    <Button
                      onClick={openAccountModal}
                      size="lg"
                      className="gap-2"
                    >
                      {showBalance && balance && (
                        <span className="font-mono">
                          {formatBalance(balance.formatted, 2)} {balance.symbol}
                        </span>
                      )}
                      <span className="font-mono">{formatAddress(account.address)}</span>
                    </Button>
                  </div>
                )
              })()}
            </div>
          )
        }}
      </ConnectButton.Custom>
    </div>
  )
}









