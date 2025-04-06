'use client'; // Required for Auth0Provider

// import type { Metadata } from "next"; // Commented out
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Auth0Provider } from "@auth0/auth0-react"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

// Commented out Metadata export as it's not allowed in client components
// export const metadata: Metadata = {
//   generator: 'v0.dev'
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get Auth0 configuration from environment variables
  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "dev-nh73t7m51ufsuud2.us.auth0.com";
  const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "ZRhsytA4WIgbkSrnSSQ6rl4GHfhjkRaC";
  const auth0Audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || "http://studygeniusapi";

  // Safely get the redirect URI only on the client-side
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : '';
  
  const onRedirectCallback = (appState: any) => {
    // Navigate to the intended page after login
    if (appState?.returnTo) {
      window.location.href = appState.returnTo;
    } else {
      // If no specific page was requested, redirect to study page after login
      window.location.href = window.location.origin + '/study';
    }
  };

  console.log("Auth0 Config:", { 
    domain: auth0Domain,
    clientId: auth0ClientId,
    audience: auth0Audience 
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Auth0Provider
          domain={auth0Domain}
          clientId={auth0ClientId}
          authorizationParams={{
            redirect_uri: redirectUri, 
            audience: auth0Audience,
          }}
          onRedirectCallback={onRedirectCallback}
          useRefreshTokens={true}
          cacheLocation="localstorage"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  )
}

import './globals.css'
