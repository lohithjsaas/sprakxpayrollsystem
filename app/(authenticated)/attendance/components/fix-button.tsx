"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function FixAttendanceButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFix = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/fix-attendance-ids")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fix attendance IDs")
      }

      setResult(data)

      // Refresh the page to show updated data
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error fixing attendance IDs:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleFix} disabled={loading} variant="outline" className="w-full">
        {loading ? "Fixing..." : "Fix Attendance IDs"}
      </Button>

      {error && <div className="bg-red-50 text-red-600 p-2 rounded-md text-sm">{error}</div>}

      {result && (
        <div className="bg-green-50 text-green-600 p-2 rounded-md text-sm">
          {result.message}
          {result.invalidCount !== undefined && (
            <span className="block mt-1">
              Fixed {result.invalidCount} invalid records out of {result.attendanceCount} total records
            </span>
          )}
        </div>
      )}
    </div>
  )
}

