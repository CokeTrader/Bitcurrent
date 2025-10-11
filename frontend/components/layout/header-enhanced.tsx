"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BetaBanner } from "@/components/ui/beta-banner"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  Wallet, 
  LayoutDashboard,
  Settings,
  User,
  Bell,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/trade/BTC-GBP", label: "Trade", icon: TrendingUp },
  { href: "/dashboard", label: "Portfolio", icon: LayoutDashboard, protected: true },
  { href: "/staking", label: "Earn", icon: Wallet, protected: true },
]

export function HeaderEnhanced() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  
  // Mock auth state - will be replaced with real auth
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <BetaBanner />
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-all duration-300",
          isScrolled 
            ? "bg-background/80 backdrop-blur-lg shadow-sm" 
            : "bg-background/60 backdrop-blur-sm"
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-success p-0.5"
            >
              <div className="h-full w-full rounded-xl bg-background flex items-center justify-center">
                <span className="text-2xl font-bold bg-gradient-to-br from-primary to-success bg-clip-text text-transparent">
                  ₿
                </span>
              </div>
            </motion.div>
            <span className="text-2xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-success transition-all">
              BitCurrent
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              const canAccess = !item.protected || isAuthenticated
              
              if (!canAccess) return null
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "gap-2 relative",
                      isActive && "text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger pulse-live" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>
    </>
  )
}









