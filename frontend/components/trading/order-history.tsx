"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Download } from "lucide-react"
import { useState } from "react"

interface Order {
  id: string
  symbol: string
  side: "buy" | "sell"
  type: "market" | "limit"
  quantity: number
  price: number
  filled: number
  status: "filled" | "pending" | "cancelled" | "failed"
  fee: number
  total: number
  timestamp: string
}

export function OrderHistory() {
  const [filter, setFilter] = useState<"all" | "filled" | "pending" | "cancelled">("all")
  const [orders] = useState<Order[]>([
    {
      id: "order_001",
      symbol: "BTC-GBP",
      side: "buy",
      type: "market",
      quantity: 0.01,
      price: 60000,
      filled: 0.01,
      status: "filled",
      fee: 1.50,
      total: 601.50,
      timestamp: "2025-10-13 10:30:15"
    },
    {
      id: "order_002",
      symbol: "ETH-GBP",
      side: "sell",
      type: "market",
      quantity: 0.5,
      price: 3200,
      filled: 0.5,
      status: "filled",
      fee: 4.00,
      total: 1596.00,
      timestamp: "2025-10-13 09:15:42"
    },
    {
      id: "order_003",
      symbol: "SOL-GBP",
      side: "buy",
      type: "market",
      quantity: 10,
      price: 150,
      filled: 0,
      status: "pending",
      fee: 0,
      total: 0,
      timestamp: "2025-10-13 11:45:20"
    }
  ])

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "filled":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "cancelled":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      filled: "default",
      pending: "secondary",
      cancelled: "outline",
      failed: "destructive"
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status}
      </Badge>
    )
  }

  const exportCSV = () => {
    const csv = [
      ['Date', 'Symbol', 'Side', 'Quantity', 'Price', 'Fee', 'Total', 'Status'].join(','),
      ...orders.map(o => [
        o.timestamp,
        o.symbol,
        o.side.toUpperCase(),
        o.quantity,
        o.price,
        o.fee,
        o.total,
        o.status
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bitcurrent-orders-${Date.now()}.csv`
    a.click()
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Order History</h3>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "filled", "pending", "cancelled"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f} ({orders.filter(o => f === "all" || o.status === f).length})
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-3 font-semibold">Date/Time</th>
              <th className="pb-3 font-semibold">Pair</th>
              <th className="pb-3 font-semibold">Side</th>
              <th className="pb-3 font-semibold text-right">Quantity</th>
              <th className="pb-3 font-semibold text-right">Price</th>
              <th className="pb-3 font-semibold text-right">Fee</th>
              <th className="pb-3 font-semibold text-right">Total</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/50 transition">
                  <td className="py-3 text-sm">{order.timestamp}</td>
                  <td className="py-3 font-semibold text-sm">{order.symbol}</td>
                  <td className="py-3">
                    <Badge 
                      variant={order.side === "buy" ? "default" : "secondary"}
                      className={order.side === "buy" ? "bg-green-600" : "bg-red-600"}
                    >
                      {order.side.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-right font-mono text-sm">{order.quantity.toFixed(8)}</td>
                  <td className="py-3 text-right font-mono text-sm">£{order.price.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono text-sm">£{order.fee.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono text-sm font-semibold">
                    £{order.total.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Total Fees Paid</div>
            <div className="text-2xl font-bold">
              £{filteredOrders.reduce((sum, o) => sum + o.fee, 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Total Volume</div>
            <div className="text-2xl font-bold">
              £{filteredOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}


