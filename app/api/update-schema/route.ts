import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    const results = []

    // Step 1: Add employee_id column to employees table
    try {
      await supabase.query(`
        ALTER TABLE public.employees 
        ADD COLUMN IF NOT EXISTS employee_id TEXT;
      `)
      results.push({ action: "add_employee_id_column", status: "success" })
    } catch (error: any) {
      results.push({ action: "add_employee_id_column", status: "error", message: error.message })
    }

    // Step 2: Update existing employees with custom IDs
    try {
      // Get existing employees
      const { data: employees } = await supabase.from("employees").select("id, name").order("name")

      if (employees && employees.length > 0) {
        // Update Monirul with SPX001
        const monirul = employees.find((e) => e.name === "Monirul")
        if (monirul) {
          await supabase.from("employees").update({ employee_id: "SPX001" }).eq("id", monirul.id)

          results.push({ action: "update_monirul", status: "success", id: monirul.id, employee_id: "SPX001" })
        }

        // Update Mansoor with SPX002
        const mansoor = employees.find((e) => e.name === "Mansoor")
        if (mansoor) {
          await supabase.from("employees").update({ employee_id: "SPX002" }).eq("id", mansoor.id)

          results.push({ action: "update_mansoor", status: "success", id: mansoor.id, employee_id: "SPX002" })
        }
      }
    } catch (error: any) {
      results.push({ action: "update_employees", status: "error", message: error.message })
    }

    // Step 3: Make employee_id unique in employees table
    try {
      await supabase.query(`
        ALTER TABLE public.employees 
        ADD CONSTRAINT IF NOT EXISTS employees_employee_id_unique UNIQUE (employee_id);
      `)
      results.push({ action: "add_unique_constraint", status: "success" })
    } catch (error: any) {
      results.push({ action: "add_unique_constraint", status: "error", message: error.message })
    }

    // Step 4: Add employee_id column to attendance table
    try {
      await supabase.query(`
        ALTER TABLE public.attendance 
        ADD COLUMN IF NOT EXISTS employee_id TEXT;
      `)
      results.push({ action: "add_attendance_employee_id", status: "success" })
    } catch (error: any) {
      results.push({ action: "add_attendance_employee_id", status: "error", message: error.message })
    }

    // Step 5: Update attendance records with the new employee_id
    try {
      // Get all employees with their employee_id
      const { data: employees } = await supabase
        .from("employees")
        .select("id, employee_id")
        .not("employee_id", "is", null)

      if (employees && employees.length > 0) {
        // Create a mapping of UUID to employee_id
        const employeeMap = new Map()
        employees.forEach((emp) => {
          employeeMap.set(emp.id, emp.employee_id)
        })

        // Get all attendance records
        const { data: attendanceRecords } = await supabase.from("attendance").select("id, employee_id")

        if (attendanceRecords && attendanceRecords.length > 0) {
          // Update each attendance record
          for (const record of attendanceRecords) {
            const newEmployeeId = employeeMap.get(record.employee_id)
            if (newEmployeeId) {
              await supabase.from("attendance").update({ employee_id: newEmployeeId }).eq("id", record.id)
            }
          }

          results.push({
            action: "update_attendance_records",
            status: "success",
            count: attendanceRecords.length,
          })
        }
      }
    } catch (error: any) {
      results.push({ action: "update_attendance_records", status: "error", message: error.message })
    }

    // Step 6: Update the foreign key constraint in attendance table
    try {
      // First drop the existing foreign key constraint
      await supabase.query(`
        ALTER TABLE public.attendance 
        DROP CONSTRAINT IF EXISTS attendance_employee_id_fkey;
      `)

      // Add a new foreign key constraint using the employee_id text field
      await supabase.query(`
        ALTER TABLE public.attendance 
        ADD CONSTRAINT attendance_employee_id_fkey 
        FOREIGN KEY (employee_id) 
        REFERENCES public.employees(employee_id) 
        ON DELETE CASCADE;
      `)

      results.push({ action: "update_foreign_key", status: "success" })
    } catch (error: any) {
      results.push({ action: "update_foreign_key", status: "error", message: error.message })
    }

    return NextResponse.json({
      success: true,
      message: "Database schema updated with custom employee IDs",
      results,
    })
  } catch (error: any) {
    console.error("Error updating schema:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

