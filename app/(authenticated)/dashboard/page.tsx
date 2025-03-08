import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

export const revalidate = 0 // Disable caching for this page

export default async function DashboardPage() {
  const supabase = createClient()

  // Get current month and year
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Fetch employees
  const { data: employees, error: employeesError } = await supabase.from("employees").select("*")

  // Fetch attendance for today
  const today = now.toISOString().split("T")[0]
  const { data: todayAttendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("*")
    .eq("date", today)

  // Fetch payroll for current month
  const { data: payrollData, error: payrollError } = await supabase
    .from("payroll")
    .select("*")
    .eq("month", month)
    .eq("year", year)

  // Calculate statistics
  const totalEmployees = employees?.length || 0
  const todayPresent = todayAttendance?.filter((record: any) => record.status === "present").length || 0

  // Calculate total payroll amount
  let totalPayroll = 0
  if (payrollData && payrollData.length > 0) {
    totalPayroll = payrollData.reduce((sum: number, record: any) => sum + record.total_amount, 0)
  }

  // Format today's date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of SparkX Detailing</p>
        <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
      </div>

      {(employeesError || attendanceError || payrollError) && (
        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Data Loading Error</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600">
            {employeesError && <p>Error loading employees: {employeesError.message}</p>}
            {attendanceError && <p>Error loading attendance: {attendanceError.message}</p>}
            {payrollError && <p>Error loading payroll: {payrollError.message}</p>}
            <p className="mt-2">
              <Link href="/api/fix-permissions" className="underline">
                Click here to fix database permissions
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmployees}</div>
          </CardContent>
          <CardFooter>
            <Link href="/employees" passHref className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Manage Employees
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {todayPresent} / {totalEmployees}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/attendance" passHref className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Mark Attendance
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Month Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPayroll)}</div>
          </CardContent>
          <CardFooter>
            <Link href="/payroll" passHref className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                View Payroll
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to SparkX Attendance & Payroll System</CardTitle>
          <CardDescription>Track employee attendance and manage payroll in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This dashboard provides an overview of your employees, their attendance, and payroll information. Use the
            navigation menu to access different features of the system.
          </p>
          <div className="mt-4 grid gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Mark daily attendance for your employees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Calculate payroll automatically based on attendance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Manage employee information and daily wages</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

