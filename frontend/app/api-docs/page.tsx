"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Code, Copy, Check } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function APIDocsPage() {
  const [copied, setCopied] = useState("")

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
  }

  const endpoints = [
    {
      method: "GET",
      path: "/markets",
      description: "Get all tradeable crypto pairs",
      auth: false,
      example: `curl https://bitcurrent-production.up.railway.app/api/v1/markets`
    },
    {
      method: "GET",
      path: "/markets/{symbol}/quote",
      description: "Get real-time price for symbol",
      auth: false,
      example: `curl https://bitcurrent-production.up.railway.app/api/v1/markets/BTC-GBP/quote`
    },
    {
      method: "POST",
      path: "/auth/register",
      description: "Create new account",
      auth: false,
      example: `curl -X POST https://bitcurrent-production.up.railway.app/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"SecurePass123"}'`
    },
    {
      method: "POST",
      path: "/orders",
      description: "Place new trade order",
      auth: true,
      example: `curl -X POST https://bitcurrent-production.up.railway.app/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-API-Secret: YOUR_API_SECRET" \\
  -d '{"symbol":"BTC-GBP","side":"buy","quantity":0.001,"type":"market"}'`
    },
    {
      method: "GET",
      path: "/balance",
      description: "Get account balances",
      auth: true,
      example: `curl https://bitcurrent-production.up.railway.app/api/v1/balance \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "X-API-Secret: YOUR_API_SECRET"`
    },
    {
      method: "GET",
      path: "/staking/pools",
      description: "Get staking options",
      auth: false,
      example: `curl https://bitcurrent-production.up.railway.app/api/v1/staking/pools`
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">API Documentation</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Build trading bots, integrate BitCurrent into your app, or automate your trading
            </p>
            <div className="flex gap-3">
              <Badge variant="outline">REST API</Badge>
              <Badge variant="outline">WebSocket</Badge>
              <Badge variant="outline">Rate Limited</Badge>
            </div>
          </div>

          {/* Getting Started */}
          <Card className="p-8 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <ol className="space-y-3 list-decimal list-inside">
              <li>Create a BitCurrent account</li>
              <li>Go to Dashboard → API Keys</li>
              <li>Generate new API key with appropriate permissions</li>
              <li>Use key ID + secret in API requests</li>
            </ol>
          </Card>

          {/* Authentication */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <p className="text-muted-foreground mb-4">
              BitCurrent API supports two authentication methods:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Method 1: API Keys (Recommended for bots)</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`X-API-Key: BC1234567890abcdef...
X-API-Secret: your_secret_key_here`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">Method 2: JWT Token (For web apps)</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                </pre>
              </div>
            </div>
          </Card>

          {/* Endpoints */}
          <h2 className="text-3xl font-bold mb-6">API Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Badge className={endpoint.method === 'GET' ? 'bg-blue-600' : 'bg-green-600'}>
                    {endpoint.method}
                  </Badge>
                  <div className="flex-1">
                    <code className="text-lg font-mono">{endpoint.path}</code>
                    <p className="text-muted-foreground mt-1">{endpoint.description}</p>
                    {endpoint.auth && (
                      <Badge variant="outline" className="mt-2">
                        🔒 Authentication Required
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Example Request:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(endpoint.example, `ex-${idx}`)}
                    >
                      {copied === `ex-${idx}` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-black text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                    {endpoint.example}
                  </pre>
                </div>
              </Card>
            ))}
          </div>

          {/* Rate Limits */}
          <Card className="p-8 mt-8">
            <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-2">General API</h3>
                <p className="text-muted-foreground">100 requests / 15 minutes</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Trading API</h3>
                <p className="text-muted-foreground">30 orders / minute</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Authentication</h3>
                <p className="text-muted-foreground">5 attempts / 15 minutes</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Financial</h3>
                <p className="text-muted-foreground">10 transactions / hour</p>
              </div>
            </div>
          </Card>

          {/* WebSocket */}
          <Card className="p-8 mt-8">
            <h2 className="text-2xl font-bold mb-4">WebSocket Real-Time Data</h2>
            <p className="text-muted-foreground mb-4">
              Connect to our WebSocket server for real-time price updates:
            </p>
            <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
{`const ws = new WebSocket('wss://bitcurrent-production.up.railway.app/ws');

ws.on('open', () => {
  // Subscribe to symbols
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbols: ['BTC-GBP', 'ETH-GBP']
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Prices:', msg.data);
});`}
            </pre>
          </Card>

          {/* CTA */}
          <Card className="p-8 mt-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
            <p className="mb-6">Create your API keys and start trading programmatically</p>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Generate API Keys →
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}


