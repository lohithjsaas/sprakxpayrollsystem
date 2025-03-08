import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const revalidate = 0

export default async function ViewPayrollSchemaPage() {
  const supabase = createClient()

  // Get payroll records
  const { data: payroll, error: payrollError } = await supabase
    .from("payroll")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payroll Schema and Data</h1>
        <div className="space-x-2">
          <Link href="/api/create-payroll-table">
            <Button variant="outline" size="sm">
              Create Payroll Table
            </Button>
          </Link>
          <Link href="/api/calculate-payroll">
            <Button variant="outline" size="sm">
              Calculate Current Payroll
            </Button>
          </Link>
          <Link href="/payroll">
            <Button size="sm">Go to Payroll</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Table Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm overflow-auto">
            <pre>{`
CREATE TABLE public.payroll (
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
            `}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Data ({payroll?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollError ? (
            <div className="text-red-600">Error: {payrollError.message}</div>
          ) : payroll?.length === 0 ? (
            <div className="text-yellow-600">
              No payroll records found. Click "Calculate Current Payroll" to generate payroll data.
            </div>
          ) : (
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">{JSON.stringify(payroll, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

