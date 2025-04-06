import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row md:py-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="text-lg font-bold">StudyGenius</span>
        </div>
        <nav className="flex gap-4 sm:gap-6">
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} StudyGenius. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

