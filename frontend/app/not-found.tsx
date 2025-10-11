import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold mb-2 font-display">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/markets">
            <Button size="lg" variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Markets
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Popular pages:
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            <Link href="/markets" className="text-sm text-primary hover:underline">
              Markets
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/trade/BTC-GBP" className="text-sm text-primary hover:underline">
              Trade
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/staking" className="text-sm text-primary hover:underline">
              Staking
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}






