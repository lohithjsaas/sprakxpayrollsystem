import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Create payroll table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS public.payroll (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id TEXT REFERENCES public.employees(employee_id) ON DELETE CASCADE,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        present_days INTEGER NOT NULL DEFAULT 0,
        half_days INTEGER NOT NULL DEFAULT 0,
        absent_days INTEGER NOT NULL DEFAULT 0,
        daily_wage NUMERIC NOT NULL,
        total_amount NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(employee_id, month, year)
      );
    `)

    // Create function to update updated_at timestamp
    await supabase.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create trigger for updated_at
    await supabase.query(`
      DROP TRIGGER IF EXISTS update_payroll_updated_at ON public.payroll;
      CREATE TRIGGER update_payroll_updated_at
      BEFORE UPDATE ON public.payroll
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    // Set up RLS policies for payroll table
    await supabase.query(`
      BEGIN;
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow select for all users" ON public.payroll;
      DROP POLICY IF EXISTS "Allow insert for all users" ON public.payroll;
      DROP POLICY IF EXISTS "Allow update for all users" ON public.payroll;
      DROP POLICY IF EXISTS "Allow delete for all users" ON public.payroll;
      
      -- Enable RLS on payroll
      ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
      
      -- Create policies with permissive settings
      CREATE POLICY "Allow select for all users" 
        ON public.payroll FOR SELECT 
        USING (true);
        
      CREATE POLICY "Allow insert for all users" 
        ON public.payroll FOR INSERT 
        WITH CHECK (true);
        
      CREATE POLICY "Allow update for all users" 
        ON public.payroll FOR UPDATE 
        USING (true);
        
      CREATE POLICY "Allow delete for all users" 
        ON public.payroll FOR DELETE 
        USING (true);
      COMMIT;
    `)

    return NextResponse.json({
      success: true,
      message: "Payroll table created successfully",
    })
  } catch (error: any) {
    console.error("Error creating payroll table:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

