import { createClient } from "@/utils/supabase/server"
import { AttendanceTracker } from "./components/attendance-tracker"
import { SyncAttendanceButton } from "./components/sync-button"
import { FixAttendanceButton } from "./components/fix-button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

// Disable caching for this page
export const revalidate = 0

export default async function AttendancePage() {
  const supabase = createClient()

  const { data: employees, error } = await supabase.from("employees").select("*").order("name")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Tracker</h1>
          <p className="text-muted-foreground">Record daily attendance for employees</p>
        </div>
        <div className="w-full md:w-auto grid grid-cols-2 gap-2">
          <SyncAttendanceButton />
          <FixAttendanceButton />
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 p-4">
          <h3 className="text-red-700 font-medium">Error loading employees</h3>
          <p className="text-red-600 text-sm">{error.message}</p>
          <p className="mt-2 text-sm">
            <Link href="/api/fix-permissions" className="text-blue-600 underline">
              Click here to fix database permissions
            </Link>
          </p>
        </Card>
      )}

      {employees && employees.length === 0 && (
        <Card className="bg-yellow-50 p-4">
          <h3 className="text-yellow-700 font-medium">No employees found</h3>
          <p className="text-yellow-600 text-sm">You need to add employees before you can track attendance.</p>
          <p className="mt-2 text-sm">
            <Link href="/employees" className="text-blue-600 underline">
              Go to Employees page to add employees
            </Link>
          </p>
        </Card>
      )}

      <AttendanceTracker employees={employees || []} />

      <div className="text-center text-sm text-gray-500">
        <p>
          Having issues? Visit the{" "}
          <Link href="/debug-attendance" className="text-blue-600 underline">
            attendance debug page
          </Link>{" "}
          for more information.
        </p>
      </div>
    </div>
  )
}

