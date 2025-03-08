"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface Employee {
  id: string
  employee_id: string
  name: string
  daily_wage: number
}

interface Attendance {
  id: string
  employee_id: string
  date: string
  status: "present" | "absent" | "half_day"
}

export function AttendanceTracker({ employees }: { employees: Employee[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceData, setAttendanceData] = useState<Record<string, "present" | "absent" | "half_day">>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Fetch attendance data whenever the selected date changes
  useEffect(() => {
    fetchAttendance()
  }, []) // Removed selectedDate from dependencies

  const fetchAttendance = async () => {
    setIsLoading(true)
    setError(null)
    setDebug(`Fetching attendance for date: ${selectedDate}`)

    try {
      const { data, error } = await supabase.from("attendance").select("*").eq("date", selectedDate)

      if (error) {
        throw error
      }

      setDebug(`Found ${data?.length || 0} attendance records for ${selectedDate}`)

      const attendanceMap: Record<string, "present" | "absent" | "half_day"> = {}

      if (data && data.length > 0) {
        data.forEach((record: Attendance) => {
          attendanceMap[record.employee_id] = record.status
        })
      }

      setAttendanceData(attendanceMap)
    } catch (err: any) {
      setError(`Error fetching attendance: ${err.message}`)
      console.error("Error fetching attendance:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendanceChange = (employeeId: string, status: "present" | "absent" | "half_day") => {
    setAttendanceData((prev) => ({
      ...prev,
      [employeeId]: status,
    }))
  }

  const saveAttendance = async () => {
    setIsSaving(true)
    setError(null)
    setDebug("Saving attendance data...")

    try {
      // Create an array to hold all the operations
      const operations = []

      for (const employeeId in attendanceData) {
        const status = attendanceData[employeeId]

        // Skip if employeeId is empty
        if (!employeeId) {
          setDebug(`Skipping empty employee ID`)
          continue
        }

        // Check if attendance record already exists
        try {
          const { data, error: fetchError } = await supabase
            .from("attendance")
            .select("id")
            .eq("employee_id", employeeId)
            .eq("date", selectedDate)
            .maybeSingle()

          if (fetchError) {
            throw new Error(`Error checking attendance: ${fetchError.message}`)
          }

          if (data) {
            // Update existing record
            setDebug(`Updating attendance for employee ${employeeId} to ${status}`)
            const { error: updateError } = await supabase.from("attendance").update({ status }).eq("id", data.id)

            if (updateError) {
              throw new Error(`Error updating attendance: ${updateError.message}`)
            }

            operations.push({ type: "update", employeeId, status })
          } else {
            // Insert new record
            setDebug(`Creating new attendance for employee ${employeeId} as ${status}`)
            const { error: insertError } = await supabase.from("attendance").insert([
              {
                employee_id: employeeId,
                date: selectedDate,
                status,
              },
            ])

            if (insertError) {
              throw new Error(`Error inserting attendance: ${insertError.message}`)
            }

            operations.push({ type: "insert", employeeId, status })
          }
        } catch (err: any) {
          setError(`Error processing employee ${employeeId}: ${err.message}`)
          console.error(`Error processing employee ${employeeId}:`, err)
        }
      }

      setDebug(`Successfully saved attendance: ${JSON.stringify(operations)}`)

      // Calculate payroll for the current month after saving attendance
      const currentDate = new Date(selectedDate)
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      try {
        const response = await fetch(`/api/calculate-payroll?month=${month}&year=${year}`)
        const data = await response.json()

        if (data.success) {
          setDebug(`Payroll automatically calculated for ${month}/${year}`)
        }
      } catch (err) {
        console.error("Error auto-calculating payroll:", err)
      }

      alert("Attendance saved successfully")

      // Refresh the page to show updated data
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to save attendance")
      console.error("Error saving attendance:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Filter out employees without employee_id
  const validEmployees = employees.filter((emp) => emp.employee_id)

  // Format date for display
  const formattedDate = selectedDate ? format(new Date(selectedDate), "EEEE, MMMM d, yyyy") : ""

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Daily Attendance</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="attendance-date" className="text-sm font-medium whitespace-nowrap">
                Date:
              </label>
              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded p-1 text-sm w-full"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchAttendance} className="w-full sm:w-auto">
              Refresh
            </Button>
          </div>
        </div>
        {formattedDate && <p className="text-muted-foreground text-sm mt-1">{formattedDate}</p>}
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

        {debug && (
          <div className="bg-blue-50 text-blue-600 p-3 rounded-md mb-4 text-sm">
            <strong>Debug:</strong> {debug}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center">Loading attendance data...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validEmployees.length > 0 ? (
                    validEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.employee_id}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <label className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`attendance-${employee.employee_id}`}
                                checked={attendanceData[employee.employee_id] === "present"}
                                onChange={() => handleAttendanceChange(employee.employee_id, "present")}
                                className="h-4 w-4"
                              />
                              <span>Present</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`attendance-${employee.employee_id}`}
                                checked={attendanceData[employee.employee_id] === "absent"}
                                onChange={() => handleAttendanceChange(employee.employee_id, "absent")}
                                className="h-4 w-4"
                              />
                              <span>Absent</span>
                            </label>
                            <label className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`attendance-${employee.employee_id}`}
                                checked={attendanceData[employee.employee_id] === "half_day"}
                                onChange={() => handleAttendanceChange(employee.employee_id, "half_day")}
                                className="h-4 w-4"
                              />
                              <span>Half Day</span>
                            </label>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No employees with valid IDs found. Please assign employee IDs first.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={saveAttendance} disabled={isSaving || validEmployees.length === 0}>
                {isSaving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

