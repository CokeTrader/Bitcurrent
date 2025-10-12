"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell } from "lucide-react"
import { toast } from "sonner"

interface PriceAlertModalProps {
  symbol: string
  currentPrice: number
}

export function PriceAlertModal({ symbol, currentPrice }: PriceAlertModalProps) {
  const [targetPrice, setTargetPrice] = useState("")
  const [direction, setDirection] = useState<"above" | "below">("above")
  const [open, setOpen] = useState(false)

  const handleCreateAlert = () => {
    const price = parseFloat(targetPrice)
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price")
      return
    }

    // TODO: Connect to API to create alert
    toast.success(`Alert created! You'll be notified when ${symbol} goes ${direction} £${price}`)
    setOpen(false)
    setTargetPrice("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Set Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Price Alert for {symbol}</DialogTitle>
          <DialogDescription>
            Get notified when {symbol} reaches your target price
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Current Price</Label>
            <div className="text-2xl font-bold font-mono">
              £{currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <Label>Alert When Price Goes</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant={direction === "above" ? "default" : "outline"}
                onClick={() => setDirection("above")}
              >
                Above
              </Button>
              <Button
                variant={direction === "below" ? "default" : "outline"}
                onClick={() => setDirection("below")}
              >
                Below
              </Button>
            </div>
          </div>

          <div>
            <Label>Target Price (GBP)</Label>
            <Input
              type="number"
              placeholder="£50,000"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="text-lg font-mono mt-2"
            />
          </div>

          <Button onClick={handleCreateAlert} className="w-full">
            Create Alert
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You'll receive an email when the alert triggers
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

