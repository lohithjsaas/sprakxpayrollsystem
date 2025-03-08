"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeedData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/seed-data")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to seed data")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error seeding data:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Seed Employee and Attendance Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button onClick={handleSeedData} disabled={loading}>
            {loading ? "Adding Data..." : "Add This Data"}
          </Button>

          <div className="space-x-2">
            <Link href="/employees">
              <Button variant="outline">View Employees</Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline">View Attendance</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

