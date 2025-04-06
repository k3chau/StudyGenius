"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface EmptyStateProps {
  onCreateNew: () => void
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="container max-w-4xl py-12 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>No Study Set Found</CardTitle>
          <CardDescription>
            You haven't created any study sets yet. Create your first set to start studying.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6">
          <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
            <Image
              src="/images/dashboard.png"
              alt="Student studying with notebook and laptop"
              fill
              className="object-cover"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload your lecture materials and generate flashcards to help you study more effectively.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            If you've deleted all your study sets, you'll need to create a new one to continue.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onCreateNew}>
            Create Study Set
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

