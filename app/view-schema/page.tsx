import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const revalidate = 0

export default async function ViewSchemaPage() {
  const supabase = createClient()

  // Get employees
  const { data: employees, error: employeesError } = await supabase.from("employees").select("*")

  // Get attendance records
  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("*")
    .order("date", { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Database Schema and Data</h1>
        <div className="space-x-2">
          <Link href="/api/update-schema" className="text-blue-600 hover:underline">
            Update Schema
          </Link>
          <Link href="/attendance" className="text-blue-600 hover:underline">
            Go to Attendance
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm overflow-auto">
            <pre>{`
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  daily_wage NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
            `}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm overflow-auto">
            <pre>{`
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT REFERENCES public.employees(employee_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'half_day')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);
            `}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees Data ({employees?.length || 0})</CardTitle>
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
          <CardTitle>Recent Attendance Records ({attendance?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceError ? (
            <div className="text-red-600">Error: {attendanceError.message}</div>
          ) : attendance?.length === 0 ? (
            <div className="text-yellow-600">No attendance records found</div>
          ) : (
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(attendance, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

