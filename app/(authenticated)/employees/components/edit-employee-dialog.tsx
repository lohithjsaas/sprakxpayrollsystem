"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Employee {
  id: string
  employee_id: string
  name: string
  daily_wage: number
}

interface EditEmployeeDialogProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function EditEmployeeDialog({ employee, isOpen, onClose, onSuccess }: EditEmployeeDialogProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [name, setName] = useState("")
  const [dailyWage, setDailyWage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (employee) {
      setEmployeeId(employee.employee_id || "")
      setName(employee.name)
      setDailyWage(employee.daily_wage.toString())
    }
  }, [employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employee || !name || !dailyWage) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setDebug(`Updating employee with ID: ${employee.id}`)

    try {
      // Convert dailyWage to a number
      const wage = Number.parseFloat(dailyWage)

      if (isNaN(wage)) {
        throw new Error("Daily wage must be a valid number")
      }

      const updateData: any = {
        name,
        daily_wage: wage,
      }

      // Only include employee_id if it's provided
      if (employeeId.trim()) {
        updateData.employee_id = employeeId.trim()
      }

      setDebug(`Updating employee: ${name} with wage: ${wage} and ID: ${employeeId}`)

      const { data, error: updateError } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", employee.id)
        .select()

      if (updateError) {
        throw updateError
      }

      setDebug(`Employee updated successfully: ${JSON.stringify(data)}`)

      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "Failed to update employee")
      setDebug(`Error: ${err.message}`)
      console.error("Error updating employee:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-employee-id" className="text-sm font-medium">
              Employee ID
            </label>
            <Input
              id="edit-employee-id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. SPX001"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-name" className="text-sm font-medium">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter employee name"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-dailyWage" className="text-sm font-medium">
              Daily Wage (INR) <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-dailyWage"
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

