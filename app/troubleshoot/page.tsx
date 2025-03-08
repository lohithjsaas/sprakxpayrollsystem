"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function TroubleshootPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixPermissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/fix-permissions")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fix permissions")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error fixing permissions:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Common Issues:</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Unable to fetch employees</li>
              <li>Post-login redirect not working</li>
              <li>Debug information showing on dashboard</li>
              <li>Database permission errors</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">Fix Database Permissions</h3>
            <p className="mb-2">
              This will fix Row Level Security (RLS) policies for the employees and attendance tables. It will make the
              policies more permissive to ensure all operations work correctly.
            </p>
            <Button onClick={handleFixPermissions} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
              {loading ? "Fixing Permissions..." : "Fix Database Permissions"}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 text-green-600 p-4 rounded-md">
              <p className="font-medium">Success!</p>
              <p>{result.message}</p>
              {result.employeesCount !== undefined && <p className="mt-1">Employees count: {result.employeesCount}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Login</Button>
          </Link>

          <div className="space-x-2">
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
            <Link href="/seed">
              <Button>Add Sample Data</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

