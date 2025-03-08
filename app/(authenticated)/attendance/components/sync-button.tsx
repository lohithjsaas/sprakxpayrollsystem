"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SyncAttendanceButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const date = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/sync-attendance?date=${date}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to sync attendance")
      }

      setResult(data)

      // Refresh the page to show updated data
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error syncing attendance:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleSync} disabled={loading} variant="outline" className="w-full">
        {loading ? "Syncing..." : "Sync Attendance Data"}
      </Button>

      {error && <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">{error}</div>}

      {result && (
        <div className="bg-green-50 text-green-600 p-2 rounded-md text-sm">
          {result.message}
          {result.employeeCount && (
            <span className="block mt-1">
              Synced {result.employeeCount} employees for {result.date}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

