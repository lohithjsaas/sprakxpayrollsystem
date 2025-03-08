import { createClient } from "@/utils/supabase/server"
import { EmployeeList } from "./components/employee-list"
import { AddEmployeeForm } from "./components/add-employee-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const revalidate = 0 // Disable caching for this page

export default async function EmployeesPage() {
  const supabase = createClient()

  const { data: employees, error } = await supabase.from("employees").select("*").order("name")

  // Count employees without employee_id
  const employeesWithoutId = employees?.filter((emp) => !emp.employee_id) || []
  const missingIdCount = employeesWithoutId.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage employee information and daily wages</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {missingIdCount > 0 && (
            <Link href="/api/assign-employee-ids">
              <Button variant="outline" size="sm">
                Assign IDs ({missingIdCount} missing)
              </Button>
            </Link>
          )}
          <AddEmployeeForm />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p className="font-medium">Error loading employees</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      <EmployeeList employees={employees || []} />
    </div>
  )
}

