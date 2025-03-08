import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AuthForm } from "@/components/auth-form"
import Link from "next/link"

export default async function Home() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <AuthForm />
        <div className="text-center text-sm text-gray-500 space-y-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Setup Instructions</h3>
            <ol className="text-left text-blue-700 space-y-2">
              <li>
                1. First visit{" "}
                <Link href="/setup" className="underline">
                  the setup page
                </Link>{" "}
                to set up database tables and seed data
              </li>
              <li>
                2. Then visit{" "}
                <Link href="/api/create-payroll-table" className="underline">
                  /api/create-payroll-table
                </Link>{" "}
                to create the payroll table
              </li>
              <li>
                3. Visit{" "}
                <Link href="/api/create-admin" className="underline">
                  /api/create-admin
                </Link>{" "}
                to create the admin user
              </li>
              <li>
                4. If you get email confirmation errors, visit{" "}
                <Link href="/api/dev-login" className="underline">
                  /api/dev-login
                </Link>{" "}
                to bypass confirmation
              </li>
            </ol>
          </div>
          <p>Admin Email: prabhuabhi.m@gmail.com</p>
          <p>Password: Admin@123</p>
        </div>
      </div>
    </div>
  )
}

