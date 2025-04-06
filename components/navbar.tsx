"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/ui/mode-toggle"

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check authentication status when component mounts
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/');
      const text = await response.text();
      setIsLoggedIn(text.includes('Logged in'));
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }

  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/login';
  }

  const handleLogout = () => {
    window.location.href = 'http://localhost:3001/logout';
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
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Login
              </button>
            )}
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

