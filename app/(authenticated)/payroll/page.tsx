import { createClient } from "@/utils/supabase/server"
import { PayrollReport } from "./components/payroll-report"

export default async function PayrollPage() {
  const supabase = createClient()

  const { data: employees } = await supabase.from("employees").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payroll Management</h1>
        <p className="text-muted-foreground">Calculate and view monthly payroll based on attendance</p>
      </div>

      <PayrollReport employees={employees || []} />
    </div>
  )
}

