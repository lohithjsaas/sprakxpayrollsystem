import { headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DebugPage() {
  const supabase = createClient()

  // Get session info
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  // Get cookies
  const cookieHeader = headers().get("cookie") || ""
  const cookies = cookieHeader.split(";").map((cookie) => {
    const [name, value] = cookie.trim().split("=")
    return { name, value }
  })

  // Check database connection
  let dbStatus = "Unknown"
  let employeesCount = 0
  let employeesError = null

  try {
    const { data, error } = await supabase.from("employees").select("count")
    if (error) {
      throw error
    }
    dbStatus = "Connected"
    employeesCount = data[0]?.count || 0
  } catch (error: any) {
    dbStatus = "Error"
    employeesError = error.message
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Debug Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Authenticated:</strong> {session ? "Yes" : "No"}
            </p>
            {session && (
              <>
                <p>
                  <strong>User ID:</strong> {session.user.id}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
                <p>
                  <strong>Created At:</strong> {new Date(session.user.created_at).toLocaleString()}
                </p>
              </>
            )}
            {sessionError && (
              <p className="text-red-500">
                <strong>Error:</strong> {sessionError.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong> {dbStatus}
            </p>
            <p>
              <strong>Employees Count:</strong> {employeesCount}
            </p>
            {employeesError && (
              <p className="text-red-500">
                <strong>Error:</strong> {employeesError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(cookies, null, 2)}</pre>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/">
          <Button variant="outline">Back to Login</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/api/dev-login">
          <Button variant="secondary">Force Login</Button>
        </Link>
      </div>
    </div>
  )
}

