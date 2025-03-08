import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const initSupabase = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

  // Create tables if they don't exist
  const { error: employeesError } = await supabase.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      daily_wage NUMERIC NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  const { error: attendanceError } = await supabase.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT CHECK (status IN ('present', 'absent', 'half_day')) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(employee_id, date)
    )
  `)

  // Insert default employees if they don't exist
  const { data: existingEmployees } = await supabase.from("employees").select("*")

  if (!existingEmployees || existingEmployees.length === 0) {
    await supabase.from("employees").insert([
      { name: "Monirul", daily_wage: 650 },
      { name: "Mansoor", daily_wage: 550 },
    ])
  }

  // Create admin user if it doesn't exist
  const adminEmail = "prabhuabhi.m@gmail.com"
  const adminPassword = "Admin@123"

  // Check if admin user exists
  const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(adminEmail)

  if (userError || !user) {
    // Create admin user
    const { error: createUserError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm the email
    })

    if (createUserError) {
      console.error("Error creating admin user:", createUserError.message)
    } else {
      console.log("Admin user created successfully")
    }
  }

  if (employeesError || attendanceError) {
    console.error("Error setting up database:", employeesError || attendanceError)
  }
}

export default initSupabase

