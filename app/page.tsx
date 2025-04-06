import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/hero-section"
import { FeatureSection } from "@/components/feature-section"

export const metadata: Metadata = {
  title: "StudyGenius - Transform Your Lecture Materials into Flashcards",
  description: "Upload your lecture materials and generate flashcards to study more effectively.",
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />

        <section className="py-12 md:py-24 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to start studying smarter?
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Create your first study set in minutes and improve your learning efficiency.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/create">
                  <Button size="lg" className="h-12 px-8">
                    Create Study Set
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

