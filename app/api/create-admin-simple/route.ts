import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Admin credentials
    const adminEmail = "prabhuabhi.m@gmail.com"
    const adminPassword = "Admin@123"

    // Create admin user
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: { role: "admin" },
      },
    })

    if (error) {
      throw error
    }

    // Since we can't auto-confirm with anon key, provide instructions
    return NextResponse.json({
      success: true,
      message:
        "Admin user created. Please go to the Supabase dashboard Authentication section and confirm the user manually.",
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

