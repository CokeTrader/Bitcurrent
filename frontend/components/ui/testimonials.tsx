"use client"

import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

interface Testimonial {
  name: string
  role: string
  content: string
  rating: number
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    name: "Michael Chen",
    role: "Day Trader",
    content: "Switched from Coinbase and saving £200/month on fees. BitCurrent's interface is clean and trades execute instantly. Best UK crypto platform hands down.",
    rating: 5,
    avatar: "MC"
  },
  {
    name: "Sarah Williams",
    role: "First-time Investor",
    content: "As a beginner, I was worried about fees eating my profits. BitCurrent's 0.25% fee vs Coinbase's 1.49% makes a huge difference. Plus the £10 bonus got me started!",
    rating: 5,
    avatar: "SW"
  },
  {
    name: "James Thompson",
    role: "Long-term Holder",
    content: "Been using BitCurrent for 6 months. Zero issues. Deposits are instant via Stripe, customer support actually responds, and the fees are unbeatable.",
    rating: 5,
    avatar: "JT"
  },
  {
    name: "Emma Davis",
    role: "Active Trader",
    content: "I trade daily and fees add up fast. BitCurrent saves me about £15 per £1000 trade compared to competitors. Over a month, that's significant savings.",
    rating: 5,
    avatar: "ED"
  },
  {
    name: "David Miller",
    role: "Portfolio Manager",
    content: "Managing multiple crypto portfolios for clients. BitCurrent's low fees mean more profit for clients. The platform is reliable and professional.",
    rating: 5,
    avatar: "DM"
  },
  {
    name: "Lisa Anderson",
    role: "Part-time Investor",
    content: "Love the price alerts feature. Got notified when BTC hit my target and bought instantly. Made £500 profit thanks to perfect timing!",
    rating: 5,
    avatar: "LA"
  }
]

export function Testimonials() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Trusted by UK Traders</h2>
          <p className="text-xl text-muted-foreground">
            See what our users say about switching to BitCurrent
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground">{testimonial.content}</p>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-lg font-semibold">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span>4.9/5</span>
            <span className="text-muted-foreground font-normal">from 200+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  )
}

