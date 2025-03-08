import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const revalidate = 0

export default async function DebugAttendancePage() {
  const supabase = createClient()

  // Get employees
  const { data: employees, error: employeesError } = await supabase.from("employees").select("*")

  // Get attendance for today
  const today = new Date().toISOString().split("T")[0]
  const { data: todayAttendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("*")
    .eq("date", today)

  // Get all attendance records
  const { data: allAttendance, error: allAttendanceError } = await supabase
    .from("attendance")
    .select("*")
    .order("date", { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Debug Page</h1>
        <div className="space-x-2">
          <Link href="/attendance" className="text-blue-600 hover:underline">
            Back to Attendance
          </Link>
          <Link href="/api/sync-attendance" className="text-blue-600 hover:underline">
            Sync Attendance
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({employees?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {employeesError ? (
            <div className="text-red-600">Error: {employeesError.message}</div>
          ) : employees?.length === 0 ? (
            <div className="text-yellow-600">No employees found</div>
          ) : (
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(employees, null, 2)}</pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance ({todayAttendance?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceError ? (
            <div className="text-red-600">Error: {attendanceError.message}</div>
          ) : todayAttendance?.length === 0 ? (
            <div className="text-yellow-600">No attendance records for today</div>
          ) : (
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
              {JSON.stringify(todayAttendance, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records ({allAttendance?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {allAttendanceError ? (
            <div className="text-red-600">Error: {allAttendanceError.message}</div>
          ) : allAttendance?.length === 0 ? (
            <div className="text-yellow-600">No attendance records found</div>
          ) : (
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
              {JSON.stringify(allAttendance, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

