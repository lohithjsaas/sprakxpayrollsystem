import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month")
    const yearParam = searchParams.get("year")

    // Default to current month and year if not provided
    const now = new Date()
    const month = monthParam ? Number.parseInt(monthParam) : now.getMonth() + 1
    const year = yearParam ? Number.parseInt(yearParam) : now.getFullYear()

    // Get start and end date of the month
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`

    // Fetch all employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, employee_id, name, daily_wage")
      .not("employee_id", "is", null)

    if (employeesError) {
      throw new Error(`Error fetching employees: ${employeesError.message}`)
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No employees found with valid employee_id to calculate payroll",
      })
    }

    // Fetch attendance for the month
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)

    if (attendanceError) {
      throw new Error(`Error fetching attendance: ${attendanceError.message}`)
    }

    // Calculate payroll for each employee
    const results = []

    for (const employee of employees) {
      // Skip employees without employee_id
      if (!employee.employee_id) {
        results.push({
          employee: employee.name,
          status: "skipped",
          reason: "No employee_id assigned",
        })
        continue
      }

      // Filter attendance records for this employee
      const employeeAttendance =
        attendanceRecords?.filter((record: any) => record.employee_id === employee.employee_id) || []

      // Count days
      const presentDays = employeeAttendance.filter((record: any) => record.status === "present").length

      const halfDays = employeeAttendance.filter((record: any) => record.status === "half_day").length

      const absentDays = employeeAttendance.filter((record: any) => record.status === "absent").length

      // Calculate total amount
      const totalAmount = presentDays * employee.daily_wage + halfDays * employee.daily_wage * 0.5

      // Check if payroll record already exists for this employee, month, and year
      const { data: existingPayroll, error: payrollError } = await supabase
        .from("payroll")
        .select("id")
        .eq("employee_id", employee.employee_id)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle()

      if (payrollError) {
        results.push({
          employee: employee.name,
          status: "error",
          message: payrollError.message,
        })
        continue
      }

      // Payroll data to insert or update
      const payrollData = {
        employee_id: employee.employee_id,
        month,
        year,
        present_days: presentDays,
        half_days: halfDays,
        absent_days: absentDays,
        daily_wage: employee.daily_wage,
        total_amount: totalAmount,
      }

      if (existingPayroll) {
        // Update existing record
        const { error: updateError } = await supabase.from("payroll").update(payrollData).eq("id", existingPayroll.id)

        if (updateError) {
          results.push({
            employee: employee.name,
            status: "error",
            message: updateError.message,
          })
        } else {
          results.push({
            employee: employee.name,
            status: "updated",
            data: payrollData,
          })
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from("payroll").insert([payrollData])

        if (insertError) {
          results.push({
            employee: employee.name,
            status: "error",
            message: insertError.message,
          })
        } else {
          results.push({
            employee: employee.name,
            status: "inserted",
            data: payrollData,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payroll calculated for ${month}/${year}`,
      month,
      year,
      employeeCount: employees.length,
      results,
    })
  } catch (error: any) {
    console.error("Error calculating payroll:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

