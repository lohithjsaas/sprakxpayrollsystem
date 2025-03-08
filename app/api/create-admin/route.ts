import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Use direct Supabase client with service role key if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Admin credentials
    const adminEmail = "prabhuabhi.m@gmail.com"
    const adminPassword = "Admin@123"

    // First check if user exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users.some((user) => user.email === adminEmail)

    if (userExists) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
      })
    }

    // Create admin user with auto-confirmation
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: "admin" },
    })

    if (error) {
      throw error
    }

    // If admin API not available, fall back to regular signup
    if (!data.user) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: { role: "admin" },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      // Manually confirm the user if possible
      try {
        await supabase.auth.admin.updateUserById(signUpData.user!.id, { email_confirm: true })
      } catch (confirmError) {
        console.warn("Could not auto-confirm email, but user was created:", confirmError)
      }

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully. You may need to confirm the email manually in Supabase dashboard.",
        user: signUpData.user,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully with confirmed email",
      user: data.user,
    })
  } catch (error: any) {
    console.error("Error creating admin user:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

