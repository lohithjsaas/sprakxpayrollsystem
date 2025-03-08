import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Enable UUID extension if not already enabled
    await supabase.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `)

    // Create tables if they don't exist
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        daily_wage NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await supabase.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status TEXT CHECK (status IN ('present', 'absent', 'half_day')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(employee_id, date)
      );
    `)

    // Disable RLS temporarily to ensure we can access the data
    await supabase.query(`
      ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
      ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
    `)

    // Re-enable RLS with public policies
    await supabase.query(`
      ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    `)

    // Drop existing policies
    await supabase.query(`
      DROP POLICY IF EXISTS "Allow select for all" ON employees;
      DROP POLICY IF EXISTS "Allow insert for all" ON employees;
      DROP POLICY IF EXISTS "Allow update for all" ON employees;
      DROP POLICY IF EXISTS "Allow delete for all" ON employees;
      
      DROP POLICY IF EXISTS "Allow select for all" ON attendance;
      DROP POLICY IF EXISTS "Allow insert for all" ON attendance;
      DROP POLICY IF EXISTS "Allow update for all" ON attendance;
      DROP POLICY IF EXISTS "Allow delete for all" ON attendance;
    `)

    // Create new permissive policies
    await supabase.query(`
      CREATE POLICY "Allow select for all" ON employees FOR SELECT USING (true);
      CREATE POLICY "Allow insert for all" ON employees FOR INSERT WITH CHECK (true);
      CREATE POLICY "Allow update for all" ON employees FOR UPDATE USING (true);
      CREATE POLICY "Allow delete for all" ON employees FOR DELETE USING (true);
      
      CREATE POLICY "Allow select for all" ON attendance FOR SELECT USING (true);
      CREATE POLICY "Allow insert for all" ON attendance FOR INSERT WITH CHECK (true);
      CREATE POLICY "Allow update for all" ON attendance FOR UPDATE USING (true);
      CREATE POLICY "Allow delete for all" ON attendance FOR DELETE USING (true);
    `)

    // Insert default employees if they don't exist
    const { data: existingEmployees } = await supabase.from("employees").select("*")

    if (!existingEmployees || existingEmployees.length === 0) {
      await supabase.from("employees").insert([
        { name: "Monirul", daily_wage: 650 },
        { name: "Mansoor", daily_wage: 550 },
      ])
    }

    return NextResponse.json({
      success: true,
      message: "Database permissions fixed successfully",
      employeesCount: existingEmployees?.length || 0,
    })
  } catch (error: any) {
    console.error("Error fixing permissions:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

