"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditEmployeeDialog } from "./edit-employee-dialog"
import { useRouter } from "next/navigation"

interface Employee {
  id: string
  employee_id: string
  name: string
  daily_wage: number
  created_at: string
}

export function EmployeeList({ employees }: { employees: Employee[] }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      setIsDeleting(true)
      setError(null)
      setDebug(`Deleting employee with ID: ${id}`)

      try {
        const { error: deleteError } = await supabase.from("employees").delete().eq("id", id)

        if (deleteError) {
          throw deleteError
        }

        setDebug("Employee deleted successfully")
        router.refresh()
      } catch (err: any) {
        setError(err.message || "Failed to delete employee")
        setDebug(`Error: ${err.message}`)
        console.error("Error deleting employee:", err)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEditDialogOpen(true)
  }

  return (
    <Card>
      {error && <div className="bg-red-50 text-red-600 p-3 m-3 rounded-md text-sm">{error}</div>}

      {debug && (
        <div className="bg-blue-50 text-blue-600 p-3 m-3 rounded-md text-sm">
          <strong>Debug:</strong> {debug}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Daily Wage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.employee_id || "Not assigned"}</TableCell>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{formatCurrency(employee.daily_wage)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(employee.id)}
                    disabled={isDeleting}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No employees found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <EditEmployeeDialog
        employee={selectedEmployee}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          setDebug("Employee updated successfully")
          router.refresh()
        }}
      />
    </Card>
  )
}

