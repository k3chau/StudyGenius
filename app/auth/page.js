"use client";

import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";

export default function AuthPage() {
  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-6 py-12">
      <h1 className="text-3xl font-bold">Auth0 Login</h1>
      <div className="flex gap-4">
        <LoginButton />
        <LogoutButton />
      </div>
    </main>
  );
} 