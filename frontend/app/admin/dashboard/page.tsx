'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCcw
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalVolume: number
  totalOrders: number
  failedOrders: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  recentErrors: Array<{
    id: string
    message: string
    timestamp: string
    severity: string
  }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchDashboardStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [router])

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/v1/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 403) {
        setError('Admin access required')
      } else {
        setError('Failed to fetch dashboard stats')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardStats()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const healthColor = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }[stats?.systemHealth || 'healthy']

  const healthBg = {
    healthy: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200'
  }[stats?.systemHealth || 'healthy']

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Real-time platform monitoring</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health */}
      <Card className={`mb-6 ${healthBg}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${healthColor}`}>
            <Activity className="h-5 w-5" />
            System Status: {stats?.systemHealth?.toUpperCase()}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{((stats?.totalVolume || 0) / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedOrders || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalOrders 
                ? ((1 - (stats.failedOrders / stats.totalOrders)) * 100).toFixed(1)
                : 100}%
            </div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Excellent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Errors & Alerts
          </CardTitle>
          <CardDescription>
            Last 24 hours of system errors and warnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentErrors && stats.recentErrors.length > 0 ? (
            <div className="space-y-3">
              {stats.recentErrors.map((err) => (
                <Alert key={err.id} variant={err.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertDescription className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{err.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(err.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-background">
                      {err.severity}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No errors or alerts in the last 24 hours
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Button variant="outline" onClick={() => router.push('/admin/users')}>
          Manage Users
        </Button>
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          View All Orders
        </Button>
        <Button variant="outline" onClick={() => router.push('/admin/settings')}>
          System Settings
        </Button>
      </div>
    </div>
  )
}


