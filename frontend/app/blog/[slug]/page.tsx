import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPostBySlug, getRecentPosts, type BlogPost } from "@/lib/blog-posts"
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Share2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | BitCurrent Blog`,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://bitcurrent.co.uk/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
    },
    alternates: {
      canonical: `https://bitcurrent.co.uk/blog/${post.slug}`,
    },
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug)
  const recentPosts = getRecentPosts(3).filter(p => p.slug !== params.slug)

  if (!post) {
    notFound()
  }

  // Article schema for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description,
    "author": {
      "@type": "Organization",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "BitCurrent Exchange",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bitcurrent.co.uk/favicon.ico"
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://bitcurrent.co.uk/blog/${post.slug}`
    }
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://bitcurrent.co.uk"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://bitcurrent.co.uk/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://bitcurrent.co.uk/blog/${post.slug}`
      }
    ]
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Article Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            {post.category}
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-display">
            {post.title}
          </h1>

          <p className="text-xl text-muted-foreground mb-6">
            {post.description}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} min read</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-12">
          <div className="blog-content">
            {post.content.split('\n').map((paragraph, index) => {
              if (paragraph.trim().startsWith('#')) {
                const level = paragraph.match(/^#+/)?.[0].length || 1
                const text = paragraph.replace(/^#+\s*/, '')
                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
                return <HeadingTag key={index} className="font-display">{text}</HeadingTag>
              } else if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
                return <p key={index} className="font-semibold">{paragraph.replace(/\*\*/g, '')}</p>
              } else if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*')) {
                return null // Will be handled by markdown parser
              } else if (paragraph.trim()) {
                return <p key={index} className="text-muted-foreground leading-relaxed">{paragraph}</p>
              }
              return null
            })}
          </div>
        </div>

        {/* Article Footer - CTA */}
        <div>
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-success/5 mb-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Start Trading?</h3>
              <p className="text-muted-foreground mb-6">
                Join BitCurrent and put your knowledge into practice. Trade with confidence on the UK's premier crypto exchange.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Related Articles */}
        {recentPosts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                  <Card className="p-6 h-full hover:shadow-lg transition-all group cursor-pointer">
                    <Badge variant="outline" className="mb-3">
                      {relatedPost.category}
                    </Badge>
                    <h3 className="font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {relatedPost.description}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      {relatedPost.readTime} min read
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

