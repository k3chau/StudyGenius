import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export function Navbar() {
  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="text-lg font-bold">StudyGenius</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
            Home
          </Link>
          <Link href="/create" className="text-sm font-medium hover:underline underline-offset-4">
            Create
          </Link>
          <Link href="/study" className="text-sm font-medium hover:underline underline-offset-4">
            Study
          </Link>
        </nav>
        <div className="ml-4">
          <Link href="/create">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

