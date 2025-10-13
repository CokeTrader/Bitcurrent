"use client"

import { Card } from "./card"
import { Button } from "./button"
import Link from "next/link"
import { Inbox, TrendingUp, Users, Bell } from "lucide-react"

export function EmptyPortfolio() {
  return (
    <Card className="p-12 text-center">
      <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">No Holdings Yet</h3>
      <p className="text-muted-foreground mb-6">
        Start trading to build your crypto portfolio
      </p>
      <Link href="/markets">
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Browse Markets
        </Button>
      </Link>
    </Card>
  )
}

export function EmptyOrders() {
  return (
    <Card className="p-12 text-center">
      <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
      <p className="text-muted-foreground mb-6">
        Place your first trade to see order history here
      </p>
      <Link href="/trade/BTC-GBP">
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Trade Bitcoin
        </Button>
      </Link>
    </Card>
  )
}

export function EmptyNotifications() {
  return (
    <Card className="p-12 text-center">
      <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">No Notifications</h3>
      <p className="text-muted-foreground mb-6">
        Set price alerts to stay informed about market movements
      </p>
      <Link href="/markets">
        <Button>
          <Bell className="h-4 w-4 mr-2" />
          Set Price Alert
        </Button>
      </Link>
    </Card>
  )
}

export function EmptyReferrals() {
  return (
    <Card className="p-12 text-center">
      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">No Referrals Yet</h3>
      <p className="text-muted-foreground mb-6">
        Invite friends and earn £10 for each verified signup
      </p>
      <Button>
        <Users className="h-4 w-4 mr-2" />
        Share Referral Link
      </Button>
    </Card>
  )
}


