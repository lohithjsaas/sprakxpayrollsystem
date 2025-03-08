import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Use service role key to ensure we have full permissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    const results = []

    // Step 1: Enable UUID extension
    try {
      await supabase.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `)
      results.push({ action: "enable_extension", status: "success", message: "UUID extension enabled" })
    } catch (error: any) {
      results.push({ action: "enable_extension", status: "error", message: error.message })
    }

    // Step 2: Create tables in public schema
    try {
      // Create employees table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.employees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          daily_wage NUMERIC NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      results.push({ action: "create_employees_table", status: "success", message: "Employees table created" })

      // Create attendance table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.attendance (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          status TEXT CHECK (status IN ('present', 'absent', 'half_day')) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(employee_id, date)
        );
      `)
      results.push({ action: "create_attendance_table", status: "success", message: "Attendance table created" })
    } catch (error: any) {
      results.push({ action: "create_tables", status: "error", message: error.message })
    }

    // Step 3: Set up RLS policies
    try {
      // Enable RLS on tables
      await supabase.query(`
        ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
      `)

      // Create policies for employees table
      await supabase.query(`
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow select for all" ON public.employees;
        DROP POLICY IF EXISTS "Allow insert for all" ON public.employees;
        DROP POLICY IF EXISTS "Allow update for all" ON public.employees;
        DROP POLICY IF EXISTS "Allow delete for all" ON public.employees;
        
        -- Create new policies
        CREATE POLICY "Allow select for all" ON public.employees FOR SELECT USING (true);
        CREATE POLICY "Allow insert for all" ON public.employees FOR INSERT WITH CHECK (true);
        CREATE POLICY "Allow update for all" ON public.employees FOR UPDATE USING (true);
        CREATE POLICY "Allow delete for all" ON public.employees FOR DELETE USING (true);
      `)

      // Create policies for attendance table
      await supabase.query(`
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow select for all" ON public.attendance;
        DROP POLICY IF EXISTS "Allow insert for all" ON public.attendance;
        DROP POLICY IF EXISTS "Allow update for all" ON public.attendance;
        DROP POLICY IF EXISTS "Allow delete for all" ON public.attendance;
        
        -- Create new policies
        CREATE POLICY "Allow select for all" ON public.attendance FOR SELECT USING (true);
        CREATE POLICY "Allow insert for all" ON public.attendance FOR INSERT WITH CHECK (true);
        CREATE POLICY "Allow update for all" ON public.attendance FOR UPDATE USING (true);
        CREATE POLICY "Allow delete for all" ON public.attendance FOR DELETE USING (true);
      `)

      results.push({ action: "setup_rls", status: "success", message: "RLS policies created" })
    } catch (error: any) {
      results.push({ action: "setup_rls", status: "error", message: error.message })
    }

    // Step 4: Seed employees data
    try {
      // Clear existing data first to avoid duplicates
      await supabase.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      // Insert employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .insert([
          { name: "Monirul", daily_wage: 650 },
          { name: "Mansoor", daily_wage: 500 },
        ])
        .select()

      if (employeesError) throw employeesError

      results.push({
        action: "seed_employees",
        status: "success",
        message: "Employees data seeded",
        data: employeesData,
      })

      // Get the employee IDs for attendance records
      const { data: employees } = await supabase.from("employees").select("id, name")

      if (!employees || employees.length < 2) {
        throw new Error("Failed to retrieve employee IDs")
      }

      const monirulId = employees.find((e) => e.name === "Monirul")?.id
      const mansoorId = employees.find((e) => e.name === "Mansoor")?.id

      if (!monirulId || !mansoorId) {
        throw new Error("Could not find employee IDs")
      }

      results.push({
        action: "get_employee_ids",
        status: "success",
        message: "Retrieved employee IDs",
        data: { monirulId, mansoorId },
      })

      // Step 5: Seed attendance data

      // Clear existing attendance data
      await supabase.from("attendance").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      // Create attendance records for March 1-4, 2025
      const attendanceRecords = [
        // Monirul - present all days
        { employee_id: monirulId, date: "2025-03-01", status: "present" },
        { employee_id: monirulId, date: "2025-03-02", status: "present" },
        { employee_id: monirulId, date: "2025-03-03", status: "present" },
        { employee_id: monirulId, date: "2025-03-04", status: "present" },

        // Mansoor - present on 1st, 2nd, 3rd, absent on 4th
        { employee_id: mansoorId, date: "2025-03-01", status: "present" },
        { employee_id: mansoorId, date: "2025-03-02", status: "present" },
        { employee_id: mansoorId, date: "2025-03-03", status: "present" },
        { employee_id: mansoorId, date: "2025-03-04", status: "absent" },
      ]

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .insert(attendanceRecords)
        .select()

      if (attendanceError) throw attendanceError

      results.push({
        action: "seed_attendance",
        status: "success",
        message: "Attendance data seeded",
        count: attendanceRecords.length,
      })
    } catch (error: any) {
      results.push({ action: "seed_data", status: "error", message: error.message })
    }

    return NextResponse.json({
      success: true,
      message: "Database setup and seeding completed",
      results,
    })
  } catch (error: any) {
    console.error("Error setting up database:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

