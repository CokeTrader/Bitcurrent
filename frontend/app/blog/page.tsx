"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function BlogPage() {
  const posts = [
    {
      title: "How to Buy Bitcoin in the UK: Complete Beginner's Guide 2025",
      excerpt: "Learn how to buy Bitcoin safely in the UK with our step-by-step guide. Compare fees, security, and get started with just £10.",
      author: "Alex Thompson",
      date: "Oct 12, 2025",
      category: "Guides",
      readTime: "8 min read",
      slug: "how-to-buy-bitcoin-uk-2025"
    },
    {
      title: "BitCurrent vs Coinbase: Which is Better for UK Traders?",
      excerpt: "Detailed comparison of BitCurrent and Coinbase. Discover why we're 6x cheaper and what features matter most for UK crypto investors.",
      author: "Sarah Chen",
      date: "Oct 11, 2025",
      category: "Comparisons",
      readTime: "6 min read",
      slug: "bitcurrent-vs-coinbase-uk"
    },
    {
      title: "Understanding Crypto Trading Fees: A Complete Breakdown",
      excerpt: "Trading fees can eat into your profits. Learn how BitCurrent's 0.25% fee compares to competitors and how much you could save.",
      author: "James Wilson",
      date: "Oct 10, 2025",
      category: "Education",
      readTime: "5 min read",
      slug: "understanding-crypto-trading-fees"
    },
    {
      title: "5 Crypto Trading Strategies for Beginners in 2025",
      excerpt: "Start trading crypto like a pro with these proven strategies. From DCA to swing trading, learn what works in volatile markets.",
      author: "Alex Thompson",
      date: "Oct 9, 2025",
      category: "Trading",
      readTime: "10 min read",
      slug: "5-crypto-trading-strategies-beginners"
    },
    {
      title: "Is Crypto Staking Worth It? ROI Analysis 2025",
      excerpt: "Earn passive income through crypto staking. We analyze APY rates, risks, and whether staking makes sense for your portfolio.",
      author: "Sarah Chen",
      date: "Oct 8, 2025",
      category: "Staking",
      readTime: "7 min read",
      slug: "is-crypto-staking-worth-it-2025"
    },
    {
      title: "How BitCurrent Keeps Your Crypto Safe: Security Deep Dive",
      excerpt: "95% cold storage, 2FA, bank-grade encryption. Learn about BitCurrent's multi-layered security approach and how your funds are protected.",
      author: "James Wilson",
      date: "Oct 7, 2025",
      category: "Security",
      readTime: "9 min read",
      slug: "bitcurrent-security-deep-dive"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">BitCurrent Blog</h1>
            <p className="text-xl text-muted-foreground">
              Guides, tutorials, and insights for UK crypto traders
            </p>
          </div>

          {/* Featured Post */}
          <Card className="p-8 mb-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <Badge className="mb-4">Featured</Badge>
            <h2 className="text-3xl font-bold mb-4">{posts[0].title}</h2>
            <p className="text-lg text-muted-foreground mb-6">{posts[0].excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {posts[0].author}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {posts[0].date}
              </div>
              <div>{posts[0].readTime}</div>
            </div>
            <Link href={`/blog/${posts[0].slug}`}>
              <Button size="lg">
                Read Article
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>

          {/* All Posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post, idx) => (
              <Link key={idx} href={`/blog/${post.slug}`}>
                <Card className="p-6 h-full hover:shadow-lg transition cursor-pointer">
                  <Badge variant="outline" className="mb-3">{post.category}</Badge>
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div>{post.author}</div>
                    <div>•</div>
                    <div>{post.readTime}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Newsletter CTA */}
          <Card className="p-8 mt-12 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <h2 className="text-2xl font-bold mb-4">Get Crypto Insights Weekly</h2>
            <p className="mb-6">Join 500+ traders receiving our newsletter</p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg text-foreground"
              />
              <Button variant="secondary">Subscribe</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
