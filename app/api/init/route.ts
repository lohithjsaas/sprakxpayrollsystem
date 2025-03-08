import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Enable extensions
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

    // Create RLS policies to allow access
    // For employees table
    await supabase.query(`
      BEGIN;
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow select for authenticated users" ON employees;
      DROP POLICY IF EXISTS "Allow insert for authenticated users" ON employees;
      DROP POLICY IF EXISTS "Allow update for authenticated users" ON employees;
      DROP POLICY IF EXISTS "Allow delete for authenticated users" ON employees;
      
      -- Enable RLS on employees
      ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Allow select for authenticated users" 
        ON employees FOR SELECT 
        USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow insert for authenticated users" 
        ON employees FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow update for authenticated users" 
        ON employees FOR UPDATE 
        USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow delete for authenticated users" 
        ON employees FOR DELETE 
        USING (auth.role() = 'authenticated');
      COMMIT;
    `)

    // For attendance table
    await supabase.query(`
      BEGIN;
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow select for authenticated users" ON attendance;
      DROP POLICY IF EXISTS "Allow insert for authenticated users" ON attendance;
      DROP POLICY IF EXISTS "Allow update for authenticated users" ON attendance;
      DROP POLICY IF EXISTS "Allow delete for authenticated users" ON attendance;
      
      -- Enable RLS on attendance
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Allow select for authenticated users" 
        ON attendance FOR SELECT 
        USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow insert for authenticated users" 
        ON attendance FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow update for authenticated users" 
        ON attendance FOR UPDATE 
        USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow delete for authenticated users" 
        ON attendance FOR DELETE 
        USING (auth.role() = 'authenticated');
      COMMIT;
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
      message: "Database initialized successfully with RLS policies",
      employeesCount: existingEmployees?.length || 0,
    })
  } catch (error: any) {
    console.error("Error initializing database:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

