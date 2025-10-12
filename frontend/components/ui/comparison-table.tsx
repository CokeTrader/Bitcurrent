"use client"

import { Card } from "./card"
import { Check, X } from "lucide-react"
import { Button } from "./button"
import Link from "next/link"

export function ComparisonTable() {
  const features = [
    { feature: "Trading Fee", bitcurrent: "0.25%", coinbase: "1.49%", binance: "0.50%", kraken: "0.26%" },
    { feature: "Deposit Fee", bitcurrent: "Free", coinbase: "Free", binance: "1.8%", kraken: "Free" },
    { feature: "Withdrawal Fee", bitcurrent: "Free", coinbase: "£0.15", binance: "Variable", kraken: "£1.20" },
    { feature: "Min. Deposit", bitcurrent: "£10", coinbase: "£2", binance: "£15", kraken: "£1" },
    { feature: "Instant GBP Deposits", bitcurrent: true, coinbase: false, binance: false, kraken: false },
    { feature: "Signup Bonus", bitcurrent: "£10", coinbase: "£0", binance: "£0", kraken: "£0" },
    { feature: "Staking", bitcurrent: true, coinbase: true, binance: true, kraken: true },
    { feature: "API Access", bitcurrent: true, coinbase: true, binance: true, kraken: true },
    { feature: "24/7 Support", bitcurrent: true, coinbase: false, binance: false, kraken: false },
    { feature: "UK-Based", bitcurrent: true, coinbase: false, binance: false, kraken: false }
  ]

  const renderCell = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-red-600 mx-auto" />
      )
    }
    return <span className="font-mono">{value}</span>
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-bold">Feature</th>
            <th className="text-center p-4 font-bold bg-green-50 dark:bg-green-950/20">
              <div>BitCurrent</div>
              <div className="text-xs font-normal text-green-600">Best Value</div>
            </th>
            <th className="text-center p-4 font-bold">Coinbase</th>
            <th className="text-center p-4 font-bold">Binance</th>
            <th className="text-center p-4 font-bold">Kraken</th>
          </tr>
        </thead>
        <tbody>
          {features.map((row, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-4 font-medium">{row.feature}</td>
              <td className="p-4 text-center bg-green-50 dark:bg-green-950/20 font-semibold">
                {renderCell(row.bitcurrent)}
              </td>
              <td className="p-4 text-center">{renderCell(row.coinbase)}</td>
              <td className="p-4 text-center">{renderCell(row.binance)}</td>
              <td className="p-4 text-center">{renderCell(row.kraken)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="p-6 text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <p className="font-semibold mb-4">Ready to switch to the better platform?</p>
        <Link href="/auth/register">
          <Button size="lg">
            Get £10 Free - Start Trading →
          </Button>
        </Link>
      </div>
    </Card>
  )
}

