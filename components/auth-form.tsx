"use client"

import type React from "react"

import { CardFooter } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthForm() {
  const [email, setEmail] = useState("prabhuabhi.m@gmail.com")
  const [password, setPassword] = useState("Admin@123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setDebugInfo("Session found, redirecting to dashboard...")
        router.push("/dashboard")
      }
    }

    checkSession()
  }, [router, supabase]) // Added supabase to dependencies

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowConfirmationMessage(false)
    setDebugInfo("Attempting to sign in...")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check if the error is about email confirmation
        if (error.message.includes("Email not confirmed")) {
          setShowConfirmationMessage(true)
          throw new Error(
            "Email not confirmed. Please check your email for a confirmation link or confirm the user in the Supabase dashboard.",
          )
        }
        throw error
      }

      setDebugInfo(`Sign in successful! User: ${data.user?.id}. Redirecting...`)

      // Use router.push instead of router.refresh
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to sign in")
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        throw error
      }

      alert("Confirmation email resent. Please check your inbox.")
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDirectLogin = async () => {
    setLoading(true)
    setDebugInfo("Attempting direct login via API...")

    try {
      const response = await fetch(
        `/api/dev-login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      )
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to login")
      }

      setDebugInfo(`API login successful! Redirecting to ${data.redirectTo}...`)
      router.push(data.redirectTo || "/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to login via API")
      setDebugInfo(`API Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>SparkX Auto Detailers</CardTitle>
        <CardDescription>Sign in to manage employee attendance & payroll</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
              {showConfirmationMessage && (
                <div className="mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleResendConfirmation}>
                    Resend confirmation email
                  </Button>
                </div>
              )}
            </div>
          )}

          {debugInfo && (
            <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
              <strong>Debug:</strong> {debugInfo}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button onClick={handleSignIn} disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <Button type="button" variant="outline" onClick={handleDirectLogin} disabled={loading} className="w-full">
          Login via API (Bypass Email Confirmation)
        </Button>
      </CardFooter>
    </Card>
  )
}

