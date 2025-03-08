import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Define the employees
    const employees = [
      { name: "Monirul", daily_wage: 650 },
      { name: "Mansoor", daily_wage: 500 },
    ]

    // Add employees (or update if they already exist)
    const results = []

    for (const employee of employees) {
      // Check if employee already exists
      const { data: existingEmployees } = await supabase
        .from("employees")
        .select("id")
        .eq("name", employee.name)
        .maybeSingle()

      let employeeId

      if (existingEmployees) {
        // Update existing employee
        const { data, error } = await supabase
          .from("employees")
          .update({ daily_wage: employee.daily_wage })
          .eq("id", existingEmployees.id)
          .select()

        if (error) throw error
        employeeId = existingEmployees.id
        results.push({ action: "updated", employee: employee.name, id: employeeId })
      } else {
        // Insert new employee
        const { data, error } = await supabase.from("employees").insert(employee).select()

        if (error) throw error
        employeeId = data[0].id
        results.push({ action: "inserted", employee: employee.name, id: employeeId })
      }

      // Now add attendance records for this employee
      const attendanceRecords = []

      // March 1-4, 2025
      const dates = ["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-04"]

      for (const date of dates) {
        // Monirul is present all days
        if (employee.name === "Monirul") {
          attendanceRecords.push({
            employee_id: employeeId,
            date,
            status: "present",
          })
        }
        // Mansoor is present on 1st, 2nd, 3rd, absent on 4th
        else if (employee.name === "Mansoor") {
          attendanceRecords.push({
            employee_id: employeeId,
            date,
            status: date === "2025-03-04" ? "absent" : "present",
          })
        }
      }

      // Insert attendance records (upsert to handle duplicates)
      if (attendanceRecords.length > 0) {
        const { data, error } = await supabase.from("attendance").upsert(attendanceRecords, {
          onConflict: "employee_id,date",
          ignoreDuplicates: false,
        })

        if (error) throw error

        results.push({
          action: "attendance_added",
          employee: employee.name,
          count: attendanceRecords.length,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Employees and attendance data added successfully",
      results,
    })
  } catch (error: any) {
    console.error("Error adding data:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

