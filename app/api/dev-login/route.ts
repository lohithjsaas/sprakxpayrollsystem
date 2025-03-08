import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || "prabhuabhi.m@gmail.com"
    const password = searchParams.get("password") || "Admin@123"

    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // If email not confirmed, try to create and auto-confirm
      if (error.message.includes("Email not confirmed")) {
        // Use service role key to create admin client
        const adminSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        // Check if user exists
        const { data: userData } = await adminSupabase.auth.admin.getUserByEmail(email)

        if (userData?.user) {
          // Update user to confirm email
          await adminSupabase.auth.admin.updateUserById(userData.user.id, { email_confirm: true })

          // Try signing in again
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            throw signInError
          }

          return NextResponse.json({
            success: true,
            message: "Email confirmed and logged in successfully",
            user: signInData.user,
            redirectTo: "/dashboard",
          })
        } else {
          throw new Error("User not found")
        }
      } else {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: data.user,
      redirectTo: "/dashboard",
    })
  } catch (error: any) {
    console.error("Error logging in:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

