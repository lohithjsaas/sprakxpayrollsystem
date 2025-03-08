import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Get employees without employee_id
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name")
      .is("employee_id", null)

    if (employeesError) {
      throw new Error(`Error fetching employees: ${employeesError.message}`)
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No employees found without employee_id",
        count: 0,
      })
    }

    // Get the highest current employee_id
    const { data: highestId, error: highestIdError } = await supabase
      .from("employees")
      .select("employee_id")
      .not("employee_id", "is", null)
      .order("employee_id", { ascending: false })
      .limit(1)

    if (highestIdError) {
      throw new Error(`Error fetching highest employee_id: ${highestIdError.message}`)
    }

    // Determine the starting ID number
    let nextId = 1
    if (highestId && highestId.length > 0 && highestId[0].employee_id) {
      const match = highestId[0].employee_id.match(/SPX(\d+)/)
      if (match && match[1]) {
        nextId = Number.parseInt(match[1], 10) + 1
      }
    }

    // Assign employee_ids
    const results = []
    for (const employee of employees) {
      const employeeId = `SPX${nextId.toString().padStart(3, "0")}`

      const { data, error } = await supabase
        .from("employees")
        .update({ employee_id: employeeId })
        .eq("id", employee.id)
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
          status: "updated",
          employee_id: employeeId,
        })
      }

      nextId++
    }

    return NextResponse.json({
      success: true,
      message: `Assigned employee_ids to ${employees.length} employees`,
      count: employees.length,
      results,
    })
  } catch (error: any) {
    console.error("Error assigning employee IDs:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

