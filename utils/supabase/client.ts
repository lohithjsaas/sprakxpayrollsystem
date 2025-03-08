import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          employee_id: string
          name: string
          daily_wage: number
          created_at: string
        }
        Insert: {
          id?: string
          employee_id?: string
          name: string
          daily_wage: number
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          date: string
          status: "present" | "absent" | "half_day"
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          status: "present" | "absent" | "half_day"
          created_at?: string
        }
      }
      payroll: {
        Row: {
          id: string
          employee_id: string
          month: number
          year: number
          present_days: number
          half_days: number
          absent_days: number
          daily_wage: number
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          month: number
          year: number
          present_days: number
          half_days: number
          absent_days: number
          daily_wage: number
          total_amount: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}

