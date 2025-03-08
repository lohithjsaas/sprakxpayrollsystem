"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetupDatabase = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/setup-database")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to set up database")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error setting up database:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Set Up Database and Seed Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">This will:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Create tables in the public schema</li>
              <li>Set up Row Level Security (RLS) policies</li>
              <li>Seed employee data for Monirul and Mansoor</li>
              <li>Add attendance records for March 1-4, 2025</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">Warning</h3>
            <p>
              This will delete any existing data in the employees and attendance tables. Only proceed if you want to
              reset your database to a clean state.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Data to be added:</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-3">
                <p>
                  <strong>Employee Name:</strong> Monirul
                </p>
                <p>
                  <strong>Daily Wage:</strong> INR 650
                </p>
                <p>
                  <strong>Attendance:</strong> Present from March 1st to 4th, 2025
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-3">
                <p>
                  <strong>Employee Name:</strong> Mansoor
                </p>
                <p>
                  <strong>Daily Wage:</strong> INR 500
                </p>
                <p>
                  <strong>Attendance:</strong> Present on March 1st, 2nd, 3rd, 2025. Absent on March 4th, 2025
                </p>
              </div>
            </div>
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
              <div className="mt-2">
                <pre className="text-xs overflow-auto bg-green-100 p-2 rounded">
                  {JSON.stringify(result.results, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleSetupDatabase} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Setting Up Database..." : "Set Up Database and Seed Data"}
          </Button>

          <div className="space-x-2">
            <Link href="/">
              <Button variant="outline">Back to Login</Button>
            </Link>
            {result && (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

