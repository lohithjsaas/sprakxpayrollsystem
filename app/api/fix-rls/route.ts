import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Fix RLS policies for employees table
    await supabase.query(`
      BEGIN;
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow select for all users" ON employees;
      DROP POLICY IF EXISTS "Allow insert for all users" ON employees;
      DROP POLICY IF EXISTS "Allow update for all users" ON employees;
      DROP POLICY IF EXISTS "Allow delete for all users" ON employees;
      
      -- Enable RLS on employees
      ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
      
      -- Create policies with more permissive settings
      CREATE POLICY "Allow select for all users" 
        ON employees FOR SELECT 
        USING (true);
        
      CREATE POLICY "Allow insert for all users" 
        ON employees FOR INSERT 
        WITH CHECK (true);
        
      CREATE POLICY "Allow update for all users" 
        ON employees FOR UPDATE 
        USING (true);
        
      CREATE POLICY "Allow delete for all users" 
        ON employees FOR DELETE 
        USING (true);
      COMMIT;
    `)

    // Fix RLS policies for attendance table
    await supabase.query(`
      BEGIN;
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow select for all users" ON attendance;
      DROP POLICY IF EXISTS "Allow insert for all users" ON attendance;
      DROP POLICY IF EXISTS "Allow update for all users" ON attendance;
      DROP POLICY IF EXISTS "Allow delete for all users" ON attendance;
      
      -- Enable RLS on attendance
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
      
      -- Create policies with more permissive settings
      CREATE POLICY "Allow select for all users" 
        ON attendance FOR SELECT 
        USING (true);
        
      CREATE POLICY "Allow insert for all users" 
        ON attendance FOR INSERT 
        WITH CHECK (true);
        
      CREATE POLICY "Allow update for all users" 
        ON attendance FOR UPDATE 
        USING (true);
        
      CREATE POLICY "Allow delete for all users" 
        ON attendance FOR DELETE 
        USING (true);
      COMMIT;
    `)

    return NextResponse.json({
      success: true,
      message: "RLS policies updated successfully to be more permissive",
    })
  } catch (error: any) {
    console.error("Error updating RLS policies:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

