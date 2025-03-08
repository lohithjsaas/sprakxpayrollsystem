import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Fetch all employees
    const { data: employees, error: employeesError } = await supabase.from("employees").select("id, name")

    if (employeesError) {
      throw new Error(`Error fetching employees: ${employeesError.message}`)
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No employees found to sync attendance",
      })
    }

    // Fetch existing attendance for the date
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("date", date)

    if (attendanceError) {
      throw new Error(`Error fetching attendance: ${attendanceError.message}`)
    }

    // Create a map of employee IDs to attendance records
    const attendanceMap = new Map()
    if (existingAttendance) {
      existingAttendance.forEach((record: any) => {
        attendanceMap.set(record.employee_id, record)
      })
    }

    // Create or update attendance records for each employee
    const results = []

    for (const employee of employees) {
      if (!attendanceMap.has(employee.id)) {
        // Create a new attendance record with default status 'absent'
        const { data, error } = await supabase
          .from("attendance")
          .insert({
            employee_id: employee.id,
            date,
            status: "absent",
          })
          .select()

        if (error) {
          results.push({
            employee: employee.name,
            status: "error",
            message: error.message,
          })
        } else {
          results.push({
            employee: employee.name,
            status: "created",
            record: data[0],
          })
        }
      } else {
        results.push({
          employee: employee.name,
          status: "exists",
          record: attendanceMap.get(employee.id),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attendance synced for ${date}`,
      date,
      employeeCount: employees.length,
      results,
    })
  } catch (error: any) {
    console.error("Error syncing attendance:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

