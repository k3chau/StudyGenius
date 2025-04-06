"use client"

import Link from "next/link"
import { useAuth0 } from "@auth0/auth0-react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import LoginButton from "./LoginButton"
import LogoutButton from "./LogoutButton"

export function Navbar() {
  const { 
    isAuthenticated, 
    isLoading
  } = useAuth0();

  // Show a simplified navbar while Auth0 is loading
  if (isLoading) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link className="flex items-center space-x-2" href="/">
              <span className="font-bold">StudyGenius</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
             {/* Loading indicator */}
             <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link className="flex items-center space-x-2" href="/">
            <span className="font-bold">StudyGenius</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link
              href="/create"
              className="px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              Create
            </Link>
            <Link
              href="/study"
              className="px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              Study
            </Link>
            
            {/* Auth buttons */}
            <div className="px-4 py-2">
              <LoginButton />
              <LogoutButton />
            </div>
            
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

