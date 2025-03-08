"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Employee {
  id: string
  employee_id: string
  name: string
  daily_wage: number
}

interface PayrollRecord {
  id: string
  employee_id: string
  month: number
  year: number
  present_days: number
  half_days: number
  absent_days: number
  daily_wage: number
  total_amount: number
}

export function PayrollReport({ employees }: { employees: Employee[] }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const supabase = createClient()

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Load payroll data when month or year changes
  useEffect(() => {
    fetchPayrollData()
  }, [month, year]) // Updated dependency

  const fetchPayrollData = async () => {
    setIsLoading(true)
    setError(null)
    setDebug(`Fetching payroll data for ${month}/${year}`)

    try {
      const { data, error } = await supabase.from("payroll").select("*").eq("month", month).eq("year", year)

      if (error) {
        throw error
      }

      setDebug(`Found ${data?.length || 0} payroll records for ${month}/${year}`)
      setPayrollData(data || [])
    } catch (err: any) {
      setError(`Error fetching payroll data: ${err.message}`)
      console.error("Error fetching payroll data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePayroll = async () => {
    setIsCalculating(true)
    setError(null)
    setDebug(`Calculating payroll for ${month}/${year}`)

    try {
      const response = await fetch(`/api/calculate-payroll?month=${month}&year=${year}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to calculate payroll")
      }

      setDebug(`Payroll calculation completed: ${data.message}`)

      // Refresh payroll data
      fetchPayrollData()
    } catch (err: any) {
      setError(`Error calculating payroll: ${err.message}`)
      console.error("Error calculating payroll:", err)
    } finally {
      setIsCalculating(false)
    }
  }

  // Create a map of employee_id to name for display
  const employeeMap = new Map()
  employees.forEach((emp) => {
    if (emp.employee_id) {
      employeeMap.set(emp.employee_id, emp.name)
    }
  })

  const totalPayout = payrollData.reduce((total, record) => total + record.total_amount, 0)

  // Format month and year for display
  const formattedMonthYear = `${months.find((m) => m.value === month)?.label} ${year}`

  // Function to handle printing
  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="print:shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>
            Monthly Payroll
            <span className="block text-sm font-normal text-muted-foreground mt-1">{formattedMonthYear}</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="payroll-month" className="text-sm font-medium whitespace-nowrap">
                  Month:
                </label>
                <select
                  id="payroll-month"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="border rounded p-1 text-sm w-full sm:w-auto"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="payroll-year" className="text-sm font-medium whitespace-nowrap">
                  Year:
                </label>
                <select
                  id="payroll-year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="border rounded p-1 text-sm w-full sm:w-auto"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              onClick={calculatePayroll}
              disabled={isCalculating}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto print:hidden"
            >
              {isCalculating ? "Calculating..." : "Calculate Payroll"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm print:hidden">{error}</div>}

        {debug && (
          <div className="bg-blue-50 text-blue-600 p-3 rounded-md mb-4 text-sm print:hidden">
            <strong>Debug:</strong> {debug}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center print:hidden">Loading payroll data...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Daily Wage</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Half Days</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employee_id}</TableCell>
                      <TableCell>{employeeMap.get(record.employee_id) || "Unknown"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(record.daily_wage)}</TableCell>
                      <TableCell className="text-center">{record.present_days}</TableCell>
                      <TableCell className="text-center">{record.half_days}</TableCell>
                      <TableCell className="text-center">{record.absent_days}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(record.total_amount)}</TableCell>
                    </TableRow>
                  ))}

                  {payrollData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No payroll data available for this month. Click "Calculate Payroll" to generate.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {payrollData.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-4">
                <div className="font-semibold">
                  Total Payout: <span className="text-lg">{formatCurrency(totalPayout)}</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="print:hidden">
                    Print Report
                  </Button>
                  <Button onClick={fetchPayrollData} variant="outline" className="print:hidden">
                    Refresh Data
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

