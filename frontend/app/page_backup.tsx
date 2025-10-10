import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <h1>Test Page</h1>
      <Link href="/markets">Markets</Link>
    </div>
  )
}



