import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Get all employees to ensure we have valid UUIDs
    const { data: employees, error: employeesError } = await supabase.from("employees").select("id, name")

    if (employeesError) {
      throw new Error(`Error fetching employees: ${employeesError.message}`)
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No employees found",
      })
    }

    // Get all attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase.from("attendance").select("*")

    if (attendanceError) {
      throw new Error(`Error fetching attendance: ${attendanceError.message}`)
    }

    if (!attendanceRecords) {
      return NextResponse.json({
        success: true,
        message: "No attendance records found to fix",
        employeeCount: employees.length,
      })
    }

    // Create a map of valid employee IDs
    const validEmployeeIds = new Map()
    employees.forEach((employee) => {
      validEmployeeIds.set(employee.id, employee.name)
    })

    // Check for invalid employee IDs in attendance records
    const invalidRecords = attendanceRecords.filter((record) => !validEmployeeIds.has(record.employee_id))

    if (invalidRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No invalid attendance records found",
        employeeCount: employees.length,
        attendanceCount: attendanceRecords.length,
      })
    }

    // Delete invalid records
    const results = []

    for (const record of invalidRecords) {
      const { error: deleteError } = await supabase.from("attendance").delete().eq("id", record.id)

      if (deleteError) {
        results.push({
          record,
          status: "error",
          message: deleteError.message,
        })
      } else {
        results.push({
          record,
          status: "deleted",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${invalidRecords.length} invalid attendance records`,
      employeeCount: employees.length,
      attendanceCount: attendanceRecords.length,
      invalidCount: invalidRecords.length,
      results,
    })
  } catch (error: any) {
    console.error("Error fixing attendance IDs:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

