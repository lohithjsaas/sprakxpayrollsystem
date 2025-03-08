import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Check employees table
    const { data: employeesInfo, error: employeesError } = await supabase.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'employees'
      ORDER BY 
        ordinal_position;
    `)

    // Check attendance table
    const { data: attendanceInfo, error: attendanceError } = await supabase.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'attendance'
      ORDER BY 
        ordinal_position;
    `)

    // Check payroll table
    const { data: payrollInfo, error: payrollError } = await supabase.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'payroll'
      ORDER BY 
        ordinal_position;
    `)

    // Check foreign key constraints
    const { data: foreignKeys, error: foreignKeysError } = await supabase.query(`
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `)

    return NextResponse.json({
      success: true,
      employees: employeesInfo,
      attendance: attendanceInfo,
      payroll: payrollInfo,
      foreignKeys: foreignKeys,
      errors: {
        employees: employeesError,
        attendance: attendanceError,
        payroll: payrollError,
        foreignKeys: foreignKeysError,
      },
    })
  } catch (error: any) {
    console.error("Error checking relationships:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

