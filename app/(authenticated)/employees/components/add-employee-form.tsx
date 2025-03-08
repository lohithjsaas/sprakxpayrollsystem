"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function AddEmployeeForm() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState("")
  const [name, setName] = useState("")
  const [dailyWage, setDailyWage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const generateEmployeeId = async () => {
    try {
      // Get the highest current employee_id
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id")
        .not("employee_id", "is", null)
        .order("employee_id", { ascending: false })
        .limit(1)

      if (error) throw error

      let nextId = 1
      if (data && data.length > 0 && data[0].employee_id) {
        // Extract the number from SPXxxx format
        const match = data[0].employee_id.match(/SPX(\d+)/)
        if (match && match[1]) {
          nextId = Number.parseInt(match[1], 10) + 1
        }
      }

      // Format with leading zeros (SPX001, SPX002, etc.)
      return `SPX${nextId.toString().padStart(3, "0")}`
    } catch (err) {
      console.error("Error generating employee ID:", err)
      return ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !dailyWage) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setDebug("Submitting employee data...")

    try {
      // Convert dailyWage to a number
      const wage = Number.parseFloat(dailyWage)

      if (isNaN(wage)) {
        throw new Error("Daily wage must be a valid number")
      }

      // Generate employee_id if not provided
      let finalEmployeeId = employeeId.trim()
      if (!finalEmployeeId) {
        finalEmployeeId = await generateEmployeeId()
        if (!finalEmployeeId) {
          throw new Error("Failed to generate employee ID")
        }
      }

      const employeeData = {
        employee_id: finalEmployeeId,
        name,
        daily_wage: wage,
      }

      setDebug(`Inserting employee: ${name} with wage: ${wage} and ID: ${finalEmployeeId}`)

      const { data, error: insertError } = await supabase.from("employees").insert([employeeData]).select()

      if (insertError) {
        throw insertError
      }

      setDebug(`Employee added successfully: ${JSON.stringify(data)}`)

      setEmployeeId("")
      setName("")
      setDailyWage("")
      setIsFormOpen(false)

      // Refresh the page to show the new employee
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to add employee")
      setDebug(`Error: ${err.message}`)
      console.error("Error adding employee:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isFormOpen) {
    return <Button onClick={() => setIsFormOpen(true)}>Add Employee</Button>
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add New Employee</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="employee-id" className="text-sm font-medium">
              Employee ID
            </label>
            <Input
              id="employee-id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. SPX003"
            />
            <p className="text-xs text-gray-500">Leave blank to auto-generate (SPXxxx format)</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter employee name"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dailyWage" className="text-sm font-medium">
              Daily Wage (INR) <span className="text-red-500">*</span>
            </label>
            <Input
              id="dailyWage"
              type="number"
              value={dailyWage}
              onChange={(e) => setDailyWage(e.target.value)}
              placeholder="Enter daily wage"
              required
              min="1"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          {debug && (
            <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
              <strong>Debug:</strong> {debug}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Employee"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

